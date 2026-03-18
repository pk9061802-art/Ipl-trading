'use client';

import { useState } from 'react';
import api from '@/lib/api';

interface TradePanelProps {
  marketId: number;
  yesPrice: number;
  noPrice: number;
  onTradeComplete: () => void;
}

export default function TradePanel({ marketId, yesPrice, noPrice, onTradeComplete }: TradePanelProps) {
  const [side, setSide] = useState<'YES' | 'NO'>('YES');
  const [price, setPrice] = useState<number>(side === 'YES' ? (yesPrice || 5.0) : (noPrice || 5.0));
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const totalCost = price * quantity;

  const handleTrade = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/orders', {
        marketId,
        side,
        type: 'BUY',
        price,
        quantity,
      });
      setSuccess(`Order placed! ${res.data.trades?.length || 0} trades matched.`);
      onTradeComplete();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
      <h3 className="text-white font-semibold text-lg mb-4">Place Order</h3>

      {/* Side selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setSide('YES'); setPrice(yesPrice); }}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
            side === 'YES'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
          }`}
        >
          YES ₹{yesPrice.toFixed(1)}
        </button>
        <button
          onClick={() => { setSide('NO'); setPrice(noPrice); }}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
            side === 'NO'
              ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
          }`}
        >
          NO ₹{noPrice.toFixed(1)}
        </button>
      </div>

      {/* Price input */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm mb-1 block">Price (₹0.5 - ₹9.5)</label>
        <input
          type="number"
          min={0.5}
          max={9.5}
          step={0.5}
          value={isNaN(price) ? '' : price}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setPrice(isNaN(val) ? 0 : val);
          }}
          className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-violet-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Quantity input */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm mb-1 block">Quantity</label>
        <div className="flex items-center gap-3">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors">-</button>
          <input
            type="number"
            min={1}
            max={1000}
            value={isNaN(quantity) ? '' : quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setQuantity(isNaN(val) ? 0 : Math.max(0, val));
            }}
            className="flex-1 bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white text-center focus:border-violet-500 focus:outline-none transition-colors"
          />
          <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors">+</button>
        </div>
      </div>

      {/* Total */}
      <div className="bg-gray-900/50 rounded-xl p-4 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total Cost</span>
          <span className="text-white font-bold text-lg">₹{totalCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-500">Potential Return</span>
          <span className="text-emerald-400">₹{(quantity * 10).toFixed(2)}</span>
        </div>
      </div>

      {error && <div className="text-red-400 text-sm mb-3 bg-red-500/10 p-3 rounded-lg">{error}</div>}
      {success && <div className="text-emerald-400 text-sm mb-3 bg-emerald-500/10 p-3 rounded-lg">{success}</div>}

      <button
        onClick={handleTrade}
        disabled={loading}
        className={`w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50 ${
          side === 'YES'
            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/25'
            : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/25'
        }`}
      >
        {loading ? 'Placing...' : `Buy ${side} for ₹${totalCost.toFixed(2)}`}
      </button>
    </div>
  );
}
