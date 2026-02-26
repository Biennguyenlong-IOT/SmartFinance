
import React, { useState, useMemo } from 'react';
import { Wallet } from '../types';

interface Props {
  debtWallet: Wallet;
  wallets: Wallet[];
  onClose: () => void;
  onPay: (sourceWalletId: string, amount: number) => void;
}

const formatCurrency = (amount: number) => {
  return amount.toLocaleString('vi-VN').replace(/,/g, '.');
};

const formatNumber = (val: string) => {
  if (!val) return '';
  const nums = val.replace(/\D/g, '');
  return nums.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseNumber = (val: string) => {
  return parseFloat(val.replace(/\./g, '')) || 0;
};

export const PaymentModal: React.FC<Props> = ({ debtWallet, wallets, onClose, onPay }) => {
  const currentDebtAmount = Math.abs(debtWallet.balance);
  const [sourceId, setSourceId] = useState(wallets.filter(w => !w.id.includes('debt') && !w.name.toLowerCase().includes('nợ'))[0]?.id || wallets[0].id);
  const [displayAmount, setDisplayAmount] = useState(formatNumber(currentDebtAmount.toString()));

  const numAmount = parseNumber(displayAmount);
  const sourceWallet = wallets.find(w => w.id === sourceId);
  const isInsufficient = sourceWallet && !sourceWallet.id.includes('debt') && sourceWallet.balance < numAmount;
  
  const remainingDebt = Math.max(0, currentDebtAmount - numAmount);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayAmount(formatNumber(e.target.value));
  };

  const setPercentAmount = (percent: number) => {
    const amt = Math.floor(currentDebtAmount * percent);
    setDisplayAmount(formatNumber(amt.toString()));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0 || isInsufficient) return;
    onPay(sourceId, numAmount);
  };

  const otherWallets = wallets.filter(w => w.id !== debtWallet.id && !w.name.toLowerCase().includes('nợ'));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
        <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Thanh toán nợ</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ghi chép trả nợ cho {debtWallet.name}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-200 text-slate-400 transition-all active:scale-90">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200/20 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1 relative z-10">Dư nợ hiện tại</p>
            <p className="text-4xl font-black text-rose-600 relative z-10">{formatCurrency(currentDebtAmount)}<span className="text-xl ml-1">₫</span></p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nguồn tiền thanh toán</label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {otherWallets.map(w => (
                  <label key={w.id} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${sourceId === w.id ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="source" checked={sourceId === w.id} onChange={() => setSourceId(w.id)} className="sr-only" />
                      <span className="text-2xl">{w.icon}</span>
                      <div>
                        <p className="text-sm font-black text-slate-800">{w.name}</p>
                        <p className={`text-[10px] font-bold ${w.balance < numAmount ? 'text-rose-500' : 'text-slate-400'}`}>
                          Số dư: {formatCurrency(w.balance)}₫
                        </p>
                      </div>
                    </div>
                    {sourceId === w.id && <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center"><span className="text-white text-[10px]">✓</span></div>}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số tiền trả (Từng phần)</label>
                <button type="button" onClick={() => setDisplayAmount('')} className="text-[10px] font-black text-rose-500 uppercase">Xóa</button>
              </div>
              <div className="relative mb-3">
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl focus:ring-4 outline-none font-black text-2xl transition-all ${isInsufficient ? 'border-rose-200 focus:ring-rose-50 text-rose-600' : 'border-slate-100 focus:ring-indigo-50 text-slate-800'}`}
                  required
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl">₫</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[0.25, 0.5, 0.75, 1].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPercentAmount(p)}
                    className="py-2.5 bg-white border border-slate-100 rounded-xl text-[10px] font-black text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 transition-all active:scale-95 shadow-sm"
                  >
                    {p === 1 ? 'HẾT' : `${p * 100}%`}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center px-1 py-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Dư nợ còn lại dự kiến:</span>
                <span className={`text-sm font-black mr-3 ${remainingDebt > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {formatCurrency(remainingDebt)}₫
                </span>
              </div>
              
              {isInsufficient && <p className="text-[10px] text-rose-500 font-bold mt-2 ml-1 animate-pulse italic">⚠️ Nguồn tiền không đủ để thực hiện thanh toán này!</p>}
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Hủy</button>
            <button 
              type="submit" 
              disabled={isInsufficient || numAmount <= 0}
              className={`flex-[2] py-4 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-[0.98] ${
                isInsufficient || numAmount <= 0 ? 'bg-slate-200 cursor-not-allowed shadow-none' : 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700'
              }`}
            >
              {isInsufficient ? 'Số dư không đủ' : 'Xác nhận trả nợ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
