
import React from 'react';
import { Wallet, Transaction, CategoryType } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  wallets: Wallet[];
  transactions: Transaction[];
  onDebtClick: (wallet: Wallet) => void;
  onViewLedger: (wallet: Wallet) => void;
  onSavingsClick: (wallet: Wallet) => void;
}

const isDebtWallet = (w: Wallet) => w.id.includes('debt') || (typeof w.name === 'string' && w.name.toLowerCase().includes('nợ'));

export const WalletOverview: React.FC<Props> = ({ wallets, transactions, onDebtClick, onViewLedger, onSavingsClick }) => {
  const assets = wallets.filter(w => !isDebtWallet(w));
  const debts = wallets.filter(w => isDebtWallet(w));
  
  const totalAssets = assets.reduce((sum, w) => sum + w.balance, 0);
  const totalDebts = debts.reduce((sum, w) => sum + Math.abs(w.balance), 0);
  
  const debtRatio = totalAssets > 0 ? (totalDebts / totalAssets) * 100 : (totalDebts > 0 ? 100 : 0);

  // Tính tỉ lệ chi trả tháng này (Trả nợ / Thu nhập)
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthlyIncome = transactions
    .filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && t.type === CategoryType.INCOME;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyRepayment = transactions
    .filter(t => {
      const d = new Date(t.date);
      // CategoryId '10' là Trả nợ
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && t.categoryId === '10';
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const repaymentRatio = monthlyIncome > 0 ? (monthlyRepayment / monthlyIncome) * 100 : 0;

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
          <div className="flex flex-wrap gap-3 justify-end">
            {totalDebts > 0 && (
              <>
                <div className="bg-indigo-50 px-5 py-3 rounded-2xl border border-indigo-100 text-right">
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-0.5">Tỉ lệ chi trả (Tháng)</p>
                  <p className="text-lg font-black text-indigo-700">{repaymentRatio.toFixed(1)}%</p>
                </div>
                <div className="bg-amber-50 px-5 py-3 rounded-2xl border border-amber-100 text-right">
                  <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Tỉ lệ nợ</p>
                  <p className="text-lg font-black text-amber-700">{debtRatio.toFixed(1)}%</p>
                </div>
                <div className="bg-rose-50 px-5 py-3 rounded-2xl border border-rose-100 text-right">
                  <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Tổng nợ</p>
                  <p className="text-lg font-black text-rose-600">-{formatCurrency(totalDebts)}₫</p>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {assets.map(wallet => (
            <div 
              key={wallet.id} 
              onClick={() => wallet.isSavings && onSavingsClick(wallet)}
              className={`p-5 border rounded-2xl transition-all group ${wallet.isSavings ? 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg hover:border-indigo-100'}`}
            >
              <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border mb-3 group-hover:scale-110 transition-transform ${wallet.isSavings ? 'border-emerald-100' : 'border-slate-100'}`}>
                {wallet.icon}
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{wallet.name}</p>
                  <p className="text-lg font-black text-slate-800">{formatCurrency(wallet.balance)}<span className="text-[10px] ml-0.5">₫</span></p>
                </div>
                {wallet.isSavings && (
                  <span className="text-[8px] font-black text-emerald-600 bg-white border border-emerald-100 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Tiết kiệm</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {debts.length > 0 && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span> Quản lý khoản vay & nợ
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {debts.map(wallet => {
              // Tính tổng tiền đã trả cho ví nợ này
              const totalPaid = transactions
                .filter(t => t.toWalletId === wallet.id && t.categoryId === '10')
                .reduce((sum, t) => sum + t.amount, 0);
              
              const currentDebt = Math.abs(wallet.balance);
              const originalDebt = currentDebt + totalPaid;
              const progress = originalDebt > 0 ? (totalPaid / originalDebt) * 100 : 0;

              return (
                <div key={wallet.id} className="relative group bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 hover:bg-white hover:shadow-xl hover:border-rose-100 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-rose-100">
                      {wallet.icon}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => onDebtClick(wallet)}
                        className="px-4 py-2 text-[10px] font-black text-emerald-600 bg-white rounded-xl border border-emerald-100 hover:bg-emerald-50 shadow-sm transition-all active:scale-95"
                      >
                        Trả dần
                      </button>
                      <button 
                        onClick={() => {
                          const event = new CustomEvent('openBorrowModal', { detail: wallet });
                          window.dispatchEvent(event);
                        }}
                        className="px-4 py-2 text-[10px] font-black text-rose-600 bg-white rounded-xl border border-rose-100 hover:bg-rose-50 shadow-sm transition-all active:scale-95"
                      >
                        Vay thêm
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{wallet.name}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-rose-600">{formatCurrency(currentDebt)}</span>
                        <span className="text-xs font-bold text-rose-300">₫</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Tiến độ chi trả</p>
                        <p className="text-[11px] font-black text-emerald-600">{progress.toFixed(0)}%</p>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                        <span>Đã trả: {formatCurrency(totalPaid)}₫</span>
                        <span>Gốc: {formatCurrency(originalDebt)}₫</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); onViewLedger(wallet); }}
                    className="absolute top-6 right-32 w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:shadow-md transition-all opacity-0 group-hover:opacity-100"
                    title="Xem sổ nợ"
                  >
                    📄
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
