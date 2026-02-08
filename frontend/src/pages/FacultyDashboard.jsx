import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CreateSession from '../components/CreateSession';
import ActiveSession from '../components/ActiveSession';
import StudentManagement from '../components/StudentManagement';
import AttendanceReport from '../components/AttendanceReport';
import { LogOut, MapPin, Users, QrCode, FileText, PlusCircle } from 'lucide-react';

const FacultyDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('create');

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shadow-sm">
                <div className="p-6 border-b border-slate-100">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Attendify
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Faculty Portal</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'create' ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                    >
                        <PlusCircle size={20} />
                        <span>Create Session</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'active' ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                    >
                        <QrCode size={20} />
                        <span>Active Sessions</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'students' ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                    >
                        <Users size={20} />
                        <span>Manage Students</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'reports' ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                    >
                        <FileText size={20} />
                        <span>Attendance Reports</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center space-x-3 px-4 py-3 mb-2 bg-slate-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200 z-50 px-4 py-3 flex justify-between items-center shadow-sm">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Attendify</span>
                <button onClick={logout} className="text-slate-500 hover:text-red-500">
                    <LogOut size={24} />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto md:p-8 p-4 pt-20 md:pt-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Header showing current tab */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                            {activeTab === 'create' && 'New Session'}
                            {activeTab === 'active' && 'Live Sessions'}
                            {activeTab === 'students' && 'Student Directory'}
                            {activeTab === 'reports' && 'Attendance Reports'}
                        </h2>
                        <p className="text-slate-500 mt-2">
                            {activeTab === 'create' && 'Configure a new geolocation-fenced attendance session.'}
                            {activeTab === 'active' && 'Display QR codes for ongoing classes.'}
                            {activeTab === 'students' && 'Add or import students to the system.'}
                            {activeTab === 'reports' && 'View and export attendance data.'}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                        {activeTab === 'create' && <CreateSession />}
                        {activeTab === 'active' && <ActiveSession />}
                        {activeTab === 'students' && <StudentManagement />}
                        {activeTab === 'reports' && <AttendanceReport />}
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-3 z-50 safe-area-bottom">
                <button onClick={() => setActiveTab('create')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'create' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}>
                    <PlusCircle size={20} />
                    <span className="text-xs mt-1 font-medium">Create</span>
                </button>
                <button onClick={() => setActiveTab('active')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'active' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}>
                    <QrCode size={20} />
                    <span className="text-xs mt-1 font-medium">Active</span>
                </button>
                <button onClick={() => setActiveTab('students')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'students' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}>
                    <Users size={20} />
                    <span className="text-xs mt-1 font-medium">Students</span>
                </button>
                <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'reports' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'}`}>
                    <FileText size={20} />
                    <span className="text-xs mt-1 font-medium">Reports</span>
                </button>
            </div>
        </div>
    );
};

export default FacultyDashboard;
