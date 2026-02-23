export type AuditAction = 'LOGIN' | 'SCAN_QR' | 'LOGOUT' | 'ATTENDANCE_UPDATE' | 'AI_REQUEST';

export interface AuditPayload {
  userId: string;
  action: AuditAction;
  target?: string;
  success?: boolean;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  timestamp?: string;
}

export const logAudit = async (payload: AuditPayload): Promise<void> => {
  const body = {
    ...payload,
    requestId: payload.requestId ?? crypto.randomUUID(),
    success: payload.success ?? true,
    timestamp: payload.timestamp ?? new Date().toISOString(),
    userAgent: payload.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'),
  };

  if (typeof fetch !== 'undefined') {
    try {
      const idToken = typeof localStorage !== 'undefined' ? localStorage.getItem('imam_id_token') : null;
      await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify(body),
      });
      return;
    } catch {
      // fallback to local logging when API is unavailable
    }
  }

  console.info('[AUDIT]', body);
};
