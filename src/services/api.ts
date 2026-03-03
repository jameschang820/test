import { Vendor, Product, SalesRep } from '../types';

const GAS_URL = import.meta.env.VITE_GAS_URL;

export interface AppData {
  Vendors: Vendor[];
  Products: Product[];
  SalesReps: SalesRep[];
}

export const apiService = {
  async fetchAllData(): Promise<AppData | null> {
    if (!GAS_URL) return null;
    try {
      const response = await fetch(GAS_URL);
      if (!response.ok) throw new Error('Failed to fetch data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching data from GAS:', error);
      return null;
    }
  },

  async saveVendor(vendor: Partial<Vendor>): Promise<boolean> {
    if (!GAS_URL) return false;
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors', // GAS requires no-cors for simple POST or it redirects
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addVendor',
          data: vendor,
        }),
      });
      // With no-cors, we can't read the response, but we assume success if no error thrown
      return true;
    } catch (error) {
      console.error('Error saving vendor to GAS:', error);
      return false;
    }
  },
};
