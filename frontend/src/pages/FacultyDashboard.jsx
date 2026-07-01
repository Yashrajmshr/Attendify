import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateSession from '../components/CreateSession';
import StudentManagement from '../components/StudentManagement';
import AttendanceReport from '../components/AttendanceReport';
import FacultyAttendanceDashboard from '../components/FacultyAttendanceDashboard';
import LeaveApprovals from '../components/LeaveApprovals';
import FacultyCommunication from '../components/FacultyCommunication';
import FacultyProfileSettings from '../components/FacultyProfileSettings';
import DefaultersList from '../components/DefaultersList';
import ActiveSession from '../components/ActiveSession';
import api from '../api/axios';
import { 
    LogOut, Users, QrCode, FileText, PlusCircle, BarChart2, Calendar, 
    Bell, Sliders, CheckSquare, Activity, Award, Clock, ArrowRight, BookOpen, AlertTriangle
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const FacultyDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    
    // Stats and mock records for ERP-grade feeling - initialized to zero/empty
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalSubjects: 0,
        conductedClasses: 0,
        todayScheduleCount: 0,
        activeSessions: 0,
        averageAttendance: '0%',
        defaultersCount: 0,
        pendingLeaves: 0
    });

    const [todaySchedule, setTodaySchedule] = useState([]);


    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Fetch subjects
                const subjectsRes = await api.get('/subjects/my-subjects');
                const subjectsList = subjectsRes.data.subjects || (subjectsRes.data.subject ? [subjectsRes.data.subject] : []);
                
                // Get unique sections
                const subjectSections = subjectsList.map(s => s.section).filter(Boolean);
                const facultySections = subjectsRes.data.sections || [];
                const allSections = [...new Set([...subjectSections, ...facultySections])];

                // 2. Fetch students
                const studentsRes = await api.get('/student');
                const facultyStudents = studentsRes.data.filter(s => allSections.includes(s.section));
                
                // 3. Fetch analytics
                const analyticsRes = await api.get('/attendance/analytics');
                const overview = analyticsRes.data?.overview || {};

                // 4. Fetch live sessions
                const liveRes = await api.get('/attendance/live');

                // 5. Fetch leaves
                const leavesRes = await api.get('/leaves?status=Pending');
                const pendingLeaves = leavesRes.data.filter(l => allSections.includes(l.section));

                // 6. Fetch defaulters
                let defaultersList = [];
                try {
                    const defaultersRes = await api.get('/admin/defaulters?threshold=75');
                    defaultersList = defaultersRes.data.filter(d => allSections.includes(d.section));
                } catch (err) {
                    console.error('Failed to fetch defaulters', err);
                }

                // 7. Get today's sessions to compute today's completed/active schedule
                let allSessions = [];
                try {
                    const sessionsRes = await api.get('/session');
                    allSessions = sessionsRes.data || [];
                } catch (err) {
                    console.error('Failed to fetch sessions', err);
                }

                const todayStr = new Date().toISOString().split('T')[0];
                const todaySessions = allSessions.filter(s => s.createdAt.startsWith(todayStr));

                // Construct today's schedule dynamically from subjects
                const constructedSchedule = subjectsList.map((sub, i) => {
                    const times = ['09:00 AM - 10:30 AM', '11:00 AM - 12:30 PM', '02:30 PM - 04:00 PM'];
                    const rooms = ['LHC-201', 'Lab-4', 'LHC-104'];
                    
                    // Check if a session has already been conducted today for this subject
                    const isConducted = todaySessions.some(s => s.subject === sub.name || s.subjectId === sub.id);
                    
                    return {
                        id: sub.id || sub._id || i,
                        time: times[i % times.length],
                        subject: sub.name,
                        code: sub.code,
                        section: sub.section || 'A',
                        room: rooms[i % rooms.length],
                        status: isConducted ? 'Conducted' : 'Launchable'
                    };
                });

                setTodaySchedule(constructedSchedule);

                setStats({
                    totalStudents: facultyStudents.length,
                    totalSubjects: subjectsList.length,
                    conductedClasses: overview.totalSessions || 0,
                    todayScheduleCount: constructedSchedule.length,
                    activeSessions: liveRes.data.length,
                    averageAttendance: overview.averageAttendance ? `${overview.averageAttendance}%` : '0%',
                    defaultersCount: defaultersList.length,
                    pendingLeaves: pendingLeaves.length
                });

            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            }
        };

        fetchDashboardData();
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-hidden relative">
            
            {/* Soft Ambient Background Glows - Apple Style */}
            <div className="absolute top-[-10%] left-[-15%] w-[45vw] h-[45vw] rounded-full bg-primary-500/5 dark:bg-primary-500/10 blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[-10%] right-[-15%] w-[45vw] h-[45vw] rounded-full bg-secondary/5 dark:bg-secondary/10 blur-[120px] pointer-events-none z-0"></div>

            {/* Sidebar Navigation */}
            <div className="w-[310px] premium-sidebar hidden xl:flex flex-col z-35 m-6 rounded-[2.25rem] shadow-premium border border-slate-200/40 dark:border-white/5 relative bg-white/70 dark:bg-slate-950/40 backdrop-blur-2xl">
                <div className="p-8">
                    <div className="flex items-center space-x-3.5 group cursor-pointer" onClick={() => setActiveTab('overview')}>
                        <div className="w-11 h-11 gradient-bg rounded-2xl flex items-center justify-center text-white shadow-active-primary group-hover:scale-105 transition-all duration-300">
                            <Award size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                                Attendify
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-500 mt-1">Faculty Suite</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-5 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <div className="px-4 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Core Dashboard</span>
                    </div>
                    {[
                        { id: 'overview', icon: CheckSquare, label: 'Overview Log' },
                        { id: 'create', icon: PlusCircle, label: 'Session Architect' },
                        { id: 'active', icon: QrCode, label: 'Active Sessions' },
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

                    <div className="px-4 py-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Management & Stats</span>
                    </div>
                    {[
                        { id: 'students', icon: Users, label: 'Student Hub' },
                        { id: 'defaulters', icon: AlertTriangle, label: 'Defaulter Desk' },
                        { id: 'leaves', icon: Calendar, label: 'Leave Desk' },
                        { id: 'analytics', icon: BarChart2, label: 'Analytics Room' },
                        { id: 'communication', icon: Bell, label: 'Announcements' },
                        { id: 'reports', icon: FileText, label: 'Reports Export' },
                        { id: 'settings', icon: Sliders, label: 'Settings & File' },
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

                {/* Faculty profile preview block */}
                <div className="p-6 m-5 mt-auto bg-slate-100/40 dark:bg-slate-900/30 rounded-3xl border border-slate-200/40 dark:border-white/5 backdrop-blur-md">
                    <div className="flex items-center space-x-3 mb-4.5">
                        <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white text-sm font-black shadow-md">
                                {user?.name?.charAt(0)}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate tracking-tight">{user?.name}</p>
                            <div className="flex items-center text-[9px] text-primary-500 font-bold uppercase tracking-wider mt-0.5">
                                {user?.role || 'Associate Professor'}
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center space-x-2 py-3 bg-rose-50 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-500/15 active:scale-95 transition-all text-[10px] font-black tracking-wider uppercase border border-rose-100 dark:border-rose-500/10"
                    >
                        <LogOut size={13} strokeWidth={2.5} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Mobile Header */}
            <header className="xl:hidden fixed top-0 w-full glass-effect z-40 px-6 py-4 flex justify-between items-center shadow-md border-b border-slate-200/40 dark:border-slate-800/40 bg-white/80 dark:bg-slate-950/80">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center text-white">
                        <Award size={18} />
                    </div>
                    <span className="text-lg font-black tracking-tighter text-slate-900 dark:text-white uppercase">Attendify</span>
                </div>
                <div className="flex items-center space-x-3">
                    <ThemeToggle />
                    <button onClick={logout} className="text-rose-500 p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl active:scale-95 transition-all border border-rose-100/50 dark:border-rose-900/10">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* Main Content Workspace */}
            <main className="flex-1 overflow-y-auto xl:p-10 p-4 pt-24 xl:pt-10 custom-scrollbar z-10 relative">
                <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20 xl:pb-0">
                    
                    {/* Welcome banner detailing context */}
                    <div className="relative overflow-hidden rounded-[2.25rem] bg-slate-900 dark:bg-slate-950/80 p-8 md:p-10 text-white shadow-xl border border-slate-800 dark:border-white/5">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        
                        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-[9px] font-black uppercase tracking-[0.25em] mb-4 border border-white/5">
                                    <Clock size={11} />
                                    <span>ERP Control Center</span>
                                </span>
                                <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                                    Welcome, {user?.name || 'Professor'}!
                                </h2>

                            </div>
                            <div className="flex items-center space-x-4 bg-white/5 backdrop-blur-md px-6 py-4 rounded-[1.5rem] border border-white/5">
                                <div className="text-right">
                                    <p className="text-[9px] uppercase font-bold text-indigo-300 tracking-widest leading-none">Department</p>
                                    <p className="text-xs font-black mt-1.5 text-white">{user?.department || 'Science & Eng'}</p>
                                </div>
                                <div className="w-px h-8 bg-white/10"></div>
                                <div className="text-right">
                                    <p className="text-[9px] uppercase font-bold text-indigo-300 tracking-widest leading-none">Console View</p>
                                    <p className="text-xs font-black mt-1.5 text-indigo-200 capitalize">
                                        {activeTab === 'overview' && 'Overview Log'}
                                        {activeTab === 'create' && 'Session Architect'}
                                        {activeTab === 'active' && 'Active Sessions'}
                                        {activeTab === 'students' && 'Academic Hub'}
                                        {activeTab === 'defaulters' && 'Defaulters Desk'}
                                        {activeTab === 'leaves' && 'Leave Approvals'}
                                        {activeTab === 'analytics' && 'Analytics Room'}
                                        {activeTab === 'communication' && 'Announcements'}
                                        {activeTab === 'reports' && 'Reports Export'}
                                        {activeTab === 'settings' && 'Settings & Parameters'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rendering views */}
                    <div className="premium-card p-4 md:p-8 min-h-[600px] overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="relative">
                            
                            {/* TAB 1: OVERVIEW */}
                            {activeTab === 'overview' && (
                                <div className="space-y-8">
                                    {/* 1. Overview KPIs Board */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[
                                            { label: 'Assigned Students', val: stats.totalStudents, desc: 'Across all sections', color: 'indigo', icon: Users },
                                            { label: 'Assigned Subjects', val: stats.totalSubjects, desc: 'Active workload Allocation', color: 'pink', icon: BookOpen },
                                            { label: 'Lectures Conducted', val: stats.conductedClasses, desc: 'Current Semester total', color: 'indigo', icon: Activity },
                                            { label: 'Avg Attendance %', val: stats.averageAttendance, desc: 'Across allocated classes', color: 'pink', icon: Award }
                                        ].map((card, i) => (
                                            <div key={i} className={`premium-card p-5 relative overflow-hidden group hover:scale-[1.02] border-l-4 ${card.color === 'indigo' ? 'border-l-indigo-500' : 'border-l-pink-500'}`}>
                                                <div className="flex items-center justify-between mb-3.5">
                                                    <div className={`p-2.5 rounded-xl ${card.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-pink-500/10 text-pink-600 dark:text-pink-400'}`}>
                                                        <card.icon size={18} />
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{card.label}</span>
                                                </div>
                                                <h4 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{card.val}</h4>
                                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{card.desc}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 2. Today's Timetable & Action Cards */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        
                                        {/* Schedule Timeline */}
                                        <div className="lg:col-span-2 space-y-6">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center uppercase tracking-widest">
                                                    <Clock size={16} className="mr-2 text-primary-500" />
                                                    Today's Class Schedule
                                                </h3>
                                                <button onClick={() => setActiveTab('create')} className="text-[10px] font-black uppercase text-primary-500 hover:text-primary-600 flex items-center space-x-1">
                                                    <span>Session Architect</span>
                                                    <ArrowRight size={12} />
                                                </button>
                                            </div>

                                            <div className="premium-card p-6 space-y-4">
                                                {todaySchedule.length > 0 ? (
                                                    todaySchedule.map(cls => (
                                                        <div key={cls.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-100/30 dark:bg-slate-900/10 border border-slate-200/40 dark:border-white/5 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-slate-900/20 transition-all">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center space-x-2.5">
                                                                    <h4 className="font-bold text-sm text-slate-850 dark:text-white">{cls.subject}</h4>
                                                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black text-slate-500 dark:text-slate-400">{cls.code}</span>
                                                                </div>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                    {cls.time} • Section {cls.section} • {cls.room}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                {cls.status === 'Conducted' ? (
                                                                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/15 text-[10px] font-black uppercase tracking-wider block text-center">
                                                                        Completed
                                                                    </span>
                                                                ) : (
                                                                    <button 
                                                                        onClick={() => setActiveTab('create')}
                                                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white text-[10px] font-black uppercase tracking-wider shadow-sm transition-all block w-full text-center"
                                                                    >
                                                                        Launch Class
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 italic text-[11px] font-bold uppercase tracking-wider">
                                                        No assigned subjects found to schedule.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Quick Actions and Shortage alerts */}
                                        <div className="lg:col-span-1 space-y-6">
                                            <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center uppercase tracking-widest">
                                                <Award size={16} className="mr-2 text-pink-500" />
                                                Quick Actions
                                            </h3>

                                            <div className="premium-card p-6 grid grid-cols-2 gap-3.5">
                                                {[
                                                    { label: 'Review Leaves', tab: 'leaves', badge: stats.pendingLeaves, color: 'indigo' },
                                                    { label: 'Defaulter Hub', tab: 'defaulters', badge: stats.defaultersCount, color: 'pink' },
                                                    { label: 'Notice Board', tab: 'communication', color: 'indigo' },
                                                    { label: 'Export Reports', tab: 'reports', color: 'pink' }
                                                ].map((act, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setActiveTab(act.tab)}
                                                        className={`p-4 bg-slate-100/40 dark:bg-slate-900/20 hover:bg-slate-100/70 dark:hover:bg-slate-900/40 border border-slate-200/40 dark:border-white/5 rounded-2xl flex flex-col justify-between text-left transition-all ${
                                                            act.color === 'indigo' ? 'hover:border-indigo-500/20' : 'hover:border-pink-500/20'
                                                        }`}
                                                    >
                                                        <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-400">{act.label}</span>
                                                        {act.badge ? (
                                                            <span className={`mt-3 px-2 py-0.5 rounded text-[9px] font-black uppercase w-fit ${
                                                                act.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-455'
                                                            }`}>
                                                                {act.badge} Alert
                                                            </span>
                                                        ) : (
                                                            <span className="mt-3 text-[9px] font-bold text-slate-400 flex items-center">Open Tab →</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                    </div>

                                </div>
                            )}

                            {/* OTHER TABS */}
                            {activeTab === 'create' && <CreateSession />}
                            {activeTab === 'active' && <ActiveSession />}
                            {activeTab === 'students' && <StudentManagement />}
                            {activeTab === 'defaulters' && <DefaultersList />}
                            {activeTab === 'leaves' && <LeaveApprovals />}
                            {activeTab === 'analytics' && <FacultyAttendanceDashboard />}
                            {activeTab === 'communication' && <FacultyCommunication />}
                            {activeTab === 'reports' && <AttendanceReport />}
                            {activeTab === 'settings' && <FacultyProfileSettings />}

                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 flex justify-around p-2.5 z-40 safe-area-bottom">
                {[
                    { id: 'overview', icon: CheckSquare, label: 'Overview' },
                    { id: 'create', icon: PlusCircle, label: 'Create' },
                    { id: 'analytics', icon: BarChart2, label: 'Stats' },
                    { id: 'settings', icon: Sliders, label: 'Profile' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center px-3 py-1.5 rounded-xl transition-all ${activeTab === tab.id
                            ? 'text-primary-500 bg-primary-500/10 font-bold'
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                        }`}
                    >
                        <tab.icon size={16} />
                        <span className="text-[9px] mt-1 font-semibold">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FacultyDashboard;
