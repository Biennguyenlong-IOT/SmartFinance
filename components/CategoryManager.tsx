
import React, { useState } from 'react';
import { Category, CategoryType } from '../types';

interface Props {
  categories: Category[];
  onAdd: (category: Omit<Category, 'id'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Category>) => void;
}

const COMMON_ICONS = ['🍕', '🥤', '🚕', '🎬', '💊', '👕', '📚', '🏠', '🎁', '💰', '💹', '🛠️', '🏸', '🐾', '💈'];

export const CategoryManager: React.FC<Props> = ({ categories, onAdd, onDelete, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // New category state
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('✨');
  const [newType, setNewType] = useState<CategoryType>(CategoryType.EXPENSE);
  const [newBudget, setNewBudget] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    onAdd({
      name: newName,
      icon: newIcon,
      type: newType,
      color: newType === CategoryType.EXPENSE ? '#f43f5e' : '#10b981',
      budget: newBudget ? parseFloat(newBudget.replace(/\./g, '')) : undefined
    });
    setNewName('');
    setNewBudget('');
    setIsAdding(false);
  };

  const initiateDelete = (id: string) => {
    // Không cho phép xóa danh mục "Chuyển tiền" hệ thống (id: 12)
    if (id === '12') {
      alert("Đây là danh mục hệ thống không thể xóa.");
      return;
    }
    setDeletingId(id);
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <span className="text-2xl">🏷️</span> Quản lý danh mục
        </h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-indigo-100 transition-all"
        >
          {isAdding ? 'Hủy' : '+ Thêm danh mục'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-6 animate-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tên danh mục</label>
              <input 
                type="text" 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border-slate-200 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none" 
                placeholder="Ví dụ: Làm đẹp" 
                required 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Loại</label>
              <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                <button 
                  type="button"
                  onClick={() => setNewType(CategoryType.EXPENSE)}
                  className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${newType === CategoryType.EXPENSE ? 'bg-rose-500 text-white' : 'text-slate-400'}`}
                >
                  Chi tiêu
                </button>
                <button 
                  type="button"
                  onClick={() => setNewType(CategoryType.INCOME)}
                  className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${newType === CategoryType.INCOME ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}
                >
                  Thu nhập
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ngân sách (Tùy chọn)</label>
              <input 
                type="text" 
                value={newBudget} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setNewBudget(val.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
                }} 
                className="w-full px-4 py-3 rounded-xl border-slate-200 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none" 
                placeholder="Ví dụ: 5.000.000" 
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Biểu tượng</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ICONS.map(icon => (
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
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all">
            Tạo danh mục mới
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.filter(c => c.type !== CategoryType.TRANSFER).map(cat => (
          <div key={cat.id} className="min-h-[72px] p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center relative overflow-hidden group hover:border-indigo-100 hover:bg-white transition-all">
            {deletingId === cat.id ? (
              <div className="flex-1 flex items-center justify-between animate-in fade-in slide-in-from-right-2 duration-200">
                <p className="text-[10px] font-black text-rose-600 uppercase">Xóa "{cat.name}"?</p>
                <div className="flex gap-2">
                  <button onClick={() => setDeletingId(null)} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-lg">Hủy</button>
                  <button onClick={() => { onDelete(cat.id); setDeletingId(null); }} className="px-3 py-1.5 bg-rose-600 text-white text-[9px] font-black uppercase rounded-lg shadow-sm">Xóa</button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xl shadow-sm mr-3 flex-shrink-0">
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0 mr-2">
                  <input 
                    type="text" 
                    value={cat.name}
                    onChange={(e) => onUpdate(cat.id, { name: e.target.value })}
                    className="w-full bg-transparent border-none focus:outline-none font-bold text-slate-700 text-sm truncate"
                  />
                  <div className="flex items-center gap-2">
                    <p className={`text-[8px] font-black uppercase tracking-tighter ${cat.type === CategoryType.EXPENSE ? 'text-rose-400' : 'text-emerald-500'}`}>
                      {cat.type === CategoryType.EXPENSE ? 'Chi tiêu' : 'Thu nhập'}
                    </p>
                    {cat.type === CategoryType.EXPENSE && (
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-slate-300">|</span>
                        <input 
                          type="text"
                          placeholder="Ngân sách"
                          value={cat.budget ? new Intl.NumberFormat('vi-VN').format(cat.budget) : ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            onUpdate(cat.id, { budget: val ? parseInt(val) : undefined });
                          }}
                          className="w-20 bg-transparent border-none focus:outline-none text-[8px] font-black text-indigo-400 placeholder:text-slate-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => initiateDelete(cat.id)}
                  className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
