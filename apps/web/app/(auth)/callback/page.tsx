'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { handleAfterSignIn } from '../actions';
import { getSupabaseFrontendClient } from '../../../lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = getSupabaseFrontendClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          router.push('/login?error=auth_callback_error');
          return;
        }

        if (data.session) {
          await handleAfterSignIn();
          router.push('/dashboard');
        } else {
          setTimeout(async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
              router.push('/login?error=session_not_found_after_callback');
            }
          }, 2000);
        }
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        router.push('/login?error=unexpected_error');
      }
    };

    handleAuthCallback();
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
