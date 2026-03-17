'use client';

import Link from 'next/link';

interface Market {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  yes_price: string;
  no_price: string;
  total_volume: string;
  end_date: string;
}

export default function MarketCard({ market }: { market: Market }) {
  const yesPrice = parseFloat(market.yes_price);
  const noPrice = parseFloat(market.no_price);
  const yesPct = (yesPrice / 10) * 100;

  const categoryColors: Record<string, string> = {
    sports: 'bg-blue-500/20 text-blue-400',
    politics: 'bg-red-500/20 text-red-400',
    crypto: 'bg-amber-500/20 text-amber-400',
    entertainment: 'bg-pink-500/20 text-pink-400',
    general: 'bg-gray-500/20 text-gray-400',
    technology: 'bg-cyan-500/20 text-cyan-400',
    finance: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <Link href={`/market/${market.id}`}>
      <div className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-5 hover:border-violet-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-1 cursor-pointer">
        {/* Category + Status */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryColors[market.category] || categoryColors.general}`}>
            {market.category}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            market.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
            market.status === 'resolved' ? 'bg-blue-500/20 text-blue-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {market.status}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-white font-semibold text-base mb-3 group-hover:text-violet-300 transition-colors line-clamp-2">
          {market.title}
        </h3>

        {/* Price Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-emerald-400 font-semibold">YES ₹{yesPrice.toFixed(1)}</span>
            <span className="text-red-400 font-semibold">NO ₹{noPrice.toFixed(1)}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${yesPct}%` }}
            />
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Volume: ₹{parseFloat(market.total_volume).toLocaleString()}</span>
          {market.end_date && (
            <span>Ends: {new Date(market.end_date).toLocaleDateString()}</span>
          )}
        </div>

        {/* Trade Buttons */}
        <div className="flex gap-2 mt-4">
          <button className="flex-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600/30 transition-colors">
            Yes ₹{yesPrice.toFixed(1)}
          </button>
          <button className="flex-1 bg-red-600/20 text-red-400 border border-red-500/30 py-2 rounded-lg text-sm font-semibold hover:bg-red-600/30 transition-colors">
            No ₹{noPrice.toFixed(1)}
          </button>
        </div>
      </div>
    </Link>
  );
}
