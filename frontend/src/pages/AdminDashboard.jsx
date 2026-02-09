import { useState } from 'react';
import api from '../api/axios';

const AdminDashboard = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student', // Default
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
            // Reset crucial fields
            setFormData({ ...formData, email: '', password: '', rollNumber: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <header className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
            </header>

            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-xl font-bold mb-6 text-slate-700">Create New User</h2>

                {message && (
                    <div className="bg-green-100 border border-green-200 text-green-700 p-4 rounded-xl mb-6">
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
                        <label className="block text-sm font-medium text-slate-600 mb-1">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                            className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                            className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                            className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                    className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Section</label>
                                <input
                                    type="text"
                                    name="section"
                                    value={formData.section}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </>
                    )}

                    <div className="md:col-span-2 mt-4">
                        <button
                            type="submit"
                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-md"
                        >
                            Create Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminDashboard;
