
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
<<<<<<< HEAD
  budget?: number;
=======
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
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
