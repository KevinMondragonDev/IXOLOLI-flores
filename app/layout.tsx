import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { CursorProvider } from "@/components/Cursor";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IXOLOLI · Campo de poetas",
  description:
    "Cada día, un campo de flores único con una frase de un poeta del amor en español e inglés.",
  openGraph: {
    title: "IXOLOLI · Campo de poetas",
    description:
      "Un nuevo campo de flores y un nuevo poema cada día. Una experiencia bilingüe.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <CursorProvider>{children}</CursorProvider>
      </body>
    </html>
  );
}
