
import React, { useState } from 'react';
import { Wallet, CategoryType } from '../types';
import { formatCurrency, parseInputNumber, formatInputNumber } from '../utils';

interface Props {
  debtWallet: Wallet;
  wallets: Wallet[];
  onClose: () => void;
  onBorrow: (amount: number, targetWalletId: string, note: string) => void;
}

export const BorrowModal: React.FC<Props> = ({ debtWallet, wallets, onClose, onBorrow }) => {
  const [amount, setAmount] = useState('');
  const [targetWalletId, setTargetWalletId] = useState(wallets.find(w => !w.id.includes('debt'))?.id || '');
  const [note, setNote] = useState(`Vay thêm vào ${debtWallet.name}`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInputNumber(amount);
    if (numAmount <= 0 || !targetWalletId) return;
    onBorrow(numAmount, targetWalletId, note);
  };

  const assetWallets = wallets.filter(w => !w.id.includes('debt'));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-rose-600 p-8 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
          >
            ✕
          </button>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-4">
            💸
          </div>
          <h2 className="text-2xl font-black tracking-tight">Vay thêm</h2>
          <p className="text-rose-100 text-xs font-bold uppercase tracking-widest mt-1">Ghi nhận khoản vay mới</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Số tiền vay</label>
            <div className="relative">
              <input 
                type="text" 
                inputMode="numeric"
                value={amount} 
                onChange={e => setAmount(formatInputNumber(e.target.value))}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-2xl font-black text-slate-800 focus:border-rose-500 focus:bg-white outline-none transition-all" 
                placeholder="0"
                required
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold">₫</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nhận tiền vào ví</label>
            <div className="grid grid-cols-2 gap-2">
              {assetWallets.map(w => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setTargetWalletId(w.id)}
                  className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${targetWalletId === w.id ? 'border-rose-500 bg-rose-50' : 'border-slate-100 bg-slate-50 hover:bg-white'}`}
                >
                  <span className="text-xl">{w.icon}</span>
                  <span className="text-[10px] font-black text-slate-600 truncate">{w.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ghi chú</label>
            <input 
              type="text" 
              value={note} 
              onChange={e => setNote(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:bg-white outline-none transition-all" 
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95"
            >
              Xác nhận vay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
