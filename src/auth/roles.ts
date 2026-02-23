export const Role = {
  // Core
  ADMIN: 'ADMIN',
  DEVELOPER: 'DEVELOPER',

  // Leadership
  KEPALA_MADRASAH: 'KEPALA_MADRASAH',
  WAKA_KURIKULUM: 'WAKA_KURIKULUM',
  WAKA_KESISWAAN: 'WAKA_KESISWAAN',
  WAKA_SARPRAS: 'WAKA_SARPRAS',

  // Academic
  GURU: 'GURU',
  WALI_KELAS: 'WALI_KELAS',
  BK: 'BK',

  // Operational
  STAF_TU: 'STAF_TU',
  OPERATOR: 'OPERATOR',
  PETUGAS_PIKET: 'PETUGAS_PIKET',

  // Student Side
  SISWA: 'SISWA',
  KETUA_KELAS: 'KETUA_KELAS',
  ORANG_TUA: 'ORANG_TUA',

  // Public
  TAMU: 'TAMU',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const roleHierarchy: Readonly<Record<Role, number>> = {
  [Role.DEVELOPER]: 100,
  [Role.ADMIN]: 90,
  [Role.KEPALA_MADRASAH]: 80,
  [Role.WAKA_KURIKULUM]: 70,
  [Role.WAKA_KESISWAAN]: 70,
  [Role.WAKA_SARPRAS]: 70,
  [Role.OPERATOR]: 65,
  [Role.STAF_TU]: 60,
  [Role.GURU]: 60,
  [Role.WALI_KELAS]: 60,
  [Role.BK]: 60,
  [Role.PETUGAS_PIKET]: 50,
  [Role.KETUA_KELAS]: 20,
  [Role.ORANG_TUA]: 15,
  [Role.SISWA]: 10,
  [Role.TAMU]: 0,
} as const;

const roleNormalizeMap: Record<string, Role> = {
  ADMIN: Role.ADMIN,
  admin: Role.ADMIN,
  DEVELOPER: Role.DEVELOPER,
  developer: Role.DEVELOPER,
  KEPALA_MADRASAH: Role.KEPALA_MADRASAH,
  kepala_madrasah: Role.KEPALA_MADRASAH,
  WAKA_KURIKULUM: Role.WAKA_KURIKULUM,
  WAKA_KESISWAAN: Role.WAKA_KESISWAAN,
  WAKA_SARPRAS: Role.WAKA_SARPRAS,
  GURU: Role.GURU,
  Guru: Role.GURU,
  WALI_KELAS: Role.WALI_KELAS,
  'Wali Kelas': Role.WALI_KELAS,
  BK: Role.BK,
  STAF_TU: Role.STAF_TU,
  STAF: Role.STAF_TU,
  Staf: Role.STAF_TU,
  OPERATOR: Role.OPERATOR,
  PETUGAS_PIKET: Role.PETUGAS_PIKET,
  SISWA: Role.SISWA,
  siswa: Role.SISWA,
  KETUA_KELAS: Role.KETUA_KELAS,
  'Ketua Kelas': Role.KETUA_KELAS,
  ORANG_TUA: Role.ORANG_TUA,
  orangtua: Role.ORANG_TUA,
  TAMU: Role.TAMU,
  Tamu: Role.TAMU,
};

export const normalizeRole = (input: unknown, fallback: Role = Role.TAMU): Role => {
  if (typeof input !== 'string') return fallback;
  return roleNormalizeMap[input] ?? fallback;
};
