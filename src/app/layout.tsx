import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { CommandPalette } from "@/components/command-palette";
import { PWARegister } from "@/components/pwa-register";
import { AiChatFab } from "@/components/ai-chat-fab";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AshHQ — Personal Command Center",
  description: "Your personal command center for daily life.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0f",
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
      suppressHydrationWarning
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          {children}
          <CommandPalette />
          <PWARegister />
          <AiChatFab />
          <Toaster
            theme="dark"
            position="bottom-right"
            richColors
            toastOptions={{
              style: {
                background: "var(--color-surface-raised)",
                border: "1px solid var(--color-outline)",
                color: "var(--color-foreground)",
                fontFamily: "var(--font-jakarta)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
