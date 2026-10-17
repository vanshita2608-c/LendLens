import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'LendLens | Digital Lending Product Intelligence',
  description: 'Turning Lending Data Into Smarter Product Decisions — Executive analytics, credit intelligence, and strategy simulation for digital lending.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 pl-64 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
