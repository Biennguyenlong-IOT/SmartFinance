
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
