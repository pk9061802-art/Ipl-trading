'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import MarketCard from '@/components/MarketCard';
import { useSocket } from '@/hooks/useSocket';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { socket } = useSocket();

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    loadMarkets();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handlePriceUpdate = (data: { marketId: number, yesPrice: number, noPrice: number, volume: number }) => {
      setMarkets(prev => prev.map(m => 
        m.id === data.marketId 
          ? { ...m, yes_price: data.yesPrice.toString(), no_price: data.noPrice.toString(), total_volume: data.volume.toString() }
          : m
      ));
    };

    socket.on('price-update', handlePriceUpdate);

    return () => {
      socket.off('price-update', handlePriceUpdate);
    };
  }, [socket]);

  const loadMarkets = async () => {
    try {
      const res = await api.get('/markets', { params: { status: 'active' } });
      setMarkets(res.data.markets);
    } catch (err) {
      console.error('Failed to load markets');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'sports', 'politics', 'crypto', 'entertainment', 'technology', 'finance'];

  const filteredMarkets = markets.filter(m => {
    const matchesFilter = filter === 'all' || m.category === filter;
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Markets</h1>
        <p className="text-gray-400">Trade predictions on real-world events</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Search markets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none transition-colors"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === cat
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Markets Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-gray-800/50 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : filteredMarkets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarkets.map(market => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-white mb-2">No markets found</h3>
          <p className="text-gray-400">Check back later for new prediction markets.</p>
        </div>
      )}
    </div>
  );
}
