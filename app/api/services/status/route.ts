import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { listStorageObjects } from "@/lib/storage";
import { getNeonAuthConfig } from "@/lib/auth";
import { invokeNeonHelloFunction } from "@/lib/neon-functions";

export async function GET() {
  const status = {
    postgres: { ok: false, message: "" },
    storage: { ok: false, message: "" },
    auth: { ok: false, message: "" },
    functions: { ok: false, message: "" },
    gemini: { ok: Boolean(process.env.GEMINI_API_KEY), message: "Configured" },
    tavily: { ok: Boolean(process.env.TAVILY_API_KEY), message: "Configured" },
  };

  // Test Neon Postgres
  try {
    const res = await sql`SELECT 1 as test;`;
    if (res && res[0]?.test === 1) {
      status.postgres = { ok: true, message: "Connected to Neon Postgres Serverless" };
    }
  } catch (err: any) {
    status.postgres = { ok: false, message: err.message };
  }

  // Test Neon Object Storage
  try {
    await listStorageObjects(1);
    status.storage = { ok: true, message: "Connected to Neon S3 Assets Bucket" };
  } catch (err: any) {
    status.storage = { ok: false, message: err.message };
  }

  // Test Neon Auth
  try {
    const authConfig = await getNeonAuthConfig();
    status.auth = { ok: authConfig.configured, message: authConfig.configured ? "JWKS Endpoint Active" : "Missing Auth URL" };
  } catch (err: any) {
    status.auth = { ok: false, message: err.message };
  }

  // Test Neon Functions
  try {
    const fnRes = await invokeNeonHelloFunction();
    status.functions = { ok: true, message: `Function Live (${fnRes.output})` };
  } catch (err: any) {
    status.functions = { ok: false, message: err.message };
  }

  return NextResponse.json({
    status: "ok",
    services: status,
    timestamp: new Date().toISOString(),
  });
}
