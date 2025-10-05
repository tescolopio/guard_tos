#!/usr/bin/env node
/**
 * Spin up a static file server for mock ToS pages and run the analysis pipeline
 * against the served URLs. Useful for smoke testing the full ingestion flow that
 * starts from an HTTP request rather than direct file reads.
 */
const fs = require("fs");
const path = require("path");
const http = require("http");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",


/**/**

 * Spin up a static file server for mock ToS pages and run the analysis pipeline * Spin up a static file server for mock ToS pages and run the analysis pipeline

 * against the served URLs. Useful for smoke testing the full ingestion flow that * against the served URLs. Useful for smoke testing the full ingestion flow that

 * starts from an HTTP request rather than direct file reads. * starts from an HTTP request rather than file reads.

 */ */

const fs = require("fs");const fs = require("fs");

const path = require("path");const path = require("path");

const http = require("http");const http = require("http");



const mimeTypes = {const mimeTypes = {

  ".html": "text/html; charset=utf-8",  ".html": "text/html; charset=utf-8",

  ".htm": "text/html; charset=utf-8",  ".htm": "text/html; charset=utf-8",

  ".txt": "text/plain; charset=utf-8",  ".txt": "text/plain; charset=utf-8",

  ".json": "application/json; charset=utf-8",  ".json": "application/json; charset=utf-8",

  ".js": "text/javascript; charset=utf-8",  ".js": "text/javascript; charset=utf-8",

  ".css": "text/css; charset=utf-8",  ".css": "text/css; charset=utf-8",

};};



const DEFAULT_HOST = "127.0.0.1";const DEFAULT_HOST = "127.0.0.1";

const DEFAULT_PORT = 0; // let the OS chooseconst DEFAULT_PORT = 0; // let the OS choose



const {const {

  collectMockPageFiles,  collectMockPageFiles,

  DEFAULT_ROOT: DEFAULT_MOCK_ROOT,  DEFAULT_ROOT: DEFAULT_MOCK_ROOT,

} = require("./analyze_mock_pages");} = require("./analyze_mock_pages");

const { analyzeHtml } = require("./run_analysis_fixture");const { analyzeHtml } = require("./run_analysis_fixture");



function parseArgs(argv) {function parseArgs(argv) {

  const options = {  const options = {

    dir: DEFAULT_MOCK_ROOT,    dir: DEFAULT_MOCK_ROOT,

    host: DEFAULT_HOST,    port: DEFAULT_PORT,

    port: DEFAULT_PORT,    host: DEFAULT_HOST,

    limit: Infinity,    limit: Infinity,

    json: false,    json: false,

    verbose: false,  };

  };

  argv.forEach((arg) => {

  argv.forEach((arg) => {    if (arg.startsWith("--")) {

    if (arg === "--json") {      if (arg === "--json") {

      options.json = true;        options.json = true;

    } else if (arg === "--verbose") {      } else if (arg.startsWith("--port=")) {

      options.verbose = true;        const value = Number.parseInt(arg.split("=")[1], 10);

    } else if (arg.startsWith("--host=")) {        if (!Number.isNaN(value) && value >= 0) {

      options.host = arg.split("=")[1] || DEFAULT_HOST;          options.port = value;

    } else if (arg.startsWith("--port=")) {        }

      const value = Number.parseInt(arg.split("=")[1], 10);      } else if (arg.startsWith("--host=")) {

      if (!Number.isNaN(value) && value >= 0) {        options.host = arg.split("=")[1] || DEFAULT_HOST;

        options.port = value;      } else if (arg.startsWith("--limit=")) {

      }        const value = Number.parseInt(arg.split("=")[1], 10);

    } else if (arg.startsWith("--limit=")) {        if (!Number.isNaN(value) && value > 0) {

      const value = Number.parseInt(arg.split("=")[1], 10);          options.limit = value;

      if (!Number.isNaN(value) && value > 0) {        }

        options.limit = value;      }

      }    } else if (!options.dir || options.dir === DEFAULT_MOCK_ROOT) {

    } else if (!arg.startsWith("--")) {      options.dir = path.resolve(arg);

      options.dir = path.resolve(arg);    }

    }  });

  });

  return options;

  return options;}

}

