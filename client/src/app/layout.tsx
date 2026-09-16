import type { Metadata } from "next";
import "../styles/globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata: Metadata = {
  title: "NIVA — Neural Intelligent Virtual Assistant",
  description: "A multimodal, secure and hostable personal AI assistant with voice, vision, gesture recognition, and intelligent task orchestration.",
  keywords: ["AI", "assistant", "multimodal", "voice", "vision", "gesture", "NIVA"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
