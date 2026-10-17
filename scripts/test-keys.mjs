import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function testKeys() {
  console.log("Testing Google Gemini API...");
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Respond with 'Gemini OK'");
    console.log("Gemini Response:", result.response.text());
  } catch (err) {
    console.error("Gemini Error:", err.message);
  }

  console.log("\nTesting Tavily API...");
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: "ASUS ROG Zephyrus G14 specs",
        max_results: 1,
      }),
    });
    const data = await res.json();
    console.log("Tavily Response:", data.results ? "Tavily OK - " + data.results[0]?.title : JSON.stringify(data));
  } catch (err) {
    console.error("Tavily Error:", err.message);
  }
}

testKeys();
