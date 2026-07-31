
export enum CategoryType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
  TRANSFER = 'TRANSFER'
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: CategoryType;
  color: string;
  budget?: number;
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
  isSavings?: boolean;
  subType?: 'payment' | 'debit' | 'savings' | 'debt' | 'lending' | 'hui';
  startDate?: string;
  interestRate?: number;
  termMonths?: number;

  // Thuộc tính dành cho Hụi / Họ / Phường
  huiShareAmount?: number;      // 1./ Số tiền tham gia
  huiTotalPeriods?: number;     // 2./ Tổng số kỳ
  huiCompletedPeriods?: number; // 2./ Số kỳ đã đóng/hoàn thành
  huiDailyQuota?: number;       // 3./ Tiền định mức hằng ngày
  huiTotalActualPaid?: number;  // 4./ Tổng số tiền đóng thực tế hằng ngày
  huiIsEnded?: boolean;         // Trạng thái đã ngưng / tất toán hụi
}

export interface FavoriteItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  icon: string;
  shopName: string;
  defaultWalletId: string;
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  walletId: string;
  toWalletId?: string; // Ví nhận (dành cho trả nợ/chuyển tiền)
  date: string;
  note: string;
  type: CategoryType;
  icon?: string;
  // Metadata cho Sheet
  categoryName?: string;
  walletName?: string;
  toWalletName?: string;
}

export interface AppState {
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  favorites: FavoriteItem[];
  googleSheetUrl?: string;
  settingsPassword?: string;
}
