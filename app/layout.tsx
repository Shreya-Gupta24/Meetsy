import type { Metadata } from "next";
import { Outfit, Geist } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import HeaderWrapper from "@/components/layout/HeaderWrapper";

const outfitFont = Outfit({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});


export const metadata: Metadata = {
  title: "Meetsy",
  description: "Meetsy is a ai learning platform to connect with other leaners in the community and Learn together",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${outfitFont.className} antialiased`}>
          {/* <QueryProvider> */}
            <HeaderWrapper />
            {children}
          {/* </QueryProvider> */}
        </body>
      </html>
    </ClerkProvider>
  );
}
