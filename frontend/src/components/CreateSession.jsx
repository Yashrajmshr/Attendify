import { useState } from 'react';
import api from '../api/axios';
import { MapPin } from 'lucide-react';

const CreateSession = () => {
    const [formData, setFormData] = useState({
        subject: '',
        section: '',
        radius: ''
    });
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const getLocation = () => {
        setLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLoading(false);
                    setError('');
                },
                (err) => {
                    setError('Error getting location: ' + err.message);
                    setLoading(false);
                }
            );
        } else {
            setError('Geolocation is not supported by this browser.');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!location) {
            setError('Please get your current location first.');
            return;
        }

        try {
            await api.post('/session', {
                ...formData,
                lat: location.lat,
                lng: location.lng,
                radius: Number(formData.radius)
            });
            setMessage('Session created successfully! Go to "Active Sessions" to view QR.');
            setFormData({ subject: '', section: '', radius: '' });
            setLocation(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create session');
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Create Attendance Session</h2>
            {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{message}</div>}
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Subject</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                        placeholder="e.g. Data Structures"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Section</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        required
                        placeholder="e.g. A"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Allowed Radius (meters)</label>
                    <input
                        type="number"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        value={formData.radius}
                        onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                        required
                        placeholder="e.g. 50"
                        min="10"
                    />
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        type="button"
                        onClick={getLocation}
                        disabled={loading}
                        className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                        <MapPin size={18} className="mr-2" />
                        {loading ? 'Getting Location...' : location ? 'Location Set' : 'Get Current Location'}
                    </button>
                    {location && <span className="text-sm text-green-600">Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</span>}
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold"
                >
                    Create Session
                </button>
            </form>
        </div>
    );
};

export default CreateSession;
