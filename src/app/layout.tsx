import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import AppHeader from '@/components/layout/AppHeader';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import GoogleAnalytics from '@/components/layout/GoogleAnalytics';

export const metadata: Metadata = {
  title: 'KeuanganKu - Aplikasi Pelacak Keuangan Pribadi',
  description: 'KeuanganKu adalah aplikasi intuitif untuk melacak pemasukan, pengeluaran, tujuan tabungan, investasi, dan utang/piutang. Ambil kendali atas keuangan pribadi Anda dengan mudah.',
  keywords: ['keuangan pribadi', 'lacak pengeluaran', 'manajemen uang', 'anggaran', 'investasi', 'tujuan tabungan', 'utang piutang', 'aplikasi keuangan'],
  authors: [{ name: 'Rafi Oktavian', url: 'https://rafioktavian.github.io/portfolio/' }],
  creator: 'Rafi Oktavian',
  publisher: 'Rafi Oktavian',
  openGraph: {
    title: 'KeuanganKu - Pelacak Keuangan Pribadi',
    description: 'Ambil kendali atas keuangan pribadi Anda dengan aplikasi KeuanganKu yang mudah digunakan.',
    url: 'https://keuanganku-gb3jq.web.app', // Ganti dengan URL produksi Anda
    siteName: 'KeuanganKu',
    images: [
      {
        url: '/og-image.png', // Pastikan Anda membuat gambar ini dan menaruhnya di folder public
        width: 1200,
        height: 630,
        alt: 'Tampilan Aplikasi KeuanganKu',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KeuanganKu - Pelacak Keuangan Pribadi',
    description: 'Lacak pengeluaran, atur anggaran, dan capai tujuan keuangan Anda dengan KeuanganKu.',
    images: ['/twitter-image.png'], // Pastikan Anda membuat gambar ini dan menaruhnya di folder public
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
