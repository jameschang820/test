import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, Search, ChevronDown, User, Building2, Package, Calculator, FileText, X, RefreshCw, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { Vendor, Product, SalesRep, QuotationItem, TaxType, DiscountType } from './types';
import { MOCK_SALES_REPS, MOCK_VENDORS, MOCK_PRODUCTS } from './mockData';
import { apiService } from './services/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  // Data State
  const [salesReps, setSalesReps] = useState<SalesRep[]>(MOCK_SALES_REPS);
  const [vendors, setVendors] = useState<Vendor[]>(MOCK_VENDORS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [salesRepId, setSalesRepId] = useState<string>('');
  const [vendor, setVendor] = useState<Partial<Vendor>>({ companyName: '' });
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [taxType, setTaxType] = useState<TaxType>('add5');
  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [isPreview, setIsPreview] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const previewRef = useRef<HTMLDivElement>(null);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      if (!import.meta.env.VITE_GAS_URL) {
        console.warn('VITE_GAS_URL is not set, using mock data.');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      const data = await apiService.fetchAllData();
      if (data) {
        setSalesReps(data.SalesReps.length > 0 ? data.SalesReps : MOCK_SALES_REPS);
        setVendors(data.Vendors.length > 0 ? data.Vendors : MOCK_VENDORS);
        setProducts(data.Products.length > 0 ? data.Products : MOCK_PRODUCTS);
      } else {
        setError('無法連線至 Google Sheets，目前顯示預設資料。');
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Derived Data
  const selectedSalesRep = salesReps.find(s => s.id === salesRepId);
  
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return Math.round(subtotal * (discountValue / 100));
    }
    return discountValue;
  }, [subtotal, discountType, discountValue]);

  const afterDiscount = subtotal - discountAmount;

  const taxAmount = useMemo(() => {
    if (taxType === 'add5') {
      return Math.round(afterDiscount * 0.05);
    }
    return 0;
  }, [afterDiscount, taxType]);

  const total = useMemo(() => {
    if (taxType === 'included') return afterDiscount;
    return afterDiscount + taxAmount;
  }, [afterDiscount, taxAmount, taxType]);

  // Actions
  const handleAddProduct = (product: Product) => {
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      productId: product.id,
      name: product.name,
      specification: product.specification,
      price: product.defaultPrice,
      quantity: 1,
    };
    setItems([...items, newItem]);
    setIsProductModalOpen(false);
    setSearchTerm('');
  };

  const handleUpdateItem = (id: string, updates: Partial<QuotationItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    
    // Save vendor to GAS if it's a new one
    const isNewVendor = !vendors.some(v => v.companyName === vendor.companyName);
    if (isNewVendor && vendor.companyName) {
      await apiService.saveVendor(vendor);
    }

    const element = previewRef.current;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`報價單_${vendor.companyName || '未命名'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF 產生失敗，請稍後再試。');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.specification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isPreview) {
    return (
      <div className="min-h-screen bg-stone-100 pb-24">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => setIsPreview(false)}
              className="px-4 py-2 text-stone-600 font-medium flex items-center gap-2"
            >
              <X size={20} /> 返回編輯
            </button>
            <h1 className="text-xl font-bold text-stone-800">報價單預覽</h1>
          </div>

          {/* PDF Content Area */}
          <div 
            ref={previewRef}
            className="bg-white shadow-xl p-8 md:p-12 min-h-[297mm] text-stone-800 font-sans"
            id="quotation-pdf"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-stone-800 pb-6 mb-8">
              <div>
                <div className="text-3xl font-black tracking-tighter mb-1">MARKETING PRO</div>
                <div className="text-sm text-stone-500 uppercase tracking-widest">Creative Agency</div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold mb-1">報價單 QUOTATION</h2>
                <p className="text-sm text-stone-500">日期: {new Date().toLocaleDateString('zh-TW')}</p>
                <p className="text-sm text-stone-500">編號: QT-{Date.now().toString().slice(-6)}</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-12 mb-10">
              <div>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">客戶資訊 Client</h3>
                <div className="space-y-1">
                  <p className="font-bold text-lg">{vendor.companyName || '未填寫公司名稱'}</p>
                  {vendor.taxId && <p className="text-sm">統編: {vendor.taxId}</p>}
                  {vendor.contactPerson && <p className="text-sm">聯絡人: {vendor.contactPerson}</p>}
                  {vendor.phone && <p className="text-sm">電話: {vendor.phone}</p>}
                  {vendor.email && <p className="text-sm">Email: {vendor.email}</p>}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">業務資訊 Sales</h3>
                <div className="space-y-1">
                  <p className="font-bold text-lg">{selectedSalesRep?.name || '未選擇業務'}</p>
                  <p className="text-sm">電話: {selectedSalesRep?.phone}</p>
                  <p className="text-sm">Email: {selectedSalesRep?.email}</p>
                  <p className="text-sm mt-4 pt-4 border-t border-stone-100 text-stone-400 italic">
                    Marketing Pro Co., Ltd.<br/>
                    統編: 88888888
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table (PDF version uses table for structure) */}
            <table className="w-full mb-10">
              <thead>
                <tr className="border-b border-stone-800 text-left text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">項目內容</th>
                  <th className="py-3 px-2 text-right">單價</th>
                  <th className="py-3 px-2 text-center">數量</th>
                  <th className="py-3 px-2 text-right">小計</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="py-4 px-2">
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-stone-500 mt-1">{item.specification}</p>
                    </td>
                    <td className="py-4 px-2 text-right font-mono">${item.price.toLocaleString()}</td>
                    <td className="py-4 px-2 text-center">{item.quantity}</td>
                    <td className="py-4 px-2 text-right font-mono">${(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-16">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">小計 Subtotal</span>
                  <span className="font-mono">${subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>折扣 Discount</span>
                    <span className="font-mono">-${discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {taxType !== 'none' && (
                  <div className="flex justify-between text-sm">
                    <span>營業稅 Tax (5%)</span>
                    <span className="font-mono">
                      {taxType === 'included' ? '(內含)' : `$${taxAmount.toLocaleString()}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-4 border-t-2 border-stone-800 font-bold text-xl">
                  <span>總計 Total</span>
                  <span className="font-mono">${total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="mt-auto pt-12">
              <div className="grid grid-cols-2 gap-12">
                <div className="border-t border-stone-300 pt-4">
                  <p className="text-xs font-bold text-stone-400 uppercase mb-8">報價單位簽章 Company Stamp</p>
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-stone-100 rounded-lg">
                    <span className="text-stone-200 text-xs italic">Marketing Pro Co., Ltd.</span>
                  </div>
                </div>
                <div className="border-t border-stone-300 pt-4">
                  <p className="text-xs font-bold text-stone-400 uppercase mb-8">客戶確認簽回 Client Signature</p>
                  <div className="h-24 border-b border-stone-200"></div>
                  <p className="text-[10px] text-stone-400 mt-2">請簽名或蓋公司章後回傳，即視為正式委託。</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer for Preview */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 safe-area-bottom">
          <div className="max-w-4xl mx-auto flex gap-4">
            <button 
              onClick={handleExportPDF}
              className="flex-1 bg-stone-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
            >
              <Download size={20} /> 匯出 PDF 報價單
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-32 font-sans text-stone-900">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-4 py-6 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black tracking-tighter">MARKETING PRO</h1>
          <div className="flex items-center gap-2">
            {isLoading && <RefreshCw size={14} className="animate-spin text-stone-400" />}
            {error && <AlertCircle size={14} className="text-amber-500" title={error} />}
            <div className="bg-stone-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Quotation Generator
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-8">
        {/* Step 1: Sales Rep */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-stone-400">
            <User size={18} />
            <h2 className="text-xs font-bold uppercase tracking-widest">Step 1: 選擇業務員</h2>
          </div>
          <div className="relative">
            <select 
              value={salesRepId}
              onChange={(e) => setSalesRepId(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-4 appearance-none focus:outline-none focus:ring-2 focus:ring-stone-900/5 transition-all text-lg font-medium"
            >
              <option value="">請選擇您的姓名</option>
              {salesReps.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={20} />
          </div>
        </section>

        {/* Step 2: Vendor */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-stone-400">
            <Building2 size={18} />
            <h2 className="text-xs font-bold uppercase tracking-widest">Step 2: 報價對象</h2>
          </div>
          <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">公司名稱</label>
              <input 
                type="text"
                placeholder="輸入或搜尋現有廠商"
                value={vendor.companyName}
                onChange={(e) => setVendor({ ...vendor, companyName: e.target.value })}
                className="w-full border-b border-stone-100 py-2 text-lg font-bold focus:outline-none focus:border-stone-900 transition-colors"
                list="vendors-list"
              />
              <datalist id="vendors-list">
                {vendors.map(v => (
                  <option key={v.id} value={v.companyName} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">統一編號</label>
                <input 
                  type="text"
                  placeholder="8位數字"
                  value={vendor.taxId || ''}
                  onChange={(e) => setVendor({ ...vendor, taxId: e.target.value })}
                  className="w-full border-b border-stone-100 py-2 focus:outline-none focus:border-stone-900 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">聯絡人</label>
                <input 
                  type="text"
                  placeholder="姓名"
                  value={vendor.contactPerson || ''}
                  onChange={(e) => setVendor({ ...vendor, contactPerson: e.target.value })}
                  className="w-full border-b border-stone-100 py-2 focus:outline-none focus:border-stone-900 transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Step 3: Items */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-stone-400">
              <Package size={18} />
              <h2 className="text-xs font-bold uppercase tracking-widest">Step 3: 報價明細</h2>
            </div>
            <button 
              onClick={() => setIsProductModalOpen(true)}
              className="text-xs font-bold bg-stone-900 text-white px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-transform"
            >
              <Plus size={14} /> 新增品項
            </button>
          </div>

          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="bg-stone-100/50 border-2 border-dashed border-stone-200 rounded-3xl p-12 text-center">
                <p className="text-stone-400 text-sm">尚未加入任何報價項目</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-8">
                      <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
                      <p className="text-xs text-stone-400 mt-1">{item.specification}</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-stone-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">單價</label>
                      <div className="flex items-center gap-1">
                        <span className="text-stone-400 font-mono">$</span>
                        <input 
                          type="number"
                          value={item.price}
                          onChange={(e) => handleUpdateItem(item.id, { price: Number(e.target.value) })}
                          className="w-full border-b border-stone-100 py-1 font-mono focus:outline-none focus:border-stone-900 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="w-24 space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">數量</label>
                      <div className="flex items-center bg-stone-50 rounded-xl p-1">
                        <button 
                          onClick={() => handleUpdateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                          className="w-8 h-8 flex items-center justify-center text-stone-400 active:bg-stone-200 rounded-lg transition-colors"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateItem(item.id, { quantity: item.quantity + 1 })}
                          className="w-8 h-8 flex items-center justify-center text-stone-400 active:bg-stone-200 rounded-lg transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-stone-50 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">小計</span>
                    <span className="font-mono font-bold text-stone-600">${(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Step 4: Summary Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-stone-400">
            <Calculator size={18} />
            <h2 className="text-xs font-bold uppercase tracking-widest">Step 4: 交易條件</h2>
          </div>
          <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-6 shadow-sm">
            {/* Tax */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">稅額計算</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'none', label: '不計稅' },
                  { id: 'add5', label: '外加 5%' },
                  { id: 'included', label: '已含稅' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTaxType(t.id as TaxType)}
                    className={cn(
                      "py-2.5 rounded-xl text-xs font-bold transition-all border",
                      taxType === t.id 
                        ? "bg-stone-900 border-stone-900 text-white shadow-md" 
                        : "bg-white border-stone-100 text-stone-400 hover:border-stone-200"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">折扣設定</label>
                <div className="flex bg-stone-100 p-0.5 rounded-lg">
                  <button 
                    onClick={() => setDiscountType('percent')}
                    className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", discountType === 'percent' ? "bg-white shadow-sm text-stone-900" : "text-stone-400")}
                  >
                    %
                  </button>
                  <button 
                    onClick={() => setDiscountType('amount')}
                    className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", discountType === 'amount' ? "bg-white shadow-sm text-stone-900" : "text-stone-400")}
                  >
                    $
                  </button>
                </div>
              </div>
              <div className="relative">
                <input 
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-stone-900/5 transition-all"
                  placeholder={discountType === 'percent' ? "輸入折扣趴數 (如 10)" : "輸入折讓金額"}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 font-bold">
                  {discountType === 'percent' ? '%' : '$'}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-stone-200 p-4 pb-8 safe-area-bottom z-20">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">總計金額 Total</span>
            <span className="text-2xl font-black tracking-tighter font-mono">${total.toLocaleString()}</span>
          </div>
          <button 
            disabled={items.length === 0 || !salesRepId}
            onClick={() => setIsPreview(true)}
            className="flex-1 bg-stone-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all"
          >
            <FileText size={20} /> 預覽報價單
          </button>
        </div>
      </div>

      {/* Product Search Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div 
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={() => setIsProductModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b border-stone-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">選擇商品</h3>
                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="bg-stone-100 p-2 rounded-full text-stone-400"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input 
                  autoFocus
                  type="text"
                  placeholder="搜尋商品名稱或規格..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-stone-900/5 transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  沒有找到符合的商品
                </div>
              ) : (
                filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="w-full text-left bg-white border border-stone-100 p-4 rounded-2xl hover:border-stone-900 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-bold text-stone-800 group-hover:text-stone-900">{product.name}</p>
                        <p className="text-xs text-stone-400 mt-1 line-clamp-1">{product.specification}</p>
                      </div>
                      <p className="font-mono font-bold text-stone-600 ml-4">${product.defaultPrice.toLocaleString()}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
