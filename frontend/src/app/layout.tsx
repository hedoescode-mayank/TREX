import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "T.R.E.X | Career & City Intelligence",
  description: "Your AI Career Companion for Indian Freshers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white">
        {children}
      </body>
    </html>
  );
}
