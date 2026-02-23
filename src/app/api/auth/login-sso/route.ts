
import { NextResponse } from "next/server";
import { verifyIdToken } from "../../../../lib/sso";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { id_token } = await request.json();

    if (!id_token) {
      return NextResponse.json({ error: "ID Token missing" }, { status: 400 });
    }

    // --- MOCK / SIMULATION BYPASS ---
    // This allows testing the endpoint without a real OIDC provider setup
    if (id_token === "SSO-Imam-token") {
        return NextResponse.json({
            uid: "mock-sso-user-123",
            token: "mock-firebase-custom-token-xyz",
            role: "GTK",
            profile: {
                displayName: "Imam Hakim (SSO)",
                email: "imam.hakim@kemenag.go.id",
                nip: "1983427492",
                role: "Guru"
            },
            message: "Login SSO Berhasil (Mode Simulasi)"
        });
    }
    // --------------------------------

    // 1. Verify Token with JWKS (Real Logic)
    let claims;
    try {
        claims = await verifyIdToken(id_token);
    } catch (e) {
        return NextResponse.json({ error: "Invalid SSO Token Signature" }, { status: 401 });
    }

    // Extract user info from OIDC claims
    // Adjust these keys based on the actual SSO response structure
    const email = (claims.email as string);
    const name = (claims.name as string) || (claims.sub as string);
    const nip = (claims.nip as string) || (claims.nomor_induk as string) || "";
    // Default role logic (can be enhanced based on claims.role)
    const role = (claims.role as string) === "admin" ? "ADMIN" : "GTK"; 

    if (!email) {
        return NextResponse.json({ error: "Email claim missing in token" }, { status: 400 });
    }

    // 2. Check if user exists in Firebase Auth
    let uid = "";
    try {
        const userRecord = await adminAuth.getUserByEmail(email);
        uid = userRecord.uid;
    } catch (error) {
        // User not found, create new Firebase User (Auto-provisioning)
        const newUser = await adminAuth.createUser({
            email: email,
            displayName: name,
            emailVerified: true, // Trusted from SSO
        });
        uid = newUser.uid;
    }

    // 3. Sync/Update User Data in Firestore
    // We check the 'users' collection used by the rest of the app
    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    const userData = {
        uid: uid,
        displayName: name,
        email: email,
        // Only update role if it doesn't exist, to prevent overwriting manual role changes
        role: userDoc.exists ? (userDoc.data()?.role || role) : role,
        nip: nip,
        lastLoginSso: new Date().toISOString(),
        authProvider: 'sso-imam',
        // Default fields for app compatibility
        class: userDoc.exists ? (userDoc.data()?.class || "-") : "-", 
        phone: userDoc.exists ? (userDoc.data()?.phone || "") : "",
        address: userDoc.exists ? (userDoc.data()?.address || "") : "",
    };

    // Use set with merge: true to update existing or create new
    await userRef.set(userData, { merge: true });

    // 4. Generate Firebase Custom Token
    // The frontend will use this token to signInWithCustomToken()
    const firebaseCustomToken = await adminAuth.createCustomToken(uid, {
        role: userData.role
    });

    // 5. Return success response
    return NextResponse.json({
      uid: uid,
      token: firebaseCustomToken,
      role: userData.role,
      profile: userData,
    });

  } catch (error: any) {
    console.error("SSO Login Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", detail: error.message },
      { status: 500 }
    );
  }
}
