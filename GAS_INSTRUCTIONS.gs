/**
 * Google Apps Script (GAS) 部署代碼
 * 
 * 步驟：
 * 1. 建立一個新的 Google 試算表。
 * 2. 建立三個分頁 (Sheet)，名稱分別為：Vendors, Products, SalesReps。
 * 3. 在各分頁的第一列填入標題：
 *    - Vendors: id, companyName, taxId, contactPerson, phone, email
 *    - Products: id, name, specification, defaultPrice
 *    - SalesReps: id, name, email, phone
 * 4. 點擊「擴充功能」 > 「Apps Script」。
 * 5. 貼入以下代碼並儲存。
 * 6. 點擊「部署」 > 「新部署」，類型選擇「網頁應用程式」。
 * 7. 存取權選擇「所有人」(Anyone)，點擊部署。
 * 8. 複製產生的「網頁應用程式 URL」，填入本專案的 VITE_GAS_URL 環境變數中。
 */

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ['Vendors', 'Products', 'SalesReps'];
  const result = {};
  
  sheets.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      const headers = data.shift();
      result[name] = data.map(row => {
        const obj = {};
        headers.forEach((header, i) => obj[header] = row[i]);
        return obj;
      });
    }
  });
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let params;
  try {
    params = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: 'Invalid JSON'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const action = params.action;
  
  if (action === 'addVendor') {
    const sheet = ss.getSheetByName('Vendors');
    const vendor = params.data;
    
    // 檢查是否已存在 (以公司名稱為準)
    const data = sheet.getDataRange().getValues();
    const exists = data.some(row => row[1] === vendor.companyName);
    
    if (!exists) {
      sheet.appendRow([
        Date.now().toString(),
        vendor.companyName,
        vendor.taxId || '',
        vendor.contactPerson || '',
        vendor.phone || '',
        vendor.email || ''
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({error: 'Unknown action'}))
    .setMimeType(ContentService.MimeType.JSON);
}
