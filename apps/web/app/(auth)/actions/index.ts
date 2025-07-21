// apps/web/src/app/auth/actions/index.ts
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

// Server-side function that mimics the axios auth behavior
async function createUserInBackendWithAuth(
  userData: {
    email: string;
    name: string;
    avatar: string;
  },
  accessToken?: string
) {
  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

    if (!backendUrl) {
      throw new Error('Backend URL not configured');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Check if user exists
    const getUserResponse = await fetch(
      `${backendUrl}/users/email/${userData.email}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (getUserResponse.ok) {
      const existingUser = await getUserResponse.json();
      return existingUser;
    }

    // If user does not exist, create them
    const response = await fetch(`${backendUrl}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Backend user creation failed: ${response.status} ${errorText}`
      );
    }

    const createdUser = await response.json();
    return createdUser;
  } catch (error) {
    console.error('Error calling backend:', error);
    throw error;
  }
}

export async function handleAfterSignIn(user: {
  email: string;
  name?: string;
  avatar?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const session = (await supabase.auth.getSession()).data.session;

  if (!session || !session.access_token) {
    throw new Error('No valid session. User is not authenticated.');
  }

  return await createUserInBackendWithAuth(
    {
      email: user.email,
      name: user.name || 'Anonymous User',
      avatar: user.avatar || '',
    },
    session.access_token
  );
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error logging out:', error);
    redirect('/error');
  }

  revalidatePath('/', 'layout');
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
