"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

interface TradeActivity {
  id: string;
  market_id: number;
  side: string;
  price: number;
  quantity: number;
  executed_at: any;
}

export default function FirebaseDataSection() {
  const [trades, setTrades] = useState<TradeActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const isConfigured = 
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "your_api_key";

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Real-time listener for latest trades
    const q = query(collection(db, "trades"), orderBy("executed_at", "desc"), limit(5));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TradeActivity[];
      setTrades(items);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Listen failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);

  if (!isConfigured) return null;

  return (
    <div className="glass rounded-2xl p-6 border-violet-500/20 bg-gradient-to-br from-violet-900/5 to-transparent">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Live Platform Activity</h2>
        </div>
        <div className="text-[10px] text-violet-400 font-bold bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
          REAL-TIME FIRESTORE
        </div>
      </div>
      
      <div className="space-y-4">
        {trades.length > 0 ? (
          trades.map((trade, i) => (
            <div 
              key={trade.id} 
              className={`flex items-center justify-between p-3 rounded-xl bg-gray-900/40 border border-gray-800/50 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-${i * 100}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  trade.side === 'YES' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {trade.side[0]}
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 uppercase font-bold tracking-tight">Market #{trade.market_id}</div>
                  <div className="text-sm font-medium text-white">
                    {trade.quantity} shares @ ₹{trade.price.toFixed(1)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-black ${trade.side === 'YES' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trade.side}
                </div>
                <div className="text-[10px] text-gray-600">
                  {trade.executed_at?.toDate ? new Date(trade.executed_at.toDate()).toLocaleTimeString() : 'Just now'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center bg-gray-900/20 rounded-xl border border-dashed border-gray-800">
             <div className="text-3xl mb-2 opacity-30">🏏</div>
             <p className="text-xs text-gray-500">Wait for the first IPL trade to match...</p>
             <div className="text-[10px] text-violet-400/50 mt-1 uppercase tracking-widest font-bold">Syncing with Firestore</div>
          </div>
        )}
      </div>
    </div>
  );
}
