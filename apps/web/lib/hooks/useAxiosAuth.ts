// apps/web/src/lib/hooks/useAxiosAuth.ts
'use client';

import { useEffect } from 'react';
import { axiosAuth } from '../axios';
import { getSupabaseFrontendClient } from '../supabase/client'; // Path to your client.ts

const useAxiosAuth = () => {
  const supabase = getSupabaseFrontendClient();

  useEffect(() => {
    const requestIntercept = axiosAuth.interceptors.request.use(
      async (config) => {
        const { data: sessionData } = await supabase.auth.getSession(); // Renamed for clarity
        const accessToken = sessionData?.session?.access_token;

        if (accessToken && !config.headers['Authorization']) {
          // Check if accessToken exists
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // It's good practice to also handle response interceptors if you need to refresh tokens, etc.
    // For now, we only eject the request interceptor.

    return () => {
      axiosAuth.interceptors.request.eject(requestIntercept);
    };
  }, [supabase]); // Add supabase as a dependency

  return axiosAuth;
};

export default useAxiosAuth;
