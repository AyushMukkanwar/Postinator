'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getSupabaseFrontendClient as createClient } from '@/lib/supabase/client';
import { Upload, Video, X } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface MediaUploadAreaProps {
  media: { url: string; type: 'image' | 'video' }[];
  onUploadComplete: (url: string, type: 'image' | 'video') => void;
  onRemove: (index: number) => void;
  maxFiles: number;
  acceptedTypes: string[];
  disabled?: boolean;
  onUploadStart: () => void;
  onUploadEnd: () => void;
}

export function MediaUploadArea({
  media,
  onUploadComplete,
  onRemove,
  maxFiles,
  acceptedTypes,
  disabled = false,
  onUploadStart,
  onUploadEnd,
}: MediaUploadAreaProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Fake progress simulator for better UX (Supabase doesn't give granular progress for small files easily)
  const simulateProgress = () => {
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    return interval;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset Input
    e.target.value = '';

    // Validate validations
    if (!acceptedTypes.includes(file.type)) {
      setError(`Invalid file type. Supported: ${acceptedTypes.join(', ')}`);
      return;
    }

    if (media.length >= maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    // Size limit (e.g. 5MB for images, 50MB for videos)
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File too large. Max size: ${isVideo ? '50MB' : '5MB'}`);
      return;
    }

    setError(null);
    setIsUploading(true);
    onUploadStart();
    const progressInterval = simulateProgress();

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('post-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('post-media')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      onUploadComplete(publicUrlData.publicUrl, isVideo ? 'video' : 'image');
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed');
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
      onUploadEnd();
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {media.length < maxFiles && (
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled || isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-24 border-dashed border-2 flex flex-col gap-2 hover:bg-accent/50 transition-colors"
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isUploading ? 'Uploading...' : 'Click to Upload Media'}
            </span>
            <span className="text-xs text-muted-foreground/70">
              {media.length} / {maxFiles}
            </span>
          </Button>
        </div>
      )}

      {/* Progress Bar */}
      {isUploading && (
        <div className="space-y-1">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Preview Grid */}
      {media.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          <TooltipProvider>
            {media.map((item, index) => (
              <div
                key={index}
                className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border bg-background group"
              >
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                {/* Remove Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      disabled={disabled}
                      className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Remove media</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
