import api from './api';

export const authAPI = {
    // Verify Firebase ID token with backend
    verifyToken: async (idToken: string) => {
        const response = await api.post('/auth/verify-token', { idToken });
        return response.data;
    },

    // Logout user
    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },

    // Record that the current user clicked "I Understand" on the academic-integrity disclaimer
    acknowledgeDisclaimer: async (idToken: string) => {
        const response = await api.post('/auth/acknowledge-disclaimer', {}, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    }
};

export const userAPI = {
    // Get all users (admin only)
    getUsers: async () => {
        const response = await api.get('/auth/users');
        return response.data;
    },

    // Update user Pro status (admin only)
    updateProStatus: async (userId: string, isPro: boolean) => {
        const response = await api.patch(`/auth/users/${userId}/pro`, { isPro });
        return response.data;
    },

    // Update user Admin status (admin only)
    updateAdminStatus: async (userId: string, isAdmin: boolean) => {
        const response = await api.patch(`/auth/users/${userId}/admin`, { isAdmin });
        return response.data;
    }
};
