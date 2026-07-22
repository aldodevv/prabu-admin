import api from '@/lib/api';
import { 
  Member, 
  Trainer, 
  PTRegistration, 
  Transaction, 
  Checkin, 
  Branch, 
  Admin,
  Distributor,
  Product,
  PurchaseTransaction
} from '@/core/types';

// Structured fetch system wrapping api calls with proper TypeScript typing
export const membersApi = {
  list: (params: { branch_id?: string; page?: number; search?: string; per_page?: number }) => {
    const q = new URLSearchParams();
    if (params.branch_id) q.append('branch_id', params.branch_id);
    if (params.page) q.append('page', String(params.page));
    if (params.search) q.append('search', params.search);
    if (params.per_page) q.append('per_page', String(params.per_page));
    return api.get<Member[]>(`/admin/members?${q.toString()}`);
  },
  get: (id: string) => api.get<Member>(`/admin/members/${id}`),
  create: (data: Partial<Member>) => api.post<Member>('/admin/members', data),
  update: (id: string, data: Partial<Member>) => api.put<void>(`/admin/members/${id}`, data),
  delete: (id: string) => api.delete<void>(`/admin/members/${id}`),
  getNextCode: (branchId: string) => api.get<{ next_code: string }>(`/admin/members/next-code?branch_id=${branchId}`),
};

export const trainersApi = {
  list: (branchId: string) => api.get<Trainer[]>(`/admin/trainers?branch_id=${branchId}`),
  get: (id: string) => api.get<Trainer>(`/admin/trainers/${id}`),
  create: (data: Partial<Trainer>) => api.post<Trainer>('/admin/trainers', data),
  update: (id: string, data: Partial<Trainer>) => api.put<void>(`/admin/trainers/${id}`, data),
  delete: (id: string) => api.delete<void>(`/admin/trainers/${id}`),
};

export const ptRegistrationsApi = {
  list: (branchId: string) => api.get<PTRegistration[]>(`/admin/pt-registrations?branch_id=${branchId}`),
  create: (data: {
    member_id: string;
    trainer_id: string;
    package_name: string;
    payment_method: string;
    total_amount: number;
    notes: string;
  }) => api.post<PTRegistration>('/admin/pt-registrations', data),
  updateNotes: (id: string, notes: string) => api.put<void>(`/admin/pt-registrations/${id}`, { notes }),
};

export const transactionsApi = {
  list: (params: { branch_id?: string; date_from?: string; date_to?: string; notes?: string; page?: number; per_page?: number }) => {
    const q = new URLSearchParams();
    if (params.branch_id) q.append('branch_id', params.branch_id);
    if (params.date_from) q.append('date_from', params.date_from);
    if (params.date_to) q.append('date_to', params.date_to);
    if (params.notes) q.append('notes', params.notes);
    if (params.page) q.append('page', String(params.page));
    if (params.per_page) q.append('per_page', String(params.per_page));
    return api.get<Transaction[]>(`/admin/transactions?${q.toString()}`);
  },
  get: (id: string) => api.get<Transaction>(`/admin/transactions/${id}`),
  create: (data: {
    member_id: string | null;
    notes: string;
    total_amount?: number;
    items?: { product_id: string; quantity: number }[];
  }) => api.post<Transaction>('/admin/transactions', data),
  delete: (id: string) => api.delete<void>(`/admin/transactions/${id}`),
};

export const checkinsApi = {
  list: (params: { branch_id?: string; date_from?: string; date_to?: string; page?: number; per_page?: number }) => {
    const q = new URLSearchParams();
    if (params.branch_id) q.append('branch_id', params.branch_id);
    if (params.date_from) q.append('date_from', params.date_from);
    if (params.date_to) q.append('date_to', params.date_to);
    if (params.page) q.append('page', String(params.page));
    if (params.per_page) q.append('per_page', String(params.per_page));
    return api.get<Checkin[]>(`/admin/checkins?${q.toString()}`);
  },
  checkin: (memberId: string) => api.post<Checkin>(`/admin/members/${memberId}/checkin`, {}),
  checkout: (memberId: string) => api.post<Checkin>(`/admin/members/${memberId}/checkout`, {}),
};

export const branchesApi = {
  list: () => api.get<Branch[]>('/admin/branches'),
};

export const dashboardApi = {
  summary: (branchId: string) => api.get<any>(`/admin/dashboard/summary?branch_id=${branchId}`),
  checkinsToday: (branchId: string) => api.get<any>(`/admin/dashboard/checkins-today?branch_id=${branchId}`),
};

export const productsApi = {
  list: (branchId: string, page = 1, perPage = 200) => api.get<Product[]>(`/admin/products?branch_id=${branchId}&page=${page}&per_page=${perPage}`),
  get: (id: string) => api.get<Product>(`/admin/products/${id}`),
  getNextCode: (branchId: string) => api.get<{ next_code: string }>(`/admin/products/next-code?branch_id=${branchId}`),
  create: (data: Partial<Product>) => api.post<Product>('/admin/products', data),
  update: (id: string, data: Partial<Product>) => api.put<void>(`/admin/products/${id}`, data),
  delete: (id: string) => api.delete<void>(`/admin/products/${id}`),
};

export const purchaseTransactionsApi = {
  list: (branchId: string) => api.get<PurchaseTransaction[]>(`/admin/purchase-transactions?branch_id=${branchId}`),
  getNextNumbers: (branchId: string) => api.get<{ transaction_number: string; next_invoice: string }>(`/admin/purchase-transactions/next-number?branch_id=${branchId}`),
  get: (id: string) => api.get<PurchaseTransaction>(`/admin/purchase-transactions/${id}`),
  create: (data: {
    transaction_date?: string;
    invoice_number?: string;
    distributor_id: string;
    notes: string;
    items: { product_id: string; quantity: number; unit_price: number }[];
  }) => api.post<PurchaseTransaction>('/admin/purchase-transactions', data),
  updateNotes: (id: string, notes: string) => api.put<void>(`/admin/purchase-transactions/${id}`, { notes }),
  delete: (id: string) => api.delete<void>(`/admin/purchase-transactions/${id}`),
};



export const employeesApi = {
  list: (params: { branch_id?: string; page?: number; per_page?: number }) => {
    const q = new URLSearchParams();
    if (params.branch_id) q.append('branch_id', params.branch_id);
    if (params.page) q.append('page', String(params.page));
    if (params.per_page) q.append('per_page', String(params.per_page));
    return api.get<any[]>(`/admin/employees?${q.toString()}`);
  },
  get: (id: string) => api.get<any>(`/admin/employees/${id}`),
  create: (data: any) => api.post<any>('/admin/employees', data),
  update: (id: string, data: any) => api.put<any>(`/admin/employees/${id}`, data),
  delete: (id: string) => api.delete<any>(`/admin/employees/${id}`),
};

export const distributorsApi = {
  list: () => api.get<Distributor[]>('/admin/distributors'),
  get: (id: string) => api.get<Distributor>(`/admin/distributors/${id}`),
  create: (data: Partial<Distributor>) => api.post<Distributor>('/admin/distributors', data),
  update: (id: string, data: Partial<Distributor>) => api.put<void>(`/admin/distributors/${id}`, data),
  delete: (id: string) => api.delete<void>(`/admin/distributors/${id}`),
};

