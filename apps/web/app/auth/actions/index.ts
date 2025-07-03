// apps/web/src/app/auth/actions/index.ts
"use server";

import { createSupabaseServerClient } from "../../../lib/supabase/server"; // Assuming @ is configured for src

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
  name?: string;
  avatar?: string;
}) {
  const supabase = await createSupabaseServerClient();
  
  // First, sign up with Supabase
  const result = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login`,
    },
  });

  // If signup was successful and user was created
  if (result.data.user && !result.error) {
    try {
      // Create user in your backend using the access token
      await createUserInBackendWithAuth({
        email: data.email,
        name: data.name || result.data.user.user_metadata?.full_name || "Anonymous User",
        avatar: data.avatar || result.data.user.user_metadata?.avatar_url || ""
      }, result.data.session?.access_token);
      
    } catch (backendError) {
      console.error('Error creating user in backend:', backendError);
      // Backend creation failed but Supabase signup succeeded
      // You might want to handle this scenario appropriately
    }
  }

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
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:3001";
    
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
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend user creation failed: ${response.status} ${errorText}`);
    }

    const createdUser = await response.json();
    console.log('User created in backend:', createdUser);
    return createdUser;
    
  } catch (error) {
    console.error('Error calling backend:', error);
    throw error;
  }
}