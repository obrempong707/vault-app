import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'vaultlogix_auth';
const USERS_STORAGE_KEY = 'vaultlogix_users';

const defaultUsers = [
  {
    id: 'USR-001',
    name: 'Admin Sterling',
    email: 'admin@vaultlogix.com',
    role: 'admin',
    isAdmin: true,
    customerId: null,
    status: 'active',
  },
  {
    id: 'USR-002',
    name: 'Client Lawson',
    email: 'client@vaultlogix.com',
    role: 'client',
    isAdmin: false,
    customerId: 'CUST-001',
    status: 'active',
  },
];

const getDemoCredential = (key, fallback) => {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
};

const defaultAuthState = {
  isAuthenticated: false,
  token: null,
  user: null,
};

const normalizeUserRecord = (user) => {
  if (!user) {
    return user;
  }

  if (user.email === 'client@vaultlogix.com' && user.name === 'Client User') {
    return { ...user, name: 'Client Lawson' };
  }

  if (user.email === 'admin@vaultlogix.com' && user.name === 'Admin User') {
    return { ...user, name: 'Admin Sterling' };
  }

  return user;
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(defaultAuthState);
  const [users, setUsers] = useState(defaultUsers);

  useEffect(() => {
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);

    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        const normalizedAuth = {
          ...parsedAuth,
          user: normalizeUserRecord(parsedAuth.user),
        };

        setAuthState(normalizedAuth);
        setAuthToken(normalizedAuth.token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedAuth));
      } catch {
        setAuthToken(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      setAuthToken(null);
    }

    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers);
        const normalizedUsers = parsedUsers.map(normalizeUserRecord);

        setUsers(normalizedUsers);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(normalizedUsers));
      } catch {
        localStorage.removeItem(USERS_STORAGE_KEY);
      }
    }
  }, []);

  const updateAuthState = (nextState) => {
    setAuthState(nextState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  };

  const updateUsers = (nextUsers) => {
    setUsers(nextUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
  };

  const login = async (email, password) => {
    try {
      const response = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
      });

      const nextState = {
        isAuthenticated: true,
        token: response.data.token,
        user: normalizeUserRecord(response.data.user),
      };

      setAuthToken(response.data.token);
      updateAuthState(nextState);

      return { success: true, user: nextState.user };
    } catch (error) {
      setAuthToken(null);

      return {
        success: false,
        message: error.message || 'Unable to log in.',
      };
    }
  };

  const loginAsUser = () => {
    return login(
      getDemoCredential('VITE_VAULTLOGIX_CLIENT_EMAIL', 'client@vaultlogix.com'),
      getDemoCredential('VITE_VAULTLOGIX_CLIENT_PASSWORD', ''),
    );
  };

  const loginAsAdmin = () => {
    return login(
      getDemoCredential('VITE_VAULTLOGIX_ADMIN_EMAIL', 'admin@vaultlogix.com'),
      getDemoCredential('VITE_VAULTLOGIX_ADMIN_PASSWORD', ''),
    );
  };

  const addUser = (userData) => {
    const normalizedRole = userData.role === 'admin' ? 'admin' : 'client';

    const newUser = {
      id: `USR-${String(Date.now()).slice(-6)}`,
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      role: normalizedRole,
      isAdmin: normalizedRole === 'admin',
      customerId: normalizedRole === 'admin' ? null : `CUST-${String(Date.now()).slice(-6)}`,
      status: 'active',
    };

    const nextUsers = [...users, newUser];
    updateUsers(nextUsers);

    return newUser;
  };

  const updateUserRole = (userId, role) => {
    const normalizedRole = role === 'admin' ? 'admin' : 'client';

    const nextUsers = users.map((existingUser) => {
      if (existingUser.id !== userId) {
        return existingUser;
      }

      return {
        ...existingUser,
        role: normalizedRole,
        isAdmin: normalizedRole === 'admin',
        customerId: normalizedRole === 'admin' ? null : (existingUser.customerId || `CUST-${userId.slice(-3)}`),
      };
    });

    updateUsers(nextUsers);

    if (authState.user?.id === userId) {
      const currentUser = nextUsers.find((existingUser) => existingUser.id === userId);

      if (currentUser) {
        updateAuthState({
          isAuthenticated: true,
          token: authState.token,
          user: currentUser,
        });
      }
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
    }

    setAuthToken(null);
    setAuthState(defaultAuthState);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      ...authState,
      users,
      login,
      loginAsUser,
      loginAsAdmin,
      addUser,
      updateUserRole,
      logout,
    }),
    [authState, users],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
