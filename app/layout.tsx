import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VidyaaraaAiWidget } from "@/components/ai/VidyaaraaAiWidget";
import { VisitorTracker } from "@/components/analytics/VisitorTracker";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#00D4AA",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Vidyaaraa — VTU Engineering Resources, Calculators & AI Copilot",
  description: "Vidyaaraa brings college notes, previous-year papers, SGPA and CGPA calculators, study tools and placement resources together in one place for VTU and engineering students.",
  keywords: "Vidyaaraa, VTU, SGPA, CGPA, engineering, notes, previous year papers, PYQ, calculator, study planner, placement prep, college resources, Vidyaaraa AI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vidyaaraa",
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text-1)] transition-colors duration-200">
        <ThemeProvider>
          <VisitorTracker />
          <Navbar />
          <main className="flex-grow pt-16" id="main-content">
            {children}
          </main>
          <Footer />
          <VidyaaraaAiWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
