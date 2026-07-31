
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

export const formatInputNumber = (val: string): string => {
  if (!val) return '';
  const nums = val.replace(/\D/g, '');
  return nums.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const parseInputNumber = (val: string): number => {
  return parseFloat(val.replace(/\./g, '')) || 0;
};

export const formatDateTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${time}, ${date}`;
};

export const getRelativeTime = (date: string): string => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return `Vừa xong`;
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return new Date(date).toLocaleDateString('vi-VN');
};

export function getHuiStats(wallet: any, transactions: any[] = []) {
  const shareAmount = wallet.huiShareAmount || 0;
  const totalPeriods = wallet.huiTotalPeriods || 12;
  const dailyQuota = wallet.huiDailyQuota || 0;

  // Lọc tất cả giao dịch đóng hụi liên quan tới ví này
  const huiTxs = transactions.filter(t => 
    (t.toWalletId === wallet.id || t.walletId === wallet.id) && 
    (t.categoryId === 'hui_contribution' || t.categoryName?.toLowerCase().includes('hụi') || t.note?.toLowerCase().includes('hụi'))
  );

  const txCount = huiTxs.length;
  const txTotalPaid = huiTxs.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Tính tổng tiền thực tế đã đóng
  let totalActualPaid = wallet.huiTotalActualPaid;
  if (totalActualPaid === undefined || totalActualPaid === null) {
    totalActualPaid = txTotalPaid > 0 ? txTotalPaid : (wallet.balance || 0);
  }

  // Tính số kỳ đã hoàn thành
  let completedPeriods = wallet.huiCompletedPeriods;
  if (completedPeriods === undefined || completedPeriods === null || (completedPeriods === 0 && (txCount > 0 || totalActualPaid > 0))) {
    if (txCount > 0) {
      completedPeriods = txCount;
    } else if (dailyQuota > 0 && totalActualPaid > 0) {
      completedPeriods = Math.floor(totalActualPaid / dailyQuota);
    } else {
      completedPeriods = 0;
    }
  }

  // 5./ Số tiền chênh lệch giữa định mức và số tiền đóng thực tế: (số kỳ đã đóng * tiền định kỳ) - tiền đã đóng
  const expectedQuotaSoFar = dailyQuota * completedPeriods;
  const diff = expectedQuotaSoFar - totalActualPaid;

  // 6./ Công thức số tiền thực tế khi ngưng trước hạn
  const remainingPeriods = Math.max(0, totalPeriods - completedPeriods);
  const remainingQuota = dailyQuota * remainingPeriods;
  const finalRealAmount = totalActualPaid + diff - remainingQuota;

  return {
    shareAmount,
    totalPeriods,
    completedPeriods,
    dailyQuota,
    totalActualPaid,
    expectedQuotaSoFar,
    diff,
    remainingPeriods,
    remainingQuota,
    finalRealAmount,
    huiTxs
  };
}

