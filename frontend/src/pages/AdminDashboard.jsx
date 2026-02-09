import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { LogOut, UserPlus, Users, Shield, LayoutDashboard } from 'lucide-react';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('create');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student',
        rollNumber: '',
        department: '',
        section: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const { data } = await api.post('/admin/create-user', formData);
            setMessage(data.message || 'User created successfully!');
            setFormData({ ...formData, email: '', password: '', rollNumber: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shadow-sm">
                <div className="p-6 border-b border-slate-100">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Attendify
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Admin Portal</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'create' ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                    >
                        <UserPlus size={20} />
                        <span>Create User</span>
                    </button>
                    {/* Placeholder for future features */}
                    <button
                        disabled
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 cursor-not-allowed"
                    >
                        <Users size={20} />
                        <span>Manage Users</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center space-x-3 px-4 py-3 mb-2 bg-slate-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{user?.name || 'Admin'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200 z-50 px-4 py-3 flex justify-between items-center shadow-sm">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Attendify Admin</span>
                <button onClick={logout} className="text-slate-500 hover:text-red-500">
                    <LogOut size={24} />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto md:p-8 p-4 pt-20 md:pt-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                            {activeTab === 'create' && 'User Management'}
                        </h2>
                        <p className="text-slate-500 mt-2">
                            {activeTab === 'create' && 'Create new accounts for Faculty and Students.'}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {activeTab === 'create' && (
                            <div className="p-8">
                                <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-slate-100">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                        <UserPlus size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">Add New User</h3>
                                        <p className="text-sm text-slate-500">Fill in the details to register a new user.</p>
                                    </div>
                                </div>

                                {message && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 flex items-center">
                                        <Shield size={20} className="mr-2" />
                                        {message}
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Account Role</label>
                                        <div className="grid grid-cols-3 gap-4">
                                            {['student', 'faculty', 'admin'].map((role) => (
                                                <label key={role} className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center transition-all ${formData.role === role ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-indigo-200 text-slate-600'}`}>
                                                    <input
                                                        type="radio"
                                                        name="role"
                                                        value={role}
                                                        checked={formData.role === role}
                                                        onChange={handleChange}
                                                        className="hidden"
                                                    />
                                                    <span className="capitalize font-bold">{role}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                            placeholder="john@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Department</label>
                                        <input
                                            type="text"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                            placeholder="Computer Science"
                                        />
                                    </div>

                                    {formData.role === 'student' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 mb-1">Roll Number</label>
                                                <input
                                                    type="text"
                                                    name="rollNumber"
                                                    value={formData.rollNumber}
                                                    onChange={handleChange}
                                                    required={formData.role === 'student'}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                    placeholder="CS-2023-001"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 mb-1">Section</label>
                                                <input
                                                    type="text"
                                                    name="section"
                                                    value={formData.section}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                    placeholder="A"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="md:col-span-2 mt-6 pt-6 border-t border-slate-100 flex justify-end">
                                        <button
                                            type="submit"
                                            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg hover:shadow-indigo-500/30 flex items-center"
                                        >
                                            <UserPlus size={20} className="mr-2" />
                                            Create Account
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-3 z-50 safe-area-bottom">
                <button onClick={() => setActiveTab('create')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'create' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}>
                    <UserPlus size={20} />
                    <span className="text-xs mt-1 font-medium">Create</span>
                </button>
                <button disabled className={`flex flex-col items-center p-2 rounded-lg text-slate-300`}>
                    <Users size={20} />
                    <span className="text-xs mt-1 font-medium">Users</span>
                </button>
            </div>
        </div>
    );
};
