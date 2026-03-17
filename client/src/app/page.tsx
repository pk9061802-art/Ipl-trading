'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import FirebaseDataSection from '@/components/FirebaseDataSection';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-gray-950 to-fuchsia-900/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl" />

      <div className="relative z-10 text-center max-w-3xl">
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-8 pulse-glow">
          <span className="text-white font-bold text-3xl">P</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white mb-6">
          Trade on{' '}
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Predictions
          </span>
        </h1>

        <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
          Buy YES or NO shares on real-world events. Earn money when your predictions are right. 
          Prices from ₹0.5 to ₹9.5.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl text-lg font-bold transition-all hover:shadow-xl hover:shadow-violet-500/25 hover:-translate-y-0.5"
          >
            Start Trading →
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 rounded-xl text-lg font-bold transition-all hover:-translate-y-0.5"
          >
            Login
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-16">
          <div className="text-center">
            <div className="text-3xl font-black text-white">10K+</div>
            <div className="text-sm text-gray-400">Traders</div>
          </div>
          <div className="w-px h-12 bg-gray-700" />
          <div className="text-center">
            <div className="text-3xl font-black text-white">₹50L+</div>
            <div className="text-sm text-gray-400">Volume</div>
          </div>
          <div className="w-px h-12 bg-gray-700" />
          <div className="text-center">
            <div className="text-3xl font-black text-white">500+</div>
            <div className="text-sm text-gray-400">Markets</div>
          </div>
        </div>

        {/* Firebase Data Section */}
        <div className="mt-16 w-full max-w-2xl mx-auto">
          <FirebaseDataSection />
        </div>
      </div>
    </div>
  );
}
