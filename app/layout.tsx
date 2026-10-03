import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToasterProvider } from '@/components/providers/toaster-provider';

export const metadata: Metadata = {
  title: 'Pikkoza - Instant 1-on-1 Doubt Solving for Indian Students',
  description: 'Connect with expert IIT/NIT tutors instantly for 1-on-1 live doubt resolution, NEET, JEE, & CBSE prep.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ToasterProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
