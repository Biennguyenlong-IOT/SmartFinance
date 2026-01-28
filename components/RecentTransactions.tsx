
import React, { useState } from 'react';
import { Transaction, Category, Wallet, CategoryType } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  onViewAll?: () => void;
}

export const RecentTransactions: React.FC<Props> = ({ transactions, categories, wallets, onViewAll }) => {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Sắp xếp giao dịch theo ngày mới nhất
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const displayTransactions = onViewAll ? sorted.slice(0, 15) : sorted;

  // Nhóm giao dịch theo ngày
  const grouped = displayTransactions.reduce((acc, t) => {
    const dateKey = t.date.split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const todayStr = new Date().toISOString().split('T')[0];

  const toggleExpand = (dateKey: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDates(newExpanded);
  };

  const getDaySummary = (txs: Transaction[]) => {
    const expense = txs.filter(t => t.type === CategoryType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const income = txs.filter(t => t.type === CategoryType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    return { expense, income };
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          {onViewAll ? 'Giao dịch gần đây' : 'Lịch sử giao dịch'}
        </h2>
        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
          {onViewAll ? 'Bản xem nhanh' : `${transactions.length} giao dịch`}
        </span>
      </div>
      
      <div className="space-y-6">
        {dateKeys.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3 opacity-20">🍃</div>
            <p className="text-slate-400 italic text-sm">Chưa có giao dịch nào được ghi lại.</p>
          </div>
        ) : (
          dateKeys.map(dateKey => {
            const isToday = dateKey === todayStr;
            const isExpanded = isToday || expandedDates.has(dateKey);
            const dayTransactions = grouped[dateKey];
            const { expense, income } = getDaySummary(dayTransactions);
            
            return (
              <div key={dateKey} className="space-y-3">
                {/* Date Header / Summary Row */}
                <div 
                  onClick={() => !isToday && toggleExpand(dateKey)}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
                    !isToday ? 'cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${
                      isToday ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100'
                    }`}>
                      {isToday ? 'Hôm nay' : new Date(dateKey).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                    </span>
                    {!isToday && !isExpanded && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayTransactions.length} giao dịch
                      </span>
                    )}
                  </div>

                  {!isToday && !isExpanded ? (
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="flex gap-3 text-[10px] font-black uppercase tracking-tighter">
                          {income > 0 && <span className="text-emerald-500">+{formatCurrency(income)}₫</span>}
                          {expense > 0 && <span className="text-rose-500">-{formatCurrency(expense)}₫</span>}
                        </div>
                      </div>
                      <span className="text-slate-300 group-hover:text-indigo-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </div>
                  ) : !isToday && (
                    <button className="text-slate-300 hover:text-indigo-500 p-1">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                  )}
                </div>
                
                {/* Transactions List (Full for Today, Collapsible for others) */}
                {isExpanded && (
                  <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {dayTransactions.map(t => {
                      const category = categories.find(c => c.id === t.categoryId);
                      const wallet = wallets.find(w => w.id === t.walletId);
                      const isExpense = t.type === CategoryType.EXPENSE;
                      const displayIcon = t.icon || category?.icon || '💰';
                      
                      return (
                        <div key={t.id} className="group flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white shadow-sm border border-slate-100 flex-shrink-0">
                              {displayIcon}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-700 text-xs truncate mb-0.5">{t.note || category?.name || 'Giao dịch'}</p>
                              <div className="flex items-center gap-2">
                                <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase ${wallet?.id.includes('debt') ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                  {wallet?.name}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase">
                                  {new Date(t.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <p className={`font-black text-sm tracking-tight ${isExpense ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {isExpense ? '-' : '+'}{formatCurrency(t.amount)}<span className="text-[10px] ml-0.5 font-bold">₫</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {onViewAll && sorted.length > 15 && (
        <button 
          onClick={onViewAll}
          className="w-full mt-10 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors border-t border-slate-50 flex items-center justify-center gap-2 group"
        >
          Xem toàn bộ lịch sử <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      )}
    </div>
  );
};
