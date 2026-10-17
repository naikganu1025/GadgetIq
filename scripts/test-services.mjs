import dotenv from "dotenv";
dotenv.config();

import { neon } from "@neondatabase/serverless";
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GoogleGenerativeAI } from "@google/generative-ai";

const results = {
  postgres: false,
  storage: false,
  auth: false,
  functions: false,
  gemini: false,
  tavily: false,
};

async function runAllServiceTests() {
  console.log("=================================================");
  console.log("   GADGETIQ — End-to-End Service Verification    ");
  console.log("=================================================\n");

  // 1. NEON POSTGRES
  console.log("1. Testing Neon Postgres Connection & Migration...");
  try {
    const sql = neon(process.env.DATABASE_URL);
    // Create tables
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

    // Insert test record
    const [inserted] = await sql`
      INSERT INTO gadget_analyses (device_name, brand, category, model_number, confidence_score)
      VALUES ('Zephyrus G14 Test', 'ASUS', 'Laptop', 'GA402RK', 96.50)
      RETURNING id, device_name, brand, category, confidence_score;
    `;
    console.log(`   ✓ Neon Postgres Connected! Created & inserted test gadget ID: ${inserted.id}`);

    // Query back
    const rows = await sql`SELECT count(*) as count FROM gadget_analyses;`;
    console.log(`   ✓ Total records in gadget_analyses: ${rows[0].count}`);
    results.postgres = true;
  } catch (err) {
    console.error("   ✗ Neon Postgres Failed:", err.message);
  }

  // 2. NEON OBJECT STORAGE (S3)
  console.log("\n2. Testing Neon Object Storage (S3 Assets Bucket)...");
  try {
    const s3 = new S3Client({
      region: process.env.AWS_REGION || "us-east-2",
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: true,
    });

    const testKey = `test-health-${Date.now()}.json`;
    const payload = JSON.stringify({ app: "GADGETIQ", test: true, timestamp: new Date().toISOString() });

    await s3.send(new PutObjectCommand({
      Bucket: "assets",
      Key: testKey,
      Body: payload,
      ContentType: "application/json",
    }));
    console.log(`   ✓ Neon Object Storage: Successfully uploaded key: ${testKey} to 'assets' bucket`);

    const signedUrl = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: "assets",
      Key: testKey,
    }), { expiresIn: 300 });
    console.log(`   ✓ Presigned download URL generated: ${signedUrl.substring(0, 75)}...`);
    results.storage = true;
  } catch (err) {
    console.error("   ✗ Neon Object Storage Failed:", err.message);
  }

  // 3. NEON AUTH
  console.log("\n3. Testing Neon Auth JWKS Endpoint...");
  try {
    const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
    if (jwksUrl) {
      const res = await fetch(jwksUrl);
      if (res.ok) {
        const jwks = await res.json();
        console.log(`   ✓ Neon Auth JWKS reachable! Keys found: ${jwks.keys ? jwks.keys.length : 0}`);
        results.auth = true;
      } else {
        console.error(`   ✗ Neon Auth JWKS HTTP ${res.status}: ${res.statusText}`);
      }
    } else {
      console.warn("   ! NEON_AUTH_JWKS_URL is missing in environment");
    }
  } catch (err) {
    console.error("   ✗ Neon Auth Test Failed:", err.message);
  }

  // 4. NEON FUNCTIONS
  console.log("\n4. Testing Neon Functions (Hello Endpoint)...");
  try {
    const fnUrl = process.env.NEON_FUNCTION_HELLO_BASE_URL;
    if (fnUrl) {
      const res = await fetch(fnUrl);
      const text = await res.text();
      console.log(`   ✓ Neon Function responded (Status ${res.status}): "${text.trim()}"`);
      results.functions = true;
    } else {
      console.warn("   ! NEON_FUNCTION_HELLO_BASE_URL is missing in environment");
    }
  } catch (err) {
    console.error("   ✗ Neon Functions Test Failed:", err.message);
  }

  // 5. GOOGLE GEMINI AI
  console.log("\n5. Testing Google Gemini Intelligence Engine...");
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    const res = await model.generateContent("Identify gadget type: 'Intel Core i9-14900K 24-core unlocked processor'");
    console.log(`   ✓ Gemini AI Response: "${res.response.text().trim().substring(0, 100)}..."`);
    results.gemini = true;
  } catch (err) {
    console.error("   ✗ Gemini AI Test Failed:", err.message);
  }

  // 6. TAVILY LIVE WEB RESEARCH
  console.log("\n6. Testing Tavily Live Source-Verification Search...");
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: "Sony WH-1000XM5 official specs Bluetooth codecs",
        max_results: 1,
      }),
    });
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      console.log(`   ✓ Tavily Search verified source: "${data.results[0].title}" (${data.results[0].url})`);
      results.tavily = true;
    } else {
      console.error("   ✗ Tavily returned no results:", JSON.stringify(data));
    }
  } catch (err) {
    console.error("   ✗ Tavily Test Failed:", err.message);
  }

  console.log("\n=================================================");
  console.log("                   SUMMARY                       ");
  console.log("=================================================");
  for (const [service, passed] of Object.entries(results)) {
    console.log(`  ${service.padEnd(12)} : ${passed ? "✅ PASSED" : "❌ FAILED"}`);
  }
  console.log("=================================================\n");

  const allPassed = Object.values(results).every(Boolean);
  if (!allPassed) {
    process.exit(1);
  }
}

runAllServiceTests();
