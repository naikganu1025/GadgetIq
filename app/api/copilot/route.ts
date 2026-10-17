import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { question, deviceContext } = await req.json();

    if (!question) {
      return NextResponse.json({ success: false, error: "Question is required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "Gemini API key is not configured." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    const prompt = `
You are GADGETIQ Copilot, a senior technical hardware specialist.
The user is asking a follow-up question about the following device:

DEVICE CONTEXT:
${JSON.stringify(deviceContext, null, 2)}

USER QUESTION:
"${question}"

Provide a direct, accurate, technically grounded answer based on the device's verified hardware specifications.
If upgrade compatibility or pinouts are involved, state safe limits, socket types, or constraints clearly.
Avoid generic boilerplate.
`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    return NextResponse.json({ success: true, answer });
  } catch (err: any) {
    console.error("Copilot error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
