export interface UserInfo {
  username: string;
  timezone: string;
  platforms: {
    linkedin: boolean;
    x: boolean;
  };
}

export async function saveUserInfo(data: UserInfo) {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log('Saving user info:', data);

  // In a real app, this would save to your backend
  localStorage.setItem('userInfo', JSON.stringify(data));

  return { success: true };
}

export function getUserInfo(): UserInfo | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('userInfo');
  return stored ? JSON.parse(stored) : null;
}
