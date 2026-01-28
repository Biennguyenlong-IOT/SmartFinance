
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, CategoryType, Transaction, FavoriteItem, Wallet, Category } from './types';
import { CATEGORIES, INITIAL_WALLETS, INITIAL_FAVORITES } from './constants';
import { WalletOverview } from './components/WalletOverview';
import { TransactionForm } from './components/TransactionForm';
import { RecentTransactions } from './components/RecentTransactions';
import { ExpenseCharts } from './components/ExpenseCharts';
import { SmartInsights } from './components/SmartInsights';
import { FavoriteManager } from './components/FavoriteManager';
import { PaymentModal } from './components/PaymentModal';
import { CategoryManager } from './components/CategoryManager';
import { syncToSheet, fetchFromSheet } from './services/sheetService';

const DEFAULT_PASSWORD = '123456';
const STORAGE_KEY = 'spendwise_data_v12';
const SHEET_URL = 'https://script.google.com/macros/s/AKfycby16fHNP_5odsuRdW6L1j4Lyc-FYNR05bPlnqU1yUbzCOqSC6HqmlAJJ87eLUHBolGyRw/exec';

const isDebtWallet = (w: Wallet) => w.id.includes('debt') || w.name.toLowerCase().includes('nợ');

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  
  // Security state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Change Password Form
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // EFFECT: Auto-lock when leaving the settings tab
  useEffect(() => {
    if (activeTab !== 'settings') {
      setIsUnlocked(false);
      setPasswordInput('');
      setPasswordError(false);
      setShowPasswordChange(false);
      setNewPassword('');
      setConfirmPassword('');
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
          wallets: (Array.isArray(data.wallets) && data.wallets.length > 0) ? data.wallets : prev.wallets,
          categories: (Array.isArray(data.categories) && data.categories.length > 0) ? data.categories : prev.categories,
          favorites: Array.isArray(data.favorites) ? data.favorites : prev.favorites,
          transactions: Array.isArray(data.transactions) ? data.transactions : prev.transactions,
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

  useEffect(() => {
    pullDataFromSheet(true);
  }, [pullDataFromSheet]);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      alert("Mật khẩu phải có ít nhất 4 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Xác nhận mật khẩu không khớp.");
      return;
    }

    const updatedState = { ...state, settingsPassword: newPassword };
    setState(updatedState);
    const success = await syncConfigToSheet(updatedState);
    
    if (success) {
      alert("Đã đổi mật khẩu thành công! Hệ thống sẽ khóa để bạn đăng nhập bằng mật khẩu mới.");
      setIsUnlocked(false); // Force re-login with new password
      setShowPasswordChange(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordInput('');
    } else {
      alert("Lỗi khi đồng bộ mật khẩu lên Cloud. Vui lòng thử lại.");
    }
  };

  const addTransaction = async (newT: Omit<Transaction, 'id'> & { toWalletId?: string }) => {
    const paymentDate = newT.date || new Date().toISOString();
    const id = Math.random().toString(36).substr(2, 9);
    let updatedWallets = [...state.wallets];
    let newTransactions: Transaction[] = [];

    if (newT.type === CategoryType.TRANSFER && newT.toWalletId) {
      const outTx: Transaction = { id, amount: newT.amount, categoryId: '12', walletId: newT.walletId, date: paymentDate, note: newT.note || 'Chuyển tiền', type: CategoryType.EXPENSE, icon: '📤', categoryName: 'Chuyển tiền', walletName: state.wallets.find(w => w.id === newT.walletId)?.name };
      const inTx: Transaction = { id: id + 'in', amount: newT.amount, categoryId: '12', walletId: newT.toWalletId, date: paymentDate, note: newT.note || 'Nhận tiền', type: CategoryType.INCOME, icon: '📥', categoryName: 'Chuyển tiền', walletName: state.wallets.find(w => w.id === newT.toWalletId)?.name };
      newTransactions = [...state.transactions, outTx, inTx];
      updatedWallets = state.wallets.map(w => {
        if (w.id === newT.walletId) return { ...w, balance: w.balance - newT.amount };
        if (w.id === newT.toWalletId) return { ...w, balance: w.balance + newT.amount };
        return w;
      });
      syncToSheet(SHEET_URL, { action: 'add_transaction', transaction: outTx, newBalance: updatedWallets.find(w => w.id === newT.walletId)?.balance });
      syncToSheet(SHEET_URL, { action: 'add_transaction', transaction: inTx, newBalance: updatedWallets.find(w => w.id === newT.toWalletId)?.balance });
    } else {
      const category = state.categories.find(c => c.id === newT.categoryId);
      const wallet = state.wallets.find(w => w.id === newT.walletId);
      const transaction: Transaction = { ...newT, id, date: paymentDate, categoryName: category?.name, walletName: wallet?.name };
      newTransactions = [...state.transactions, transaction];
      updatedWallets = state.wallets.map(w => w.id === transaction.walletId ? { ...w, balance: transaction.type === CategoryType.EXPENSE ? w.balance - transaction.amount : w.balance + transaction.amount } : w);
      syncToSheet(SHEET_URL, { action: 'add_transaction', transaction, newBalance: updatedWallets.find(w => w.id === transaction.walletId)?.balance });
    }
    setState(prev => ({ ...prev, transactions: newTransactions, wallets: updatedWallets }));
    setActiveTab('dashboard');
  };

  const totalAssets = state.wallets
    .filter(w => !isDebtWallet(w))
    .reduce((sum, w) => sum + w.balance, 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 pb-32 md:pb-8">
      {selectedDebtWallet && (
        <PaymentModal debtWallet={selectedDebtWallet} wallets={state.wallets} onClose={() => setSelectedDebtWallet(null)} onPay={(sw, amt) => {
          addTransaction({ amount: amt, categoryId: '10', walletId: sw, note: `Trả nợ ${selectedDebtWallet.name}`, type: CategoryType.EXPENSE, date: new Date().toISOString(), icon: '💸' });
          setSelectedDebtWallet(null);
        }} />
      )}

      {/* Floating Action Button for Quick Entry */}
      <button 
        onClick={() => setActiveTab('input')}
        className={`fixed bottom-24 right-6 md:bottom-10 md:right-10 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl z-50 transition-all hover:scale-110 active:scale-95 ${activeTab === 'input' ? 'hidden' : 'flex'}`}
      >
        ➕
      </button>

      {/* Header */}
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
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {tab === 'dashboard' ? 'Tổng quan' : tab === 'input' ? 'Ghi chép' : tab === 'history' ? 'Lịch sử' : 'Cấu hình'}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tài sản</span>
              <span className="text-lg font-black text-indigo-600 leading-none">{totalAssets.toLocaleString('vi-VN')}₫</span>
            </div>
            <button onClick={() => pullDataFromSheet(false)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${isFetching ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
              <span className={`w-2 h-2 bg-current rounded-full ${isFetching ? 'animate-ping' : ''}`}></span>
              {isFetching ? 'Nạp...' : lastSynced ? lastSynced : 'Cloud'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <SmartInsights transactions={state.transactions} categories={state.categories} wallets={state.wallets} />
            <WalletOverview wallets={state.wallets} onDebtClick={setSelectedDebtWallet} />
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
            <TransactionForm categories={state.categories} wallets={state.wallets} favorites={state.favorites} onAdd={addTransaction} />
          </div>
        )}

        {activeTab === 'history' && <RecentTransactions transactions={state.transactions} categories={state.categories} wallets={state.wallets} />}

        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto">
             {!isUnlocked ? (
                <div className="p-10 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">🔒</div>
                  <h2 className="text-2xl font-black text-slate-800 mb-2">Cấu hình bảo mật</h2>
                  <p className="text-slate-400 text-sm mb-8">Vui lòng nhập mật khẩu để quản lý hệ thống.</p>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (passwordInput === state.settingsPassword) { setIsUnlocked(true); setPasswordError(false); }
                    else { setPasswordError(true); setPasswordInput(''); }
                  }} className="space-y-4 max-w-xs mx-auto">
                    <input autoFocus type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl text-center text-2xl font-black outline-none transition-all ${passwordError ? 'border-red-500 ring-4 ring-red-50' : 'border-slate-200 focus:ring-4 focus:ring-indigo-50'}`} placeholder="••••••" />
                    {passwordError && <p className="text-xs text-red-500 font-bold">Mật khẩu không đúng!</p>}
                    <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95">Xác thực</button>
                  </form>
                  <p className="mt-8 text-[10px] text-slate-300 font-bold uppercase italic">* Mật khẩu mặc định: 123456</p>
                </div>
             ) : (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div>
                       <h2 className="text-2xl font-black text-slate-800 leading-tight">Cấu hình hệ thống</h2>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Quản lý ví, danh mục và bảo mật</p>
                    </div>
                    {/* Updated Lock Button: resetting isUnlocked will trigger the lock screen for this tab */}
                    <button onClick={() => { setIsUnlocked(false); setPasswordInput(''); }} className="px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-black uppercase border border-rose-200 transition-all flex items-center gap-2">
                      <span>🔒</span> Khóa & Thoát
                    </button>
                  </div>

                  {/* Password Change Section */}
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-black text-slate-800 flex items-center gap-3"><span className="text-2xl">🔐</span> Bảo mật tài khoản</h2>
                      <button 
                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                        className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${showPasswordChange ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                      >
                        {showPasswordChange ? 'Hủy bỏ' : 'Đổi mật khẩu'}
                      </button>
                    </div>

                    {showPasswordChange ? (
                      <form onSubmit={handleChangePassword} className="space-y-6 animate-in slide-in-from-top-4 duration-300 p-6 bg-slate-50 border border-slate-100 rounded-[2rem]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mật khẩu mới</label>
                            <input 
                              type="password" 
                              value={newPassword} 
                              onChange={e => setNewPassword(e.target.value)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                              placeholder="Nhập mật khẩu mới..."
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Xác nhận mật khẩu</label>
                            <input 
                              type="password" 
                              value={confirmPassword} 
                              onChange={e => setConfirmPassword(e.target.value)}
                              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
                              placeholder="Nhập lại mật khẩu mới..."
                              required
                            />
                          </div>
                        </div>
                        <button 
                          type="submit" 
                          disabled={isSyncing}
                          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {isSyncing ? 'Đang lưu Cloud...' : 'Cập nhật mật khẩu mới'}
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-slate-100">🛡️</div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">Mật khẩu hiện tại: ••••••</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Luôn giữ bí mật để bảo vệ dữ liệu chi tiêu của bạn</p>
                        </div>
                      </div>
                    )}
                  </div>

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

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-[2.5rem] flex items-center justify-around px-6 z-50">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">🏠</span>
          <span className="text-[10px] font-black uppercase tracking-tighter">Trang chủ</span>
        </button>
        <button onClick={() => setActiveTab('input')} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeTab === 'input' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">➕</span>
          <span className="text-[10px] font-black uppercase tracking-tighter">Ghi chép</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeTab === 'history' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">📊</span>
          <span className="text-[10px] font-black uppercase tracking-tighter">Lịch sử</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeTab === 'settings' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">⚙️</span>
          <span className="text-[10px] font-black uppercase tracking-tighter">Cấu hình</span>
        </button>
      </div>
    </div>
  );
};

export default App;
