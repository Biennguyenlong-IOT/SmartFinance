
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const res = {
    wallets: [],
    categories: [],
    favorites: [],
<<<<<<< HEAD
    transactions: []
  };

  try {
    // 1. Lấy dữ liệu Ví (Vi)
=======
    transactions: [],
    settingsPassword: ""
  };

  try {
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
    const walletSheet = ss.getSheetByName('Vi');
    if (walletSheet) {
      const data = walletSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
<<<<<<< HEAD
        if (!data[i][0]) continue; // Bỏ qua dòng trống
=======
        if (!data[i][0]) continue;
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
        res.wallets.push({ 
          id: String(data[i][0]), 
          name: data[i][1], 
          balance: Number(data[i][2]) || 0, 
<<<<<<< HEAD
          icon: data[i][3] || '💳' 
=======
          icon: data[i][3] || '💳',
          color: '#6366f1'
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
        });
      }
    }

<<<<<<< HEAD
    // 2. Lấy dữ liệu Danh mục (DanhMuc)
=======
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
    const catSheet = ss.getSheetByName('DanhMuc');
    if (catSheet) {
      const data = catSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (!data[i][0]) continue;
        res.categories.push({ 
          id: String(data[i][0]), 
          name: data[i][1], 
          icon: data[i][2] || '✨', 
<<<<<<< HEAD
          type: data[i][3] 
=======
          type: data[i][3],
          color: data[i][3] === 'EXPENSE' ? '#f43f5e' : '#10b981'
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
        });
      }
    }

<<<<<<< HEAD
    // 3. Lấy dữ liệu Đơn giá quán quen (YeuThich)
=======
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
    const favSheet = ss.getSheetByName('YeuThich');
    if (favSheet) {
      const data = favSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (!data[i][0]) continue;
        res.favorites.push({ 
          id: String(data[i][0]), 
          name: data[i][1], 
          price: Number(data[i][2]) || 0, 
          categoryId: String(data[i][3]), 
          icon: data[i][4] || '📍', 
          shopName: data[i][5], 
          defaultWalletId: String(data[i][6]) 
        });
      }
    }

<<<<<<< HEAD
    // 4. Lấy dữ liệu Giao dịch (GiaoDich)
