
import { db, isMockMode } from './firebase';
import { Teacher } from '../types';

const COLLECTION_NAME = 'teachers';
const CACHE_KEY = 'imam_teachers_cache_v1';
const CACHE_TIME_KEY = 'imam_teachers_cache_time';
const CACHE_DURATION = 1000 * 60 * 60; // 1 Jam Cache

export const getTeachers = async (forceRefresh = false): Promise<Teacher[]> => {
  if (isMockMode) {
      return [
          { id: 't1', name: 'Budi Santoso, S.Pd', nip: '198001012005011001', subject: 'Matematika', status: 'PNS' },
          { id: 't2', name: 'Siti Aminah, M.Ag', nip: '198505052010012003', subject: 'Fikih', status: 'PNS' }
      ] as Teacher[];
  }

  // OPTIMASI: Cek Cache
  if (!forceRefresh) {
      const cached = localStorage.getItem(CACHE_KEY);
      const cacheTime = localStorage.getItem(CACHE_TIME_KEY);
      if (cached && cacheTime && (Date.now() - parseInt(cacheTime) < CACHE_DURATION)) {
          console.log("IMAM DB: Memuat data guru dari Cache");
          return JSON.parse(cached);
      }
  }

  try {
    if (!db) throw new Error("Database not initialized");
    console.log("IMAM DB: Fetching teachers from server...");
    const snapshot = await db.collection(COLLECTION_NAME).orderBy('name').get();
    const teachers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher));
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(teachers));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    
    return teachers;
  } catch (error: any) {
    console.error("Error fetching teachers:", error);
    const fallback = localStorage.getItem(CACHE_KEY);
    return fallback ? JSON.parse(fallback) : [];
  }
};

export const addTeacher = async (teacher: Teacher): Promise<void> => {
  if (isMockMode) return;
  try {
    if (!db) throw new Error("Database not initialized");
    await db.collection(COLLECTION_NAME).add(teacher);
    localStorage.removeItem(CACHE_KEY); // Invalidate cache
  } catch (error) { throw error; }
};

export const updateTeacher = async (id: string, teacher: Partial<Teacher>): Promise<void> => {
    if (isMockMode) return;
    try {
        if (!db) throw new Error("Database not initialized");
        await db.collection(COLLECTION_NAME).doc(id).update(teacher);
        localStorage.removeItem(CACHE_KEY);
    } catch (error) { throw error; }
}

export const deleteTeacher = async (id: string): Promise<void> => {
    if (isMockMode) return;
    try {
        if (!db) throw new Error("Database not initialized");
        await db.collection(COLLECTION_NAME).doc(id).delete();
        localStorage.removeItem(CACHE_KEY);
    } catch (error) { throw error; }
}
