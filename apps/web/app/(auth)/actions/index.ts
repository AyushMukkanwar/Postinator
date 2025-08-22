'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { exchangeTokenOnCallback } from '@/actions/auth';

export async function signInWithEmailAndPassword(data: {
  // Corrected typo: signIn
  email: string;
  password: string;
}) {
  const supabase = await createSupabaseServerClient();
  const result = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  return JSON.parse(JSON.stringify(result)); // Serialize for client components
}

export async function signUpWithEmailAndPassword(data: {
  email: string;
  password: string;
}) {
  const supabase = await createSupabaseServerClient();

  const result = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login`,
    },
  });

  return JSON.parse(JSON.stringify(result));
}

export async function handleAfterSignIn(accessToken: string) {
  try {
    const { token, user } = await exchangeTokenOnCallback(accessToken);

    return { token, user };
  } catch (error) {
    console.error('5. Error during token exchange:', error);
    throw new Error('Failed to sign in. Please try again.');
  }
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error logging out:', error);
    redirect('/error');
  }

  redirect('/login');
}

export async function checkAuth() {
  // console.log('**************************Server auth check starting...');
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  // console.log('Server session:', data ? 'exists' : 'null');
  // console.log('data = ', data);

  // console.log('Server getClaims error:', error);

  if (error || !data?.claims) {
    redirect('/login');
  }
  return data.claims;
}
