import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vocis — AI Interview Coach",
  description:
    "Practice real voice interviews with AI. Get tailored questions for your role and resume, then receive scored feedback with strengths and areas to improve.",
  applicationName: "Vocis",
  keywords: [
    "interview prep",
    "mock interview",
    "AI interview",
    "voice interview",
    "career coach",
    "interview feedback",
    "job interview practice",
  ],
  openGraph: {
    title: "Vocis — AI Interview Coach",
    description:
      "Practice real voice interviews with AI. Tailored questions, scored feedback, and actionable improvements.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-gray-100">
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: "#18181b",
                color: "#f4f4f5",
                border: "1px solid rgba(255,255,255,0.1)",
              },
              success: {
                iconTheme: { primary: "#a78bfa", secondary: "#18181b" },
              },
              error: {
                iconTheme: { primary: "#f87171", secondary: "#18181b" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
