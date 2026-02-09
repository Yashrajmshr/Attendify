import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import api from '../api/axios';
import { MapPin, Camera, RefreshCw } from 'lucide-react';

const ScanAttendance = () => {
    const [scanResult, setScanResult] = useState(null);
    const [location, setLocation] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    // Ref for the scanner instance
    const scannerRef = useRef(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
            }
        };
    }, []);

    const startScanning = async () => {
        setError('');
        setMessage('');
        setIsScanning(true);

        try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length) {
                const cameraId = devices[0].id; // Use first available camera if facingMode fails

                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => handleScanSuccess(decodedText),
                    (errorMessage) => { /* ignore */ }
                );
            } else {
                setError("No cameras found on this device.");
                setIsScanning(false);
            }
        } catch (err) {
            console.error("Camera Error:", err);
            setIsScanning(false);
            // Show exact error to user for debugging
            setError(`Camera Error: ${err?.message || err}`);
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
                setIsScanning(false);
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
    };

    const handleScanSuccess = (decodedText) => {
        try {
            const parsed = JSON.parse(decodedText);
            setScanResult(parsed);
            stopScanning(); // Stop camera after success
        } catch (e) {
            console.error("Invalid QR format");
            setError("Invalid QR Code detected.");
        }
    };

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
                lng: location.lng,
                qrGeneratedAt: scanResult.timestamp // Send timestamp from QR
            });
            setMessage('Attendance Marked Successfully! 🎉');
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to mark attendance');
            setMessage('');
        } finally {
            setLoading(false);
        }
    };

    const resetScan = () => {
        setScanResult(null);
        setLocation(null);
        setMessage('');
        setError('');
        setIsScanning(false);
    };

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-2 text-slate-800">Mark Attendance</h2>
            <p className="text-xs text-slate-400 mb-6">v1.2 (Debug Mode)</p>

            {message && (
                <div className="bg-green-100 border border-green-200 text-green-700 p-4 rounded-xl mb-6 w-full text-center flex items-center justify-center shadow-sm">
                    <span className="font-medium">{message}</span>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 w-full text-center shadow-sm">
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {!scanResult ? (
                <div className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    {!isScanning ? (
                        <div className="text-center py-8">
                            <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Camera size={32} className="text-indigo-600" />
                            </div>
                            <p className="text-slate-600 mb-6">Scan the Faculty's QR Code to mark your presence.</p>
                            <button
                                onClick={startScanning}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center mx-auto"
                            >
                                <Camera size={20} className="mr-2" />
                                Open Camera
                            </button>
                        </div>
                    ) : (
                        <div className="relative overflow-hidden rounded-xl bg-black">
                            <div id="reader" className="w-full"></div>
                            <button
                                onClick={stopScanning}
                                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm"
                            >
                                Stop Camera
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 space-y-6">
                    <div className="text-center border-b border-slate-100 pb-4">
                        <h3 className="text-lg font-bold text-slate-800">{scanResult.subject}</h3>
                        <div className="flex justify-center items-center mt-2 space-x-2">
                            <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">Radius: {scanResult.radius}m</span>
                            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">QR Verified</span>
                        </div>
                    </div>

                    {!location ? (
                        <div className="text-center py-2">
                            <p className="mb-4 text-sm text-slate-500">We need your location to verify you are in class.</p>
                            <button
                                onClick={getLocation}
                                disabled={loading}
                                className="w-full flex items-center justify-center py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium shadow-md"
                            >
                                {loading ? (
                                    <span className="flex items-center"><RefreshCw className="animate-spin mr-2" size={18} /> Locating...</span>
                                ) : (
                                    <span className="flex items-center"><MapPin size={18} className="mr-2" /> Get My Location</span>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-center justify-center text-emerald-700">
                                <MapPin size={18} className="mr-2" />
                                <span className="text-sm font-medium">Location Acquired</span>
                            </div>
                            <button
                                onClick={markAttendance}
                                disabled={loading}
                                className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-bold shadow-md text-lg"
                            >
                                {loading ? 'Submitting...' : 'Mark Present ✅'}
                            </button>
                        </div>
                    )}

                    {!message && (
                        <button
                            onClick={resetScan}
                            className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-medium"
                        >
                            Cancel
                        </button>
                    )}

                    {message && (
                        <button
                            onClick={resetScan}
                            className="w-full py-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                            Scan Another
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ScanAttendance;
