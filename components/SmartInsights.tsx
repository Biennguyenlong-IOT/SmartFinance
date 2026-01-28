
import React, { useState, useEffect } from 'react';
import { Transaction, Category, Wallet } from '../types';
import { getFinancialAdvice } from '../services/geminiService';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
}

export const SmartInsights: React.FC<Props> = ({ transactions, categories, wallets }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAdvice = async () => {
    if (transactions.length < 3) {
      setAdvice("Hãy tiếp tục ghi chép! AI cần thêm ít nhất 3 giao dịch để bắt đầu phân tích thói quen của bạn.");
      return;
    }
    setLoading(true);
    const result = await getFinancialAdvice(transactions, categories, wallets);
    setAdvice(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchAdvice();
  }, []);

  return (
    <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-[2rem] p-8 shadow-2xl shadow-indigo-200 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full translate-y-24 -translate-x-24 blur-2xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner">
              ✨
            </div>
            <div>
              <h3 className="font-black text-xl tracking-tight leading-none">Chuyên gia AI</h3>
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-[0.2em] mt-1 block">Powered by Gemini</span>
            </div>
          </div>
          <button 
            onClick={fetchAdvice} 
            disabled={loading}
            className="text-[10px] bg-white text-indigo-700 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Đang phân tích...' : 'Làm mới'}
          </button>
        </div>
        
        <div className="bg-black/10 backdrop-blur-xl rounded-2xl p-6 min-h-[100px] border border-white/5">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-3 bg-white/20 rounded-full w-3/4"></div>
              <div className="h-3 bg-white/20 rounded-full w-full"></div>
              <div className="h-3 bg-white/20 rounded-full w-2/3"></div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed font-semibold text-white/90 italic">
              "{advice}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
