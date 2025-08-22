import { CreatePostForm } from '@/components/create-post-form';
import { checkAuth } from '../(auth)/actions';

export default async function DashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Create and schedule your social media posts
          </p>
        </div>

        {/* Create Post Form */}
        <CreatePostForm />

        {/* Quick Stats Cards */}
        {/* Stats cards removed as per updates */}
      </div>
    </div>
  );
}
