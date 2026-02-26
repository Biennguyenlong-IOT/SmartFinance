
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Transaction, Category, CategoryType } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  transactions: Transaction[];
  categories: Category[];
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
              <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value) + '₫'}
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <p className="text-[10px] font-bold text-indigo-600 leading-relaxed">
              💡 <span className="font-black uppercase tracking-wider">Mẹo:</span> Biểu đồ này giúp bạn nhận diện những ngày chi tiêu đột biến trong tuần để điều chỉnh kịp thời.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
