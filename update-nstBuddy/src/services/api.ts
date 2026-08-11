import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';


const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Enable credentials for session cookies
    timeout: 45000, // 45 seconds timeout for Render cold starts
});

// Add admin token to requests if available (skip if the caller already set an explicit Authorization header, e.g. a Firebase ID token)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Questions API
export const questionsApi = {
    getAll: async (params?: { campus?: string; semester?: number | string; subject?: string; topic?: string; search?: string; limit?: number }) => {
        const response = await api.get('/questions', { params });
        return response.data;
    },

    getFilters: async (params?: { campus?: string; semester?: number | string }) => {
        const response = await api.get('/questions/filters', { params });
        return response.data;
    },

    contribute: async (data: {
        campusSlug: string;
        semester: number | string;
        questionName: string;
        subject: string;
        topic: string;
        link: string;
    }, idToken: string) => {
        const response = await api.post('/questions/contribute', data, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    create: async (data: {
        questionName: string;
        subject: string;
        topic: string;
        link: string;
        semester?: number;
        campusSlug?: string;
    }, idToken: string) => {
        const response = await api.post('/questions', data, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    update: async (id: string, data: {
        questionName: string;
        subject: string;
        topic: string;
        link: string;
        semester?: number;
        campusSlug?: string;
    }, idToken: string) => {
        const response = await api.put(`/questions/${id}`, data, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    delete: async (id: string, idToken: string) => {
        const response = await api.delete(`/questions/${id}`, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },
};

// Campuses API
export const campusesApi = {
    getAll: async () => {
        const response = await api.get('/campuses');
        return response.data;
    },

    getSemesters: async (slug: string) => {
        const response = await api.get(`/campuses/${slug}/semesters`);
        return response.data;
    },
};

// Contributions API
export const contributionsApi = {
    getLeaderboard: async (limit?: number) => {
        const response = await api.get('/contributions/leaderboard', { params: { limit } });
        return response.data;
    },

    getMyStats: async (idToken: string) => {
        const response = await api.get('/contributions/my-stats', {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },
};

// Notices API
export const noticesApi = {
    getActive: async () => {
        const response = await api.get('/notices');
        return response.data;
    },

    getAll: async () => {
        const response = await api.get('/notices/all');
        return response.data;
    },

    create: async (data: {
        title: string;
        content: string;
        priority?: string;
        expiresAt?: string;
    }) => {
        const response = await api.post('/notices', data);
        return response.data;
    },

    update: async (id: string, data: {
        title: string;
        content: string;
        priority?: string;
        isActive?: boolean;
        expiresAt?: string;
    }) => {
        const response = await api.put(`/notices/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/notices/${id}`);
        return response.data;
    },
};

// Auth API
export const authApi = {
    login: async (email: string, uniqueKey: string) => {
        const response = await api.post('/auth/login', { email, uniqueKey });
        return response.data;
    },

    verify: async (token: string) => {
        const response = await api.post('/auth/verify', { token });
        return response.data;
    },

    setupAdmin: async (email: string, uniqueKey: string, name: string) => {
        const response = await api.post('/auth/setup-admin', { email, uniqueKey, name });
        return response.data;
    },

    getAdmins: async () => {
        const response = await api.get('/auth/admins');
        return response.data;
    },
};

export default api;
