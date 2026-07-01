import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { LogOut, UserPlus, Users, Shield, LayoutDashboard, Edit, Trash2, X, Search, BookOpen, Layers, Upload, FileSpreadsheet, Lock, ArrowRight, CheckSquare, ChevronDown, ShieldAlert, RefreshCw, TrendingUp, Calendar } from 'lucide-react';
import SubjectManagement from '../components/SubjectManagement';

import SectionManagement from '../components/SectionManagement';
import AdminAttendanceDashboard from '../components/AdminAttendanceDashboard';
import DefaultersList from '../components/DefaultersList';
import LeaveApprovals from '../components/LeaveApprovals';
import ThemeToggle from '../components/ThemeToggle';



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
        program: '',
        year: '',
        semester: '',
        section: '',
        group: '',
        adminType: 'super',
        assignedDepartment: '',
        subject: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    // Bulk Upload State
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const [sectionsData, setSectionsData] = useState([]);
    const [subjectsData, setSubjectsData] = useState([]);

    // Hierarchy Options
    const [departments, setDepartments] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [years, setYears] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [sectionsOnly, setSectionsOnly] = useState([]);
    const [availableSubjects, setAvailableSubjects] = useState([]);

    // Manage Users Filters & State
    const [manageRoleTab, setManageRoleTab] = useState('student');

    // Filter Lists (Derived from sectionsData for Filters)
    const [filterPrograms, setFilterPrograms] = useState([]);
    const [filterYears, setFilterYears] = useState([]);
    const [filterSemesters, setFilterSemesters] = useState([]);
    const [filterSections, setFilterSections] = useState([]);

    // Selected Filters
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedProg, setSelectedProg] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSem, setSelectedSem] = useState('');
    const [selectedSec, setSelectedSec] = useState('');

    // Bulk Actions State
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    // Logs
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [selectedLogs, setSelectedLogs] = useState(new Set());
    const [newPassword, setNewPassword] = useState('');
    const [transferData, setTransferData] = useState({
        department: '',
        program: '',
        year: '',
        semester: '',
        section: '',
        group: ''
    });

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'logs') {
            fetchLogs();
        }
        fetchSectionsData();
        fetchSubjectsData();
    }, [activeTab]);

    const fetchSectionsData = async () => {
        try {
            const { data } = await api.get('/sections');
            setSectionsData(data);
            const depts = [...new Set(data.map(s => s.department).filter(Boolean))].sort();
            setDepartments(depts);
        } catch (err) {
            console.error('Failed to fetch sections data', err);
        }
    };

    const fetchSubjectsData = async () => {
        try {
            const { data } = await api.get('/subjects');
            setSubjectsData(data);
        } catch (err) {
            console.error('Failed to fetch subjects data', err);
        }
    };

    // Dependent Dropdown Logic
    useEffect(() => {
        if (formData.department) {
            const progs = [...new Set(sectionsData
                .filter(s => s.department === formData.department)
                .map(s => s.program).filter(Boolean))].sort();
            setPrograms(progs);
        } else {
            setPrograms([]);
        }
    }, [formData.department, sectionsData]);

    useEffect(() => {
        if (formData.department && formData.program) {
            const yrs = [...new Set(sectionsData
                .filter(s => s.department === formData.department && s.program === formData.program)
                .map(s => s.year).filter(Boolean))].sort();
            setYears(yrs);
        } else {
            setYears([]);
        }
    }, [formData.program, formData.department, sectionsData]);

    useEffect(() => {
        if (formData.department && formData.program && formData.year) {
            const sems = [...new Set(sectionsData
                .filter(s => s.department === formData.department && s.program === formData.program && s.year === formData.year)
                .map(s => s.semester).filter(Boolean))].sort();
            setSemesters(sems);
        } else {
            setSemesters([]);
        }
    }, [formData.year, formData.program, formData.department, sectionsData]);

    useEffect(() => {
        // Sections depend on everything for students
        if (formData.department && formData.program && formData.year && formData.semester) {
            const secs = [...new Set(sectionsData
                .filter(s => s.department === formData.department &&
                    s.program === formData.program &&
                    s.year === formData.year &&
                    s.semester === formData.semester)
                .map(s => s.name).filter(Boolean))].sort();
            setSectionsOnly(secs);
        } else {
            setSectionsOnly([]);
        }
    }, [formData.semester, formData.year, formData.program, formData.department, sectionsData]);

    // Faculty: Filter subjects based on department and program
    useEffect(() => {
        if (formData.role === 'faculty' && formData.department && formData.program) {
            const filteredSubjects = subjectsData.filter(subject =>
                subject.department === formData.department &&
                subject.program === formData.program
            );
            setAvailableSubjects(filteredSubjects);
        } else {
            setAvailableSubjects([]);
        }
    }, [formData.role, formData.department, formData.program, subjectsData]);



    // --- Create User Dependent Dropdowns (Already implemented above) ---
    // (Kept previous effects for formData...)

    // --- Manage Users Cascading Filters ---
    useEffect(() => {
        if (selectedDept) {
            const progs = [...new Set(sectionsData
                .filter(s => s.department === selectedDept)
                .map(s => s.program).filter(Boolean))].sort();
            setFilterPrograms(progs);
        } else {
            setFilterPrograms([]);
        }
        setSelectedProg('');
        setSelectedYear('');
        setSelectedSem('');
        setSelectedSec('');
    }, [selectedDept, sectionsData]);

    useEffect(() => {
        if (selectedDept && selectedProg) {
            // For Faculty, we stop here. For Students, we continue.
            const yrs = [...new Set(sectionsData
                .filter(s => s.department === selectedDept && s.program === selectedProg)
                .map(s => s.year).filter(Boolean))].sort();
            setFilterYears(yrs);
        } else {
            setFilterYears([]);
        }
        setSelectedYear('');
        setSelectedSem('');
        setSelectedSec('');
    }, [selectedProg, selectedDept, sectionsData]);

    useEffect(() => {
        if (selectedDept && selectedProg && selectedYear) {
            const sems = [...new Set(sectionsData
                .filter(s => s.department === selectedDept && s.program === selectedProg && s.year === selectedYear)
                .map(s => s.semester).filter(Boolean))].sort();
            setFilterSemesters(sems);
        } else {
            setFilterSemesters([]);
        }
        setSelectedSem('');
        setSelectedSec('');
    }, [selectedYear, selectedProg, selectedDept, sectionsData]);

    useEffect(() => {
        if (selectedDept && selectedProg && selectedYear && selectedSem) {
            const secs = [...new Set(sectionsData
                .filter(s => s.department === selectedDept &&
                    s.program === selectedProg &&
                    s.year === selectedYear &&
                    s.semester === selectedSem)
                .map(s => s.name).filter(Boolean))].sort();
            setFilterSections(secs);
        } else {
            setFilterSections([]);
        }
        setSelectedSec('');
    }, [selectedSem, selectedYear, selectedProg, selectedDept, sectionsData]);


    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/admin/users');
            setUsers(data);
        } catch (err) {
            setError('Failed to fetch users');
        }
    };

    const fetchLogs = async () => {
        try {
            setLogsLoading(true);
            const { data } = await api.get('/admin/logs');
            setLogs(data);
            setLogsLoading(false);
        } catch (err) {
            setLogsLoading(false);
        }
    };

    const handleSelectAllLogs = (e) => {
        if (e.target.checked) {
            const allIds = new Set(logs.map(log => log.id));
            setSelectedLogs(allIds);
        } else {
            setSelectedLogs(new Set());
        }
    };

    const handleSelectLog = (id) => {
        const newSelected = new Set(selectedLogs);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedLogs(newSelected);
    };

    const handleDeleteLog = async (id) => {
        if (window.confirm('Delete this log entry?')) {
            try {
                await api.delete(`/admin/logs/${id}`);
                setLogs(logs.filter(l => l.id !== id));
                setSelectedLogs(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(id);
                    return newSet;
                });
                setMessage('Log deleted successfully');
            } catch (err) {
                setError('Failed to delete log');
            }
        }
    };

    const handleBulkDeleteLogs = async () => {
        if (window.confirm(`Delete ${selectedLogs.size} logs? This cannot be undone.`)) {
            try {
                const logIds = Array.from(selectedLogs);
                await api.post('/admin/logs/delete', { logIds });
                setLogs(logs.filter(l => !selectedLogs.has(l.id)));
                setSelectedLogs(new Set());
                setMessage('Selected logs deleted successfully');
            } catch (err) {
                setError('Failed to delete logs');
            }
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
            program: '',
            year: '',
            semester: '',
            section: '',
            group: '',
            adminType: 'super',
            assignedDepartment: '',
            subject: ''
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
            department: userToEdit.department || '',
            program: userToEdit.program || '',
            year: userToEdit.year || '',
            semester: userToEdit.semester || '',
            section: userToEdit.section || '',
            group: userToEdit.group || '',
            adminType: userToEdit.adminType || 'super',
            assignedDepartment: userToEdit.assignedDepartment || '',
            subject: userToEdit.subject || ''
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
                setRefreshKey(prev => prev + 1); // Refresh attendance data
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
                setRefreshKey(prev => prev + 1); // Refresh attendance data
                await fetchUsers(); // Refresh users list to show updated data
                resetForm();
                setTimeout(() => {
                    handleTabChange('users');
                }, 1000); // Redirect to users list after 1 second
            } else {
                const { data } = await api.post('/admin/create-user', formData);
                setMessage(data.message || 'User created successfully!');
                setRefreshKey(prev => prev + 1); // Refresh attendance data
                await fetchUsers(); // Refresh users list
                setFormData({ ...formData, email: '', password: '', rollNumber: '' });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save user');
        }
    };

    // --- Bulk Upload Handlers ---
    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get(`/admin/template?role=${formData.role}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${formData.role}_template.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error(err);
            setError('Failed to download template');
        }
    };

    const handleBulkUploadUsers = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('role', formData.role);

        try {
            setUploading(true);
            setMessage('');
            setError('');
            const { data } = await api.post('/admin/upload-users', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage(`Upload Complete: ${data.summary.successful_inserts} created, ${data.summary.failed_rows.length} failed.`);
            setRefreshKey(prev => prev + 1); // Refresh attendance data
            if (data.summary.failed_rows.length > 0) {
                console.table(data.summary.failed_rows);
                setError('Some rows failed. Check console for details.');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to upload users');
        } finally {
            setUploading(false);
            e.target.value = null; // Reset input
        }
    };

    // --- Bulk Action Handlers ---
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = new Set(filteredUsers.map(u => u.id));
            setSelectedUsers(allIds);
        } else {
            setSelectedUsers(new Set());
        }
    };

    const handleSelectUser = (id) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedUsers(newSelected);
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedUsers.size} users? This cannot be undone.`)) {
            try {
                const userIds = Array.from(selectedUsers);
                await api.post('/admin/delete-users', { userIds });
                setUsers(users.filter(u => !selectedUsers.has(u.id)));
                setSelectedUsers(new Set());
                setMessage('Selected users deleted successfully');
            } catch (err) {
                console.error(err);
                setError('Failed to delete users');
            }
        }
    };

    const handleBulkTransfer = async () => {
        try {
            const userIds = Array.from(selectedUsers);
            // Filter out empty fields from transferData
            const updates = Object.fromEntries(
                Object.entries(transferData).filter(([_, v]) => v !== '')
            );

            if (Object.keys(updates).length === 0) {
                setError('Please select at least one field to update');
                return;
            }

            await api.post('/admin/transfer-users', { userIds, updates });
            // Refresh users
            fetchUsers();
            setShowTransferModal(false);
            setSelectedUsers(new Set());
            setTransferData({
                department: '',
                program: '',
                year: '',
                semester: '',
                section: '',
                group: ''
            });
            setMessage('Users transferred successfully');
        } catch (err) {
            console.error(err);
            setError('Failed to transfer users');
        }
    };

    const handleBulkPasswordReset = async () => {
        try {
            const userIds = Array.from(selectedUsers);
            await api.post('/admin/reset-passwords', { userIds, newPassword });
            setShowResetModal(false);
            setNewPassword('');
            setSelectedUsers(new Set());
            setMessage('Passwords reset successfully');
        } catch (err) {
            console.error(err);
            setError('Failed to reset passwords');
        }
    };

    const handleExportUsers = async () => {
        try {
            // Build query params based on filters
            const params = new URLSearchParams();
            if (manageRoleTab !== 'admin') params.append('role', manageRoleTab);
            if (selectedDept) params.append('department', selectedDept);
            if (selectedProg) params.append('program', selectedProg);
            if (selectedYear) params.append('year', selectedYear);
            if (selectedSem) params.append('semester', selectedSem);
            if (selectedSec) params.append('section', selectedSec);

            // If users are selected, we might want to only export them? 
            // The backend export currently exports based on filters. 
            // Let's stick to helpful "Export Filtered/All" for now as per plan, 
            // or if we want exact selection export we'd need to send IDs.
            // Let's append IDs if any selected.
            // NOTE: GET request with body is not standard/allowed in some places. 
            // GET with thousands of IDs in query param is also bad.
            // For now, let's just export based on current View Filters as it's cleaner.

            const response = await api.get(`/admin/export-users?${params.toString()}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'users_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error(err);
            setError('Failed to export users');
        }
    };

    const handleTransferDataChange = (e) => {
        setTransferData({ ...transferData, [e.target.name]: e.target.value });
    };

    const filteredUsers = users.filter(u => {
        // 1. Role Filter
        if (u.role !== manageRoleTab) return false;

        // 2. Search Filter
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.rollNumber && u.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        // 3. Hierarchy Filters
        if (manageRoleTab === 'admin') return true;

        if (selectedDept && u.department !== selectedDept) return false;
        if (selectedProg && u.program !== selectedProg) return false;

        if (manageRoleTab === 'student') {
            if (selectedYear && u.year !== selectedYear) return false;
            if (selectedSem && u.semester !== selectedSem) return false;
            if (selectedSec && u.section !== selectedSec) return false;
        }

        return true;
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-hidden">
            {/* Sidebar */}
            <div className="w-[300px] premium-sidebar hidden md:flex flex-col z-30 m-6 rounded-[2rem] shadow-premium-card border border-slate-200/50 dark:border-white/5">
                <div className="p-10">
                    <div className="flex items-center space-x-4 group cursor-pointer">
                        <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center text-white shadow-active-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                            <Shield size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
                                Attendify
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 mt-1">Admin Pro</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <div className="px-4 mb-4 mt-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Core Management</span>
                    </div>
                    {[
                        { id: 'create', icon: UserPlus, label: isEditing ? 'Edit Profile' : 'New Account' },
                        { id: 'users', icon: Users, label: 'User Directory' },
                        { id: 'subjects', icon: BookOpen, label: 'Academic Registry' },
                        { id: 'departments', icon: Layers, label: 'Organization' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id)}
                            className={`nav-item w-full group ${activeTab === item.id ? 'nav-item-active' : 'nav-item-inactive'}`}
                        >
                            <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className={activeTab === item.id ? 'text-white' : 'group-hover:text-primary-500 transition-colors'} />
                            <span className="text-sm font-bold tracking-tight">{item.label}</span>
                            {activeTab === item.id && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                        </button>
                    ))}

                    <div className="px-4 mt-8 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">System Analytics</span>
                    </div>
                    {[
                        { id: 'attendance', icon: TrendingUp, label: 'Live Insights' },
                        { id: 'leaves', icon: Calendar, label: 'Leave Requests' },
                        { id: 'defaulters', icon: ShieldAlert, label: 'Defaulters' },
                        { id: 'logs', icon: ShieldAlert, label: 'Security Audit' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id)}
                            className={`nav-item w-full group ${activeTab === item.id ? 'nav-item-active' : 'nav-item-inactive'}`}
                        >
                            <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className={activeTab === item.id ? 'text-white' : 'group-hover:text-primary-500 transition-colors'} />
                            <span className="text-sm font-bold tracking-tight">{item.label}</span>
                            {activeTab === item.id && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                        </button>
                    ))}
                </nav>

                <div className="p-6 m-6 mt-auto bg-slate-100/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/50 dark:border-white/5 backdrop-blur-md">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center text-white text-lg font-black shadow-active-primary">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">{user?.name || 'Administrator'}</p>
                            <div className="flex items-center text-[10px] text-primary-500 font-bold uppercase tracking-wider">
                                <Shield size={10} className="mr-1" />
                                {user?.role || 'Super Admin'}
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-500/20 active:scale-95 transition-all text-sm font-black tracking-tight"
                    >
                        <LogOut size={18} strokeWidth={2.5} />
                        <span>Terminate Session</span>
                    </button>
                </div>
            </div>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 w-full glass-effect z-50 px-6 py-4 flex justify-between items-center shadow-lg border-b border-white/10">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center text-white">
                        <Shield size={18} />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Attendify</span>
                </div>
                <div className="flex items-center space-x-4">
                    <ThemeToggle />
                    <button onClick={logout} className="text-rose-500 p-2.5 bg-rose-50 dark:bg-rose-500/10 rounded-xl active:scale-95 transition-all">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto md:p-14 p-6 pt-28 md:pt-14 custom-scrollbar">
                <div className="max-w-7xl mx-auto space-y-12 animate-fade-in">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-primary-500/5 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-primary-500/10">
                                <Shield size={14} strokeWidth={2.5} />
                                <span>Administrative Intelligence</span>
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                {activeTab === 'create' ? (isEditing ? 'Modify Profile' : 'Account Architect') :
                                    activeTab === 'attendance' ? 'Live Analytics' :
                                        activeTab === 'leaves' ? 'Leave Requests' :
                                            activeTab === 'defaulters' ? 'Defaulters List' :
                                                activeTab === 'logs' ? 'System Integrity' :
                                                    activeTab === 'subjects' ? 'Academic Registry' : 'Resource Directory'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-2 rounded-[2rem] border border-slate-200/50 dark:border-white/5 backdrop-blur-sm">
                            {/* Potential global actions or stats could go here */}
                        </div>
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

                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        {activeTab === 'leaves' && (
                            <div className="p-6">
                                <LeaveApprovals />
                            </div>
                        )}
                        {activeTab === 'defaulters' && (
                            <div className="p-6">
                                <DefaultersList />
                            </div>
                        )}
                        {activeTab === 'logs' && (
                            <div className="p-0">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">System Audit Logs</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">View security events and system activities.</p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {selectedLogs.size > 0 && (
                                            <button
                                                onClick={handleBulkDeleteLogs}
                                                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center"
                                            >
                                                <Trash2 size={16} className="mr-2" />
                                                Delete ({selectedLogs.size})
                                            </button>
                                        )}
                                        <button onClick={fetchLogs} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100" title="Refresh Logs">
                                            <RefreshCw size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase font-semibold text-xs border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-4 w-10">
                                                    <input
                                                        type="checkbox"
                                                        onChange={handleSelectAllLogs}
                                                        checked={logs.length > 0 && selectedLogs.size === logs.length}
                                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </th>
                                                <th className="px-6 py-4 whitespace-nowrap">Timestamp</th>
                                                <th className="px-6 py-4 whitespace-nowrap">Action</th>
                                                <th className="px-6 py-4 whitespace-nowrap">User</th>
                                                <th className="px-6 py-4 whitespace-nowrap">Role</th>
                                                <th className="px-6 py-4 whitespace-nowrap">Details</th>
                                                <th className="px-6 py-4 whitespace-nowrap">IP</th>
                                                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                                <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {logsLoading ? (
                                                <tr><td colSpan="9" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">Loading logs...</td></tr>
                                            ) : logs.length > 0 ? (
                                                logs.map(log => (
                                                    <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${selectedLogs.has(log.id) ? 'bg-indigo-50/30' : ''}`}>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedLogs.has(log.id)}
                                                                onChange={() => handleSelectLog(log.id)}
                                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{log.action}</td>
                                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{log.userId}</td>
                                                        <td className="px-6 py-4 uppercase text-xs tracking-wider font-semibold text-slate-500">{log.userRole}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="max-w-xs overflow-hidden text-ellipsis text-xs font-mono bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                                                                {JSON.stringify(log.details)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-mono text-slate-500">{log.ip}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${log.status === 'SUCCESS' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                                                }`}>
                                                                {log.status === 'SUCCESS' ? <CheckSquare size={10} className="mr-1" /> : <ShieldAlert size={10} className="mr-1" />}
                                                                {log.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => handleDeleteLog(log.id)}
                                                                className="text-slate-400 hover:text-red-600 transition-colors bg-white hover:bg-red-50 p-1.5 rounded-lg border border-transparent hover:border-red-100"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan="9" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">No activity logs found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {activeTab === 'attendance' && (
                            <AdminAttendanceDashboard
                                key={`attendance-${refreshKey}`}
                                departments={departments}
                                sectionsData={sectionsData}
                            />
                        )}
                        {activeTab === 'create' && (
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                            {isEditing ? <Edit size={24} /> : <UserPlus size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{isEditing ? 'Edit User Details' : 'Add New User'}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{isEditing ? 'Modify user information below.' : 'Fill in the details to register a new user.'}</p>
                                        </div>
                                    </div>
                                    {isEditing && (
                                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                                            <X size={24} />
                                        </button>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <div className="flex space-x-4 border-b border-slate-200">
                                        {['student', 'faculty', 'admin'].map((role) => (
                                            <button
                                                key={role}
                                                onClick={() => setFormData({ ...formData, role })}
                                                className={`pb-2 px-4 text-sm font-semibold capitalize transition-colors border-b-2 ${formData.role === role ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Admin Type Selection */}
                                {formData.role === 'admin' && (
                                    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                                        <h4 className="text-sm font-bold text-purple-900 mb-3">Admin Type</h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { value: 'super', label: 'Super Admin', desc: 'Full access' },
                                                { value: 'department', label: 'Department Admin', desc: 'Department only' },
                                                { value: 'readonly', label: 'Read-only Admin', desc: 'View only' }
                                            ].map((type) => (
                                                <button
                                                    key={type.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, adminType: type.value })}
                                                    className={`p-3 rounded-lg border-2 transition-all text-left ${formData.adminType === type.value
                                                        ? 'border-purple-600 bg-purple-100 shadow-sm'
                                                        : 'border-slate-200 bg-white hover:border-purple-300'
                                                        }`}
                                                >
                                                    <div className="font-semibold text-sm text-slate-800 dark:text-white">{type.label}</div>
                                                    <div className="text-xs text-slate-500 mt-1">{type.desc}</div>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Department Assignment for Department Admin */}
                                        {formData.adminType === 'department' && (
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assigned Department *</label>
                                                <select
                                                    name="assignedDepartment"
                                                    value={formData.assignedDepartment}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                                                >
                                                    <option value="">Select Department</option>
                                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}



                                {/* Bulk Upload Section */}
                                {!isEditing && (
                                    <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                        <h4 className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                                            <Upload size={16} className="mr-2" />
                                            Bulk Upload {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}s
                                        </h4>
                                        <p className="text-xs text-slate-500 mb-4">
                                            Download the template, fill it with {formData.role} details, and upload it to create multiple accounts at once.
                                        </p>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={handleDownloadTemplate}
                                                className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center shadow-sm border border-slate-200 dark:border-slate-700"
                                            >
                                                <FileSpreadsheet size={16} className="mr-2 text-green-600" />
                                                Download {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} Template
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleBulkUploadUsers}
                                                accept=".csv, .xlsx"
                                                className="hidden"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current.click()}
                                                disabled={uploading}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center shadow-sm disabled:opacity-50"
                                            >
                                                <Upload size={16} className="mr-2" />
                                                {uploading ? 'Uploading...' : 'Upload File'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Common Fields */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
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
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
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
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password {isEditing && <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">(Leave blank to keep current)</span>}</label>
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

                                    {/* Role Specific Fields */}

                                    {/* STUDENT & FACULTY: Department */}
                                    {(formData.role === 'student' || formData.role === 'faculty') && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                                            <select
                                                name="department"
                                                value={formData.department}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                            >
                                                <option value="">Select Department</option>
                                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {/* STUDENT & FACULTY: Program */}
                                    {(formData.role === 'student' || formData.role === 'faculty') && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Program</label>
                                            <select
                                                name="program"
                                                value={formData.program}
                                                onChange={handleChange}
                                                disabled={!formData.department}
                                                required={formData.department}
                                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none disabled:bg-slate-100"
                                            >
                                                <option value="">Select Program</option>
                                                {programs.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {/* FACULTY ONLY: Subject */}
                                    {formData.role === 'faculty' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                                            <select
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                disabled={!formData.program}
                                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none disabled:bg-slate-100"
                                            >
                                                <option value="">Select Subject</option>
                                                {availableSubjects.map(subject => (
                                                    <option key={subject.id} value={subject.id}>
                                                        {subject.name} ({subject.code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* FACULTY ONLY: Year, Semester, Section */}
                                    {formData.role === 'faculty' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Year</label>
                                                <select
                                                    name="year"
                                                    value={formData.year}
                                                    onChange={handleChange}
                                                    disabled={!formData.program}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none disabled:bg-slate-100"
                                                >
                                                    <option value="">Select Year</option>
                                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Semester</label>
                                                <select
                                                    name="semester"
                                                    value={formData.semester}
                                                    onChange={handleChange}
                                                    disabled={!formData.year}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none disabled:bg-slate-100"
                                                >
                                                    <option value="">Select Semester</option>
                                                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Section</label>
                                                <select
                                                    name="section"
                                                    value={formData.section}
                                                    onChange={handleChange}
                                                    disabled={!formData.semester}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none disabled:bg-slate-100"
                                                >
                                                    <option value="">Select Section</option>
                                                    {sectionsOnly.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {/* STUDENT ONLY: Year, Semester, Section, Roll Number */}
                                    {formData.role === 'student' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Year</label>
                                                <select
                                                    name="year"
                                                    value={formData.year}
                                                    onChange={handleChange}
                                                    disabled={!formData.program}
                                                    required={formData.program}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none disabled:bg-slate-100"
                                                >
                                                    <option value="">Select Year</option>
                                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Semester</label>
                                                <select
                                                    name="semester"
                                                    value={formData.semester}
                                                    onChange={handleChange}
                                                    disabled={!formData.year}
                                                    required={formData.year}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none disabled:bg-slate-100"
                                                >
                                                    <option value="">Select Semester</option>
                                                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Section</label>
                                                <select
                                                    name="section"
                                                    value={formData.section}
                                                    onChange={handleChange}
                                                    disabled={!formData.semester}
                                                    required={formData.semester}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none disabled:bg-slate-100"
                                                >
                                                    <option value="">Select Section</option>
                                                    {sectionsOnly.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Roll Number</label>
                                                <input
                                                    type="text"
                                                    name="rollNumber"
                                                    value={formData.rollNumber}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                    placeholder="CS-2023-001"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group</label>
                                                <input
                                                    type="text"
                                                    name="group"
                                                    value={formData.group}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                    placeholder="e.g. A, B, 1, 2"
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
                                {/* Bulk Actions Bar */}
                                {selectedUsers.size > 0 && (
                                    <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between animate-fade-in">
                                        <div className="flex items-center space-x-4">
                                            <span className="font-bold text-indigo-700">{selectedUsers.size} Selected</span>
                                            <div className="h-6 w-px bg-indigo-200"></div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={handleBulkDelete}
                                                    className="flex items-center px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                                                >
                                                    <Trash2 size={16} className="mr-2" />
                                                    Delete
                                                </button>
                                                <button
                                                    onClick={() => setShowTransferModal(true)}
                                                    className="flex items-center px-3 py-1.5 bg-white text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-50 transition"
                                                >
                                                    <ArrowRight size={16} className="mr-2" />
                                                    Transfer
                                                </button>
                                                <button
                                                    onClick={() => setShowResetModal(true)}
                                                    className="flex items-center px-3 py-1.5 bg-white text-orange-700 border border-orange-200 rounded-lg text-sm font-medium hover:bg-orange-50 transition"
                                                >
                                                    <Lock size={16} className="mr-2" />
                                                    Reset Password
                                                </button>
                                                <button
                                                    onClick={handleExportUsers}
                                                    className="flex items-center px-3 py-1.5 bg-white text-teal-700 border border-teal-200 rounded-lg text-sm font-medium hover:bg-teal-50 transition"
                                                >
                                                    <FileSpreadsheet size={16} className="mr-2" />
                                                    Export
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedUsers(new Set())}
                                            className="text-slate-500 hover:text-slate-700 text-sm"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                )}

                                {/* Manage Users Header & Filters */}
                                <div className="p-4 border-b border-slate-100 flex flex-col space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
                                            {['student', 'faculty', 'admin'].map((role) => (
                                                <button
                                                    key={role}
                                                    onClick={() => {
                                                        setManageRoleTab(role);
                                                        setSearchTerm('');
                                                        setSelectedDept('');
                                                    }}
                                                    className={`px-4 py-2 text-sm font-medium rounded-md capitalize transition-all ${manageRoleTab === role ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    {role}s
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Filters Row */}
                                    <div className="flex flex-wrap gap-3 items-center">
                                        <div className="relative flex-1 min-w-[200px]">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Search size={18} className="text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder={`Search ${manageRoleTab}s...`}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 pr-4 py-2 w-full rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
                                            />
                                        </div>

                                        {/* Hierarchy Filters */}
                                        {manageRoleTab !== 'admin' && (
                                            <>
                                                <select
                                                    value={selectedDept}
                                                    onChange={(e) => setSelectedDept(e.target.value)}
                                                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-white dark:bg-slate-800 dark:text-white"
                                                >
                                                    <option value="">All Departments</option>
                                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>

                                                <select
                                                    value={selectedProg}
                                                    onChange={(e) => setSelectedProg(e.target.value)}
                                                    disabled={!selectedDept}
                                                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-white dark:bg-slate-800 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-900/50"
                                                >
                                                    <option value="">All Programs</option>
                                                    {filterPrograms.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </>
                                        )}

                                        {manageRoleTab === 'student' && (
                                            <>
                                                <select
                                                    value={selectedYear}
                                                    onChange={(e) => setSelectedYear(e.target.value)}
                                                    disabled={!selectedProg}
                                                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-white dark:bg-slate-800 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-900/50"
                                                >
                                                    <option value="">All Years</option>
                                                    {filterYears.map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>

                                                <select
                                                    value={selectedSem}
                                                    onChange={(e) => setSelectedSem(e.target.value)}
                                                    disabled={!selectedYear}
                                                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-white dark:bg-slate-800 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-900/50"
                                                >
                                                    <option value="">All Semesters</option>
                                                    {filterSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>

                                                <select
                                                    value={selectedSec}
                                                    onChange={(e) => setSelectedSec(e.target.value)}
                                                    disabled={!selectedSem}
                                                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-white dark:bg-slate-800 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-900/50"
                                                >
                                                    <option value="">All Sections</option>
                                                    {filterSections.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="overflow-x-auto flex-1 p-4">
                                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400 border-collapse">
                                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase font-semibold text-xs rounded-t-lg">
                                            <tr>
                                                <th className="px-6 py-4 rounded-tl-lg w-10">
                                                    <input
                                                        type="checkbox"
                                                        onChange={handleSelectAll}
                                                        checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </th>
                                                <th className="px-6 py-4">User</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">Details</th>
                                                <th className="px-6 py-4 text-right rounded-tr-lg">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-slate-900/40">
                                            {filteredUsers.length > 0 ? (
                                                filteredUsers.map((user) => (
                                                    <tr key={user.id} className={`hover:bg-slate-50 transition-colors group ${selectedUsers.has(user.id) ? 'bg-indigo-50/50' : ''}`}>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedUsers.has(user.id)}
                                                                onChange={() => handleSelectUser(user.id)}
                                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold uppercase ring-2 ring-white shadow-sm">
                                                                    {user.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-slate-900 dark:text-white">{user.name}</div>
                                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                                ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                                    user.role === 'faculty' ? 'bg-orange-100 text-orange-800' :
                                                                        'bg-blue-100 text-blue-800'}`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-slate-900 dark:text-white">{user.department || '-'}</div>
                                                            {user.role === 'student' && (
                                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-1">
                                                                    {user.program && <span className="bg-slate-100 px-1.5 rounded">{user.program}</span>}
                                                                    {user.year && <span className="bg-slate-100 px-1.5 rounded">Yr {user.year}</span>}
                                                                    {user.semester && <span className="bg-slate-100 px-1.5 rounded">Sem {user.semester}</span>}
                                                                    {user.section && <span className="bg-slate-100 px-1.5 rounded">Sec {user.section}</span>}
                                                                    {user.group && <span className="bg-slate-100 px-1.5 rounded">Grp {user.group}</span>}
                                                                </div>
                                                            )}
                                                            {user.role === 'faculty' && (
                                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-1">
                                                                    {user.program && <span className="bg-slate-100 px-1.5 rounded">{user.program}</span>}
                                                                    {user.year && <span className="bg-slate-100 px-1.5 rounded">Yr {user.year}</span>}
                                                                    {user.semester && <span className="bg-slate-100 px-1.5 rounded">Sem {user.semester}</span>}
                                                                    {user.section && <span className="bg-emerald-100 px-1.5 rounded text-emerald-700">Sec {user.section}</span>}
                                                                </div>
                                                            )}
                                                            {user.role === 'student' && <div className="text-xs text-slate-400 mt-1">Roll: {user.rollNumber}</div>}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {user.adminType !== 'readonly' && (
                                                                <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => handleEdit(user)}
                                                                        className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(user.id)}
                                                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                                                        <div className="flex flex-col items-center">
                                                            <Search size={32} className="text-slate-200 mb-2" />
                                                            <p>No users found matching your filters.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {activeTab === 'subjects' && (
                            <div className="p-8">
                                <SubjectManagement />
                            </div>
                        )}
                        {activeTab === 'departments' && (
                            <div className="p-8">
                                <SectionManagement />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Transfer Modal */}
            {
                showTransferModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full p-6 animate-scale-in border border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Transfer Selected Users</h3>
                                <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Update the details for <strong>{selectedUsers.size}</strong> selected users.
                                    Only filled fields will be updated.
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Department</label>
                                        <select
                                            name="department"
                                            value={transferData.department}
                                            onChange={handleTransferDataChange}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        >
                                            <option value="">No Change</option>
                                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Program</label>
                                        <select
                                            name="program"
                                            value={transferData.program}
                                            onChange={handleTransferDataChange}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        >
                                            <option value="">No Change</option>
                                            <option value="B.Tech">B.Tech</option>
                                            <option value="M.Tech">M.Tech</option>
                                            <option value="BCA">BCA</option>
                                            <option value="MCA">MCA</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Year</label>
                                        <select
                                            name="year"
                                            value={transferData.year}
                                            onChange={handleTransferDataChange}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        >
                                            <option value="">No Change</option>
                                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Semester</label>
                                        <select
                                            name="semester"
                                            value={transferData.semester}
                                            onChange={handleTransferDataChange}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        >
                                            <option value="">No Change</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Section</label>
                                        <input
                                            type="text"
                                            name="section"
                                            value={transferData.section}
                                            onChange={handleTransferDataChange}
                                            placeholder="No Change"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Group</label>
                                        <input
                                            type="text"
                                            name="group"
                                            value={transferData.group}
                                            onChange={handleTransferDataChange}
                                            placeholder="No Change"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowTransferModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBulkTransfer}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition shadow-md"
                                >
                                    Transfer Users
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Password Reset Modal */}
            {
                showResetModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in border border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Reset Passwords</h3>
                                <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-slate-500 mb-4">
                                    Enter a new password for the <strong>{selectedUsers.size}</strong> selected users.
                                </p>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">New Password</label>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBulkPasswordReset}
                                    className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition shadow-md"
                                >
                                    Reset Passwords
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around p-3 z-50 safe-area-bottom">
                <button onClick={() => handleTabChange('create')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'create' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    <UserPlus size={20} />
                    <span className="text-xs mt-1 font-medium z-10">Create</span>
                </button>
                <button onClick={() => handleTabChange('users')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'users' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    <Users size={20} />
                    <span className="text-xs mt-1 font-medium z-10">Users</span>
                </button>
                <button onClick={() => handleTabChange('departments')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'departments' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    <Layers size={20} />
                    <span className="text-xs mt-1 font-medium z-10">Depts</span>
                </button>
                <button onClick={() => handleTabChange('subjects')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'subjects' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    <BookOpen size={20} />
                    <span className="text-xs mt-1 font-medium z-10">Subjects</span>
                </button>
                <button onClick={() => handleTabChange('attendance')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'attendance' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    <TrendingUp size={20} />
                    <span className="text-xs mt-1 font-medium z-10">Stats</span>
                </button>

            </div>
        </div >
    );
};

export default AdminDashboard;
