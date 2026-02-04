// src/types/data.ts

// src/types/data.ts

// 1. We MUST export this interface
export interface Category {
  id: string;
  name: string;
  is_default?: boolean;
}

// 2. We MUST export this interface too
export interface Transaction {
  id: string;
  amount: number;
  description?: string;
  date: string;       
  category: string | null;   // Can be null based on your API
  category_name?: string; 
  transaction_type: 'income' | 'expense';
}

