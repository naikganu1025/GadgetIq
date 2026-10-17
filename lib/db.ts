import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set in environment.");
}

// Neon HTTP driver - best practice for Next.js and serverless environments
export const sql = neon(process.env.DATABASE_URL || "");

/**
 * Initializes the database tables if they don't already exist.
 */
export async function initDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }

  // 1. Gadget Analyses table
  await sql`
    CREATE TABLE IF NOT EXISTS gadget_analyses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      device_name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      model_number TEXT,
      confidence_score NUMERIC(5, 2) DEFAULT 0.0,
      specs JSONB DEFAULT '{}'::jsonb,
      evidence JSONB DEFAULT '[]'::jsonb,
      source_links JSONB DEFAULT '[]'::jsonb,
      image_urls JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 2. Uploaded Assets table (Object Storage metadata)
  await sql`
    CREATE TABLE IF NOT EXISTS uploaded_assets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      file_name TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      file_url TEXT,
      file_size INTEGER DEFAULT 0,
      mime_type TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 3. Device Digital Passports table
  await sql`
    CREATE TABLE IF NOT EXISTS device_passports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT DEFAULT 'guest',
      device_name TEXT NOT NULL,
      brand TEXT NOT NULL,
      model_number TEXT,
      verified_specs JSONB DEFAULT '{}'::jsonb,
      maintenance_log JSONB DEFAULT '[]'::jsonb,
      user_notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // 4. Diagnostic Sessions table
  await sql`
    CREATE TABLE IF NOT EXISTS diagnostic_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      analysis_id UUID REFERENCES gadget_analyses(id) ON DELETE SET NULL,
      symptoms TEXT NOT NULL,
      likely_causes JSONB DEFAULT '[]'::jsonb,
      recommended_tests JSONB DEFAULT '[]'::jsonb,
      safety_warnings JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  return { success: true, message: "Neon Postgres schema verified and initialized." };
}
