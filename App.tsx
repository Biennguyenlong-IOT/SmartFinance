
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, CategoryType, Transaction, FavoriteItem, Wallet, Category } from './types';
import { CATEGORIES, INITIAL_WALLETS, INITIAL_FAVORITES } from './constants';
import { WalletOverview } from './components/WalletOverview';
import { TransactionForm } from './components/TransactionForm';
import { RecentTransactions } from './components/RecentTransactions';
import { ExpenseCharts } from './components/ExpenseCharts';
import { GreetingHeader } from './components/GreetingHeader';
import { FavoriteManager } from './components/FavoriteManager';
import { PaymentModal } from './components/PaymentModal';
import { DebtLedgerModal } from './components/DebtLedgerModal';
import { CategoryManager } from './components/CategoryManager';
import { WalletManager } from './components/WalletManager';
import { syncToSheet, fetchFromSheet } from './services/sheetService';

const DEFAULT_PASSWORD = '123456';
const STORAGE_KEY = 'spendwise_data_v12';
const SHEET_URL = 'https://script.google.com/macros/s/AKfycby16fHNP_5odsuRdW6L1j4Lyc-FYNR05bPlnqU1yUbzCOqSC6HqmlAJJ87eLUHBolGyRw/exec';

const isDebtWallet = (w: Wallet) => w.id.includes('debt') || w.name.toLowerCase().includes('nợ');

