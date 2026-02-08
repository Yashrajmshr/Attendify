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
                        <div key={session._id} className="border p-4 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between bg-gray-50 shadow-sm">
                            <div className="mb-4 md:mb-0">
                                <h3 className="font-bold text-lg">{session.subject} - Section {session.section}</h3>
                                <p className="text-sm text-gray-600">Created: {new Date(session.createdAt).toLocaleString()}</p>
                                <p className="text-sm text-gray-600">Radius: {session.radius}m</p>
                                <p className={`text-sm font-bold ${session.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                    {session.isActive ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                            <div className="flex flex-col items-center">
                                <QRCode value={JSON.stringify({
                                    sessionId: session._id,
                                    subject: session.subject,
                                    radius: session.radius
                                })} size={128} />
                                <span className="text-xs text-gray-500 mt-2">Scan to mark attendance</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActiveSession;
