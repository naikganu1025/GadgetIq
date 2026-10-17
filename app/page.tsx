"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Cpu,
  Search,
  Upload,
  Camera,
  Video,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Server,
  Zap,
  HardDrive,
  MessageSquare,
  BookmarkPlus,
  RefreshCw,
  Layers,
  ChevronRight,
  Sparkles,
  Info,
  Check,
  HelpCircle,
  ShoppingCart,
  TrendingDown,
  Tag,
} from "lucide-react";

export default function GadgetiqApp() {
  const [activeTab, setActiveTab] = useState<"image" | "video" | "text" | "troubleshoot">("image");
  const [textQuery, setTextQuery] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<number>(0);
  const [analysisReport, setAnalysisReport] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Copilot state
  const [copilotQuestion, setCopilotQuestion] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotChat, setCopilotChat] = useState<{ q: string; a: string }[]>([]);

  // Passport state
  const [passportSaved, setPassportSaved] = useState(false);
  const [passportLoading, setPassportLoading] = useState(false);
  const [savedPassports, setSavedPassports] = useState<any[]>([]);
  const [showPassportDrawer, setShowPassportDrawer] = useState(false);

  // Service health status
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to ensure Indian Rupee (₹) symbol renders cleanly
  const formatPrice = (p?: string) => (p ? p.replace(/^[?]/, "₹").replace(/(\s|^)\?(\d)/g, "$1₹$2") : "");

  // Check Neon and AI services health on load
  useEffect(() => {
    fetchServiceHealth();
    fetchSavedPassports();
  }, []);

  const fetchServiceHealth = async () => {
    try {
      const res = await fetch("/api/services/status");
      if (res.ok) {
        const data = await res.json();
        setServiceStatus(data.services);
      }
    } catch (e) {
      console.warn("Failed to fetch service status:", e);
    }
  };

  const fetchSavedPassports = async () => {
    try {
      const res = await fetch("/api/passport");
      if (res.ok) {
        const data = await res.json();
        setSavedPassports(data.devices || []);
      }
    } catch (e) {
      console.warn("Failed to fetch passports:", e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
      const newUrls = filesArray.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newUrls]);
    }
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const setExample = (sampleText: string, sampleSymptoms = "", mode: any = "text") => {
    setActiveTab(mode);
    setTextQuery(sampleText);
    setSymptoms(sampleSymptoms);
  };

  const handleAnalyze = async () => {
    if (activeTab === "image" && selectedFiles.length === 0 && !textQuery) {
      setErrorMsg("Please upload at least one gadget image or enter a description.");
      return;
    }
    if (activeTab === "text" && !textQuery.trim()) {
      setErrorMsg("Please provide a device description or model name.");
      return;
    }
    if (activeTab === "troubleshoot" && !symptoms.trim() && !textQuery.trim()) {
      setErrorMsg("Please describe the fault or symptoms you are experiencing.");
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);
    setAnalysisStage(1);
    setAnalysisReport(null);
    setPassportSaved(false);
    setCopilotChat([]);

    const stageTimer1 = setTimeout(() => setAnalysisStage(2), 700);
    const stageTimer2 = setTimeout(() => setAnalysisStage(3), 1400);
    const stageTimer3 = setTimeout(() => setAnalysisStage(4), 2200);

    try {
      const formData = new FormData();
      formData.append("mode", activeTab);
      formData.append("textQuery", textQuery);
      formData.append("symptoms", symptoms);
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setAnalysisStage(5);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze device.");
      }

      setAnalysisReport(data.report);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAskCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuestion.trim() || !analysisReport) return;

    const q = copilotQuestion;
    setCopilotQuestion("");
    setCopilotLoading(true);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          deviceContext: {
            identity: analysisReport.identity,
            specs: analysisReport.technicalSpecs,
            compatibility: analysisReport.hardwareCompatibility,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCopilotChat((prev) => [...prev, { q, a: data.answer }]);
      } else {
        setCopilotChat((prev) => [...prev, { q, a: "Error: " + data.error }]);
      }
    } catch (e: any) {
      setCopilotChat((prev) => [...prev, { q, a: "Network error: " + e.message }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleSavePassport = async () => {
    if (!analysisReport) return;
    setPassportLoading(true);
    try {
      const res = await fetch("/api/passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceName: analysisReport.identity?.modelName || "Identified Gadget",
          brand: analysisReport.identity?.brand || "Generic",
          modelNumber: analysisReport.identity?.exactModelNumber || "",
          verifiedSpecs: analysisReport.technicalSpecs || {},
          userNotes: `Identified via GADGETIQ with ${analysisReport.identity?.confidenceScore}% confidence.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPassportSaved(true);
        fetchSavedPassports();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPassportLoading(false);
    }
  };

  const stageDescriptions = [
    "",
    "1/5 Examining uploaded media & physical cues...",
    "2/5 Extracting OCR labels, logos & model identifiers...",
    "3/5 Matching candidate hardware models & variants...",
    "4/5 Verifying official specifications via live search...",
    "5/5 Compiling source-verified technical intelligence...",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-teal-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                GADGETIQ
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                AI Hardware Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Neon & Services Status Pill */}
            <button
              onClick={() => setStatusModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs transition"
              title="Click to view Neon & AI services health"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">Services Active</span>
            </button>

            {/* Passport Library Button */}
            <button
              onClick={() => setShowPassportDrawer(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Passports ({savedPassports.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Identify, Inspect & Diagnose Any Electronic Gadget
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Upload photos, video, model numbers, or symptoms. Powered by Google Multimodal AI,
            OCR vision, verified live technical specifications, and Neon Cloud infrastructure.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 mb-6 gap-2 sm:gap-4 overflow-x-auto pb-2">
            {[
              { id: "image", label: "Image Input", icon: Camera },
              { id: "video", label: "Video Input", icon: Video },
              { id: "text", label: "Model / Description", icon: Search },
              { id: "troubleshoot", label: "Troubleshooting", icon: ShieldAlert },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setErrorMsg(null);
                  }}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Image Input */}
          {activeTab === "image" && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700/80 hover:border-teal-500/50 rounded-xl p-8 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/60 transition group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 flex items-center justify-center mx-auto mb-3 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  Drop gadget photos here or click to browse
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Upload multiple angles: front, back, ports, brand logos, model labels, or circuit boards
                </p>
              </div>

              {/* Preview Grid */}
              {previewUrls.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-700 w-24 h-24">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="upload preview" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Optional Context or Extra Notes
                </label>
                <input
                  type="text"
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  placeholder="e.g. Purchased in 2023, has USB-C and HDMI on left side"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Video Input */}
          {activeTab === "video" && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700/80 hover:border-teal-500/50 rounded-xl p-8 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/60 transition group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 group-hover:scale-110 flex items-center justify-center mx-auto mb-3 transition">
                  <Video className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  Select a video file (MP4, MOV, WebM)
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  AI will extract key frames to inspect indicator LEDs, boot sequences, or physical port status
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="p-3 bg-slate-800/40 rounded-xl text-xs text-teal-300 flex items-center justify-between border border-teal-500/20">
                  <span>Selected video: {selectedFiles[0].name} ({(selectedFiles[0].size / (1024 * 1024)).toFixed(1)} MB)</span>
                  <button onClick={() => setSelectedFiles([])} className="text-red-400 hover:text-red-300">Remove</button>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Model / Text Description */}
          {activeTab === "text" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Gadget Name, Model Number, or Natural Description
                </label>
                <textarea
                  rows={3}
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  placeholder="e.g. My laptop is an ASUS ROG Zephyrus G14 with an RTX 3060 graphics card and 144Hz display. Model label reads GA402."
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-sm focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>
          )}

          {/* Tab 4: Troubleshooting / Symptoms */}
          {activeTab === "troubleshoot" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Device Model (if known)
                </label>
                <input
                  type="text"
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  placeholder="e.g. Sony WH-1000XM5 or Dell XPS 15 9520"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition mb-3"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Describe the Symptoms or Failure Mode
                </label>
                <textarea
                  rows={3}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. The laptop overheats and suddenly shuts off during gaming. The left fan makes a rattling noise and Wi-Fi disconnects intermittently."
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-sm focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>
          )}

          {/* Example Quick-Pick Pills */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Try Example:</span>
            <button
              onClick={() => setExample("ASUS ROG Zephyrus G14 gaming laptop GA402RK", "", "text")}
              className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50 transition"
            >
              ASUS Zephyrus G14
            </button>
            <button
              onClick={() => setExample("Sony WH-1000XM5 Wireless Noise Cancelling Headphones", "", "text")}
              className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50 transition"
            >
              Sony WH-1000XM5
            </button>
            <button
              onClick={() => setExample("Intel Core i9-14900K 24-core Desktop Processor", "", "text")}
              className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50 transition"
            >
              Intel Core i9-14900K
            </button>
            <button
              onClick={() => setExample("Apple MacBook Pro 16-inch M3 Max (A2991)", "Powers on but display remains black. External monitor works via HDMI.", "troubleshoot")}
              className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50 transition"
            >
              MacBook Pro Black Screen
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6 flex justify-end">
            <button
              disabled={isAnalyzing}
              onClick={handleAnalyze}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 flex items-center space-x-2 transition disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Device...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze & Generate Intelligence Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Processing Pipeline Status */}
        {isAnalyzing && (
          <div className="bg-slate-900/60 border border-teal-500/30 rounded-2xl p-6 shadow-xl space-y-4 animate-pulse">
            <div className="flex items-center justify-between text-xs font-semibold text-teal-400">
              <span>{stageDescriptions[analysisStage] || "Processing hardware intelligence..."}</span>
              <span>{analysisStage * 20}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-cyan-400 h-2 transition-all duration-500 rounded-full"
                style={{ width: `${analysisStage * 20}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Results Dashboard */}
        {analysisReport && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header: Identity & Confidence Banner */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {analysisReport.identity?.category || "Device"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    {analysisReport.identity?.generation || "Verified Generation"}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {analysisReport.identity?.brand} {analysisReport.identity?.modelName}
                </h2>
                <p className="text-xs text-slate-400">
                  Exact Identifier: <span className="text-teal-300 font-mono font-semibold">{analysisReport.identity?.exactModelNumber || "Model Family Verified"}</span>
                </p>
                <p className="text-xs text-slate-400 max-w-2xl">
                  {analysisReport.identity?.confidenceRationale}
                </p>
              </div>

              {/* Confidence Score & Action */}
              <div className="flex flex-col items-center md:items-end space-y-3 w-full md:w-auto">
                <div className="flex items-center space-x-3 bg-slate-800/60 border border-slate-700/60 px-4 py-2.5 rounded-xl">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Confidence Score</p>
                    <p className="text-xl font-black text-teal-400">
                      {analysisReport.identity?.confidenceScore || 95}%
                    </p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-teal-400" />
                </div>

                <button
                  disabled={passportSaved || passportLoading}
                  onClick={handleSavePassport}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
                    passportSaved
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  }`}
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>{passportSaved ? "Saved to Digital Passport" : "Save to Digital Passport"}</span>
                </button>
              </div>
            </div>

            {/* Grid: Specs & Visual Fingerprint */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Technical Specifications (2 cols) */}
              <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <Cpu className="w-5 h-5 text-teal-400" />
                  <h3 className="font-bold text-base text-slate-100">Technical Specifications</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {Object.entries(analysisReport.technicalSpecs || {}).map(([key, val]) => (
                    <div key={key} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400/80">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                      <p className="text-slate-200 font-medium">{String(val) || "Not applicable"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Fingerprint & Clues (1 col) */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-base text-slate-100">Visual Fingerprint</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                    <span className="font-semibold text-slate-400 block mb-1">Identified Ports & IO:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                      {analysisReport.visualFingerprint?.portsAndConnectors?.map((p: string, i: number) => (
                        <li key={i}>{p}</li>
                      )) || <li>Standard connectors</li>}
                    </ul>
                  </div>

                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                    <span className="font-semibold text-slate-400 block mb-1">Chassis & Architecture:</span>
                    <p className="text-slate-300">{analysisReport.visualFingerprint?.chassisDesign || "Standard chassis design"}</p>
                  </div>

                  {analysisReport.visualFingerprint?.ocrExtractedLabels?.length > 0 && (
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                      <span className="font-semibold text-slate-400 block mb-1">OCR Read Labels & Identifiers:</span>
                      <div className="flex flex-wrap gap-1">
                        {analysisReport.visualFingerprint.ocrExtractedLabels.map((tag: string, i: number) => (
                          <span key={i} className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-teal-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Upgrade Compatibility Simulator & AI Diagnostics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hardware Compatibility Simulator */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <HardDrive className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-base text-slate-100">Hardware Compatibility Simulator</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div>
                      <p className="font-bold text-slate-200">RAM Expansion Limit</p>
                      <p className="text-slate-400">{analysisReport.hardwareCompatibility?.maxRamSupported || "Soldered or standard limit"}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                      analysisReport.hardwareCompatibility?.ramUpgradable ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                    }`}>
                      {analysisReport.hardwareCompatibility?.ramUpgradable ? "Upgradable" : "Fixed / Soldered"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div>
                      <p className="font-bold text-slate-200">Storage Slots & Interfaces</p>
                      <p className="text-slate-400">{analysisReport.hardwareCompatibility?.storageSlots || "M.2 NVMe supported"}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                      analysisReport.hardwareCompatibility?.storageUpgradable ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                    }`}>
                      {analysisReport.hardwareCompatibility?.storageUpgradable ? "Expandable" : "Fixed"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                    <p className="font-bold text-slate-200 mb-1">Power Adapter & Charging Protocol</p>
                    <p className="text-slate-300">{analysisReport.hardwareCompatibility?.powerRequirements || "Standard factory adapter"}</p>
                  </div>
                </div>
              </div>

              {/* AI Fault Detective & Diagnostics */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base text-slate-100">AI Fault Detective & Safe Checks</h3>
                </div>

                <div className="space-y-3 text-xs">
                  {analysisReport.diagnostics?.probableCauses?.map((causeObj: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{causeObj.cause}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                          {causeObj.likelihood} Likelihood
                        </span>
                      </div>
                      <p className="text-slate-400">
                        <strong className="text-teal-400">Safe Check:</strong> {causeObj.safeChecks}
                      </p>
                      {causeObj.whenToSeekProfessionalRepair && (
                        <p className="text-slate-500 text-[11px]">
                          <strong>Repair Threshold:</strong> {causeObj.whenToSeekProfessionalRepair}
                        </p>
                      )}
                    </div>
                  )) || (
                    <p className="text-slate-400">No active faults reported. Hardware appears in normal functional status.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: Source Verification & Evidence Engine */}
            {analysisReport.verifiedSources?.length > 0 && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-400" />
                    <h3 className="font-bold text-base text-slate-100">
                      Verified Authoritative Sources & Manuals ({analysisReport.verifiedSources.length})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">Retrieved via Tavily Search Engine</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {analysisReport.verifiedSources.map((source: any, i: number) => (
                    <a
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 hover:border-teal-500/40 transition group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-200 group-hover:text-teal-300 transition line-clamp-1">
                            {source.title}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 flex-shrink-0 ml-2" />
                        </div>
                        <p className="text-slate-400 text-[11px] line-clamp-2">{source.snippet}</p>
                      </div>
                      <span className="font-mono text-[10px] text-teal-400/70 mt-2 truncate">{source.url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Row 4: Natural Language Technical Copilot */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <MessageSquare className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base text-slate-100">Natural-Language Technical Copilot</h3>
              </div>
              <p className="text-xs text-slate-400">
                Ask specific technical questions about this {analysisReport.identity?.brand} {analysisReport.identity?.modelName}.
                Answers are grounded directly in its verified hardware specs and repairability data.
              </p>

              {/* Chat history */}
              {copilotChat.length > 0 && (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {copilotChat.map((msg, i) => (
                    <div key={i} className="space-y-1 text-xs">
                      <div className="bg-slate-800/80 p-2.5 rounded-xl text-slate-200 font-medium">
                        Q: {msg.q}
                      </div>
                      <div className="bg-teal-950/40 border border-teal-500/20 p-3 rounded-xl text-slate-300 whitespace-pre-wrap">
                        {msg.a}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Input */}
              <form onSubmit={handleAskCopilot} className="flex gap-2">
                <input
                  type="text"
                  value={copilotQuestion}
                  onChange={(e) => setCopilotQuestion(e.target.value)}
                  placeholder="e.g. Can I upgrade this model to 64GB RAM? Which USB-C port supports display output?"
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  disabled={copilotLoading}
                  className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {copilotLoading ? "Thinking..." : "Ask Copilot"}
                </button>
              </form>
            </div>

            {/* Row 5: Retail Price Comparison (Amazon vs Flipkart) */}
            {analysisReport.priceComparison && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-blue-500/20 border border-amber-500/30">
                      <ShoppingCart className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                        Retail Price Comparison: Amazon vs Flipkart
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-300 border border-teal-500/20">
                          Live Verified
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Real-time market prices, deals, and ratings for {analysisReport.identity?.brand} {analysisReport.identity?.modelName}
                      </p>
                    </div>
                  </div>

                  {analysisReport.priceComparison.savingsText && (
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold self-start sm:self-auto">
                      <TrendingDown className="w-4 h-4" />
                      <span>{formatPrice(analysisReport.priceComparison.savingsText)}</span>
                    </div>
                  )}
                </div>

                {/* Side-by-Side Cards (Amazon vs Flipkart) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Amazon Card */}
                  {analysisReport.priceComparison.amazon && (
                    <div className="bg-gradient-to-b from-slate-950/80 to-slate-900/60 border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-lg hover:border-amber-500/60 transition group flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-black tracking-tight text-white flex items-center">
                              <span className="text-amber-400">amazon</span>
                              <span className="text-xs text-slate-400 ml-1">.in</span>
                            </span>
                            {analysisReport.priceComparison.amazon.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {analysisReport.priceComparison.amazon.badge}
                              </span>
                            )}
                          </div>
                          {analysisReport.priceComparison.bestPlatform === "Amazon" && (
                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                              Best Deal
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-baseline space-x-2">
                            <span className="text-2xl sm:text-3xl font-black text-amber-300">
                              {formatPrice(analysisReport.priceComparison.amazon.price)}
                            </span>
                            {analysisReport.priceComparison.amazon.originalPrice && (
                              <span className="text-xs text-slate-500 line-through">
                                {formatPrice(analysisReport.priceComparison.amazon.originalPrice)}
                              </span>
                            )}
                            {analysisReport.priceComparison.amazon.discount && (
                              <span className="text-xs font-bold text-emerald-400">
                                {analysisReport.priceComparison.amazon.discount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {analysisReport.priceComparison.amazon.delivery || "Free Prime Delivery"}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-300">
                          <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Rating</span>
                            <span className="font-semibold text-amber-400">★ {analysisReport.priceComparison.amazon.rating || "4.4 / 5"}</span>
                          </div>
                          <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Stock Status</span>
                            <span className="font-semibold text-emerald-400">{analysisReport.priceComparison.amazon.availability || "In Stock"}</span>
                          </div>
                        </div>
                      </div>

                      <a
                        href={analysisReport.priceComparison.amazon.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-4 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition group-hover:scale-[1.01]"
                      >
                        <span>View & Buy on Amazon</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {/* Flipkart Card */}
                  {analysisReport.priceComparison.flipkart && (
                    <div className="bg-gradient-to-b from-slate-950/80 to-slate-900/60 border border-blue-500/30 rounded-2xl p-5 space-y-4 shadow-lg hover:border-blue-500/60 transition group flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-black tracking-tight text-white flex items-center">
                              <span className="text-blue-400">Flipkart</span>
                              <span className="text-amber-400 text-xs ml-0.5">✦</span>
                            </span>
                            {analysisReport.priceComparison.flipkart.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                {analysisReport.priceComparison.flipkart.badge}
                              </span>
                            )}
                          </div>
                          {analysisReport.priceComparison.bestPlatform === "Flipkart" && (
                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                              Best Deal
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-baseline space-x-2">
                            <span className="text-2xl sm:text-3xl font-black text-blue-300">
                              {formatPrice(analysisReport.priceComparison.flipkart.price)}
                            </span>
                            {analysisReport.priceComparison.flipkart.originalPrice && (
                              <span className="text-xs text-slate-500 line-through">
                                {formatPrice(analysisReport.priceComparison.flipkart.originalPrice)}
                              </span>
                            )}
                            {analysisReport.priceComparison.flipkart.discount && (
                              <span className="text-xs font-bold text-emerald-400">
                                {analysisReport.priceComparison.flipkart.discount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {analysisReport.priceComparison.flipkart.delivery || "Free Delivery by Tomorrow"}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-300">
                          <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Rating</span>
                            <span className="font-semibold text-amber-400">★ {analysisReport.priceComparison.flipkart.rating || "4.3 / 5"}</span>
                          </div>
                          <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Stock Status</span>
                            <span className="font-semibold text-emerald-400">{analysisReport.priceComparison.flipkart.availability || "In Stock"}</span>
                          </div>
                        </div>
                      </div>

                      <a
                        href={analysisReport.priceComparison.flipkart.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-4 py-2.5 px-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 transition group-hover:scale-[1.01]"
                      >
                        <span>View & Buy on Flipkart</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Insights & Bank Offers Note */}
                {analysisReport.priceComparison.insights && (
                  <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400 flex items-start space-x-2">
                    <Info className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-300">E-Commerce Market Insights: </span>
                      <span>{formatPrice(analysisReport.priceComparison.insights)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Services Health Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base text-slate-100">Live Service Architecture</h3>
              </div>
              <button
                onClick={() => setStatusModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { name: "Neon Serverless Postgres", status: serviceStatus?.postgres },
                { name: "Neon S3 Object Storage (Assets)", status: serviceStatus?.storage },
                { name: "Neon Auth (JWKS)", status: serviceStatus?.auth },
                { name: "Neon Edge Functions", status: serviceStatus?.functions },
                { name: "Google Gemini Multimodal AI", status: serviceStatus?.gemini },
                { name: "Tavily Search API Engine", status: serviceStatus?.tavily },
              ].map((svc, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <span className="font-bold text-slate-200 block">{svc.name}</span>
                    <span className="text-[11px] text-slate-400">{svc.status?.message || "Operational"}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    svc.status?.ok ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                  }`}>
                    {svc.status?.ok ? "ONLINE" : "OFFLINE"}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Digital Passports Drawer */}
      {showPassportDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full p-6 flex flex-col space-y-4 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BookmarkPlus className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-base text-slate-100">Saved Digital Passports</h3>
              </div>
              <button
                onClick={() => setShowPassportDrawer(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-3">
              {savedPassports.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  No devices saved to your passport yet. Analyze a gadget and click &quot;Save to Digital Passport&quot;.
                </p>
              ) : (
                savedPassports.map((dev: any) => (
                  <div key={dev.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 text-sm">{dev.device_name}</span>
                      <span className="text-teal-400 font-mono text-[10px]">{dev.model_number || dev.brand}</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{dev.user_notes}</p>
                    <span className="text-[10px] text-slate-500 block pt-1">
                      Saved: {new Date(dev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
