'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export const exchangeToken = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/exchange-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ supabaseToken: session.access_token }),
    });

    if (!response.ok) {
      throw new Error('Token exchange failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Token exchange failed:', error);
    return null;
  }
};

export const exchangeTokenOnCallback = async (accessToken: string) => {
  try {
    const response = await fetch(`${API_URL}/auth/exchange-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ supabaseToken: accessToken }),
    });

    if (!response.ok) {
      throw new Error('Token exchange failed');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};
