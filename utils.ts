
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
  if (!wallet) {
    return {
      shareAmount: 0,
      totalPeriods: 12,
      completedPeriods: 0,
      dailyQuota: 0,
      totalActualPaid: 0,
      expectedQuotaSoFar: 0,
      diff: 0,
      remainingPeriods: 12,
      remainingQuota: 0,
      finalRealAmount: 0,
      huiTxs: []
    };
  }

  const shareAmount = Number(wallet.huiShareAmount) || 0;
  const totalPeriods = (wallet.huiTotalPeriods !== undefined && wallet.huiTotalPeriods !== null && Number(wallet.huiTotalPeriods) > 0)
    ? Number(wallet.huiTotalPeriods)
    : 12;
  const dailyQuota = Number(wallet.huiDailyQuota) || 0;

  // Lọc tất cả giao dịch đóng hụi liên quan tới ví này từ lịch sử giao dịch
  const walletNameLower = String(wallet.name || '').trim().toLowerCase();
  const walletIdLower = String(wallet.id || '').trim().toLowerCase();

  const huiTxs = (Array.isArray(transactions) ? transactions : []).filter(t => {
    if (!t) return false;
    const toWalletId = String(t.toWalletId || '').trim().toLowerCase();
    const walletId = String(t.walletId || '').trim().toLowerCase();
    const toWalletName = String(t.toWalletName || '').trim().toLowerCase();
    const walletNameStr = String(t.walletName || '').trim().toLowerCase();
    const categoryId = String(t.categoryId || '').trim().toLowerCase();
    const categoryName = String(t.categoryName || '').trim().toLowerCase();
    const note = String(t.note || '').trim().toLowerCase();

    // Khớp chính xác ID ví hoặc Tên ví
    const matchesWalletId = walletIdLower && (toWalletId === walletIdLower || walletId === walletIdLower);
    const matchesWalletName = walletNameLower && (toWalletName === walletNameLower || walletNameStr === walletNameLower);

    const matchesWallet = matchesWalletId || matchesWalletName;

    const isHuiCategory = 
      categoryId === 'hui_contribution' ||
      categoryName.includes('hụi') ||
      categoryName.includes('phường') ||
      categoryName.includes('họ') ||
      note.includes('hụi') ||
      note.includes('phường') ||
      note.includes('họ');

    return matchesWallet && isHuiCategory;
  });

  const txCount = huiTxs.length;
  const txTotalPaid = huiTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // 1. Số kỳ đã hoàn thành (completedPeriods):
  // Ưu tiên hàng đầu giá trị đã được lưu trong ví (từ Google Sheet hoặc người dùng lưu trực tiếp)
  const savedCompleted = (wallet.huiCompletedPeriods !== undefined && wallet.huiCompletedPeriods !== null && wallet.huiCompletedPeriods !== '') 
    ? Number(wallet.huiCompletedPeriods) 
    : null;

  let completedPeriods = 0;
  if (savedCompleted !== null && !isNaN(savedCompleted)) {
    completedPeriods = savedCompleted;
  } else if (txCount > 0) {
    completedPeriods = txCount;
  } else if (dailyQuota > 0 && Number(wallet.balance) > 0) {
    completedPeriods = Math.floor(Number(wallet.balance) / dailyQuota);
  }

  // 2. Tổng tiền thực tế đã đóng (totalActualPaid):
  // Ưu tiên hàng đầu giá trị đã được lưu trong ví (từ Google Sheet hoặc người dùng lưu trực tiếp)
  const savedActualPaid = (wallet.huiTotalActualPaid !== undefined && wallet.huiTotalActualPaid !== null && wallet.huiTotalActualPaid !== '') 
    ? Number(wallet.huiTotalActualPaid) 
    : null;

  let totalActualPaid = 0;
  if (savedActualPaid !== null && !isNaN(savedActualPaid)) {
    totalActualPaid = savedActualPaid;
  } else if (txTotalPaid > 0) {
    totalActualPaid = txTotalPaid;
  } else if (completedPeriods > 0 && dailyQuota > 0) {
    totalActualPaid = completedPeriods * dailyQuota;
  } else {
    totalActualPaid = Number(wallet.balance) || 0;
  }

  // Số tiền chênh lệch giữa định mức và số tiền đóng thực tế: (số kỳ đã đóng * tiền định kỳ) - tiền đã đóng
  const expectedQuotaSoFar = dailyQuota * completedPeriods;
  const diff = expectedQuotaSoFar - totalActualPaid;

  // Công thức số tiền thực tế khi ngưng trước hạn
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

