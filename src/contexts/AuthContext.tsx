import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const register = async (email: string, password: string, displayName: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    
    const userProfile: User = {
      uid: user.uid,
      email: user.email!,
      displayName,
      photoURL: user.photoURL ?? '',
      isOnline: true,
      lastSeen: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), {
      ...userProfile,
      lastSeen: serverTimestamp()
    });
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (currentUser) {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        isOnline: false,
        lastSeen: serverTimestamp()
      });
    }
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const userProfile: User = {
          uid: user.uid,
          email: user.email!,
          displayName: user?.displayName ?? 'Anonymous',
          photoURL: user?.photoURL ?? undefined,
          isOnline: true,
          lastSeen: new Date()
        };
        
        setUserProfile(userProfile);
        
        // Update online status
        await setDoc(doc(db, 'users', user.uid), {
          ...userProfile,
          lastSeen: serverTimestamp()
        }, { merge: true });
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Update online status when tab becomes visible/hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (currentUser) {
        updateDoc(doc(db, 'users', currentUser.uid), {
          isOnline: !document.hidden,
          lastSeen: serverTimestamp()
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser]);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};