import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ScanAttendance from '../components/ScanAttendance';
import StudentHistory from '../components/StudentHistory';
import LeaveApplication from '../components/LeaveApplication';
import StudentNotifications from '../components/StudentNotifications';
import StudentProfileSettings from '../components/StudentProfileSettings';
import ThemeToggle from '../components/ThemeToggle';
import api from '../api/axios';
import { 
    LogOut, History, Users, Calendar, Bell, Activity, 
    CheckCircle, AlertTriangle, Clock, BookOpen, Sliders 
} from 'lucide-react';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/attendance/my');
                setAttendance(data || []);
            } catch (err) {
                console.error("Failed to load student attendance logs", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, [activeTab]);

    // Format time ago for recent check-ins list
    const formatCheckinTime = (isoString) => {
        try {
            const date = new Date(isoString);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();
            
            const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            if (isToday) return `Today, ${timeStr}`;
            
            const yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);
            const isYesterday = date.toDateString() === yesterday.toDateString();
            if (isYesterday) return `Yesterday, ${timeStr}`;
            
            return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${timeStr}`;
        } catch (e) {
            return 'Recently';
        }
    };

    // Calculate Real Stats from database logs
    const attended = attendance.filter(r => r.status === 'P' || r.status === 'Present').length;
    const totalClasses = attendance.length;
    const missed = attendance.filter(r => r.status === 'A' || r.status === 'Absent').length;
    const attendanceRate = totalClasses > 0 ? ((attended / totalClasses) * 100).toFixed(1) : '0.0';
    const lateChecks = attendance.filter(r => r.status === 'Late' || r.status === 'L').length;

    // Compile subject statistics dynamically from database logs
    const subjectStats = {};
    attendance.forEach(record => {
        const subName = record.sessionId?.subject || 'Unknown Subject';
        if (!subjectStats[subName]) {
            subjectStats[subName] = { attended: 0, total: 0 };
        }
        subjectStats[subName].total += 1;
        if (record.status === 'P' || record.status === 'Present') {
            subjectStats[subName].attended += 1;
        }
    });

    const displaySubjects = Object.keys(subjectStats).map(name => {
        const stats = subjectStats[name];
        const rate = stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0;
        return { name, rate };
    });

    // Compile check-ins list dynamically from database logs (last 3 items)
    const displayCheckins = attendance.slice(0, 3).map(record => {
        const name = record.sessionId?.subject || 'Unknown Subject';
        const code = record.sessionId?.code || 'CS302';
        const room = record.sessionId?.room || 'Main Lab';
        const isLate = record.status === 'Late' || record.status === 'L';
        const date = record.createdAt ? formatCheckinTime(record.createdAt) : 'Recently';
        return { name, code, room, isLate, date };
    });

    // Compile monthly trend dynamically from database logs (last 6 months)
    const getMonthlyTrend = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            last6Months.push({
                name: months[d.getMonth()].toUpperCase(),
                monthIndex: d.getMonth(),
                year: d.getFullYear(),
                attended: 0,
                total: 0
            });
        }

        attendance.forEach(record => {
            if (!record.createdAt) return;
            const date = new Date(record.createdAt);
            const monthIndex = date.getMonth();
            const year = date.getFullYear();

            const monthBucket = last6Months.find(m => m.monthIndex === monthIndex && m.year === year);
            if (monthBucket) {
                monthBucket.total += 1;
                if (record.status === 'P' || record.status === 'Present') {
                    monthBucket.attended += 1;
                }
            }
        });

        return last6Months.map(m => {
            const rate = m.total > 0 ? Math.round((m.attended / m.total) * 100) : 0;
            return { name: m.name, rate };
        });
    };

    const monthlyTrendData = getMonthlyTrend();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f10] flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-hidden relative">
            {/* Ambient background glow effect */}
            <div className="absolute top-[-10%] left-[-15%] w-[45vw] h-[45vw] rounded-full bg-primary-500/5 dark:bg-primary-500/10 blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[-10%] right-[-15%] w-[45vw] h-[45vw] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] pointer-events-none z-0"></div>

            {/* Sidebar Navigation */}
            <aside className="w-[310px] premium-sidebar hidden xl:flex flex-col z-35 m-6 rounded-[2.25rem] shadow-premium border border-slate-200/40 dark:border-white/5 relative bg-white/70 dark:bg-[#101415]/40 backdrop-blur-2xl">
                <div className="p-8">
                    <div className="flex items-center space-x-3.5 group cursor-pointer" onClick={() => setActiveTab('overview')}>
                        <div className="w-11 h-11 gradient-bg rounded-2xl flex items-center justify-center text-white shadow-active-primary group-hover:scale-105 transition-all duration-300">
                            <Users size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                                Attendify
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-500 mt-1">Student Portal</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-5 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <div className="px-4 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Navigation</span>
                    </div>
                    {[
                        { id: 'overview', icon: Activity, label: 'Overview Hub' },
                        { id: 'history', icon: History, label: 'Attendance Records' },
                        { id: 'leave', icon: Calendar, label: 'Leave Applications' },
                        { id: 'notifications', icon: Bell, label: 'Notification Logs' },
                        { id: 'settings', icon: Sliders, label: 'Profile & Settings' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`nav-item w-full group py-3 px-4 ${activeTab === item.id ? 'nav-item-active' : 'nav-item-inactive'}`}
                        >
                            <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} className={activeTab === item.id ? 'text-white' : 'group-hover:text-primary-500 transition-colors'} />
                            <span className="text-xs font-bold tracking-tight">{item.label}</span>
                            {activeTab === item.id && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                        </button>
                    ))}
                </nav>

                {/* Token / Profile Block */}
                <div className="p-6 m-5 mt-auto bg-slate-100/40 dark:bg-slate-900/30 rounded-3xl border border-slate-200/40 dark:border-white/5 backdrop-blur-md">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white text-sm font-black shadow-md">
                                {user?.name?.charAt(0)}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate tracking-tight">{user?.name}</p>
                            <div className="flex items-center text-[9px] text-primary-500 font-bold uppercase tracking-wider mt-0.5">
                                ID: {user?.rollNumber || 'S1092834'}
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center space-x-2 py-3 bg-rose-50 dark:bg-rose-500/5 text-rose-600 dark:text-rose-455 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-500/15 active:scale-95 transition-all text-[10px] font-black tracking-wider uppercase border border-rose-100 dark:border-rose-500/10"
                    >
                        <LogOut size={13} strokeWidth={2.5} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="xl:hidden fixed top-0 w-full glass-effect z-40 px-6 py-4 flex justify-between items-center shadow-md border-b border-slate-200/40 dark:border-slate-800/40 bg-white/80 dark:bg-[#101415]/80">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center text-white">
                        <Users size={18} />
                    </div>
                    <span className="text-lg font-black tracking-tighter text-slate-900 dark:text-white uppercase">Attendify</span>
                </div>
                <div className="flex items-center space-x-3">
                    <ThemeToggle />
                    <button onClick={logout} className="text-rose-550 p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl active:scale-95 transition-all border border-rose-100/50 dark:border-rose-900/10">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* Main Content Workspace */}
            <main className="flex-1 overflow-y-auto xl:p-10 p-4 pt-24 xl:pt-10 custom-scrollbar z-10 relative flex flex-col">
                <div className="max-w-7xl mx-auto w-full space-y-8 animate-fade-in pb-24 xl:pb-0">
                    
                    {/* Welcome Top bar */}
                    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-primary-500/10 via-indigo-500/5 to-transparent border border-slate-200/50 dark:border-primary-500/20 p-8 text-slate-800 dark:text-white shadow-md backdrop-blur-xl">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        
                        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 dark:bg-white/10 text-primary-600 dark:text-indigo-205 text-[9px] font-black uppercase tracking-[0.25em] mb-4 border border-primary-500/10 dark:border-white/5">
                                    <Clock size={11} />
                                    <span>Student Terminal</span>
                                </span>
                                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-850 dark:text-white">
                                    Welcome, {user?.name || 'Student'}!
                                </h2>
                            </div>
                            <div className="flex items-center space-x-4 bg-slate-100/60 dark:bg-white/5 backdrop-blur-md px-6 py-4 rounded-[1.5rem] border border-slate-200/30 dark:border-white/5">
                                <div className="text-right">
                                    <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-indigo-300 tracking-widest leading-none">Class Section</p>
                                    <p className="text-xs font-black mt-1.5 text-slate-700 dark:text-white">Section {user?.section || 'A'}</p>
                                </div>
                                <div className="w-px h-8 bg-slate-200 dark:bg-white/10"></div>
                                <div className="text-right">
                                    <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-indigo-300 tracking-widest leading-none">Current View</p>
                                    <p className="text-xs font-black mt-1.5 text-primary-500 dark:text-indigo-200 capitalize">
                                        {activeTab === 'overview' && 'Overview Hub'}
                                        {activeTab === 'history' && 'Records History'}
                                        {activeTab === 'leave' && 'Leave Applications'}
                                        {activeTab === 'notifications' && 'Notification Logs'}
                                        {activeTab === 'settings' && 'Profile & Settings'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rendering Tab Workspace */}
                    <div className="relative">
                        {activeTab === 'overview' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* KPI Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Card 1: Attendance % */}
                                    <div className="premium-card p-5 flex flex-col justify-between border border-slate-200/60 dark:border-slate-800/40 bg-white/50 dark:bg-slate-900/10">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-405 dark:text-slate-500">Attendance Rate</span>
                                            <div className="p-2 bg-primary-500/10 text-primary-500 rounded-xl">
                                                <Activity size={16} />
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-black text-slate-850 dark:text-white tracking-tight">{attendanceRate}%</span>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${parseFloat(attendanceRate) >= 75 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400'}`}>
                                                {parseFloat(attendanceRate) >= 75 ? 'Safe' : 'Shortage'}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-4 overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${parseFloat(attendanceRate) >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${attendanceRate}%` }}></div>
                                        </div>
                                    </div>
                                    
                                    {/* Card 2: Attended */}
                                    <div className="premium-card p-5 flex flex-col justify-between border border-slate-200/60 dark:border-slate-800/40 bg-white/50 dark:bg-slate-900/10">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-405 dark:text-slate-500">Attended Lectures</span>
                                            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                                                <CheckCircle size={16} />
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-black text-slate-850 dark:text-white tracking-tight">{attended}</span>
                                            <span className="text-[10px] text-slate-400 font-bold">/ {totalClasses} classes</span>
                                        </div>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-4">VERIFIED CHECK-INS</p>
                                    </div>

                                    {/* Card 3: Missed */}
                                    <div className="premium-card p-5 flex flex-col justify-between border border-slate-200/60 dark:border-slate-800/40 bg-white/50 dark:bg-slate-900/10">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-405 dark:text-slate-500">Missed Lectures</span>
                                            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                                                <AlertTriangle size={16} />
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-black text-rose-600 dark:text-rose-455 tracking-tight">{String(missed).padStart(2, '0')}</span>
                                            <span className="text-[10px] text-slate-400 font-bold">absences</span>
                                        </div>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-4">ABSENT LOG ENTRIES</p>
                                    </div>

                                    {/* Card 4: Late Checks */}
                                    <div className="premium-card p-5 flex flex-col justify-between border border-slate-200/60 dark:border-slate-800/40 bg-white/50 dark:bg-slate-900/10">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-405 dark:text-slate-500">Late Checks</span>
                                            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                                                <Clock size={16} />
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-black text-slate-850 dark:text-white tracking-tight">{String(lateChecks).padStart(2, '0')}</span>
                                            <span className="text-[10px] text-slate-400 font-bold">incidents</span>
                                        </div>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-4">LATE COMPLIANCE FEED</p>
                                    </div>
                                </div>

                                {/* Main Layout Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    {/* Left scanner panel */}
                                    <div className="lg:col-span-5">
                                        <ScanAttendance />
                                    </div>

                                    {/* Right visualisations */}
                                    <div className="lg:col-span-7 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Subject Progress */}
                                            <div className="premium-card p-5 space-y-4">
                                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                                                        <BookOpen size={14} className="text-primary-500" /> By Subject
                                                    </h3>
                                                </div>
                                                <div className="space-y-4">
                                                    {displaySubjects.length > 0 ? (
                                                        displaySubjects.map((sub, idx) => (
                                                            <div key={idx} className="space-y-1">
                                                                <div className="flex justify-between text-[11px] font-bold">
                                                                    <span className="text-slate-700 dark:text-slate-300">{sub.name}</span>
                                                                    <span className={sub.rate >= 75 ? 'text-primary-500' : 'text-rose-500'}>{sub.rate}%</span>
                                                                </div>
                                                                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                    <div className={`h-full rounded-full ${sub.rate >= 75 ? 'bg-primary-500' : 'bg-rose-500'}`} style={{ width: `${sub.rate}%` }}></div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center text-slate-450 dark:text-slate-500 text-xs font-bold py-6 uppercase tracking-wider">
                                                            No subjects logged yet
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Monthly Trend */}
                                            <div className="premium-card p-5 flex flex-col justify-between">
                                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                                                        <Activity size={14} className="text-primary-500" /> Monthly Trend
                                                    </h3>
                                                    <span className="text-[8px] font-bold text-slate-400 font-mono">6 MONTHS</span>
                                                </div>
                                                <div className="flex-1 flex items-end gap-3.5 relative h-[140px] pt-6">
                                                    {/* Bars */}
                                                    {monthlyTrendData.map((m, i) => (
                                                        <div key={i} className="flex-1 bg-slate-100 dark:bg-slate-900/50 hover:bg-primary-500/10 dark:hover:bg-primary-500/15 rounded-t-lg h-full relative group transition-all duration-300">
                                                            <div 
                                                                className={`absolute bottom-0 left-0 w-full rounded-t-lg transition-all duration-500 ${i === 5 ? 'bg-primary-500 shadow-md' : 'bg-slate-300 dark:bg-slate-700'}`} 
                                                                style={{ height: `${m.rate}%` }}
                                                            ></div>
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 dark:bg-slate-850 text-white px-2 py-0.5 rounded text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                                {m.rate}%
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between mt-3 font-mono text-[9px] font-bold text-slate-400">
                                                    {monthlyTrendData.map((m, i) => (
                                                        <span key={i}>{m.name}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recent check-ins list */}
                                        <div className="premium-card overflow-hidden">
                                            <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                                                    <Clock size={14} className="text-primary-500" /> Recent Check-ins
                                                </h3>
                                            </div>
                                            <div className="divide-y divide-slate-100 dark:divide-white/5">
                                                {displayCheckins.length > 0 ? (
                                                    displayCheckins.map((chk, i) => (
                                                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-100/30 dark:hover:bg-slate-900/15 transition-all">
                                                            <div className="flex items-center gap-3.5">
                                                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center text-primary-500 border border-slate-200/20 dark:border-white/5">
                                                                    <BookOpen size={16} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-slate-800 dark:text-white">{chk.name}</p>
                                                                    <p className="text-[10px] text-slate-400 font-semibold">{chk.room}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className={`text-xs font-black text-emerald-500`}>
                                                                    Success
                                                                </p>
                                                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">{chk.date}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-12 text-center text-slate-450 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                                                        No check-ins logged yet
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="premium-card p-6 md:p-8">
                                <StudentHistory />
                            </div>
                        )}
                        
                        {activeTab === 'leave' && (
                            <div className="premium-card p-6 md:p-8">
                                <LeaveApplication />
                            </div>
                        )}
                        
                        {activeTab === 'notifications' && (
                            <div className="premium-card p-6 md:p-8">
                                <StudentNotifications />
                            </div>
                        )}
                        
                        {activeTab === 'settings' && (
                            <div className="premium-card p-6 md:p-8">
                                <StudentProfileSettings />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Floating Nav */}
            <nav className="xl:hidden fixed bottom-6 left-6 right-6 h-16 glass-effect rounded-2xl flex justify-around items-center p-3.5 z-40 shadow-lg border border-slate-200/20 dark:border-white/5">
                {[
                    { id: 'overview', icon: Activity, label: 'Overview' },
                    { id: 'history', icon: History, label: 'Records' },
                    { id: 'leave', icon: Calendar, label: 'Leave' },
                    { id: 'notifications', icon: Bell, label: 'Notices' },
                    { id: 'settings', icon: Sliders, label: 'Settings' },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${activeTab === item.id 
                            ? 'text-primary-500 bg-primary-500/10 font-bold scale-105' 
                            : 'text-slate-400 dark:text-slate-600 hover:text-slate-650'}`}
                    >
                        <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                        <span className="text-[8px] mt-0.5 font-bold uppercase tracking-wider">{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default StudentDashboard;
