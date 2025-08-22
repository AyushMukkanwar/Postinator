'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Linkedin,
  Twitter,
  Send,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserStore } from '@/store/userStore';
import { createPost } from '@/actions/post/create-post';

interface PostFormData {
  content: string;
  scheduledFor: string;
  socialAccountId: string;
}

export function CreatePostForm() {
  const [formData, setFormData] = useState<PostFormData>({
    content: '',
    scheduledFor: '',
    socialAccountId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user } = useUserStore();
  const [minDateTime, setMinDateTime] = useState('');

  useEffect(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localDateTime = new Date(now.getTime() - offset)
      .toISOString()
      .slice(0, 16);
    setMinDateTime(localDateTime);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !formData.content ||
      !formData.scheduledFor ||
      !formData.socialAccountId
    ) {
      setError('Please fill in all required fields');
      return;
    }

    if (!user?.timezone) {
      setError('Timezone not set. Please set your timezone in your profile.');
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduledDate = new Date(formData.scheduledFor).toISOString();
      const socialAccount = user?.socialAccounts?.find(
        (sa) => sa.id === formData.socialAccountId
      );

      if (!socialAccount) {
        setError('Invalid social account selected.');
        return;
      }

      const postData = {
        content: formData.content,
        scheduledFor: scheduledDate,
        platform: socialAccount.platform,
        socialAccountId: formData.socialAccountId,
      };

      console.log('Submitting post data:', postData);
      const result = await createPost(postData);
      console.log('Received result from createPost:', result);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Post scheduled successfully!');
        setFormData({
          content: '',
          scheduledFor: '',
          socialAccountId: '',
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof PostFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className="border-2 hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
            <Send className="h-4 w-4 text-white" />
          </div>
          <span>Create New Post</span>
        </CardTitle>
        <CardDescription>
          Schedule your content across your social accounts with optimal timing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              {success}
            </div>
          )}

          {/* Content Field */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-base font-medium">
              Content *
            </Label>
            <Textarea
              id="content"
              placeholder="What's on your mind? Share your thoughts, insights, or updates..."
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className="min-h-[120px] focus:ring-2 focus:ring-orange-400 resize-none"
              required
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Write engaging content that resonates with your audience
              </span>
              <span>{formData.content.length} characters</span>
            </div>
          </div>

          {/* Scheduled Date/Time Field */}
          <div className="space-y-2">
            <Label htmlFor="scheduledFor" className="text-base font-medium">
              Schedule Date & Time *
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="scheduledFor"
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) =>
                  handleInputChange('scheduledFor', e.target.value)
                }
                min={minDateTime}
                className="pl-10 focus:ring-2 focus:ring-orange-400"
                required
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Choose when you want this post to be published
            </p>
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="socialAccountId" className="text-base font-medium">
              Platform *
            </Label>
            <Select
              value={formData.socialAccountId}
              onValueChange={(value) =>
                handleInputChange('socialAccountId', value)
              }
              required
            >
              <SelectTrigger className="focus:ring-2 focus:ring-orange-400">
                <SelectValue placeholder="Select a platform to publish to" />
              </SelectTrigger>
              <SelectContent>
                {user?.socialAccounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center space-x-2">
                      {account.platform === 'LINKEDIN' && (
                        <Linkedin className="h-4 w-4 text-blue-600" />
                      )}
                      {account.platform === 'TWITTER' && (
                        <Twitter className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                      )}
                      <span>{account.displayName || account.username}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose which account to publish your post to
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold shadow-lg py-3"
            >
              {isSubmitting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling Post...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Schedule Post
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
