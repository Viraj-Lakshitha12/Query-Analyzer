-- Add caller class and method columns to query_logs table
ALTER TABLE query_logs
ADD COLUMN caller_class VARCHAR(255),
ADD COLUMN caller_method VARCHAR(255);
