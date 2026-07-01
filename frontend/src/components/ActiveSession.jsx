import { useState, useEffect } from 'react';
import api from '../api/axios';
import QRCode from 'react-qr-code';
import { Trash2, PowerOff, Power, RefreshCw, AlertCircle } from 'lucide-react';

const SessionQRCode = ({ session }) => {
    const [qrData, setQrData] = useState(JSON.stringify({
        sessionId: session._id,
        subject: session.subject,
        radius: session.radius,
        timestamp: Date.now()
    }));

    useEffect(() => {
        const interval = setInterval(() => {
            setQrData(JSON.stringify({
                sessionId: session._id,
                subject: session.subject,
                radius: session.radius,
                timestamp: Date.now()
            }));
        }, 9000);

        return () => clearInterval(interval);
    }, [session]);

    return (
        <QRCode value={qrData} size={120} />
    );
};

const ActiveSession = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // tracks which session is being acted on
    const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'ended'
    const [error, setError] = useState('');

    const fetchSessions = async () => {
        try {
            const { data } = await api.get('/session');
            setSessions(data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch sessions', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleEndSession = async (sessionId) => {
        if (!window.confirm("End this session? Students won't be able to mark attendance anymore.")) return;
        setActionLoading(sessionId + '_end');
        try {
            await api.put(`/session/${sessionId}/end`);
            setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, isActive: false } : s));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to end session.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleSession = async (sessionId, currentStatus) => {
        const msg = currentStatus
            ? "Deactivate this session? Students won't be able to scan."
            : "Re-activate this session? Students will be able to scan again.";
        if (!window.confirm(msg)) return;
        setActionLoading(sessionId + '_toggle');
        try {
            const { data } = await api.put(`/session/${sessionId}/toggle`);
            setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, isActive: data.isActive } : s));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to toggle session status.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteSession = async (sessionId) => {
        if (!window.confirm("⚠️ Delete this session? This will permanently remove all attendance records for this session. This cannot be undone.")) return;
        setActionLoading(sessionId + '_delete');
        try {
            await api.delete(`/session/${sessionId}`);
            setSessions(prev => prev.filter(s => s._id !== sessionId));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete session.');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredSessions = sessions.filter(s => {
        if (filter === 'active') return s.isActive;
        if (filter === 'ended') return !s.isActive;
        return true;
    });

    if (loading) return (
        <div className="flex items-center justify-center py-16 text-slate-500">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading sessions...
        </div>
    );

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header + Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Live Intelligence</h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Manage, activate, or terminate live and past attendance streams
                    </p>
                </div>
                
                {/* Modern Filter Pill */}
                <div className="flex p-1 rounded-2xl bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/40 dark:border-white/5 w-fit">
                    {[
                        { key: 'all', label: 'All Sessions' },
                        { key: 'active', label: '🟢 Live Only' },
                        { key: 'ended', label: '🔴 Ended Only' },
                    ].map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => setFilter(opt.key)}
                            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                                filter === opt.key
                                    ? 'bg-gradient-to-r from-primary-500 to-indigo-600 text-white shadow-md'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-rose-500/10 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400 p-4.5 rounded-2xl border border-rose-500/25 text-xs font-bold flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                    <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-600 font-bold ml-2">✕</button>
                </div>
            )}

            {filteredSessions.length === 0 ? (
                <div className="premium-card p-16 text-center">
                    <p className="text-5xl mb-4">🔮</p>
                    <h3 className="text-base font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">No Sessions Loaded</h3>
                    <p className="text-xs text-slate-400 mt-1">There are no {filter !== 'all' ? filter : ''} sessions to show. Create a session to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredSessions.map((session) => {
                        const isEndLoading = actionLoading === session._id + '_end';
                        const isToggleLoading = actionLoading === session._id + '_toggle';
                        const isDeleteLoading = actionLoading === session._id + '_delete';
                        
                        return (
                            <div
                                key={session._id}
                                className={`premium-card p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden transition-all duration-300 ${
                                    session.isActive
                                        ? 'border-emerald-500/30 dark:border-emerald-500/10 shadow-[0_20px_35px_-10px_rgba(16,185,129,0.08)] bg-white dark:bg-slate-900/30'
                                        : 'bg-white/40 dark:bg-slate-900/10 border-slate-200/40 dark:border-white/5 opacity-80'
                                }`}
                            >
                                {/* Active subtle pulsing background line */}
                                {session.isActive && (
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-md shadow-emerald-500/20"></div>
                                )}

                                {/* Left Side: Details */}
                                <div className="space-y-3 flex-1 min-w-0">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white truncate tracking-tight">{session.subject}</h3>
                                        <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider">
                                            Sec {session.section}
                                        </span>
                                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                            session.sessionType === 'Lab'
                                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                                        }`}>
                                            {session.sessionType || 'Class'}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center space-x-1.5 ${
                                            session.isActive
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/20'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${session.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-550'}`}></span>
                                            <span>{session.isActive ? 'Live' : 'Closed'}</span>
                                        </span>
                                    </div>
                                    
                                    <p className="text-xs text-slate-400 font-medium">
                                        {new Date(session.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                        <span className="mx-2">•</span>
                                        Allowed Radius: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{session.radius}m</span>
                                    </p>
                                </div>

                                {/* Right Side: Actions & QR */}
                                <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                                    {/* QR Frame */}
                                    {session.isActive && (
                                        <div className="flex flex-col items-center space-y-1.5 flex-shrink-0">
                                            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md">
                                                <SessionQRCode session={session} />
                                            </div>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider animate-pulse">Auto-refreshing QR</span>
                                        </div>
                                    )}

                                    {/* Buttons Group */}
                                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3.5 w-full sm:w-auto">
                                        {/* Toggle Active state */}
                                        <button
                                            onClick={() => handleToggleSession(session._id, session.isActive)}
                                            disabled={isToggleLoading || isDeleteLoading}
                                            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm border ${
                                                session.isActive
                                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                            }`}
                                        >
                                            {isToggleLoading ? (
                                                <RefreshCw size={14} className="animate-spin" />
                                            ) : session.isActive ? (
                                                <><PowerOff size={14} /> Close Stream</>
                                            ) : (
                                                <><Power size={14} /> Open Stream</>
                                            )}
                                        </button>

                                        {/* Terminate/Delete */}
                                        <button
                                            onClick={() => handleDeleteSession(session._id)}
                                            disabled={isDeleteLoading || isEndLoading || isToggleLoading}
                                            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20 hover:bg-rose-500/20 transition-all shadow-sm"
                                        >
                                            {isDeleteLoading ? (
                                                <RefreshCw size={14} className="animate-spin" />
                                            ) : (
                                                <><Trash2 size={14} /> Delete log</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ActiveSession;
