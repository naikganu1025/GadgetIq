import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function testGemini25() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    const result = await model.generateContent("What is GADGETIQ? Reply in one short sentence.");
    console.log("Success! Gemini Response:\n", result.response.text());
  } catch (e) {
    console.error("Gemini Error:", e.message);
  }
}

testGemini25();
