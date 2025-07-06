import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { DashboardLayout } from '@/components/dashboard-layout';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Social Media Dashboard',
  description: 'Manage your social media presence',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const avatar =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const username = user?.user_metadata?.user_name;
  const email = user?.email;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DashboardLayout
            avatar={avatar || undefined}
            username={username || undefined}
            email={email || undefined}
          >
            {children}
          </DashboardLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
