import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Get auth data from localStorage
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole') as 'student' | 'teacher' | 'admin' | null;

    if (authStatus && userId && userEmail && userRole) {
      setAuthState({
        user: {
          id: userId, // Use actual user ID from localStorage
          email: userEmail,
          role: userRole,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  return authState;
}