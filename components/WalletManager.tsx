
import React, { useState } from 'react';
import { Wallet } from '../types';
import { formatInputNumber, parseInputNumber } from '../utils';

interface Props {
  wallets: Wallet[];
  onAdd: (wallet: Omit<Wallet, 'id'>, isDebt: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Wallet>) => void;
}

const WALLET_ICONS = ['💵', '💳', '🏦', '💰', '🐷', '🏧', '🧧', '💎', '🪙', '☕', '🏠', '🛒'];

export const WalletManager: React.FC<Props> = ({ wallets, onAdd, onDelete, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New wallet state
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [newIcon, setNewIcon] = useState('💵');
  const [isDebt, setIsDebt] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    onAdd({
      name: newName,
      balance: parseInputNumber(newBalance),
      icon: newIcon,
      color: isDebt ? '#f43f5e' : '#6366f1'
    }, isDebt);
    setNewName('');
    setNewBalance('');
    setIsAdding(false);
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <span className="text-2xl">👛</span> Quản lý ví tiền
        </h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-indigo-100 transition-all"
        >
          {isAdding ? 'Hủy' : '+ Thêm ví mới'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-6 animate-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tên ví / Tài khoản</label>
              <input 
                type="text" 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border-slate-200 text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none" 
                placeholder="Ví dụ: Momo, Vietinbank..." 
                required 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Số dư ban đầu</label>
              <input 
                type="text" 
                inputMode="numeric"
                value={newBalance} 
                onChange={e => setNewBalance(formatInputNumber(e.target.value))} 
                className="w-full px-4 py-3 rounded-xl border-slate-200 text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none" 
                placeholder="0" 
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Biểu tượng</label>
              <div className="flex flex-wrap gap-2">
                {WALLET_ICONS.map(icon => (
                  <button 
                    key={icon} 
                    type="button" 
                    onClick={() => setNewIcon(icon)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-xl border-2 transition-all ${newIcon === icon ? 'border-indigo-500 bg-white shadow-sm' : 'border-transparent bg-white/50 hover:bg-white'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center p-4 bg-white rounded-2xl border border-slate-200">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Loại ví</label>
               <button
                type="button"
                onClick={() => setIsDebt(!isDebt)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${isDebt ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'}`}
               >
                 {isDebt ? '🚩 Ví Ghi Nợ' : '💰 Ví Tài Sản'}
               </button>
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all">
            Tạo ví mới
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {wallets.map(wallet => {
          const isDebtWallet = wallet.id.includes('debt') || wallet.name.toLowerCase().includes('nợ');
          return (
            <div key={wallet.id} className={`p-5 rounded-3xl border flex items-center gap-4 group transition-all ${isDebtWallet ? 'bg-rose-50/30 border-rose-100 hover:border-rose-300' : 'bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-white'}`}>
              {deletingId === wallet.id ? (
                <div className="flex-1 flex items-center justify-between animate-in fade-in slide-in-from-right-2 duration-200">
                  <p className="text-[10px] font-black text-rose-600 uppercase">Xóa ví "{wallet.name}"?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setDeletingId(null)} className="px-3 py-1.5 bg-white text-slate-600 text-[9px] font-black uppercase rounded-lg border border-slate-200">Hủy</button>
                    <button onClick={() => { onDelete(wallet.id); setDeletingId(null); }} className="px-3 py-1.5 bg-rose-600 text-white text-[9px] font-black uppercase rounded-lg shadow-sm">Xóa</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border ${isDebtWallet ? 'bg-white border-rose-100' : 'bg-white border-slate-100'}`}>
                    {wallet.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input 
                      type="text" 
                      value={wallet.name}
                      onChange={(e) => onUpdate(wallet.id, { name: e.target.value })}
                      className="w-full bg-transparent border-none focus:outline-none font-black text-slate-800 text-sm truncate"
                    />
                    <p className={`text-[9px] font-black uppercase tracking-tighter ${isDebtWallet ? 'text-rose-500' : 'text-indigo-500'}`}>
                      {isDebtWallet ? 'Khoản nợ' : 'Tài sản'}: {wallet.balance.toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                  <button 
                    onClick={() => setDeletingId(wallet.id)}
                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
