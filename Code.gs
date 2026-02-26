
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const res = {
    wallets: [],
    categories: [],
    favorites: [],
    transactions: [],
    settingsPassword: ""
  };

  try {
    const walletSheet = ss.getSheetByName('Vi');
    if (walletSheet) {
      const data = walletSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (!data[i][0]) continue;
        res.wallets.push({ 
          id: String(data[i][0]), 
          name: data[i][1], 
          balance: Number(data[i][2]) || 0, 
          icon: data[i][3] || '💳',
          color: '#6366f1',
          isSavings: data[i][4] === true || data[i][4] === 'TRUE',
          startDate: data[i][5] ? (data[i][5] instanceof Date ? data[i][5].toISOString() : String(data[i][5])) : undefined,
          interestRate: Number(data[i][6]) || 0,
          termMonths: Number(data[i][7]) || 0
        });
      }
    }

    const catSheet = ss.getSheetByName('DanhMuc');
    if (catSheet) {
      const data = catSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (!data[i][0]) continue;
        res.categories.push({ 
          id: String(data[i][0]), 
          name: data[i][1], 
          icon: data[i][2] || '✨', 
          type: data[i][3],
          budget: Number(data[i][4]) || 0,
          color: data[i][3] === 'EXPENSE' ? '#f43f5e' : '#10b981'
        });
      }
    }

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

    const txSheet = ss.getSheetByName('GiaoDich');
    if (txSheet) {
      const lastRow = txSheet.getLastRow();
      const maxTx = 300; // Chỉ tải 300 giao dịch gần nhất để tối ưu tốc độ
      const startRow = Math.max(2, lastRow - maxTx + 1);
      const numRows = lastRow - startRow + 1;
      
      if (numRows > 0) {
        const data = txSheet.getRange(startRow, 1, numRows, 12).getValues();
        for (let i = 0; i < data.length; i++) {
          if (!data[i][0]) continue;
          let dateVal = data[i][1];
          if (dateVal instanceof Date) { dateVal = dateVal.toISOString(); }

          res.transactions.push({ 
            id: String(data[i][0]), 
            date: dateVal, 
            amount: Number(data[i][2]) || 0, 
            type: data[i][3], 
            categoryName: data[i][4], 
            walletName: data[i][5], 
            note: data[i][6],
            categoryId: String(data[i][7] || ""),
            walletId: String(data[i][8] || ""),
            icon: String(data[i][9] || ""),
            toWalletId: String(data[i][10] || ""),
            toWalletName: String(data[i][11] || "")
          });
        }
        // Đảo ngược để món mới nhất lên đầu nếu cần, hoặc để client xử lý
        res.transactions.reverse();
      }
    }

    const settingsSheet = ss.getSheetByName('Settings');
    if (settingsSheet) {
      const data = settingsSheet.getDataRange().getValues();
      if (data.length > 1) { res.settingsPassword = String(data[1][0]); }
    }

    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  } catch (f) {
    return ContentService.createTextOutput(JSON.stringify({ error: f.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const res = ContentService.createTextOutput();
  res.setMimeType(ContentService.MimeType.JSON);
  
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Đảm bảo luôn có Header đúng chuẩn
    const TX_HEADERS = ['ID', 'Thời gian', 'Số tiền', 'Loại', 'Danh mục', 'Ví', 'Ghi chú', 'CategoryID', 'WalletID', 'Icon', 'ToWalletID', 'ToWalletName'];

    if (data.action === 'sync_all') {
      const walletSheet = ss.getSheetByName('Vi') || ss.insertSheet('Vi');
      walletSheet.clear();
      walletSheet.appendRow(['ID', 'Tên Ví', 'Số dư', 'Biểu tượng', 'Tiết kiệm', 'Ngày bắt đầu', 'Lãi suất', 'Kỳ hạn']);
      if (data.wallets && data.wallets.length > 0) {
        const walletValues = data.wallets.map(w => [
          w.id, 
          w.name, 
          w.balance, 
          w.icon, 
          w.isSavings || false, 
          w.startDate || "", 
          w.interestRate || 0, 
          w.termMonths || 0
        ]);
        walletSheet.getRange(2, 1, walletValues.length, 8).setValues(walletValues);
      }
      
      const catSheet = ss.getSheetByName('DanhMuc') || ss.insertSheet('DanhMuc');
      catSheet.clear();
      catSheet.appendRow(['ID', 'Tên', 'Biểu tượng', 'Loại', 'Ngân sách']);
      if (data.categories && data.categories.length > 0) {
        const catValues = data.categories.map(c => [c.id, c.name, c.icon, c.type, c.budget || 0]);
        catSheet.getRange(2, 1, catValues.length, 5).setValues(catValues);
      }
      
      const favSheet = ss.getSheetByName('YeuThich') || ss.insertSheet('YeuThich');
      favSheet.clear();
      favSheet.appendRow(['ID', 'Tên món', 'Giá', 'Danh mục ID', 'Biểu tượng', 'Tên quán', 'Ví ID']);
      if (data.favorites && data.favorites.length > 0) {
        const favValues = data.favorites.map(f => [f.id, f.name, f.price, f.categoryId, f.icon, f.shopName, f.defaultWalletId]);
        favSheet.getRange(2, 1, favValues.length, 7).setValues(favValues);
      }
      
      if (data.transactions && data.transactions.length > 0) {
        const txSheet = ss.getSheetByName('GiaoDich') || ss.insertSheet('GiaoDich');
        txSheet.clear();
        txSheet.appendRow(TX_HEADERS);
        const txValues = data.transactions.map(t => [t.id, t.date, t.amount, t.type, t.categoryName, t.walletName, t.note, t.categoryId, t.walletId, t.icon, t.toWalletId || "", t.toWalletName || ""]);
        txSheet.getRange(2, 1, txValues.length, 12).setValues(txValues);
      }

      if (data.settingsPassword) {
        const settingsSheet = ss.getSheetByName('Settings') || ss.insertSheet('Settings');
        settingsSheet.clear();
        settingsSheet.appendRow(['Password']);
        settingsSheet.appendRow([data.settingsPassword]);
      }
      return res.setContent(JSON.stringify({ status: 'success' }));
    }
    
    if (data.action === 'add_transaction') {
      const txSheet = ss.getSheetByName('GiaoDich') || ss.insertSheet('GiaoDich');
      // Nếu sheet mới tạo (chưa có header), thêm header
      if (txSheet.getLastRow() === 0) {
        txSheet.appendRow(TX_HEADERS);
      }
      
      const t = data.transaction;
      
      // Kiểm tra trùng lặp ID trước khi append
      const existingIds = txSheet.getRange(1, 1, Math.max(1, txSheet.getLastRow()), 1).getValues().flat();
      if (existingIds.includes(String(t.id))) {
        return res.setContent(JSON.stringify({ status: 'success', message: 'Duplicate ID skipped' }));
      }

      txSheet.appendRow([t.id, t.date, t.amount, t.type, t.categoryName, t.walletName, t.note, t.categoryId, t.walletId, t.icon, t.toWalletId || "", t.toWalletName || ""]);
      updateWalletBalance(ss, t.walletId, data.newBalance);
      return res.setContent(JSON.stringify({ status: 'success' }));
    }

    if (data.action === 'update_wallet_balance') {
      updateWalletBalance(ss, data.walletId, data.balance);
      return res.setContent(JSON.stringify({ status: 'success' }));
    }

  } catch (error) {
    return res.setContent(JSON.stringify({ status: 'error', message: error.toString() }));
  }
}

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
}
