import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevInterview / 海外技术面试助手",
  description: "海外技术面试题库生成器",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}