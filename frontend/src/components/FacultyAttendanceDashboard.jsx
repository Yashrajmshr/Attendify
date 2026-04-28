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

const FacultyAttendanceDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [liveSessions, setLiveSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('charts'); // 'charts' or 'report'
    const [timeRange, setTimeRange] = useState('daily'); // 'daily', 'weekly', 'monthly'

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

        const interval = setInterval(fetchLiveSessions, 30000);
        return () => clearInterval(interval);
    }, [filters.subjectId, filters.section, filters.startDate, filters.endDate]);

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
                <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 ring-1 ring-slate-900/5">
                    <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">{label}</p>
                    <div className="space-y-1 text-xs">
                        <p className="flex justify-between gap-4">
                            <span className="text-slate-500">Class Size:</span>
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

    if (loading && !analytics) return <DashboardSkeleton />;

    return (
        <div className="space-y-8 animate-fade-in transition-colors duration-500 p-2">
            {/* Header & Filters */}
            <div className="premium-card p-6 md:p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    <div>
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider mb-2 border border-primary-100 dark:border-primary-500/20">
                            <TrendingUp size={12} />
                            <span>Faculty Analytics</span>
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                            Personal Statistics
                        </h2>
                    </div>
                    <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                            {['daily', 'weekly', 'monthly'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all ${timeRange === range
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                            <input
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="bg-transparent border-none text-xs focus:ring-0 p-1 dark:text-white"
                            />
                            <span className="text-slate-400 px-1">-</span>
                            <input
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="bg-transparent border-none text-xs focus:ring-0 p-1 dark:text-white"
                            />
                        </div>

                        <button
                            onClick={() => setViewMode(viewMode === 'charts' ? 'report' : 'charts')}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'report'
                                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            {viewMode === 'charts' ? <Search size={16} /> : <BarChart2 size={16} />}
                            <span>{viewMode === 'charts' ? 'Report' : 'Charts'}</span>
                        </button>

                        <button onClick={fetchAnalytics} className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100">
                            <RefreshCcw size={18} />
                        </button>
                        <button onClick={handleExport} disabled={!analytics} className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 disabled:opacity-50">
                            <FileSpreadsheet size={18} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <select
                            name="subjectId"
                            value={filters.subjectId}
                            onChange={handleFilterChange}
                            className="w-full appearance-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white"
                        >
                            <option value="">All My Subjects</option>
                            {mySubjects.map((s, i) => {
                                const val = s.name && s.code ? `${s.name} (${s.code})` : (s.name || s.subject || s);
                                return <option key={i} value={val}>{val}</option>
                            })}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            name="section"
                            value={filters.section}
                            onChange={handleFilterChange}
                            className="w-full appearance-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white"
                        >
                            <option value="">All My Sections</option>
                            {availableSections.map((s, i) => (
                                <option key={i} value={s}>Section {s}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Live Sessions Ticker */}
            {liveSessions.length > 0 && viewMode === 'charts' && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/5 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wifi size={100} className="text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center mb-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                        Live Active Sessions ({liveSessions.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {liveSessions.map(session => (
                            <div key={session.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800 dark:text-white">{session.subject}</h4>
                                    <span className="text-[10px] font-mono bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-1 rounded">LIVE</span>
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                    <p className="flex items-center"><MapPin size={14} className="mr-2 opacity-70" /> {session.section || 'N/A'}</p>
                                    <p className="flex items-center text-xs text-slate-400 mt-2">Started: {new Date(session.createdAt).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            {!loading && analytics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="premium-card p-6 group hover:scale-[1.02] relative overflow-hidden border-none bg-indigo-50 dark:bg-indigo-900/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-sm">
                                <BookOpen size={24} />
                            </div>
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Sessions</span>
                        </div>
                        <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
                            {analytics.overview.totalSessions}
                        </h4>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Conducted Classes</p>
                    </div>

                    <div className="premium-card p-6 group hover:scale-[1.02] relative overflow-hidden border-none bg-emerald-50 dark:bg-emerald-900/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-emerald-600 dark:text-emerald-400 shadow-sm">
                                <Users size={24} />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Attendance</span>
                        </div>
                        <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
                            {analytics.overview.totalAttendance}
                        </h4>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Total Presentations</p>
                    </div>

                    <div className="premium-card p-6 group hover:scale-[1.02] relative overflow-hidden border-none bg-amber-50 dark:bg-amber-900/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-amber-600 dark:text-amber-400 shadow-sm">
                                <TrendingUp size={24} />
                            </div>
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Engagement</span>
                        </div>
                        <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
                            {analytics.overview.averageAttendance}
                        </h4>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">Avg Students / Class</p>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {!loading && analytics && analytics.overview.totalSessions > 0 ? (
                viewMode === 'charts' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="premium-card p-6 md:p-8">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center uppercase tracking-widest mb-8">
                                <Activity className="mr-3 text-indigo-500" size={18} />
                                Trend Analysis
                            </h3>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorSessionFac" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.4} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={10} />
                                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} unit="%" />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Bar yAxisId="left" dataKey="sessions" fill="url(#colorSessionFac)" radius={[8, 8, 0, 0]} stroke="#6366f1" strokeWidth={1} barSize={24} />
                                        <Line yAxisId="right" type="monotone" dataKey="percentage" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#ec4899' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="premium-card p-6 md:p-8">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center uppercase tracking-widest mb-8">
                                <BookOpen className="mr-3 text-indigo-500" size={18} />
                                Subject Density
                            </h3>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics?.subjectPerformance || []} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" opacity={0.4} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} width={80} />
                                        <RechartsTooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)', radius: 8 }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                        <Bar dataKey="avgPresent" radius={[0, 8, 8, 0]} barSize={20}>
                                            {(analytics?.subjectPerformance || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#ec4899'} fillOpacity={0.9} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="premium-card overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center uppercase tracking-widest">
                                <Table className="mr-3 text-indigo-500" size={18} />
                                Analysis Log
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                                <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-300 uppercase font-bold text-[9px] tracking-widest border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4 text-center">Sessions</th>
                                        <th className="px-6 py-4 text-center">Present</th>
                                        <th className="px-6 py-4 text-center">Absent</th>
                                        <th className="px-6 py-4 text-right">Attendance %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {analytics.timeline.map((row, index) => {
                                        const absent = (row.expected || row.totalStudents || 0) - row.present;
                                        const percentage = (row.expected || row.totalStudents || 0) > 0 ? ((row.present / (row.expected || row.totalStudents)) * 100).toFixed(1) : 0;
                                        return (
                                            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-6 py-4 font-mono text-slate-800 dark:text-slate-200">{row.date}</td>
                                                <td className="px-6 py-4 text-center">{row.sessions}</td>
                                                <td className="px-6 py-4 text-center text-emerald-600 font-bold">{row.present}</td>
                                                <td className="px-6 py-4 text-center text-rose-500">{absent}</td>
                                                <td className="px-6 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400">{percentage}%</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            ) : !loading && (
                <div className="premium-card p-20 text-center">
                    <BarChart2 size={48} className="text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400 mb-2">No Records Found</h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto">Try adjusting the filters or date range to see your analytics data.</p>
                </div>
            )
            }
        </div>
    );
};

export default FacultyAttendanceDashboard;
