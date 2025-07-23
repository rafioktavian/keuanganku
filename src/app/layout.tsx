import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import AppHeader from '@/components/layout/AppHeader';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import GoogleAnalytics from '@/components/layout/GoogleAnalytics';

export const metadata: Metadata = {
  title: 'KeuanganKu',
  description: 'Aplikasi pencatat keuangan pribadi Anda.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="bg-muted text-muted-foreground py-4 mt-auto">
                <div className="container mx-auto text-center text-sm">
                    © {new Date().getFullYear()} <a href="https://rafioktavian.github.io/portfolio/" target="_blank" rel="noopener noreferrer" className="hover:text-primary font-medium">Rafi Oktavian</a>. All Rights Reserved.
                </div>
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
