# ⚡ GADGETIQ — AI Gadget Intelligence, Diagnostics & Price Discovery Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Neon](https://img.shields.io/badge/Neon-Serverless%20Postgres-00E599?style=flat&logo=neon)](https://neon.tech/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Multimodal%20AI-8E75B2?style=flat&logo=google)](https://aistudio.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

**GADGETIQ** is an enterprise-grade AI hardware intelligence and diagnostics web application. It identifies electronic devices from photos, videos, OCR labels, model numbers, and symptoms, then generates source-verified technical reports, upgrade simulators, diagnostic work-ups, and live market price comparisons between **Amazon** and **Flipkart**.

---

## 🌟 Key Features

### 1. Unified 4-Mode Input Engine
- 📸 **Image Input**: Drag-and-drop multi-angle gadget photos (front, back, ports, brand logos, circuit boards, regulatory markings).
- 🎥 **Video Input**: Frame extraction and temporal analysis for blinking indicator LEDs, boot loop sequences, and physical port inspection.
- 🔍 **Natural Language Description**: Free-form text queries (e.g. *"ASUS gaming laptop with RTX 3060 and 144Hz display"*).
- 🛡️ **Fault Troubleshooting**: Symptom-driven diagnostics (e.g. *"Powers on but screen stays black, external monitor works via HDMI"*).

### 2. Multi-Stage Hardware Intelligence Pipeline
1. **Visual Cues & Ports Detection**: Detects chassis materials, hinge designs, cooling vents, and I/O layout.
2. **OCR Model Number Extraction**: Identifies part numbers, SKUs, and FCC regulatory markings from label photos.
3. **Candidate Model Matching**: Ranks candidate devices with calibrated confidence scores and explains unresolved ambiguities.
4. **Authoritative Specification Retrieval**: Grounds reports using live search verification via **Tavily AI Engine** to pull verified user manuals, drivers, and manufacturer spec sheets.

### 3. Hardware Compatibility Simulator
- **RAM Upgrades**: Verifies maximum supported RAM capacity, SODIMM slots vs soldered memory, and Flex Mode dual-channel behavior.
- **Storage Expansion**: Identifies M.2 NVMe PCIe generation limits (Gen 4 vs Gen 3) and form factors (2280/2242).
- **Power & Charging**: Validates adapter wattage, barrel jacks vs USB-C Power Delivery 3.0 protocols.

### 4. AI Fault Detective & Safe Checks
- Evaluates reported symptoms against hardware failure modes.
- Generates categorized likelihoods (High/Medium/Low), non-destructive safe checks you can do at home, and guidance on when professional component-level repair is needed.

### 5. Amazon vs. Flipkart Retail Price Comparison
- Side-by-side pricing cards comparing live prices on **Amazon India** and **Flipkart**.
- Real-time **"Best Deal"** badge and exact savings calculation.
- Customer ratings, stock status, and delivery speed estimates.
- 1-click **"Buy on Amazon"** and **"Buy on Flipkart"** direct links.
- E-commerce market insights on warranty, return policy, and bank card discount offers.

### 6. Device Digital Passport & Technical Copilot
- **Digital Passport**: Save verified device specifications and maintenance logs directly to **Neon PostgreSQL** database.
- **Contextual Copilot**: Interactive Q&A chat grounded directly in the active device's verified hardware specifications.

---

## 🏗️ Architecture & Cloud Infrastructure

- **Frontend & Server**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **AI Engine**: Google Gemini Multimodal Vision & Reasoning (`gemini-3.5-flash-lite`)
- **Research Engine**: Tavily AI Search API for source-verified technical documentation
- **Database**: [Neon](https://neon.tech/) Serverless PostgreSQL with `@neondatabase/serverless` HTTP connection pooling
- **Object Storage**: Neon S3-compatible private `assets` bucket for high-throughput media uploads
- **Auth & Edge Functions**: Neon Auth (JWKS) & Neon Serverless Functions

---

## 🚀 Getting Started

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/naikganu1025/GadgetIq.git
cd GadgetIq
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Configure environment variables
Copy the template file to `.env`:
\`\`\`bash
cp .env.example .env
\`\`\`

Fill in your API credentials:
\`\`\`ini
# Google Gemini API (Required for multimodal vision & diagnostics)
GEMINI_API_KEY=your_gemini_api_key_here

# Tavily Search API (Required for live web research & price comparison)
TAVILY_API_KEY=your_tavily_api_key_here

# Neon Serverless Postgres
DATABASE_URL="postgresql://user:password@endpoint-pooler.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"

# Neon S3 Object Storage
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_ENDPOINT_URL_S3=https://your-branch.storage.neon.tech
AWS_REGION=us-east-2
\`\`\`

### 4. Run database & service tests
\`\`\`bash
npm run test:services
\`\`\`

### 5. Start the development server
\`\`\`bash
npm run dev
# or for production build
npm run build && npm start
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Privacy
- API credentials and database connection strings are stored server-side and never exposed to the client browser.
- Uploaded images and video frames are stored with UUID identifiers in private S3 buckets.
- Extracted label text is sanitized against prompt injection prior to LLM reasoning.

---

## 📄 License
MIT License. Built for advanced AI hardware intelligence & diagnostics.
