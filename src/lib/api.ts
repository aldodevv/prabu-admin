import { translateRC } from './rcMapper';

export const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_DEV_API_URL || 'http://localhost:8080/api';
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return process.env.NEXT_PUBLIC_DEV_API_URL || 'http://localhost:8080/api';
    }
  }
  return process.env.NEXT_PUBLIC_PROD_API_URL || 'https://prabu-service.vercel.app/api';
};

export const formatPhotoUrl = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const baseUrl = getBaseUrl();

  if (trimmed.includes('r2.cloudflarestorage.com')) {
    const parts = trimmed.split('.r2.cloudflarestorage.com/');
    if (parts.length > 1) {
      let key = parts[1];
      key = key.replace(/^prabugym\//, '');
      return `${baseUrl}/public/assets/${key}`;
    }
  }
  if (trimmed.startsWith('http://localhost:8080/api') || trimmed.startsWith('http://127.0.0.1:8080/api')) {
    return trimmed.replace(/^http:\/\/(localhost|127\.0\.0\.1):8080\/api/, baseUrl);
  }
  if (trimmed.startsWith('/public/assets/') || trimmed.startsWith('public/assets/')) {
    const clean = trimmed.replace(/^\/?/, '');
    return `${baseUrl}/${clean}`;
  }
  return trimmed;
};

export interface ApiResponse<T> {
  success: boolean;
  rc?: string;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  rc?: string;
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

class ApiClient {
  private getHeaders(isMultipart = false): HeadersInit {
    const headers: Record<string, string> = {};
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('prabu_admin_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const branchID = localStorage.getItem('prabu_admin_branch_id');
      if (branchID) {
        headers['X-Branch-ID'] = branchID;
      }

      const isMainMode =
        localStorage.getItem('prabu_main_mode') === 'true' ||
        localStorage.getItem('prabu_prod_mode') === 'true' ||
        localStorage.getItem('prabu_pajak_mode') === 'true';
      if (isMainMode) {
        headers['X-DB-Mode'] = 'main';
      }
    }
    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        const mappedError = translateRC(data.rc, data.error || 'Terjadi kesalahan pada server');
        return {
          success: false,
          rc: data.rc,
          error: mappedError,
          message: data.message,
        };
      }
      return data;
    }

    if (!res.ok) {
      return {
        success: false,
        rc: 'SYS99',
        error: translateRC('SYS99', `HTTP Error ${res.status}: ${res.statusText}`),
      };
    }

    return { success: true, rc: '00' };
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${getBaseUrl()}${path}`, {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store',
      });
      return this.handleResponse<T>(res);
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi gagal' };
    }
  }

  async post<T>(path: string, body: any): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${getBaseUrl()}${path}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      return this.handleResponse<T>(res);
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi gagal' };
    }
  }

  async put<T>(path: string, body: any): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${getBaseUrl()}${path}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      return this.handleResponse<T>(res);
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi gagal' };
    }
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${getBaseUrl()}${path}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return this.handleResponse<T>(res);
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi gagal' };
    }
  }

  async uploadImage(formData: FormData): Promise<ApiResponse<{ url: string }>> {
    try {
      const res = await fetch(`${getBaseUrl()}/admin/upload`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: formData,
      });
      return this.handleResponse<{ url: string }>(res);
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi gagal' };
    }
  }
}

export const api = new ApiClient();
export default api;
