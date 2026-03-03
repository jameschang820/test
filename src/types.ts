export interface Vendor {
  id: string;
  companyName: string;
  taxId?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export interface Product {
  id: string;
  name: string;
  specification: string;
  defaultPrice: number;
}

export interface SalesRep {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface QuotationItem {
  id: string;
  productId: string;
  name: string;
  specification: string;
  price: number;
  quantity: number;
}

export type TaxType = 'none' | 'add5' | 'included';
export type DiscountType = 'amount' | 'percent';

export interface QuotationState {
  salesRepId: string;
  vendor: Partial<Vendor>;
  items: QuotationItem[];
  taxType: TaxType;
  discountType: DiscountType;
  discountValue: number;
}
