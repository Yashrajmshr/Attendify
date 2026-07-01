import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/axios';
import { MapPin, Camera, RefreshCw, QrCode, CheckCircle, AlertTriangle } from 'lucide-react';
import { getDeviceId } from '../utils/deviceInfo';

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
            stopScanning();
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
                qrGeneratedAt: scanResult.timestamp,
                deviceId: getDeviceId()
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
        <div className="premium-card overflow-hidden flex flex-col border border-slate-200/40 dark:border-white/5 shadow-premium">
            <style>{`
                @keyframes scan-animation {
                    0%, 100% { top: 0%; }
                    50% { top: 100%; }
                }
                .laser-line {
                    animation: scan-animation 3s ease-in-out infinite;
                }
            `}</style>
            
            <div className="p-4 border-b border-slate-200/40 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10">
                <div className="flex items-center gap-2">
                    <QrCode size={16} className="text-primary-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">Mark Attendance</span>
                </div>
                <div className="px-2 py-0.5 bg-primary-500/10 rounded text-[9px] font-mono font-black text-primary-500 animate-pulse uppercase tracking-wider">
                    {isScanning ? 'Scanner Active' : 'Scanner Idle'}
                </div>
            </div>

            {/* Error / Success message display inside panel */}
            {message && (
                <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 p-3 text-xs font-bold text-center border-b border-emerald-500/20 uppercase tracking-wider">
                    {message}
                </div>
            )}
            {error && (
                <div className="bg-rose-500/10 text-rose-600 dark:text-rose-455 p-3 text-xs font-bold text-center border-b border-rose-500/20 uppercase tracking-wider">
                    {error}
                </div>
            )}

            {/* Scanner Viewer */}
            <div 
                onClick={!isScanning && !scanResult ? startScanning : undefined}
                className={`relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer group ${isScanning ? 'pointer-events-none' : ''}`}
            >
                {isScanning ? (
                    <div className="relative w-full h-full">
                        <div id="reader" className="w-full h-full"></div>
                        <div className="absolute inset-0 pointer-events-none border border-primary-500/30 flex items-center justify-center">
                            <div className="w-40 h-40 border-2 border-primary-500/40 rounded-xl relative">
                                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary-500"></div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary-500"></div>
                                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary-500"></div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary-500"></div>
                                <div className="laser-line absolute left-0 w-full h-0.5 bg-primary-500 shadow-[0_0_10px_rgba(195,192,255,0.8)] z-20"></div>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                stopScanning();
                            }}
                            className="absolute bottom-3 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider border border-white/10 shadow-md transition-all active:scale-95"
                        >
                            Stop Camera
                        </button>
                    </div>
                ) : scanResult ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/60 p-6 text-center space-y-2.5">
                        <CheckCircle size={36} className="text-emerald-500 animate-scale-up" />
                        <div>
                            <h4 className="text-sm font-black text-white">{scanResult.subject || 'Session QR Verified'}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                Radius Limit: {scanResult.radius}m • Verified Signature
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={28} className="text-primary-500 mb-1.5" />
                            <p className="text-[10px] font-black text-white uppercase tracking-wider">Grant Permissions & Start</p>
                            <p className="text-[9px] text-slate-400 mt-1 max-w-[200px]">Click to launch camera for QR validation.</p>
                        </div>
                        
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-36 h-36 border-2 border-primary-500/20 rounded-xl flex items-center justify-center relative">
                                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary-500/60"></div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary-500/60"></div>
                                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary-500/60"></div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary-500/60"></div>
                                <Camera size={24} className="text-primary-500/40" />
                            </div>
                        </div>

                        {/* Background abstract texture */}
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
                    </>
                )}
            </div>

            {/* Controls panel */}
            <div className="p-5 bg-slate-50/50 dark:bg-slate-900/10 space-y-4">
                {/* Location verification display */}
                {location ? (
                    <div className="flex items-center justify-between p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-450">
                        <div className="flex items-center gap-2.5">
                            <MapPin size={16} />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider">GPS Verification Active</p>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">Accuracy ±3m • Lat: {location.lat.toFixed(3)} • Lng: {location.lng.toFixed(3)}</p>
                            </div>
                        </div>
                        <CheckCircle size={14} className="text-emerald-500" />
                    </div>
                ) : scanResult ? (
                    <div className="flex items-center justify-between p-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-450 animate-pulse">
                        <div className="flex items-center gap-2.5">
                            <MapPin size={16} />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider">GPS Coordinates Required</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">Verify your geofenced classroom location.</p>
                            </div>
                        </div>
                        <AlertTriangle size={14} className="text-amber-500" />
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/40 dark:border-white/5 bg-white dark:bg-slate-900/40 text-slate-400">
                        <div className="flex items-center gap-2.5">
                            <MapPin size={16} />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider">GPS Verification Offline</p>
                                <p className="text-[9px] text-slate-500 mt-0.5">Start scanning to prompt classroom check.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Primary Button */}
                {!scanResult ? (
                    <button
                        onClick={startScanning}
                        disabled={isScanning}
                        className="w-full bg-gradient-to-r from-primary-500 to-indigo-600 text-white py-3 px-4.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        <Camera size={14} />
                        <span>Launch Attendance Camera</span>
                    </button>
                ) : !location ? (
                    <button
                        onClick={getLocation}
                        disabled={loading}
                        className="w-full bg-amber-500 text-white py-3 px-4.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:bg-amber-600 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : <MapPin size={14} />}
                        <span>Verify Location Coordinates</span>
                    </button>
                ) : (
                    <button
                        onClick={markAttendance}
                        disabled={loading}
                        className="w-full bg-emerald-500 text-white py-3 px-4.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        <span>Mark Present in Class</span>
                    </button>
                )}

                {/* Reset / Reset Scan Button */}
                {(scanResult || message || error) && (
                    <button
                        onClick={resetScan}
                        className="w-full py-2 text-slate-400 hover:text-slate-655 dark:hover:text-slate-300 text-[10px] font-black uppercase tracking-wider transition-colors"
                    >
                        Reset Scanner View
                    </button>
                )}

                <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
                    Check-ins are cryptographically logged to your university profile.
                </p>
            </div>
        </div>
    );
};

export default ScanAttendance;
