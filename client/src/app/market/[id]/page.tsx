'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import TradePanel from '@/components/TradePanel';
import { useSocket } from '@/hooks/useSocket';

export default function MarketDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [market, setMarket] = useState<any>(null);
  const [orderBook, setOrderBook] = useState<any[]>([]);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket, joinMarket, leaveMarket } = useSocket();

  const loadMarket = async () => {
    try {
      const res = await api.get(`/markets/${id}`);
      setMarket(res.data.market);
      setOrderBook(res.data.orderBook);
      setRecentTrades(res.data.recentTrades);
    } catch (err) {
      console.error('Failed to load market');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadMarket();
      joinMarket(Number(id));
      return () => leaveMarket(Number(id));
    }
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    const handlePriceUpdate = (data: any) => {
      if (data.marketId === Number(id)) {
        setMarket((prev: any) => prev ? { ...prev, yes_price: data.yesPrice, no_price: data.noPrice, total_volume: data.volume } : prev);
      }
    };

    const handleTradeExecuted = (data: any) => {
      if (data.marketId === Number(id)) {
        loadMarket(); // Refresh all data
      }
    };

    socket.on('price-update', handlePriceUpdate);
    socket.on('trade-executed', handleTradeExecuted);

    return () => {
      socket.off('price-update', handlePriceUpdate);
      socket.off('trade-executed', handleTradeExecuted);
    };
  }, [socket, id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-2/3 bg-gray-800 rounded-lg" />
          <div className="h-4 w-1/2 bg-gray-800 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-800 rounded-2xl" />
            <div className="h-96 bg-gray-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-white">Market not found</h2>
        </div>
      </div>
    );
  }

  const yesPrice = parseFloat(market.yes_price);
  const noPrice = parseFloat(market.no_price);
  const yesPct = (yesPrice / 10) * 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-400">
            {market.category}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            market.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
            market.status === 'resolved' ? 'bg-blue-500/20 text-blue-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {market.status}
            {market.resolution && ` — ${market.resolution}`}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">{market.title}</h1>
        {market.description && <p className="text-gray-400 text-lg">{market.description}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Market Info + Order Book */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Display */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-gray-400 mb-1">YES Price</div>
                <div className="text-4xl font-black text-emerald-400">₹{yesPrice.toFixed(1)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Volume</div>
                <div className="text-lg font-bold text-white">₹{parseFloat(market.total_volume).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 mb-1">NO Price</div>
                <div className="text-4xl font-black text-red-400">₹{noPrice.toFixed(1)}</div>
              </div>
            </div>
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${yesPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>{yesPct.toFixed(0)}% chance</span>
              <span>{(100 - yesPct).toFixed(0)}% chance</span>
            </div>
          </div>

          {/* Order Book */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Order Book</h3>
            {orderBook.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-4 text-xs text-gray-500 font-medium pb-2 border-b border-gray-700">
                  <div>Side</div>
                  <div>Type</div>
                  <div>Price</div>
                  <div className="text-right">Qty</div>
                </div>
                {orderBook.map((o, i) => (
                  <div key={i} className="grid grid-cols-4 text-sm py-1.5">
                    <div className={o.side === 'YES' ? 'text-emerald-400' : 'text-red-400'}>{o.side}</div>
                    <div className="text-gray-300">{o.type}</div>
                    <div className="text-white">₹{parseFloat(o.price).toFixed(1)}</div>
                    <div className="text-right text-gray-300">{o.total_quantity}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No open orders. Be the first to trade!</p>
            )}
          </div>

          {/* Recent Trades */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Recent Trades</h3>
            {recentTrades.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-4 text-xs text-gray-500 font-medium pb-2 border-b border-gray-700">
                  <div>Side</div>
                  <div>Price</div>
                  <div>Qty</div>
                  <div className="text-right">Time</div>
                </div>
                {recentTrades.map((t, i) => (
                  <div key={i} className="grid grid-cols-4 text-sm py-1.5">
                    <div className={t.side === 'YES' ? 'text-emerald-400' : 'text-red-400'}>{t.side}</div>
                    <div className="text-white">₹{parseFloat(t.price).toFixed(1)}</div>
                    <div className="text-gray-300">{t.quantity}</div>
                    <div className="text-right text-gray-400 text-xs">
                      {new Date(t.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No trades yet.</p>
            )}
          </div>
        </div>

        {/* Right: Trade Panel */}
        <div>
          {market.status === 'active' ? (
            <div className="sticky top-24">
              <TradePanel
                marketId={market.id}
                yesPrice={yesPrice}
                noPrice={noPrice}
                onTradeComplete={loadMarket}
              />
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 text-center">
              <div className="text-4xl mb-3">{market.status === 'resolved' ? '✅' : '⏸️'}</div>
              <h3 className="text-white font-semibold mb-2">
                {market.status === 'resolved' ? 'Market Resolved' : 'Market Not Active'}
              </h3>
              {market.resolution && (
                <div className={`inline-block px-4 py-2 rounded-full font-bold text-lg ${
                  market.resolution === 'YES' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  Resolution: {market.resolution}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
