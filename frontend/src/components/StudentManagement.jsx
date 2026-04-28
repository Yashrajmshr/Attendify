import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Upload, UserPlus, X, Search, Smartphone } from 'lucide-react';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [selectedSection, setSelectedSection] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newStudent, setNewStudent] = useState({
        name: '', email: '', password: '', rollNumber: '', department: '', section: '', group: ''
    });
    const [mySubjects, setMySubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');

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
        return matchesSection;
    });

    const fetchInitialData = async () => {
        try {
            const [studentsRes, subjectsRes] = await Promise.all([
                api.get('/student'),
                api.get('/subjects/my-subjects')
            ]);
            setStudents(studentsRes.data);
            const subjects = subjectsRes.data.subjects || (subjectsRes.data.subject ? [subjectsRes.data.subject] : []);
            setMySubjects(subjects);
            if (subjects.length > 0 && !selectedSubject) {
                setSelectedSubject(`${subjects[0].name} (${subjects[0].code})`);
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

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
            const { data } = await api.post('/student/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage(data.message);
            setUploading(false);
            setFile(null);
            fetchInitialData();
        } catch (error) {
            setMessage('Upload failed');
            setUploading(false);
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            await api.post('/student', newStudent);
            setMessage('Student added successfully');
            setNewStudent({ name: '', email: '', password: '', rollNumber: '', department: '', section: '', group: '' });
            setShowAddForm(false);
            fetchInitialData();
        } catch (error) {
            setMessage('Failed to add student');
        }
    };

    const handleResetDevice = async (id) => {
        if (!window.confirm('Are you sure you want to reset this student\'s device binding? They will be able to register a new device on their next attendance.')) return;

        try {
            await api.post(`/student/reset-device/${id}`);
            setMessage('Device binding reset successfully');
            setTimeout(() => setMessage(''), 3000);
            fetchInitialData(); // Refresh list to reflect changes
        } catch (err) {
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

    return (
        <div className="space-y-10 animate-fade-in transition-colors duration-500">
            <div className="flex justify-between items-center group">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Student Records</h2>
                    <div className="h-1 w-12 gradient-bg rounded-full mt-2 group-hover:w-24 transition-all duration-500"></div>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`nav-item px-8 py-4 px-8 py-4 rounded-2xl flex items-center transition-all ${showAddForm ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'nav-item-active'}`}
                >
                    {showAddForm ? <X size={20} className="mr-2" /> : <UserPlus size={20} className="mr-2" />}
                    <span className="font-bold uppercase tracking-wider text-xs">{showAddForm ? 'Cancel' : 'Enroll Student'}</span>
                </button>
            </div>

            {/* Bulk Upload Section */}
            <div className="premium-card p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary-500/10 transition-colors"></div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center uppercase tracking-tight">
                        <Upload size={20} className="mr-3 text-primary-500" />
                        Batch Enrollment
                    </h3>
                    <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline"
                    >
                        Download Master Template
                    </button>
                </div>

                <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-6 items-end bg-slate-50/50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 relative z-10">
                    <div className="flex-1 w-full">
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                            Student Dataset (.xlsx)
                        </label>
                        <input
                            type="file"
                            accept=".xlsx"
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
                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className={`px-10 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest text-white transition-all shadow-lg
                            ${!file || uploading
                                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none'
                                : 'gradient-bg hover:scale-105 active:scale-95 shadow-primary-500/25'}`}
                    >
                        {uploading ? 'Processing...' : 'Sync Data'}
                    </button>
                </form>
                {message && <p className={`mt-4 text-[10px] font-black uppercase tracking-widest text-center ${message.includes('failed') ? 'text-rose-500' : 'text-emerald-500 dark:text-emerald-400'}`}>{message}</p>}
            </div>

            {showAddForm && (
                <div className="premium-card p-10 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -ml-32 -mt-32"></div>
                    <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        {['name', 'email', 'password', 'rollNumber', 'department', 'section', 'group'].map((field) => (
                            <div key={field} className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{field.replace(/([A-Z])/g, ' $1')}</label>
                                <input
                                    type={field === 'password' ? 'password' : field === 'group' ? 'number' : 'text'}
                                    placeholder={`Enter student ${field.toLowerCase()}`}
                                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white"
                                    required={field !== 'group'}
                                    value={newStudent[field]}
                                    onChange={e => setNewStudent({ ...newStudent, [field]: e.target.value })}
                                />
                            </div>
                        ))}
                        <div className="md:col-span-2 flex justify-end pt-4">
                            <button type="submit" className="px-10 py-4 gradient-bg text-white font-bold rounded-[1.5rem] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary-500/25 flex items-center uppercase tracking-widest text-xs">
                                Confirm Enrollment
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Student List */}
            <div className="premium-card overflow-hidden relative">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">Registered Students <span className="ml-2 text-primary-600 dark:text-primary-400">#{filteredStudents.length}</span></h3>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center space-x-4">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Subject Context</label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-xs font-bold uppercase tracking-wider dark:text-white transition-all min-w-[150px]"
                            >
                                <option value="">All My Subjects</option>
                                {mySubjects.map(s => {
                                    const val = `${s.name} (${s.code})`;
                                    return <option key={s.id || s._id} value={val}>{val}</option>
                                })}
                            </select>
                        </div>

                        <div className="flex items-center space-x-4">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Filter Section</label>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none text-xs font-bold uppercase tracking-wider dark:text-white transition-all"
                            >
                                {sections.map(sec => (
                                    <option key={sec} value={sec}>{`Section ${sec}`}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase font-black text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-8 py-5">Full Name</th>
                                <th className="px-8 py-5">Identity Info</th>
                                <th className="px-8 py-5 text-center">Batch / Group</th>
                                <th className="px-8 py-5 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                                        <td className="px-8 py-5">
                                            <p className="font-bold text-slate-800 dark:text-white leading-tight">{student.name}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">{student.email}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600">
                                                {student.rollNumber}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-xs font-black text-primary-600 dark:text-primary-400">{student.department}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Grp: {student.group || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end space-x-3">
                                                <button
                                                    onClick={() => handleResetDevice(student._id)}
                                                    className={`p-2 rounded-xl transition-all ${student.deviceId ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 hover:scale-110' : 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-40'}`}
                                                    title={student.deviceId ? "Reset Device Binding" : "No device bound"}
                                                    disabled={!student.deviceId}
                                                >
                                                    <Smartphone size={16} />
                                                </button>
                                                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-tighter">
                                                    Active
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center text-slate-500 dark:text-slate-400 italic font-medium uppercase tracking-widest text-xs">
                                        No students found in this section
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
