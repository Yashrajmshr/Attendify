import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
    Upload, UserPlus, X, Search, Smartphone, ShieldCheck, 
    Award, FileSpreadsheet, Users, Percent, Download, 
    AlertTriangle, RefreshCw 
} from 'lucide-react';

const StudentManagement = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [selectedSection, setSelectedSection] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showBatchUpload, setShowBatchUpload] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [attendanceMap, setAttendanceMap] = useState({});
    const [loading, setLoading] = useState(true);
    
    const [newStudent, setNewStudent] = useState({
        name: '', email: '', password: '', rollNumber: '', department: '', section: '', group: ''
    });
    const [mySubjects, setMySubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');

    // Pre-fill department based on faculty profile
    useEffect(() => {
        if (user && user.department) {
            setNewStudent(prev => ({
                ...prev,
                department: user.department
            }));
        }
    }, [user]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [studentsRes, subjectsRes, defaultersRes] = await Promise.all([
                api.get('/student'),
                api.get('/subjects/my-subjects'),
                api.get('/admin/defaulters?threshold=101').catch(() => ({ data: [] }))
            ]);
            
            setStudents(studentsRes.data);
            
            const subjects = subjectsRes.data.subjects || (subjectsRes.data.subject ? [subjectsRes.data.subject] : []);
            setMySubjects(subjects);
            
            if (subjects.length > 0 && !selectedSubject) {
                setSelectedSubject(`${subjects[0].name} (${subjects[0].code})`);
            }

            const attMap = {};
            if (defaultersRes && Array.isArray(defaultersRes.data)) {
                defaultersRes.data.forEach(item => {
                    attMap[item.id] = {
                        percentage: item.percentage,
                        presentClasses: item.presentClasses,
                        possibleClasses: item.possibleClasses
                    };
                });
            }
            setAttendanceMap(attMap);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Extract unique sections
    const sections = [...new Set(students.map(s => s.section).filter(Boolean))].sort();

    useEffect(() => {
        if (sections.length > 0 && !selectedSection) {
            setSelectedSection(sections[0]);
        }
    }, [sections, selectedSection]);

    // Filter students
    const filteredStudents = students.filter(s => {
        const matchesSection = !selectedSection || s.section === selectedSection;
        const matchesSearch = !searchQuery || 
            (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (s.rollNumber && s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSection && matchesSearch;
    });

    // Stats calculations
    const totalStudents = filteredStudents.length;
    const deviceBoundCount = filteredStudents.filter(s => s.deviceId).length;
    
    const studentsWithAttendance = filteredStudents.filter(s => attendanceMap[s._id] !== undefined);
    const avgAttendanceVal = studentsWithAttendance.length > 0
        ? (studentsWithAttendance.reduce((sum, s) => sum + (attendanceMap[s._id]?.percentage || 0), 0) / studentsWithAttendance.length).toFixed(1)
        : null;
    const avgAttendance = avgAttendanceVal !== null ? `${avgAttendanceVal}%` : '0%';

    const atRiskCount = filteredStudents.filter(s => {
        const att = attendanceMap[s._id];
        return att && att.percentage < 75;
    }).length;

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        if (user?.department) formData.append('department', user.department);
        if (selectedSection) formData.append('section', selectedSection);

        setUploading(true);
        setMessage('');
        try {
            const { data } = await api.post('/student/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage(data.message || 'Batch upload processed successfully');
            setUploading(false);
            setFile(null);
            setShowBatchUpload(false);
            fetchInitialData();
        } catch (error) {
            console.error(error);
            setMessage('Upload failed: ' + (error.response?.data?.message || 'Server error'));
            setUploading(false);
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            await api.post('/student', newStudent);
            setMessage('Student enrolled successfully');
            setNewStudent({ 
                name: '', 
                email: '', 
                password: '', 
                rollNumber: '', 
                department: user?.department || '', 
                section: '', 
                group: '' 
            });
            setShowAddForm(false);
            fetchInitialData();
        } catch (error) {
            console.error(error);
            setMessage('Failed to add student: ' + (error.response?.data?.message || 'Server error'));
        }
    };

    const handleResetDevice = async (id) => {
        if (!window.confirm("Are you sure you want to reset this student's device binding? They will be able to register a new device on their next attendance mark.")) return;

        setMessage('');
        try {
            await api.post(`/student/reset-device/${id}`);
            setMessage('Device binding reset successfully');
            setTimeout(() => setMessage(''), 3000);
            fetchInitialData(); // Refresh list to reflect changes
        } catch (err) {
            console.error(err);
            setMessage(err.response?.data?.message || 'Failed to reset device');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/student/template', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'student_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to download template', error);
            setMessage('Failed to download template');
        }
    };

    const handleDownloadSection = async () => {
        try {
            setMessage('');
            const response = await api.post('/student/download-section', {
                section: selectedSection,
                department: user?.department || 'CS'
            }, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `students_${user?.department || 'CS'}_Section_${selectedSection}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setMessage('Section registry exported successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Failed to download section file', error);
            setMessage('Failed to download section students');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-8">
            {/* Header Block */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-805 dark:text-white tracking-tight flex items-center gap-2">
                        <Users className="text-primary-500" size={24} />
                        Academic Registry & Device Control
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Enroll students, manage device bindings, and monitor class-wise attendance compliance.
                    </p>
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setShowAddForm(!showAddForm);
                            setShowBatchUpload(false);
                        }}
                        className={`flex items-center px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
                            showAddForm 
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/30' 
                                : 'gradient-bg text-white hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                    >
                        {showAddForm ? <X size={14} className="mr-1.5" /> : <UserPlus size={14} className="mr-1.5" />}
                        <span>{showAddForm ? 'Cancel' : 'Enroll Student'}</span>
                    </button>

                    <button
                        onClick={() => {
                            setShowBatchUpload(!showBatchUpload);
                            setShowAddForm(false);
                        }}
                        className={`flex items-center px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
                            showBatchUpload 
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/30' 
                                : 'bg-slate-105 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200/50 text-slate-800 dark:text-white'
                        }`}
                    >
                        {showBatchUpload ? <X size={14} className="mr-1.5" /> : <Upload size={14} className="mr-1.5" />}
                        <span>{showBatchUpload ? 'Cancel' : 'Batch Registry'}</span>
                    </button>
                </div>
            </div>

            {/* Notification alert banner */}
            {message && (
                <div className={`p-4 rounded-2xl border text-xs font-bold uppercase tracking-wider animate-fade-in ${
                    message.toLowerCase().includes('failed') || message.toLowerCase().includes('error')
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' 
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450'
                }`}>
                    {message}
                </div>
            )}

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in">
                <div className="premium-card p-5 border-l-4 border-l-indigo-500">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="text-indigo-500" size={18} />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Section Size</span>
                    </div>
                    <h4 className="text-2xl font-black text-slate-800 dark:text-white">{totalStudents}</h4>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Students registered in Section {selectedSection}</p>
                </div>

                <div className="premium-card p-5 border-l-4 border-l-emerald-500">
                    <div className="flex items-center justify-between mb-2">
                        <ShieldCheck className="text-emerald-500" size={18} />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Device Bound</span>
                    </div>
                    <h4 className="text-2xl font-black text-slate-800 dark:text-white">
                        {deviceBoundCount} <span className="text-xs font-bold text-slate-400">/ {totalStudents}</span>
                    </h4>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Anti-proxy device binds active</p>
                </div>

                <div className="premium-card p-5 border-l-4 border-l-pink-500">
                    <div className="flex items-center justify-between mb-2">
                        <Percent className="text-pink-500" size={18} />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg Attendance</span>
                    </div>
                    <h4 className="text-2xl font-black text-slate-800 dark:text-white">{avgAttendance}</h4>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Subject-wide average attendance</p>
                </div>

                <div className="premium-card p-5 border-l-4 border-l-rose-500">
                    <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className="text-rose-500" size={18} />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">At Risk (&lt;75%)</span>
                    </div>
                    <h4 className="text-2xl font-black text-rose-600 dark:text-rose-455">{atRiskCount}</h4>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Students below threshold</p>
                </div>
            </div>

            {/* Bulk Sync Section */}
            {showBatchUpload && (
                <div className="premium-card p-6 md:p-8 animate-fade-in relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary-500/10 transition-all"></div>
                    
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6 relative z-10">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center uppercase tracking-wider">
                                <Upload size={16} className="mr-2.5 text-primary-500" />
                                Batch Import Panel
                            </h3>
                            <p className="text-[10px] text-slate-400 mt-1">Upload a spreadsheet of student details to register them in bulk.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="flex items-center text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline text-left gap-1"
                        >
                            <Download size={12} />
                            Download Excel Template
                        </button>
                    </div>

                    <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-5 items-end bg-slate-100/40 dark:bg-slate-950/20 p-5 rounded-[2rem] border border-slate-200/40 dark:border-white/5 relative z-10">
                        <div className="flex-1 w-full space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                                Select Excel File (.xlsx)
                            </label>
                            <input
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileChange}
                                className="block w-full text-xs text-slate-500 dark:text-slate-400
                                    file:mr-5 file:py-2.5 file:px-5
                                    file:rounded-xl file:border-0
                                    file:text-[10px] file:font-black file:uppercase file:tracking-wider
                                    file:bg-primary-500/10 file:text-primary-600 dark:file:text-primary-450
                                    hover:file:bg-primary-500/20 file:transition-all
                                    cursor-pointer"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!file || uploading}
                            className={`w-full md:w-auto px-8 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest text-white transition-all shadow-sm ${
                                !file || uploading
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'gradient-bg hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                        >
                            {uploading ? 'Processing...' : 'Upload Student Dataset'}
                        </button>
                    </form>
                </div>
            )}

            {/* Single Add Form */}
            {showAddForm && (
                <div className="premium-card p-6 md:p-8 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -ml-32 -mt-32"></div>
                    <div className="mb-4 relative z-10">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center uppercase tracking-wider">
                            <UserPlus size={16} className="mr-2 text-indigo-500" />
                            Individual Student Enrollment
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1">Directly enroll a single student into the academic database.</p>
                    </div>

                    <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 relative z-10">
                        {['name', 'email', 'password', 'rollNumber', 'department', 'section', 'group'].map((field) => (
                            <div key={field} className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                                    {field.replace(/([A-Z])/g, ' $1')}
                                </label>
                                <input
                                    type={field === 'password' ? 'password' : field === 'group' ? 'number' : 'text'}
                                    placeholder={`e.g. ${
                                        field === 'rollNumber' ? 'CS23B1001' : 
                                        field === 'section' ? 'A' : 
                                        field === 'group' ? '1' : 
                                        field === 'department' ? (user?.department || 'CS') :
                                        field.toLowerCase()
                                    }`}
                                    className="glass-input text-xs"
                                    required={field !== 'group'}
                                    value={newStudent[field]}
                                    onChange={e => setNewStudent({ ...newStudent, [field]: e.target.value })}
                                />
                            </div>
                        ))}
                        <div className="sm:col-span-2 md:col-span-3 flex justify-end pt-2">
                            <button type="submit" className="premium-button gradient-bg">
                                Confirm Enrollment
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Control & Table Board */}
            <div className="premium-card overflow-hidden relative animate-fade-in">
                
                {/* Header Filter Panel */}
                <div className="p-6 border-b border-slate-200/40 dark:border-slate-800/40 flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-slate-50/40 dark:bg-slate-950/20">
                    <div className="space-y-1">
                        <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center uppercase tracking-wider">
                            Student Directory
                            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-450 text-[10px] font-black">
                                {filteredStudents.length} Registered
                            </span>
                        </h3>
                        <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase">Section {selectedSection} • Subject Context: {selectedSubject || 'All my subjects'}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        {/* Search Bar */}
                        <div className="relative flex-1 sm:flex-initial sm:min-w-[240px]">
                            <Search className="absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-500" size={15} />
                            <input
                                type="text"
                                placeholder="Search by name, roll, email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white"
                            />
                        </div>

                        {/* Exporter & Selects */}
                        <div className="flex gap-2.5 flex-wrap">
                            <div className="relative min-w-[120px]">
                                <select
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    className="w-full appearance-none px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-white pr-8"
                                >
                                    {sections.map(sec => (
                                        <option key={sec} value={sec} className="dark:bg-slate-900">{`Section ${sec}`}</option>
                                    ))}
                                </select>
                                <span className="absolute right-3 top-2.5 text-[8px] text-slate-400 pointer-events-none">▼</span>
                            </div>

                            <button
                                onClick={handleDownloadSection}
                                disabled={!selectedSection || loading}
                                className="flex items-center gap-1.5 px-4.5 py-2 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/15 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                <FileSpreadsheet size={13} />
                                <span>Export Section</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-650 dark:text-slate-450">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 uppercase font-black text-[9px] tracking-widest border-b border-slate-200/40 dark:border-slate-800/40">
                            <tr>
                                <th className="px-6 py-4">Student Info</th>
                                <th className="px-6 py-4">Roll Number</th>
                                <th className="px-6 py-4 text-center">Group</th>
                                <th className="px-6 py-4">Device Lock</th>
                                <th className="px-6 py-4">Attendance Health</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                        <RefreshCw className="animate-spin inline-block mr-2" size={14} />
                                        Loading academic records...
                                    </td>
                                </tr>
                            ) : filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => {
                                    const att = attendanceMap[student._id];
                                    const percent = att ? att.percentage : 0;
                                    const present = att ? att.presentClasses : 0;
                                    const possible = att ? att.possibleClasses : 0;
                                    const hasStats = att !== undefined && possible > 0;
                                    
                                    const isLowAttendance = hasStats && percent < 75;

                                    const charVal = student.name ? student.name.charCodeAt(0) : 65;
                                    const colorMap = [
                                        'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/25',
                                        'bg-purple-500/10 text-purple-650 dark:text-purple-400 border border-purple-500/25',
                                        'bg-pink-500/10 text-pink-650 dark:text-pink-400 border border-pink-500/25',
                                        'bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border border-emerald-500/25',
                                        'bg-blue-500/10 text-blue-650 dark:text-blue-400 border border-blue-500/25'
                                    ];
                                    const colorClass = colorMap[charVal % colorMap.length];
                                    
                                    return (
                                        <tr key={student._id} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/20 transition-all duration-200">
                                            <td className="px-6 py-4 flex items-center space-x-3.5">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-tighter ${colorClass}`}>
                                                    {student.name ? student.name.charAt(0) : 'S'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-850 dark:text-white text-xs leading-tight">{student.name}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1 font-medium">{student.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-655 dark:text-slate-350 border border-slate-200/40 dark:border-slate-800 px-2.5 py-1 rounded-xl">
                                                    {student.rollNumber}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-900/50 px-2.5 py-1 rounded-lg border border-slate-200/20 dark:border-white/5">
                                                    Group {student.group || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {student.deviceId ? (
                                                    <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-450">
                                                        <ShieldCheck size={14} className="text-emerald-500 flex-shrink-0" />
                                                        <span className="text-[10px] font-bold truncate max-w-[100px]" title={`Device: ${student.deviceId}`}>
                                                            Bound ({student.deviceId.substring(0, 5)}...)
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500">
                                                        <Smartphone size={14} className="flex-shrink-0" />
                                                        <span className="text-[10px] font-bold">Unbound</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {hasStats ? (
                                                    <div className="space-y-1.5 min-w-[130px]">
                                                        <div className="flex items-center justify-between text-[10px]">
                                                            <span className={`font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-[8px] ${
                                                                isLowAttendance 
                                                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-455' 
                                                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-455'
                                                            }`}>
                                                                {isLowAttendance ? 'Critical' : 'Compliant'}
                                                            </span>
                                                            <span className="font-bold text-slate-705 dark:text-slate-300">{percent}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-150 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full rounded-full transition-all duration-500 ${isLowAttendance ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                                                style={{ width: `${percent}%` }}
                                                            ></div>
                                                        </div>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{present} / {possible} classes attended</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1.5 min-w-[130px]">
                                                        <div className="flex items-center justify-between text-[10px]">
                                                            <span className="font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 text-[8px]">No Session</span>
                                                            <span className="font-bold text-slate-400">0%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-150 dark:bg-slate-805 h-1.5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-slate-300 dark:bg-slate-700 rounded-full w-0"></div>
                                                        </div>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase">0 / 0 classes conducted</p>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleResetDevice(student._id)}
                                                    className={`p-2 rounded-xl transition-all border ${
                                                        student.deviceId 
                                                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/25 hover:scale-105' 
                                                            : 'bg-slate-100 dark:bg-slate-900 text-slate-300 dark:text-slate-700 border-slate-200/40 dark:border-slate-800 cursor-not-allowed opacity-40'
                                                    }`}
                                                    title={student.deviceId ? "Reset Device Binding Lock" : "Device not bound"}
                                                    disabled={!student.deviceId}
                                                >
                                                    <Smartphone size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-slate-400 italic font-bold uppercase tracking-wider text-[10px]">
                                        No registered students match search and filter criteria.
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

export default StudentManagement;
