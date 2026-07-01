/**
 * Generates or retrieves a persistent device identifier for the browser.
 * Combines a stored UUID with basic browser metadata.
 */
export const getDeviceId = () => {
    let deviceId = localStorage.getItem('attendify_device_id');

    if (!deviceId) {
        // Generate a new UUID if none exists using native browser crypto
        try {
            deviceId = crypto.randomUUID();
        } catch {
            // Fallback for older browsers
            deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }
        localStorage.setItem('attendify_device_id', deviceId);
    }

    return deviceId;
};
