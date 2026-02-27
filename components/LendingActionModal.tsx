
import React, { useState } from 'react';
import { Wallet, CategoryType } from '../types';
import { formatCurrency, parseInputNumber, formatInputNumber } from '../utils';

interface Props {
  lendingWallet: Wallet;
  wallets: Wallet[];
  mode: 'collect' | 'lend_more';
  onClose: () => void;
  onAction: (amount: number, sourceWalletId: string, note: string) => void;
}

export const LendingActionModal: React.FC<Props> = ({ lendingWallet, wallets, mode, onClose, onAction }) => {
  const [amount, setAmount] = useState('');
  const [sourceWalletId, setSourceWalletId] = useState(wallets.find(w => !w.id.includes('debt') && w.subType !== 'lending')?.id || '');
  const [note, setNote] = useState(mode === 'collect' ? `Thu hồi nợ từ ${lendingWallet.name}` : `Cho ${lendingWallet.name} vay thêm`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInputNumber(amount);
    if (numAmount <= 0 || !sourceWalletId) return;
    onAction(numAmount, sourceWalletId, note);
  };

  const assetWallets = wallets.filter(w => !w.id.includes('debt') && w.subType !== 'lending');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`${mode === 'collect' ? 'bg-emerald-600' : 'bg-amber-500'} p-8 text-white relative`}>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
          >
            ✕
          </button>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-4">
            {mode === 'collect' ? '💰' : '🤝'}
          </div>
          <h2 className="text-2xl font-black tracking-tight">{mode === 'collect' ? 'Thu hồi nợ' : 'Cho vay thêm'}</h2>
          <p className={`${mode === 'collect' ? 'text-emerald-100' : 'text-amber-100'} text-xs font-bold uppercase tracking-widest mt-1`}>
            {mode === 'collect' ? 'Nhận lại tiền từ người vay' : 'Ghi nhận khoản cho vay mới'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Số tiền</label>
            <div className="relative">
              <input 
                type="text" 
                inputMode="numeric"
                value={amount} 
                onChange={e => setAmount(formatInputNumber(e.target.value))}
                className={`w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-2xl font-black text-slate-800 focus:bg-white outline-none transition-all ${mode === 'collect' ? 'focus:border-emerald-500' : 'focus:border-amber-500'}`} 
                placeholder="0"
                required
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold">₫</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              {mode === 'collect' ? 'Nhận tiền vào ví' : 'Lấy tiền từ ví'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {assetWallets.map(w => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSourceWalletId(w.id)}
                  className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${sourceWalletId === w.id ? (mode === 'collect' ? 'border-emerald-500 bg-emerald-50' : 'border-amber-500 bg-amber-50') : 'border-slate-100 bg-slate-50 hover:bg-white'}`}
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
              className={`w-full py-4 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 ${mode === 'collect' ? 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700' : 'bg-amber-500 shadow-amber-100 hover:bg-amber-600'}`}
            >
              Xác nhận {mode === 'collect' ? 'thu hồi' : 'cho vay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
