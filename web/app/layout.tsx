import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  description: "Talk to Foreman, the eve retro game factory.",
  title: "Foreman · Retro Game Factory",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
