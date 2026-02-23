
import { auth } from './firebase';
import { UserRole } from '../types';

interface SSOResponse {
    uid: string;
    token: string;
    role: string;
    profile: any;
    error?: string;
}

export const loginWithSSO = async (idToken: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    // 1. Client-Side Simulation Mode
    // This runs immediately if the token matches, bypassing any server calls
    if (idToken === "SSO-Imam-token") {
        console.log("Processing SSO Login (Simulation Mode)...");
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { 
            success: true, 
            role: UserRole.GURU 
        };
    }

    // 2. Real Mode Logic
    try {
        // In a real implementation, this would call your backend API
        // const response = await fetch('/api/auth/login-sso', { ... });
        
        // For this client-side preview, we'll throw an error if it's not the mock token
        console.warn("Real SSO login requires a running backend API.");
        throw new Error("SSO backend connection failed. Please use Simulation Mode.");

    } catch (error: any) {
        console.error("SSO Client Error:", error);
        return { success: false, error: error.message };
    }
};
