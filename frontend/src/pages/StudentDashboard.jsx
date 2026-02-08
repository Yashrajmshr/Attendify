import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ScanAttendance from '../components/ScanAttendance';
import StudentHistory from '../components/StudentHistory';
import { LogOut, QrCode, History } from 'lucide-react';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('scan');

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-600">Welcome, {user.name}</span>
                        <button
                            onClick={logout}
                            className="flex items-center text-red-600 hover:text-red-800"
                        >
                            <LogOut size={20} className="mr-1" /> Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Mobile-friendly bottom nav or sidebar? Using sidebar for consistency */}
                <div className="hidden md:block w-64 bg-white rounded-lg shadow mr-8 h-fit">
                    <nav className="flex flex-col p-4 space-y-2">
                        <button
                            onClick={() => setActiveTab('scan')}
                            className={`flex items-center p-3 rounded-md transition ${activeTab === 'scan' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                            <QrCode size={20} className="mr-3" /> Scan QR
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center p-3 rounded-md transition ${activeTab === 'history' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                            <History size={20} className="mr-3" /> History
                        </button>
                    </nav>
                </div>

                {/* Mobile Nav */}
                <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t flex justify-around p-4 z-10">
                    <button
                        onClick={() => setActiveTab('scan')}
                        className={`flex flex-col items-center ${activeTab === 'scan' ? 'text-blue-600' : 'text-gray-500'}`}
                    >
                        <QrCode size={24} />
                        <span className="text-xs">Scan</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex flex-col items-center ${activeTab === 'history' ? 'text-blue-600' : 'text-gray-500'}`}
                    >
                        <History size={24} />
                        <span className="text-xs">History</span>
                    </button>
                </div>

                <div className="flex-1 bg-white rounded-lg shadow p-6 mb-16 md:mb-0">
                    {activeTab === 'scan' && <ScanAttendance />}
                    {activeTab === 'history' && <StudentHistory />}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
