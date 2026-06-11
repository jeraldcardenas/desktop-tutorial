import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BlockQuest Online',
  description: 'A pixel MMO overworld where every fight is a block-puzzle duel.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
