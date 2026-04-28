import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2, X, Search, Upload, Download } from 'lucide-react';
import SafeSearchableSelect from './SafeSearchableSelect';

const SubjectManagement = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        department: '',
        program: '',
        year: '',
        semester: '',
        section: '',
        credits: '',
        type: 'Theory',
        attendanceWeightage: '75',
        facultyId: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);

    const [departments, setDepartments] = useState([]);
    const [sectionsData, setSectionsOnly] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [years, setYears] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [sectionsOnly, setSections] = useState([]);
    const [facultyList, setFacultyList] = useState([]);

    // Filter State
    const [filterDept, setFilterDept] = useState('');
    const [filterProg, setFilterProg] = useState('');
    const [filterSem, setFilterSem] = useState('');
    const [availablePrograms, setAvailablePrograms] = useState([]);

    useEffect(() => {
        fetchSubjects();
        fetchDepartments();
        fetchFaculty();
    }, []);

    useEffect(() => {
        if (formData.department) {
            const progs = [...new Set(sectionsData
                .filter(s => s.department === formData.department)
                .map(s => s.program)
                .filter(Boolean))].sort();
            setPrograms(progs);
            // Don't reset program here automatically during edit to preserve values, 
            // but for new entries or manual changes it might be needed.
            // A better place is in handleChange
        } else {
            setPrograms([]);
        }
    }, [formData.department, sectionsData]);

    // Cascade: Department → Program → Year
    useEffect(() => {
        if (formData.department && formData.program) {
            const yrs = [...new Set(sectionsData
                .filter(s => s.department === formData.department && s.program === formData.program)
                .map(s => s.year)
                .filter(Boolean))].sort();
            setYears(yrs);
        } else {
            setYears([]);
        }
    }, [formData.department, formData.program, sectionsData]);

    // Cascade: Year → Semester
    useEffect(() => {
        if (formData.department && formData.program && formData.year) {
            const sems = [...new Set(sectionsData
                .filter(s => s.department === formData.department && s.program === formData.program && s.year === formData.year)
                .map(s => s.semester)
                .filter(Boolean))].sort();
            setSemesters(sems);
        } else {
            setSemesters([]);
        }
    }, [formData.department, formData.program, formData.year, sectionsData]);

    // Cascade: Semester → Section
    useEffect(() => {
        if (formData.department && formData.program && formData.year && formData.semester) {
            const secs = [...new Set(sectionsData
                .filter(s => s.department === formData.department && s.program === formData.program && s.year === formData.year && s.semester === formData.semester)
                .map(s => s.name)
                .filter(Boolean))].sort();
            setSections(secs);
        } else {
            setSections([]);
        }
    }, [formData.department, formData.program, formData.year, formData.semester, sectionsData]);

    // Update available programs for filter when department filter changes
    useEffect(() => {
        if (filterDept) {
            const progs = [...new Set(sectionsData
                .filter(s => s.department === filterDept)
                .map(s => s.program)
                .filter(Boolean))].sort();
            setAvailablePrograms(progs);
            setFilterProg(''); // Reset program filter when dept changes
        } else {
            setAvailablePrograms([]);
            setFilterProg('');
        }
    }, [filterDept, sectionsData]);

    const fetchDepartments = async () => {
        try {
            const { data } = await api.get('/sections');
            setSectionsOnly(data);
            const uniqueDepts = [...new Set(data.map(item => item.department))].sort();
            setDepartments(uniqueDepts);
        } catch (err) {
            console.error('Failed to fetch departments', err);
        }
    };

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/subjects');
            setSubjects(data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch subjects', err);
            setError('Failed to fetch subjects');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'department') {
            setFormData({
                ...formData,
                department: value,
                program: '',
                year: '',
                semester: '',
                section: ''
            });
        } else if (name === 'program') {
            setFormData({
                ...formData,
                program: value,
                year: '',
                semester: '',
                section: ''
            });
        } else if (name === 'year') {
            setFormData({
                ...formData,
                year: value,
                semester: '',
                section: ''
            });
        } else if (name === 'semester') {
            setFormData({
                ...formData,
                semester: value,
                section: ''
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            if (isEditing) {
                const { data } = await api.put(`/subjects/${editId}`, formData);
                setSubjects(subjects.map(sub => sub.id === editId ? data : sub));
                setMessage('Subject updated successfully');
            } else {
                const { data } = await api.post('/subjects', formData);
                setSubjects([...subjects, data]);
                setMessage('Subject created successfully');
            }
            resetForm();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save subject');
        }
    };

    const fetchFaculty = async () => {
        try {
            const { data } = await api.get('/admin/users?role=faculty');
            setFacultyList(data);
        } catch (err) {
            console.error('Failed to fetch faculty', err);
        }
    };

    const handleEdit = (subject) => {
        setFormData({
            name: subject.name,
            code: subject.code,
            department: subject.department || '',
            program: subject.program || '',
            year: subject.year || '',
            semester: subject.semester || '',
            section: subject.section || '',
            credits: subject.credits || '',
            type: subject.type || 'Theory',
            attendanceWeightage: subject.attendanceWeightage || '75',
            facultyId: subject.facultyId || ''
        });
        setEditId(subject.id);
        setIsEditing(true);
        setShowForm(true);
        setMessage('');
        setError('');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this subject?')) {
            try {
                await api.delete(`/subjects/${id}`);
                setSubjects(subjects.filter(sub => sub.id !== id));
                setMessage('Subject deleted successfully');
            } catch (err) {
                setError('Failed to delete subject');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            department: '',
            program: '',
            year: '',
            semester: '',
            section: '',
            credits: '',
            type: 'Theory',
            attendanceWeightage: '75',
            facultyId: ''
        });
        setIsEditing(false);
        setEditId(null);
        setShowForm(false);
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const { data } = await api.post('/subjects/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage(data.message || 'Upload successful');
            setUploading(false);
            setFile(null);
            fetchSubjects();
            // Optional: reset file input
            document.getElementById('file-upload').value = '';
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
            setUploading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/subjects/template', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'subject_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Failed to download template', err);
            setError('Failed to download template');
        }
    };

    const filteredSubjects = subjects.filter(sub => {
        const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.code.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;
        if (filterDept && sub.department !== filterDept) return false;
        if (filterProg && sub.program !== filterProg) return false;
        if (filterSem && sub.semester != filterSem) return false;

        return true;
    });

    return (
        <div className="space-y-10 animate-fade-in transition-colors duration-500">
            <div className="flex justify-between items-center group">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Subject Management</h2>
                    <div className="h-1 w-12 gradient-bg rounded-full mt-2 group-hover:w-20 transition-all duration-500"></div>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowForm(!showForm);
                    }}
                    className={`nav-item px-8 py-4 ${showForm ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' : 'nav-item-active'}`}
                >
                    {showForm ? <X size={20} className="mr-2" /> : <Plus size={20} className="mr-2" />}
                    <span className="font-bold uppercase tracking-wider text-xs">{showForm ? 'Cancel' : 'Add Subject'}</span>
                </button>
            </div>

            {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center animate-fade-in">
                    {message}
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl animate-fade-in">
                    {error}
                </div>
            )}

            {/* Bulk Upload Section */}
            <div className="premium-card p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary-500/10 transition-colors"></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center uppercase tracking-tight relative z-10">
                    <Upload size={20} className="mr-3 text-primary-500" />
                    Bulk Upload
                </h3>
                <div className="flex flex-col md:flex-row gap-6 items-end bg-slate-50/50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 relative z-10">
                    <div className="flex-1 w-full">
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                            Excel Database (.xlsx)
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".xlsx, .csv"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-500 dark:text-slate-400
                                file:mr-6 file:py-3 file:px-6
                                file:rounded-2xl file:border-0
                                file:text-xs file:font-bold file:uppercase file:tracking-wider
                                file:bg-primary-500 file:text-white
                                hover:file:scale-105 file:transition-all
                                cursor-pointer"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="px-6 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-sm"
                        >
                            Template
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className={`px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest text-white transition-all shadow-lg
                                ${!file || uploading
                                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none'
                                    : 'gradient-bg hover:scale-105 active:scale-95 shadow-primary-500/25'}`}
                        >
                            {uploading ? 'Processing...' : 'Upload'}
                        </button>
                    </div>
                </div>
            </div>

            {showForm && (
                <div className="premium-card p-10 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -ml-32 -mt-32"></div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-8 flex items-center">
                        <Plus className="mr-3 text-primary-500" size={24} />
                        {isEditing ? 'Modify Subject' : 'Subject Details'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white"
                                placeholder="Introduction to Programming"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Subject Code</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                required
                                className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white"
                                placeholder="CS101"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Department</label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                required
                                className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white appearance-none"
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Program</label>
                            <select
                                name="program"
                                value={formData.program}
                                onChange={handleChange}
                                required
                                disabled={!formData.department}
                                className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white appearance-none disabled:opacity-50"
                            >
                                <option value="">Select Program</option>
                                {programs.map(prog => (
                                    <option key={prog} value={prog}>{prog}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Year & Semester</label>
                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    disabled={!formData.program}
                                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white appearance-none disabled:opacity-50"
                                >
                                    <option value="">Year</option>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <select
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleChange}
                                    disabled={!formData.year}
                                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white appearance-none disabled:opacity-50"
                                >
                                    <option value="">Sem</option>
                                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Type & Credits</label>
                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white appearance-none"
                                >
                                    <option value="Theory">Theory</option>
                                    <option value="Practical">Practical</option>
                                </select>
                                <input
                                    type="number"
                                    name="credits"
                                    value={formData.credits}
                                    onChange={handleChange}
                                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white"
                                    placeholder="4"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Section</label>
                            <select
                                name="section"
                                value={formData.section}
                                onChange={handleChange}
                                disabled={!formData.semester}
                                className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white appearance-none disabled:opacity-50"
                            >
                                <option value="">Optional (All Sections)</option>
                                {sectionsOnly.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Assign Faculty</label>
                            <SafeSearchableSelect
                                name="facultyId"
                                value={formData.facultyId}
                                onChange={handleChange}
                                options={facultyList
                                    .filter(f => !formData.department || f.department === formData.department)
                                    .map(f => ({
                                        value: f.id,
                                        label: f.name
                                    }))
                                }
                                placeholder="Select Faculty"
                                className="premium-select"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Weightage (%)</label>
                            <input
                                type="number"
                                name="attendanceWeightage"
                                value={formData.attendanceWeightage}
                                onChange={handleChange}
                                className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white"
                                placeholder="75"
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end pt-4">
                            <button
                                type="submit"
                                className="px-10 py-4 gradient-bg text-white font-bold rounded-[1.5rem] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary-500/25 flex items-center uppercase tracking-widest text-xs"
                            >
                                {isEditing ? <Edit size={18} className="mr-3" /> : <Plus size={18} className="mr-3" />}
                                {isEditing ? 'Update Subject' : 'Create Subject'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="premium-card overflow-hidden relative">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex flex-wrap gap-4">
                        <select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-xs font-bold uppercase tracking-wider dark:text-white"
                        >
                            <option value="">All Departments</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>

                        <select
                            value={filterProg}
                            onChange={(e) => setFilterProg(e.target.value)}
                            disabled={!filterDept}
                            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-xs font-bold uppercase tracking-wider dark:text-white disabled:opacity-50"
                        >
                            <option value="">All Programs</option>
                            {availablePrograms.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className="relative w-full md:w-80 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Find subjects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-4 py-3 w-full rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-sm dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase font-black text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-8 py-5">Course Code</th>
                                <th className="px-8 py-5">Subject Details</th>
                                <th className="px-8 py-5 text-center">Batch/Sem</th>
                                <th className="px-8 py-5 text-center">Faculty</th>
                                <th className="px-8 py-5 text-right">Settings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
                                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Retrieving Records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSubjects.length > 0 ? (
                                filteredSubjects.map((subject) => (
                                    <tr key={subject.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group border-b border-slate-50 dark:border-slate-800/10 last:border-0">
                                        <td className="px-8 py-5">
                                            <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600">
                                                {subject.code}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="font-bold text-slate-800 dark:text-white leading-tight">{subject.name}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mt-1.5">{subject.department}</p>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-xs font-black text-primary-600 dark:text-primary-400">{subject.program}</span>
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Semester {subject.semester}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            {subject.facultyId ? (
                                                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                                                    <span className="text-xs font-black">{facultyList.find(f => f.id === subject.facultyId)?.name || 'Faculty Assigned'}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Not Assigned</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEdit(subject)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500 transition-all shadow-sm"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(subject.id)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 transition-all shadow-sm"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="p-10 bg-slate-50/50 dark:bg-slate-800/30 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700 max-w-md mx-auto">
                                            <Search size={32} className="mx-auto text-slate-300 dark:text-slate-500 mb-4" />
                                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">No matching subjects found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SubjectManagement;
