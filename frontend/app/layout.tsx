import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";

import { AuthProvider } from "@/components/auth/auth-provider";

import "./globals.css";

const sansFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans"
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"]
});

export const metadata: Metadata = {
  title: "LMS Platform",
  description: "Deployment-ready LMS frontend scaffold."
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html data-theme="dark" lang="en">
      <body className={`${sansFont.variable} ${monoFont.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
