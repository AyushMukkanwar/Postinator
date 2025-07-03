'use client';

import type React from 'react';

import { useState } from 'react';
import { signUpWithEmailAndPassword } from '../actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, AlertCircle, CheckCircle, Shield } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Basic password strength check (optional, enhance as needed)
    if (password.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }

    const result = await signUpWithEmailAndPassword({ email, password });

    if (result.error) {
      console.error('Error signing up:', result.error);
      setError(`Error signing up: ${result.error.message}`);
    } else if (result.data.user && result.data.user.identities?.length === 0) {
      // This condition might indicate that "Confirm email" is disabled in Supabase settings
      // and the user is created directly but might not be "confirmed" yet.
      // Or, if email confirmation is ON, this means the user object was returned but awaits confirmation.
      setMessage(
        "Signup successful, but user might be inactive or already exists and needs confirmation. Please check Supabase logs/settings if this isn't expected."
      );
      // router.push('/login'); // Or a specific message page
    } else if (result.data.user) {
      // If Supabase "Confirm email" is ON (default), this user object is returned,
      // but the user is not active until they confirm their email.
      setMessage(
        'Registration successful! Please check your email to confirm your account.'
      );
      // Optionally clear form or redirect to a page indicating to check email
      // setEmail('');
      // setPassword('');
      // setConfirmPassword('');
      // router.push('/check-email-notice');
    } else {
      // Handle cases where user might be null but no error (e.g., user already registered but unconfirmed)
      // Supabase's signUp behavior for existing unconfirmed users can vary based on settings.
      setMessage(
        'Request processed. If you are new, please check your email for a confirmation link. If you already registered, try logging in or password recovery.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Create your account
          </CardTitle>
          <CardDescription className="text-slate-600">
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  className="pl-10 h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  type="password"
                  id="password"
                  placeholder="Create a password"
                  className="pl-10 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-slate-500">
                Password must be at least 6 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  type="password"
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  className="pl-10 h-11"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-600">Passwords match</p>
              )}
            </div>

            <Button type="submit" className="w-full h-11 font-medium">
              Create account
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign in here
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
