
import { auth } from './firebase'; // Client SDK
import { UserRole } from '../types';
import { normalizeRole } from '../auth/roles';

interface SSOResponse {
    uid: string;
    token: string;
    role: string;
    profile: any;
    error?: string;
}

export const loginWithSSO = async (idToken: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    try {
        // 1. Call the Next.js API Route
        // Note: In a client-side only preview environment, this fetch might fail (404) 
        // if the Next.js API routes are not being served.
        const response = await fetch('/api/auth/login-sso', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id_token: idToken }),
        });

        const data: SSOResponse = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to login with SSO');
        }

        // 2. Sign in to Firebase Client SDK using the Custom Token returned by API
        // "mock-firebase-custom-token-xyz" is the signal from the API mock mode
        if (auth && data.token && data.token !== "mock-firebase-custom-token-xyz") {
            await auth.signInWithCustomToken(data.token);
        }

        const mappedRole = normalizeRole(data.role, UserRole.GURU);

        return { success: true, role: mappedRole };

    } catch (error: any) {
        console.error("SSO Client Error:", error);
        
        // Fallback for purely client-side demos where /api/ route might not exist
        if (idToken === "SSO-Imam-token") {
             console.warn("Falling back to client-side mock due to API error.");
             return { success: true, role: UserRole.GURU };
        }

        return { success: false, error: error.message };
    }
};
