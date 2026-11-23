import type { Pool } from 'pg'

export async function initializeSchema(pool: Pool): Promise<void> {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS vector;`)
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      login TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      initials TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      area TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_login TEXT NOT NULL REFERENCES users(login) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ NULL
    );
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_login ON sessions(user_login);
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS policies (
      topic TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS policy_versions (
      id SERIAL PRIMARY KEY,
      topic TEXT NOT NULL REFERENCES policies(topic) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      section TEXT NOT NULL,
      current BOOLEAN NOT NULL DEFAULT TRUE,
      updated TEXT NOT NULL,
      summary TEXT NOT NULL,
      body TEXT NOT NULL,
      embedding vector(1536) NULL,
      created_by TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (topic, version)
    );
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_policy_versions_topic_version
      ON policy_versions(topic, version DESC);
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      owner TEXT NOT NULL,
      status TEXT NOT NULL,
      updated TEXT NULL,
      embedding vector(1536) NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_members (
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_login TEXT NOT NULL REFERENCES users(login) ON DELETE CASCADE,
      PRIMARY KEY (project_id, user_login)
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS folders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_login TEXT NOT NULL REFERENCES users(login) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_login, name)
    );
  `)

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_user_lower_name
      ON folders(user_login, LOWER(name));
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_login TEXT NOT NULL REFERENCES users(login) ON DELETE CASCADE,
      title TEXT NOT NULL,
      folder_id UUID NULL REFERENCES folders(id) ON DELETE SET NULL,
      archived BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
      ON conversations(user_login, updated_at DESC);
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
      text TEXT NOT NULL,
      kind TEXT NULL CHECK (kind IS NULL OR kind IN ('found', 'inference', 'none', 'outdated')),
      source_label TEXT NULL,
      source_to TEXT NULL,
      choices JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
      ON messages(conversation_id, created_at ASC);
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_login TEXT PRIMARY KEY REFERENCES users(login) ON DELETE CASCADE,
      detail_level TEXT NOT NULL DEFAULT 'Equilibrado',
      tone TEXT NOT NULL DEFAULT 'Profesional y claro',
      always_show_source BOOLEAN NOT NULL DEFAULT TRUE,
      suggest_related BOOLEAN NOT NULL DEFAULT TRUE,
      additional_context TEXT NOT NULL DEFAULT '',
      connected_apps JSONB NOT NULL DEFAULT '{"policies":true,"projects":true,"profile":true}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      event_type TEXT NOT NULL,
      actor_login TEXT NULL,
      resource TEXT NULL,
      outcome TEXT NOT NULL,
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
      ON audit_logs(created_at DESC);
  `)
}
