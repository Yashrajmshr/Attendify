import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Download, Filter } from 'lucide-react';

const AttendanceReport = () => {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const { data } = await api.get('/session');
                setSessions(data);
            } catch (error) {
                console.error('Failed to fetch sessions', error);
            }
        };
        fetchSessions();
    }, []);

    useEffect(() => {
        if (selectedSession) {
            fetchAttendance(selectedSession);
        } else {
            setAttendance([]);
        }
    }, [selectedSession]);

    const fetchAttendance = async (sessionId) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/attendance/session/${sessionId}`);
            setAttendance(data);
        } catch (error) {
            console.error('Failed to fetch attendance', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        if (attendance.length === 0) return;

        const sessionTitle = sessions.find(s => s._id === selectedSession)?.subject || 'Attendance';
        const headers = ['Name', 'Roll Number', 'Status', 'Time', 'Distance'];
        const rows = attendance.map(record => [
            record.studentId.name,
            record.studentId.rollNumber,
            record.status,
            new Date(record.createdAt).toLocaleString(),
            `${record.distanceFromFaculty.toFixed(2)}m`
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${sessionTitle}_Attendance.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Attendance Reports</h2>

            <div className="mb-6 flex items-end gap-4">
                <div className="flex-1 max-w-md">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Select Session</label>
                    <select
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                    >
                        <option value="">-- Select a Session --</option>
                        {sessions.map(session => (
                            <option key={session._id} value={session._id}>
                                {session.subject} - {session.section} ({new Date(session.createdAt).toLocaleDateString()})
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={downloadCSV}
                    disabled={attendance.length === 0}
                    className={`flex items-center px-4 py-2 rounded text-white ${attendance.length === 0 ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    <Download size={18} className="mr-2" /> Export Excel/CSV
                </button>
            </div>

            {loading ? (
                <p>Loading attendance...</p>
            ) : selectedSession && attendance.length === 0 ? (
                <p className="text-gray-500">No attendance records found for this session.</p>
            ) : attendance.length > 0 ? (
                <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {attendance.map((record) => (
                                <tr key={record._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{record.studentId.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{record.studentId.rollNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(record.createdAt).toLocaleTimeString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{record.distanceFromFaculty.toFixed(2)}m</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
};

export default AttendanceReport;
