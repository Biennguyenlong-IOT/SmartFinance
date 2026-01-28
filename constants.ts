
import { Category, CategoryType, Wallet, FavoriteItem } from './types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Ăn uống', icon: '🍔', type: CategoryType.EXPENSE, color: '#ef4444' },
  { id: '2', name: 'Di chuyển', icon: '🚗', type: CategoryType.EXPENSE, color: '#f59e0b' },
  { id: '3', name: 'Mua sắm', icon: '🛍️', type: CategoryType.EXPENSE, color: '#3b82f6' },
  { id: '4', name: 'Giải trí', icon: '🎮', type: CategoryType.EXPENSE, color: '#8b5cf6' },
  { id: '5', name: 'Sức khỏe', icon: '💊', type: CategoryType.EXPENSE, color: '#10b981' },
  { id: '6', name: 'Hóa đơn', icon: '⚡', type: CategoryType.EXPENSE, color: '#6366f1' },
  { id: '10', name: 'Trả nợ', icon: '💸', type: CategoryType.EXPENSE, color: '#f43f5e' },
  { id: '7', name: 'Lương', icon: '💰', type: CategoryType.INCOME, color: '#10b981' },
  { id: '8', name: 'Tiền thưởng', icon: '🎁', type: CategoryType.INCOME, color: '#fbbf24' },
  { id: '11', name: 'Thu nợ', icon: '📥', type: CategoryType.INCOME, color: '#06b6d4' },
  { id: '12', name: 'Chuyển tiền', icon: '🔄', type: CategoryType.TRANSFER, color: '#6366f1' },
  { id: '9', name: 'Khác', icon: '✨', type: CategoryType.INCOME, color: '#94a3b8' },
];

export const INITIAL_WALLETS: Wallet[] = [
  { id: 'w1', name: 'Tiền mặt', balance: 5000000, icon: '💵', color: '#10b981' },
  { id: 'w-vcb', name: 'Vietcombank', balance: 15000000, icon: '💳', color: '#059669' },
  { id: 'w-tcb', name: 'Techcombank', balance: 10000000, icon: '💳', color: '#dc2626' },
  { id: 'w-cafe-127', name: 'Nợ CAFE 127', balance: 0, icon: '☕', color: '#78350f' },
];

export const INITIAL_FAVORITES: FavoriteItem[] = [
  { id: 'f1', name: 'Cafe đá', price: 16000, categoryId: '1', icon: '☕', shopName: 'CAFE 127', defaultWalletId: 'w-cafe-127' },
  { id: 'f2', name: 'Thuốc lá', price: 18000, categoryId: '1', icon: '🚬', shopName: 'CAFE 127', defaultWalletId: 'w-cafe-127' },
  { id: 'f3', name: 'Bạc xỉu', price: 22000, categoryId: '1', icon: '🥛', shopName: 'CAFE 127', defaultWalletId: 'w-cafe-127' },
  { id: 'f4', name: 'Phở bò', price: 45000, categoryId: '1', icon: '🍜', shopName: 'Quán Ăn Sáng', defaultWalletId: 'w1' },
];
