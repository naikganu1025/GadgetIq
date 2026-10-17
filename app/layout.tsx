import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GADGETIQ — AI Gadget Intelligence & Diagnostics",
  description: "Enterprise multimodal device identification, verified technical specifications, and hardware diagnostics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