// Hàm lọc trùng lặp theo ID
function deduplicate<T extends { id: string }>(arr: T[]): T[] {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.googleSheetUrl = SHEET_URL;
      if (!parsed.settingsPassword) parsed.settingsPassword = DEFAULT_PASSWORD;
      return parsed;
    }
    return {
      wallets: INITIAL_WALLETS,
      transactions: [],
      categories: CATEGORIES,
      favorites: INITIAL_FAVORITES,
      googleSheetUrl: SHEET_URL,
      settingsPassword: DEFAULT_PASSWORD,
    };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'history' | 'settings'>('dashboard');
  const [selectedDebtWallet, setSelectedDebtWallet] = useState<Wallet | null>(null);
  const [viewingLedgerWallet, setViewingLedgerWallet] = useState<Wallet | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (activeTab !== 'settings') {
      setIsUnlocked(false);
      setPasswordInput('');
      setPasswordError(false);
      setShowPasswordChange(false);
    }
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const pullDataFromSheet = useCallback(async (silent = false) => {
    if (!SHEET_URL) return;
    if (!silent) setIsFetching(true);
    try {
      const data = await fetchFromSheet(SHEET_URL);
      if (data && !data.error) {
        setState(prev => ({
          ...prev,
          wallets: (Array.isArray(data.wallets) && data.wallets.length > 0) ? deduplicate(data.wallets) : prev.wallets,
          categories: (Array.isArray(data.categories) && data.categories.length > 0) ? deduplicate(data.categories) : prev.categories,
          favorites: Array.isArray(data.favorites) ? deduplicate(data.favorites) : prev.favorites,
          transactions: Array.isArray(data.transactions) ? deduplicate(data.transactions) : prev.transactions,
          settingsPassword: data.settingsPassword || prev.settingsPassword || DEFAULT_PASSWORD
        }));
        setLastSynced(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => { pullDataFromSheet(true); }, [pullDataFromSheet]);

  const syncConfigToSheet = async (updatedState: AppState) => {
    setIsSyncing(true);
    const success = await syncToSheet(SHEET_URL, {
      action: 'sync_all',
      wallets: updatedState.wallets,
      categories: updatedState.categories,
      favorites: updatedState.favorites,
      settingsPassword: updatedState.settingsPassword,
      transactions: updatedState.transactions
    });
    setIsSyncing(false);
    return success;
  };

  const addTransaction = async (newT: Omit<Transaction, 'id'> & { toWalletId?: string }) => {
    const paymentDate = newT.date || new Date().toISOString();
    const id = Math.random().toString(36).substr(2, 9);
    let updatedWallets = [...state.wallets];
    let newTransactions: Transaction[] = [];

    const sourceWallet = state.wallets.find(w => w.id === newT.walletId);
    const targetWallet = newT.toWalletId ? state.wallets.find(w => w.id === newT.toWalletId) : undefined;

    if (newT.type === CategoryType.TRANSFER && newT.toWalletId) {
      const outTx: Transaction = { id, amount: newT.amount, categoryId: '12', walletId: newT.walletId, toWalletId: newT.toWalletId, date: paymentDate, note: newT.note || 'Chuyển tiền', type: CategoryType.EXPENSE, icon: '📤', categoryName: 'Chuyển tiền', walletName: sourceWallet?.name, toWalletName: targetWallet?.name };
      const inTx: Transaction = { id: id + 'in', amount: newT.amount, categoryId: '12', walletId: newT.toWalletId, toWalletId: newT.walletId, date: paymentDate, note: newT.note || 'Nhận tiền', type: CategoryType.INCOME, icon: '📥', categoryName: 'Chuyển tiền', walletName: targetWallet?.name, toWalletName: sourceWallet?.name };
      newTransactions = [...state.transactions, outTx, inTx];
      updatedWallets = state.wallets.map(w => {
        if (w.id === newT.walletId) return { ...w, balance: w.balance - newT.amount };
        if (w.id === newT.toWalletId) return { ...w, balance: w.balance + newT.amount };
        return w;
      });
      syncToSheet(SHEET_URL, { action: 'add_transaction', transaction: outTx, newBalance: updatedWallets.find(w => w.id === newT.walletId)?.balance });
      syncToSheet(SHEET_URL, { action: 'add_transaction', transaction: inTx, newBalance: updatedWallets.find(w => w.id === newT.toWalletId)?.balance });
    } 
    else if (newT.categoryId === '10' && newT.toWalletId) {
      const category = state.categories.find(c => c.id === newT.categoryId);
      const transaction: Transaction = { ...newT, id, date: paymentDate, categoryName: category?.name, walletName: sourceWallet?.name, toWalletName: targetWallet?.name };
      newTransactions = [...state.transactions, transaction];
      
      updatedWallets = state.wallets.map(w => {
        if (w.id === transaction.walletId) return { ...w, balance: w.balance - transaction.amount };
        if (w.id === newT.toWalletId) return { ...w, balance: w.balance - transaction.amount };
        return w;
      });

      syncToSheet(SHEET_URL, { action: 'add_transaction', transaction, newBalance: updatedWallets.find(w => w.id === transaction.walletId)?.balance });
      const debtW = updatedWallets.find(w => w.id === newT.toWalletId);
      if (debtW) {
        syncToSheet(SHEET_URL, { action: 'update_wallet_balance', walletId: debtW.id, balance: debtW.balance });
      }
    } 
    else {
      const category = state.categories.find(c => c.id === newT.categoryId);
      const transaction: Transaction = { ...newT, id, date: paymentDate, categoryName: category?.name, walletName: sourceWallet?.name };
      newTransactions = [...state.transactions, transaction];

      updatedWallets = state.wallets.map(w => {
        if (w.id !== transaction.walletId) return w;
        const isDebt = isDebtWallet(w);
        let newBalance = w.balance;
        if (transaction.type === CategoryType.EXPENSE) {
          newBalance = isDebt ? w.balance + transaction.amount : w.balance - transaction.amount;
        } else {
          newBalance = isDebt ? w.balance - transaction.amount : w.balance + transaction.amount;
        }
        return { ...w, balance: newBalance };
      });

      syncToSheet(SHEET_URL, { action: 'add_transaction', transaction, newBalance: updatedWallets.find(w => w.id === transaction.walletId)?.balance });
    }

    setState(prev => ({ ...prev, transactions: newTransactions, wallets: updatedWallets }));
    setActiveTab('dashboard');
  };

  const totalAssets = state.wallets.filter(w => !isDebtWallet(w)).reduce((sum, w) => sum + w.balance, 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 pb-32 md:pb-8">
      {selectedDebtWallet && (
        <PaymentModal 
          debtWallet={selectedDebtWallet} 
          wallets={state.wallets} 
          onClose={() => setSelectedDebtWallet(null)} 
          onPay={(sw, amt) => {
            addTransaction({ 
              amount: amt, 
              categoryId: '10', 
              walletId: sw, 
              toWalletId: selectedDebtWallet.id,
              note: `Trả nợ ${selectedDebtWallet.name}`, 
              type: CategoryType.EXPENSE, 
              date: new Date().toISOString(), 
              icon: '💸' 
            });
            setSelectedDebtWallet(null);
          }} 
        />
      )}

      {viewingLedgerWallet && (
        <DebtLedgerModal 
          wallet={viewingLedgerWallet} 
          transactions={state.transactions} 
          onClose={() => setViewingLedgerWallet(null)} 
        />
      )}

      <button onClick={() => setActiveTab('input')} className={`fixed bottom-24 right-6 md:bottom-10 md:right-10 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl z-50 transition-all hover:scale-110 active:scale-95 ${activeTab === 'input' ? 'hidden' : 'flex'}`}>➕</button>

      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">S</div>
            <div>
              <h1 className="font-black text-xl text-slate-800 leading-none">SpendWise</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Tài chính thông minh</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {(['dashboard', 'input', 'history', 'settings'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{tab === 'dashboard' ? 'Tổng quan' : tab === 'input' ? 'Ghi chép' : tab === 'history' ? 'Lịch sử' : 'Cấu hình'}</button>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tài sản</span>
              <span className="text-lg font-black text-indigo-600 leading-none">{totalAssets.toLocaleString('vi-VN')}₫</span>
            </div>
            <button onClick={() => pullDataFromSheet(false)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${isFetching ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
              <span className={`w-2 h-2 bg-current rounded-full ${isFetching ? 'animate-ping' : ''}`}></span>{isFetching ? 'Nạp...' : lastSynced || 'Cloud'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <GreetingHeader />
            <WalletOverview 
              wallets={state.wallets} 
              onDebtClick={setSelectedDebtWallet} 
              onViewLedger={setViewingLedgerWallet}
            />
            <ExpenseCharts transactions={state.transactions} categories={state.categories} />
            <RecentTransactions transactions={state.transactions} categories={state.categories} wallets={state.wallets} onViewAll={() => setActiveTab('history')} />
          </div>
        )}
        {activeTab === 'input' && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setActiveTab('dashboard')} className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600">←</button>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Thêm giao dịch</h2>
            </div>
            <TransactionForm 
              categories={state.categories} 
              wallets={state.wallets} 
              favorites={state.favorites} 
              onAdd={addTransaction}
              onAddFavorite={ni => {
                const updated = { ...state, favorites: [...state.favorites, { ...ni, id: 'f-' + Date.now() }] };
                setState(updated);
                syncConfigToSheet(updated);
              }}
              onDeleteFavorite={id => {
                const updated = { ...state, favorites: state.favorites.filter(f => f.id !== id) };
                setState(updated);
                syncConfigToSheet(updated);
              }}
            />
          </div>
        )}
        {activeTab === 'history' && <RecentTransactions transactions={state.transactions} categories={state.categories} wallets={state.wallets} />}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto">
             {!isUnlocked ? (
                <div className="p-10 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">🔒</div>
                  <h2 className="text-2xl font-black text-slate-800 mb-2">Cấu hình bảo mật</h2>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (passwordInput === state.settingsPassword) { setIsUnlocked(true); setPasswordError(false); }
                    else { setPasswordError(true); setPasswordInput(''); }
                  }} className="space-y-4 max-w-xs mx-auto">
                    <input autoFocus type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl text-center text-2xl font-black outline-none transition-all ${passwordError ? 'border-red-500 ring-4 ring-red-50' : 'border-slate-200 focus:ring-4 focus:ring-indigo-50'}`} placeholder="••••••" />
                    {passwordError && <p className="text-xs text-red-500 font-bold">Mật khẩu không đúng!</p>}
                    <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95">Xác thực</button>
                  </form>
                </div>
             ) : (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div>
                       <h2 className="text-2xl font-black text-slate-800 leading-tight">Cấu hình hệ thống</h2>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Quản lý ví, danh mục và bảo mật</p>
                    </div>
                    <button onClick={() => { setIsUnlocked(false); setPasswordInput(''); }} className="px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-black uppercase border border-rose-200 transition-all">🔒 Khóa & Thoát</button>
                  </div>
                  <WalletManager wallets={state.wallets} onAdd={(newW, isDebt) => {
                      const prefix = isDebt ? 'w-debt-' : 'w-';
                      const updated = { ...state, wallets: [...state.wallets, { ...newW, id: prefix + Date.now() }] };
                      setState(updated);
                      syncConfigToSheet(updated);
                    }} onDelete={id => {
                      const updated = { ...state, wallets: state.wallets.filter(w => w.id !== id) };
                      setState(updated);
                      syncConfigToSheet(updated);
                    }} onUpdate={(id, up) => {
                      const updated = { ...state, wallets: state.wallets.map(w => w.id === id ? { ...w, ...up } : w) };
                      setState(updated);
                      syncConfigToSheet(updated);
                    }} 
                  />
                  <CategoryManager categories={state.categories} onAdd={(cat) => {
                    const updated = { ...state, categories: [...state.categories, { ...cat, id: 'c-' + Date.now() }] };
                    setState(updated);
                    syncConfigToSheet(updated);
                  }} onDelete={id => {
                    const updated = { ...state, categories: state.categories.filter(c => c.id !== id) };
                    setState(updated);
                    syncConfigToSheet(updated);
                  }} onUpdate={(id, up) => {
                    const updated = { ...state, categories: state.categories.map(c => c.id === id ? { ...c, ...up } : c) };
                    setState(updated);
                    syncConfigToSheet(updated);
                  }} />
                  <FavoriteManager favorites={state.favorites} categories={state.categories} wallets={state.wallets} onAdd={ni => {
                    const updated = { ...state, favorites: [...state.favorites, { ...ni, id: 'f-' + Date.now() }] };
                    setState(updated);
                    syncConfigToSheet(updated);
                  }} onUpdate={(id, up) => {
                    const updated = { ...state, favorites: state.favorites.map(f => f.id === id ? { ...f, ...up } : f) };
                    setState(updated);
                    syncConfigToSheet(updated);
                  }} onDelete={id => {
                    const updated = { ...state, favorites: state.favorites.filter(f => f.id !== id) };
                    setState(updated);
                    syncConfigToSheet(updated);
                  }} onUpdateShopName={(o, n) => {
                    const updated = { ...state, favorites: state.favorites.map(f => f.shopName === o ? { ...f, shopName: n } : f) };
                    setState(updated);
                    syncConfigToSheet(updated);
                  }} />
                </div>
             )}
          </div>
        )}
      </main>

      <div className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-[2.5rem] flex items-center justify-around px-6 z-50">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">🏠</span><span className="text-[10px] font-black uppercase tracking-tighter">Trang chủ</span>
        </button>
        <button onClick={() => setActiveTab('input')} className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'input' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">➕</span><span className="text-[10px] font-black uppercase tracking-tighter">Ghi chép</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'history' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">📊</span><span className="text-[10px] font-black uppercase tracking-tighter">Lịch sử</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'settings' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">⚙️</span><span className="text-[10px] font-black uppercase tracking-tighter">Cấu hình</span>
        </button>
      </div>
    </div>
  );
};

export default App;
