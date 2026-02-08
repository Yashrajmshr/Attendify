import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Upload, UserPlus } from 'lucide-react';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [uploading, setUploading] = useState(false);

    const fetchStudents = async () => {
        try {
            const { data } = await api.get('/student');
            setStudents(data);
        } catch (error) {
            console.error('Failed to fetch students', error);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const { data } = await api.post('/student/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage(data.message);
            setUploading(false);
            setFile(null);
            fetchStudents();
        } catch (error) {
            setMessage('Upload failed');
            setUploading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Manage Students</h2>

            {/* Upload Section */}
            <div className="bg-blue-50 p-4 rounded-lg mb-8 border border-blue-100">
                <h3 className="font-bold mb-2 flex items-center"><Upload size={18} className="mr-2" /> Bulk Upload Students</h3>
                <p className="text-sm text-gray-600 mb-4">Upload an Excel file (.xlsx) with columns: Name, Email, Password, RollNumber, Department, Section</p>
                <form onSubmit={handleUpload} className="flex gap-4 items-center">
                    <input
                        type="file"
                        accept=".xlsx"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className={`px-4 py-2 rounded text-white ${!file || uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </form>
                {message && <p className="mt-2 text-sm font-semibold text-green-700">{message}</p>}
            </div>

            {/* Student List */}
            <h3 className="font-bold mb-2">Registered Students ({students.length})</h3>
            <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dept/Sec</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student) => (
                            <tr key={student._id}>
                                <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{student.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{student.rollNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{student.department} / {student.section}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentManagement;
