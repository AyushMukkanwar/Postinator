'use server';

import axios from '@/lib/axios';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const exchangeToken = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  try {
    const response = await axios.post('/auth/exchange-token', {
      supabaseToken: session.access_token,
    });
    return response.data;
  } catch (error) {
    console.error('Token exchange failed:', error);
    return null;
  }
};

export const exchangeTokenOnCallback = async (accessToken: string) => {
  try {
    const payload = { supabaseToken: accessToken };

    const response = await axios.post('/auth/exchange-token', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
