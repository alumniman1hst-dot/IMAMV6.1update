
import { db, isMockMode, auth } from './firebase';
import { JournalEntry, Assignment } from '../types';

const JOURNAL_COLLECTION = 'journals';
const ASSIGNMENT_COLLECTION = 'assignments';

// --- MOCK DATA ---
const MOCK_JOURNALS: JournalEntry[] = [
    {
        id: 'j1',
        teacherId: 'mock-teacher-1',
        teacherName: 'Budi Santoso, S.Pd',
        className: 'X IPA 1',
        subject: 'Matematika Wajib',
        date: new Date().toISOString().split('T')[0],
        jamKe: '1-2',
        materi: 'Persamaan Linear Tiga Variabel',
        catatan: 'Siswa antusias, 2 orang izin ke UKS.'
    }
];

const MOCK_ASSIGNMENTS: Assignment[] = [
    {
        id: 'a1',
        title: 'Latihan Soal SPLTV',
        description: 'Kerjakan LKS Halaman 15 Nomor 1-5.',
        subject: 'Matematika Wajib',
        className: 'X IPA 1',
        teacherId: 'mock-teacher-1',
        teacherName: 'Budi Santoso, S.Pd',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        status: 'Open',
        priority: 'Medium',
        createdAt: new Date().toISOString()
    }
];

// --- JOURNAL SERVICES ---

export const getJournals = async (teacherId?: string): Promise<JournalEntry[]> => {
    if (isMockMode) return MOCK_JOURNALS;
    try {
        if (!db) throw new Error("Database not initialized");
        let query: any = db.collection(JOURNAL_COLLECTION).orderBy('date', 'desc').limit(50); // LIMIT 50
        if (teacherId) query = query.where('teacherId', '==', teacherId);
        const snapshot = await query.get();
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as JournalEntry));
    } catch (error: any) {
        console.error("Error fetching journals:", error);
        return [];
    }
};

export const addJournal = async (entry: Omit<JournalEntry, 'id'>): Promise<void> => {
    if (isMockMode) return;
    try {
        if (!db) throw new Error("Database not initialized");
        await db.collection(JOURNAL_COLLECTION).add({ ...entry, createdAt: new Date().toISOString() });
    } catch (error) { throw error; }
};

// --- ASSIGNMENT SERVICES ---

export const getAssignments = async (className?: string): Promise<Assignment[]> => {
    if (isMockMode) return MOCK_ASSIGNMENTS;
    try {
        if (!db) throw new Error("Database not initialized");
        let query: any = db.collection(ASSIGNMENT_COLLECTION).orderBy('dueDate', 'asc').limit(50); // LIMIT 50
        if (className) query = query.where('className', '==', className);
        const snapshot = await query.get();
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Assignment));
    } catch (error: any) {
        console.error("Error fetching assignments:", error);
        return [];
    }
};

export const addAssignment = async (assignment: Omit<Assignment, 'id' | 'createdAt'>): Promise<void> => {
    if (isMockMode) return;
    try {
        if (!db) throw new Error("Database not initialized");
        await db.collection(ASSIGNMENT_COLLECTION).add({ ...assignment, createdAt: new Date().toISOString() });
    } catch (error) { throw error; }
};
