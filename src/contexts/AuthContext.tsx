import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

// Logging utility for consistent formatting
const log = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] [AuthContext.${component}] ${message}:`, data);
  } else {
    console.log(`[${timestamp}] [AuthContext.${component}] ${message}`);
  }
};

export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string;
  demographics: {
    race?: string;
    gender?: string;
    careerLevel?: string;
    company?: string;
    affinityTags?: string[];
  };
  hasCompletedOnboarding: boolean;
  isWillingToMentor: boolean;
  badges: string[];
  createdAt: Date;
  mentorProfile?: {
    expertise: string[];
    experience: string;
    style: string;
    availability: string;
    bio: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  completeOnboarding: (data: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const generateAnonymousAvatar = () => {
    const startTime = performance.now();
    log('generateAnonymousAvatar', 'Function called');
    
    const avatars = [
      '🟦', '🟪', '🟫', '🔷', '🔶', '⭐', '🌟', '💫', 
      '🎭', '🎨', '🔮', '🌀', '🔥', '💎', '🌈', '⚡'
    ];
    const selectedAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    
    const endTime = performance.now();
    log('generateAnonymousAvatar', `Generated avatar in ${(endTime - startTime).toFixed(2)}ms`, selectedAvatar);
    
    return selectedAvatar;
  };

  const generateUsername = () => {
    const startTime = performance.now();
    log('generateUsername', 'Function called');
    
    const adjectives = ['Anonymous', 'Quiet', 'Thoughtful', 'Brave', 'Rising', 'Future'];
    const nouns = ['Professional', 'Leader', 'Voice', 'Changemaker', 'Advocate', 'Innovator'];
    const number = Math.floor(Math.random() * 999) + 1;
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const username = `${adj}${noun}${number}`;
    
    const endTime = performance.now();
    log('generateUsername', `Generated username in ${(endTime - startTime).toFixed(2)}ms`, username);
    
    return username;
  };

  const login = async (email: string, password: string) => {
    const startTime = performance.now();
    log('login', 'Function called', { email, passwordLength: password.length });

    try {
      // Simple passthrough - no database operations
      // Create mock user with completed onboarding
      const userId = Date.now().toString();
      const username = generateUsername();
      const avatar = generateAnonymousAvatar();

      const mockUser: User = {
        id: userId,
        email,
        username: username,
        avatar: avatar,
        demographics: {
          race: 'Black',
          gender: 'Woman',
          careerLevel: 'Mid-level',
          company: 'TechCorp',
          affinityTags: ['Black Women in Tech', 'Women Leaders']
        },
        hasCompletedOnboarding: true,
        isWillingToMentor: false,
        badges: ['New Member'],
        createdAt: new Date()
      };

      log('login', 'Mock user created', { userId: mockUser.id, username: mockUser.username });
      setUser(mockUser);
      log('login', 'User state updated', mockUser);

      const endTime = performance.now();
      log('login', `Login completed successfully in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      const endTime = performance.now();
      log('login', `Login failed after ${(endTime - startTime).toFixed(2)}ms`, error);
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    const startTime = performance.now();
    log('signup', 'Function called', { email, passwordLength: password.length });

    try {
      // Simple passthrough - just validate email and password format
      // No Supabase auth or database operations
      // The actual user will be created after OTP verification

      log('signup', 'Passthrough signup - no database operations');

      const endTime = performance.now();
      log('signup', `Signup passthrough completed in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      const endTime = performance.now();
      log('signup', `Signup failed after ${(endTime - startTime).toFixed(2)}ms`, error);
      throw error;
    }
  };

  const logout = () => {
    log('logout', 'Function called', { currentUser: user?.id });
    const previousUser = user;
    setUser(null);
    log('logout', 'User state cleared', { previousUser: previousUser?.id, newUser: null });
  };

  const updateUser = (updates: Partial<User>) => {
    log('updateUser', 'Function called', updates);
    const previousUser = user;
    setUser(prev => prev ? { ...prev, ...updates } : null);
    log('updateUser', 'User state updated', { 
      previousUser: previousUser?.id, 
      updates, 
      newUser: user ? { ...user, ...updates } : null 
    });
  };

  const completeOnboarding = async (data: any) => {
    log('completeOnboarding', 'Function called', data);

    // Create a mock user with onboarding data
    const mockUser: User = {
      id: Date.now().toString(),
      email: 'user@example.com',
      username: generateUsername(),
      avatar: generateAnonymousAvatar(),
      demographics: {
        race: data.race,
        gender: data.gender,
        careerLevel: data.careerLevel,
        company: data.company,
        affinityTags: data.affinityTags || []
      },
      hasCompletedOnboarding: true,
      isWillingToMentor: false,
      badges: ['New Member'],
      createdAt: new Date()
    };

    setUser(mockUser);
    log('completeOnboarding', 'Onboarding completed with mock user', mockUser);
  };

  // No auth state listeners needed - using mock users only

  // Log provider initialization
  useEffect(() => {
    log('AuthProvider', 'Provider initialized', {
      isAuthenticated: !!user,
      hasCompletedOnboarding: user?.hasCompletedOnboarding || false 
    });
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      hasCompletedOnboarding: user?.hasCompletedOnboarding || false,
      login,
      signup,
      logout,
      updateUser,
      completeOnboarding
    }}>
      {children}
    </AuthContext.Provider>
  );
}