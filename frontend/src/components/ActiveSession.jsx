import { useState, useEffect } from 'react';
import api from '../api/axios';
import QRCode from 'react-qr-code';

const ActiveSession = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        try {
            const { data } = await api.get('/session');
            setSessions(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch sessions', error);
            setLoading(false);
        }
    };

    const handleEndSession = async (sessionId) => {
        if (!window.confirm("Are you sure you want to end this session? Students won't be able to mark attendance anymore.")) return;

        try {
            await api.put(`/session/${sessionId}/end`);
            // Update local state to reflect change
            setSessions(sessions.map(session =>
                session._id === sessionId ? { ...session, isActive: false } : session
            ));
        } catch (error) {
            alert('Failed to end session');
            console.error(error);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Your Sessions</h2>
            {sessions.length === 0 ? (
                <p>No sessions found.</p>
            ) : (
                <div className="space-y-6">
                    {sessions.map((session) => (
                        <div key={session._id} className={`border p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm transition-all ${session.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-75'}`}>
                            <div className="mb-4 md:mb-0 flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <h3 className="font-bold text-lg text-slate-800">{session.subject}</h3>
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-sm font-medium">Sec {session.section}</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-500 flex items-center">
                                        Created: {new Date(session.createdAt).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-slate-500">Radius: {session.radius}m</p>
                                    <div className="mt-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${session.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {session.isActive ? 'Active • Students can scan' : 'Ended • No new attendance'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center w-full md:w-auto mt-4 md:mt-0 md:ml-6">
                                {session.isActive ? (
                                    <>
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                            <QRCode value={JSON.stringify({
                                                sessionId: session._id,
                                                subject: session.subject,
                                                radius: session.radius
                                            })} size={120} />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 mb-3">Scan to mark attendance</p>
                                        <button
                                            onClick={() => handleEndSession(session._id)}
                                            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg text-sm font-medium transition-colors w-full"
                                        >
                                            End Session
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-4 bg-slate-100 rounded-lg border border-slate-200 h-[120px] w-[120px]">
                                        <span className="text-4xl">🛑</span>
                                        <span className="text-xs font-medium text-slate-500 mt-2">Session Ended</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActiveSession;
