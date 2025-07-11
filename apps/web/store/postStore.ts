'use client';

import { create } from 'zustand';
import type { Post } from '@/types/postStatus';

type PostState = {
  posts: Post[];
  createPost: (post: Post) => void;
  readPosts: () => Post[];
  updatePost: (post: Post) => void;
  deletePost: (postId: string) => void;
};

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  createPost: (post) => set((state) => ({ posts: [...state.posts, post] })),
  readPosts: () => get().posts,
  updatePost: (post) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === post.id ? post : p)),
    })),
  deletePost: (postId) =>
    set((state) => ({
      posts: state.posts.filter((post) => post.id !== postId),
    })),
}));
