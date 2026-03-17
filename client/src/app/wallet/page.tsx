'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function WalletPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balRes, txRes] = await Promise.all([
        api.get('/wallet/balance'),
        api.get('/wallet/transactions'),
      ]);
      setBalance(balRes.data.balance);
      setTransactions(txRes.data.transactions);
    } catch (err) {}
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (!transactionId) {
      setMessage({ type: 'error', text: 'Please enter your Transaction ID (UTR) for verification.' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/wallet/deposit', { 
        amount: parseFloat(amount),
        transactionId 
      });
      setMessage({ type: 'success', text: res.data.message });
      setAmount('');
      setTransactionId('');
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Deposit failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/wallet/withdraw', { amount: parseFloat(amount) });
      setMessage({ type: 'success', text: res.data.message });
      setBalance(res.data.balance);
      setAmount('');
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Withdrawal failed.' });
    } finally {
      setLoading(false);
    }
  };

  const typeColors: Record<string, string> = {
    deposit: 'text-emerald-400',
    withdrawal: 'text-red-400',
    order_placed: 'text-amber-400',
    order_cancelled: 'text-gray-400',
    trade_win: 'text-emerald-400',
    trade_loss: 'text-red-400',
    refund: 'text-blue-400',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Wallet</h1>

      {/* Balance Card */}
      <div className="glass rounded-2xl p-8 mb-8 bg-gradient-to-br from-violet-900/30 to-fuchsia-900/30">
        <div className="text-gray-400 text-sm mb-2">Available Balance</div>
        <div className="text-5xl font-black text-white mb-6">₹{balance.toFixed(2)}</div>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input
            type="number"
            placeholder="Enter amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Transaction ID / UTR No"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="flex-[1.5] bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={handleDeposit}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            Deposit Request
          </button>
          <button
            onClick={handleWithdraw}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            Withdraw Request
          </button>
        </div>

        {/* UPI ID Section */}
        <div className="p-6 bg-gray-900/40 rounded-xl border border-violet-500/20 flex flex-col md:flex-row items-center gap-8">
          <div className="bg-white p-2 rounded-xl shadow-lg shadow-violet-500/10">
            <img 
              src={`https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${encodeURIComponent('upi://pay?pa=9608248903@ybl&pn=IPL PROBO&cu=INR')}`} 
              alt="UPI QR Code"
              className="w-32 h-32 md:w-36 md:h-36"
            />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 text-sm">
                📲
              </div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-widest">Scan & Pay via UPI</div>
            </div>
            
            <div className="text-xl font-black text-white mb-4 tracking-tight">9608248903@ybl</div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText('9608248903@ybl');
                  alert('UPI ID Copied!');
                }}
                className="text-xs font-bold text-violet-400 hover:text-white py-2 px-4 rounded-lg bg-violet-500/5 border border-violet-500/20 hover:bg-violet-600 transition-all uppercase"
              >
                Copy UPI ID
              </button>
              <div className="text-[10px] text-gray-500 italic max-w-[200px]">
                After payment, please enter the UTR/Transaction ID above to update your balance.
              </div>
            </div>
          </div>
        </div>

        {message.text && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-white font-semibold text-lg mb-4">Transaction History</h2>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((tx, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-0">
                <div>
                  <div className={`text-sm font-medium ${typeColors[tx.type] || 'text-gray-300'}`}>
                    {tx.type.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{tx.description}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{new Date(tx.created_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${parseFloat(tx.amount) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {parseFloat(tx.amount) >= 0 ? '+' : ''}₹{Math.abs(parseFloat(tx.amount)).toFixed(2)}
                  </div>
                  <div className={`text-[10px] font-bold uppercase ${
                    tx.status === 'pending' ? 'text-amber-500' : 'text-gray-500'
                  }`}>
                    {tx.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No transactions yet.</p>
        )}
      </div>
    </div>
  );
}
