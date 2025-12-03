'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

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
  // Token exchange is no longer needed as we use Supabase session directly
  return { token: accessToken };
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error logging out:', error);
    redirect('/error');
  }

  try {
    const cookieStore = await cookies();
    cookieStore.set('access_token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  } catch (error) {
    console.error('Error clearing custom JWT:', error);
  }

  redirect('/login');
}

export async function checkAuth() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect('/login');
  }
  return data.claims;
}
