
import React, { useState, useEffect } from 'react';
import { Category, Wallet, CategoryType, FavoriteItem } from '../types';
import { formatInputNumber, parseInputNumber } from '../utils';

interface Props {
  categories: Category[];
  wallets: Wallet[];
  favorites: FavoriteItem[];
  onAdd: (transaction: {
    amount: number;
    categoryId: string;
    walletId: string;
    note: string;
    type: CategoryType;
    date: string;
    icon?: string;
    toWalletId?: string;
  }) => void;
}

export const TransactionForm: React.FC<Props> = ({ categories, wallets, favorites, onAdd }) => {
  const [displayAmount, setDisplayAmount] = useState<string>('');
  const [type, setType] = useState<CategoryType>(CategoryType.EXPENSE);
  const [categoryId, setCategoryId] = useState<string>('');
  const [walletId, setWalletId] = useState<string>(wallets[0].id);
  const [toWalletId, setToWalletId] = useState<string>(wallets[1]?.id || wallets[0].id);
  const [note, setNote] = useState<string>('');
  const [quickAddWalletId, setQuickAddWalletId] = useState<string>('default');

  // Tự động chọn danh mục đầu tiên phù hợp khi thay đổi loại giao dịch (Chi/Thu)
  useEffect(() => {
    if (type !== CategoryType.TRANSFER) {
      const firstValidCat = categories.find(c => c.type === type);
      if (firstValidCat) {
        setCategoryId(firstValidCat.id);
      }
    } else {
      setCategoryId('12'); // Mặc định cho Chuyển khoản
    }
  }, [type, categories]);

  const numAmount = parseInputNumber(displayAmount);
  const selectedWallet = wallets.find(w => w.id === walletId);
  const isDebtWallet = (w: Wallet) => w.id.includes('debt') || w.name.toLowerCase().includes('nợ');

  const isInsufficient = (type === CategoryType.EXPENSE || type === CategoryType.TRANSFER) && 
                         selectedWallet && 
                         !isDebtWallet(selectedWallet) &&
                         selectedWallet.balance < numAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0 || isInsufficient) return;
    
    const selectedCategory = categories.find(c => c.id === categoryId);
    
    onAdd({
      amount: numAmount,
      categoryId: type === CategoryType.TRANSFER ? '12' : categoryId,
      walletId,
      toWalletId: type === CategoryType.TRANSFER ? toWalletId : undefined,
      note: note.trim() || (selectedCategory ? selectedCategory.name : ''),
      type,
      date: new Date().toISOString(), // Luôn sử dụng thời gian hiện tại
      icon: type === CategoryType.TRANSFER ? '🔄' : selectedCategory?.icon
    });
    
    // Reset form
    setDisplayAmount('');
    setNote('');
  };

  const handleQuickAdd = (fav: FavoriteItem) => {
    const targetWalletId = quickAddWalletId === 'default' ? fav.defaultWalletId : quickAddWalletId;
    const targetWallet = wallets.find(w => w.id === targetWalletId);
    
    if (targetWallet && !isDebtWallet(targetWallet) && targetWallet.balance < fav.price) {
      alert(`Ví "${targetWallet.name}" không đủ số dư!`);
      return;
    }

    onAdd({
      amount: fav.price,
      categoryId: fav.categoryId,
      walletId: targetWalletId,
      note: `${fav.shopName}: ${fav.name}`,
      type: CategoryType.EXPENSE,
      date: new Date().toISOString(),
      icon: fav.icon
    });
  };

  const filteredCategories = categories.filter(c => c.type === type);

  const groupedFavorites = favorites.reduce((acc, fav) => {
    if (!acc[fav.shopName]) acc[fav.shopName] = [];
    acc[fav.shopName].push(fav);
    return acc;
  }, {} as Record<string, FavoriteItem[]>);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
      {/* Manual Form Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
          {(['EXPENSE', 'INCOME', 'TRANSFER'] as CategoryType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                type === t 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'EXPENSE' ? 'Chi tiêu' : t === 'INCOME' ? 'Thu nhập' : 'Chuyển khoản'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Số tiền giao dịch</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={displayAmount}
                onChange={(e) => setDisplayAmount(formatInputNumber(e.target.value))}
                placeholder="0"
                className={`w-full px-6 py-5 bg-slate-50 border rounded-3xl focus:ring-4 outline-none transition-all text-3xl font-black ${
                  isInsufficient ? 'border-red-200 focus:ring-red-50 text-red-600' : 'border-slate-100 focus:ring-indigo-50 text-slate-900'
                }`}
                required
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-2xl">₫</span>
            </div>
            {isInsufficient && <p className="text-xs text-red-500 font-bold mt-2 ml-1 animate-pulse">⚠️ Số dư ví không đủ!</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {type !== CategoryType.TRANSFER ? (
              <>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Danh mục</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold appearance-none"
                  >
                    {filteredCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tài khoản</label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold appearance-none"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Từ ví</label>
                  <select value={walletId} onChange={(e) => setWalletId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold appearance-none">
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Đến ví</label>
                  <select value={toWalletId} onChange={(e) => setToWalletId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold appearance-none">
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ghi chú</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Bạn muốn lưu lại điều gì?"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isInsufficient}
            className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transform active:scale-[0.98] transition-all ${
              isInsufficient 
                ? 'bg-slate-200 cursor-not-allowed text-slate-400 shadow-none' 
                : (type === CategoryType.EXPENSE ? 'bg-rose-500 shadow-rose-100' : type === CategoryType.INCOME ? 'bg-emerald-500 shadow-emerald-100' : 'bg-indigo-600 shadow-indigo-100')
            }`}
          >
            {isInsufficient ? 'Số dư không đủ để thực hiện' : 'Lưu giao dịch'}
          </button>
        </form>
      </div>

      {/* Quick Add Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span> Ghi chép nhanh từ quán quen
          </h3>
          <div className="w-1/3">
            <select 
              value={quickAddWalletId}
              onChange={(e) => setQuickAddWalletId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none appearance-none"
            >
              <option value="default">💳 Ví mặc định</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.keys(groupedFavorites).map((shop) => {
            const items = groupedFavorites[shop];
            return (
              <div key={shop} className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{shop}</p>
                <div className="flex flex-col gap-2">
                  {items.map(fav => (
                    <button
                      key={fav.id}
                      onClick={() => handleQuickAdd(fav)}
                      className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-all active:scale-[0.97] group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-2xl group-hover:scale-110 transition-transform">{fav.icon}</span>
                        <div className="text-left min-w-0">
                          <p className="text-xs font-black text-slate-700 truncate">{fav.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{fav.price.toLocaleString('vi-VN')}₫</p>
                        </div>
                      </div>
                      <span className="w-8 h-8 flex items-center justify-center bg-white rounded-xl border border-slate-100 text-indigo-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        +
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
