'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { handleAfterSignIn } from '../actions';
import { getSupabaseFrontendClient } from '../../../lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = getSupabaseFrontendClient();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          console.log(
            'SIGNED_IN event fired. Access token:',
            session?.access_token
          );
          if (session?.access_token) {
            handleAfterSignIn(session.access_token)
              .then(() => {
                router.push('/dashboard');
              })
              .catch((error) => {
                console.error('Error after sign in:', error);
                router.push('/login?error=unexpected_error');
              });
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Authenticating...</h1>
        <p className="text-gray-600">Please wait while we redirect you.</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
