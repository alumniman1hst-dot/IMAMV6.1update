import { Role, type Role as RoleValue } from './roles';

export { Role };
export type RBACRole = RoleValue;

export enum Permission {
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  SCAN_QR = 'SCAN_QR',
  MANAGE_ATTENDANCE = 'MANAGE_ATTENDANCE',
  MANAGE_ACADEMIC = 'MANAGE_ACADEMIC',
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_REPORTS = 'VIEW_REPORTS',
  ACCESS_AI = 'ACCESS_AI',
  MANAGE_SYSTEM = 'MANAGE_SYSTEM',
}

export const RolePermissions: Readonly<Record<RoleValue, readonly Permission[]>> = {
  [Role.ADMIN]: Object.values(Permission),
  [Role.DEVELOPER]: Object.values(Permission),
  [Role.GURU]: [Permission.VIEW_DASHBOARD, Permission.MANAGE_ATTENDANCE, Permission.MANAGE_ACADEMIC, Permission.ACCESS_AI],
  [Role.SISWA]: [Permission.VIEW_DASHBOARD],
  [Role.KETUA_KELAS]: [Permission.VIEW_DASHBOARD],
  [Role.KEPALA_MADRASAH]: [Permission.VIEW_DASHBOARD, Permission.VIEW_REPORTS, Permission.MANAGE_SYSTEM],
  [Role.WALI_KELAS]: [Permission.VIEW_DASHBOARD, Permission.MANAGE_ATTENDANCE, Permission.MANAGE_ACADEMIC],
  [Role.STAF_TU]: [Permission.VIEW_DASHBOARD, Permission.MANAGE_USERS],
  [Role.WAKA_KURIKULUM]: [Permission.VIEW_DASHBOARD, Permission.MANAGE_ACADEMIC, Permission.VIEW_REPORTS],
  [Role.WAKA_KESISWAAN]: [Permission.VIEW_DASHBOARD, Permission.MANAGE_ATTENDANCE, Permission.VIEW_REPORTS],
  [Role.WAKA_SARPRAS]: [Permission.VIEW_DASHBOARD],
  [Role.BK]: [Permission.VIEW_DASHBOARD, Permission.VIEW_REPORTS],
  [Role.OPERATOR]: [Permission.VIEW_DASHBOARD, Permission.MANAGE_USERS],
  [Role.ORANG_TUA]: [Permission.VIEW_DASHBOARD],
  [Role.PETUGAS_PIKET]: [Permission.VIEW_DASHBOARD, Permission.SCAN_QR, Permission.MANAGE_ATTENDANCE],
  [Role.TAMU]: [],
} as const;

export const hasPermission = (role: RoleValue, permission: Permission): boolean => {
  return RolePermissions[role]?.includes(permission) ?? false;
};

export const getPermissions = (role: RoleValue): readonly Permission[] => RolePermissions[role] ?? [];
