import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#f2f2f7',
};

export const metadata: Metadata = {
  title: 'SpendWise',
  description: 'Apple iOS Personal Finance & Budget App',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SpendWise',
  },
  applicationName: 'SpendWise',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} font-sans`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="h-full w-full bg-[#f2f2f7] text-[#1c1c1e] antialiased overscroll-none select-none">
        {children}
      </body>
    </html>
  );
}
