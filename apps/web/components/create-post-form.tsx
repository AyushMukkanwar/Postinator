'use client';

import { createPost } from '@/actions/post/create-post';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePostStore } from '@/store/post-store';
import { useUserStore } from '@/store/userStore';
import { PlatformLimits } from '@repo/database';
import {
  AlertCircle,
  Calendar,
  Clock,
  Linkedin,
  Send,
  Twitter,
  Upload,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { MediaUploadArea } from './media-upload-area';

interface PostFormData {
  content: string;
  scheduledFor: string;
  socialAccountId: string;
}

export function CreatePostForm() {
  const { user, addOrUpdateSocialAccount } = useUserStore();
  const { addPost } = usePostStore();

  // Initialize with first active account
  const activeAccounts =
    user?.socialAccounts?.filter((acc) => acc.isActive) || [];
  const initialAccountId =
    activeAccounts.length > 0 ? activeAccounts[0].id : '';

  const [formData, setFormData] = useState<PostFormData>({
    content: '',
    scheduledFor: '',
    socialAccountId: initialAccountId,
  });

  const [mediaFiles, setMediaFiles] = useState<
    { url: string; type: 'image' | 'video' }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [minDateTime, setMinDateTime] = useState('');

  // Get current account and limits
  const selectedAccount = activeAccounts.find(
    (acc) => acc.id === formData.socialAccountId
  );
  const currentLimits = selectedAccount
    ? PlatformLimits[selectedAccount.platform]
    : null;

  useEffect(() => {
    // If no account selected but we have active ones, select first
    if (!formData.socialAccountId && activeAccounts.length > 0) {
      setFormData((prev) => ({
        ...prev,
        socialAccountId: activeAccounts[0].id,
      }));
    }

    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localDateTime = new Date(now.getTime() - offset)
      .toISOString()
      .slice(0, 16);
    setMinDateTime(localDateTime);
  }, [user?.socialAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
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

    if (isUploading) {
      setError('Please wait for media upload to finish.');
      return;
    }

    if (!selectedAccount || !currentLimits) {
      setError('Invalid social account selected.');
      return;
    }

    // Strict validation against limits
    if (formData.content.length > currentLimits.maxTextLength) {
      setError(
        `Content is too long for ${selectedAccount.platform} (Max: ${currentLimits.maxTextLength})`
      );
      return;
    }

    if (mediaFiles.length > currentLimits.maxMediaCount) {
      setError(`Too many files. Max ${currentLimits.maxMediaCount} allowed.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduledDate = new Date(formData.scheduledFor).toISOString();

      const postData = {
        content: formData.content,
        scheduledFor: scheduledDate,
        platform: selectedAccount.platform,
        socialAccountId: formData.socialAccountId,
        media: mediaFiles.map((m) => m.url), // Assuming API handles array of strings, otherwise might need update
      };

      const result = await createPost(postData);

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        addPost(result.data);
        setSuccess('Post scheduled successfully!');
        setFormData({
          content: '',
          scheduledFor: '',
          socialAccountId:
            activeAccounts.length > 0 ? activeAccounts[0].id : '',
        });
        setMediaFiles([]);
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

  const isTextTooLong = currentLimits
    ? formData.content.length > currentLimits.maxTextLength
    : false;

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
          Schedule your content across your social accounts
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

          {/* Platform Selection - Moved to Top */}
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
                {activeAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center space-x-2">
                      {account.platform === 'LINKEDIN' && (
                        <Linkedin className="h-4 w-4 text-blue-600" />
                      )}
                      {account.platform === 'TWITTER' && (
                        <Twitter className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                      )}
                      <span>{account.username || account.displayName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose which account to publish your post to
            </p>
          </div>

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
              className={`min-h-[120px] focus:ring-2 resize-none ${isTextTooLong ? 'border-red-500 ring-red-500' : 'focus:ring-orange-400'}`}
              required
            />
            {currentLimits && (
              <div className="flex justify-between text-sm text-muted-foreground w-full">
                <span>Write engaging content</span>
                <span className={isTextTooLong ? 'text-red-500 font-bold' : ''}>
                  {formData.content.length} / {currentLimits.maxTextLength}{' '}
                  characters
                </span>
              </div>
            )}
          </div>

          {/* Media Upload Area */}
          {currentLimits && selectedAccount?.platform !== 'TWITTER' && (
            <div className="space-y-2">
              <Label className="text-base font-medium">
                Media ({mediaFiles.length}/{currentLimits.maxMediaCount})
              </Label>
              <MediaUploadArea
                media={mediaFiles}
                onUploadComplete={(url, type) =>
                  setMediaFiles((prev) => [...prev, { url, type }])
                }
                onRemove={(index) =>
                  setMediaFiles((prev) => prev.filter((_, i) => i !== index))
                }
                maxFiles={currentLimits.maxMediaCount}
                acceptedTypes={currentLimits.supportedMediaTypes}
                disabled={isSubmitting}
                onUploadStart={() => setIsUploading(true)}
                onUploadEnd={() => setIsUploading(false)}
              />
            </div>
          )}

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

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || isUploading || isTextTooLong}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold shadow-lg py-3"
            >
              {isSubmitting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling Post...
                </>
              ) : isUploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-bounce" />
                  Uploading Media...
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
