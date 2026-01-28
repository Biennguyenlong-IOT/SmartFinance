
import React from 'react';
import { Wallet } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  wallets: Wallet[];
  onDebtClick: (wallet: Wallet) => void;
}

const isDebtWallet = (w: Wallet) => w.id.includes('debt') || w.name.toLowerCase().includes('nợ');

export const WalletOverview: React.FC<Props> = ({ wallets, onDebtClick }) => {
  const assets = wallets.filter(w => !isDebtWallet(w));
  const debts = wallets.filter(w => isDebtWallet(w));
  
  const totalAssets = assets.reduce((sum, w) => sum + w.balance, 0);
  const totalDebts = debts.reduce((sum, w) => sum + Math.abs(w.balance), 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div className="space-y-1">
            <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Tài sản khả dụng</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">{formatCurrency(totalAssets)}</span>
              <span className="text-2xl font-bold text-slate-300">₫</span>
            </div>
          </div>
          {totalDebts > 0 && (
            <div className="bg-rose-50 px-6 py-4 rounded-3xl border border-rose-100">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Tổng nợ phải trả</p>
              <p className="text-xl font-black text-rose-600">-{formatCurrency(totalDebts)}₫</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {assets.map(wallet => (
            <div key={wallet.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all group">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-100 mb-3 group-hover:scale-110 transition-transform">
                {wallet.icon}
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{wallet.name}</p>
              <p className="text-lg font-black text-slate-800">{formatCurrency(wallet.balance)}<span className="text-[10px] ml-0.5">₫</span></p>
            </div>
          ))}
        </div>
      </div>

      {debts.length > 0 && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span> Danh sách khoản nợ
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {debts.map(wallet => (
              <button 
                key={wallet.id} 
                onClick={() => onDebtClick(wallet)}
                className="text-left p-5 bg-rose-50/30 border border-rose-100 rounded-2xl hover:bg-rose-50 hover:border-rose-300 transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-rose-100 group-hover:rotate-12 transition-transform">
                    {wallet.icon}
                  </div>
                  <span className="text-[10px] font-black text-rose-500 uppercase bg-white px-2 py-1 rounded-lg border border-rose-100">Trả ngay</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{wallet.name}</p>
                <p className="text-lg font-black text-rose-600">{formatCurrency(wallet.balance)}<span className="text-[10px] ml-0.5">₫</span></p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
