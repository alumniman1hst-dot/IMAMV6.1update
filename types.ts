
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import React from 'react';

export enum ViewState {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  DASHBOARD = 'DASHBOARD',
  PRESENSI = 'PRESENSI',
  CONTENT_GENERATION = 'CONTENT_GENERATION',
  REPORTS = 'REPORTS',
  PROFILE = 'PROFILE',
  CLASSES = 'CLASSES',
  PROMOTION = 'PROMOTION',
  SCHEDULE = 'SCHEDULE',
  SCANNER = 'SCANNER',
  ALL_FEATURES = 'ALL_FEATURES',
  ATTENDANCE_HISTORY = 'ATTENDANCE_HISTORY',
  ACADEMIC_YEAR = 'ACADEMIC_YEAR',
  JOURNAL = 'JOURNAL',
  ASSIGNMENTS = 'ASSIGNMENTS',
  GRADES = 'GRADES',
  REPORT_CARDS = 'REPORT_CARDS',
  STUDENTS = 'STUDENTS',
  TEACHERS = 'TEACHERS',
  ID_CARD = 'ID_CARD',
  LETTERS = 'LETTERS',
  CREATE_ACCOUNT = 'CREATE_ACCOUNT',
  DEVELOPER = 'DEVELOPER',
  LOGIN_HISTORY = 'LOGIN_HISTORY',
  ABOUT = 'ABOUT',
  HISTORY = 'HISTORY', 
  PREMIUM = 'PREMIUM', 
  NEWS = 'NEWS',
  MADRASAH_INFO = 'MADRASAH_INFO',
  ADVISOR = 'ADVISOR',
  SETTINGS = 'SETTINGS',
  PUSAKA = 'PUSAKA',
  GUIDE = 'GUIDE',
  POINTS = 'POINTS',
  KEMENAG_HUB = 'KEMENAG_HUB',
  CLAIM_MANAGEMENT = 'CLAIM_MANAGEMENT',
}

import { Role, type Role as UnifiedRole } from './src/auth/roles';

export const UserRole = Role;
export type UserRole = UnifiedRole;



export interface UserDoc {
  uid: string;
  name: string;
  email: string;
  role: 'SISWA' | 'GURU' | 'ADMIN' | string;
  roles?: string[];
  school_id: string;
  status: 'active' | string;
  loginId: string;
}
export interface ClaimRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'siswa' | 'guru';
  targetId: string; // NISN or NIP
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  adminReason?: string;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  autoMatch?: boolean; // New: metadata for auto-validation
}

export interface FAQItemData {
  question: string;
  answer: string;
  iconName: string;
}

export interface AboutContent {
  engineVersion: string;
  brandingText: string;
  devName: string;
  devNip: string;
  devQuote: string;
  faqs: FAQItemData[];
}

export interface MadrasahData {
  nama: string;
  nsm: string;
  npsn: string;
  alamat: string;
  telepon: string;
  email: string;
  website: string;
  kepalaNama: string;
  kepalaNip: string;
  visi?: string;
  misi?: string[];
  akreditasi?: string;
  photo?: string;
}

export interface ClassData {
    id?: string;
    name: string;
    level: string; 
    teacherId?: string; 
    teacherName?: string;
    academicYear: string;
    captainId?: string;
    captainName?: string;
    subjects?: string[];
}

export interface Student {
  id?: string;
  school_id: string;
  roles: string[];
  idUnik?: string;
  userlogin?: string;
  nis?: string;
  namaLengkap: string;
  nisn: string;
  nik?: string;
  email?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  tingkatRombel: string;
  umur?: string;
  status: 'Aktif' | 'Lulus' | 'Mutasi' | 'Keluar' | 'Nonaktif';
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  alamat?: string;
  noTelepon?: string;
  kebutuhanKhusus?: string;
  disabilitas?: string;
  nomorKIPP_PIP?: string;
  namaAyahKandung?: string;
  nikAyah?: string;
  pekerjaanAyah?: string;
  pendidikanAyah?: string;
  namaIbuKandung?: string;
  nikIbu?: string;
  pekerjaanIbu?: string;
  pendidikanIbu?: string;
  namaWali?: string;
  nikWali?: string;
  pekerjaanWali?: string;
  hpWali?: string;
  rt?: string;
  rw?: string;
  kelurahan?: string;
  kecamatan?: string;
  kabupaten?: string;
  kodePos?: string;
  jenisTinggal?: string;
  transportasi?: string;
  tglMasuk?: string;
  noAktaLahir?: string;
  peminatan?: string;
  accountStatus?: 'unclaimed' | 'active' | string;
  linkedUserId?: string;
  disciplinePoints?: number;
}

// Added 'Terlambat' and 'Haid' to AttendanceStatus to fix assignment errors in services and components
export type AttendanceStatus = 'Hadir' | 'Terlambat' | 'Sakit' | 'Izin' | 'Alpha' | 'Haid';

export interface AttendanceRecord {
    id: string;
    studentId: string;
    studentName: string;
    gender?: string;
    class: string;
    date: string;
    status: AttendanceStatus;
    checkIn: string | null;
    duha: string | null;
    zuhur: string | null;
    ashar: string | null;
    checkOut: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Teacher {
  id?: string;
  school_id: string;
  roles: string[];
  name: string;
  nip: string;
  subject: string;
  status: 'PNS' | 'PPPK' | 'GTY' | 'Honorer';
  phone?: string;
  email?: string;
  birthDate?: string;
  address?: string;
  linkedUserId?: string;
}

export type LetterStatus = 'Pending' | 'Verified' | 'Validated' | 'Signed' | 'Ditolak';

export interface LetterRequest {
  id?: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  type: string;
  description: string;
  date: string;
  status: LetterStatus;
  letterNumber?: string;
  adminNote?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  validatedBy?: string;
  validatedAt?: string;
  signedBy?: string;
  signedAt?: string;
  digitalSignatureHash?: string;
}

export interface StudentGrade {
  subjectId: string;
  studentId: string;
  nilaiHarian: number;
  nilaiUTS: number;
  nilaiUAS: number;
  nilaiAkhir: number;
}

export interface JournalEntry {
  id?: string;
  teacherId: string;
  teacherName: string;
  className: string;
  subject: string;
  date: string;
  jamKe: string;
  materi: string;
  catatan?: string;
  createdAt?: string;
}

export interface Assignment {
  id?: string;
  title: string;
  description: string;
  subject: string;
  className: string;
  teacherId: string;
  teacherName: string;
  dueDate: string;
  status: 'Open' | 'Closed';
  priority?: 'High' | 'Medium' | 'Low';
  createdAt?: string;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  timestamp: string;
  device: string;
  ip: string;
  status: 'Success' | 'Failed';
}

export interface ViolationMaster {
  id: string;
  category: string;
  description: string;
  points: number;
}

export interface DisciplineLog {
  id: string;
  studentId: string;
  studentName: string;
  type: 'Violation' | 'Reward';
  ruleId: string;
  ruleDescription: string;
  points: number;
  date: string;
  recordedBy: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  note?: string;
}
