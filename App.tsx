
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

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('spendwise_data_v11');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Đảm bảo luôn có mật khẩu, nếu chưa có thì dùng mặc định
      if (!parsed.settingsPassword) parsed.settingsPassword = DEFAULT_PASSWORD;
      return parsed;
    }
    return {
      wallets: INITIAL_WALLETS,
      transactions: [],
      categories: CATEGORIES,
      favorites: INITIAL_FAVORITES,
      googleSheetUrl: '',
      settingsPassword: DEFAULT_PASSWORD,
    };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'history' | 'settings'>('dashboard');
  const [selectedDebtWallet, setSelectedDebtWallet] = useState<Wallet | null>(null);
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletBalance, setNewWalletBalance] = useState('0');
  const [newWalletIcon, setNewWalletIcon] = useState('💳');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  
  // Bảo mật
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  
  // Đổi mật khẩu bắt buộc
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    localStorage.setItem('spendwise_data_v11', JSON.stringify(state));
  }, [state]);

  const pullDataFromSheet = useCallback(async (silent = false) => {
    if (!state.googleSheetUrl) return;
    setIsFetching(true);
    const data = await fetchFromSheet(state.googleSheetUrl);
    setIsFetching(false);
    if (data) {
      setState(prev => ({
        ...prev,
        wallets: Array.isArray(data.wallets) && data.wallets.length > 0 ? data.wallets : prev.wallets,
        categories: Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : prev.categories,
        favorites: Array.isArray(data.favorites) ? data.favorites : prev.favorites,
        transactions: Array.isArray(data.transactions) ? data.transactions : prev.transactions,
        settingsPassword: data.settingsPassword || prev.settingsPassword || DEFAULT_PASSWORD
      }));
      if (!silent) alert(`Đồng bộ dữ liệu từ Sheet thành công!`);
    }
  }, [state.googleSheetUrl]);

  useEffect(() => {
    if (state.googleSheetUrl) {
      const timer = setTimeout(() => pullDataFromSheet(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const syncConfigToSheet = async (currentState: AppState) => {
    if (!currentState.googleSheetUrl) return;
    await syncToSheet(currentState.googleSheetUrl, {
      action: 'sync_all',
      wallets: currentState.wallets,
      categories: currentState.categories,
      favorites: currentState.favorites,
      settingsPassword: currentState.settingsPassword,
      transactions: currentState.transactions.map(t => ({
        ...t,
        categoryName: currentState.categories.find(c => c.id === t.categoryId)?.name || 'N/A',
        walletName: currentState.wallets.find(w => w.id === t.walletId)?.name || 'N/A'
      }))
    });
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === state.settingsPassword) {
      setIsUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordInput('');
    }
  };

  const handleForceChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword === DEFAULT_PASSWORD) {
      alert("Vui lòng nhập mật khẩu mới khác mật khẩu mặc định!");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    const newState = { ...state, settingsPassword: newPassword };
    setState(newState);
    syncConfigToSheet(newState);
    setNewPassword('');
    setConfirmPassword('');
    alert("Đã đổi mật khẩu thành công!");
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
      if (state.googleSheetUrl) {
        await syncToSheet(state.googleSheetUrl, { action: 'add_transaction', transaction: outTx, newBalance: updatedWallets.find(w => w.id === newT.walletId)?.balance });
        await syncToSheet(state.googleSheetUrl, { action: 'add_transaction', transaction: inTx, newBalance: updatedWallets.find(w => w.id === newT.toWalletId)?.balance });
      }
    } else {
      const category = state.categories.find(c => c.id === newT.categoryId);
      const wallet = state.wallets.find(w => w.id === newT.walletId);
      const transaction: Transaction = { ...newT, id, date: paymentDate, categoryName: category?.name, walletName: wallet?.name };
      newTransactions = [...state.transactions, transaction];
      updatedWallets = state.wallets.map(w => w.id === transaction.walletId ? { ...w, balance: transaction.type === CategoryType.EXPENSE ? w.balance - transaction.amount : w.balance + transaction.amount } : w);
      if (state.googleSheetUrl) {
        await syncToSheet(state.googleSheetUrl, { action: 'add_transaction', transaction, newBalance: updatedWallets.find(w => w.id === transaction.walletId)?.balance });
      }
    }
    setState(prev => ({ ...prev, transactions: newTransactions, wallets: updatedWallets }));
    setActiveTab('dashboard');
  };

  const isDefaultPass = state.settingsPassword === DEFAULT_PASSWORD;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-700 pb-24 md:pb-0">
      {selectedDebtWallet && (
        <PaymentModal debtWallet={selectedDebtWallet} wallets={state.wallets} onClose={() => setSelectedDebtWallet(null)} onPay={(sw, amt) => {
          addTransaction({ amount: amt, categoryId: '10', walletId: sw, note: `Trả nợ ${selectedDebtWallet.name}`, type: CategoryType.EXPENSE, date: new Date().toISOString(), icon: '💸' });
          setSelectedDebtWallet(null);
        }} />
      )}

      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">S</div>
            <div className="hidden sm:block">
              <h1 className="font-black text-xl text-slate-800 leading-none">SpendWise</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Smart Finance</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            {(['dashboard', 'input', 'history', 'settings'] as const).map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab); if (tab !== 'settings') setIsUnlocked(false); }} className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                {tab === 'dashboard' ? 'Tổng quan' : tab === 'input' ? 'Ghi chép' : tab === 'history' ? 'Lịch sử' : 'Cấu hình'}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
             <div className="hidden lg:flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase">Số dư tổng</span>
                <span className="text-sm font-black text-slate-700">{state.wallets.reduce((a,b)=>a+b.balance,0).toLocaleString('vi-VN')}₫</span>
             </div>
             {isFetching && <div className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-full animate-spin">🔄</div>}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="animate-in fade-in duration-500">
          {activeTab === 'dashboard' && (
            <div className="space-y-10">
              <SmartInsights transactions={state.transactions} categories={state.categories} wallets={state.wallets} />
              <WalletOverview wallets={state.wallets} onDebtClick={setSelectedDebtWallet} />
              <ExpenseCharts transactions={state.transactions} categories={state.categories} />
              <RecentTransactions transactions={state.transactions} categories={state.categories} wallets={state.wallets} onViewAll={() => setActiveTab('history')} />
            </div>
          )}
          
          {activeTab === 'input' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-8">Thêm giao dịch mới</h2>
              <TransactionForm categories={state.categories} wallets={state.wallets} favorites={state.favorites} onAdd={addTransaction} />
            </div>
          )}

          {activeTab === 'history' && <RecentTransactions transactions={state.transactions} categories={state.categories} wallets={state.wallets} />}

          {activeTab === 'settings' && (
            <>
              {!isUnlocked ? (
                <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-[2rem] shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">🔒</div>
                  <h2 className="text-xl font-black text-slate-800 mb-2">Khu vực hạn chế</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-8">Nhập mật khẩu để tiếp tục</p>
                  <form onSubmit={handleUnlock} className="space-y-4">
                    <input autoFocus type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl text-center text-xl font-black outline-none transition-all ${passwordError ? 'border-red-500 ring-4 ring-red-50' : 'border-slate-100 focus:ring-4 focus:ring-indigo-50'}`} placeholder="••••••" />
                    {passwordError && <p className="text-xs text-red-500 font-bold">Mật khẩu không chính xác!</p>}
                    <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all">Xác thực</button>
                  </form>
                  <p className="mt-6 text-[10px] text-slate-300 font-bold uppercase italic">* Mật khẩu mặc định: 123456</p>
                </div>
              ) : isDefaultPass ? (
                <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-[2rem] shadow-2xl border border-indigo-100 text-center animate-in slide-in-from-bottom-8 duration-500">
                  <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
                  <h2 className="text-xl font-black text-slate-800 mb-2">Đổi mật khẩu mặc định</h2>
                  <p className="text-slate-500 text-xs font-medium mb-8">Bạn đang sử dụng mật khẩu mặc định. Vui lòng đổi mật khẩu mới để bảo mật dữ liệu tốt hơn.</p>
                  <form onSubmit={handleForceChangePassword} className="space-y-4 text-left">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mật khẩu mới</label>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all" placeholder="Nhập mật khẩu mới..." required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Xác nhận mật khẩu</label>
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all" placeholder="Xác nhận mật khẩu mới..." required />
                    </div>
                    <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all mt-4">Lưu mật khẩu mới</button>
                  </form>
                </div>
              ) : (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                    <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3"><span className="text-2xl">🔐</span> Bảo mật</h2>
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                      <div className="flex-1 w-full">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mật khẩu hiện tại</label>
                        <div className="px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-400">•••••• (Đã được bảo vệ)</div>
                      </div>
                      <button onClick={() => { if(confirm("Bạn muốn đổi mật khẩu?")) setState(p => ({...p, settingsPassword: DEFAULT_PASSWORD})); }} className="px-8 py-3.5 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all">Đặt lại mật khẩu</button>
                    </div>
                  </div>

                  <div className="bg-indigo-600 rounded-3xl p-8 shadow-xl shadow-indigo-100 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
                    <h2 className="text-xl font-black mb-2 flex items-center gap-3"><span className="text-2xl">📊</span> Đồng bộ Google Sheet</h2>
                    <div className="space-y-4">
                      <input type="text" value={state.googleSheetUrl} onChange={(e) => setState(prev => ({ ...prev, googleSheetUrl: e.target.value }))} placeholder="URL Web App" className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-sm font-bold placeholder:text-white/30 focus:bg-white/20 outline-none transition-all" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button onClick={async () => {
                          if (!state.googleSheetUrl) { alert("Vui lòng dán URL!"); return; }
                          setIsSyncing(true);
                          const success = await syncToSheet(state.googleSheetUrl, {
                            action: 'sync_all',
                            wallets: state.wallets,
                            categories: state.categories,
                            favorites: state.favorites,
                            settingsPassword: state.settingsPassword,
                            transactions: state.transactions.map(t => ({ 
                              ...t, 
                              categoryName: state.categories.find(c => c.id === t.categoryId)?.name || 'N/A', 
                              walletName: state.wallets.find(w => w.id === t.walletId)?.name || 'N/A',
                              icon: t.icon || state.categories.find(c => c.id === t.categoryId)?.icon || '💰'
                            }))
                          });
                          setIsSyncing(false); 
                          if(success) alert("Đã đồng bộ toàn bộ dữ liệu thành công!");
                        }} disabled={isSyncing || isFetching} className="py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg disabled:opacity-50">{isSyncing ? 'Đang gửi...' : 'Đẩy toàn bộ lên Sheet'}</button>
                        <button onClick={() => pullDataFromSheet(false)} disabled={isSyncing || isFetching} className="py-4 bg-indigo-500 text-white border border-indigo-400 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg disabled:opacity-50">{isFetching ? 'Đang tải...' : 'Tải toàn bộ từ Sheet'}</button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3"><span className="text-2xl">💳</span> Quản lý tài khoản</h2>
                      <button onClick={() => setIsAddingWallet(!isAddingWallet)} className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-indigo-100">{isAddingWallet ? 'Hủy' : '+ Thêm tài khoản'}</button>
                    </div>
                    {isAddingWallet && (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const newW = { id: 'w-' + Math.random().toString(36).substr(2, 9), name: newWalletName, balance: parseFloat(newWalletBalance.replace(/\./g, '')) || 0, icon: newWalletIcon, color: '#6366f1' };
                        const ns = { ...state, wallets: [...state.wallets, newW] };
                        setState(ns); syncConfigToSheet(ns); setIsAddingWallet(false);
                      }} className="mb-8 p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input type="text" value={newWalletName} onChange={e => setNewWalletName(e.target.value)} className="px-4 py-3 rounded-xl border-slate-200 text-sm font-bold" placeholder="Tên ví" required />
                          <input type="text" value={newWalletBalance} onChange={e => setNewWalletBalance(e.target.value)} className="px-4 py-3 rounded-xl border-slate-200 text-sm font-bold" placeholder="Số dư" required />
                          <select value={newWalletIcon} onChange={e => setNewWalletIcon(e.target.value)} className="px-4 py-3 rounded-xl border-slate-200 text-sm font-bold appearance-none">
                            <option value="💳">💳 Thẻ/Bank</option><option value="💵">💵 Tiền mặt</option><option value="🏦">🏦 Ngân hàng</option>
                          </select>
                        </div>
                        <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg">Tạo và Đồng bộ ví</button>
                      </form>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {state.wallets.map(w => (
                        <div key={w.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center relative">
                          <div className="flex items-center gap-4 flex-1">
                            <span className="text-2xl bg-white w-12 h-12 flex items-center justify-center rounded-2xl border">{w.icon}</span>
                            <div><p className="font-black text-slate-700 text-sm">{w.name}</p><p className="text-[10px] font-black text-indigo-500">{w.balance.toLocaleString('vi-VN')}₫</p></div>
                          </div>
                          <button onClick={() => { if(confirm(`Xóa ví ${w.name}?`)) { const ns = { ...state, wallets: state.wallets.filter(x => x.id !== w.id) }; setState(ns); syncConfigToSheet(ns); } }} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-600">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <CategoryManager categories={state.categories} onAdd={(cat) => { const ns = { ...state, categories: [...state.categories, { ...cat, id: 'cat-'+Math.random() }] }; setState(ns); syncConfigToSheet(ns); }} onDelete={(id) => { const ns = { ...state, categories: state.categories.filter(c => c.id !== id) }; setState(ns); syncConfigToSheet(ns); }} onUpdate={(id, up) => { const ns = { ...state, categories: state.categories.map(c => c.id === id ? { ...c, ...up } : c) }; setState(ns); syncConfigToSheet(ns); }} />
                  <FavoriteManager favorites={state.favorites} categories={state.categories} wallets={state.wallets} onUpdate={(id, up) => { const ns = { ...state, favorites: state.favorites.map(f => f.id === id ? { ...f, ...up } : f) }; setState(ns); syncConfigToSheet(ns); }} onAdd={(ni) => { const ns = { ...state, favorites: [...state.favorites, { ...ni, id: 'fav-' + Math.random().toString(36).substr(2, 9) }] }; setState(ns); syncConfigToSheet(ns); }} onDelete={(id) => { const ns = { ...state, favorites: state.favorites.filter(f => f.id !== id) }; setState(ns); syncConfigToSheet(ns); }} onUpdateShopName={(o, n) => { const ns = { ...state, favorites: state.favorites.map(f => f.shopName === o ? { ...f, shopName: n } : f) }; setState(ns); syncConfigToSheet(ns); }} />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <div className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-white/90 backdrop-blur-lg border border-slate-100 shadow-2xl rounded-2xl flex items-center justify-around px-4 z-50">
        {(['dashboard', 'input', 'history', 'settings'] as const).map((tab) => (
          <button key={tab} onClick={() => { setActiveTab(tab); if (tab !== 'settings') setIsUnlocked(false); }} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${activeTab === tab ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
            <span className="text-xl">{tab === 'dashboard' ? '🏠' : tab === 'input' ? '➕' : tab === 'history' ? '📊' : '⚙️'}</span>
            <span className="text-[8px] font-black uppercase tracking-widest">{tab === 'dashboard' ? 'Home' : tab === 'input' ? 'Add' : tab === 'history' ? 'Logs' : 'Config'}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default App;
