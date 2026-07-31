
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
  const [walletType, setWalletType] = useState<'payment' | 'debit' | 'savings' | 'debt' | 'lending' | 'hui'>('payment');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [interestRate, setInterestRate] = useState('');
  const [termMonths, setTermMonths] = useState('');

  // State riêng cho Hụi
  const [huiShareAmount, setHuiShareAmount] = useState('');
  const [huiTotalPeriods, setHuiTotalPeriods] = useState('');
  const [huiDailyQuota, setHuiDailyQuota] = useState('');
  const [huiCompletedPeriods, setHuiCompletedPeriods] = useState('0');
  const [huiTotalActualPaid, setHuiTotalActualPaid] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    
    const isDebt = walletType === 'debt';
    const isSavings = walletType === 'savings';
    const isHui = walletType === 'hui';

    const shareAmount = parseInputNumber(huiShareAmount);
    const totalPeriods = parseInt(huiTotalPeriods) || 12;
    const dailyQuota = parseInputNumber(huiDailyQuota);
    const completedPeriods = parseInt(huiCompletedPeriods) || 0;
    const totalActualPaid = parseInputNumber(huiTotalActualPaid);

    onAdd({
      name: newName,
      balance: isHui ? totalActualPaid : parseInputNumber(newBalance),
      icon: isHui ? '🎋' : newIcon,
      color: isDebt ? '#f43f5e' : isSavings ? '#10b981' : isHui ? '#a855f7' : walletType === 'debit' ? '#0ea5e9' : '#6366f1',
      isSavings,
      subType: walletType,
      startDate: isSavings ? startDate : undefined,
      interestRate: isSavings ? parseFloat(interestRate) : undefined,
      termMonths: isSavings ? parseInt(termMonths) : undefined,
      // Thuộc tính Hụi
      huiShareAmount: isHui ? shareAmount : undefined,
      huiTotalPeriods: isHui ? totalPeriods : undefined,
      huiCompletedPeriods: isHui ? completedPeriods : undefined,
      huiDailyQuota: isHui ? dailyQuota : undefined,
      huiTotalActualPaid: isHui ? totalActualPaid : undefined,
      huiIsEnded: false
    }, isDebt);

    setNewName('');
    setNewBalance('');
    setInterestRate('');
    setTermMonths('');
    setHuiShareAmount('');
    setHuiTotalPeriods('');
    setHuiDailyQuota('');
    setHuiCompletedPeriods('0');
    setHuiTotalActualPaid('0');
    setWalletType('payment');
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

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loại ví</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { id: 'payment', label: 'Thanh toán', icon: '💰', color: 'bg-indigo-500' },
                { id: 'debit', label: 'Ghi nợ (Debit)', icon: '💳', color: 'bg-sky-500' },
                { id: 'savings', label: 'Tiết kiệm', icon: '🏦', color: 'bg-emerald-500' },
                { id: 'debt', label: 'Khoản nợ', icon: '🚩', color: 'bg-rose-500' },
                { id: 'lending', label: 'Cho vay', icon: '🤝', color: 'bg-amber-500' },
                { id: 'hui', label: 'Quản lý Hụi', icon: '🎋', color: 'bg-purple-500' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setWalletType(t.id as any)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${walletType === t.id ? `border-indigo-500 bg-white shadow-md` : 'border-transparent bg-white/50 hover:bg-white'}`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm ${t.color}`}>{t.icon}</span>
                  <span className={`text-[10px] font-black uppercase tracking-tighter ${walletType === t.id ? 'text-indigo-600' : 'text-slate-400'}`}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
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
          </div>

          {walletType === 'savings' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 animate-in fade-in duration-300">
              <div>
                <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 ml-1">Ngày mở sổ</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border-emerald-200 text-sm font-bold focus:ring-4 focus:ring-emerald-50 outline-none" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 ml-1">Lãi suất (%/năm)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={interestRate} 
                  onChange={e => setInterestRate(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border-emerald-200 text-sm font-bold focus:ring-4 focus:ring-emerald-50 outline-none" 
                  placeholder="Ví dụ: 6.5" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 ml-1">Kỳ hạn (tháng)</label>
                <input 
                  type="number" 
                  value={termMonths} 
                  onChange={e => setTermMonths(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border-emerald-200 text-sm font-bold focus:ring-4 focus:ring-emerald-50 outline-none" 
                  placeholder="Ví dụ: 12" 
                />
              </div>
            </div>
          )}

          {walletType === 'hui' && (
            <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-4 animate-in fade-in duration-300">
              <div className="text-xs font-black text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>🎋</span> Cấu hình dây Hụi / Họ / Phường
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1.5 ml-1">1. Số tiền tham gia (dây hụi)</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={huiShareAmount} 
                    onChange={e => setHuiShareAmount(formatInputNumber(e.target.value))} 
                    className="w-full px-4 py-3 rounded-xl border-purple-200 text-sm font-bold focus:ring-4 focus:ring-purple-50 outline-none" 
                    placeholder="Ví dụ: 10.000.000" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1.5 ml-1">2. Tổng số kỳ</label>
                  <input 
                    type="number" 
                    value={huiTotalPeriods} 
                    onChange={e => setHuiTotalPeriods(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl border-purple-200 text-sm font-bold focus:ring-4 focus:ring-purple-50 outline-none" 
                    placeholder="Ví dụ: 12" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1.5 ml-1">3. Tiền định mức hằng ngày</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={huiDailyQuota} 
                    onChange={e => setHuiDailyQuota(formatInputNumber(e.target.value))} 
                    className="w-full px-4 py-3 rounded-xl border-purple-200 text-sm font-bold focus:ring-4 focus:ring-purple-50 outline-none" 
                    placeholder="Ví dụ: 100.000" 
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-purple-100">
                <div>
                  <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1.5 ml-1">Số kỳ đã đóng ban đầu</label>
                  <input 
                    type="number" 
                    value={huiCompletedPeriods} 
                    onChange={e => setHuiCompletedPeriods(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl border-purple-200 text-sm font-bold focus:ring-4 focus:ring-purple-50 outline-none" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1.5 ml-1">Tổng tiền thực tế đã đóng ban đầu</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={huiTotalActualPaid} 
                    onChange={e => setHuiTotalActualPaid(formatInputNumber(e.target.value))} 
                    className="w-full px-4 py-3 rounded-xl border-purple-200 text-sm font-bold focus:ring-4 focus:ring-purple-50 outline-none" 
                    placeholder="0" 
                  />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all">
            Tạo ví mới
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {wallets.map(wallet => {
          const isDebtWallet = wallet.id.includes('debt') || (typeof wallet.name === 'string' && wallet.name.toLowerCase().includes('nợ')) || wallet.subType === 'debt';
          const isHui = wallet.subType === 'hui';
          const typeLabel = wallet.subType === 'payment' ? 'Thanh toán' : wallet.subType === 'debit' ? 'Ghi nợ' : wallet.subType === 'savings' ? 'Tiết kiệm' : wallet.subType === 'lending' ? 'Cho vay' : wallet.subType === 'hui' ? 'Quản lý Hụi' : 'Khoản nợ';
          const typeColor = wallet.subType === 'payment' ? 'text-indigo-500' : wallet.subType === 'debit' ? 'text-sky-500' : wallet.subType === 'savings' ? 'text-emerald-500' : wallet.subType === 'lending' ? 'text-amber-500' : wallet.subType === 'hui' ? 'text-purple-600' : 'text-rose-500';
          
          return (
            <div key={wallet.id} className={`p-5 rounded-3xl border flex items-center gap-4 group transition-all ${isDebtWallet ? 'bg-rose-50/30 border-rose-100 hover:border-rose-300' : wallet.isSavings ? 'bg-emerald-50/30 border-emerald-100 hover:border-emerald-300' : isHui ? 'bg-purple-50/30 border-purple-100 hover:border-purple-300' : 'bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-white'}`}>
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
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border ${isDebtWallet ? 'bg-white border-rose-100' : wallet.isSavings ? 'bg-white border-emerald-100' : 'bg-white border-slate-100'}`}>
                    {wallet.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input 
                      type="text" 
                      value={wallet.name}
                      onChange={(e) => onUpdate(wallet.id, { name: e.target.value })}
                      className="w-full bg-transparent border-none focus:outline-none font-black text-slate-800 text-sm truncate"
                    />
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className={`text-[9px] font-black uppercase tracking-tighter ${typeColor}`}>
                        {typeLabel}: {wallet.balance.toLocaleString('vi-VN')}₫
                      </p>
                      {wallet.isSavings && (
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-slate-300">|</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] font-bold text-slate-400">Lãi:</span>
                            <input 
                              type="number"
                              step="0.1"
                              value={wallet.interestRate || ''}
                              onChange={(e) => onUpdate(wallet.id, { interestRate: parseFloat(e.target.value) || 0 })}
                              className="w-10 bg-transparent border-none focus:outline-none text-[8px] font-black text-emerald-600"
                            />
                            <span className="text-[8px] font-bold text-slate-400">%</span>
                          </div>
                          <span className="text-[8px] text-slate-300">|</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] font-bold text-slate-400">Hạn:</span>
                            <input 
                              type="number"
                              value={wallet.termMonths || ''}
                              onChange={(e) => onUpdate(wallet.id, { termMonths: parseInt(e.target.value) || 0 })}
                              className="w-8 bg-transparent border-none focus:outline-none text-[8px] font-black text-emerald-600"
                            />
                            <span className="text-[8px] font-bold text-slate-400">th</span>
                          </div>
                        </div>
                      )}
                    </div>
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
