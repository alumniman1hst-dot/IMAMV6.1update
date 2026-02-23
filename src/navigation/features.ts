import { Permission } from '../auth/rbac';

export type FeatureCategory = 'Akademik' | 'Kesiswaan' | 'Sistem' | 'Umum';

export interface FeatureConfig {
  id: string;
  label: string;
  category: FeatureCategory;
  priority: number;
  permission: Permission;
}

const registry: Record<string, FeatureConfig> = {
  dashboard: { id: 'dashboard', label: 'Dashboard', category: 'Umum', priority: 100, permission: Permission.VIEW_DASHBOARD },
  presensi: { id: 'presensi', label: 'Presensi', category: 'Kesiswaan', priority: 95, permission: Permission.MANAGE_ATTENDANCE },
  akademik: { id: 'akademik', label: 'Akademik', category: 'Akademik', priority: 90, permission: Permission.MANAGE_ACADEMIC },
  laporan: { id: 'laporan', label: 'Laporan', category: 'Sistem', priority: 85, permission: Permission.VIEW_REPORTS },
  'scan-qr': { id: 'scan-qr', label: 'Scan QR', category: 'Kesiswaan', priority: 80, permission: Permission.SCAN_QR },
  admin: { id: 'admin', label: 'Admin', category: 'Sistem', priority: 70, permission: Permission.MANAGE_USERS },
};

if (import.meta.env.DEV) {
  Object.values(registry).forEach((feature) => {
    if (!Object.values(Permission).includes(feature.permission)) {
      throw new Error(`Invalid permission on feature ${feature.id}`);
    }
  });
}

export const FEATURES: readonly FeatureConfig[] = Object.freeze(Object.values(registry));