function startStaticServer(rootDir, { host, port }) {

function startStaticServer(rootDir, { host, port, verbose } = {}) {  const absoluteRoot = path.resolve(rootDir);

  const absoluteRoot = path.resolve(rootDir);

  if (!fs.existsSync(absoluteRoot) || !fs.statSync(absoluteRoot).isDirectory()) {  if (!fs.existsSync(absoluteRoot) || !fs.statSync(absoluteRoot).isDirectory()) {

    throw new Error(`Directory not found: ${absoluteRoot}`);    throw new Error(`Directory not found: ${absoluteRoot}`);

  }  }



  const server = http.createServer((req, res) => {  const server = http.createServer((req, res) => {

    try {    try {

      const requestUrl = new URL(req.url, "http://localhost");      const requestUrl = new URL(req.url, `http://${host}:${port || 80}`);

      const decodedPath = decodeURIComponent(requestUrl.pathname || "/");      const decodedPath = decodeURIComponent(requestUrl.pathname || "/");

      const trimmedPath = decodedPath.replace(/^\/+/, "");      const trimmedPath = decodedPath.replace(/^\/+/, "");

      const resolvedPath = path.resolve(absoluteRoot, trimmedPath);      const safePath = path.resolve(absoluteRoot, trimmedPath);



      if (!resolvedPath.startsWith(absoluteRoot)) {      if (!safePath.startsWith(absoluteRoot)) {

        res.statusCode = 403;        res.statusCode = 403;

        res.end("Forbidden");        res.end("Forbidden");

        return;        return;

      }      }



      let targetPath = resolvedPath;      let targetPath = safePath;

      if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {      if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {

        targetPath = path.join(targetPath, "index.html");        targetPath = path.join(targetPath, "index.html");

      }      }



      if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {      if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {

        res.statusCode = 404;        res.statusCode = 404;

        res.end("Not found");        res.end("Not found");

        return;        return;

      }      }



      if (verbose) {      console.log(`[static] ${req.method} ${decodedPath} -> ${targetPath}`);

        console.log(`[static] ${req.method} ${decodedPath || "/"} -> ${targetPath}`);      const ext = path.extname(targetPath).toLowerCase();

      }      res.setHeader(

        "Content-Type",

      const ext = path.extname(targetPath).toLowerCase();        mimeTypes[ext] || "application/octet-stream",

      res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");      );

      const stream = fs.createReadStream(targetPath);      const stream = fs.createReadStream(targetPath);

      stream.on("error", (err) => {      stream.on("error", (streamError) => {

        console.error(`Static server read error for ${targetPath}:`, err.message);        console.error(`Static server read error for ${targetPath}:`, streamError);

        if (!res.headersSent) {        if (!res.headersSent) {

          res.statusCode = 500;          res.statusCode = 500;

        }        }

        res.end("Server error");        res.end("Server error");

      });      });

      stream.pipe(res);      stream.pipe(res);

    } catch (error) {    } catch (error) {

      console.error("Static server failure:", error.message);      console.error("Static server failure:", error);

      res.statusCode = 500;      res.statusCode = 500;

      res.end("Server error");      res.end("Server error");

    }    }

  });  });



  server.on("clientError", (err, socket) => {  return new Promise((resolve, reject) => {

    console.error("Static server client error:", err.message);    server.on("error", reject);

    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");    server.listen(port, host, () => {

  });      const address = server.address();

      resolve({

  return new Promise((resolve, reject) => {        server,

    server.on("error", reject);        port: address.port,

    server.listen(port, host, () => {        host: address.address,

      const address = server.address();        close: () =>

      resolve({          new Promise((closeResolve, closeReject) => {

        server,            server.close((err) => (err ? closeReject(err) : closeResolve()));

        host: address.address === "::" ? host : address.address,          }),

        port: address.port,      });

        close: () =>    });

          new Promise((closeResolve, closeReject) => {  });

            server.close((err) => (err ? closeReject(err) : closeResolve()));}

          }),

      });async function serveAndAnalyze({ dir, port, host, limit, json } = {}) {

    });  const files = collectMockPageFiles(dir);

  });  if (files.length === 0) {

}    return {

      analyzed: 0,

async function serveAndAnalyze({      skipped: 0,

  dir = DEFAULT_MOCK_ROOT,      results: [],

  host = DEFAULT_HOST,      errors: [],

  port = DEFAULT_PORT,      server: null,

  limit = Infinity,    };

  json = false,  }

  verbose = false,

} = {}) {  const serverHandle = await startStaticServer(dir, { port, host });

  const files = collectMockPageFiles(dir);  const baseUrl = `http://${serverHandle.host}:${serverHandle.port}`;

  if (files.length === 0) {

    return {  const selected = files.slice(0, limit);

      analyzed: 0,  const results = [];

      skipped: 0,  const errors = [];

      results: [],  const fallbacks = [];

      errors: [],

      fallbacks: [],  try {

      server: null,    for (const file of selected) {

      stats: {},      const relativePath = path

    };        .relative(dir, file)

  }        .split(path.sep)

        .map((segment) => encodeURIComponent(segment))

  const serverHandle = await startStaticServer(dir, { host, port, verbose });        .join("/");

  const baseUrl = `http://${serverHandle.host}:${serverHandle.port}`;      const targetUrl = `${baseUrl}/${relativePath}`;



  const selected = files.slice(0, limit);      try {

  const results = [];        const response = await fetch(targetUrl);

  const errors = [];        if (!response.ok) {

  const fallbacks = [];          throw new Error(`HTTP ${response.status}`);

        }

  try {        const html = await response.text();

    for (const file of selected) {        const report = await analyzeHtml(html, { source: targetUrl });

      const relativePath = path        results.push({ file, url: targetUrl, report });

        .relative(dir, file)

        .split(path.sep)        if (!json) {

        .map((segment) => encodeURIComponent(segment))          const rel = path.relative(process.cwd(), file);

        .join("/");          console.log(`\n${rel}`);

      const targetUrl = `${baseUrl}/${relativePath}`;          console.log("-".repeat(rel.length));

          const grade =

      let html = null;            (report.userRightsIndex && report.userRightsIndex.grade) || "N/A";

      let usedFallback = false;          const readability =

      let fetchError = null;            (report.readability && report.readability.grade) || "N/A";

          const rights = (report.rights && report.rights.grade) || "N/A";

      try {          console.log(

        const response = await fetch(targetUrl);            `URI: ${grade} | Readability: ${readability} | Rights: ${rights}`,

        if (!response.ok) {          );

          throw new Error(`HTTP ${response.status}`);          if (report.riskLevel) {

        }            console.log(`Risk Level: ${report.riskLevel}`);

        html = await response.text();          }

      } catch (error) {          if (Array.isArray(report.keyFindings) && report.keyFindings.length) {

        fetchError = error;            console.log(

        const isConnectionReset = error.cause && error.cause.code === "ECONNRESET";              `Key Findings: ${report.keyFindings

        const isFetchFailure = /fetch failed/i.test(error.message || "");                .map((item) => item.title || item.summary || "(untitled)")

        if (isConnectionReset || isFetchFailure) {                .slice(0, 3)

          try {                let html = null;

            html = fs.readFileSync(file, "utf8");                let usedFallback = false;

            usedFallback = true;                try {

            fallbacks.push({                  const response = await fetch(targetUrl);

              file,                  if (!response.ok) {

              url: targetUrl,                    throw new Error(`HTTP ${response.status}`);

              reason: error.message,                  }

              code: error.cause && error.cause.code,                  html = await response.text();

            });                } catch (error) {

            if (!json) {                  const isConnectionReset = error.cause && error.cause.code === "ECONNRESET";

              console.warn(                  const isFetchFailure = /fetch failed/i.test(error.message || "");

                `HTTP fetch failed for ${targetUrl} (${error.message}); falling back to file read`,                  if (isConnectionReset || isFetchFailure) {

              );                    try {

            }                      html = fs.readFileSync(file, "utf8");

          } catch (fsError) {                      usedFallback = true;

            errors.push({ file, url: targetUrl, error: fsError, via: "filesystem" });                      fallbacks.push({ file, url: targetUrl, reason: error.message });

            if (!json) {                      if (!json) {

              console.error(                        console.warn(

                `Failed to read ${file} after HTTP error:`,                          `HTTP fetch failed for ${targetUrl} (${error.message}); falling back to file read`,

                fsError.message,                        );

              );                      }

            }                    } catch (fsError) {

            continue;                      errors.push({ file, url: targetUrl, error: fsError, via: "filesystem" });

          }                      if (!json) {

        } else {                        console.error(

          errors.push({ file, url: targetUrl, error });                          `Failed to read ${file} after HTTP error:`,

          if (!json) {                          fsError.message,

            const details =                        );

              error.cause && error.cause.code ? ` (${error.cause.code})` : "";                      }

            console.error(`Failed: ${targetUrl}`, `${error.message}${details}`);                      continue;

          }                    }

          continue;                  } else {

        }                    errors.push({ file, url: targetUrl, error });

      }                    if (!json) {

                      const details =

      if (html == null) {                        error.cause && error.cause.code ? ` (${error.cause.code})` : "";

        errors.push({                      console.error(`Failed: ${targetUrl}`, `${error.message}${details}`);

          file,                    }

          url: targetUrl,                    continue;

          error: fetchError || new Error("No HTML retrieved"),                  }

        });                }

        continue;

      }                try {

                  const report = await analyzeHtml(html, {

      try {                    source: usedFallback ? file : targetUrl,

        const report = await analyzeHtml(html, {                  });

          source: usedFallback ? file : targetUrl,                  results.push({ file, url: targetUrl, report, fromHttp: !usedFallback });

        });

        results.push({ file, url: targetUrl, report, fromHttp: !usedFallback });                  if (!json) {

                    const rel = path.relative(process.cwd(), file);

        if (!json) {                    console.log(`\n${rel}`);

          const rel = path.relative(process.cwd(), file);                    console.log("-".repeat(rel.length));

          console.log(`\n${rel}`);                    const grade =

          console.log("-".repeat(rel.length));                      (report.userRightsIndex && report.userRightsIndex.grade) || "N/A";

          const grade =                    const readability =

            (report.userRightsIndex && report.userRightsIndex.grade) || "N/A";                      (report.readability && report.readability.grade) || "N/A";

          const readability =                    const rights = (report.rights && report.rights.grade) || "N/A";

            (report.readability && report.readability.grade) || "N/A";                    console.log(

          const rights = (report.rights && report.rights.grade) || "N/A";                      `URI: ${grade} | Readability: ${readability} | Rights: ${rights}`,

          console.log(                    );

            `URI: ${grade} | Readability: ${readability} | Rights: ${rights}`,                    if (report.riskLevel) {

          );                      console.log(`Risk Level: ${report.riskLevel}`);

          if (report.riskLevel) {                    }

            console.log(`Risk Level: ${report.riskLevel}`);                    if (Array.isArray(report.keyFindings) && report.keyFindings.length) {

          }                      console.log(

          if (Array.isArray(report.keyFindings) && report.keyFindings.length) {                        `Key Findings: ${report.keyFindings

            console.log(                          .map((item) => item.title || item.summary || "(untitled)")

              `Key Findings: ${report.keyFindings                          .slice(0, 3)

                .map((item) => item.title || item.summary || "(untitled)")                          .join("; ")}`,

                .slice(0, 3)                      );

                .join("; ")}`,                    }

            );                    if (usedFallback) {

          }                      console.log("(served via filesystem fallback)");

          if (usedFallback) {                    }

            console.log("(served via filesystem fallback)");                  }

          }                } catch (analysisError) {

        }                  errors.push({

      } catch (analysisError) {                    file,

        errors.push({                    url: targetUrl,

          file,                    error: analysisError,

          url: targetUrl,                    via: usedFallback ? "filesystem" : "http",

          error: analysisError,                  });

          via: usedFallback ? "filesystem" : "http",                  if (!json) {

        });                    console.error(

        if (!json) {                      `Analysis failed for ${targetUrl}:`,

          console.error(                      analysisError.message,

            `Analysis failed for ${targetUrl}:`,                    );

            analysisError.message,                  }

          );                }

        }      console.log("======");

      }      console.log(`Analyzed: ${summary.analyzed}`);

    }      if (summary.skipped) {

  } finally {        console.log(`Skipped: ${summary.skipped}`);

    await serverHandle.close();      }

  }      if (summary.results.length) {

        console.log(`Served from: ${summary.server.baseUrl}`);

  const stats = new Map();      }

  for (const { report } of results) {      Object.entries(summary.stats).forEach(([grade, count]) => {

    const grade =        console.log(`  URI ${grade}: ${count}`);

      (report.userRightsIndex && report.userRightsIndex.grade) || "Unknown";      });

    stats.set(grade, (stats.get(grade) || 0) + 1);    }

  }  } catch (error) {

    console.error("Serve-and-analyze failed:", error.message);

  return {    process.exit(1);

    analyzed: results.length,  }

    skipped: errors.length,}

    results,

    errors,if (require.main === module) {

    fallbacks,  main();

    server: { baseUrl },}

    stats: Object.fromEntries(stats),

  };module.exports = { serveAndAnalyze };

}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  try {
    const summary = await serveAndAnalyze(options);
    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log("\nSummary");
      console.log("======");
      console.log(`Analyzed: ${summary.analyzed}`);
      if (summary.skipped) {
        console.log(`Skipped: ${summary.skipped}`);
      }
      if (summary.fallbacks.length) {
        console.log(`Fallbacks: ${summary.fallbacks.length}`);
      }
      if (summary.results.length) {
        console.log(`Served from: ${summary.server.baseUrl}`);
      }
      Object.entries(summary.stats).forEach(([grade, count]) => {
        console.log(`  URI ${grade}: ${count}`);
      });
    }
  } catch (error) {
    console.error("Serve-and-analyze failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { serveAndAnalyze };
