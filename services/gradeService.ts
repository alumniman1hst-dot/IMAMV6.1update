
import { db, isMockMode } from './firebase';
import { StudentGrade } from '../types';

const COLLECTION_GRADES = 'grades';
const COLLECTION_SUBJECTS = 'subjects';

// Default Subjects if DB is empty
const DEFAULT_SUBJECTS = [
    { id: 'MTK', name: 'Matematika Wajib' },
    { id: 'FIS', name: 'Fisika' },
    { id: 'BIO', name: 'Biologi' },
    { id: 'KIM', name: 'Kimia' },
    { id: 'IND', name: 'Bahasa Indonesia' },
    { id: 'ING', name: 'Bahasa Inggris' },
    { id: 'PAI', name: 'Pendidikan Agama Islam' },
    { id: 'PKN', name: 'PKn' },
    { id: 'SJD', name: 'Sejarah Indonesia' },
    { id: 'SBD', name: 'Seni Budaya' },
    { id: 'PJK', name: 'PJOK' },
    { id: 'PKW', name: 'Prakarya' },
];

export interface Subject {
    id: string;
    name: string;
}

export const getSubjects = async (): Promise<Subject[]> => {
    if (isMockMode) {
        return new Promise(resolve => setTimeout(() => resolve(DEFAULT_SUBJECTS), 500));
    }

    try {
        if (!db) throw new Error("Database not initialized");
        const snapshot = await db.collection(COLLECTION_SUBJECTS).get();
        if (snapshot.empty) {
            return DEFAULT_SUBJECTS; 
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
    } catch (error) {
        console.warn("Error fetching subjects, using defaults:", error);
        return DEFAULT_SUBJECTS;
    }
};

export const getGradesBySubject = async (subjectId: string): Promise<StudentGrade[]> => {
    if (isMockMode) {
        // Mock return empty or simulate local storage if needed, 
        // but typically input starts empty or cached in component for mock
        return []; 
    }

    try {
        if (!db) throw new Error("Database not initialized");
        const snapshot = await db.collection(COLLECTION_GRADES)
            .where('subjectId', '==', subjectId)
            .get();
        
        return snapshot.docs.map(doc => doc.data() as StudentGrade);
    } catch (error) {
        console.error("Error fetching grades:", error);
        return [];
    }
};

export const getGradesByStudent = async (studentId: string): Promise<StudentGrade[]> => {
    if (isMockMode) {
        // Return dummy grades for the mock student view
        return [
            { subjectId: 'MTK', studentId, nilaiHarian: 85, nilaiUTS: 80, nilaiUAS: 90, nilaiAkhir: 85 },
            { subjectId: 'FIS', studentId, nilaiHarian: 78, nilaiUTS: 82, nilaiUAS: 75, nilaiAkhir: 78.3 },
            { subjectId: 'BIO', studentId, nilaiHarian: 88, nilaiUTS: 85, nilaiUAS: 89, nilaiAkhir: 87.3 },
        ];
    }

    try {
        if (!db) throw new Error("Database not initialized");
        const snapshot = await db.collection(COLLECTION_GRADES)
            .where('studentId', '==', studentId)
            .get();
        
        return snapshot.docs.map(doc => doc.data() as StudentGrade);
    } catch (error) {
        console.error("Error fetching student grades:", error);
        return [];
    }
};

export const saveStudentGrade = async (grade: StudentGrade): Promise<void> => {
    if (isMockMode) {
        console.log("Mock save grade:", grade);
        return new Promise(resolve => setTimeout(resolve, 300));
    }

    try {
        if (!db) throw new Error("Database not initialized");
        
        // Create a unique ID for the grade document: subjectId_studentId
        const docId = `${grade.subjectId}_${grade.studentId}`;
        
        // Calculate Final Grade locally before saving to ensure consistency
        const final = (grade.nilaiHarian + grade.nilaiUTS + grade.nilaiUAS) / 3;
        const gradeToSave = { ...grade, nilaiAkhir: parseFloat(final.toFixed(2)) };

        await db.collection(COLLECTION_GRADES).doc(docId).set(gradeToSave, { merge: true });
    } catch (error) {
        console.error("Error saving grade:", error);
        throw error;
    }
};
