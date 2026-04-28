import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ScanAttendance from '../components/ScanAttendance';
import StudentHistory from '../components/StudentHistory';
import { LogOut, QrCode, History, Users, Calendar } from 'lucide-react';
import LeaveApplication from '../components/LeaveApplication';
import ThemeToggle from '../components/ThemeToggle';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('scan');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark flex flex-col text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-hidden">
            <header className="glass-effect shadow-premium border-b border-white/10 z-50">
                <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
                    <div className="flex items-center space-x-4 group cursor-pointer transition-all">
                        <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center text-white shadow-active-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                            <Users size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
                                Attendify
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 mt-1">Student Portal</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 sm:space-x-8">
                        <ThemeToggle />
                        <div className="hidden sm:flex items-center space-x-4 px-5 py-2.5 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-white/5 backdrop-blur-md">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white text-xs font-black shadow-md">
                                    {user?.name?.charAt(0)}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-900 dark:text-white leading-tight tracking-tight">Active: {user?.name}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Verified Identity</span>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center space-x-2 px-5 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-500/20 active:scale-95 transition-all text-sm font-black tracking-tight"
                        >
                            <LogOut size={18} strokeWidth={2.5} />
                            <span className="hidden md:inline">Terminate</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-10 py-12 flex flex-col md:flex-row gap-12 overflow-y-auto custom-scrollbar pt-8">
                {/* Sidebar */}
                <aside className="hidden md:block w-80 shrink-0 space-y-8 animate-fade-in">
                    <div className="premium-card p-6 space-y-1.5 border-slate-200/50 dark:border-white/5">
                        <div className="px-4 py-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Student Navigation</span>
                        </div>
                        {[
                            { id: 'scan', icon: QrCode, label: 'Broadcast Status' },
                            { id: 'history', icon: History, label: 'Attendance Records' },
                            { id: 'leave', icon: Calendar, label: 'Leave Applications' },
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
                    </div>

                    <div className="premium-card p-8 bg-gradient-to-br from-primary-600 to-indigo-700 text-white border-none shadow-active-primary overflow-hidden relative group">
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
                                <History size={20} className="text-white" />
                            </div>
                            <h3 className="text-xl font-black mb-2 tracking-tight">Institutional Profile</h3>
                            <p className="text-indigo-100 text-xs font-semibold mb-6 opacity-80 uppercase tracking-widest">ID Authentication Token</p>
                            <div className="w-full h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center px-5 font-mono text-sm tracking-[0.3em] border border-white/20 shadow-inner group-hover:bg-white/15 transition-all">
                                {user?.id?.substring(0, 12)?.toUpperCase() || 'TOKEN-NULL'}
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary-400/20 rounded-full blur-2xl"></div>
                    </div>
                </aside>

                {/* Mobile Floating Nav */}
                <nav className="md:hidden fixed bottom-10 left-10 right-10 h-20 glass-effect rounded-[2.5rem] flex justify-around items-center p-4 z-50 shadow-premium-hover border-white/20">
                    <button
                        onClick={() => setActiveTab('scan')}
                        className={`flex flex-col items-center justify-center w-[4.5rem] h-[4.5rem] rounded-[1.75rem] transition-all duration-500 ${activeTab === 'scan' ? 'bg-primary-500 text-white shadow-active-primary scale-110 rotate-3' : 'text-slate-400 dark:text-slate-600'}`}
                    >
                        <QrCode size={26} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex flex-col items-center justify-center w-[4.5rem] h-[4.5rem] rounded-[1.75rem] transition-all duration-500 ${activeTab === 'history' ? 'bg-primary-500 text-white shadow-active-primary scale-110 -rotate-3' : 'text-slate-400 dark:text-slate-600'}`}
                    >
                        <History size={26} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => setActiveTab('leave')}
                        className={`flex flex-col items-center justify-center w-[4.5rem] h-[4.5rem] rounded-[1.75rem] transition-all duration-500 ${activeTab === 'leave' ? 'bg-primary-500 text-white shadow-active-primary scale-110 -rotate-3' : 'text-slate-400 dark:text-slate-600'}`}
                    >
                        <Calendar size={26} strokeWidth={2.5} />
                    </button>
                </nav>

                <section className="flex-1 premium-card p-12 animate-fade-in mb-32 md:mb-0 relative overflow-hidden min-h-[600px] border-slate-200/50 dark:border-white/5">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                    <div className="relative h-full">
                        {activeTab === 'scan' && <ScanAttendance />}
                        {activeTab === 'history' && <StudentHistory />}
                        {activeTab === 'leave' && <LeaveApplication />}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default StudentDashboard;
