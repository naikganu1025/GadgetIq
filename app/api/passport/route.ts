import { NextRequest, NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";

// GET: Retrieve saved passports
export async function GET() {
  try {
    await initDb();
    const devices = await sql`
      SELECT id, device_name, brand, model_number, verified_specs, maintenance_log, user_notes, created_at
      FROM device_passports
      ORDER BY created_at DESC
      LIMIT 50;
    `;
    return NextResponse.json({ success: true, devices });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Save a new device passport
export async function POST(req: NextRequest) {
  try {
    await initDb();
    const body = await req.json();
    const { deviceName, brand, modelNumber, verifiedSpecs, userNotes } = body;

    const [saved] = await sql`
      INSERT INTO device_passports (device_name, brand, model_number, verified_specs, user_notes)
      VALUES (
        ${deviceName || "Generic Device"},
        ${brand || "Generic"},
        ${modelNumber || ""},
        ${JSON.stringify(verifiedSpecs || {})},
        ${userNotes || "Added to Digital Passport"}
      )
      RETURNING id, device_name, brand, model_number, created_at;
    `;

    return NextResponse.json({ success: true, passport: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
