import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    LayoutDashboard, Users, BookOpen, Clock, Calendar,
    BarChart2, TrendingUp, RefreshCcw, Wifi, MapPin, FileSpreadsheet, Search, Table, Activity
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    BarChart, Bar, ComposedChart, Cell
} from 'recharts';
import { DashboardSkeleton } from './Skeleton';


const AdminAttendanceDashboard = ({ departments, sectionsData }) => {
    const [analytics, setAnalytics] = useState(null);
    const [liveSessions, setLiveSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('charts'); // 'charts' or 'report'
    const [timeRange, setTimeRange] = useState('daily'); // 'daily', 'weekly', 'monthly'

    // Filters
    const [filters, setFilters] = useState({
        department: '',
        program: '',
        year: '',
        semester: '',
        section: '',
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    // Dependent Dropdown Options
    const [programs, setPrograms] = useState([]);
    const [years, setYears] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [sections, setSections] = useState([]); // Filtered sections

    useEffect(() => {
        fetchAnalytics();
        fetchLiveSessions();

        // Auto-refresh live sessions every 30s
        const interval = setInterval(fetchLiveSessions, 30000);
        return () => clearInterval(interval);
    }, [filters.department, filters.program, filters.year, filters.semester, filters.section, filters.startDate, filters.endDate]);

    // Derived Dropdowns Logic
    useEffect(() => {
        if (filters.department) {
            const progs = [...new Set(sectionsData
                .filter(s => s.department === filters.department)
                .map(s => s.program)
                .filter(Boolean))].sort();
            setPrograms(progs);
        } else {
            setPrograms([]);
        }
        // Reset subsequent filters if parent changes is handled in handleFilterChange logic or here?
        // Better to handle in handleFilterChange to avoid infinite loops if not careful, 
        // but cleaner to just derived options here.
    }, [filters.department, sectionsData]);

    useEffect(() => {
        if (filters.department && filters.program) {
            const yrs = [...new Set(sectionsData
                .filter(s => s.department === filters.department && s.program === filters.program)
                .map(s => s.year)
                .filter(Boolean))].sort();
            setYears(yrs);
        } else {
            setYears([]);
        }
    }, [filters.program, filters.department, sectionsData]);

    useEffect(() => {
        if (filters.department && filters.program && filters.year) {
            const sems = [...new Set(sectionsData
                .filter(s => s.department === filters.department && s.program === filters.program && s.year === filters.year)
                .map(s => s.semester)
                .filter(Boolean))].sort();
            setSemesters(sems);
        } else {
            setSemesters([]);
        }
    }, [filters.year, filters.program, filters.department, sectionsData]);

    useEffect(() => {
        if (filters.department && filters.program && filters.year && filters.semester) {
            const secs = [...new Set(sectionsData
                .filter(s => s.department === filters.department &&
                    s.program === filters.program &&
                    s.year === filters.year &&
                    s.semester === filters.semester)
                .map(s => s.name)
                .filter(Boolean))].sort();
            setSections(secs);
        } else {
            setSections([]);
        }
    }, [filters.semester, filters.year, filters.program, filters.department, sectionsData]);


    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const { data } = await api.get(`/admin/analytics/attendance?${queryParams}`);
            setAnalytics(data);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
            setError('Failed to load attendance data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLiveSessions = async () => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const { data } = await api.get(`/admin/sessions/live?${queryParams}`);
            setLiveSessions(data);
        } catch (err) {
            console.error('Failed to fetch live sessions', err);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };

            // Cascading Resets
            if (name === 'department') {
                newFilters.program = '';
                newFilters.year = '';
                newFilters.semester = '';
                newFilters.section = '';
            } else if (name === 'program') {
                newFilters.year = '';
                newFilters.semester = '';
                newFilters.section = '';
            } else if (name === 'year') {
                newFilters.semester = '';
                newFilters.section = '';
            } else if (name === 'semester') {
                newFilters.section = '';
            }

            return newFilters;
        });
    };

    const processData = () => {
        if (!analytics || !analytics.timeline) return [];

        const data = analytics.timeline;
        // Ensure each daily item has 'expected' and 'totalStudents' for consistent processing
        const enrichedData = data.map(item => ({
            ...item,
            expected: item.expected || item.totalStudents || 0, // Assume expected is totalStudents if not provided
            totalStudents: item.totalStudents || item.expected || 0,
            absent: (item.expected || item.totalStudents || 0) - item.present,
            percentage: (item.expected || item.totalStudents || 0) > 0 ? ((item.present / (item.expected || item.totalStudents)) * 100) : 0
        }));

        if (timeRange === 'daily') {
            return enrichedData.map(item => ({
                ...item,
                percentage: parseFloat(item.percentage.toFixed(1))
            }));
        }

        const grouped = {};

        enrichedData.forEach(item => {
            const date = new Date(item.date);
            let key;

            if (timeRange === 'weekly') {
                const firstDay = new Date(date);
                firstDay.setDate(date.getDate() - date.getDay()); // Sunday
                key = `Week of ${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            } else if (timeRange === 'monthly') {
                key = `${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`;
            }

            if (!grouped[key]) {
                grouped[key] = {
                    date: key,
                    sessions: 0,
                    present: 0,
                    expected: 0,
                    totalStudents: 0, // Will be sum of daily totalStudents
                    count: 0 // To average totalStudents
                };
            }

            grouped[key].sessions += item.sessions;
            grouped[key].present += item.present;
            grouped[key].expected += item.expected;
            grouped[key].totalStudents += item.totalStudents;
            grouped[key].count++;
        });

        return Object.values(grouped).map(item => ({
            ...item,
            // For aggregated data, totalStudents might be sum of unique students or average.
            // Here, we'll use the sum of expected students for percentage calculation.
            // If totalStudents is meant to be unique students over the period, this needs backend support.
            // For now, using 'expected' as the denominator for percentage.
            percentage: item.expected > 0 ? parseFloat(((item.present / item.expected) * 100).toFixed(1)) : 0,
            absent: item.expected - item.present,
            totalStudents: item.totalStudents // Sum of totalStudents over the period
        }));
    };

    const chartData = processData();

    const handleExport = () => {
        if (!analytics) return;
        const csvRows = [];
        const headers = ['Date', 'Sessions', 'Present', 'Absent', 'Percentage'];
        csvRows.push(headers.join(','));

        analytics.timeline.forEach(row => {
            // Ensure row has absent and percentage, calculate if not present
            const absent = (row.expected || row.totalStudents || 0) - row.present;
            const percentage = (row.expected || row.totalStudents || 0) > 0 ? ((row.present / (row.expected || row.totalStudents)) * 100).toFixed(1) : 0;

            csvRows.push([
                row.date,
                row.sessions,
                row.present,
                absent,
                `${percentage}%`
            ].join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${filters.startDate}.csv`;
        a.click();
    };

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 ring-1 ring-slate-900/5">
                    <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">{label}</p>
                    <div className="space-y-1 text-xs">
                        <p className="flex justify-between gap-4">
                            <span className="text-slate-500">Total Students:</span>
                            <span className="font-mono font-medium text-slate-700">{data.totalStudents || 'N/A'}</span>
                        </p>
                        <p className="flex justify-between gap-4">
                            <span className="text-slate-500">Sessions:</span>
                            <span className="font-mono font-medium text-indigo-600">{data.sessions}</span>
                        </p>
                        <div className="h-px bg-slate-100 my-2"></div>
                        <p className="flex justify-between gap-4">
                            <span className="text-emerald-600 font-medium">Present:</span>
                            <span className="font-mono font-bold text-emerald-700">{data.present}</span>
                        </p>
                        <p className="flex justify-between gap-4">
                            <span className="text-rose-500 font-medium">Absent:</span>
                            <span className="font-mono font-bold text-rose-600">
                                {data.absent}
                                <span className="ml-1 text-[10px] opacity-80">
                                    ({(100 - data.percentage).toFixed(1)}%)
                                </span>
                            </span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-10 animate-fade-in transition-colors duration-500">
            {/* Header & Filters */}
            <div className="premium-card p-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    <div>
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider mb-2 border border-primary-100 dark:border-primary-500/20">
                            <TrendingUp size={12} />
                            <span>Live Analytics</span>
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center">
                            Attendance Insights
                        </h2>
                    </div>
                    <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200 mr-2">
                            {['daily', 'weekly', 'monthly'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all ${timeRange === range
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="bg-transparent border-none text-sm focus:ring-0 p-1"
                            />
                            <span className="text-slate-400 px-1">-</span>
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="bg-transparent border-none text-sm focus:ring-0 p-1"
                            />
                        </div>

                        <button
                            onClick={() => setViewMode(viewMode === 'charts' ? 'report' : 'charts')}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'report'
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {viewMode === 'charts' ? <Search size={16} /> : <BarChart2 size={16} />}
                            <span>{viewMode === 'charts' ? 'View Detailed Report' : 'Show Charts'}</span>
                        </button>

                        <button onClick={fetchAnalytics} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
                            <RefreshCcw size={18} />
                        </button>
                        <button onClick={handleExport} disabled={!analytics} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50">
                            <FileSpreadsheet size={18} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <select
                        name="department"
                        value={filters.department}
                        onChange={handleFilterChange}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select
                        name="program"
                        value={filters.program}
                        onChange={handleFilterChange}
                        disabled={!filters.department}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    >
                        <option value="">All Programs</option>
                        {programs.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    <select
                        name="year"
                        value={filters.year}
                        onChange={handleFilterChange}
                        disabled={!filters.program}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    >
                        <option value="">All Years</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    <select
                        name="semester"
                        value={filters.semester}
                        onChange={handleFilterChange}
                        disabled={!filters.year}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    >
                        <option value="">All Semesters</option>
                        {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select
                        name="section"
                        value={filters.section}
                        onChange={handleFilterChange}
                        disabled={!filters.semester}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    >
                        <option value="">All Sections</option>
                        {sections.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Live Sessions Ticker */}
            {liveSessions.length > 0 && viewMode === 'charts' && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wifi size={100} className="text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-red-700 flex items-center mb-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                        Live Active Sessions ({liveSessions.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {liveSessions.map(session => (
                            <div key={session.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800 dark:text-white">{session.subject}</h4>
                                    <span className="text-xs font-mono bg-red-100 text-red-600 px-2 py-1 rounded">LIVE</span>
                                </div>
                                <div className="text-sm text-slate-600 space-y-1">
                                    <p className="flex items-center"><Users size={14} className="mr-2 opacity-70" /> Faculty: {session.facultyName}</p>
                                    <p className="flex items-center"><MapPin size={14} className="mr-2 opacity-70" /> {session.section || 'N/A'}</p>
                                    <p className="flex items-center text-xs text-slate-400 mt-2">Started: {new Date(session.createdAt).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            {!loading && !error && analytics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="premium-card p-10 group hover:scale-[1.02] relative overflow-hidden">
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl"></div>
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="p-4 bg-primary-50 dark:bg-primary-500/10 rounded-3xl text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform shadow-sm">
                                <BookOpen size={28} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Activity</span>
                        </div>
                        <h4 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                            {analytics.overview.totalSessions}
                        </h4>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2 uppercase tracking-wide">Total Sessions</p>
                    </div>

                    <div className="premium-card p-10 group hover:scale-[1.02] relative overflow-hidden">
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shadow-sm">
                                <Users size={28} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Presence</span>
                        </div>
                        <h4 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                            {analytics.overview.totalAttendance}
                        </h4>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2 uppercase tracking-wide">Total Present</p>
                    </div>

                    <div className="premium-card p-10 group hover:scale-[1.02] relative overflow-hidden">
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-3xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform shadow-sm">
                                <TrendingUp size={28} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Efficiency</span>
                        </div>
                        <h4 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                            {analytics.overview.averageAttendance}
                        </h4>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2 uppercase tracking-wide">Avg Class size</p>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            {!loading && !error && analytics && analytics.overview.totalSessions > 0 && viewMode === 'charts' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Attendance Timeline */}
                    <div className="premium-card p-10">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center uppercase tracking-[0.1em]">
                                <Activity className="mr-3 text-primary-500" size={20} />
                                Analytics Timeline
                            </h3>
                        </div>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorSession" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.4} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                        dy={15}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                        unit="%"
                                    />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Bar
                                        yAxisId="left"
                                        dataKey="sessions"
                                        fill="url(#colorSession)"
                                        radius={[12, 12, 0, 0]}
                                        stroke="#8b5cf6"
                                        strokeWidth={1}
                                        barSize={32}
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="percentage"
                                        stroke="#ec4899"
                                        strokeWidth={4}
                                        dot={{ r: 5, strokeWidth: 3, fill: 'white', stroke: '#ec4899' }}
                                        activeDot={{ r: 8, strokeWidth: 0, shadowSize: 0 }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Subject Analysis */}
                    <div className="premium-card p-10">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center uppercase tracking-[0.1em]">
                                <BookOpen className="mr-3 text-primary-500" size={20} />
                                Subject Density
                            </h3>
                        </div>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={analytics?.subjectPerformance || []}
                                    layout="vertical"
                                    margin={{ left: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" opacity={0.4} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="subject"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                                        width={100}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: 'rgba(139, 92, 246, 0.05)', radius: 12 }}
                                        contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar
                                        dataKey="avgPresent"
                                        radius={[0, 12, 12, 0]}
                                        barSize={28}
                                    >
                                        {(analytics?.subjectPerformance || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#ec4899'} fillOpacity={0.9} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
            {/* Report Table / Empty State Logic */}
            {!loading && !error && analytics && analytics.overview.totalSessions > 0 && viewMode === 'report' && (
                <div className="premium-card overflow-hidden animate-fade-in relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 relative z-10">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
                            <Table className="mr-3 text-primary-500" size={20} />
                            Detailed Performance Data
                        </h3>
                    </div>
                    <div className="overflow-x-auto relative z-10">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase font-bold text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5 text-center">Sessions</th>
                                    <th className="px-8 py-5 text-center">Present</th>
                                    <th className="px-8 py-5 text-center">Absent</th>
                                    <th className="px-8 py-5 text-right">Attendance %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {analytics.timeline.map((row, index) => {
                                    const absent = (row.expected || row.totalStudents || 0) - row.present;
                                    const percentage = (row.expected || row.totalStudents || 0) > 0 ? ((row.present / (row.expected || row.totalStudents)) * 100).toFixed(1) : 0;
                                    return (
                                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                                            <td className="px-8 py-5 font-mono text-slate-800 dark:text-slate-200 font-medium">{row.date}</td>
                                            <td className="px-8 py-5 text-center">{row.sessions}</td>
                                            <td className="px-8 py-5 text-center text-emerald-600 dark:text-emerald-400 font-bold">{row.present}</td>
                                            <td className="px-8 py-5 text-center text-rose-500 dark:text-rose-400">{absent}</td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold ${percentage >= 75 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                    percentage >= 50 ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                        'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                    }`}>
                                                    {percentage}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && !error && (!analytics || analytics.overview.totalSessions === 0) && (
                <div className="premium-card p-20 text-center animate-fade-in relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-800/20 "></div>
                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-xl border border-slate-100 dark:border-slate-700">
                            <BarChart2 size={40} className="text-primary-500 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">No Data Available</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                            Adjust your filters to see attendance insights or wait for sessions to be recorded.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAttendanceDashboard;
