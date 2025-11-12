-- Migration: Add customer_emails table for marketing
CREATE TABLE IF NOT EXISTS customer_emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  first_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_emails_email ON customer_emails(email);
CREATE INDEX IF NOT EXISTS idx_customer_emails_created_at ON customer_emails(created_at);
