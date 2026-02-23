
import { db, isMockMode, auth } from './firebase';
import { LetterRequest, LetterStatus, UserRole } from '../types';

const COLLECTION_NAME = 'letters';

const MOCK_LETTERS: LetterRequest[] = [
    {
        id: 'req-1',
        userId: 'user-1',
        userName: 'Ahmad Dahlan',
        userRole: UserRole.SISWA,
        type: 'Surat Keterangan Aktif',
        description: 'Untuk keperluan beasiswa prestasi.',
        date: new Date(Date.now() - 86400000).toISOString(), // Kemarin
        status: 'Signed',
        letterNumber: '421/105/MAN1HST/2024'
    },
    {
        id: 'req-2',
        userId: 'user-2',
        userName: 'Siti Aminah',
        userRole: UserRole.GURU,
        type: 'Surat Tugas',
        description: 'Menghadiri MGMP Matematika di Kandangan.',
        date: new Date().toISOString(),
        status: 'Pending'
    },
    {
        id: 'req-3',
        userId: 'user-3',
        userName: 'Budi Santoso',
        userRole: UserRole.SISWA,
        type: 'Legalisir Ijazah',
        description: 'Mohon legalisir 5 rangkap.',
        date: new Date(Date.now() - 172800000).toISOString(),
        status: 'Verified'
    }
];

export const getLetters = async (isAdmin: boolean): Promise<LetterRequest[]> => {
    if (isMockMode) {
        // Jika Admin, return semua. Jika user biasa, filter mock data (simulasi user-1)
        if (isAdmin) return new Promise(resolve => setTimeout(() => resolve(MOCK_LETTERS), 600));
        return new Promise(resolve => setTimeout(() => resolve(MOCK_LETTERS.filter(l => l.userId === 'user-1')), 600));
    }

    try {
        if (!db || !auth?.currentUser) throw new Error("Not authenticated");
        
        let query: any = db.collection(COLLECTION_NAME);
        
        // Jika bukan admin, hanya ambil surat milik sendiri
        if (!isAdmin) {
            query = query.where('userId', '==', auth.currentUser.uid);
        }

        const snapshot = await query.orderBy('date', 'desc').get();
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as LetterRequest));
    } catch (error: any) {
        // Handle Permission Denied (Common if rules missing)
        if (error.code === 'permission-denied') {
            console.warn("Firestore permission denied for letters. Using mock data as fallback to prevent UI crash.");
            // Graceful fallback to mock data
            if (isAdmin) return MOCK_LETTERS;
            return MOCK_LETTERS.filter(l => l.userId === 'user-1');
        }
        
        console.error("Error fetching letters:", error);
        throw error;
    }
};

export const createLetterRequest = async (request: Omit<LetterRequest, 'id'>): Promise<void> => {
    if (isMockMode) {
        console.log("Mock create letter:", request);
        MOCK_LETTERS.unshift({ ...request, id: `req-${Date.now()}` });
        return new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
        if (!db) throw new Error("Database not initialized");
        await db.collection(COLLECTION_NAME).add(request);
    } catch (error) {
        console.error("Error creating letter:", error);
        throw error;
    }
};

export const updateLetterStatus = async (id: string, status: LetterStatus, data?: Partial<LetterRequest>): Promise<void> => {
    if (isMockMode) {
        console.log("Mock update status:", id, status, data);
        const index = MOCK_LETTERS.findIndex(l => l.id === id);
        if (index !== -1) {
            MOCK_LETTERS[index] = { ...MOCK_LETTERS[index], status, ...data };
        }
        return new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
        if (!db) throw new Error("Database not initialized");
        await db.collection(COLLECTION_NAME).doc(id).update({ status, ...data });
    } catch (error) {
        console.error("Error updating letter:", error);
        throw error;
    }
};

export const deleteLetter = async (id: string): Promise<void> => {
    if (isMockMode) {
        const index = MOCK_LETTERS.findIndex(l => l.id === id);
        if (index !== -1) MOCK_LETTERS.splice(index, 1);
        return new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
        if (!db) throw new Error("Database not initialized");
        await db.collection(COLLECTION_NAME).doc(id).delete();
    } catch (error) {
        console.error("Error deleting letter:", error);
        throw error;
    }
};
