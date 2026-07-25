import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: 'LeadFlow — Lead Management for sales teams that move fast',
  description:
    'LeadFlow is a lead management platform: capture, assign, and close leads with a full activity trail your whole team can trust.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
