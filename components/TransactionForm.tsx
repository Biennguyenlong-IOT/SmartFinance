
import React, { useState, useEffect, useMemo } from 'react';
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
 HEAD
  onAddFavorite: (item: Omit<FavoriteItem, 'id'>) => void;
  onDeleteFavorite: (id: string) => void;
 85e4e8052c808e91e17653b9e12bb8c1a48d9261
}

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

 HEAD
export const TransactionForm: React.FC<Props> = ({ categories, wallets, favorites, onAdd, onAddFavorite, onDeleteFavorite }) => {

export const TransactionForm: React.FC<Props> = ({ categories, wallets, favorites, onAdd }) => {
 85e4e8052c808e91e17653b9e12bb8c1a48d9261
  const [displayAmount, setDisplayAmount] = useState<string>('');
  const [type, setType] = useState<CategoryType>(CategoryType.EXPENSE);
  const [categoryId, setCategoryId] = useState<string>('');
  
  // Phân loại ví
  const isDebtWallet = (w: Wallet) => w.id.includes('debt') || w.name.toLowerCase().includes('nợ');
  const assetWallets = useMemo(() => wallets.filter(w => !isDebtWallet(w)), [wallets]);
  const allWallets = wallets;

 HEAD
  // Xác định danh sách ví hiển thị: Chỉ hiện ví tài sản (không phải ví nợ)
  const displayWallets = assetWallets;

  // Xác định danh sách ví hiển thị dựa trên loại giao dịch
  const displayWallets = useMemo(() => {
    if (type === CategoryType.EXPENSE) return allWallets;
    return assetWallets;
  }, [type, allWallets, assetWallets]);
 85e4e8052c808e91e17653b9e12bb8c1a48d9261

  const [walletId, setWalletId] = useState<string>('');
  const [toWalletId, setToWalletId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [quickAddWalletId, setQuickAddWalletId] = useState<string>('default');

  // Khởi tạo ví khi mount hoặc khi loại giao dịch thay đổi
  useEffect(() => {
    if (displayWallets.length > 0) {
      // Nếu ví hiện tại không nằm trong danh sách hiển thị (ví dụ: đang chọn ví nợ mà chuyển sang Thu nhập)
      if (!displayWallets.find(w => w.id === walletId)) {
        setWalletId(displayWallets[0].id);
      }
    }
  }, [displayWallets, walletId]);

  // Khởi tạo ví đích cho Chuyển tiền
  useEffect(() => {
    if (type === CategoryType.TRANSFER && assetWallets.length > 0) {
      if (!toWalletId || !assetWallets.find(w => w.id === toWalletId)) {
        setToWalletId(assetWallets[1]?.id || assetWallets[0].id);
      }
    }
  }, [type, assetWallets, toWalletId]);

  // Cập nhật categoryId ngay khi type thay đổi để tránh "thẻ trống"
  useEffect(() => {
    if (type !== CategoryType.TRANSFER) {
      const validCats = categories.filter(c => c.type === type);
      if (validCats.length > 0) {
        if (!validCats.find(c => c.id === categoryId)) {
          setCategoryId(validCats[0].id);
        }
      }
    } else {
      setCategoryId('12'); // ID hệ thống cho chuyển khoản
    }
  }, [type, categories, categoryId]);

  const numAmount = parseInputNumber(displayAmount);
  const selectedWallet = wallets.find(w => w.id === walletId);

  // Kiểm tra số dư (chỉ cảnh báo nếu không phải ví nợ)
  const isInsufficient = (type === CategoryType.EXPENSE || type === CategoryType.TRANSFER) && 
                         selectedWallet && 
                         !isDebtWallet(selectedWallet) &&
                         selectedWallet.balance < numAmount;

 HEAD
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0 || (isInsufficient && type === CategoryType.TRANSFER) || isSubmitting) return;
    
    setIsSubmitting(true);
    const selectedCategory = categories.find(c => c.id === categoryId);
    
    try {
      await onAdd({
        amount: numAmount,
        categoryId: type === CategoryType.TRANSFER ? '12' : categoryId,
        walletId,
        toWalletId: type === CategoryType.TRANSFER ? toWalletId : undefined,
        note: note.trim() || (selectedCategory ? selectedCategory.name : ''),
        type,
        date: new Date().toISOString(),
        icon: type === CategoryType.TRANSFER ? '🔄' : selectedCategory?.icon
      });
      setDisplayAmount('');
      setNote('');
    } finally {
      setIsSubmitting(false);
    }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0 || (isInsufficient && type === CategoryType.TRANSFER)) return;
    const selectedCategory = categories.find(c => c.id === categoryId);
    onAdd({
      amount: numAmount,
      categoryId: type === CategoryType.TRANSFER ? '12' : categoryId,
      walletId,
      toWalletId: type === CategoryType.TRANSFER ? toWalletId : undefined,
      note: note.trim() || (selectedCategory ? selectedCategory.name : ''),
      type,
      date: new Date().toISOString(),
      icon: type === CategoryType.TRANSFER ? '🔄' : selectedCategory?.icon
    });
    setDisplayAmount('');
    setNote('');
 85e4e8052c808e91e17653b9e12bb8c1a48d9261
  };

  const handleQuickAmount = (amt: number) => {
    const current = parseInputNumber(displayAmount);
    setDisplayAmount(formatInputNumber((current + amt).toString()));
  };

  const filteredCategories = categories.filter(c => c.type === type);

  const groupedFavorites = favorites.reduce((acc, fav) => {
    if (!acc[fav.shopName]) acc[fav.shopName] = [];
    acc[fav.shopName].push(fav);
    return acc;
  }, {} as Record<string, FavoriteItem[]>);

  const hasFavorites = Object.keys(groupedFavorites).length > 0;

  const selectClass = "w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2394a3b8%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat pr-12";

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
          {(['EXPENSE', 'INCOME', 'TRANSFER'] as CategoryType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                type === t ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'
              }`}
            >
              {t === 'EXPENSE' ? 'Chi tiêu' : t === 'INCOME' ? 'Thu nhập' : 'Chuyển tiền'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số tiền</label>
              <button type="button" onClick={() => setDisplayAmount('')} className="text-[10px] font-black text-red-400 uppercase">Xóa</button>
            </div>
            <div className="relative mb-4">
              <input
                type="text"
                inputMode="numeric"
                value={displayAmount}
                onChange={(e) => setDisplayAmount(formatInputNumber(e.target.value))}
                placeholder="0"
                className={`w-full px-6 py-6 bg-slate-50 border rounded-3xl text-4xl font-black outline-none transition-all ${
                  isInsufficient ? 'border-red-200 text-red-600' : 'border-slate-100 text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-50'
                }`}
                required
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-2xl">₫</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-2">
              {QUICK_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAmount(amt)}
                  className="py-3 bg-white border border-slate-100 rounded-xl text-[11px] font-black text-slate-600 hover:bg-indigo-50 hover:border-indigo-100 active:scale-95 transition-all shadow-sm"
                >
                  +{amt/1000}K
                </button>
              ))}
            </div>
            {isInsufficient && (
              <p className="text-[10px] text-red-500 font-bold mt-2 ml-1 animate-pulse">
                ⚠️ {isDebtWallet(selectedWallet!) ? 'Lưu ý: Bạn đang chi tiêu bằng ví nợ.' : 'Số dư khả dụng không đủ!'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {type !== CategoryType.TRANSFER ? (
              <>
                <select 
                  value={categoryId} 
                  onChange={(e) => setCategoryId(e.target.value)} 
                  className={selectClass}
                >
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))
                  ) : (
                    <option value="">Chọn danh mục...</option>
                  )}
                </select>
                <select 
                  value={walletId} 
                  onChange={(e) => setWalletId(e.target.value)} 
                  className={selectClass}
                >
                  {displayWallets.map(w => (
                    <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <select 
                  value={walletId} 
                  onChange={(e) => setWalletId(e.target.value)} 
                  className={selectClass}
                >
                  {assetWallets.map(w => <option key={w.id} value={w.id}>Từ: {w.icon} {w.name}</option>)}
                </select>
                <select 
                  value={toWalletId} 
                  onChange={(e) => setToWalletId(e.target.value)} 
                  className={selectClass}
                >
                  {assetWallets.map(w => <option key={w.id} value={w.id}>Đến: {w.icon} {w.name}</option>)}
                </select>
              </>
            )}
          </div>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú (Ví dụ: Ăn sáng...)"
            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
          />

 HEAD
          <div className="flex gap-3">
            {!isInsufficient && (
              <button
                type="submit"
                disabled={numAmount <= 0 || isSubmitting}
                className={`flex-1 py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all active:scale-[0.98] ${
                  (numAmount <= 0 || isSubmitting)
                    ? 'bg-slate-200 text-slate-400 shadow-none' 
                    : (type === CategoryType.EXPENSE ? 'bg-rose-500' : type === CategoryType.INCOME ? 'bg-emerald-500' : 'bg-indigo-600')
                }`}
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu giao dịch'}
              </button>
            )}
            
            {type === CategoryType.EXPENSE && numAmount > 0 && !isInsufficient && (
              <button
                type="button"
                onClick={() => {
                  const cat = categories.find(c => c.id === categoryId);
                  const shop = note.includes(':') ? note.split(':')[0] : 'Khác';
                  const itemName = note.includes(':') ? note.split(':')[1].trim() : note || cat?.name || 'Món mới';
                  onAddFavorite({
                    name: itemName,
                    price: numAmount,
                    categoryId,
                    icon: cat?.icon || '✨',
                    shopName: shop,
                    defaultWalletId: walletId
                  });
                  alert('Đã thêm vào món quen!');
                }}
                className="px-6 py-5 bg-amber-400 text-white rounded-2xl font-black text-xl shadow-xl shadow-amber-100 active:scale-[0.98] transition-all"
                title="Thêm vào món quen"
              >
                ⭐
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={numAmount <= 0}
            className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all active:scale-[0.98] ${
              numAmount <= 0 
                ? 'bg-slate-200 text-slate-400 shadow-none' 
                : (type === CategoryType.EXPENSE ? 'bg-rose-500' : type === CategoryType.INCOME ? 'bg-emerald-500' : 'bg-indigo-600')
            }`}
          >
            Lưu giao dịch
          </button>
 85e4e8052c808e91e17653b9e12bb8c1a48d9261
        </form>
      </div>

      {type CategoryType.EXPENSE && hasFavorites && (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span> Món quen ghi nhanh
            </h3>
            <select 
              value={quickAddWalletId}
              onChange={(e) => setQuickAddWalletId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-500 outline-none appearance-none"
            >
              <option value="default">Ví mặc định</option>
 HEAD
              {assetWallets.map(w => (

              {allWallets.map(w => (
85e4e8052c808e91e17653b9e12bb8c1a48d9261
                <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-6">
            {Object.keys(groupedFavorites).map((shop) => (
              <div key={shop} className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{shop}</p>
                <div className="grid grid-cols-2 gap-3">
                  {groupedFavorites[shop].map(fav => (
 HEAD
                    <div key={fav.id} className="relative group">
                      <button
                        onClick={() => {
                          const wId = quickAddWalletId === 'default' ? fav.defaultWalletId : quickAddWalletId;
                          onAdd({ amount: fav.price, categoryId: fav.categoryId, walletId: wId, note: `${fav.shopName}: ${fav.name}`, type: CategoryType.EXPENSE, date: new Date().toISOString(), icon: fav.icon });
                        }}
                        className="w-full flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-100 hover:bg-indigo-50/30 transition-all active:scale-[0.97] text-left"
                      >
                        <span className="text-2xl mb-2">{fav.icon}</span>
                        <p className="text-xs font-black text-slate-700 truncate">{fav.name}</p>
                        <p className="text-[10px] font-bold text-indigo-500">{fav.price.toLocaleString('vi-VN')}₫</p>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Xóa món "${fav.name}" khỏi danh sách quen?`)) {
                            onDeleteFavorite(fav.id);
                          }
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[10px] text-slate-400 hover:text-rose-500 hover:border-rose-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        ✕
                      </button>
                    </div>

                    <button
                      key={fav.id}
                      onClick={() => {
                        const wId = quickAddWalletId === 'default' ? fav.defaultWalletId : quickAddWalletId;
                        onAdd({ amount: fav.price, categoryId: fav.categoryId, walletId: wId, note: `${fav.shopName}: ${fav.name}`, type: CategoryType.EXPENSE, date: new Date().toISOString(), icon: fav.icon });
                      }}
                      className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-100 hover:bg-indigo-50/30 transition-all active:scale-[0.97] group text-left"
                    >
                      <span className="text-2xl mb-2">{fav.icon}</span>
                      <p className="text-xs font-black text-slate-700 truncate">{fav.name}</p>
                      <p className="text-[10px] font-bold text-indigo-500">{fav.price.toLocaleString('vi-VN')}₫</p>
                    </button>
 85e4e8052c808e91e17653b9e12bb8c1a48d9261
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
