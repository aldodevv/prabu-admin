const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://prabu-service.vercel.app/api';
    }
  }
  return 'http://localhost:8080/api';
};

const BASE_URL = getBaseUrl();

export interface ApiResponse<T> {
  success: boolean;
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
    }
    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Terjadi kesalahan pada server',
          message: data.message,
        };
      }
      return data;
    }
    
    if (!res.ok) {
      return {
        success: false,
        error: `HTTP Error ${res.status}: ${res.statusText}`,
      };
    }
    
    return { success: true };
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return this.handleResponse<T>(res);
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi gagal' };
    }
  }

  async post<T>(path: string, body: any): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
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
      const res = await fetch(`${BASE_URL}${path}`, {
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
      const res = await fetch(`${BASE_URL}${path}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return this.handleResponse<T>(res);
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi gagal' };
    }
  }
}

export const api = new ApiClient();
export default api;
