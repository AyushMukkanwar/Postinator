import { checkAuth } from '../(auth)/actions';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await checkAuth();
  return <>{children}</>;
}
