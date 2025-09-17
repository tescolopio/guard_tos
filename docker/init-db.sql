-- Initialize Terms Guardian Database
-- This script sets up the database schema for hash-based caching

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create documents table for storing hashed content metadata
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hash VARCHAR(64) NOT NULL UNIQUE,
    url TEXT NOT NULL,
    content_length INTEGER NOT NULL,
    normalized_length INTEGER NOT NULL,
    word_count INTEGER NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    raw_checksum BIGINT,
    normalized_checksum BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analysis_results table for storing processed analysis data
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    readability_score DECIMAL(5,2),
    readability_grade VARCHAR(2),
    readability_confidence DECIMAL(5,2),
    rights_score DECIMAL(5,2),
    rights_grade VARCHAR(2),
    summary_text TEXT,
    uncommon_words JSONB,
    legal_patterns JSONB,
    processing_time_ms INTEGER,
    analyzer_version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(hash);
CREATE INDEX IF NOT EXISTS idx_documents_url ON documents(url);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_results_document_id ON analysis_results(document_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at);

-- Create user_preferences table for storing user settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    processing_mode VARCHAR(20) NOT NULL DEFAULT 'cloud', -- 'cloud' or 'local'
    is_paid_user BOOLEAN NOT NULL DEFAULT FALSE,
    cloud_database_url TEXT,
    cache_retention_days INTEGER DEFAULT 30,
    auto_update_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cache_stats table for monitoring performance
CREATE TABLE IF NOT EXISTS cache_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    local_hits INTEGER DEFAULT 0,
    cloud_hits INTEGER DEFAULT 0,
    misses INTEGER DEFAULT 0,
    stores INTEGER DEFAULT 0,
    average_processing_time_ms DECIMAL(8,2),
    unique_documents INTEGER DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    UNIQUE(date)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default cache stats record
INSERT INTO cache_stats (date) VALUES (CURRENT_DATE) 
ON CONFLICT (date) DO NOTHING;

-- Create view for document analysis summary
CREATE OR REPLACE VIEW document_analysis_summary AS
SELECT 
    d.hash,
    d.url,
    d.content_length,
    d.word_count,
    ar.readability_score,
    ar.readability_grade,
    ar.rights_score,
    ar.rights_grade,
    ar.processing_time_ms,
    d.created_at as document_created,
    ar.created_at as analysis_created
FROM documents d
LEFT JOIN analysis_results ar ON d.id = ar.document_id
ORDER BY d.created_at DESC;

-- Grant permissions (in production, use more restrictive permissions)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tg_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tg_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO tg_user;
