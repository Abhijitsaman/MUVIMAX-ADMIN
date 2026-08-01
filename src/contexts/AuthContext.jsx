import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('🔐 [AuthContext] AuthProvider initializing');

  useEffect(() => {
    console.log('🔐 [AuthContext] Setting up onAuthStateChanged listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔐 [AuthContext] Auth state changed:', user ? `User ${user.uid}` : 'No user');
      setCurrentUser(user);
      
      if (user) {
        try {
          console.log('🔐 [AuthContext] User authenticated, updating/creating user document');
          // Update last login
          await updateDoc(doc(db, 'users', user.uid), {
            lastLogin: serverTimestamp(),
            lastActive: serverTimestamp()
          }).catch(async (err) => {
            console.warn('🔐 [AuthContext] User document update failed, attempting creation:', err);
            // If user document doesn't exist, create it
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              lastActive: serverTimestamp()
            });
            console.log('🔐 [AuthContext] User document created successfully');
          });
        } catch (error) {
          console.error('🔐 [AuthContext] Error handling user document:', error);
        }
      }
      
      setLoading(false);
      console.log('🔐 [AuthContext] Loading set to false');
    });

    return () => {
      console.log('🔐 [AuthContext] Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  // Google Login
  const loginWithGoogle = async () => {
    console.log('🔐 [AuthContext] loginWithGoogle called');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('🔐 [AuthContext] Starting Google sign-in popup');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('🔐 [AuthContext] Google sign-in successful:', user.uid);
      
      // Log activity
      await setDoc(doc(db, 'activityLogs', `${Date.now()}_${user.uid}`), {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName,
        action: 'login_google',
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent
      }).catch(err => console.warn('🔐 [AuthContext] Activity log failed:', err));
      
      return { success: true, user };
    } catch (error) {
      console.error('🔐 [AuthContext] Google login error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  const logout = async () => {
    console.log('🔐 [AuthContext] logout called');
    try {
      if (currentUser) {
        await setDoc(doc(db, 'activityLogs', `${Date.now()}_${currentUser.uid}`), {
          userId: currentUser.uid,
          email: currentUser.email,
          action: 'logout',
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent
        }).catch(err => console.warn('🔐 [AuthContext] Activity log failed:', err));
      }
      
      await signOut(auth);
      console.log('🔐 [AuthContext] Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('🔐 [AuthContext] Logout error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  const value = {
    currentUser,
    loading,
    loginWithGoogle,
    logout
  };

  console.log('🔐 [AuthContext] AuthProvider rendering with user:', currentUser?.uid || 'none', 'loading:', loading);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
