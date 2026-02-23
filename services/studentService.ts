
import { db, isMockMode } from './firebase';
import { Student } from '../types';

const COLLECTION_NAME = 'students';
const CACHE_KEY = 'imam_students_cache_v2';
const CACHE_TIME_KEY = 'imam_students_cache_time';
const CACHE_DURATION = 1000 * 60 * 30; // 30 Menit Cache

export const getStudents = async (forceRefresh = false): Promise<Student[]> => {
  if (isMockMode) {
      return [{ id: 'mock-1', namaLengkap: 'DIENDE ADELLYA AQILLA', nisn: '0086806447', tingkatRombel: '12 A', status: 'Aktif', jenisKelamin: 'Perempuan' } as any];
  }

  if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY);
      const cacheTime = localStorage.getItem(CACHE_TIME_KEY);
      const now = Date.now();
      
      if (cached && cacheTime && (now - parseInt(cacheTime) < CACHE_DURATION)) {
          return JSON.parse(cached);
      }
  }

  try {
    if (!db) throw new Error("Database not initialized");
    const snapshot = await db.collection(COLLECTION_NAME).orderBy('namaLengkap').get();
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(students));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    
    return students;
  } catch (error: any) {
    console.error("Error fetching students:", error);
    const fallback = localStorage.getItem(CACHE_KEY);
    return fallback ? JSON.parse(fallback) : [];
  }
};

/**
 * OPTIMASI KUOTA: Ambil data siswa berdasarkan kelas dengan limit
 */
export const getStudentsByClass = async (className: string): Promise<Student[]> => {
    if (isMockMode) return getStudents();
    try {
        if (!db) throw new Error("Database not initialized");
        // Query langsung di server dengan limit 50
        const snapshot = await db.collection(COLLECTION_NAME)
            .where('tingkatRombel', '==', className)
            .limit(50) 
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    } catch (error) {
        console.error("Error fetching students by class:", error);
        return [];
    }
};

export const addStudent = async (student: Student): Promise<void> => {
  if (isMockMode) return;
  try {
    if (!db) throw new Error("Database not initialized");
    const docId = student.nisn || db.collection(COLLECTION_NAME).doc().id;
    await db.collection(COLLECTION_NAME).doc(docId).set({ ...student, createdAt: new Date().toISOString() }, { merge: true });
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    throw error;
  }
};

export const updateStudent = async (id: string, student: Partial<Student>): Promise<void> => {
  if (isMockMode) return;
  try {
    if (!db) throw new Error("Database not initialized");
    await db.collection(COLLECTION_NAME).doc(id).update(student);
    localStorage.removeItem(CACHE_KEY); 
  } catch (error) {
    throw error;
  }
};

export const deleteStudent = async (id: string): Promise<void> => {
    if (isMockMode) return;
    try {
        if (!db) throw new Error("Database not initialized");
        await db.collection(COLLECTION_NAME).doc(id).delete();
        localStorage.removeItem(CACHE_KEY);
    } catch (error) {
        throw error;
    }
}
