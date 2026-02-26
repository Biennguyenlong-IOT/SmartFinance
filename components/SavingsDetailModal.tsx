
import React from 'react';
import { Wallet } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  wallet: Wallet;
  onClose: () => void;
}

export const SavingsDetailModal: React.FC<Props> = ({ wallet, onClose }) => {
  const { balance, startDate, interestRate, termMonths, name, icon } = wallet;

  const calculateMaturity = () => {
    if (!interestRate || !termMonths) return { interest: 0, total: balance };
    
    // Đơn giản hóa: Lãi = Gốc * Lãi suất * (Số tháng / 12)
    const interest = balance * (interestRate / 100) * (termMonths / 12);
    return {
      interest,
      total: balance + interest
    };
  };

  const { interest, total } = calculateMaturity();

  const getMaturityDate = () => {
    if (!startDate || !termMonths) return null;
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + termMonths);
    return date.toLocaleDateString('vi-VN');
  };

  const maturityDate = getMaturityDate();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-emerald-600 p-8 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
          >
            ✕
          </button>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-4">
            {icon}
          </div>
          <h2 className="text-2xl font-black tracking-tight">{name}</h2>
          <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mt-1">Chi tiết sổ tiết kiệm</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số tiền gốc</p>
              <p className="text-lg font-black text-slate-800">{formatCurrency(balance)}₫</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lãi suất</p>
              <p className="text-lg font-black text-emerald-600">{interestRate}%<span className="text-[10px] ml-1">/năm</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày mở sổ</p>
              <p className="text-sm font-bold text-slate-700">{startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kỳ hạn</p>
              <p className="text-sm font-bold text-slate-700">{termMonths} tháng</p>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full"></div>

          <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Tiền lãi dự kiến</p>
              <p className="text-sm font-black text-emerald-700">+{formatCurrency(interest)}₫</p>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Tổng nhận khi tất toán</p>
                <p className="text-2xl font-black text-emerald-800 tracking-tighter">{formatCurrency(total)}₫</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Ngày đáo hạn</p>
                <p className="text-xs font-bold text-emerald-700">{maturityDate || 'N/A'}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
