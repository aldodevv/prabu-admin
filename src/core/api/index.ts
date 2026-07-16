import api from '@/lib/api';
import { 
  Member, 
  Trainer, 
  PTRegistration, 
  Transaction, 
  Checkin, 
  Branch, 
  Admin 
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
};

export const branchesApi = {
  list: () => api.get<Branch[]>('/admin/branches'),
};

export const dashboardApi = {
  summary: (branchId: string) => api.get<any>(`/admin/dashboard/summary?branch_id=${branchId}`),
  checkinsToday: (branchId: string) => api.get<any>(`/admin/dashboard/checkins-today?branch_id=${branchId}`),
};

export const productsApi = {
  list: (branchId: string, perPage = 100) => api.get<any[]>(`/admin/products?branch_id=${branchId}&per_page=${perPage}`),
  create: (data: any) => api.post<any>('/admin/products', data),
  update: (id: string, data: any) => api.put<any>(`/admin/products/${id}`, data),
  delete: (id: string) => api.delete<any>(`/admin/products/${id}`),
};

export const reportsApi = {
  list: (branchId: string) => api.get<any[]>(`/admin/reports?branch_id=${branchId}`),
};

export const employeesApi = {
  checkin: () => api.post<any>('/admin/checkin', {}),
  activeCheckin: () => api.get<any>('/admin/my-checkin'),
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
  getCheckins: (id: string, branchId?: string) => {
    const q = branchId ? `?branch_id=${branchId}` : '';
    return api.get<any[]>(`/admin/employees/${id}/checkins${q}`);
  }
};

