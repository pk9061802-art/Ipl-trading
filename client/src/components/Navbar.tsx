'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/useToast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { socket, joinUser } = useSocket();
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      api.get('/wallet/balance').then(res => setBalance(res.data.balance)).catch(() => {});
      joinUser(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleBalanceUpdate = (data: { balance: number }) => {
      setBalance((prevBalance) => {
        const diff = data.balance - prevBalance;
        if (prevBalance > 0 && Math.abs(diff) > 0.1) {
          if (diff > 0) {
            showToast('success', 'Balance Increased', `₹${diff.toFixed(2)} added to your wallet!`);
          } else {
            showToast('info', 'Balance Updated', `₹${Math.abs(diff).toFixed(2)} deducted from your wallet.`);
          }
        }
        return data.balance;
      });
    };

    socket.on('balance-update', handleBalanceUpdate);

    return () => {
      socket.off('balance-update', handleBalanceUpdate);
    };
  }, [socket, user]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">I</span>
            </div>
            <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent flex items-center justify-center">
              India IPL Bet
            </span>
          </Link>

          {/* Desktop Nav */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                Markets
              </Link>
              <Link href="/leaderboard" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                Leaderboard
              </Link>
              <Link href="/wallet" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                Wallet
              </Link>
              <Link href="/profile" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                Profile
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition-colors text-sm font-medium">
                  Admin
                </Link>
              )}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/wallet" className="hidden sm:flex items-center gap-2 bg-gray-800/80 px-3 py-1.5 rounded-full border border-gray-700/50">
                  <span className="text-emerald-400 text-sm font-semibold">₹{balance.toFixed(2)}</span>
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm hover:shadow-lg hover:shadow-violet-500/20 transition-all"
                  >
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2 border-b border-gray-700">
                        <p className="text-white text-sm font-medium">{user.username}</p>
                      </div>
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50" onClick={() => setMenuOpen(false)}>
                        Profile
                      </Link>
                      <Link href="/wallet" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/50" onClick={() => setMenuOpen(false)}>
                        Wallet
                      </Link>
                      <button onClick={() => { logout(); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-700/50">
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                  Login
                </Link>
                <Link href="/signup" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-lg hover:shadow-violet-500/25">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
