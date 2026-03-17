'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ProfilePage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [profRes, ordRes] = await Promise.all([
        api.get('/auth/profile'),
        api.get('/orders'),
      ]);
      setProfile(profRes.data);
      setOrders(ordRes.data.orders);
    } catch (err) {}
  };

  const cancelOrder = async (orderId: number) => {
    try {
      await api.post(`/orders/${orderId}/cancel`);
      loadProfile();
    } catch (err) {}
  };

  if (!profile) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="glass rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-3xl font-bold">
            {profile.username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
            <p className="text-gray-400">@{profile.username}</p>
            <p className="text-gray-500 text-sm mt-1">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Balance</div>
            <div className="text-2xl font-bold text-emerald-400">₹{profile.balance.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-white font-semibold text-lg mb-4">Your Orders</h2>
        {orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-white">{order.market_title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.side === 'YES' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>{order.side}</span>
                    <span className="text-xs text-gray-400">{order.type} @ ₹{parseFloat(order.price).toFixed(1)}</span>
                    <span className="text-xs text-gray-500">Qty: {order.filled_quantity}/{order.quantity}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${
                    order.status === 'filled' ? 'bg-emerald-500/20 text-emerald-400' :
                    order.status === 'open' ? 'bg-blue-500/20 text-blue-400' :
                    order.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>{order.status}</span>
                  {['open', 'partial'].includes(order.status) && (
                    <button onClick={() => cancelOrder(order.id)} className="text-xs text-red-400 hover:text-red-300">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No orders yet. Start trading!</p>
        )}
      </div>

      <button onClick={() => { logout(); router.push('/'); }} className="mt-6 text-red-400 hover:text-red-300 text-sm">
        Logout
      </button>
    </div>
  );
}
