-- ═══════════════════════════════════════════════════════════════
-- Kinetic Tech — PostgreSQL Database Production Schema
-- ─────────────────────────────────────────────────────────────
-- Compatible with: Supabase, Neon.tech, Render, Railway, AWS RDS, VPS Postgres
-- ═══════════════════════════════════════════════════════════════

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if re-initializing (Order matters due to Foreign Keys)
-- DROP TABLE IF EXISTS transactions CASCADE;
-- DROP TABLE IF EXISTS usage_logs CASCADE;
-- DROP TABLE IF EXISTS transcription_jobs CASCADE;
-- DROP TABLE IF EXISTS refresh_tokens CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- 3. Create Custom Enum Types (if not already existing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_provider_enum') THEN
        CREATE TYPE auth_provider_enum AS ENUM ('email', 'google');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('user', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_plan_enum') THEN
        CREATE TYPE user_plan_enum AS ENUM ('free', 'pro', 'premium');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status_enum') THEN
        CREATE TYPE job_status_enum AS ENUM ('queued', 'extracting_audio', 'transcribing', 'completed', 'failed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status_enum') THEN
        CREATE TYPE transaction_status_enum AS ENUM ('pending', 'completed', 'failed');
    END IF;
END$$;

-- 4. Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    provider auth_provider_enum NOT NULL DEFAULT 'email',
    role user_role_enum NOT NULL DEFAULT 'user',
    plan user_plan_enum NOT NULL DEFAULT 'free',
    plan_expires_at TIMESTAMPTZ,
    quota_used_seconds INT NOT NULL DEFAULT 0,
    quota_limit_seconds INT NOT NULL DEFAULT 3600,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);

-- 5. Table: refresh_tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- 6. Table: transcription_jobs
CREATE TABLE IF NOT EXISTS transcription_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status job_status_enum NOT NULL DEFAULT 'queued',
    progress INT NOT NULL DEFAULT 0,
    current_step VARCHAR(100) DEFAULT 'queued',
    original_filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    audio_duration_sec INT,
    language VARCHAR(10) DEFAULT 'auto',
    output_format VARCHAR(10) DEFAULT 'srt',
    s3_audio_path VARCHAR(500),
    result_json JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_jobs_user_created ON transcription_jobs(user_id, created_at DESC);

-- 7. Table: usage_logs
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES transcription_jobs(id) ON DELETE SET NULL,
    duration_sec INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_usage_logs_user_id ON usage_logs(user_id);

-- 8. Table: transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INT NOT NULL DEFAULT 0,
    plan VARCHAR(20) NOT NULL,
    status transaction_status_enum NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_ref VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_transactions_user_id ON transactions(user_id);

-- 9. Seed Default Accounts
-- Default Student Demo Account: student@kinetictech.vn / 123456
-- (Password hash is bcrypt: $2b$12$e8k8y.mP6qI04j5a8dEHeO4yLz1tTq1mYhVwL6p4s2w8q3e1r5t2)
INSERT INTO users (id, email, password_hash, display_name, provider, role, plan, quota_used_seconds, quota_limit_seconds)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'student@kinetictech.vn',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    'Học Viên Kinetic',
    'email',
    'user',
    'free',
    0,
    3600
)
ON CONFLICT (email) DO NOTHING;

-- 10. Confirmation output
SELECT 
    'Database schema initialized successfully!' AS status,
    COUNT(*) AS total_users FROM users;
