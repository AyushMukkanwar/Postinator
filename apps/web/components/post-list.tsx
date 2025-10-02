'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Linkedin,
  Twitter,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { getPosts } from '@/actions/post/get-posts';
import { usePostStore } from '@/store/post-store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PostListProps {
  status: string;
}

export function PostList({ status }: PostListProps) {
  const { postsByStatus, setPosts } = usePostStore();
  const posts = postsByStatus[status] || [];
  const [loading, setLoading] = useState(posts.length === 0);

  useEffect(() => {
    async function fetchPosts() {
      if (posts.length > 0) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const result = await getPosts(status);
        if (result.data) {
          setPosts(status, result.data);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [status, posts.length, setPosts]);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'LINKEDIN':
        return <Linkedin className="h-4 w-4 text-blue-600" />;
      case 'TWITTER':
        return (
          <Twitter className="h-4 w-4 text-slate-700 dark:text-slate-300" />
        );
      default:
        return null;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'LINKEDIN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'TWITTER':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-4" />
        <p className="text-muted-foreground">Loading posts...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          {status === 'SCHEDULED' ? (
            <Clock className="h-8 w-8 text-orange-500" />
          ) : (
            <CheckCircle className="h-8 w-8 text-orange-500" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No posts found
        </h3>
        <p className="text-muted-foreground">
          {status === 'SCHEDULED'
            ? "You don't have any scheduled posts yet."
            : "You haven't published any posts yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card
          key={post.id}
          className="border-2 hover:border-orange-200 dark:hover:border-orange-800 transition-all"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <Badge className={getPlatformColor(post.platform)}>
                  <span className="flex items-center space-x-1">
                    {getPlatformIcon(post.platform)}
                    <span className="ml-1">{post.platform}</span>
                  </span>
                </Badge>
                {status === 'PUBLISHED' && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Published
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Post Content */}
            <div>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>
            </div>

            {/* Post Metadata */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.scheduledFor)}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                ID: {post.id.slice(0, 8)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
