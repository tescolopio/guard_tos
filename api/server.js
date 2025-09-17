/**
 * @file api/server.js
 * @description Minimal Express API server for Terms Guardian database operations
 * @version 1.0.0
 */

const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3001;

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5434,
  database: process.env.DB_NAME || "terms_guardian",
  user: process.env.DB_USER || "tg_user",
  password: process.env.DB_PASSWORD || "tg_password_dev",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "chrome-extension://*"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get document analysis by hash
app.get("/api/v1/document/:hash", async (req, res) => {
  const { hash } = req.params;

  try {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT d.*, ar.* 
         FROM documents d 
         JOIN analysis_results ar ON d.id = ar.document_id 
         WHERE d.content_hash = $1 
         ORDER BY ar.created_at DESC 
         LIMIT 1`,
        [hash],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Document not found",
          hash: hash.substring(0, 8) + "...",
        });
      }

      const row = result.rows[0];
      const analysis = {
        hash: row.content_hash,
        url: row.url,
        metadata: row.metadata,
        analysis: row.analysis_data,
        timestamp: row.created_at,
        version: row.analysis_version,
      };

      res.json(analysis);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({
      error: "Database error",
      message: error.message,
    });
  }
});

// Store new document analysis
app.post("/api/v1/document", async (req, res) => {
  const { hash, metadata, analysis, timestamp } = req.body;

  if (!hash || !metadata || !analysis) {
    return res.status(400).json({
      error: "Missing required fields",
      required: ["hash", "metadata", "analysis"],
    });
  }

  try {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Insert or update document
      const docResult = await client.query(
        `INSERT INTO documents (content_hash, url, metadata, word_count, char_count) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (content_hash) 
         DO UPDATE SET 
           url = EXCLUDED.url,
           metadata = EXCLUDED.metadata,
           word_count = EXCLUDED.word_count,
           char_count = EXCLUDED.char_count,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [
          hash,
          metadata.url || "",
          metadata,
          metadata.wordCount || 0,
          metadata.charCount || 0,
        ],
      );

      const documentId = docResult.rows[0].id;

      // Insert analysis results
      await client.query(
        `INSERT INTO analysis_results (document_id, analysis_data, analysis_version, processing_time_ms) 
         VALUES ($1, $2, $3, $4)`,
        [documentId, analysis, "1.0.0", analysis.processingTime || 0],
      );

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        documentId,
        hash: hash.substring(0, 8) + "...",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({
      error: "Database error",
      message: error.message,
    });
  }
});

// Get database statistics
app.get("/api/v1/stats", async (req, res) => {
  try {
    const client = await pool.connect();

    try {
      const [docsResult, analysisResult] = await Promise.all([
        client.query("SELECT COUNT(*) as total_documents FROM documents"),
        client.query("SELECT COUNT(*) as total_analyses FROM analysis_results"),
      ]);

      const stats = {
        totalDocuments: parseInt(docsResult.rows[0].total_documents),
        totalAnalyses: parseInt(analysisResult.rows[0].total_analyses),
        timestamp: new Date().toISOString(),
      };

      res.json(stats);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database stats error:", error);
    res.status(500).json({
      error: "Database error",
      message: error.message,
    });
  }
});

// Clear all data (for testing only)
app.delete("/api/v1/clear", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      error: "Clear operation not allowed in production",
    });
  }

  try {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM analysis_results");
      await client.query("DELETE FROM documents");
      await client.query("COMMIT");

      res.json({
        success: true,
        message: "All data cleared",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database clear error:", error);
    res.status(500).json({
      error: "Database error",
      message: error.message,
    });
  }
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
  });
});

// Start server
app.listen(port, () => {
  console.log(`Terms Guardian API server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  pool.end(() => {
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  pool.end(() => {
    process.exit(0);
  });
});
