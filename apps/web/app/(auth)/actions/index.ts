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

    // Prepare headers - same pattern as your axios interceptor
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if we have an access token (same logic as your interceptor)
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

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
    console.log('User created in backend:', createdUser);
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
