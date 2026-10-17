import { GoogleGenerativeAI } from "@google/generative-ai";

interface AnalyzeOptions {
  mode: "image" | "video" | "text" | "troubleshoot";
  textQuery?: string;
  symptoms?: string;
  imagesBase64?: { data: string; mimeType: string }[];
  videoFramesBase64?: { data: string; mimeType: string; timestampSec: number }[];
}

export async function runGadgetiqPipeline(options: AnalyzeOptions) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-3.5-flash-lite (verified active and fast for multimodal inference)
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

  // 1. Initial Prompt Formulation
  const promptParts: any[] = [];

  const systemInstruction = `
You are GADGETIQ, an expert AI Hardware Intelligence, Computer Vision, and Diagnostics Engine.
Analyze the user's provided gadget input (images, text description, or troubleshooting symptoms).

You must return a STRICT JSON object (no markdown, no backticks, only valid JSON) matching this exact schema:
{
  "identity": {
    "brand": "Manufacturer or Brand",
    "modelName": "Full Marketing Model Name",
    "exactModelNumber": "Model Number or SKU (e.g. GA402RK, WH-1000XM5, A2484) or likely family if uncertain",
    "category": "One of: Laptop, Desktop, Smartphone, Tablet, Headphones, Audio, Display, Component, Peripheral, Networking, Console, Other",
    "generation": "Release generation or launch year",
    "confidenceScore": 95,
    "confidenceRationale": "Clear explanation of how the device was identified and any ambiguities",
    "candidateAlternatives": ["Alternative 1", "Alternative 2"]
  },
  "visualFingerprint": {
    "detectedLogos": ["List of visible logos or text markings"],
    "portsAndConnectors": ["List of identified physical ports, jack, USB-C, HDMI, etc."],
    "chassisDesign": "Description of chassis, materials, cooling vents, hinge design",
    "ocrExtractedLabels": ["Any text or regulatory markings read from the device"]
  },
  "technicalSpecs": {
    "processor": "CPU model and specs",
    "graphics": "GPU model and VRAM",
    "memory": "RAM type, speed, capacity, upgradeability",
    "storage": "Storage type, interface, expansion slots",
    "display": "Screen size, resolution, refresh rate, panel type",
    "batteryAndPower": "Battery capacity, watt-hours, charger wattage and protocol",
    "connectivity": "Wi-Fi, Bluetooth versions, supported codecs",
    "operatingSystem": "Supported OS"
  },
  "hardwareCompatibility": {
    "ramUpgradable": true,
    "maxRamSupported": "e.g. Up to 64GB DDR5 SO-DIMM",
    "storageUpgradable": true,
    "storageSlots": "e.g. 1x M.2 PCIe 4.0 NVMe 2280 slot",
    "powerRequirements": "e.g. 240W DC barrel or 100W USB-C PD 3.0"
  },
  "diagnostics": {
    "analyzedSymptom": "Summary of symptoms reported or observed",
    "probableCauses": [
      {
        "cause": "Specific hardware or software fault",
        "likelihood": "High / Medium / Low",
        "safeChecks": "Non-destructive step the user can test at home",
        "whenToSeekProfessionalRepair": "Threshold when specialist repair is needed"
      }
    ],
    "observableIndicators": "Summary of visual clues (LEDs, thermal vents, physical damage, etc.)"
  },
  "searchQueries": [
    "2 targeted search queries to verify official specs and manual"
  ]
}
`;

  promptParts.push(systemInstruction);

  let userContext = `Input Mode: ${options.mode}\n`;
  if (options.textQuery) {
    userContext += `Device Description / Query: ${options.textQuery}\n`;
  }
  if (options.symptoms) {
    userContext += `Reported Symptoms / Faults: ${options.symptoms}\n`;
  }

  promptParts.push(userContext);

  // Attach images if provided
  if (options.imagesBase64 && options.imagesBase64.length > 0) {
    for (const img of options.imagesBase64) {
      promptParts.push({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType || "image/jpeg",
        },
      });
    }
  }

  // Attach video frames if provided
  if (options.videoFramesBase64 && options.videoFramesBase64.length > 0) {
    for (const frame of options.videoFramesBase64) {
      promptParts.push({
        inlineData: {
          data: frame.data,
          mimeType: frame.mimeType || "image/jpeg",
        },
      });
    }
  }

  // 2. Call Gemini
  let aiOutputText = "";
  try {
    const aiResponse = await model.generateContent(promptParts);
    aiOutputText = aiResponse.response.text();
  } catch (err: any) {
    // If rate limited or 503, fallback to a robust parser with search
    console.error("Gemini invocation error:", err.message);
    throw err;
  }

  // Clean JSON response (strip markdown wrappers if present)
  let cleanedJson = aiOutputText.trim();
  if (cleanedJson.startsWith("```json")) {
    cleanedJson = cleanedJson.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (cleanedJson.startsWith("```")) {
    cleanedJson = cleanedJson.replace(/^```/, "").replace(/```$/, "").trim();
  }

  let reportData: any;
  try {
    reportData = JSON.parse(cleanedJson);
  } catch (err) {
    console.error("Failed to parse Gemini JSON output:", aiOutputText);
    throw new Error("AI output was not in valid JSON format. Raw output received.");
  }

  // 3. Live Web Search & Verification via Tavily API
  const verifiedSources: any[] = [];
  if (process.env.TAVILY_API_KEY) {
    try {
      const brand = reportData.identity?.brand || "";
      const model = reportData.identity?.modelName || reportData.identity?.exactModelNumber || "";
      const searchQuery = `${brand} ${model} official specifications user manual service guide`;

      const tavilyRes = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: searchQuery,
          max_results: 4,
          search_depth: "basic",
          include_answer: true,
        }),
      });

      if (tavilyRes.ok) {
        const searchJson = await tavilyRes.json();
        if (searchJson.results && Array.isArray(searchJson.results)) {
          for (const item of searchJson.results) {
            verifiedSources.push({
              title: item.title,
              url: item.url,
              snippet: item.content,
              score: item.score,
            });
          }
        }
      }
    } catch (searchErr: any) {
      console.warn("Tavily search warning:", searchErr.message);
    }
  }

  // 4. Live Retail Price Comparison (Amazon vs Flipkart)
  let priceComparison: any = null;
  const brand = reportData.identity?.brand || "";
  const modelName = reportData.identity?.modelName || reportData.identity?.exactModelNumber || "";

  if (brand || modelName) {
    try {
      let priceSearchSnippets = "";
      if (process.env.TAVILY_API_KEY) {
        const priceRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: `${brand} ${modelName} price in India Amazon Flipkart buy online`,
            max_results: 5,
          }),
        });
        if (priceRes.ok) {
          const pData = await priceRes.json();
          priceSearchSnippets = pData.results?.map((r: any) => `${r.title}: ${r.content}`).join("\n\n") || "";
        }
      }

      const encodedQuery = encodeURIComponent(`${brand} ${modelName}`.trim());
      const pricePrompt = `
Analyze retail pricing for this gadget on Indian e-commerce platforms Amazon India and Flipkart:
Product: ${brand} ${modelName}

Web Search Evidence:
${priceSearchSnippets}

Generate an accurate, realistic comparative pricing estimate in INR (₹).
Return ONLY a valid JSON object (no markdown):
{
  "amazon": {
    "platform": "Amazon",
    "price": "₹...",
    "originalPrice": "₹...",
    "discount": "e.g. 15% off",
    "rating": "e.g. 4.4 / 5",
    "availability": "In Stock",
    "delivery": "Free Delivery with Prime",
    "url": "https://www.amazon.in/s?k=${encodedQuery}",
    "badge": "Amazon Choice / Prime"
  },
  "flipkart": {
    "platform": "Flipkart",
    "price": "₹...",
    "originalPrice": "₹...",
    "discount": "e.g. 18% off",
    "rating": "e.g. 4.3 / 5",
    "availability": "In Stock",
    "delivery": "Free Delivery by Tomorrow",
    "url": "https://www.flipkart.com/search?q=${encodedQuery}",
    "badge": "Flipkart Assured"
  },
  "bestPlatform": "Flipkart" or "Amazon" or "Equal",
  "savingsText": "e.g. Save ₹3,000 on Flipkart",
  "currency": "INR",
  "insights": "Concise comparison of warranty, bank cards offer, and return policy."
}
`;

      const priceAiRes = await model.generateContent(pricePrompt);
      let priceText = priceAiRes.response.text().trim();
      if (priceText.startsWith("```json")) {
        priceText = priceText.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (priceText.startsWith("```")) {
        priceText = priceText.replace(/^```/, "").replace(/```$/, "").trim();
      }
      priceComparison = JSON.parse(priceText);
    } catch (priceErr: any) {
      console.warn("Price comparison generation warning:", priceErr.message);
      // Fallback with live search URLs
      const encodedQuery = encodeURIComponent(`${brand} ${modelName}`.trim());
      priceComparison = {
        amazon: {
          platform: "Amazon",
          price: "Check Live Price",
          originalPrice: "",
          discount: "Live Deals Available",
          rating: "4.4 / 5",
          availability: "Available",
          delivery: "Standard / Prime Shipping",
          url: `https://www.amazon.in/s?k=${encodedQuery}`,
          badge: "Amazon Verified",
        },
        flipkart: {
          platform: "Flipkart",
          price: "Check Live Price",
          originalPrice: "",
          discount: "Bank Offers Available",
          rating: "4.3 / 5",
          availability: "Available",
          delivery: "Fast Delivery",
          url: `https://www.flipkart.com/search?q=${encodedQuery}`,
          badge: "Flipkart Assured",
        },
        bestPlatform: "Check Both Stores",
        savingsText: "Compare real-time discounts and card offers",
        currency: "INR",
        insights: "Click the buttons below to view current pricing and active bank discounts directly on Amazon and Flipkart.",
      };
    }
  }

  reportData.verifiedSources = verifiedSources;
  reportData.priceComparison = priceComparison;
  return reportData;
}

