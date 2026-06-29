/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        console.log("[AuthContext] Active User Email:", firebaseUser.email, "UID:", firebaseUser.uid);
        
        let currentRole = 'student';
        
        // Fetch role from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            currentRole = userDoc.data().role;
          }
        } catch (error) {
          console.error("[AuthContext] Error fetching user role from Firestore:", error);
        }

        // Fail-safe: Force admin role if email matches staff/admin pattern
        if (
          firebaseUser.email && 
          (firebaseUser.email.toLowerCase().includes("staf") || firebaseUser.email.toLowerCase().includes("admin"))
        ) {
          console.log("[AuthContext] Fail-safe active: Forcing 'admin' role based on email pattern");
          currentRole = 'admin';
          
          // Background sync to Firestore (fails silently if rules are locked)
          setDoc(doc(db, 'users', firebaseUser.uid), {
            role: 'admin'
          }, { merge: true }).catch((err) => {
            console.warn("[AuthContext] Background Firestore update failed (expected if rules are locked):", err.message);
          });
        }

        console.log("[AuthContext] Resolved User Role:", currentRole);
        setUserRole(currentRole);
      } else {
        console.log("[AuthContext] No user logged in.");
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helpful for Supabase-to-Firebase transition mapping
  const value = {
    user,
    session: user ? { user: { id: user.uid, email: user.email, user_metadata: { role: userRole } } } : null,
    userRole,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
