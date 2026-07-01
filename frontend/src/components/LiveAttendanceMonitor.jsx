import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import QRCode from 'react-qr-code';
import { Search, Users, RefreshCw, X, Activity, UserCheck, UserX, Power, PowerOff, Trash2, AlertCircle } from 'lucide-react';

const SessionQRCode = ({ session }) => {
    const [qrData, setQrData] = useState(JSON.stringify({
        sessionId: session._id || session.id,
        subject: session.subject,
        radius: session.radius || 15,
        timestamp: Date.now()
    }));

    useEffect(() => {
        const interval = setInterval(() => {
            setQrData(JSON.stringify({
                sessionId: session._id || session.id,
                subject: session.subject,
                radius: session.radius || 15,
                timestamp: Date.now()
            }));
        }, 9000);

        return () => clearInterval(interval);
    }, [session]);

    return (
        <QRCode value={qrData} size={130} />
    );
};

const LiveAttendanceMonitor = ({ session, onClose }) => {
    const sessionId = session._id || session.id;
    const sessionSubject = session.subject;
    const sessionSection = session.section;

    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [polling, setPolling] = useState(false);
    const [error, setError] = useState(null);
    const [updatingIds, setUpdatingIds] = useState(new Set());
    const [lastPolled, setLastPolled] = useState(null);
    const [sessionActive, setSessionActive] = useState(session.isActive);
    const [actionLoading, setActionLoading] = useState(false);

    const pollingIntervalRef = useRef(null);

    const fetchAttendanceData = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        else setPolling(true);
        setError(null);
        try {
            const { data } = await api.get(`/attendance/session/${sessionId}`);
            setStudents(data || []);
            setLastPolled(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } catch (err) {
            console.error('Error fetching live attendance', err);
            setError(err.response?.data?.message || 'Failed to load live check-ins');
        } finally {
            setLoading(false);
            setPolling(false);
        }
    };

    // Initial fetch and set interval
    useEffect(() => {
        fetchAttendanceData(true);

        pollingIntervalRef.current = setInterval(() => {
            // Only poll if we aren't currently updating anyone to avoid race conditions
            if (updatingIds.size === 0) {
                fetchAttendanceData(false);
            }
        }, 5000);

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [sessionId, updatingIds.size]);

    const handleToggleAttendance = async (studentId, currentStatus) => {
        if (updatingIds.has(studentId)) return;
        const nextStatus = currentStatus === 'P' ? 'A' : 'P';
        
        // Optimistic UI Update
        setStudents(prev => prev.map(item => 
            item.student._id === studentId ? { ...item, status: nextStatus } : item
        ));

        setUpdatingIds(prev => {
            const next = new Set(prev);
            next.add(studentId);
            return next;
        });

        try {
            await api.put('/attendance/update', {
                sessionId,
                studentId,
                status: nextStatus
            });
            const { data } = await api.get(`/attendance/session/${sessionId}`);
            setStudents(data || []);
            setLastPolled(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } catch (err) {
            console.error('Error updating attendance status', err);
            setStudents(prev => prev.map(item => 
                item.student._id === studentId ? { ...item, status: currentStatus } : item
            ));
            alert(err.response?.data?.message || 'Failed to update attendance status.');
        } finally {
            setUpdatingIds(prev => {
                const next = new Set(prev);
                next.delete(studentId);
                return next;
            });
        }
    };

    const handleToggleSessionStatus = async () => {
        const msg = sessionActive
            ? "Deactivate this session? Students won't be able to scan."
            : "Re-activate this session? Students will be able to scan again.";
        if (!window.confirm(msg)) return;
        setActionLoading(true);
        try {
            const { data } = await api.put(`/session/${sessionId}/toggle`);
            setSessionActive(data.isActive);
            session.isActive = data.isActive; // update local object ref
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to toggle session status.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSession = async () => {
        if (!window.confirm("⚠️ Delete this session? This will permanently remove all attendance records for this session. This cannot be undone.")) return;
        setActionLoading(true);
        try {
            await api.delete(`/session/${sessionId}`);
            alert('Session deleted successfully.');
            onClose(); // Close the monitor view since session is deleted
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete session.');
            setActionLoading(false);
        }
    };

    // Filter students
    const filteredStudents = students.filter(item => {
        const studentName = item.student?.name?.toLowerCase() || '';
        const rollNo = item.student?.rollNumber?.toLowerCase() || '';
        const q = searchQuery.toLowerCase();
        return studentName.includes(q) || rollNo.includes(q);
    });

    // Statistics
    const totalStudents = students.length;
    const presentCount = students.filter(item => item.status === 'P').length;
    const absentCount = totalStudents - presentCount;
    const percentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-6 animate-fade-in relative z-20">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-200/40 dark:border-slate-800/40 pb-4">
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-650 dark:text-red-405 text-[10px] font-black uppercase tracking-wider border border-red-500/10">
                            <span className="w-1.5 h-1.5 bg-red-550 rounded-full animate-ping"></span>
                            <span>Live Monitor</span>
                        </span>
                        {polling && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center">
                                <RefreshCw size={10} className="animate-spin mr-1" /> Polling...
                            </span>
                        )}
                        {!polling && lastPolled && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                Last synced: {lastPolled}
                            </span>
                        )}
                    </div>
                    <h3 className="text-xl font-black text-slate-850 dark:text-white mt-1">
                        {sessionSubject}
                    </h3>
                    <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5">
                        Section {sessionSection || 'N/A'} • Active Polling Stream (5s)
                    </p>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-2.5 bg-slate-105 hover:bg-slate-200/60 dark:bg-slate-900/50 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200/40 dark:border-white/5"
                >
                    <X size={16} />
                </button>
            </div>

            {error && (
                <div className="bg-rose-500/10 text-rose-600 dark:text-rose-455 p-4 rounded-2xl border border-rose-500/20 text-xs font-bold flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={() => fetchAttendanceData(true)} className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg"><RefreshCw size={12} /></button>
                </div>
            )}

            {/* Grid Layout: Left is Stats + list, Right is QR Code + session actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Live Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white/40 dark:bg-slate-950/20 p-4.5 rounded-2xl border border-slate-200/40 dark:border-white/5 flex flex-col justify-between">
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Attendance Rate</span>
                            <div className="flex items-baseline space-x-2 mt-2">
                                <span className="text-2xl font-black text-slate-800 dark:text-white">{percentage}%</span>
                                <span className="text-xs text-slate-400">Target: 75%</span>
                            </div>
                        </div>

                        <div className="bg-white/40 dark:bg-slate-950/20 p-4.5 rounded-2xl border border-slate-200/40 dark:border-white/5 flex flex-col justify-between">
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Present Students</span>
                            <div className="flex items-baseline space-x-2 mt-2">
                                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-450">{presentCount}</span>
                                <span className="text-xs text-slate-400">/ {totalStudents} registered</span>
                            </div>
                        </div>

                        <div className="bg-white/40 dark:bg-slate-950/20 p-4.5 rounded-2xl border border-slate-200/40 dark:border-white/5 flex flex-col justify-between">
                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Absent Students</span>
                            <div className="flex items-baseline space-x-2 mt-2">
                                <span className="text-2xl font-black text-rose-600 dark:text-rose-450">{absentCount}</span>
                                <span className="text-xs text-slate-400">pending response</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            <span>Attendance Progress</span>
                            <span>{presentCount} of {totalStudents} checked-in</span>
                        </div>
                        <div className="h-3.5 bg-slate-100 dark:bg-slate-950/40 rounded-full overflow-hidden border border-slate-200/40 dark:border-white/5 p-0.5">
                            <div 
                                className="h-full bg-gradient-to-r from-primary-500 to-secondary rounded-full transition-all duration-500 shadow-md shadow-primary-500/10"
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Search Filter Bar */}
                    <div className="relative">
                        <Search size={16} className="absolute left-4.5 top-4.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by student name or roll number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="glass-input pl-12 text-xs font-bold"
                        />
                    </div>

                    {/* Students List Card */}
                    <div className="premium-card p-4 overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 space-y-3.5 text-slate-455">
                                <RefreshCw size={24} className="animate-spin text-primary-500" />
                                <span className="text-xs font-bold uppercase tracking-wider">Syncing class list...</span>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="text-center py-16 text-slate-455 dark:text-slate-500">
                                <Users size={32} className="mx-auto mb-3 opacity-40 text-slate-400" />
                                <p className="text-xs font-bold uppercase tracking-wider">No Students Found</p>
                                <p className="text-[10px] text-slate-400 mt-1">Try refining your search keyword or selection</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                                {filteredStudents.map((item) => {
                                    const isPresent = item.status === 'P';
                                    const isUpdating = updatingIds.has(item.student._id);
                                    
                                    const charCodeSum = (item.student.name || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                                    const gradientClasses = [
                                        'from-pink-500 to-rose-500',
                                        'from-purple-500 to-indigo-500',
                                        'from-blue-500 to-cyan-500',
                                        'from-emerald-500 to-teal-500',
                                        'from-amber-500 to-orange-500'
                                    ];
                                    const gradientClass = gradientClasses[charCodeSum % gradientClasses.length];

                                    return (
                                        <div key={item.student._id} className="py-3.5 flex items-center justify-between hover:bg-slate-100/30 dark:hover:bg-slate-900/10 px-2.5 rounded-xl transition-all">
                                            <div className="flex items-center space-x-3.5 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-xs font-black shadow-md flex-shrink-0`}>
                                                    {item.student.name?.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-slate-850 dark:text-white truncate tracking-tight">{item.student.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono mt-0.5 uppercase tracking-wider">{item.student.rollNumber || 'No Roll No'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-4">
                                                <span className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                                                    isPresent 
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20' 
                                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                                                }`}>
                                                    {isPresent ? 'Present' : 'Absent'}
                                                </span>

                                                <button
                                                    onClick={() => handleToggleAttendance(item.student._id, item.status)}
                                                    disabled={isUpdating}
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                                                        isUpdating 
                                                            ? 'bg-slate-105 dark:bg-slate-900 border-slate-205 dark:border-slate-800' 
                                                            : isPresent
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                                                : 'bg-slate-100 text-slate-400 border-slate-250 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 dark:bg-slate-900/30 dark:border-slate-850'
                                                    }`}
                                                    title={isPresent ? "Mark Absent" : "Mark Present"}
                                                >
                                                    {isUpdating ? (
                                                        <RefreshCw size={13} className="animate-spin text-slate-400" />
                                                    ) : isPresent ? (
                                                        <UserCheck size={16} />
                                                    ) : (
                                                        <UserX size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: QR Code & Controls */}
                <div className="lg:col-span-1 space-y-6">
                    {sessionActive ? (
                        <div className="premium-card p-6 flex flex-col items-center justify-center space-y-4 text-center border-emerald-500/30 dark:border-emerald-500/10 shadow-[0_20px_35px_-10px_rgba(16,185,129,0.08)] bg-white dark:bg-slate-900/30">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                Active Geofence Portal
                            </span>
                            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md">
                                <SessionQRCode session={session} />
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider animate-pulse">Dynamic QR rotates every 9s</p>
                            
                            <div className="w-full pt-4 space-y-3">
                                <button
                                    onClick={handleToggleSessionStatus}
                                    disabled={actionLoading}
                                    className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border border-amber-500/20 flex items-center justify-center space-x-1.5"
                                >
                                    <PowerOff size={13} />
                                    <span>Close Stream</span>
                                </button>
                                <button
                                    onClick={handleDeleteSession}
                                    disabled={actionLoading}
                                    className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-455 border border-rose-500/20 hover:bg-rose-500/20 transition-all shadow-sm rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5"
                                >
                                    <Trash2 size={13} />
                                    <span>Delete Log</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="premium-card p-6 flex flex-col items-center justify-center space-y-4 text-center bg-white/40 dark:bg-slate-900/10 border-slate-200/40 dark:border-white/5 opacity-80">
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5"></span>
                                Portal Terminated
                            </span>
                            <div className="bg-slate-105 dark:bg-slate-900 w-24 h-24 rounded-3xl flex items-center justify-center text-3xl shadow-sm border border-slate-200/40 dark:border-white/5">
                                🔒
                            </div>
                            <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold leading-relaxed">This session has been closed. Students cannot check-in anymore.</p>
                            
                            <div className="w-full pt-4 space-y-3">
                                <button
                                    onClick={handleToggleSessionStatus}
                                    disabled={actionLoading}
                                    className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5"
                                >
                                    <Power size={13} />
                                    <span>Re-Activate Session</span>
                                </button>
                                <button
                                    onClick={handleDeleteSession}
                                    disabled={actionLoading}
                                    className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-455 border border-rose-500/20 hover:bg-rose-500/20 transition-all shadow-sm rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5"
                                >
                                    <Trash2 size={13} />
                                    <span>Delete Log</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveAttendanceMonitor;
