'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'markets' | 'users' | 'analytics' | 'create' | 'transactions'>('markets');
  const [markets, setMarkets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Create market form
  const [form, setForm] = useState({ title: '', description: '', category: 'general', endDate: '' });
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  // Resolve form
  const [resolveId, setResolveId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mkts, usrs, analytics, txs] = await Promise.all([
        api.get('/markets'),
        api.get('/admin/users'),
        api.get('/admin/analytics'),
        api.get('/admin/transactions'),
      ]);
      setMarkets(mkts.data.markets);
      setUsers(usrs.data.users);
      setAnalytics(analytics.data);
      setPendingTransactions(txs.data.transactions);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const createMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });
    try {
      await api.post('/admin/markets', {
        title: form.title,
        description: form.description,
        category: form.category,
        endDate: form.endDate || null,
      });
      setFormMsg({ type: 'success', text: 'Market created successfully!' });
      setForm({ title: '', description: '', category: 'general', endDate: '' });
      loadData();
    } catch (err: any) {
      setFormMsg({ type: 'error', text: err.response?.data?.error || 'Failed.' });
    }
  };

  const resolveMarket = async (id: number, resolution: string) => {
    try {
      await api.post(`/admin/markets/${id}/resolve`, { resolution });
      setResolveId(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to resolve.');
    }
  };

  const toggleSuspend = async (id: number) => {
    try {
      await api.post(`/admin/users/${id}/toggle-suspend`);
      loadData();
    } catch (err) {}
  };

  const approveTx = async (id: number, action: 'approve' | 'reject') => {
    try {
      await api.post(`/admin/transactions/${id}/approve`, { action });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to process transaction.');
    }
  };

  const tabs = [
    { key: 'markets' as const, label: 'Markets' },
    { key: 'create' as const, label: 'Create Market' },
    { key: 'transactions' as const, label: 'Pending Deposits' },
    { key: 'users' as const, label: 'Users list' },
    { key: 'analytics' as const, label: 'Analytics' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <span className="text-amber-400 text-xl">⚡</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-sm">Manage markets, users, and analytics</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-violet-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Analytics */}
      {tab === 'analytics' && analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: analytics.totalUsers, color: 'text-violet-400' },
            { label: 'Total Markets', value: analytics.totalMarkets, color: 'text-blue-400' },
            { label: 'Total Trades', value: analytics.totalTrades, color: 'text-emerald-400' },
            { label: 'Total Volume', value: `₹${analytics.totalVolume?.toLocaleString()}`, color: 'text-amber-400' },
          ].map((stat, i) => (
            <div key={i} className="glass rounded-xl p-5">
              <div className="text-gray-400 text-xs mb-1">{stat.label}</div>
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create Market */}
      {tab === 'create' && (
        <div className="glass rounded-2xl p-8 max-w-2xl">
          <h2 className="text-white font-semibold text-lg mb-6">Create New Market</h2>
          <form onSubmit={createMarket} className="space-y-5">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Will India win the World Cup 2026?"
                className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detailed description of the prediction market..."
                rows={3}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                >
                  {['general', 'sports', 'politics', 'crypto', 'entertainment', 'technology', 'finance'].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            {formMsg.text && (
              <div className={`p-3 rounded-lg text-sm ${formMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {formMsg.text}
              </div>
            )}

            <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold transition-all">
              Create Market
            </button>
          </form>
        </div>
      )}

      {/* Markets */}
      {tab === 'markets' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 px-6 py-3 text-xs text-gray-500 font-medium border-b border-gray-700/50">
            <div className="col-span-1">ID</div>
            <div className="col-span-4">Title</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Volume</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>
          {markets.map((m) => (
            <div key={m.id} className="grid grid-cols-12 px-6 py-4 items-center border-b border-gray-700/30 last:border-0">
              <div className="col-span-1 text-gray-400">#{m.id}</div>
              <div className="col-span-4 text-white text-sm font-medium truncate">{m.title}</div>
              <div className="col-span-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  m.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                  m.status === 'resolved' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>{m.status}{m.resolution ? ` (${m.resolution})` : ''}</span>
              </div>
              <div className="col-span-2 text-gray-400 text-sm">₹{parseFloat(m.total_volume).toFixed(0)}</div>
              <div className="col-span-3 text-right">
                {m.status === 'active' && (
                  resolveId === m.id ? (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => resolveMarket(m.id, 'YES')} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium">YES</button>
                      <button onClick={() => resolveMarket(m.id, 'NO')} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-medium">NO</button>
                      <button onClick={() => setResolveId(null)} className="px-3 py-1 bg-gray-600 text-white rounded-lg text-xs">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setResolveId(m.id)} className="text-xs text-violet-400 hover:text-violet-300 font-medium">
                      Resolve
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Transactions */}
      {tab === 'transactions' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 px-6 py-3 text-xs text-gray-500 font-medium border-b border-gray-700/50">
            <div className="col-span-1">ID</div>
            <div className="col-span-2">User</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-1 text-right">Amount</div>
            <div className="col-span-4 px-4 text-center">Reference / UTR</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {pendingTransactions.length > 0 ? pendingTransactions.map((tx) => (
            <div key={tx.id} className="grid grid-cols-12 px-6 py-4 items-center border-b border-gray-700/30 last:border-0 hover:bg-gray-800/10">
              <div className="col-span-1 text-gray-400 text-xs">#{tx.id}</div>
              <div className="col-span-2">
                <div className="text-white text-sm font-medium">{tx.username}</div>
              </div>
              <div className="col-span-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                  tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {tx.type}
                </span>
              </div>
              <div className={`col-span-1 text-right font-bold text-sm ${
                tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                ₹{Math.abs(parseFloat(tx.amount)).toFixed(0)}
              </div>
              <div className="col-span-4 px-4 text-center">
                <div className="text-violet-300 font-mono text-xs bg-violet-500/5 py-1 px-2 rounded border border-violet-500/10 inline-block">
                  {tx.reference_id || 'N/A'}
                </div>
              </div>
              <div className="col-span-2 flex gap-2 justify-end">
                <button 
                  onClick={() => approveTx(tx.id, 'approve')}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                >
                  APPROVE
                </button>
                <button 
                  onClick={() => approveTx(tx.id, 'reject')}
                  className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-[10px] font-bold"
                >
                  REJECT
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-gray-500 text-sm italic">
              No pending requests. Check back later! 💤
            </div>
          )}
        </div>
      )}
    </div>
  );
}
