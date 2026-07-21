import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState(null);
  const [adminPermissions, setAdminPermissions] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            setIsAdmin(true);
            setAdminRole(adminData.role || 'admin');
            setAdminPermissions(adminData.permissions || []);
            
            // Update last login
            await updateDoc(doc(db, 'admins', user.uid), {
              lastLogin: serverTimestamp(),
              lastActive: serverTimestamp()
            });
          } else {
            setIsAdmin(false);
            setAdminRole(null);
            setAdminPermissions([]);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          setAdminRole(null);
          setAdminPermissions([]);
        }
      } else {
        setIsAdmin(false);
        setAdminRole(null);
        setAdminPermissions([]);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if user is admin
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      if (!adminDoc.exists()) {
        await signOut(auth);
        throw new Error('Unauthorized: Not an admin user');
      }
      
      // Log activity
      await setDoc(doc(db, 'activityLogs', `${Date.now()}_${user.uid}`), {
        userId: user.uid,
        email: user.email,
        action: 'login',
        timestamp: serverTimestamp(),
        ip: 'pending',
        userAgent: navigator.userAgent
      });
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
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

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  const checkPermission = (module, action) => {
    if (adminRole === 'super_admin') return true;
    if (!adminPermissions || adminPermissions.length === 0) return false;
    
    return adminPermissions.some(
      perm => perm.module === module && perm.actions.includes(action)
    );
  };

  const value = {
    currentUser,
    loading,
    isAdmin,
    adminRole,
    adminPermissions,
    login,
    logout,
    resetPassword,
    checkPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
