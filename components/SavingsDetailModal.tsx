
import React, { useState } from 'react';
import { Wallet } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  wallet: Wallet;
  wallets: Wallet[];
  onClose: () => void;
  onSettle: (savingsWalletId: string, destinationWalletId: string, amount: number, isEarly: boolean) => void;
}

export const SavingsDetailModal: React.FC<Props> = ({ wallet, wallets, onClose, onSettle }) => {
  const { id: savingsId, balance, startDate, interestRate, termMonths, name, icon } = wallet;

  // Lọc các ví nhận tiền có thể (không phải ví nợ, không phải ví cho vay, không phải ví tiết kiệm khác)
  const receivingWallets = wallets.filter(w => {
    const isDebt = w.subType === 'debt' || w.id.includes('debt') || (typeof w.name === 'string' && w.name.toLowerCase().includes('nợ'));
    const isLending = w.subType === 'lending' || (typeof w.name === 'string' && w.name.toLowerCase().includes('cho vay'));
    const isSavings = w.isSavings === true || w.subType === 'savings';
    return !isDebt && !isLending && !isSavings;
  });

  const [targetWalletId, setTargetWalletId] = useState(receivingWallets[0]?.id || '');
  const [showSettleForm, setShowSettleForm] = useState(false);

  const calculateMaturity = () => {
    if (!interestRate || !termMonths) return { interest: 0, total: balance };
    // Lãi = Gốc * Lãi suất * (Số tháng / 12)
    const interest = balance * (interestRate / 100) * (termMonths / 12);
    return {
      interest,
      total: balance + interest
    };
  };

  const { interest, total } = calculateMaturity();

  const getMaturityDateObj = () => {
    if (!startDate || !termMonths) return null;
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + termMonths);
    return date;
  };

  const maturityDateObj = getMaturityDateObj();
  const isMatured = maturityDateObj ? (new Date() >= maturityDateObj) : false;
  const maturityDateStr = maturityDateObj ? maturityDateObj.toLocaleDateString('vi-VN') : 'N/A';

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWalletId) {
      alert("Vui lòng chọn ví nhận tiền!");
      return;
    }

    const settleAmount = isMatured ? total : balance;
    const isEarly = !isMatured;

    const confirmMsg = isEarly
      ? `Sổ tiết kiệm CHƯA ĐẾN HẠN ĐÁO HẠN!\nNếu tất toán trước hạn, bạn chỉ nhận được tiền gốc (${formatCurrency(balance)}₫) và mất toàn bộ tiền lãi.\n\nBạn có chắc chắn muốn tất toán trước hạn không?`
      : `Chúc mừng sổ tiết kiệm của bạn đã ĐÁO HẠN đúng hạn!\nBạn sẽ nhận toàn bộ gốc và lãi (${formatCurrency(total)}₫).\n\nBạn có muốn thực hiện tất toán không?`;

    if (window.confirm(confirmMsg)) {
      onSettle(savingsId, targetWalletId, settleAmount, isEarly);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-emerald-600 p-8 text-white relative">
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
          >
            ✕
          </button>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-4">
            {icon}
          </div>
          <h2 className="text-2xl font-black tracking-tight">{name}</h2>
          <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mt-1">Chi tiết & Tất toán sổ tiết kiệm</p>
        </div>

        <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {!showSettleForm ? (
            <>
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
                    <p className="text-xs font-bold text-emerald-700">{maturityDateStr || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {isMatured ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-bold text-amber-800 flex items-center gap-3">
                  <span className="text-base">🔔</span>
                  Sổ tiết kiệm của bạn ĐÃ ĐÁO HẠN vào ngày {maturityDateStr}! Hãy tất toán ngay hôm nay để nhận trọn vẹn gốc & lãi.
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-600 flex items-center gap-3">
                  <span className="text-base">⏳</span>
                  Sổ tiết kiệm này chưa đến ngày đáo hạn (cần tới ngày {maturityDateStr}). Nếu tất toán trước kỳ hạn, bạn sẽ không được nhận lãi suất ưu đãi.
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95"
                >
                  Đóng
                </button>
                <button 
                  type="button"
                  onClick={() => setShowSettleForm(true)}
                  className={`flex-1 py-4 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 ${isMatured ? 'bg-amber-500 shadow-amber-100 hover:bg-amber-600' : 'bg-rose-500 shadow-rose-100 hover:bg-rose-600'}`}
                >
                  {isMatured ? 'Tất toán đúng hạn' : 'Tất toán trước hạn'}
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSettleSubmit} className="space-y-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                <span>🏦</span> Xác nhận tất toán sổ tiết kiệm
              </h3>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Hình thức tất toán:</span>
                  <span className={`font-black ${isMatured ? 'text-amber-600' : 'text-rose-500'}`}>
                    {isMatured ? 'Đúng hạn (Nhận gốc & Lãi)' : 'Trước hạn (Chỉ nhận Gốc)'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Số tiền thực thụ nhận:</span>
                  <span className="text-slate-800 font-black text-sm">
                    {formatCurrency(isMatured ? total : balance)}₫
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Chọn ví nhận tiền lấy ra</label>
                {receivingWallets.length === 0 ? (
                  <p className="text-xs text-red-500 font-bold">Bạn cần tạo ít nhất một ví thanh toán hoặc ghi nợ trước để chứa tiền tất toán!</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {receivingWallets.map(w => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setTargetWalletId(w.id)}
                        className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${targetWalletId === w.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50 hover:bg-white'}`}
                      >
                        <span className="text-xl">{w.icon}</span>
                        <div className="text-left min-w-0">
                          <p className="text-[10px] font-black text-slate-700 truncate">{w.name}</p>
                          <p className="text-[8px] font-bold text-slate-400">{formatCurrency(w.balance)}₫</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowSettleForm(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                >
                  Quay lại
                </button>
                <button 
                  type="submit"
                  disabled={receivingWallets.length === 0}
                  className="flex-1 py-4 bg-emerald-600 text-white shadow-xl shadow-emerald-100 hover:bg-emerald-700 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 disabled:opacity-50"
                >
                  Xác nhận nhận tiền
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
