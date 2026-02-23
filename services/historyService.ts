
import { db, isMockMode } from './firebase';
import { LoginHistoryEntry } from '../types';

const COLLECTION_NAME = 'login_logs';

const getDeviceName = (): string => {
    const userAgent = navigator.userAgent;
    if (/android/i.test(userAgent)) return "Android Device";
    if (/iPad|iPhone|iPod/.test(userAgent)) return "iOS Device";
    if (/windows phone/i.test(userAgent)) return "Windows Phone";
    if (/Win/i.test(userAgent)) return "Windows Desktop";
    if (/Mac/i.test(userAgent)) return "Macintosh";
    if (/Linux/i.test(userAgent)) return "Linux Desktop";
    return "Unknown Device";
};

export const logLoginEvent = async (userId: string, status: 'Success' | 'Failed' = 'Success'): Promise<void> => {
    const entry: Omit<LoginHistoryEntry, 'id'> = {
        userId,
        timestamp: new Date().toISOString(),
        device: getDeviceName(),
        ip: '127.0.0.1', // Placeholder, real IP requires server-side or 3rd party API
        status
    };

    if (isMockMode) {
        console.log(`[Mock] Login logged: ${status} for ${userId} on ${entry.device}`);
        // In mock mode, we can store in localStorage to simulate persistence
        const existing = JSON.parse(localStorage.getItem('mock_login_history') || '[]');
        existing.unshift({ ...entry, id: `log-${Date.now()}` });
        localStorage.setItem('mock_login_history', JSON.stringify(existing.slice(0, 50))); // Keep last 50
        return;
    }

    try {
        if (!db) return;
        await db.collection(COLLECTION_NAME).add(entry);
    } catch (error: any) {
        // Handle permission errors gracefully (Check Code AND Message)
        if (error.code === 'permission-denied' || (error.message && error.message.includes('Missing or insufficient permissions'))) {
            console.warn("Login logging: Permission denied by Firestore. Using local fallback.");
            // Store locally as fallback so the user still sees history
            const existing = JSON.parse(localStorage.getItem('local_login_history_fallback') || '[]');
            existing.unshift({ ...entry, id: `local-${Date.now()}` });
            localStorage.setItem('local_login_history_fallback', JSON.stringify(existing.slice(0, 50)));
        } else {
            console.error("Failed to log login event:", error);
        }
    }
};

export const getLoginHistory = async (userId: string): Promise<LoginHistoryEntry[]> => {
    if (isMockMode) {
        const stored = localStorage.getItem('mock_login_history');
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.filter((log: LoginHistoryEntry) => log.userId === userId || userId === 'mock-user-123'); // Filter for mock user
        }
        // Default Mock Data if empty
        return [
            { id: '1', userId, timestamp: new Date().toISOString(), device: 'Windows Desktop', status: 'Success', ip: '192.168.1.1' },
            { id: '2', userId, timestamp: new Date(Date.now() - 86400000).toISOString(), device: 'Android Device', status: 'Success', ip: '192.168.1.5' },
            { id: '3', userId, timestamp: new Date(Date.now() - 172800000).toISOString(), device: 'Windows Desktop', status: 'Success', ip: '192.168.1.1' }
        ];
    }

    try {
        if (!db) throw new Error("Database not initialized");
        const snapshot = await db.collection(COLLECTION_NAME)
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();
        
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoginHistoryEntry));
    } catch (error: any) {
        console.error("Error fetching login history:", error);
        
        // Return local fallback on permission error
        if (error.code === 'permission-denied' || (error.message && error.message.includes('Missing or insufficient permissions'))) {
            const stored = localStorage.getItem('local_login_history_fallback');
            if (stored) {
                return JSON.parse(stored);
            }
        }
        return [];
    }
};
