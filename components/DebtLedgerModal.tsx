
import React from 'react';
import { Wallet, Transaction, CategoryType } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  wallet: Wallet;
  transactions: Transaction[];
  onClose: () => void;
}

export const DebtLedgerModal: React.FC<Props> = ({ wallet, transactions, onClose }) => {
  // Lọc giao dịch liên quan đến ví nợ này
  // 1. Ghi nợ: Chi tiêu bằng ví nợ này (walletId === wallet.id)
  // 2. Trả nợ: Giao dịch có toWalletId === wallet.id
  const ledgerEntries = transactions
    .filter(t => t.walletId === wallet.id || t.toWalletId === wallet.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalBorrowed = ledgerEntries
    .filter(t => t.walletId === wallet.id && t.type === CategoryType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaid = ledgerEntries
    .filter(t => t.toWalletId === wallet.id)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-slate-100">
              {wallet.icon}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Sổ nợ: {wallet.name}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Lịch sử vay và trả chi tiết</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-200 text-slate-400 transition-all active:scale-90">✕</button>
        </div>

        <div className="p-8 grid grid-cols-2 gap-4 bg-white border-b border-slate-50 flex-shrink-0">
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Tổng đã ghi nợ</p>
            <p className="text-lg font-black text-amber-700">{formatCurrency(totalBorrowed)}₫</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Tổng đã trả nợ</p>
            <p className="text-lg font-black text-emerald-700">{formatCurrency(totalPaid)}₫</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
          {ledgerEntries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 font-medium italic text-sm">Chưa có lịch sử giao dịch cho ví này.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ledgerEntries.map(t => {
                const isRepayment = t.toWalletId === wallet.id;
                return (
                  <div key={t.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isRepayment ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white shadow-sm border ${isRepayment ? 'border-emerald-100 text-emerald-600' : 'border-slate-100'}`}>
                        {isRepayment ? '📥' : '📤'}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-700">{t.note}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${isRepayment ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {isRepayment ? 'Trả nợ' : 'Ghi nợ'}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">
                            {new Date(t.date).toLocaleDateString('vi-VN')} {new Date(t.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-sm ${isRepayment ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {isRepayment ? '-' : '+'}{formatCurrency(t.amount)}₫
                      </p>
                      {isRepayment && (
                        <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Từ: {t.walletName}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex-shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Dư nợ hiện tại:</span>
            <span className="text-2xl font-black text-rose-600">{formatCurrency(wallet.balance)}₫</span>
          </div>
        </div>
      </div>
    </div>
  );
};
