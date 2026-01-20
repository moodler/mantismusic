import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Player from "@/components/Player";

export const metadata: Metadata = {
  title: "Mantis Music - Artist Player",
  description: "Custom Spotify-style music player for independent artists",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <Player />
      </body>
    </html>
  );
}
