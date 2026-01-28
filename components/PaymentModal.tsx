
import React, { useState } from 'react';
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
  const [sourceId, setSourceId] = useState(wallets[0].id);
  const [displayAmount, setDisplayAmount] = useState(formatNumber(Math.abs(debtWallet.balance).toString()));

  const numAmount = parseNumber(displayAmount);
  const sourceWallet = wallets.find(w => w.id === sourceId);
  const isInsufficient = sourceWallet && sourceWallet.balance < numAmount;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayAmount(formatNumber(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0 || isInsufficient) return;
    onPay(sourceId, numAmount);
  };

  const otherWallets = wallets.filter(w => w.id !== debtWallet.id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Thanh toán nợ</h3>
            <p className="text-sm text-slate-500">Cho {debtWallet.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100 text-center">
            <p className="text-xs font-bold text-red-600 uppercase mb-1">Số tiền đang nợ</p>
            <p className="text-3xl font-black text-red-700">{formatCurrency(Math.abs(debtWallet.balance))}đ</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Thanh toán từ ví</label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {otherWallets.map(w => (
                  <label key={w.id} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${sourceId === w.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="source" checked={sourceId === w.id} onChange={() => setSourceId(w.id)} className="sr-only" />
                      <span className="text-xl">{w.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{w.name}</p>
                        <p className={`text-xs font-medium ${w.balance < numAmount ? 'text-red-500' : 'text-slate-500'}`}>
                          Số dư: {formatCurrency(w.balance)}đ
                        </p>
                      </div>
                    </div>
                    {sourceId === w.id && <span className="text-indigo-600 font-bold">✓</span>}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Số tiền trả</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none font-bold text-lg ${isInsufficient ? 'border-red-300 focus:ring-red-100 text-red-600' : 'border-slate-200 focus:ring-indigo-500'}`}
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₫</span>
              </div>
              {isInsufficient && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 animate-pulse italic">Nguồn tiền không đủ để trả!</p>}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Hủy</button>
            <button 
              type="submit" 
              disabled={isInsufficient}
              className={`flex-[2] py-3 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 ${
                isInsufficient ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 shadow-indigo-200'
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
