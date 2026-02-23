/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import { db, isMockMode, auth } from './firebase';
import { ClaimRequest, UserRole } from '../types';

const COLLECTION_NAME = 'claim_requests';

/**
 * Utilitas untuk membersihkan nama dari gelar-gelar akademik umum di Indonesia
 */
export const cleanAcademicName = (name: string): string => {
    if (!name) return "";
    
    // 1. Hapus gelar di depan (Drs, Dra, Hj, H, Prof, Dr, Ir)
    let cleaned = name.replace(/\b(Drs|Dra|Hj|H|Prof|Dr|Ir|Ustadz|Kiai)\.?\s+/gi, "");
    
    // 2. Hapus gelar di belakang yang diawali koma (S.Pd, M.Pd, S.T, M.T, dll)
    // Serta bersihkan spasi ganda dan tanda baca titik/koma yang tersisa
    cleaned = cleaned.replace(/,\s?([A-Z][a-z]?\.?)+(\s?[A-Z][a-z]?\.?)*/g, "");
    cleaned = cleaned.replace(/[.,]/g, "");
    
    return cleaned.trim().toLowerCase();
};

export const submitClaimRequest = async (type: 'siswa' | 'guru', targetId: string, secondaryId: string): Promise<void> => {
    if (isMockMode) {
        console.log("Mock kirim klaim:", type, targetId, secondaryId);
        return new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!db || !auth?.currentUser) throw new Error("Akses ditolak. Sesi tidak aktif.");
    const userId = auth.currentUser.uid;
    
    // Cek pengajuan yang masih aktif
    const existing = await db.collection(COLLECTION_NAME)
        .where('userId', '==', userId)
        .where('status', 'in', ['pending', 'reviewing'])
        .get();
    
    if (!existing.empty) {
        throw new Error("Anda masih memiliki pengajuan aktif yang sedang diproses.");
    }

    const request: any = {
        userId: userId,
        userName: auth.currentUser.displayName || 'User',
        userEmail: auth.currentUser.email || '',
        type: type,
        targetId: targetId.trim(),
        secondaryId: secondaryId.trim(), 
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    // Logic Auto-Match untuk membantu Admin
    try {
        const parentCollection = type === 'siswa' ? 'students' : 'teachers';
        const masterDoc = await db.collection(parentCollection).doc(targetId.trim()).get();
        
        if (masterDoc.exists) {
            const masterData = masterDoc.data();
            const masterName = masterData?.namaLengkap || masterData?.name || "";
            
            if (type === 'guru') {
                const cleanInputName = cleanAcademicName(secondaryId);
                const cleanMasterName = cleanAcademicName(masterName);
                if (cleanInputName === cleanMasterName) request.autoMatch = true;
            } else {
                if (masterData?.idUnik === secondaryId.trim() || masterData?.nisn === secondaryId.trim()) request.autoMatch = true;
            }
        }
    } catch (e) { console.warn("Auto-match check failed", e); }

    await db.collection(COLLECTION_NAME).add(request);
};

export const getClaimsByStatus = async (status: ClaimRequest['status'] | 'all'): Promise<ClaimRequest[]> => {
    if (isMockMode) return [];
    if (!db) return [];

    let query: any = db.collection(COLLECTION_NAME).orderBy('createdAt', 'desc');
    if (status !== 'all') {
        query = query.where('status', '==', status);
    }
    
    const snap = await query.get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClaimRequest));
};

export const setClaimToReview = async (id: string): Promise<void> => {
    if (isMockMode || !db || !auth?.currentUser) return;
    await db.collection(COLLECTION_NAME).doc(id).update({
        status: 'reviewing',
        processedBy: auth.currentUser.displayName || 'Admin',
        processedAt: new Date().toISOString()
    });
};

export const approveClaim = async (request: ClaimRequest): Promise<void> => {
    if (isMockMode || !db || !auth?.currentUser) return;

    const batch = db.batch();
    const claimRef = db.collection(COLLECTION_NAME).doc(request.id);
    const userRef = db.collection('users').doc(request.userId);

    batch.update(claimRef, {
        status: 'approved',
        processedAt: new Date().toISOString(),
        processedBy: auth.currentUser.displayName || 'Admin'
    });

    const newRole = request.type === 'siswa' ? UserRole.SISWA : UserRole.GURU;
    const parentCollection = request.type === 'siswa' ? 'students' : 'teachers';
    
    // Update data akun user
    batch.update(userRef, {
        role: newRole,
        idUnik: request.targetId,
        claimVerified: true,
        [request.type === 'siswa' ? 'studentId' : 'teacherId']: request.targetId
    });

    // Link ke database master
    batch.update(db.collection(parentCollection).doc(request.targetId), {
        accountStatus: 'Active',
        linkedUserId: request.userId,
        isClaimed: true,
        updatedAt: new Date().toISOString()
    });

    await batch.commit();
};

export const rejectClaim = async (id: string, reason: string): Promise<void> => {
    if (isMockMode || !db || !auth?.currentUser) return;
    await db.collection(COLLECTION_NAME).doc(id).update({
        status: 'rejected',
        adminReason: reason,
        processedAt: new Date().toISOString(),
        processedBy: auth.currentUser.displayName || 'Admin'
    });
};

export const getMyClaimRequests = async (): Promise<ClaimRequest[]> => {
    if (isMockMode || !db || !auth?.currentUser) return [];
    const snap = await db.collection(COLLECTION_NAME)
        .where('userId', '==', auth.currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClaimRequest));
};