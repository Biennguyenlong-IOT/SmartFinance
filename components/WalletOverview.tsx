
import React from 'react';
import { Wallet, Transaction, CategoryType } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  wallets: Wallet[];
  transactions: Transaction[];
  onDebtClick: (wallet: Wallet) => void;
  onViewLedger: (wallet: Wallet) => void;
  onSavingsClick: (wallet: Wallet) => void;
  onHuiClick?: (wallet: Wallet, mode?: 'view' | 'contribute' | 'settle') => void;
}

const isDebtWallet = (w: Wallet) => w.subType === 'debt' || w.id.includes('debt') || (typeof w.name === 'string' && w.name.toLowerCase().includes('nợ'));
const isLendingWallet = (w: Wallet) => w.subType === 'lending' || (typeof w.name === 'string' && w.name.toLowerCase().includes('cho vay'));
const isSavingsWallet = (w: Wallet) => w.isSavings === true || w.subType === 'savings';
const isHuiWallet = (w: Wallet) => w.subType === 'hui';

export const WalletOverview: React.FC<Props> = ({ wallets, transactions, onDebtClick, onViewLedger, onSavingsClick, onHuiClick }) => {
  // Lọc tách biệt các loại tài khoản:
  // - assets: Chỉ tính tài sản KHA DUNG (Tiền mặt, ví thông thường...) - Không chứa Tiết kiệm, Debt, Cho vay, Hụi
  const assets = wallets.filter(w => !isDebtWallet(w) && !isLendingWallet(w) && !isSavingsWallet(w) && !isHuiWallet(w));
  const savings = wallets.filter(w => isSavingsWallet(w));
  const debts = wallets.filter(w => isDebtWallet(w));
  const lendings = wallets.filter(w => isLendingWallet(w));
  const huis = wallets.filter(w => isHuiWallet(w));
  
  const totalAssets = assets.reduce((sum, w) => sum + w.balance, 0); // Đây là Tài sản khả dụng thực thụ
  const totalSavings = savings.reduce((sum, w) => sum + w.balance, 0);
  const totalDebts = debts.reduce((sum, w) => sum + Math.abs(w.balance), 0);
  const totalLendings = lendings.reduce((sum, w) => sum + w.balance, 0);
  const totalHuiPaid = huis.reduce((sum, w) => sum + (w.huiTotalActualPaid ?? w.balance ?? 0), 0);
  
  const debtRatio = totalAssets > 0 ? (totalDebts / totalAssets) * 100 : (totalDebts > 0 ? 100 : 0);

  // Tính tỉ lệ chi trả tháng này (Trả nợ / Thu nhập)
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthlyIncome = transactions
    .filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && t.type === CategoryType.INCOME;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyRepayment = transactions
    .filter(t => {
      const d = new Date(t.date);
      // CategoryId '10' là Trả nợ
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && t.categoryId === '10';
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const repaymentRatio = monthlyIncome > 0 ? (monthlyRepayment / monthlyIncome) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div className="space-y-1">
            <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Tài sản khả dụng</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">{formatCurrency(totalAssets)}</span>
              <span className="text-2xl font-bold text-slate-300">₫</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 justify-end">
            {totalSavings > 0 && (
              <div className="bg-emerald-50/50 px-5 py-3 rounded-2xl border border-emerald-100 text-right">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5 font-bold">Tổng tiết kiệm</p>
                <p className="text-lg font-black text-emerald-800">+{formatCurrency(totalSavings)}₫</p>
              </div>
            )}
            {totalHuiPaid > 0 && (
              <div className="bg-purple-50 px-5 py-3 rounded-2xl border border-purple-100 text-right">
                <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-0.5">Tổng đóng Hụi</p>
                <p className="text-lg font-black text-purple-800">+{formatCurrency(totalHuiPaid)}₫</p>
              </div>
            )}
            {totalDebts > 0 && (
              <>
                <div className="bg-indigo-50 px-5 py-3 rounded-2xl border border-indigo-100 text-right">
                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-0.5 font-serif">Tỉ lệ chi trả (Tháng)</p>
                  <p className="text-lg font-black text-indigo-700">{repaymentRatio.toFixed(1)}%</p>
                </div>
                <div className="bg-amber-50 px-5 py-3 rounded-2xl border border-amber-100 text-right">
                  <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Tỉ lệ nợ</p>
                  <p className="text-lg font-black text-amber-700">{debtRatio.toFixed(1)}%</p>
                </div>
                <div className="bg-rose-50 px-5 py-3 rounded-2xl border border-rose-100 text-right">
                  <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Tổng nợ</p>
                  <p className="text-lg font-black text-rose-600">-{formatCurrency(totalDebts)}₫</p>
                </div>
              </>
            )}
            {totalLendings > 0 && (
              <div className="bg-sky-50 px-5 py-3 rounded-2xl border border-sky-100 text-right">
                <p className="text-[9px] font-black text-sky-600 uppercase tracking-widest mb-0.5">Đang cho vay</p>
                <p className="text-lg font-black text-sky-700">+{formatCurrency(totalLendings)}₫</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {assets.map(wallet => (
            <div 
              key={wallet.id} 
              className="p-5 border bg-slate-50 border-slate-100 rounded-2xl hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all group"
            >
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-100 mb-3 group-hover:scale-110 transition-transform">
                {wallet.icon}
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{wallet.name}</p>
                  <p className="text-lg font-black text-slate-800">{formatCurrency(wallet.balance)}<span className="text-[10px] ml-0.5">₫</span></p>
                </div>
              </div>
            </div>
          ))}
          {assets.length === 0 && (
            <div className="col-span-full py-6 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
              Chưa có tài khoản khả dụng nào được thiết lập.
            </div>
          )}
        </div>
      </div>

      {savings.length > 0 && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span> Sổ tiết kiệm tích lũy
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savings.map(wallet => {
              const calculateMaturity = () => {
                if (!wallet.interestRate || !wallet.termMonths) return { interest: 0, total: wallet.balance };
                const interest = wallet.balance * (wallet.interestRate / 100) * (wallet.termMonths / 12);
                return { interest, total: wallet.balance + interest };
              };
              const { interest, total } = calculateMaturity();
              
              const getMaturityDateObj = () => {
                if (!wallet.startDate || !wallet.termMonths) return null;
                const date = new Date(wallet.startDate);
                date.setMonth(date.getMonth() + wallet.termMonths);
                return date;
              };
              
              const matDateObj = getMaturityDateObj();
              const isMatured = matDateObj ? (new Date() >= matDateObj) : false;
              const dateStr = matDateObj ? matDateObj.toLocaleDateString('vi-VN') : 'N/A';

              return (
                <div 
                  key={wallet.id} 
                  onClick={() => onSavingsClick(wallet)}
                  className="relative group bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 hover:bg-white hover:shadow-xl hover:border-emerald-100 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-6 w-full">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-emerald-100">
                      {wallet.icon}
                    </div>
                    <div>
                      {isMatured ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase rounded-lg border border-emerald-200 shadow-sm animate-bounce">Đáo hạn ☀️</span>
                      ) : (
                        <span className="px-3 py-1 bg-sky-50 text-sky-700 text-[9px] font-black uppercase rounded-lg border border-sky-100">Đang gửi ⏳</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{wallet.name}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-800">{formatCurrency(wallet.balance)}</span>
                        <span className="text-xs font-bold text-slate-400">₫</span>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    <div className="text-[10px] font-bold text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Lãi suất:</span>
                        <span className="text-emerald-600 font-extrabold">{wallet.interestRate}%/năm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kỳ hạn:</span>
                        <span className="text-slate-700 font-extrabold">{wallet.termMonths} tháng</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nhận được khi đáo hạn:</span>
                        <span className="text-emerald-700 font-extrabold">{formatCurrency(total)}₫</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ngày đáo hạn:</span>
                        <span className="text-slate-600 font-extrabold">{dateStr}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {debts.length > 0 && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span> Quản lý khoản vay & nợ
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {debts.map(wallet => {
              // Tính tổng tiền đã trả cho ví nợ này
              const totalPaid = transactions
                .filter(t => t.toWalletId === wallet.id && t.categoryId === '10')
                .reduce((sum, t) => sum + t.amount, 0);
              
              const currentDebt = Math.abs(wallet.balance);
              const originalDebt = currentDebt + totalPaid;
              const progress = originalDebt > 0 ? (totalPaid / originalDebt) * 100 : 0;

              return (
                <div key={wallet.id} className="relative group bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 hover:bg-white hover:shadow-xl hover:border-rose-100 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-rose-100">
                      {wallet.icon}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => onDebtClick(wallet)}
                        className="px-4 py-2 text-[10px] font-black text-emerald-600 bg-white rounded-xl border border-emerald-100 hover:bg-emerald-50 shadow-sm transition-all active:scale-95"
                      >
                        Trả dần
                      </button>
                      <button 
                        onClick={() => {
                          const event = new CustomEvent('openBorrowModal', { detail: wallet });
                          window.dispatchEvent(event);
                        }}
                        className="px-4 py-2 text-[10px] font-black text-rose-600 bg-white rounded-xl border border-rose-100 hover:bg-rose-50 shadow-sm transition-all active:scale-95"
                      >
                        Vay thêm
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{wallet.name}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-rose-600">{formatCurrency(currentDebt)}</span>
                        <span className="text-xs font-bold text-rose-300">₫</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Tiến độ chi trả</p>
                        <p className="text-[11px] font-black text-emerald-600">{progress.toFixed(0)}%</p>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                        <span>Đã trả: {formatCurrency(totalPaid)}₫</span>
                        <span>Gốc: {formatCurrency(originalDebt)}₫</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); onViewLedger(wallet); }}
                    className="absolute top-6 right-32 w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:shadow-md transition-all opacity-0 group-hover:opacity-100"
                    title="Xem sổ nợ"
                  >
                    📄
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {lendings.length > 0 && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-pulse"></span> Quản lý khoản cho vay
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lendings.map(wallet => {
              const currentLending = wallet.balance;
              
              return (
                <div key={wallet.id} className="relative group bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 hover:bg-white hover:shadow-xl hover:border-sky-100 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-sky-100">
                      {wallet.icon}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => {
                          const event = new CustomEvent('openCollectModal', { detail: wallet });
                          window.dispatchEvent(event);
                        }}
                        className="px-4 py-2 text-[10px] font-black text-emerald-600 bg-white rounded-xl border border-emerald-100 hover:bg-emerald-50 shadow-sm transition-all active:scale-95"
                      >
                        Thu hồi
                      </button>
                      <button 
                        onClick={() => {
                          const event = new CustomEvent('openLendMoreModal', { detail: wallet });
                          window.dispatchEvent(event);
                        }}
                        className="px-4 py-2 text-[10px] font-black text-amber-600 bg-white rounded-xl border border-amber-100 hover:bg-amber-50 shadow-sm transition-all active:scale-95"
                      >
                        Cho vay thêm
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{wallet.name}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-emerald-600">{formatCurrency(currentLending)}</span>
                        <span className="text-xs font-bold text-slate-300">₫</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); onViewLedger(wallet); }}
                    className="absolute top-6 right-32 w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:shadow-md transition-all opacity-0 group-hover:opacity-100"
                    title="Xem sổ nợ"
                  >
                    📄
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {huis.length > 0 && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse"></span> Quản lý Hụi / Họ / Phường
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {huis.map(wallet => {
              const shareAmount = wallet.huiShareAmount || 0;
              const totalPeriods = wallet.huiTotalPeriods || 12;
              const completedPeriods = wallet.huiCompletedPeriods || 0;
              const dailyQuota = wallet.huiDailyQuota || 0;
              const totalActualPaid = wallet.huiTotalActualPaid ?? wallet.balance ?? 0;
              const expectedQuotaSoFar = dailyQuota * completedPeriods;
              const diff = totalActualPaid - expectedQuotaSoFar;
              const progress = totalPeriods > 0 ? (completedPeriods / totalPeriods) * 100 : 0;

              return (
                <div 
                  key={wallet.id} 
                  onClick={() => onHuiClick && onHuiClick(wallet, 'view')}
                  className="relative group bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 hover:bg-white hover:shadow-xl hover:border-purple-200 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-purple-100">
                      {wallet.icon || '🎋'}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onHuiClick && onHuiClick(wallet, 'contribute'); }}
                        className="px-3 py-2 text-[10px] font-black text-purple-600 bg-white rounded-xl border border-purple-100 hover:bg-purple-50 shadow-sm transition-all active:scale-95"
                      >
                        + Đóng hụi
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onHuiClick && onHuiClick(wallet, 'settle'); }}
                        className="px-3 py-2 text-[10px] font-black text-rose-600 bg-white rounded-xl border border-rose-100 hover:bg-rose-50 shadow-sm transition-all active:scale-95"
                      >
                        Ngưng
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{wallet.name}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-purple-900">{formatCurrency(totalActualPaid)}</span>
                        <span className="text-xs font-bold text-slate-400">₫ (đã đóng)</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[10px] font-bold text-slate-500">
                      <div className="flex justify-between">
                        <span>1. Số tiền tham gia:</span>
                        <span className="text-purple-700 font-black">{formatCurrency(shareAmount)}₫</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2. Hạn đóng:</span>
                        <span className="text-slate-800 font-black">{completedPeriods}/{totalPeriods} kỳ</span>
                      </div>
                      <div className="flex justify-between">
                        <span>3. Định mức/ngày:</span>
                        <span className="text-slate-800 font-black">{formatCurrency(dailyQuota)}₫</span>
                      </div>
                      <div className="flex justify-between">
                        <span>5. Chênh lệch:</span>
                        <span className={`font-black ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {diff >= 0 ? `+${formatCurrency(diff)}₫` : `${formatCurrency(diff)}₫`}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-slate-400">
                        <span>Tiến độ dây hụi</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-600 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
