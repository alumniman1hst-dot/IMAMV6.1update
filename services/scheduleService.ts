
import { db, isMockMode } from './firebase';

export interface ScheduleItem {
    id: string;
    day: string;     // e.g., "Senin"
    time: string;    // e.g., "07:30 - 09:00"
    subject: string; // e.g., "Matematika"
    class: string;   // e.g., "XII IPA 1"
    room: string;    // e.g., "R. 12"
}

const COLLECTION_NAME = 'schedules';

// Data Fallback jika Database kosong atau Izin Ditolak
const MOCK_SCHEDULES: ScheduleItem[] = [
    { id: '1', day: 'Senin', time: '07:30 - 09:00', subject: 'Matematika Wajib', class: 'XII IPA 1', room: 'R. 12' },
    { id: '2', day: 'Senin', time: '09:15 - 10:45', subject: 'Bahasa Indonesia', class: 'XII IPA 1', room: 'R. 12' },
    { id: '3', day: 'Senin', time: '11:00 - 12:30', subject: 'Fisika', class: 'XII IPA 1', room: 'Lab Fisika' },
    { id: '4', day: 'Selasa', time: '07:30 - 09:00', subject: 'Kimia', class: 'XII IPA 1', room: 'Lab Kimia' },
    { id: '5', day: 'Selasa', time: '09:15 - 10:45', subject: 'Biologi', class: 'XII IPA 1', room: 'Lab Biologi' },
    { id: '6', day: 'Rabu', time: '07:30 - 09:00', subject: 'Bahasa Inggris', class: 'XII IPA 1', room: 'R. 12' },
    { id: '7', day: 'Rabu', time: '09:15 - 10:45', subject: 'Sejarah', class: 'XII IPA 1', room: 'R. 12' },
    { id: '8', day: 'Kamis', time: '07:30 - 09:00', subject: 'Pendidikan Agama Islam', class: 'XII IPA 1', room: 'R. 12' },
    { id: '9', day: 'Kamis', time: '09:15 - 10:45', subject: 'PKn', class: 'XII IPA 1', room: 'R. 12' },
    { id: '10', day: 'Jumat', time: '07:30 - 09:00', subject: 'Seni Budaya', class: 'XII IPA 1', room: 'R. Seni' },
];

export const getSchedules = async (): Promise<ScheduleItem[]> => {
    // Mode Simulasi (Explicit)
    if (isMockMode) {
        return new Promise(resolve => setTimeout(() => resolve(MOCK_SCHEDULES), 800));
    }

    // Jika DB belum siap
    if (!db) return MOCK_SCHEDULES;
    
    try {
        const snapshot = await db.collection(COLLECTION_NAME).get();
        
        // Jika koleksi kosong, kembalikan fallback agar UI tidak kosong melompong
        if (snapshot.empty) {
             console.log("Jadwal di Firestore kosong, menampilkan data contoh.");
             return MOCK_SCHEDULES; 
        }

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleItem));
    } catch (error: any) {
        // Penanganan Khusus: Permission Denied
        // Ini terjadi jika Security Rules Firestore memblokir akses
        if (error.code === 'permission-denied') {
            console.warn("Akses Firestore ditolak untuk jadwal (Permission Denied). Menampilkan data fallback.");
            return MOCK_SCHEDULES;
        }
        
        console.error("Error fetching schedules:", error);
        return [];
    }
};

export const bulkImportSchedule = async (items: Omit<ScheduleItem, 'id'>[]): Promise<void> => {
    if (isMockMode) {
        console.log("Mock bulk import schedule:", items);
        return new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!db) throw new Error("Database not initialized");

    try {
        const batch = db.batch();
        items.forEach(item => {
            const docRef = db!.collection(COLLECTION_NAME).doc();
            batch.set(docRef, item);
        });
        
        await batch.commit();
    } catch (error: any) {
        console.error("Import Schedule Error:", error);
        throw error;
    }
};
