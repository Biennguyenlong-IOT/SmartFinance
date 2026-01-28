
import React from 'react';
import { Wallet } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  wallets: Wallet[];
  onDebtClick: (wallet: Wallet) => void;
}

export const WalletOverview: React.FC<Props> = ({ wallets, onDebtClick }) => {
  const total = wallets.reduce((sum, w) => sum + w.balance, 0);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Tổng tài sản hiện có</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900 tracking-tight">{formatCurrency(total)}</span>
            <span className="text-xl font-bold text-slate-400">₫</span>
          </div>
        </div>
        <div className="flex gap-2">
           <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl text-[11px] font-bold border border-indigo-100">
            {wallets.length} Tài khoản
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {wallets.map(wallet => {
          const isDebt = wallet.id.includes('debt') || wallet.name.toLowerCase().includes('nợ');
          return (
            <div 
              key={wallet.id} 
              onClick={() => isDebt ? onDebtClick(wallet) : null}
              className={`group p-5 rounded-2xl border transition-all duration-300 ${
                isDebt 
                  ? 'bg-red-50/30 border-red-100 hover:bg-red-50 hover:border-red-200 cursor-pointer' 
                  : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md hover:border-indigo-100'
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border transition-transform group-hover:scale-110 ${isDebt ? 'bg-white border-red-100' : 'bg-white border-slate-100'}`}>
                  {wallet.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate mb-0.5">{wallet.name}</p>
                  <p className={`text-lg font-black truncate ${wallet.balance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                    {formatCurrency(wallet.balance)}<span className="text-xs ml-0.5 font-bold">₫</span>
                  </p>
                  {isDebt && wallet.balance < 0 && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[9px] text-red-500 font-black uppercase bg-red-100 px-2 py-0.5 rounded-full animate-pulse">
                      <span>●</span> Trả ngay
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
