import { Vendor, Product, SalesRep } from './types';

export const MOCK_SALES_REPS: SalesRep[] = [
  { id: 's1', name: '張小明', email: 'ming@marketing.com', phone: '0912-345-678' },
  { id: 's2', name: '李美華', email: 'hua@marketing.com', phone: '0923-456-789' },
  { id: 's3', name: '王大同', email: 'tong@marketing.com', phone: '0934-567-890' },
];

export const MOCK_VENDORS: Vendor[] = [
  { id: 'v1', companyName: '科技股份有限公司', taxId: '12345678', contactPerson: '陳經理', phone: '02-2345-6789', email: 'contact@tech.com' },
  { id: 'v2', companyName: '創意設計工作室', taxId: '87654321', contactPerson: '林小姐', phone: '03-3456-7890', email: 'design@creative.com' },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: '社群媒體代操 (月)', specification: '包含 FB/IG 每月 12 篇貼文與廣告投放管理', defaultPrice: 35000 },
  { id: 'p2', name: 'Google 關鍵字廣告', specification: '每月廣告投放管理費 (不含媒體費)', defaultPrice: 15000 },
  { id: 'p3', name: '品牌視覺設計', specification: '包含 Logo、名片、標準字設計', defaultPrice: 50000 },
  { id: 'p4', name: '一頁式銷售頁製作', specification: '包含文案撰寫、RWD 網頁設計與串接', defaultPrice: 25000 },
  { id: 'p5', name: 'KOL 合作媒合', specification: '單次媒合 3 位微網紅 (不含網紅酬勞)', defaultPrice: 12000 },
];
