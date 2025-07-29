'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { exchangeToken } from '@/actions/auth';

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

export async function handleAfterSignIn() {
  try {
    const { token, user } = await exchangeToken();
    // Assuming the token needs to be stored somewhere, e.g., in cookies or session storage
    // For server actions, we might not need to store it if subsequent requests are authenticated via other means.

    // You might want to revalidate paths or redirect the user upon successful sign-in.
    // For example, revalidate the dashboard path:
    // revalidatePath('/dashboard');

    return { token, user };
  } catch (error) {
    console.error('Error during token exchange:', error);
    // Potentially redirect to an error page or return an error state
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
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect('/login');
  }
  return data.user;
}
