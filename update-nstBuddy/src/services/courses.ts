import axios from 'axios';

const API_URL = 'https://update-nstbuddy.onrender.com/api';

// Configure axios to send credentials (cookies) with requests
axios.defaults.withCredentials = true;

export const courseAPI = {
    // Get all courses
    getCourses: async (includeInactive = false) => {
        const response = await axios.get(`${API_URL}/courses`, {
            params: { includeInactive }
        });
        return response.data;
    },

    // Get single course
    getCourse: async (id: string) => {
        const response = await axios.get(`${API_URL}/courses/${id}`);
        return response.data;
    },

    // Create course (admin only)
    createCourse: async (courseData: any) => {
        const response = await axios.post(`${API_URL}/courses`, courseData);
        return response.data;
    },

    // Update course (admin only)
    updateCourse: async (id: string, courseData: any) => {
        const response = await axios.put(`${API_URL}/courses/${id}`, courseData);
        return response.data;
    },

    // Delete course (admin only)
    deleteCourse: async (id: string) => {
        const response = await axios.delete(`${API_URL}/courses/${id}`);
        return response.data;
    }
};
