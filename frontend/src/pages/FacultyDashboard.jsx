import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateSession from '../components/CreateSession';
import ActiveSession from '../components/ActiveSession';
import StudentManagement from '../components/StudentManagement';
import AttendanceReport from '../components/AttendanceReport';
import FacultyAttendanceDashboard from '../components/FacultyAttendanceDashboard';
import { LogOut, MapPin, Users, QrCode, FileText, PlusCircle, BarChart2 } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const FacultyDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('create');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-hidden">
            {/* Sidebar */}
            <div className="w-[300px] premium-sidebar hidden md:flex flex-col z-30 m-6 rounded-[2rem] shadow-premium-card border border-slate-200/50 dark:border-white/5">
                <div className="p-10">
                    <div className="flex items-center space-x-4 group cursor-pointer">
                        <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center text-white shadow-active-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                            <PlusCircle size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
                                Attendify
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 mt-1">Faculty Pro</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <div className="px-4 mb-4 mt-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Main Menu</span>
                    </div>
                    {[
                        { id: 'create', icon: PlusCircle, label: 'New Session' },
                        { id: 'active', icon: QrCode, label: 'Live Sessions' },
                        { id: 'students', icon: Users, label: 'Student Registry' },
                        { id: 'analytics', icon: BarChart2, label: 'Attendance' },
                        { id: 'reports', icon: FileText, label: 'Reports' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`nav-item w-full group ${activeTab === item.id ? 'nav-item-active' : 'nav-item-inactive'}`}
                        >
                            <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className={activeTab === item.id ? 'text-white' : 'group-hover:text-primary-500 transition-colors'} />
                            <span className="text-sm font-bold tracking-tight">{item.label}</span>
                            {activeTab === item.id && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                        </button>
                    ))}
                </nav>

                <div className="p-6 m-6 mt-auto bg-slate-100/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/50 dark:border-white/5 backdrop-blur-md">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center text-white text-lg font-black shadow-active-primary">
                                {user?.name?.charAt(0)}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">{user?.name}</p>
                            <div className="flex items-center text-[10px] text-primary-500 font-bold uppercase tracking-wider">
                                <Users size={10} className="mr-1" />
                                {user?.role || 'Faculty Member'}
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-500/20 active:scale-95 transition-all text-sm font-black tracking-tight"
                    >
                        <LogOut size={18} strokeWidth={2.5} />
                        <span>Terminate Session</span>
                    </button>
                </div>
            </div>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 w-full glass-effect z-50 px-6 py-4 flex justify-between items-center shadow-lg border-b border-white/10">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center text-white">
                        <PlusCircle size={18} />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Attendify</span>
                </div>
                <div className="flex items-center space-x-4">
                    <ThemeToggle />
                    <button onClick={logout} className="text-rose-500 p-2.5 bg-rose-50 dark:bg-rose-500/10 rounded-xl active:scale-95 transition-all">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto md:p-14 p-6 pt-28 md:pt-14 custom-scrollbar">
                <div className="max-w-7xl mx-auto space-y-12 animate-fade-in">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-primary-500/5 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-primary-500/10">
                                <Users size={14} strokeWidth={2.5} />
                                <span>Academic Command Center</span>
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                {activeTab === 'create' && 'Session Architect'}
                                {activeTab === 'active' && 'Live Intelligence'}
                                {activeTab === 'students' && 'Academic Registry'}
                                {activeTab === 'analytics' && 'Growth Insights'}
                                {activeTab === 'reports' && 'Academic Analytics'}
                            </h2>
                        </div>
                    </div>

                    <div className="premium-card p-2 min-h-[600px] overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="relative">
                            {activeTab === 'create' && <CreateSession />}
                            {activeTab === 'active' && <ActiveSession />}
                            {activeTab === 'students' && <StudentManagement />}
                            {activeTab === 'analytics' && <FacultyAttendanceDashboard />}
                            {activeTab === 'reports' && <AttendanceReport />}
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around p-3 z-50 safe-area-bottom">
                <button onClick={() => setActiveTab('create')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'create' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    <PlusCircle size={20} />
                    <span className="text-xs mt-1 font-medium">Create</span>
                </button>
                <button onClick={() => setActiveTab('active')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'active' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    <QrCode size={20} />
                    <span className="text-xs mt-1 font-medium">Sessions</span>
                </button>
                <button onClick={() => setActiveTab('students')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'students' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    <Users size={20} />
                    <span className="text-xs mt-1 font-medium">Students</span>
                </button>
                <button onClick={() => setActiveTab('analytics')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'analytics' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    <BarChart2 size={20} />
                    <span className="text-xs mt-1 font-medium">Analytics</span>
                </button>
                <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'reports' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    <FileText size={20} />
                    <span className="text-xs mt-1 font-medium">Reports</span>
                </button>
            </div>
        </div>
    );
};

export default FacultyDashboard;
