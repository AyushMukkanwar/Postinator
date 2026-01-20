import { DashboardLayout } from '@/components/dashboard-layout';
import InitUser from '@/components/InitUser';
import { ThemeProvider } from '@/components/theme-provider';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import type React from 'react';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Social Media Dashboard',
  description: 'Manage your social media presence',
};

import { Toaster } from '@/components/ui/sonner';
import Providers from '@/providers/query-provider';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <body className={inter.className}>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <InitUser />
            <DashboardLayout>{children}</DashboardLayout>
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
