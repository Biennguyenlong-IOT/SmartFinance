import React, { useState } from 'react';
import { Wallet } from '../types';
import { formatCurrency, formatInputNumber, parseInputNumber } from '../utils';

interface Props {
  wallet: Wallet;
  wallets: Wallet[];
  initialMode?: 'view' | 'contribute' | 'settle';
  onClose: () => void;
  onContribute: (huiWalletId: string, sourceWalletId: string, actualPaidAmount: number, isFirstPeriod: boolean) => void;
  onSettle: (huiWalletId: string, targetWalletId: string, finalSettlementAmount: number) => void;
}

export const HuiDetailModal: React.FC<Props> = ({
  wallet,
  wallets,
  initialMode = 'view',
  onClose,
  onContribute,
  onSettle
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'contribute' | 'settle'>(initialMode);

  // Confirmation state
  const [confirmStep, setConfirmStep] = useState<'none' | 'contribute' | 'settle'>('none');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lọc các ví có thể trích/nhận tiền (Ví thanh toán / Ghi nợ)
  const validWallets = wallets.filter(w => {
    const isDebt = w.subType === 'debt' || w.id.includes('debt') || (typeof w.name === 'string' && w.name.toLowerCase().includes('nợ'));
    const isLending = w.subType === 'lending' || (typeof w.name === 'string' && w.name.toLowerCase().includes('cho vay'));
    const isSavings = w.isSavings === true || w.subType === 'savings';
    const isHui = w.subType === 'hui';
    return !isDebt && !isLending && !isSavings && !isHui;
  });

  const [selectedWalletId, setSelectedWalletId] = useState(validWallets[0]?.id || '');
  const selectedWallet = validWallets.find(w => w.id === selectedWalletId);
  
  // Input tiền đóng thực tế
  const [inputDailyActual, setInputDailyActual] = useState(
    wallet.huiDailyQuota ? formatCurrency(wallet.huiDailyQuota) : ''
  );

  // Trích xuất thông tin hụi
  const shareAmount = wallet.huiShareAmount || 0;
  const totalPeriods = wallet.huiTotalPeriods || 12;
  const completedPeriods = wallet.huiCompletedPeriods || 0;
  const dailyQuota = wallet.huiDailyQuota || 0;
  const totalActualPaid = wallet.huiTotalActualPaid ?? wallet.balance ?? 0;

  // 4.1/ Kỳ đầu tiên check
  const isFirstPeriod = completedPeriods === 0;

  // 5./ Số tiền chênh lệch giữa định mức và số tiền đóng thực tế: (số kỳ đã đóng * tiền định kỳ) - tiền đã đóng
  const expectedQuotaSoFar = dailyQuota * completedPeriods;
  const diff = expectedQuotaSoFar - totalActualPaid;

  // 6./ Công thức số tiền thực tế khi ngưng trước hạn
  const remainingPeriods = Math.max(0, totalPeriods - completedPeriods);
  const remainingQuota = dailyQuota * remainingPeriods;
  const finalRealAmount = totalActualPaid + diff - remainingQuota;

  // Tiền thực tế cần trích khi đóng hụi
  const actualInput = parseInputNumber(inputDailyActual);
  const totalDeducted = isFirstPeriod ? actualInput + shareAmount : actualInput;

  // Kiểm tra số dư ví trích tiền
  const isContributeBalanceInsufficient = selectedWallet ? selectedWallet.balance < totalDeducted : false;
  const isSettleBalanceInsufficient = (finalRealAmount < 0 && selectedWallet) ? selectedWallet.balance < Math.abs(finalRealAmount) : false;

  const handleContributionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedWalletId || !selectedWallet) {
      setErrorMessage("Vui lòng chọn ví trích tiền thanh toán!");
      return;
    }

    if (actualInput <= 0) {
      setErrorMessage("Số tiền đóng thực tế phải lớn hơn 0!");
      return;
    }

    if (isContributeBalanceInsufficient) {
      setErrorMessage(`Ví "${selectedWallet.name}" không đủ số dư (${formatCurrency(selectedWallet.balance)}₫ < ${formatCurrency(totalDeducted)}₫). Vui lòng chọn ví khác!`);
      return;
    }

    // Mở modal xác nhận custom
    setConfirmStep('contribute');
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedWalletId || !selectedWallet) {
      setErrorMessage("Vui lòng chọn ví nhận/thanh toán tiền tất toán!");
      return;
    }

    if (isSettleBalanceInsufficient) {
      setErrorMessage(`Ví "${selectedWallet.name}" không đủ số dư để bù tiền (${formatCurrency(selectedWallet.balance)}₫ < ${formatCurrency(Math.abs(finalRealAmount))}₫). Vui lòng chọn ví khác!`);
      return;
    }

    // Mở modal xác nhận custom
    setConfirmStep('settle');
  };

  const executeContribution = () => {
    onContribute(wallet.id, selectedWalletId, actualInput, isFirstPeriod);
  };

  const executeSettle = () => {
    onSettle(wallet.id, selectedWalletId, finalRealAmount);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 text-white relative">
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
          >
            ✕
          </button>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-4 text-purple-600">
            {wallet.icon || '🎋'}
          </div>
          <h2 className="text-2xl font-black tracking-tight">{wallet.name}</h2>
          <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mt-1">
            Sổ Quản Lý Hụi / Họ / Phường
          </p>
        </div>

        {/* Custom Confirmation Screen */}
        {confirmStep !== 'none' ? (
          <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {confirmStep === 'contribute' && (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-100 p-6 rounded-3xl space-y-4">
                  <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-md">
                    💸
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-purple-900">Xác nhận đóng hụi</h3>
                    <p className="text-xs text-purple-700 font-bold mt-0.5">
                      {isFirstPeriod ? 'Kỳ đầu tiên (Bao gồm tiền tham gia dây hụi)' : `Kỳ thứ ${completedPeriods + 1} / ${totalPeriods}`}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-purple-100 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Ví trích tiền:</span>
                      <span className="font-black text-slate-800">{selectedWallet?.name}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Số dư hiện tại:</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(selectedWallet?.balance || 0)}₫</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Số tiền nhập đóng:</span>
                      <span className="font-bold text-slate-800">{formatCurrency(actualInput)}₫</span>
                    </div>
                    {isFirstPeriod && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>+ Tiền tham gia dây hụi:</span>
                        <span>+{formatCurrency(shareAmount)}₫</span>
                      </div>
                    )}
                    <div className="h-px bg-slate-100 my-1"></div>
                    <div className="flex justify-between text-sm font-black">
                      <span>Tổng tiền sẽ trừ:</span>
                      <span className="text-purple-700">-{formatCurrency(totalDeducted)}₫</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setConfirmStep('none')}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                  >
                    Hủy / Quay lại
                  </button>
                  <button 
                    type="button"
                    onClick={executeContribution}
                    className="flex-1 py-4 bg-purple-600 text-white shadow-xl shadow-purple-100 hover:bg-purple-700 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95"
                  >
                    Xác nhận ngay
                  </button>
                </div>
              </div>
            )}

            {confirmStep === 'settle' && (
              <div className="space-y-6">
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl space-y-4">
                  <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-md">
                    🛑
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-rose-900">Xác nhận ngưng hụi trước hạn</h3>
                    <p className="text-xs text-rose-700 font-bold mt-0.5">Thao tác này sẽ chốt sổ dây hụi này</p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-rose-100 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Ví chọn:</span>
                      <span className="font-black text-slate-800">{selectedWallet?.name}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Số tiền thực tế tính toán:</span>
                      <span className={`font-black ${finalRealAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {finalRealAmount >= 0 ? `+${formatCurrency(finalRealAmount)}₫` : `${formatCurrency(finalRealAmount)}₫`}
                      </span>
                    </div>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                      {finalRealAmount >= 0 
                        ? `Số tiền +${formatCurrency(finalRealAmount)}₫ sẽ được cộng vào ví "${selectedWallet?.name}".`
                        : `Số tiền -${formatCurrency(Math.abs(finalRealAmount))}₫ sẽ bị trừ khỏi ví "${selectedWallet?.name}".`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setConfirmStep('none')}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                  >
                    Hủy / Quay lại
                  </button>
                  <button 
                    type="button"
                    onClick={executeSettle}
                    className="flex-1 py-4 bg-rose-600 text-white shadow-xl shadow-rose-100 hover:bg-rose-700 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95"
                  >
                    Xác nhận ngưng
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Tab switcher */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
              <button 
                type="button"
                onClick={() => { setActiveTab('view'); setErrorMessage(null); }}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-2xl transition-all ${activeTab === 'view' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                📊 Chi tiết dây hụi
              </button>
              <button 
                type="button"
                onClick={() => { setActiveTab('contribute'); setErrorMessage(null); }}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-2xl transition-all ${activeTab === 'contribute' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                💸 Đóng hụi
              </button>
              <button 
                type="button"
                onClick={() => { setActiveTab('settle'); setErrorMessage(null); }}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-2xl transition-all ${activeTab === 'settle' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                🛑 Ngưng trước hạn
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Error Alert Box if any */}
              {errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
                  <span className="text-xl">⚠️</span>
                  <div className="text-xs text-rose-800 font-bold leading-relaxed flex-1">
                    {errorMessage}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setErrorMessage(null)} 
                    className="text-rose-400 hover:text-rose-600 font-black text-sm"
                  >
                    ✕
                  </button>
                </div>
              )}

              {activeTab === 'view' && (
                <div className="space-y-6">
                  {/* 1, 2, 3 parameters */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50/60 border border-purple-100 p-4 rounded-2xl space-y-1">
                      <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">1. Số tiền tham gia</p>
                      <p className="text-lg font-black text-purple-900">{formatCurrency(shareAmount)}₫</p>
                    </div>
                    <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-2xl space-y-1">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">2. Kỳ hoàn thành</p>
                      <p className="text-lg font-black text-indigo-900">{completedPeriods} / {totalPeriods} <span className="text-xs font-bold text-indigo-500">kỳ</span></p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3. Định mức / ngày</p>
                      <p className="text-base font-black text-slate-800">{formatCurrency(dailyQuota)}₫</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">4. Tổng đóng thực tế</p>
                      <p className="text-base font-black text-slate-800">{formatCurrency(totalActualPaid)}₫</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-400">Tiến độ dây hụi:</span>
                      <span className="text-purple-700 font-black">{((completedPeriods / totalPeriods) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, (completedPeriods / totalPeriods) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 5. Chênh lệch */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-3xl p-6 space-y-3">
                    <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest">
                      5. Bảng tính chênh lệch thực tế vs Định mức
                    </p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Tổng tiền đóng thực tế tích lũy:</span>
                        <span className="font-bold text-slate-800">{formatCurrency(totalActualPaid)}₫</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Tổng định mức ({completedPeriods} kỳ đã đóng):</span>
                        <span className="font-bold text-slate-800">{formatCurrency(expectedQuotaSoFar)}₫</span>
                      </div>
                      <div className="h-px bg-purple-200 my-2"></div>
                      <div className="flex justify-between items-center">
                        <span className="font-black text-slate-800">Chênh lệch (Thừa / Thiếu):</span>
                        <span className={`text-base font-black ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {diff >= 0 ? `+${formatCurrency(diff)}₫` : `${formatCurrency(diff)}₫`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setActiveTab('contribute')}
                      className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-100 transition-all active:scale-95"
                    >
                      + Đóng hụi kỳ mới
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveTab('settle')}
                      className="py-4 px-5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                      Ngưng hụi
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'contribute' && (
                <form onSubmit={handleContributionSubmit} className="space-y-6">
                  <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-xs font-bold text-purple-900 space-y-1">
                    <p className="font-black">📝 Nhập số tiền đóng hụi thực tế</p>
                    <p className="text-purple-700">Kỳ sắp đóng: <span className="font-black">Kỳ {completedPeriods + 1} / {totalPeriods}</span></p>
                    {isFirstPeriod && (
                      <p className="text-rose-600 font-extrabold mt-1">
                        ⚠️ 4.1/ Lưu ý: Đây là KỲ ĐẦU TIÊN. Số tiền thực tế trích khỏi ví sẽ tự động cộng thêm số tiền tham gia ({formatCurrency(shareAmount)}₫).
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      Chọn ví trích tiền thanh toán
                    </label>
                    {validWallets.length === 0 ? (
                      <p className="text-xs text-rose-500 font-bold">Bạn chưa có ví thanh toán nào để trích tiền!</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {validWallets.map(w => {
                          const isInsufficient = w.balance < totalDeducted;
                          return (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => { setSelectedWalletId(w.id); setErrorMessage(null); }}
                              className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all relative ${selectedWalletId === w.id ? (isInsufficient ? 'border-rose-500 bg-rose-50' : 'border-purple-600 bg-purple-50') : 'border-slate-100 bg-slate-50 hover:bg-white'}`}
                            >
                              <span className="text-xl">{w.icon}</span>
                              <div className="text-left min-w-0 flex-1">
                                <p className="text-[10px] font-black text-slate-700 truncate">{w.name}</p>
                                <p className={`text-[8px] font-bold ${isInsufficient ? 'text-rose-600 font-black' : 'text-slate-400'}`}>
                                  {formatCurrency(w.balance)}₫
                                  {isInsufficient && ' (Không đủ)'}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Warning nếu ví chọn không đủ tiền */}
                  {selectedWallet && isContributeBalanceInsufficient && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1 text-xs">
                      <p className="font-black text-amber-900 flex items-center gap-1.5">
                        <span>⚠️</span> Ví "{selectedWallet.name}" không đủ số dư thanh toán!
                      </p>
                      <p className="text-amber-800 text-[11px] leading-relaxed">
                        Số dư hiện có: <span className="font-bold">{formatCurrency(selectedWallet.balance)}₫</span> <br />
                        Số tiền cần trích: <span className="font-bold text-rose-600">{formatCurrency(totalDeducted)}₫</span>
                      </p>
                      <p className="text-[10px] font-black text-amber-700 pt-1">
                        👉 Vui lòng chọn ví thanh toán khác có đủ số dư phía trên.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2 ml-1">
                      Số tiền đóng thực tế hằng ngày (nhập vào)
                    </label>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={inputDailyActual}
                      onChange={e => { setInputDailyActual(formatInputNumber(e.target.value)); setErrorMessage(null); }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 text-lg font-black text-purple-900 focus:ring-4 focus:ring-purple-50 outline-none"
                      placeholder="0"
                      required
                    />
                  </div>

                  {/* Bảng tóm tắt tiền thực trích */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Số tiền đóng thực tế nhập:</span>
                      <span className="font-bold">{formatCurrency(actualInput)}₫</span>
                    </div>
                    {isFirstPeriod && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>+ Số tiền tham gia dây hụi:</span>
                        <span>+{formatCurrency(shareAmount)}₫</span>
                      </div>
                    )}
                    <div className="h-px bg-slate-200 my-1"></div>
                    <div className="flex justify-between text-sm font-black text-slate-800">
                      <span>Tổng tiền thực tế trích ví:</span>
                      <span className={isContributeBalanceInsufficient ? 'text-rose-600 font-extrabold' : 'text-purple-700'}>
                        {formatCurrency(totalDeducted)}₫
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => { setActiveTab('view'); setErrorMessage(null); }}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                    >
                      Quay lại
                    </button>
                    <button 
                      type="submit"
                      disabled={validWallets.length === 0 || isContributeBalanceInsufficient}
                      className="flex-1 py-4 bg-purple-600 text-white shadow-xl shadow-purple-100 hover:bg-purple-700 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isContributeBalanceInsufficient ? 'Không đủ số dư' : 'Xác nhận đóng'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'settle' && (
                <form onSubmit={handleSettleSubmit} className="space-y-6">
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-xs space-y-1 text-rose-900">
                    <p className="font-black flex items-center gap-2">
                      <span>🛑</span> 6. Công thức tính tiền ngưng hụi trước hạn
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      <span className="font-mono bg-white/80 px-1 py-0.5 rounded border border-rose-200">
                        Số tiền thực tế = Tổng tiền đóng thực tế + Tiền chênh lệch - (Số tiền định mức × (Tổng số kỳ - Số kỳ hoàn thành))
                      </span>
                    </p>
                  </div>

                  {/* Bảng chi tiết tính toán */}
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>(+) Tổng tiền đóng thực tế:</span>
                      <span className="font-bold text-slate-800">{formatCurrency(totalActualPaid)}₫</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>(+/-) Tiền chênh lệch:</span>
                      <span className={`font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {diff >= 0 ? `+${formatCurrency(diff)}₫` : `${formatCurrency(diff)}₫`}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>(-) Định mức chưa đóng ({remainingPeriods} kỳ × {formatCurrency(dailyQuota)}₫):</span>
                      <span className="font-bold text-rose-600">-{formatCurrency(remainingQuota)}₫</span>
                    </div>

                    <div className="h-px bg-slate-200 my-2"></div>

                    <div className="flex justify-between items-baseline">
                      <span className="font-black text-slate-900 text-sm">Số tiền thực tế nhận/trả:</span>
                      <span className={`text-xl font-black ${finalRealAmount >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {finalRealAmount >= 0 ? `+${formatCurrency(finalRealAmount)}₫` : `${formatCurrency(finalRealAmount)}₫`}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      Chọn ví {finalRealAmount >= 0 ? 'nhận tiền về' : 'thanh toán bù'}
                    </label>
                    {validWallets.length === 0 ? (
                      <p className="text-xs text-rose-500 font-bold">Bạn chưa có ví thanh toán nào!</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {validWallets.map(w => {
                          const isInsufficient = finalRealAmount < 0 && w.balance < Math.abs(finalRealAmount);
                          return (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => { setSelectedWalletId(w.id); setErrorMessage(null); }}
                              className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${selectedWalletId === w.id ? (isInsufficient ? 'border-amber-500 bg-amber-50' : 'border-rose-500 bg-rose-50') : 'border-slate-100 bg-slate-50 hover:bg-white'}`}
                            >
                              <span className="text-xl">{w.icon}</span>
                              <div className="text-left min-w-0 flex-1">
                                <p className="text-[10px] font-black text-slate-700 truncate">{w.name}</p>
                                <p className={`text-[8px] font-bold ${isInsufficient ? 'text-amber-700 font-black' : 'text-slate-400'}`}>
                                  {formatCurrency(w.balance)}₫
                                  {isInsufficient && ' (Không đủ bù)'}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Insufficient balance warning for settlement if negative */}
                  {selectedWallet && isSettleBalanceInsufficient && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1 text-xs text-amber-900">
                      <p className="font-black flex items-center gap-1.5">
                        <span>⚠️</span> Ví "{selectedWallet.name}" không đủ số dư để bù tiền!
                      </p>
                      <p className="text-[11px]">
                        Số dư có sẵn: <span className="font-bold">{formatCurrency(selectedWallet.balance)}₫</span> <br />
                        Số tiền cần bù: <span className="font-bold text-rose-600">{formatCurrency(Math.abs(finalRealAmount))}₫</span>
                      </p>
                      <p className="text-[10px] font-black text-amber-800 pt-1">
                        👉 Vui lòng chọn ví thanh toán khác có đủ số dư.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => { setActiveTab('view'); setErrorMessage(null); }}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                    >
                      Quay lại
                    </button>
                    <button 
                      type="submit"
                      disabled={validWallets.length === 0 || isSettleBalanceInsufficient}
                      className="flex-1 py-4 bg-rose-600 text-white shadow-xl shadow-rose-100 hover:bg-rose-700 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSettleBalanceInsufficient ? 'Không đủ số dư' : 'Xác nhận ngưng Hụi'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

