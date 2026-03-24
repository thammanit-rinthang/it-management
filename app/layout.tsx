import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";

  const baiJamjuree = localFont({
    src: [
      {
        path: "../public/fonts/BaiJamjuree-Regular.ttf",
        weight: "300",
        style: "normal",
      },
    ],
    variable: "--font-bai-jamjuree",
  });

export const metadata: Metadata = {
  title: "NDC IT Service Hub",
  description: "Next-generation IT Service portal for NDC employees and administrators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${baiJamjuree.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 font-sans">
         <Providers>
            {children}
         </Providers>
      </body>
    </html>
  );
}
