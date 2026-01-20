import { authenticatedFetch } from '@/lib/auth/auth-fetch';

// NOTE: Orval generates a function signature for the custom fetcher.
// We need to match that signature: (url, config) => Promise

export const customInstance = async <T>(config: {
  url: string;
  method: string;
  params?: any;
  data?: any;
  headers?: any;
  signal?: AbortSignal;
}): Promise<T> => {
  const { url, method, params, data, headers, signal } = config;

  // Append query params if they exist
  const searchParams = new URLSearchParams(params).toString();
  const fullUrl = searchParams ? `${url}?${searchParams}` : url;

  const response = await authenticatedFetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || 'Network response was not ok');
  }

  // Handle empty responses (like 204 No Content)
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
};

export default customInstance;
