import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    LayoutDashboard, Users, BookOpen, Clock, Calendar,
    BarChart2, TrendingUp, RefreshCcw, Wifi, MapPin, FileSpreadsheet, Search, Table, Activity, ChevronDown
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    BarChart, Bar, ComposedChart, Cell
} from 'recharts';
import { DashboardSkeleton } from './Skeleton';
import LiveAttendanceMonitor from './LiveAttendanceMonitor';

const FacultyAttendanceDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [liveSessions, setLiveSessions] = useState([]);
    const [activeMonitorSession, setActiveMonitorSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('charts'); // 'charts', 'report', 'sessions'
    const [timeRange, setTimeRange] = useState('daily'); // 'daily', 'weekly', 'monthly'
    const [allSessions, setAllSessions] = useState([]);

    // Faculty specific data
    const [mySubjects, setMySubjects] = useState([]);
    const [availableSections, setAvailableSections] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        subjectId: '',
        section: '',
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchFacultyMeta();
    }, []);

    useEffect(() => {
        fetchAnalytics();
        fetchLiveSessions();
        fetchAllSessions();

        const interval = setInterval(fetchLiveSessions, 30000);
        return () => clearInterval(interval);
    }, [filters.subjectId, filters.section, filters.startDate, filters.endDate]);

    const fetchAllSessions = async () => {
        try {
            const { data } = await api.get('/session');
            setAllSessions(data || []);
        } catch (err) {
            console.error('Failed to fetch sessions history', err);
        }
    };

    const fetchFacultyMeta = async () => {
        try {
            const { data } = await api.get('/subjects/my-subjects');
            const subjects = data.subjects || (data.subject ? [data.subject] : []);
            setMySubjects(subjects);
            setAvailableSections(data.sections || []);

            // Set default filters
            if (subjects.length > 0) {
                const s = subjects[0];
                const subjectVal = `${s.name} (${s.code})`;
                setFilters(prev => ({
                    ...prev,
                    subjectId: subjectVal,
                    section: data.sections && data.sections.length > 0 ? data.sections[0] : prev.section
                }));
            }
        } catch (err) {
            console.error('Failed to load metadata', err);
        }
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const { data } = await api.get(`/attendance/analytics?${queryParams}`);
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
            const { data } = await api.get(`/attendance/live?${queryParams}`);
            setLiveSessions(data);
        } catch (err) {
            console.error('Failed to fetch live sessions', err);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const processData = () => {
        if (!analytics || !analytics.timeline) return [];

        const data = analytics.timeline;
        const enrichedData = data.map(item => ({
            ...item,
            expected: item.expected || item.totalStudents || 0,
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
                firstDay.setDate(date.getDate() - date.getDay());
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
                    totalStudents: 0,
                    count: 0
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
            percentage: item.expected > 0 ? parseFloat(((item.present / item.expected) * 100).toFixed(1)) : 0,
            absent: item.expected - item.present,
            totalStudents: item.totalStudents
        }));
    };

    const chartData = processData();

    const handleExport = () => {
        if (!analytics) return;
        const csvRows = [];
        const headers = ['Date', 'Sessions', 'Present', 'Absent', 'Percentage'];
        csvRows.push(headers.join(','));

        analytics.timeline.forEach(row => {
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
        a.download = `faculty_attendance_report_${filters.startDate}.csv`;
        a.click();
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white/95 dark:bg-slate-950/95 p-4.5 rounded-2xl shadow-xl border border-slate-200/40 dark:border-white/5 backdrop-blur-md">
                    <p className="text-xs font-black text-slate-800 dark:text-white mb-2">{label}</p>
                    <div className="space-y-2 text-[10px] font-bold uppercase tracking-wider">
                        <p className="flex justify-between gap-6">
                            <span className="text-slate-400">Class Size:</span>
                            <span className="font-mono text-slate-800 dark:text-slate-200">{data.totalStudents || 'N/A'}</span>
                        </p>
                        <p className="flex justify-between gap-6">
                            <span className="text-slate-400">Sessions:</span>
                            <span className="font-mono text-indigo-500">{data.sessions}</span>
                        </p>
                        <div className="h-px bg-slate-250 dark:bg-slate-800/50 my-1.5"></div>
                        <p className="flex justify-between gap-6">
                            <span className="text-emerald-500">Present:</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400">{data.present}</span>
                        </p>
                        <p className="flex justify-between gap-6">
                            <span className="text-rose-500">Absent:</span>
                            <span className="font-mono text-rose-600 dark:text-rose-450">
                                {data.absent}
                                <span className="ml-1 text-[9px] opacity-75">
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

    if (loading && !analytics) return <DashboardSkeleton />;

    if (activeMonitorSession) {
        return (
            <div className="p-4 md:p-6">
                <div className="premium-card p-6 md:p-8 relative overflow-hidden bg-white/70 dark:bg-slate-950/40 backdrop-blur-2xl">
                    <LiveAttendanceMonitor
                        session={activeMonitorSession}
                        onClose={() => {
                            setActiveMonitorSession(null);
                            fetchAllSessions();
                            fetchLiveSessions();
                        }}
                    />
                </div>
            </div>
        );
    }

    // Filter sessions history based on active dashboard criteria
    const filteredSessionsHistory = allSessions.filter(s => {
        if (filters.subjectId) {
            const querySub = filters.subjectId.toLowerCase();
            const sessSub = (s.subject || '').toLowerCase();
            const matchSubject = querySub.includes(sessSub) || sessSub.includes(querySub);
            if (!matchSubject) return false;
        }
        if (filters.section) {
            if (s.section !== filters.section) return false;
        }
        if (filters.startDate) {
            const start = new Date(filters.startDate);
            const sessDate = new Date(s.createdAt);
            if (sessDate < start) return false;
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate + 'T23:59:59');
            const sessDate = new Date(s.createdAt);
            if (sessDate > end) return false;
        }
        return true;
    });

    return (
        <div className="p-4 md:p-6 space-y-8">
            
            {/* Header & Controls Toolbar */}
            <div className="premium-card p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                
                <div className="relative flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-5">
                    <div>
                        <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-wider mb-2 border border-primary-500/10">
                            <TrendingUp size={12} />
                            <span>Faculty Insights</span>
                        </span>
                        <h2 className="text-2xl font-black text-slate-805 dark:text-white tracking-tight">
                            Attendance Analytics
                        </h2>
                    </div>

                    <div className="flex items-center space-x-3.5 flex-wrap gap-y-3.5 w-full xl:w-auto">
                        
                        {/* Daily/Weekly/Monthly Buttons */}
                        <div className="flex items-center bg-slate-100/60 dark:bg-slate-950/40 rounded-2xl p-1 border border-slate-200/40 dark:border-white/5">
                            {['daily', 'weekly', 'monthly'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                        timeRange === range
                                            ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>

                        {/* Date Pickers */}
                        <div className="flex items-center bg-slate-100/60 dark:bg-slate-950/40 rounded-2xl p-1.5 border border-slate-200/40 dark:border-white/5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="bg-transparent border-none focus:ring-0 p-1 dark:text-white outline-none cursor-pointer"
                            />
                            <span className="text-slate-400 dark:text-slate-600 px-1">to</span>
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="bg-transparent border-none focus:ring-0 p-1 dark:text-white outline-none cursor-pointer"
                            />
                        </div>

                        {/* Toggle View mode */}
                        <div className="flex items-center bg-slate-100/60 dark:bg-slate-950/40 rounded-2xl p-1 border border-slate-200/40 dark:border-white/5">
                            {[
                                { key: 'charts', label: 'Charts', icon: BarChart2 },
                                { key: 'report', label: 'Summary Log', icon: Table },
                                { key: 'sessions', label: 'Lectures Roster', icon: Users },
                            ].map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => setViewMode(opt.key)}
                                    className={`flex items-center space-x-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                        viewMode === opt.key
                                            ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    <opt.icon size={12} />
                                    <span>{opt.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center space-x-2.5">
                            <button onClick={fetchAnalytics} className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-450 border border-indigo-500/10 rounded-2xl hover:bg-indigo-500/20 transition-all">
                                <RefreshCcw size={16} />
                            </button>
                            <button onClick={handleExport} disabled={!analytics} className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/10 rounded-2xl hover:bg-emerald-500/20 transition-all disabled:opacity-40">
                                <FileSpreadsheet size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dropdowns filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                    <div className="relative">
                        <select
                            name="subjectId"
                            value={filters.subjectId}
                            onChange={handleFilterChange}
                            className="glass-select text-xs font-bold"
                        >
                            <option value="" className="dark:bg-slate-900">All Assigned Subjects</option>
                            {mySubjects.map((s, i) => {
                                const val = s.name && s.code ? `${s.name} (${s.code})` : (s.name || s.subject || s);
                                return <option key={i} value={val} className="dark:bg-slate-900">{val}</option>
                            })}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-4.5 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            name="section"
                            value={filters.section}
                            onChange={handleFilterChange}
                            className="glass-select text-xs font-bold"
                        >
                            <option value="" className="dark:bg-slate-900">All Assigned Sections</option>
                            {availableSections.map((s, i) => (
                                <option key={i} value={s} className="dark:bg-slate-900">Section {s}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-4.5 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Live Ticker Indicator */}
            {liveSessions.length > 0 && viewMode === 'charts' && (
                <div className={`bg-gradient-to-r from-red-500/5 to-rose-500/5 p-6 rounded-[2rem] border border-red-500/20 shadow-sm relative overflow-hidden ${!activeMonitorSession ? 'animate-pulse' : ''}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Wifi size={100} className="text-red-500" />
                    </div>
                    
                    <h3 className="text-sm font-black text-red-650 dark:text-red-400 flex items-center mb-4 uppercase tracking-wider">
                        <span className="w-2.5 h-2.5 bg-red-550 rounded-full mr-2.5 shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-ping"></span>
                        Active Attendance Portals ({liveSessions.length})
                    </h3>
                    
                    {activeMonitorSession ? (
                        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-red-500/10">
                            <LiveAttendanceMonitor
                                session={activeMonitorSession}
                                onClose={() => {
                                    setActiveMonitorSession(null);
                                    fetchAllSessions();
                                    fetchLiveSessions();
                                }}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {liveSessions.map(session => (
                                <div key={session.id} className="bg-white/50 dark:bg-slate-950/20 backdrop-blur-sm p-5 rounded-2xl border border-red-500/20 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-bold text-slate-850 dark:text-white text-sm truncate max-w-[80%]">{session.subject}</h4>
                                            <span className="text-[9px] font-black bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded border border-red-500/15">LIVE</span>
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 font-medium">
                                            <p className="flex items-center"><MapPin size={13} className="mr-2 opacity-60 text-red-450" /> {session.section ? `Section ${session.section}` : 'All Sections'}</p>
                                            <p className="flex items-center text-[10px] text-slate-400 mt-2">Started: {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setActiveMonitorSession(session)} 
                                        className="mt-4 w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-red-500/10 flex items-center justify-center space-x-1.5"
                                    >
                                        <Activity size={12} />
                                        <span>Monitor Live</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* KPI Cards Board */}
            {!loading && analytics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    <div className="premium-card p-6 border-l-4 border-l-indigo-500 relative overflow-hidden group hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                                <BookOpen size={22} />
                            </div>
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Total sessions</span>
                        </div>
                        <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                            {analytics.overview.totalSessions}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-1 uppercase tracking-wider">Conducted classes</p>
                    </div>

                    <div className="premium-card p-6 border-l-4 border-l-emerald-500 relative overflow-hidden group hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-2xl">
                                <Users size={22} />
                            </div>
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Aggregate Count</span>
                        </div>
                        <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                            {analytics.overview.totalAttendance}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-455 dark:text-slate-500 mt-1 uppercase tracking-wider">Student Presences</p>
                    </div>

                    <div className="premium-card p-6 border-l-4 border-l-amber-500 relative overflow-hidden group hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-450 rounded-2xl">
                                <Activity size={22} />
                            </div>
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Avg Attendance</span>
                        </div>
                        <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                            {analytics.overview.averageAttendance}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-1 uppercase tracking-wider">Students Per Lecture</p>
                    </div>

                </div>
            )}

            {/* Content Display (Charts / Tables) */}
            {!loading && analytics && analytics.overview.totalSessions > 0 ? (
                viewMode === 'charts' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* Curve & Bar Trend Analysis */}
                        <div className="premium-card p-6 md:p-8">
                            <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center uppercase tracking-widest mb-6">
                                <Activity className="mr-2.5 text-indigo-500" size={16} />
                                Trend Performance
                            </h3>
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData}>
                                        <defs>
                                            <linearGradient id="sessionGlow" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.01} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} dy={8} />
                                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} />
                                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} unit="%" />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Bar yAxisId="left" dataKey="sessions" fill="url(#sessionGlow)" radius={[6, 6, 0, 0]} stroke="#7c3aed" strokeWidth={1.5} barSize={20} />
                                        <Line yAxisId="right" type="monotone" dataKey="percentage" stroke="#db2777" strokeWidth={3} dot={{ r: 3.5, strokeWidth: 2, fill: 'white', stroke: '#db2777' }} activeDot={{ r: 5, strokeWidth: 0 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Subject Density Chart */}
                        <div className="premium-card p-6 md:p-8">
                            <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center uppercase tracking-widest mb-6">
                                <BookOpen className="mr-2.5 text-indigo-500" size={16} />
                                Subject Density
                            </h3>
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics?.subjectPerformance || []} layout="vertical" margin={{ left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" opacity={0.2} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 800 }} width={90} />
                                        <RechartsTooltip cursor={{ fill: 'rgba(124, 58, 237, 0.03)', radius: 6 }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }} />
                                        <Bar dataKey="avgPresent" radius={[0, 6, 6, 0]} barSize={16}>
                                            {(analytics?.subjectPerformance || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#7c3aed' : '#db2777'} fillOpacity={0.95} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                ) : viewMode === 'report' ? (
                    
                    /* Analysis Log Grid Table */
                    <div className="premium-card overflow-hidden">
                        <div className="p-6 border-b border-slate-200/40 dark:border-slate-800/40 flex justify-between items-center bg-slate-50/40 dark:bg-slate-950/20">
                            <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center uppercase tracking-widest">
                                <Table className="mr-2.5 text-indigo-500" size={16} />
                                Timeline Registry Log
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                                <thead className="bg-slate-50/50 dark:bg-slate-900/40 text-slate-505 dark:text-slate-400 uppercase font-black text-[9px] tracking-widest border-b border-slate-200/40 dark:border-slate-800/40">
                                    <tr>
                                        <th className="px-6 py-4">Session Date</th>
                                        <th className="px-6 py-4 text-center">Lectures Run</th>
                                        <th className="px-6 py-4 text-center">Presences</th>
                                        <th className="px-6 py-4 text-center">Absences</th>
                                        <th className="px-6 py-4 text-right">Attendance Index</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                    {analytics.timeline.map((row, index) => {
                                        const absent = (row.expected || row.totalStudents || 0) - row.present;
                                        const percentage = (row.expected || row.totalStudents || 0) > 0 ? ((row.present / (row.expected || row.totalStudents)) * 100).toFixed(1) : 0;
                                        
                                        return (
                                            <tr key={index} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/10 transition-colors">
                                                <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-300">{row.date}</td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-355">{row.sessions}</td>
                                                <td className="px-6 py-4 text-center text-emerald-600 dark:text-emerald-450 font-black">{row.present}</td>
                                                <td className="px-6 py-4 text-center text-rose-500 font-medium">{absent}</td>
                                                <td className="px-6 py-4 text-right font-black text-indigo-600 dark:text-indigo-400">{percentage}%</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Lecture Sessions Registry */
                    <div className="space-y-6">
                        <div className="premium-card p-6 border-b border-slate-200/40 dark:border-slate-800/40 flex justify-between items-center bg-slate-50/40 dark:bg-slate-950/20">
                            <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center uppercase tracking-widest">
                                <Users className="mr-2.5 text-indigo-500" size={16} />
                                Conducted Lectures Registry
                            </h3>
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full font-black uppercase">
                                {filteredSessionsHistory.length} Lectures Total
                            </span>
                        </div>
                        {filteredSessionsHistory.length === 0 ? (
                            <div className="premium-card p-16 text-center">
                                <Activity size={32} className="mx-auto mb-3 opacity-40 text-slate-400" />
                                <p className="text-xs font-bold uppercase tracking-wider">No Lectures Found</p>
                                <p className="text-[10px] text-slate-400 mt-1">Adjust filters or date range to view conducted lectures.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredSessionsHistory.map(session => (
                                    <div key={session._id} className="premium-card p-5 hover:shadow-md transition-all flex flex-col justify-between border-slate-200/40 dark:border-white/5 relative overflow-hidden bg-white/50 dark:bg-slate-950/10">
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-bold text-slate-850 dark:text-white text-sm truncate max-w-[70%]">{session.subject}</h4>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                                                    session.isActive 
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20 animate-pulse' 
                                                        : 'bg-slate-105 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-205 dark:border-slate-700'
                                                }`}>
                                                    {session.isActive ? 'LIVE' : 'CLOSED'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 font-medium">
                                                <p className="flex items-center">
                                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
                                                    Section {session.section || 'All'}
                                                </p>
                                                <p className="flex items-center text-[10px] text-slate-400 font-mono">
                                                    Date: {new Date(session.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
                                                </p>
                                                <p className="flex items-center text-[10px] text-slate-400 font-mono">
                                                    Time: {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setActiveMonitorSession(session)} 
                                            className="mt-4 w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-indigo-500/10 flex items-center justify-center space-x-1.5"
                                        >
                                            <Users size={12} />
                                            <span>Inspect Roster</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            ) : !loading && (
                <div className="premium-card p-20 text-center">
                    <BarChart2 size={44} className="text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                    <h3 className="text-base font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">No Registry Found</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Adjust filters, date range, or subject criteria to evaluate historical records.</p>
                </div>
            )}
        </div>
    );
};

export default FacultyAttendanceDashboard;
