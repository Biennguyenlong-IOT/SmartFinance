
import React, { useState } from 'react';
import { FavoriteItem, Category, Wallet } from '../types';

interface Props {
  favorites: FavoriteItem[];
  categories: Category[];
  wallets: Wallet[];
  onUpdate: (id: string, updates: Partial<FavoriteItem>) => void;
  onAdd: (item: Omit<FavoriteItem, 'id'>) => void;
  onDelete: (id: string) => void;
  onUpdateShopName: (oldName: string, newName: string) => void;
}

const COMMON_ICONS = ['🍔', '☕', '🍜', '🍺', '🚬', '🥛', '🥡', '🍰', '🛒', '⚡', '💊', '🚗'];

const formatNumber = (val: string | number) => {
  const s = typeof val === 'number' ? Math.floor(val).toString() : val;
  if (!s) return '';
  const nums = s.replace(/\D/g, '');
  return nums.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseNumber = (val: string) => {
  return parseFloat(val.replace(/\./g, '')) || 0;
};

export const FavoriteManager: React.FC<Props> = ({ favorites, categories, wallets, onUpdate, onAdd, onDelete, onUpdateShopName }) => {
  const [editingShop, setEditingShop] = useState<string | null>(null);
  const [tempShopName, setTempShopName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New item form state
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newShop, setNewShop] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0]?.id || '');
  const [newWallet, setNewWallet] = useState(wallets[0]?.id || '');
  const [newIcon, setNewIcon] = useState(COMMON_ICONS[0]);

  const groupedFavorites = favorites.reduce((acc, fav) => {
    if (!acc[fav.shopName]) acc[fav.shopName] = [];
    acc[fav.shopName].push(fav);
    return acc;
  }, {} as Record<string, FavoriteItem[]>);

  const startEditing = (name: string) => {
    setEditingShop(name);
    setTempShopName(name);
  };

  const saveShopName = (oldName: string) => {
    onUpdateShopName(oldName, tempShopName);
    setEditingShop(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newShop || !newPrice) return;
    
    // Fix: Corrected 'nexName' typo to 'newName'
    onAdd({
      name: newName,
      price: parseNumber(newPrice),
      shopName: newShop,
      categoryId: newCategory,
      defaultWalletId: newWallet,
      icon: newIcon
    });

    setNewName('');
    setNewPrice('');
    setNewShop('');
    setIsAdding(false);
  };

  const initiateDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(id);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(null);
  };

  const executeDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(id);
    setDeletingId(null);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="text-xl">📋</span> Đơn giá quán quen
        </h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${isAdding ? 'bg-red-50 text-red-600' : 'bg-indigo-600 text-white shadow-md shadow-indigo-100'}`}
        >
          {isAdding ? 'Hủy bỏ' : '+ Thêm món mới'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tên quán</label>
              <input type="text" value={newShop} onChange={e => setNewShop(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs" placeholder="Ví dụ: Cafe 127" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tên món</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs" placeholder="Ví dụ: Cafe sữa" required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Đơn giá</label>
              <input type="text" inputMode="numeric" value={newPrice} onChange={e => setNewPrice(formatNumber(e.target.value))} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" placeholder="20.000" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Danh mục</label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs">
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ví mặc định</label>
              <select value={newWallet} onChange={e => setNewWallet(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs">
                {wallets.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Biểu tượng</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ICONS.map(icon => (
                <button key={icon} type="button" onClick={() => setNewIcon(icon)} className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${newIcon === icon ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-100 active:scale-95 transition-all">Lưu vào danh sách</button>
        </form>
      )}
      
      <div className="space-y-8">
        {/* Fix: use Object.keys to avoid 'unknown' type issues with Object.entries in some TS environments */}
        {Object.keys(groupedFavorites).map((shopName) => {
          const items = groupedFavorites[shopName];
          return (
            <div key={shopName} className="space-y-3">
              <div className="flex items-center gap-2">
                {editingShop === shopName ? (
                  <div className="flex items-center gap-2 bg-indigo-50 p-1 rounded-lg">
                    <input
                      autoFocus
                      type="text"
                      value={tempShopName}
                      onChange={(e) => setTempShopName(e.target.value)}
                      onBlur={() => saveShopName(shopName)}
                      onKeyDown={(e) => e.key === 'Enter' && saveShopName(shopName)}
                      className="text-xs font-black text-indigo-600 uppercase tracking-tighter bg-transparent outline-none border-b border-indigo-300 px-2 py-0.5"
                    />
                    <button onClick={() => saveShopName(shopName)} className="text-indigo-600 text-[10px] font-bold">LƯU</button>
                  </div>
                ) : (
                  <h3 
                    onClick={() => startEditing(shopName)}
                    className="text-xs font-black text-indigo-500 uppercase tracking-tighter bg-indigo-50 px-3 py-1.5 rounded-lg inline-block cursor-pointer hover:bg-indigo-100 transition-colors group"
                  >
                    📍 {shopName} <span className="opacity-0 group-hover:opacity-100 ml-2 text-[8px]">✎ Sửa tên quán</span>
                  </h3>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map(fav => (
                  <div key={fav.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 transition-all shadow-sm group relative min-h-[64px]">
                    {deletingId === fav.id ? (
                      <div className="flex-1 flex items-center justify-between animate-in fade-in slide-in-from-right-2 duration-200">
                        <p className="text-xs font-bold text-red-600">Xóa món "{fav.name}"?</p>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => cancelDelete(e)}
                            className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            Hủy
                          </button>
                          <button 
                            onClick={(e) => executeDelete(e, fav.id)}
                            className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700 shadow-sm transition-colors"
                          >
                            Xác nhận
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-xl w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-slate-50">{fav.icon}</span>
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={fav.name}
                              onChange={(e) => onUpdate(fav.id, { name: e.target.value })}
                              className="text-sm font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-indigo-200 focus:outline-none w-full truncate"
                            />
                            <p className="text-[10px] text-slate-400">Đơn giá (Bấm để sửa)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatNumber(fav.price)}
                              onChange={(e) => onUpdate(fav.id, { price: parseNumber(e.target.value) })}
                              className="w-24 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-right font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-300">₫</span>
                          </div>
                          <button 
                            type="button"
                            onMouseDown={(e) => initiateDelete(e as any, fav.id)}
                            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-red-500 rounded-xl transition-all border border-transparent hover:border-red-600 flex-shrink-0 z-30 cursor-pointer active:scale-90"
                            title="Xóa món này"
                          >
                            <span className="text-xl font-bold">✕</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-10 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
        <p className="text-xs text-indigo-700 flex gap-2">
          <span className="text-base">💡</span>
          <span>
            <b>Hướng dẫn:</b> Bạn có thể sửa trực tiếp tên món và giá tiền trong các ô nhập liệu. Để xóa hẳn một món, hãy nhấn vào dấu <b>✕</b> màu xám ở góc phải mỗi món và chọn <b>Xác nhận</b>.
          </span>
        </p>
      </div>
    </div>
  );
};
