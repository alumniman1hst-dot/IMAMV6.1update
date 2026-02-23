
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import firebase from 'firebase/compat/app';
import { db, isMockMode } from './firebase';
import { format } from 'date-fns';
import { Student, AttendanceStatus } from '../types';

// Updated AttendanceSession to include combined modes used in QRScanner
export type AttendanceSession = 'Masuk' | 'Duha' | 'Zuhur' | 'Ashar' | 'Pulang' | 'Masuk/Duha' | 'Ashar/Pulang';

interface ScanResult {
    success: boolean;
    message: string;
    student?: Student;
    timestamp?: string;
    statusRecorded?: AttendanceStatus;
}

/**
 * Mencatat kehadiran berdasarkan pemindaian ID Unik secara eksklusif.
 */
export const recordAttendanceByScan = async (rawCode: string, session: AttendanceSession, isHaid: boolean = false): Promise<ScanResult> => {
    // Sanitasi kode: Hapus karakter kontrol dan spasi
    const code = String(rawCode || '').replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim();
    
    if (!code) {
        return { success: false, message: "ID TIDAK TERBACA" };
    }

    const today = format(new Date(), "yyyy-MM-dd");
    const nowObj = new Date();
    const now = format(nowObj, "HH:mm:ss");
    const nowShort = format(nowObj, "HH:mm");
    const currentHour = nowObj.getHours();
    const LATE_THRESHOLD = "07:30:00"; 

    // PERUBAHAN: Jika mode haid, rekam status beserta waktunya agar bisa ditampilkan
    const recordValue = isHaid ? `${nowShort} H` : now;
    
    // Map session to the appropriate database field
    const fieldMap: Record<AttendanceSession, string> = {
        'Masuk': 'checkIn',
        'Duha': 'duha',
        'Zuhur': 'zuhur',
        'Ashar': 'ashar',
        'Pulang': 'checkOut',
        'Masuk/Duha': currentHour < 8 ? 'checkIn' : 'duha',
        'Ashar/Pulang': currentHour < 16 ? 'ashar' : 'checkOut'
    };
    const fieldName = fieldMap[session];

    // --- MODE SIMULASI ---
    if (isMockMode) {
        return new Promise<ScanResult>(resolve => {
            setTimeout(() => {
                if (code === "000") return resolve({ success: false, message: "ID TIDAK TERDAFTAR" });
                const isLate = (session === 'Masuk' || session === 'Masuk/Duha') && now > LATE_THRESHOLD;
                resolve({
                    success: true,
                    message: isHaid ? "STATUS HAID TERKONFIRMASI" : (isLate ? "MASUK (TERLAMBAT)" : "PRESENSI BERHASIL"),
                    student: { namaLengkap: 'SISWA SIMULASI', tingkatRombel: 'XII IPA 1', idUnik: code, jenisKelamin: 'Perempuan' } as any,
                    timestamp: recordValue,
                    statusRecorded: isHaid ? 'Haid' : (isLate ? 'Terlambat' : 'Hadir')
                });
            }, 400);
        });
    }

    if (!db) return { success: false, message: "DATABASE OFFLINE" };

    try {
        let studentData: Student | null = null;
        
        const studentDoc = await db.collection('students').doc(code).get();
        if (studentDoc.exists) {
            studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
        } else {
            const studentQuery = await db.collection('students').where('idUnik', '==', code).limit(1).get();
            if (!studentQuery.empty) {
                const sDoc = studentQuery.docs[0];
                studentData = { id: sDoc.id, ...sDoc.data() } as Student;
            }
        }

        if (!studentData) {
            return { success: false, message: `ID "${code}" TIDAK TERDAFTAR` };
        }

        if (isHaid && !['Duha', 'Zuhur', 'Ashar'].includes(session)) {
            return { success: false, message: "MODE HAID KHUSUS SESI DUHA/ZUHUR/ASHAR" };
        }

        if (isHaid && studentData.jenisKelamin === 'Laki-laki') {
            return { success: false, message: "MODE HAID HANYA UNTUK PUTRI", student: studentData };
        }

        const attendanceId = `${studentData.id}_${today}`;
        const attendanceRef = db.collection('attendance').doc(attendanceId);
        const docSnapshot = await attendanceRef.get();
        const currentData = docSnapshot?.exists ? docSnapshot.data() : null;

        if (docSnapshot?.exists && currentData) {
            if (currentData[fieldName] && !currentData[fieldName].startsWith('Alpha')) {
                return { success: false, message: `SUDAH TERREKAM`, student: studentData };
            }
        }

        const isLate = (session === 'Masuk' || session === 'Masuk/Duha') && now > LATE_THRESHOLD;
        const updatePayload: any = { 
            [fieldName]: recordValue,
            studentId: studentData.id,
            studentName: studentData.namaLengkap,
            class: studentData.tingkatRombel,
            idUnik: studentData.idUnik,
            date: today,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (isHaid) {
            updatePayload.status = 'Haid';
        } else if (!currentData?.status || currentData.status === 'Alpha' || currentData.status === 'Hadir' || currentData.status === 'Terlambat') {
            if (session === 'Masuk' || session === 'Masuk/Duha') {
                updatePayload.status = isLate ? 'Terlambat' : 'Hadir';
            }
        }

        if (docSnapshot?.exists) {
            await attendanceRef.update(updatePayload);
        } else {
            await attendanceRef.set(updatePayload);
        }

        return {
            success: true,
            message: isHaid ? "STATUS HAID DICATAT" : (isLate ? "MASUK (TERLAMBAT)" : "BERHASIL"),
            student: studentData,
            timestamp: recordValue,
            statusRecorded: updatePayload.status || 'Hadir'
        };

    } catch (error: any) {
        console.error("Attendance Error:", error);
        return { success: false, message: "GANGGUAN IZIN DATABASE" };
    }
};
