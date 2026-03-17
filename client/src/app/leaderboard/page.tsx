'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const loadLeaderboard = () => {
    api.get('/leaderboard').then(res => {
      setLeaderboard(res.data.leaderboard);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('leaderboard-update', loadLeaderboard);
    return () => { socket.off('leaderboard-update', loadLeaderboard); };
  }, [socket]);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-gray-400">Top traders ranked by winnings</p>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-800/50 rounded-xl animate-pulse" />)}
          </div>
        ) : leaderboard.length > 0 ? (
          <div>
            {/* Header */}
            <div className="grid grid-cols-12 px-6 py-3 text-xs text-gray-500 font-medium border-b border-gray-700/50">
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">Trader</div>
              <div className="col-span-2 text-right">Balance</div>
              <div className="col-span-2 text-right">Trades</div>
              <div className="col-span-3 text-right">Total Winnings</div>
            </div>

            {leaderboard.map((entry) => (
              <div key={entry.id} className={`grid grid-cols-12 px-6 py-4 items-center border-b border-gray-700/30 last:border-0 hover:bg-gray-800/30 transition-colors ${
                entry.rank <= 3 ? 'bg-gradient-to-r from-amber-900/10 to-transparent' : ''
              }`}>
                <div className="col-span-1">
                  {entry.rank <= 3 ? (
                    <span className="text-2xl">{medals[entry.rank - 1]}</span>
                  ) : (
                    <span className="text-gray-400 font-bold">{entry.rank}</span>
                  )}
                </div>
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm">
                    {entry.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{entry.displayName}</div>
                    <div className="text-gray-500 text-xs">@{entry.username}</div>
                  </div>
                </div>
                <div className="col-span-2 text-right text-white font-medium">₹{entry.balance.toFixed(0)}</div>
                <div className="col-span-2 text-right text-gray-400">{entry.totalTrades}</div>
                <div className="col-span-3 text-right">
                  <span className="text-emerald-400 font-bold">₹{entry.totalWinnings.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-white mb-2">No traders yet</h3>
            <p className="text-gray-400">Be the first to trade and top the leaderboard!</p>
          </div>
        )}
      </div>
    </div>
  );
}
