import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StoryBook - Client Gallery',
  description: 'A high-performance digital sanctuary for photographers to deliver, proof, and archive visual narratives.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
