import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "RicettAI – Cucina dai video, guadagna punti",
  description:
    "Estrai ricette da TikTok, Instagram e YouTube con l'AI. Cucina, fotografi e scala la classifica.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "RicettAI",
    description: "Ricette AI da video. Cucina e guadagna punti.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={inter.variable}>
      <body className="bg-dark-900 text-white min-h-screen antialiased">
        <Providers>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: "#1f2937",
                color: "#fff",
                border: "1px solid #374151",
              },
              success: { iconTheme: { primary: "#2ECC71", secondary: "#fff" } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
