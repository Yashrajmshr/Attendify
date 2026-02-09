import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { LogOut, UserPlus, Users, Shield, LayoutDashboard, Edit, Trash2, X, Search } from 'lucide-react';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('create');
    const [users, setUsers] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
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
    const [searchTerm, setSearchTerm] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/admin/users');
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users', err);
            setError('Failed to fetch users');
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setMessage('');
        setError('');
        if (tab === 'users') {
            fetchUsers();
        } else if (tab === 'create') {
            resetForm();
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'student',
            rollNumber: '',
            department: '',
            section: ''
        });
        setIsEditing(false);
        setEditUserId(null);
    };

    const handleEdit = (userToEdit) => {
        setFormData({
            name: userToEdit.name,
            email: userToEdit.email,
            password: '', // Keep empty to not change
            role: userToEdit.role,
            rollNumber: userToEdit.rollNumber || '',
            department: userToEdit.department,
            section: userToEdit.section || ''
        });
        setEditUserId(userToEdit.id);
        setIsEditing(true);
        setActiveTab('create');
        setMessage('');
        setError('');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.delete(`/admin/delete-user/${id}`);
                setUsers(users.filter(u => u.id !== id));
                setMessage('User deleted successfully');
            } catch (err) {
                setError('Failed to delete user');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            if (isEditing) {
                const { data } = await api.put(`/admin/update-user/${editUserId}`, formData);
                setMessage(data.message || 'User updated successfully!');
                resetForm();
                setTimeout(() => {
                    handleTabChange('users');
                }, 1000); // Redirect to users list after 1 second
            } else {
                const { data } = await api.post('/admin/create-user', formData);
                setMessage(data.message || 'User created successfully!');
                setFormData({ ...formData, email: '', password: '', rollNumber: '' });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save user');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        onClick={() => handleTabChange('create')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'create' ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                    >
                        <UserPlus size={20} />
                        <span>{isEditing ? 'Edit User' : 'Create User'}</span>
                    </button>
                    <button
                        onClick={() => handleTabChange('users')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
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
                <div className="max-w-5xl mx-auto space-y-6">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                            {activeTab === 'create' ? (isEditing ? 'Edit User' : 'User Management') : 'All Users'}
                        </h2>
                        <p className="text-slate-500 mt-2">
                            {activeTab === 'create'
                                ? (isEditing ? 'Update user details.' : 'Create new accounts for Faculty and Students.')
                                : 'View and manage existing users.'}
                        </p>
                    </div>

                    {message && (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 flex items-center animate-fade-in">
                            <Shield size={20} className="mr-2" />
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 animate-fade-in">
                            {error}
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {activeTab === 'create' && (
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                            {isEditing ? <Edit size={24} /> : <UserPlus size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">{isEditing ? 'Edit User Details' : 'Add New User'}</h3>
                                            <p className="text-sm text-slate-500">{isEditing ? 'Modify user information below.' : 'Fill in the details to register a new user.'}</p>
                                        </div>
                                    </div>
                                    {isEditing && (
                                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                                            <X size={24} />
                                        </button>
                                    )}
                                </div>

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
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Password {isEditing && <span className="text-xs text-slate-400 font-normal">(Leave blank to keep current)</span>}</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required={!isEditing}
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
                                            {isEditing ? <Edit size={20} className="mr-2" /> : <UserPlus size={20} className="mr-2" />}
                                            {isEditing ? 'Update User' : 'Create Account'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="flex flex-col h-full">
                                {/* Search Bar */}
                                <div className="p-4 border-b border-slate-100 flex items-center">
                                    <div className="relative w-full md:w-96">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search size={18} className="text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs">
                                            <tr>
                                                <th className="px-6 py-4">Name</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">Department</th>
                                                <th className="px-6 py-4">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredUsers.length > 0 ? (
                                                filteredUsers.map((user) => (
                                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-slate-900">{user.name}</div>
                                                            <div className="text-xs text-slate-500">{user.email}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                                ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                                    user.role === 'faculty' ? 'bg-blue-100 text-blue-800' :
                                                                        'bg-green-100 text-green-800'}`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div>{user.department}</div>
                                                            {user.role === 'student' && <div className="text-xs text-slate-400">{user.rollNumber}</div>}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex space-x-3">
                                                                <button
                                                                    onClick={() => handleEdit(user)}
                                                                    className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(user.id)}
                                                                    className="text-red-500 hover:text-red-700 transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                                                        No users found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-3 z-50 safe-area-bottom">
                <button onClick={() => handleTabChange('create')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'create' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}>
                    <UserPlus size={20} />
                    <span className="text-xs mt-1 font-medium z-10">Create</span>
                </button>
                <button onClick={() => handleTabChange('users')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'users' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}>
                    <Users size={20} />
                    <span className="text-xs mt-1 font-medium z-10">Users</span>
                </button>
            </div>
        </div>
    );
};

export default AdminDashboard;
