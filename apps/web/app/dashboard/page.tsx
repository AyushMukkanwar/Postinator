'use client';

import type { FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';

import useAxiosAuth from '../../lib/hooks/useAxiosAuth';
import { getSupabaseFrontendClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  LogOut,
  Plus,
  FileText,
  AlertCircle,
  Loader2,
  UserIcon,
  TestTube,
  Calendar,
} from 'lucide-react';

// Define a type for our notes
interface Note {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const supabase = getSupabaseFrontendClient();
  const axiosAuth = useAxiosAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing notes for the user
  const fetchNotes = async () => {
    if (!user) return;
    setIsLoadingNotes(true);
    setError(null);
    try {
      const response = await axiosAuth.get<Note[]>('/notes');
      setNotes(response.data);
    } catch (err: any) {
      console.error('Error fetching notes:', err);
      setError(
        'Failed to fetch notes. ' + (err.response?.data?.message || err.message)
      );
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Handle new note submission
  const handleCreateNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) {
      setError('Note content cannot be empty.');
      return;
    }
    setError(null);
    try {
      const response = await axiosAuth.post<Note>('/notes', {
        content: newNoteContent,
      });
      setNotes((prevNotes) => [response.data, ...prevNotes]); // Add new note to the top
      setNewNoteContent(''); // Clear input
    } catch (err: any) {
      console.error('Error creating note:', err);
      setError(
        'Failed to create note. ' + (err.response?.data?.message || err.message)
      );
    }
  };

  // Original function to fetch generic protected data (can be kept for testing)
  const getProtectedData = async () => {
    try {
      const response = await axiosAuth.get('/protected'); // Uses the hook instance
      console.log('Protected data:', response.data);
      alert(
        'Generic Protected Data:\n' + JSON.stringify(response.data, null, 2)
      );
    } catch (err) {
      console.error('Error fetching protected data:', err);
      alert('Failed to fetch generic protected data. Check console.');
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
      } else {
        setUser(data.session.user);
      }
    };
    checkSession();
  }, [supabase, router]);

  // Fetch notes when user is available
  useEffect(() => {
    if (user) {
      fetchNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Run only when user object changes

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-slate-600 mb-4" />
            <p className="text-slate-600 text-center">
              Loading session... If this takes too long,{' '}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                try logging in again
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-600">Welcome back, {user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={getProtectedData}
                className="hidden sm:flex"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test API
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Note Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Note
                </CardTitle>
                <CardDescription>
                  Add a new note to your collection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateNote} className="space-y-4">
                  <Textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Write your note here..."
                    rows={4}
                    className="resize-none"
                    required
                  />
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </form>

                {/* Mobile Test Button */}
                <div className="sm:hidden mt-4">
                  <Button
                    variant="outline"
                    onClick={getProtectedData}
                    className="w-full"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Protected Route
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    <CardTitle>My Notes</CardTitle>
                  </div>
                  <Badge variant="secondary">{notes.length} notes</Badge>
                </div>
                <CardDescription>Your personal note collection</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {isLoadingNotes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-600 mr-2" />
                    <span className="text-slate-600">Loading notes...</span>
                  </div>
                ) : notes.length > 0 ? (
                  <div className="space-y-4">
                    {notes.map((note, index) => (
                      <div key={note.id}>
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <p className="text-slate-900 whitespace-pre-wrap mb-3">
                            {note.content}
                          </p>
                          <div className="flex items-center text-sm text-slate-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(note.created_at).toLocaleString()}
                          </div>
                        </div>
                        {index < notes.length - 1 && (
                          <Separator className="my-4" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg font-medium mb-2">
                      No notes yet
                    </p>
                    <p className="text-slate-500">
                      Create your first note to get started!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
