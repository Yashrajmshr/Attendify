import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Download, Calendar, Filter, BookOpen, Users, Clock, ChevronDown } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const AttendanceReport = () => {
    const [mySubjects, setMySubjects] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [dateMode, setDateMode] = useState('semester'); // 'semester' | 'month' | 'custom'
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [semesterStart, setSemesterStart] = useState('');
    const [semesterEnd, setSemesterEnd] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Fetch faculty's subjects and sections
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await api.get('/subjects/my-subjects');
                const subjects = data.subjects || (data.subject ? [data.subject] : []);
                setMySubjects(subjects);
                setSections(data.sections || []);

                // Default to first subject if available
                if (subjects.length > 0) {
                    const s = subjects[0];
                    setSelectedSubject(`${s.name} (${s.code})`);
                }

                // Default to first section if available
                if (data.sections && data.sections.length > 0) {
                    setSelectedSection(data.sections[0]);
                }
            } catch (err) {
                console.error('Failed to load data', err);
            }
        };
        fetchData();
        // Default semester dates
        const now = new Date();
        const month = now.getMonth();
        // Jan-Jun = even semester, Jul-Dec = odd semester
        if (month < 6) {
            setSemesterStart(`${now.getFullYear()}-01-01`);
            setSemesterEnd(`${now.getFullYear()}-06-30`);
        } else {
            setSemesterStart(`${now.getFullYear()}-07-01`);
            setSemesterEnd(`${now.getFullYear()}-12-31`);
        }
    }, []);

    const getDateRange = () => {
        if (dateMode === 'semester') {
            return { startDate: semesterStart, endDate: semesterEnd };
        } else if (dateMode === 'month') {
            const start = new Date(selectedYear, selectedMonth, 1);
            const end = new Date(selectedYear, selectedMonth + 1, 0);
            return {
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0],
            };
        } else {
            return { startDate: customStart, endDate: customEnd };
        }
    };

    const isValid = () => {
        if (!selectedSubject || !selectedSection) return false;
        const { startDate, endDate } = getDateRange();
        return startDate && endDate && startDate <= endDate;
    };

    const handleDownload = async () => {
        if (!isValid()) return;
        setDownloading(true);
        setError('');
        try {
            const { startDate, endDate } = getDateRange();
            const response = await api.get('/attendance/export', {
                params: { startDate, endDate, subject: selectedSubject, section: selectedSection },
                responseType: 'blob',
            });

            const subjectLabel = selectedSubject.replace(/\s+/g, '_');
            const filename = `Attendance_${subjectLabel}_${selectedSection}_${startDate}_to_${endDate}.xlsx`;

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download. Please try again.');
            console.error(err);
        } finally {
            setDownloading(false);
        }
    };

    const handlePreview = async () => {
        if (!isValid()) return;
        setLoadingPreview(true);
        setError('');
        setPreview(null);
        try {
            const { startDate, endDate } = getDateRange();
            // Fetch sessions for preview
            const { data: sessions } = await api.get('/session');
            const filtered = sessions.filter(s => {
                const d = s.createdAt?.split('T')[0];
                return s.subject === selectedSubject &&
                    s.section === selectedSection &&
                    d >= startDate && d <= endDate;
            });
            setPreview({ sessionCount: filtered.length, startDate, endDate });
        } catch (err) {
            setError('Failed to fetch preview info.');
        } finally {
            setLoadingPreview(false);
        }
    };

    const years = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

    return (
        <div className="p-4 md:p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <Download size={20} className="text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Academic Reports</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Export student registries and attendance logs to Excel datasets</p>
                </div>
            </div>

            {/* Filter board */}
            <div className="bg-slate-105/40 dark:bg-slate-950/20 rounded-[2rem] border border-slate-200/40 dark:border-white/5 p-6 md:p-8 space-y-6">

                {/* Grid: Subject & Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Subject */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <BookOpen size={13} /> Choice of Subject
                        </label>
                        <div className="relative">
                            <select
                                value={selectedSubject}
                                onChange={e => setSelectedSubject(e.target.value)}
                                className="glass-select text-xs font-bold"
                            >
                                <option value="" className="dark:bg-slate-900">— Select Subject —</option>
                                {mySubjects.map((s, i) => {
                                    const subjectValue = s.name && s.code ? `${s.name} (${s.code})` : (s.name || s.subject || s);
                                    return (
                                        <option key={s.id || s._id || i} value={subjectValue} className="dark:bg-slate-900">
                                            {subjectValue}
                                        </option>
                                    );
                                })}
                            </select>
                            <span className="absolute right-4 top-4.5 text-slate-450 pointer-events-none">▼</span>
                        </div>
                    </div>

                    {/* Section */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <Users size={13} /> Target Section
                        </label>
                        <div className="relative">
                            <select
                                value={selectedSection}
                                onChange={e => setSelectedSection(e.target.value)}
                                className="glass-select text-xs font-bold"
                            >
                                <option value="" className="dark:bg-slate-900">— Select Section —</option>
                                {sections.map((s, i) => (
                                    <option key={i} value={s} className="dark:bg-slate-900">
                                        Section {s}
                                    </option>
                                ))}
                            </select>
                            <span className="absolute right-4 top-4.5 text-slate-455 pointer-events-none">▼</span>
                        </div>
                    </div>
                </div>

                {/* Range mode tab */}
                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Calendar size={13} /> Timeframe Range
                    </label>
                    
                    <div className="flex p-1 rounded-2xl bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200/40 dark:border-white/5 w-fit">
                        {[
                            { key: 'semester', label: 'Full Semester' },
                            { key: 'month', label: 'By Month' },
                            { key: 'custom', label: 'Custom Window' },
                        ].map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => setDateMode(opt.key)}
                                className={`px-4.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                    dateMode === opt.key
                                        ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-250'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Fields according to mode */}
                {dateMode === 'semester' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Semester Start</label>
                            <input
                                type="date"
                                value={semesterStart}
                                onChange={e => setSemesterStart(e.target.value)}
                                className="glass-input text-xs"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Semester End</label>
                            <input
                                type="date"
                                value={semesterEnd}
                                onChange={e => setSemesterEnd(e.target.value)}
                                className="glass-input text-xs"
                            />
                        </div>
                    </div>
                )}

                {dateMode === 'month' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Month</label>
                            <div className="relative">
                                <select
                                    value={selectedMonth}
                                    onChange={e => setSelectedMonth(Number(e.target.value))}
                                    className="glass-select text-xs font-bold"
                                >
                                    {MONTHS.map((m, i) => (
                                        <option key={i} value={i} className="dark:bg-slate-900">{m}</option>
                                    ))}
                                </select>
                                <span className="absolute right-4 top-4.5 text-slate-450 pointer-events-none">▼</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Year</label>
                            <div className="relative">
                                <select
                                    value={selectedYear}
                                    onChange={e => setSelectedYear(Number(e.target.value))}
                                    className="glass-select text-xs font-bold"
                                >
                                    {years.map(y => (
                                        <option key={y} value={y} className="dark:bg-slate-900">{y}</option>
                                    ))}
                                </select>
                                <span className="absolute right-4 top-4.5 text-slate-450 pointer-events-none">▼</span>
                            </div>
                        </div>
                    </div>
                )}

                {dateMode === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">From Date</label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                                className="glass-input text-xs"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">To Date</label>
                            <input
                                type="date"
                                value={customEnd}
                                min={customStart}
                                onChange={e => setCustomEnd(e.target.value)}
                                className="glass-input text-xs"
                            />
                        </div>
                    </div>
                )}

                {/* Action Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                    <button
                        onClick={handlePreview}
                        disabled={!isValid() || loadingPreview}
                        className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Filter size={14} />
                        {loadingPreview ? 'Fetching stats...' : 'Preview Records'}
                    </button>

                    <button
                        onClick={handleDownload}
                        disabled={!isValid() || downloading}
                        className="w-full sm:flex-1 px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-40 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg shadow-emerald-500/10"
                    >
                        <Download size={14} />
                        {downloading ? 'Compiling Excel...' : 'Export Spreadsheet'}
                    </button>
                </div>
            </div>

            {/* Error Feedback */}
            {error && (
                <div className="bg-rose-500/10 dark:bg-rose-500/5 text-rose-600 dark:text-rose-450 p-4.5 rounded-2xl border border-rose-500/20 text-xs font-bold">
                    {error}
                </div>
            )}

            {/* Preview Widget Stats */}
            {preview && (
                <div className="bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 rounded-[1.75rem] p-5 flex items-start gap-4 animate-fade-in">
                    <Clock size={18} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">
                            {preview.sessionCount} Active Session{preview.sessionCount !== 1 ? 's' : ''} Identified
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Timeline window: <strong>{preview.startDate}</strong> to <strong>{preview.endDate}</strong> for{' '}
                            <strong>{selectedSubject}</strong> (Section <strong>{selectedSection}</strong>).
                        </p>
                        {preview.sessionCount === 0 && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider mt-2">
                                ⚠️ Caution: No sessions found in this window. Syncing will download empty columns.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Instruction Panel */}
            <div className="premium-card p-6">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4">Export Guidelines</h3>
                <ul className="space-y-3 text-xs text-slate-500 dark:text-slate-450 font-medium">
                    <li className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 flex items-center justify-center font-bold text-[10px]">1</span>
                        <span>Exported sheets include student details matching the selected section.</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 flex items-center justify-center font-bold text-[10px]">2</span>
                        <span>Lectures are dynamically populated on date columns with Present (P) or Absent (A) metrics.</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 flex items-center justify-center font-bold text-[10px]">3</span>
                        <span>Aggregate presence count and percentage index are calculated dynamically in final rows.</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default AttendanceReport;