=======
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
    const txSheet = ss.getSheetByName('GiaoDich');
    if (txSheet) {
      const data = txSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (!data[i][0]) continue;
<<<<<<< HEAD
        res.transactions.push({ 
          id: String(data[i][0]), 
          date: data[i][1], 
=======
        let dateVal = data[i][1];
        if (dateVal instanceof Date) { dateVal = dateVal.toISOString(); }

        res.transactions.push({ 
          id: String(data[i][0]), 
          date: dateVal, 
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
          amount: Number(data[i][2]) || 0, 
          type: data[i][3], 
          categoryName: data[i][4], 
          walletName: data[i][5], 
<<<<<<< HEAD
          note: data[i][6] 
=======
          note: data[i][6],
          categoryId: String(data[i][7] || ""),
          walletId: String(data[i][8] || ""),
          icon: String(data[i][9] || ""),
          toWalletId: String(data[i][10] || ""),
          toWalletName: String(data[i][11] || "")
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
        });
      }
    }

<<<<<<< HEAD
    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (f) {
    return ContentService.createTextOutput(JSON.stringify({ error: f.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
=======
    const settingsSheet = ss.getSheetByName('Settings');
    if (settingsSheet) {
      const data = settingsSheet.getDataRange().getValues();
      if (data.length > 1) { res.settingsPassword = String(data[1][0]); }
    }

    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  } catch (f) {
    return ContentService.createTextOutput(JSON.stringify({ error: f.toString() })).setMimeType(ContentService.MimeType.JSON);
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
  }
}

function doPost(e) {
  const res = ContentService.createTextOutput();
  res.setMimeType(ContentService.MimeType.JSON);
  
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
<<<<<<< HEAD
    if (data.action === 'sync_all') {
      // Sync Wallets
=======
    // Đảm bảo luôn có Header đúng chuẩn
    const TX_HEADERS = ['ID', 'Thời gian', 'Số tiền', 'Loại', 'Danh mục', 'Ví', 'Ghi chú', 'CategoryID', 'WalletID', 'Icon', 'ToWalletID', 'ToWalletName'];

    if (data.action === 'sync_all') {
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
      const walletSheet = ss.getSheetByName('Vi') || ss.insertSheet('Vi');
      walletSheet.clear();
      walletSheet.appendRow(['ID', 'Tên Ví', 'Số dư', 'Biểu tượng']);
      data.wallets.forEach(w => walletSheet.appendRow([w.id, w.name, w.balance, w.icon]));
      
<<<<<<< HEAD
      // Sync Categories
=======
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
      const catSheet = ss.getSheetByName('DanhMuc') || ss.insertSheet('DanhMuc');
      catSheet.clear();
      catSheet.appendRow(['ID', 'Tên', 'Biểu tượng', 'Loại']);
      data.categories.forEach(c => catSheet.appendRow([c.id, c.name, c.icon, c.type]));
      
<<<<<<< HEAD
      // Sync Favorites
      const favSheet = ss.getSheetByName('YeuThich') || ss.insertSheet('YeuThich');
      favSheet.clear();
      favSheet.appendRow(['ID', 'Tên món', 'Giá', 'Danh mục', 'Biểu tượng', 'Tên quán', 'Ví mặc định']);
      data.favorites.forEach(f => favSheet.appendRow([f.id, f.name, f.price, f.categoryId, f.icon, f.shopName, f.defaultWalletId]));
      
      // Sync Transactions
      if (data.transactions) {
        const txSheet = ss.getSheetByName('GiaoDich') || ss.insertSheet('GiaoDich');
        txSheet.clear();
        txSheet.appendRow(['ID', 'Thời gian', 'Số tiền', 'Loại', 'Danh mục', 'Ví', 'Ghi chú']);
        data.transactions.forEach(t => txSheet.appendRow([t.id, t.date, t.amount, t.type, t.categoryName, t.walletName, t.note]));
      }
      
=======
      const favSheet = ss.getSheetByName('YeuThich') || ss.insertSheet('YeuThich');
      favSheet.clear();
      favSheet.appendRow(['ID', 'Tên món', 'Giá', 'Danh mục ID', 'Biểu tượng', 'Tên quán', 'Ví ID']);
      data.favorites.forEach(f => favSheet.appendRow([f.id, f.name, f.price, f.categoryId, f.icon, f.shopName, f.defaultWalletId]));
      
      if (data.transactions) {
        const txSheet = ss.getSheetByName('GiaoDich') || ss.insertSheet('GiaoDich');
        txSheet.clear();
        txSheet.appendRow(TX_HEADERS);
        data.transactions.forEach(t => {
          txSheet.appendRow([t.id, t.date, t.amount, t.type, t.categoryName, t.walletName, t.note, t.categoryId, t.walletId, t.icon, t.toWalletId || "", t.toWalletName || ""]);
        });
      }

      if (data.settingsPassword) {
        const settingsSheet = ss.getSheetByName('Settings') || ss.insertSheet('Settings');
        settingsSheet.clear();
        settingsSheet.appendRow(['Password']);
        settingsSheet.appendRow([data.settingsPassword]);
      }
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
      return res.setContent(JSON.stringify({ status: 'success' }));
    }
    
    if (data.action === 'add_transaction') {
      const txSheet = ss.getSheetByName('GiaoDich') || ss.insertSheet('GiaoDich');
<<<<<<< HEAD
      const t = data.transaction;
      txSheet.appendRow([t.id, t.date, t.amount, t.type, t.categoryName, t.walletName, t.note]);
      
      // Update balance in Vi sheet
      const walletSheet = ss.getSheetByName('Vi');
      if (walletSheet) {
        const walletData = walletSheet.getDataRange().getValues();
        for (let i = 1; i < walletData.length; i++) {
          if (String(walletData[i][0]) === String(t.walletId)) {
            walletSheet.getRange(i + 1, 3).setValue(data.newBalance);
            break;
          }
        }
      }
=======
      // Nếu sheet mới tạo (chưa có header), thêm header
      if (txSheet.getLastRow() === 0) {
        txSheet.appendRow(TX_HEADERS);
      }
      const t = data.transaction;
      txSheet.appendRow([t.id, t.date, t.amount, t.type, t.categoryName, t.walletName, t.note, t.categoryId, t.walletId, t.icon, t.toWalletId || "", t.toWalletName || ""]);
      updateWalletBalance(ss, t.walletId, data.newBalance);
      return res.setContent(JSON.stringify({ status: 'success' }));
    }

    if (data.action === 'update_wallet_balance') {
      updateWalletBalance(ss, data.walletId, data.balance);
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
      return res.setContent(JSON.stringify({ status: 'success' }));
    }

  } catch (error) {
    return res.setContent(JSON.stringify({ status: 'error', message: error.toString() }));
  }
}

<<<<<<< HEAD
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
=======
function updateWalletBalance(ss, walletId, newBalance) {
  const walletSheet = ss.getSheetByName('Vi');
  if (walletSheet) {
    const walletData = walletSheet.getDataRange().getValues();
    for (let i = 1; i < walletData.length; i++) {
      if (String(walletData[i][0]) === String(walletId)) {
        walletSheet.getRange(i + 1, 3).setValue(newBalance);
        return true;
      }
    }
  }
  return false;
>>>>>>> 85e4e8052c808e91e17653b9e12bb8c1a48d9261
}
