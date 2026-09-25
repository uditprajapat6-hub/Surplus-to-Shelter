import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const user_id = localStorage.getItem('user_id');

      if (token && role && user_id) {
        setUser({ token, role, id: user_id });
      }
    } catch (error) {
      console.error("Auth context initialization error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (token, role, user_id) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('user_id', user_id);
    setUser({ token, role, id: user_id });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_id');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
