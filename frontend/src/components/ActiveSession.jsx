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
        <div className="p-6 space-y-5">
            {/* Header + Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Sessions</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{sessions.length} total · {sessions.filter(s => s.isActive).length} active</p>
                </div>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-fit">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'active', label: '🟢 Active' },
                        { key: 'ended', label: '🔴 Ended' },
                    ].map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => setFilter(opt.key)}
                            className={`px-4 py-2 text-sm font-medium transition-all ${filter === opt.key
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600 font-bold">✕</button>
                </div>
            )}

            {filteredSessions.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="font-medium">No {filter !== 'all' ? filter : ''} sessions found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredSessions.map((session) => {
                        const isEndLoading = actionLoading === session._id + '_end';
                        const isToggleLoading = actionLoading === session._id + '_toggle';
                        const isDeleteLoading = actionLoading === session._id + '_delete';
                        return (
                            <div
                                key={session._id}
                                className={`border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm transition-all ${session.isActive
                                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                                    }`}
                            >
                                {/* Left: Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate">{session.subject}</h3>
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg text-xs font-semibold">
                                            Sec {session.section}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider ${session.sessionType === 'Lab' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                            {session.sessionType || 'Class'}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${session.isActive
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {session.isActive ? '● Active' : '● Ended'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {new Date(session.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · Radius: {session.radius}m
                                    </p>
                                </div>

                                {/* Right: QR + Actions */}
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                    {/* QR Code (only active) */}
                                    {session.isActive && (
                                        <div className="flex flex-col items-center">
                                            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                                                <SessionQRCode session={session} />
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">Scan to attend · auto-refreshes</p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                                        {/* Toggle On/Off */}
                                        <button
                                            onClick={() => handleToggleSession(session._id, session.isActive)}
                                            disabled={isToggleLoading || isDeleteLoading}
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50
                                                ${session.isActive
                                                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                                }`}
                                        >
                                            {isToggleLoading
                                                ? <RefreshCw size={15} className="animate-spin" />
                                                : session.isActive
                                                    ? <><PowerOff size={15} /> Deactivate</>
                                                    : <><Power size={15} /> Re-activate</>
                                            }
                                        </button>

                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDeleteSession(session._id)}
                                            disabled={isDeleteLoading || isEndLoading || isToggleLoading}
                                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all shadow-sm disabled:opacity-50"
                                        >
                                            {isDeleteLoading
                                                ? <RefreshCw size={15} className="animate-spin" />
                                                : <><Trash2 size={15} /> Delete</>
                                            }
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
