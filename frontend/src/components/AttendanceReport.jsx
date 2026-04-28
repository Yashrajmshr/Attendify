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
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Download size={20} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Attendance Export</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Download full section attendance as Excel/CSV</p>
                </div>
            </div>

            {/* Filter Card */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">

                {/* Row 1: Subject + Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Subject */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                            <BookOpen size={13} /> Subject
                        </label>
                        <div className="relative">
                            <select
                                value={selectedSubject}
                                onChange={e => setSelectedSubject(e.target.value)}
                                className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                            >
                                <option value="">— Select Subject —</option>
                                {mySubjects.map((s, i) => {
                                    const subjectValue = s.name && s.code ? `${s.name} (${s.code})` : (s.name || s.subject || s);
                                    return (
                                        <option key={s.id || s._id || i} value={subjectValue}>
                                            {subjectValue}
                                        </option>
                                    );
                                })}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Section */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                            <Users size={13} /> Section
                        </label>
                        <div className="relative">
                            <select
                                value={selectedSection}
                                onChange={e => setSelectedSection(e.target.value)}
                                className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                            >
                                <option value="">— Select Section —</option>
                                {sections.map((s, i) => (
                                    <option key={i} value={s}>
                                        Section {s}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Row 2: Date Mode Tabs */}
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide flex items-center gap-1">
                        <Calendar size={13} /> Date Range
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-fit">
                        {[
                            { key: 'semester', label: 'Full Semester' },
                            { key: 'month', label: 'Month' },
                            { key: 'custom', label: 'Custom' },
                        ].map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => setDateMode(opt.key)}
                                className={`px-4 py-2 text-sm font-medium transition-all ${dateMode === opt.key
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Inputs based on mode */}
                {dateMode === 'semester' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Semester Start</label>
                            <input
                                type="date"
                                value={semesterStart}
                                onChange={e => setSemesterStart(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Semester End</label>
                            <input
                                type="date"
                                value={semesterEnd}
                                onChange={e => setSemesterEnd(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            />
                        </div>
                    </div>
                )}

                {dateMode === 'month' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Month</label>
                            <div className="relative">
                                <select
                                    value={selectedMonth}
                                    onChange={e => setSelectedMonth(Number(e.target.value))}
                                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                >
                                    {MONTHS.map((m, i) => (
                                        <option key={i} value={i}>{m}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Year</label>
                            <div className="relative">
                                <select
                                    value={selectedYear}
                                    onChange={e => setSelectedYear(Number(e.target.value))}
                                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                )}

                {dateMode === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">From Date</label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">To Date</label>
                            <input
                                type="date"
                                value={customEnd}
                                min={customStart}
                                onChange={e => setCustomEnd(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                    <button
                        onClick={handlePreview}
                        disabled={!isValid() || loadingPreview}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                    >
                        <Filter size={16} />
                        {loadingPreview ? 'Checking...' : 'Preview'}
                    </button>

                    <button
                        onClick={handleDownload}
                        disabled={!isValid() || downloading}
                        className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md
                            disabled:opacity-40 disabled:cursor-not-allowed
                            bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg"
                    >
                        <Download size={16} />
                        {downloading ? 'Downloading...' : 'Download Excel'}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    {error}
                </div>
            )}

            {/* Preview Info */}
            {preview && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 flex items-center gap-4">
                    <Clock size={20} className="text-indigo-500 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-indigo-800">
                            {preview.sessionCount} session{preview.sessionCount !== 1 ? 's' : ''} found
                        </p>
                        <p className="text-xs text-indigo-600 mt-0.5">
                            From <strong>{preview.startDate}</strong> to <strong>{preview.endDate}</strong> for{' '}
                            <strong>{selectedSubject}</strong> — Section <strong>{selectedSection}</strong>
                        </p>
                        {preview.sessionCount === 0 && (
                            <p className="text-xs text-amber-600 mt-1">⚠ No sessions in this range. The downloaded file will have no date columns.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Guide */}
            <div className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">📋 How the export works</h3>
                <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold mt-0.5">1.</span>
                        Each row = one student from the selected section
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold mt-0.5">2.</span>
                        Each column after name/roll = one class date (P = Present, A = Absent)
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold mt-0.5">3.</span>
                        Last two columns = Total Present count &amp; Attendance %
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default AttendanceReport;
