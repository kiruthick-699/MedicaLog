import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/server/Navigation";

export const metadata: Metadata = {
  title: "App",
  description: "Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
