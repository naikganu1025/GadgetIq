import dotenv from "dotenv";
dotenv.config();

async function listGeminiModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    if (data.models) {
      console.log("Available Gemini Models:");
      data.models.forEach(m => {
        if (m.supportedGenerationMethods?.includes("generateContent")) {
          console.log(" -", m.name);
        }
      });
    } else {
      console.log("Response:", JSON.stringify(data));
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

listGeminiModels();
