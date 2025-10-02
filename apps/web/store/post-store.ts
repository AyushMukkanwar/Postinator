import { create } from 'zustand';
import { Post } from '@/types/post';

interface PostState {
  postsByStatus: {
    [status: string]: Post[];
  };
  setPosts: (status: string, posts: Post[]) => void;
  addPost: (post: Post) => void;
}

export const usePostStore = create<PostState>((set) => ({
  postsByStatus: {},
  setPosts: (status, posts) =>
    set((state) => ({
      postsByStatus: {
        ...state.postsByStatus,
        [status]: posts,
      },
    })),
  addPost: (post) =>
    set((state) => {
      const status = post.status;
      const postsForStatus = state.postsByStatus[status] || [];
      return {
        postsByStatus: {
          ...state.postsByStatus,
          [status]: [post, ...postsForStatus],
        },
      };
    }),
}));
