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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Update last login
          await updateDoc(doc(db, 'users', user.uid), {
            lastLogin: serverTimestamp(),
            lastActive: serverTimestamp()
          });
        } catch (error) {
          // If user document doesn't exist, create it
          try {
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              lastActive: serverTimestamp()
            });
          } catch (err) {
            console.error('Error creating user document:', err);
          }
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Google Login
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Log activity
      await setDoc(doc(db, 'activityLogs', `${Date.now()}_${user.uid}`), {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName,
        action: 'login_google',
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent
      });
      
      return { success: true, user };
    } catch (error) {
      console.error('Google login error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  const logout = async () => {
    try {
      if (currentUser) {
        await setDoc(doc(db, 'activityLogs', `${Date.now()}_${currentUser.uid}`), {
          userId: currentUser.uid,
          email: currentUser.email,
          action: 'logout',
          timestamp: serverTimestamp(),
          userAgent: navigator.userAgent
        });
      }
      
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
