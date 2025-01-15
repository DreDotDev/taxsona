import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import '@solana/wallet-adapter-react-ui/styles.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: "TaxSona | Solana Transaction Analyzer",
  description: "Analyze your Solana wallet transactions with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true} className={`${spaceGrotesk.variable}`}>
        {children}
      </body>
    </html>
  );
}