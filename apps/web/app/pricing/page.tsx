'use client';

import { createRazorpayOrder, verifyRazorpayPayment } from '@/actions/payment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@repo/database';
import { Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

// Add declaration for Razorpay to avoid TS errors
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpgrade = async () => {
    setIsLoading(true);

    try {
      const { data: orderResponse, error: orderError } =
        await createRazorpayOrder();

      if (orderError || !orderResponse) {
        throw new Error(orderError || 'Failed to create order');
      }

      const order = orderResponse;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Uploader Pro',
        description: 'Upgrade to Pro Plan',
        order_id: order.id,
        handler: async function (response: any) {
          const { data: verifyResponse, error: verifyError } =
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

          if (verifyError) {
            toast.error('Payment Verification Failed');
            console.error(verifyError);
          } else {
            toast.success('Upgrade Successful! Welcome to Pro.');
            // Refresh server data to reflect new plan
            router.refresh();
            // Redirect to dashboard
            router.push('/dashboard');
          }
        },
        prefill: {
          name: 'User Name',
          email: 'user@example.com',
        },
        theme: {
          color: '#F97316',
          backdrop_color: '#121212',
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        toast.error(response.error.description);
      });
      rzp1.open();
    } catch (error) {
      console.error('Payment Error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const freePlan = SUBSCRIPTION_PLANS[SubscriptionTier.FREE];
  const proPlan = SUBSCRIPTION_PLANS[SubscriptionTier.PRO];

  return (
    <div className="min-h-screen bg-background py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
          Simple, Transparent{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            Pricing
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that fits your social media automation needs. Both
          plans include access to all platforms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* FREE PLAN */}
        <Card className="flex flex-col border-2 relative overflow-hidden dark:bg-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {freePlan.name}
            </CardTitle>
            <CardDescription>
              Perfect for trying out the platform
            </CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold text-foreground">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: freePlan.currency,
                  minimumFractionDigits: 0,
                }).format(freePlan.price / 100)}
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <Separator className="mb-6" />
            <ul className="space-y-3">
              {freePlan.features.map((feature, i) => (
                <li key={i} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" disabled>
              {freePlan.cta}
            </Button>
          </CardFooter>
        </Card>

        {/* PRO PLAN */}
        <Card className="flex flex-col border-2 border-orange-500 relative overflow-hidden shadow-2xl dark:shadow-orange-900/20">
          <div className="absolute top-0 right-0 p-3">
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 border-0 text-white">
              MOST POPULAR
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-orange-500">
              {proPlan.name}
            </CardTitle>
            <CardDescription>
              For serious creators and businesses
            </CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold text-foreground">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: proPlan.currency,
                  minimumFractionDigits: 0,
                }).format(proPlan.price / 100)}
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <Separator className="mb-6" />
            <ul className="space-y-3">
              {proPlan.features.map((feature, i) => (
                <li key={i} className="flex items-center font-medium">
                  <Check className="h-5 w-5 text-orange-500 mr-2" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold h-12 text-lg shadow-lg"
              onClick={handleUpgrade}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                proPlan.cta
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
