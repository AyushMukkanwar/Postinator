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
  // Corrected typo: signUp
  email: string;
  password: string;
}) {
  const supabase = await createSupabaseServerClient();
  const result = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login`, // Or your confirmation page
    },
  });
  return JSON.parse(JSON.stringify(result)); // Serialize for client components
}
