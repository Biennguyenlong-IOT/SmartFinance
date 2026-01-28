
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Transaction, Category, CategoryType } from '../types';

interface Props {
  transactions: Transaction[];
  categories: Category[];
}

export const ExpenseCharts: React.FC<Props> = ({ transactions, categories }) => {
  const expenseData = categories
    .filter(c => c.type === CategoryType.EXPENSE)
    .map(cat => {
      const total = transactions
        .filter(t => t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: cat.name, value: total, color: cat.color };
    })
    .filter(d => d.value > 0);

  // Daily summary for the last 7 days
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 min-h-[350px]">
        <h2 className="text-lg font-bold mb-6 text-slate-800">Phân bổ chi tiêu</h2>
        {expenseData.length === 0 ? (
           <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Không có dữ liệu chi tiêu</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => value.toLocaleString('vi-VN') + 'đ'}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 min-h-[350px]">
        <h2 className="text-lg font-bold mb-6 text-slate-800">Chi tiêu 7 ngày qua</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => value.toLocaleString('vi-VN') + 'đ'}
              />
              <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
