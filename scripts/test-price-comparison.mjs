import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

async function testPriceComparison() {
  const brand = "ASUS";
  const modelName = "ROG Zephyrus G14 GA402RK";

  console.log(`Searching price comparison for ${brand} ${modelName}...`);

  const searchRes = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query: `${brand} ${modelName} price in India Amazon Flipkart buy online`,
      max_results: 5,
    }),
  });

  const searchData = await searchRes.json();
  console.log("Found search results:", searchData.results?.length);

  const snippets = searchData.results?.map(r => `${r.title}: ${r.content}`).join("\n\n") || "";

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

  const prompt = `
Extract and estimate the realistic Indian retail price comparison between Amazon and Flipkart for:
Product: ${brand} ${modelName}

Web search evidence:
${snippets}

Return ONLY a JSON object (no markdown):
{
  "amazon": {
    "platform": "Amazon",
    "price": "e.g. ₹1,49,990",
    "originalPrice": "e.g. ₹1,74,990",
    "discount": "e.g. 14% off",
    "rating": "e.g. 4.4/5",
    "availability": "In Stock",
    "url": "https://www.amazon.in/s?k=${encodeURIComponent(brand + ' ' + modelName)}",
    "badge": "Amazon's Choice or Deal"
  },
  "flipkart": {
    "platform": "Flipkart",
    "price": "e.g. ₹1,44,990",
    "originalPrice": "e.g. ₹1,72,990",
    "discount": "e.g. 16% off",
    "rating": "e.g. 4.3/5",
    "availability": "In Stock",
    "url": "https://www.flipkart.com/search?q=${encodeURIComponent(brand + ' ' + modelName)}",
    "badge": "Flipkart Assured"
  },
  "bestPlatform": "Flipkart or Amazon or Both Equal",
  "savingsText": "e.g. Save ₹5,000 on Flipkart",
  "currency": "INR",
  "insights": "Short note comparing seller warranty, exchange offers, or bank card discounts."
}
`;

  const aiRes = await model.generateContent(prompt);
  console.log("Price comparison output:\n", aiRes.response.text());
}

testPriceComparison();
