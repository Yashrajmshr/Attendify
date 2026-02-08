import { useState, useEffect } from 'react';
import api from '../api/axios';

const StudentHistory = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await api.get('/attendance/my');
                setHistory(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Attendance History</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {history.map((record) => (
                            <tr key={record._id}>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(record.createdAt).toLocaleDateString()} {new Date(record.createdAt).toLocaleTimeString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{record.sessionId?.subject} ({record.sessionId?.section})</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{record.distanceFromFaculty.toFixed(1)}m</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentHistory;
