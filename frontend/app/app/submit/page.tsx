"use client";

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Info } from "lucide-react";

export default function CryptoSubmitPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    twitterHandle: '',
    specialty: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNavigation = (page: string) => {
    router.push(`/app/${page}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/crypto-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Submission failed');
      }

      setFormData({ twitterHandle: '', specialty: '' });
      
      if (session?.user) {
        toast.success('Expert added! You earned 10 points for contributing! 🎉');
      } else {
        toast.success('Expert added! Sign in to earn points for your contributions! 🎉');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <DashboardSidebar activePage="submit" onNavigate={handleNavigation} />
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-2xl mx-auto py-10">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl text-black font-semibold tracking-tight">Submit Crypto Expert</h2>
              <p className="text-sm text-muted-foreground">
                Help us build a directory of crypto experts and thought leaders on Twitter.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Why submit experts?</p>
                <p>We're building a curated list of crypto experts to help monitor market insights and trading signals. Your contributions help the community discover valuable sources of crypto knowledge.</p>
              </div>
            </div>

            <Card className="border-border shadow-sm">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Expert's Twitter Handle
                      </label>
                      <Input
                        value={formData.twitterHandle}
                        onChange={(e) => setFormData({...formData, twitterHandle: e.target.value})}
                        placeholder="@cryptoexpert"
                        className="border-input"
                        required
                      />
                      <p className="text-[0.8rem] text-muted-foreground">
                        The Twitter handle of a notable crypto expert or influencer
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Area of Expertise
                      </label>
                      <Input
                        value={formData.specialty}
                        onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                        placeholder="Trading, DeFi, NFTs, Market Analysis..."
                        className="border-input"
                        required
                      />
                      <p className="text-[0.8rem] text-muted-foreground">
                        Their primary focus or expertise in the crypto space
                      </p>
                    </div>
                  </div>
                  {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                      {error}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Expert'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 