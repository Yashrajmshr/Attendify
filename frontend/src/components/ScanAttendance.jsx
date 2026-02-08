import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api/axios';
import { MapPin } from 'lucide-react';

const ScanAttendance = () => {
    const [scanResult, setScanResult] = useState(null);
    const [location, setLocation] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initialize scanner only if not already scanned
        if (!scanResult) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render(onScanSuccess, onScanFailure);

            function onScanSuccess(decodedText, decodedResult) {
                // Handle the scanned code as you like, for example:
                console.log(`Code matched = ${decodedText}`, decodedResult);
                try {
                    const parsed = JSON.parse(decodedText);
                    setScanResult(parsed);
                    scanner.clear();
                } catch (e) {
                    console.error("Invalid QR format");
                }
            }

            function onScanFailure(error) {
                // handle scan failure, usually better to ignore and keep scanning.
                // console.warn(`Code scan error = ${error}`);
            }

            return () => {
                scanner.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
            };
        }
    }, [scanResult]);

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

    const markAttendance = async () => {
        if (!location || !scanResult) return;

        setLoading(true);
        try {
            const { data } = await api.post('/attendance', {
                sessionId: scanResult.sessionId,
                lat: location.lat,
                lng: location.lng
            });
            setMessage('Attendance Marked Successfully!');
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to mark attendance');
            setMessage('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4">Scan QR to Mark Attendance</h2>

            {message && <div className="bg-green-100 text-green-700 p-4 rounded mb-4 w-full text-center">{message}</div>}
            {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4 w-full text-center">{error}</div>}

            {!scanResult && (
                <div id="reader" className="w-full max-w-md"></div>
            )}

            {scanResult && !message && (
                <div className="w-full max-w-md bg-gray-50 p-4 rounded-lg shadow space-y-4">
                    <div className="p-2 border-b">
                        <p><strong>Subject:</strong> {scanResult.subject}</p>
                        <p><strong>Allowed Radius:</strong> {scanResult.radius}m</p>
                    </div>

                    {!location ? (
                        <div className="text-center">
                            <p className="mb-2 text-sm text-gray-600">Location is required to verify your presence.</p>
                            <button
                                onClick={getLocation}
                                disabled={loading}
                                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
                            >
                                <MapPin size={18} className="mr-2" />
                                {loading ? 'Getting Location...' : 'Get My Location'}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="mb-2 text-sm text-green-600 flex justify-center items-center"><MapPin size={16} /> Location Acquired</p>
                            <button
                                onClick={markAttendance}
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full font-bold"
                            >
                                {loading ? 'Marking...' : 'Submit Attendance'}
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => { setScanResult(null); setLocation(null); setMessage(''); setError(''); }}
                        className="text-sm text-gray-500 underline mt-2 w-full text-center"
                    >
                        Cancel / Scan Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default ScanAttendance;
