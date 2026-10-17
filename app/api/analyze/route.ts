import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { uploadToStorage } from "@/lib/storage";
import { runGadgetiqPipeline } from "@/lib/ai-engine";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let mode: "image" | "video" | "text" | "troubleshoot" = "text";
    let textQuery = "";
    let symptoms = "";
    const imagesBase64: { data: string; mimeType: string }[] = [];
    const videoFramesBase64: { data: string; mimeType: string; timestampSec: number }[] = [];
    const uploadedAssetKeys: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      mode = (formData.get("mode") as any) || "image";
      textQuery = (formData.get("textQuery") as string) || "";
      symptoms = (formData.get("symptoms") as string) || "";

      // Process uploaded files
      const files = formData.getAll("files") as File[];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file && file.size > 0) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const mimeType = file.type || "image/jpeg";
          const fileKey = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

          // Upload to Neon S3 Object Storage
          try {
            await uploadToStorage(fileKey, buffer, mimeType);
            uploadedAssetKeys.push(fileKey);

            // Record in Neon Postgres uploaded_assets table
            await sql`
              INSERT INTO uploaded_assets (file_name, storage_key, file_size, mime_type)
              VALUES (${file.name}, ${fileKey}, ${file.size}, ${mimeType})
            `;
          } catch (storageErr) {
            console.warn("Storage upload warning (continuing analysis):", storageErr);
          }

          if (mimeType.startsWith("image/")) {
            imagesBase64.push({
              data: buffer.toString("base64"),
              mimeType,
            });
          }
        }
      }
    } else {
      // JSON payload
      const body = await req.json();
      mode = body.mode || "text";
      textQuery = body.textQuery || "";
      symptoms = body.symptoms || "";
      if (body.imagesBase64 && Array.isArray(body.imagesBase64)) {
        imagesBase64.push(...body.imagesBase64);
      }
    }

    // Run AI Intelligence & Source Verification Pipeline
    const report = await runGadgetiqPipeline({
      mode,
      textQuery,
      symptoms,
      imagesBase64,
      videoFramesBase64,
    });

    // Save analysis to Neon Postgres
    let savedAnalysisId = null;
    try {
      const [inserted] = await sql`
        INSERT INTO gadget_analyses (
          device_name, brand, category, model_number, confidence_score,
          specs, evidence, source_links, image_urls
        )
        VALUES (
          ${report.identity?.modelName || "Unknown Device"},
          ${report.identity?.brand || "Generic"},
          ${report.identity?.category || "Other"},
          ${report.identity?.exactModelNumber || null},
          ${report.identity?.confidenceScore || 80},
          ${JSON.stringify(report.technicalSpecs || {})},
          ${JSON.stringify(report.visualFingerprint || {})},
          ${JSON.stringify(report.verifiedSources || [])},
          ${JSON.stringify(uploadedAssetKeys)}
        )
        RETURNING id;
      `;
      savedAnalysisId = inserted?.id;
    } catch (dbErr: any) {
      console.warn("Neon Postgres insert warning:", dbErr.message);
    }

    return NextResponse.json({
      success: true,
      analysisId: savedAnalysisId,
      report,
      storedAssets: uploadedAssetKeys,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("GadgetIQ Analysis Route Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred during device analysis.",
      },
      { status: 500 }
    );
  }
}
