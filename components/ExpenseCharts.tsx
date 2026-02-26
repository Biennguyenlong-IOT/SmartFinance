
<<<<<<< HEAD
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Transaction, Category, CategoryType } from '../types';
=======
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Transaction, Category, CategoryType, Wallet } from '../types';
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
import { formatCurrency } from '../utils';

interface Props {
  transactions: Transaction[];
  categories: Category[];
<<<<<<< HEAD
}

type TimeRange = 'week' | 'month' | 'lastMonth' | 'all';

export const ExpenseCharts: React.FC<Props> = ({ transactions, categories }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (timeRange === 'all') return true;
      
      if (timeRange === 'week') {
        const day = now.getDay() || 7; // 1 (Mon) to 7 (Sun)
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - (day - 1));
        return tDate >= startOfWeek;
      }
      
      if (timeRange === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return tDate >= startOfMonth;
      }
      
      if (timeRange === 'lastMonth') {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        return tDate >= startOfLastMonth && tDate <= endOfLastMonth;
      }
      
      return true;
    });
  }, [transactions, timeRange]);

  const expenseData = useMemo(() => {
    const data = categories
      .filter(c => c.type === CategoryType.EXPENSE)
      .map(cat => {
        const total = filteredTransactions
          .filter(t => t.categoryId === cat.id && t.type === CategoryType.EXPENSE)
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: cat.name, value: total, color: cat.color, icon: cat.icon };
      })
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
    return data;
  }, [filteredTransactions, categories]);

  const totalExpense = useMemo(() => expenseData.reduce((sum, d) => sum + d.value, 0), [expenseData]);
  const totalIncome = useMemo(() => 
    filteredTransactions
      .filter(t => t.type === CategoryType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0)
  , [filteredTransactions]);

  // Daily summary for the last 7 days (always 7 days regardless of filter for the bar chart)
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const total = transactions
        .filter(t => t.date.split('T')[0] === dateStr && t.type === CategoryType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        date: new Date(dateStr).toLocaleDateString('vi-VN', { weekday: 'short' }),
        amount: total
      };
    }).reverse();
  }, [transactions]);

  const rangeLabels: Record<TimeRange, string> = {
    week: 'Tuần này',
    month: 'Tháng này',
    lastMonth: 'Tháng trước',
    all: 'Tất cả'
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector & Summary */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Thống kê chi tiết</h2>
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            {(['week', 'month', 'lastMonth', 'all'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  timeRange === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {rangeLabels[r]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Tổng thu nhập</p>
            <p className="text-xl font-black text-emerald-700">+{formatCurrency(totalIncome)}₫</p>
          </div>
          <div className="bg-rose-50/50 border border-rose-100 p-5 rounded-2xl">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Tổng chi tiêu</p>
            <p className="text-xl font-black text-rose-700">-{formatCurrency(totalExpense)}₫</p>
          </div>
          <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Thặng dư</p>
            <p className={`text-xl font-black ${totalIncome - totalExpense >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
              {totalIncome - totalExpense >= 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpense)}₫
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart & Breakdown */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Phân bổ theo hạng mục</h3>
          {expenseData.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-400">
               <span className="text-4xl mb-2 opacity-20">📊</span>
               <p className="text-xs italic">Không có dữ liệu chi tiêu trong khoảng thời gian này</p>
             </div>
          ) : (
            <div className="space-y-8">
=======
  wallets: Wallet[];
}

// Bảng màu rực rỡ bổ sung cho các danh mục mới hoặc không có màu
const VIBRANT_PALETTE = [
  '#6366f1', '#f43f5e', '#10b981', '#fbbf24', 
  '#0ea5e9', '#a855f7', '#ec4899', '#f97316', 
  '#14b8a6', '#8b5cf6'
];

export const ExpenseCharts: React.FC<Props> = ({ transactions, categories, wallets }) => {
  // Dữ liệu phân bổ chi tiêu (Pie Chart)
  const expenseData = categories
    .filter(c => c.type === CategoryType.EXPENSE && c.id !== '10' && c.id !== '12')
    .map((cat, index) => {
      const total = transactions
        .filter(t => t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return { 
        name: cat.name, 
        value: total, 
        // Ưu tiên màu của danh mục, nếu không có thì lấy trong bảng màu Vibrant
        color: cat.color || VIBRANT_PALETTE[index % VIBRANT_PALETTE.length] 
      };
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value); // Sắp xếp từ lớn đến nhỏ

  // Dữ liệu chi tiêu 7 ngày (Bar Chart)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const total = transactions
      .filter(t => t.date.split('T')[0] === dateStr && t.type === CategoryType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      date: new Date(dateStr).toLocaleDateString('vi-VN', { weekday: 'short' }),
      amount: total
    };
  }).reverse();

  // Dữ liệu danh sách nợ (Horizontal Bar Chart)
  const isDebtWallet = (w: Wallet) => w.id.includes('debt') || w.name.toLowerCase().includes('nợ');
  const debtWallets = wallets
    .filter(w => isDebtWallet(w) && w.balance > 0)
    .map(w => ({
      name: w.name,
      amount: w.balance,
      icon: w.icon
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ phân bổ chi tiêu */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[420px] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phân bổ chi tiêu</h2>
            {expenseData.length > 0 && (
              <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 uppercase">
                {expenseData.length} danh mục
              </span>
            )}
          </div>
          
          {expenseData.length === 0 ? (
             <div className="flex flex-col items-center justify-center flex-1 text-slate-300">
               <span className="text-4xl mb-2">📊</span>
               <p className="text-xs font-bold uppercase tracking-widest">Chưa có dữ liệu chi tiêu</p>
             </div>
          ) : (
            <div className="flex-1 flex flex-col">
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
              <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
<<<<<<< HEAD
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
=======
                      innerRadius={75}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      animationBegin={0}
                      animationDuration={1000}
                    >
                      {expenseData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                        />
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value) + '₫'}
<<<<<<< HEAD
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng chi</span>
                  <span className="text-xl font-black text-slate-800">{formatCurrency(totalExpense)}₫</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {expenseData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-transparent hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-white shadow-sm" style={{ color: item.color }}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-700">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{Math.round((item.value / totalExpense) * 100)}% tổng chi</p>
                      </div>
                    </div>
                    <p className="text-xs font-black text-slate-800">{formatCurrency(item.value)}₫</p>
=======
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', 
                        fontWeight: '800',
                        fontSize: '12px',
                        padding: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for the donut chart */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tổng cộng</span>
                  <span className="text-xl font-black text-slate-800">
                    {formatCurrency(expenseData.reduce((sum, d) => sum + d.value, 0))}₫
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-6">
                {expenseData.slice(0, 6).map((entry, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{entry.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-700">{Math.round((entry.value / expenseData.reduce((s, d) => s + d.value, 0)) * 100)}%</span>
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

<<<<<<< HEAD
        {/* Bar Chart */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Xu hướng 7 ngày qua</h3>
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase">Hàng ngày</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={10} 
                  tick={{ fill: '#94a3b8', fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={10} 
                  tick={{ fill: '#94a3b8', fontWeight: 'bold' }}
                  tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${val/1000}K` : val}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc', radius: 8 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  formatter={(value: number) => formatCurrency(value) + '₫'}
                  labelStyle={{ fontWeight: 'black', marginBottom: '4px', color: '#1e293b' }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#6366f1" 
                  radius={[8, 8, 0, 0]} 
                  barSize={32}
                  animationDuration={1500}
=======
        {/* Biểu đồ chi tiêu tuần */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-[420px]">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Xu hướng 7 ngày</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#94a3b8', fontWeight: 'bold' }} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#f8fafc', radius: 10 }}
                  contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  formatter={(value: number) => formatCurrency(value) + '₫'}
                />
                <Bar dataKey="amount" fill="url(#barGradient)" radius={[8, 8, 8, 8]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Biểu đồ danh sách khoản nợ */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Biểu đồ dư nợ hiện tại</h2>
          <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 uppercase tracking-tighter">
            {debtWallets.length} khoản nợ
          </span>
        </div>
        
        {debtWallets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-300">
            <span className="text-4xl mb-2">🎉</span>
            <p className="text-xs font-bold uppercase tracking-widest">Bạn không có khoản nợ nào!</p>
          </div>
        ) : (
          <div className="h-auto min-h-[200px]">
            <ResponsiveContainer width="100%" height={debtWallets.length * 60 + 40}>
              <BarChart
                layout="vertical"
                data={debtWallets}
                margin={{ left: 40, right: 40, top: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={11} 
                  width={100}
                  tick={{ fill: '#475569', fontWeight: '800' }}
                />
                <Tooltip
                  cursor={{ fill: '#fff1f2', radius: 10 }}
                  contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  formatter={(value: number) => formatCurrency(value) + '₫'}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#f43f5e" 
                  radius={[0, 10, 10, 0]} 
                  barSize={30} 
                  label={{ position: 'right', formatter: (v: number) => formatCurrency(v) + '₫', fontSize: 10, fontWeight: 'bold', fill: '#f43f5e' }}
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
<<<<<<< HEAD
          <div className="mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <p className="text-[10px] font-bold text-indigo-600 leading-relaxed">
              💡 <span className="font-black uppercase tracking-wider">Mẹo:</span> Biểu đồ này giúp bạn nhận diện những ngày chi tiêu đột biến trong tuần để điều chỉnh kịp thời.
            </p>
          </div>
        </div>
=======
        )}
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
      </div>
    </div>
  );
};
