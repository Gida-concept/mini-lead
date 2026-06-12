-- 001_initial: Create leads + searches tables

CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL CHECK (source IN ('facebook', 'instagram', 'google_web', 'google_maps')),
    business_type TEXT NOT NULL,
    location TEXT NOT NULL,
    business_name TEXT,
    page_url TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    rating REAL,
    review_count INTEGER,
    social_handle TEXT,
    description TEXT,
    raw_data TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'rejected')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL CHECK (source IN ('facebook', 'instagram', 'google_web', 'google_maps')),
    query_params TEXT NOT NULL,
    results_count INTEGER,
    run_status TEXT NOT NULL DEFAULT 'running' CHECK (run_status IN ('running', 'completed', 'failed')),
    apify_run_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_page_url_source ON leads(page_url, source);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_searches_source ON searches(source);
CREATE INDEX IF NOT EXISTS idx_searches_run_status ON searches(run_status);
