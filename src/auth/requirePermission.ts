import { hasPermission, Permission, type RBACRole } from './rbac.js';

export interface AuthenticatedRequest {
  user?: {
    id: string;
    role: RBACRole;
    permissions: readonly Permission[];
  };
}

export interface JsonResponse {
  status: (code: number) => JsonResponse;
  json: (payload: unknown) => unknown;
}

export type NextFunction = () => void;

export const requirePermission = (permission: Permission) => {
  return (req: AuthenticatedRequest, res: JsonResponse, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    if (!req.user.permissions.includes(permission) || !hasPermission(req.user.role, permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
};
