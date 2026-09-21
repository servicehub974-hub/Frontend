import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// NOTE: title / icons here are placeholders. In Phase 10 these become
// admin-controlled (site name, logo, favicon) loaded from the DB.
export const metadata: Metadata = {
  title: "NEXUS",
  description: "Premium digital content marketplace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-deep text-white">
        {/* Atmosphere — mounted once, sits behind everything */}
        <div className="film-grain" />
        <div className="ambient-top" />
        <div className="ambient-right" />

        <QueryProvider>
          <AuthProvider>
            <div className="relative z-10">{children}</div>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
