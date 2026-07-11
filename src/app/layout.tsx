import type { Metadata } from "next";
import "./globals.css"; // Ensure standard Tailwind directives are present here

export const metadata: Metadata = {
  title: "GrowEasy AI CRM CSV Importer",
  description: "Intelligent extraction and schema normalization built with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
