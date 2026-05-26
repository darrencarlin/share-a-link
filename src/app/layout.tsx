import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Share a Link — AI-Organized Link Sharing",
    template: "%s",
  },
  description:
    "Paste any URL and AI instantly categorizes and summarizes it. Share your curated link board with friends.",
  openGraph: {
    title: "Share a Link — AI-Organized Link Sharing",
    description:
      "Paste any URL and AI instantly categorizes and summarizes it. Share your curated link board with friends.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Share a Link — AI-Organized Link Sharing",
    description:
      "Paste any URL and AI instantly categorizes and summarizes it. Share your curated link board with friends.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
