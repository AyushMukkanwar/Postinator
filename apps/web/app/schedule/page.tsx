import { checkAuth } from '../(auth)/actions';
import { PostList } from '@/components/post-list';

export default async function SchedulePage() {
  await checkAuth();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
            Scheduled Posts
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your upcoming posts across all platforms
          </p>
        </div>

        {/* Post List */}
        <PostList status="SCHEDULED" />
      </div>
    </div>
  );
}
