import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { authApi } from '../services/api';
import { Lock, Mail, Key } from 'lucide-react';

const AdminLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [uniqueKey, setUniqueKey] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authApi.login(email, uniqueKey);

            if (response.success) {
                localStorage.setItem('adminToken', response.token);
                localStorage.setItem('adminData', JSON.stringify(response.admin));
                navigate('/admin/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-md mx-auto mt-12">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <div className="flex items-center justify-center mb-6">
                        <Lock className="w-12 h-12 text-purple-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Admin Login</h1>
                    <p className="text-center text-gray-600 mb-6">Enter your credentials to access the admin panel</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="uniqueKey" className="block text-sm font-medium text-gray-700 mb-1">
                                Unique Key
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="uniqueKey"
                                    type="password"
                                    value={uniqueKey}
                                    onChange={(e) => setUniqueKey(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter your unique key"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default AdminLogin;
