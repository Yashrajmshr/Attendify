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
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Attendance History</h2>
            <div className="bg-white dark:bg-slate-900 shadow overflow-hidden sm:rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Distance</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900/40 divide-y divide-gray-200 dark:divide-slate-800">
                        {Array.isArray(history) && history.map((record) => (
                            <tr key={record._id || record.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{record.createdAt ? `${new Date(record.createdAt).toLocaleDateString()} ${new Date(record.createdAt).toLocaleTimeString()}` : 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{record.sessionId?.subject || 'Unknown Subject'} ({record.sessionId?.section || 'N/A'})</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'P' || record.status === 'Present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {record.status || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                    {record.distanceFromFaculty !== undefined && record.distanceFromFaculty !== null
                                        ? `${Number(record.distanceFromFaculty).toFixed(1)}m`
                                        : 'N/A'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentHistory;
