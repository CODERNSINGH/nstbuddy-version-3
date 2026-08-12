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

// Community API - Twitter-style posts, comments, likes
export interface CommunityAuthor {
    name: string;
    email: string;
    picture?: string | null;
}

export interface CommunityPost {
    id: string;
    content: string;
    images: string[];
    createdAt: string;
    updatedAt: string;
    author: CommunityAuthor;
    hashtags: string[];
    likeCount: number;
    commentCount: number;
    likedByMe: boolean;
    isMine: boolean;
}

export interface TrendingHashtag {
    tag: string;
    postCount: number;
}

export interface MyActivity {
    postCount: number;
    likeCount: number;
    commentCount: number;
    recent: Array<{
        type: 'like' | 'comment';
        createdAt: string;
        postId: string;
        postAuthor: string;
        snippet: string;
    }>;
}

export interface CommunityComment {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    postId: string;
    authorEmail: string;
    author: CommunityAuthor;
}

export interface CommunityPerson {
    name: string;
    email: string;
    picture?: string | null;
    postCount: number;
}

export interface GetPostsOptions {
    limit?: number;
    hashtag?: string;
    author?: string;
    search?: string;
    sort?: 'new' | 'top';
}

export const communityApi = {
    getPosts: async (idToken?: string, options: GetPostsOptions = {}) => {
        const response = await api.get('/community/posts', {
            params: options,
            headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
        });
        return response.data;
    },

    getPost: async (id: string, idToken?: string) => {
        const response = await api.get(`/community/posts/${id}`, {
            headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
        });
        return response.data;
    },

    searchPeople: async (q: string, limit?: number) => {
        const response = await api.get('/community/people/search', { params: { q, limit } });
        return response.data;
    },

    getTrendingHashtags: async (limit?: number) => {
        const response = await api.get('/community/hashtags/trending', { params: { limit } });
        return response.data;
    },

    getMyActivity: async (idToken: string) => {
        const response = await api.get('/community/my-activity', {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    createPost: async (content: string, idToken: string, images: string[] = []) => {
        const response = await api.post('/community/posts', { content, images }, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    updatePost: async (id: string, content: string, idToken: string, images: string[] = []) => {
        const response = await api.put(`/community/posts/${id}`, { content, images }, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    deletePost: async (id: string, idToken: string) => {
        const response = await api.delete(`/community/posts/${id}`, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    toggleLike: async (id: string, idToken: string) => {
        const response = await api.post(`/community/posts/${id}/like`, {}, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    getComments: async (postId: string) => {
        const response = await api.get(`/community/posts/${postId}/comments`);
        return response.data;
    },

    addComment: async (postId: string, content: string, idToken: string) => {
        const response = await api.post(`/community/posts/${postId}/comments`, { content }, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    updateComment: async (commentId: string, content: string, idToken: string) => {
        const response = await api.put(`/community/comments/${commentId}`, { content }, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    deleteComment: async (commentId: string, idToken: string) => {
        const response = await api.delete(`/community/comments/${commentId}`, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },
};

// Groups API - bounded-capacity groups (e.g. hackathon teams) with contact-info sharing
export type ContactMethod = 'phone' | 'whatsapp' | 'email';

export interface GroupSummary {
    id: string;
    name: string;
    description: string;
    category: string | null;
    capacity: number;
    memberCount: number;
    isFull: boolean;
    isActive: boolean;
    creator: CommunityAuthor;
    isMine: boolean;
    isMember: boolean;
    createdAt: string;
}

export interface GroupMemberInfo {
    id: string;
    name: string;
    email: string;
    picture?: string | null;
    role: 'admin' | 'member';
    joinedAt: string;
    contact: { method: ContactMethod; value: string } | null;
}

export interface GroupDetail extends GroupSummary {
    members: GroupMemberInfo[];
}

export const groupsApi = {
    getAll: async (idToken?: string, params: { search?: string; category?: string; limit?: number } = {}) => {
        const response = await api.get('/groups', {
            params,
            headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
        });
        return response.data;
    },

    getMy: async (idToken: string) => {
        const response = await api.get('/groups/my', {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    getById: async (id: string, idToken?: string) => {
        const response = await api.get(`/groups/${id}`, {
            headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
        });
        return response.data;
    },

    create: async (
        data: { name: string; description: string; category?: string; capacity: number; contactMethod: ContactMethod; contactValue: string },
        idToken: string
    ) => {
        const response = await api.post('/groups', data, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    update: async (
        id: string,
        data: { name: string; description: string; category?: string; capacity: number; isActive: boolean },
        idToken: string
    ) => {
        const response = await api.put(`/groups/${id}`, data, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    remove: async (id: string, idToken: string) => {
        const response = await api.delete(`/groups/${id}`, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    join: async (id: string, data: { contactMethod: ContactMethod; contactValue: string }, idToken: string) => {
        const response = await api.post(`/groups/${id}/join`, data, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    leave: async (id: string, idToken: string) => {
        const response = await api.post(`/groups/${id}/leave`, {}, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        return response.data;
    },

    removeMember: async (id: string, memberId: string, idToken: string) => {
        const response = await api.delete(`/groups/${id}/members/${memberId}`, {
            headers: { Authorization: `Bearer ${idToken}` },
        });
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
