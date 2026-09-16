import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, updateDoc } from 'firebase/firestore';
import { 
  User, Users, Settings, FileText, Plus, X, LogOut, Droplet, Package, 
  Flame, Search, ChevronRight, AlertCircle, CheckCircle2, Key, ShieldCheck, 
  UserPlus, RefreshCw, Lock, ArrowLeft, History, Truck, Calendar, BarChart2,
  Eye, EyeOff, Share2, Copy, Check, Filter, TrendingUp
} from 'lucide-react';

// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBqtmy9iYvfDj9tcLgVbIxAbGZNRewOlX4",
  authDomain: "kalimas-shipyard.firebaseapp.com",
  projectId: "kalimas-shipyard",
  storageBucket: "kalimas-shipyard.firebasestorage.app",
  messagingSenderId: "330404051844",
  appId: "1:330404051844:web:77e11003081143ff893bd1",
  measurementId: "G-TSSC1J1S0D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-tandon-app';

// Path helpers adhering strictly to environment rules
const getPublicPath = (collectionName) => collection(db, 'artifacts', appId, 'public', 'data', collectionName);
const getDocPath = (collectionName, docId) => doc(db, 'artifacts', appId, 'public', 'data', collectionName, docId);

const getMakassarDateString = (date = new Date()) => {
  try {
    let d;
    if (!date) {
      d = new Date();
    } else if (typeof date.toDate === 'function') {
      d = date.toDate();
    } else if (typeof date === 'object' && typeof date.seconds === 'number') {
      d = new Date(date.seconds * 1000);
    } else if (typeof date === 'number' || typeof date === 'string') {
      d = new Date(date);
    } else if (date instanceof Date) {
      d = date;
    } else {
      d = new Date();
    }

    if (isNaN(d.getTime())) d = new Date();
    
    // Strict timezone formatting using formatToParts for Asia/Makassar (WITA, UTC+8)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(d);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    if (year && month && day) return `${year}-${month}-${day}`;
    
    // Fallback using UTC+8 offset calculation
    const makassarTime = new Date(d.getTime() + (8 * 3600 * 1000));
    return makassarTime.toISOString().split('T')[0];
  } catch (err) {
    console.error("Date formatting error:", err);
    const makassarTime = new Date(Date.now() + (8 * 3600 * 1000));
    return makassarTime.toISOString().split('T')[0];
  }
};

const getMakassarTimeString = (timestamp = Date.now()) => {
  try {
    let d;
    if (!timestamp) {
      d = new Date();
    } else if (typeof timestamp.toDate === 'function') {
      d = timestamp.toDate();
    } else if (typeof timestamp === 'object' && typeof timestamp.seconds === 'number') {
      d = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
      d = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      d = timestamp;
    } else {
      d = new Date();
    }

    if (isNaN(d.getTime())) return '--:--';
    const formatter = new Intl.DateTimeFormat('id-ID', { 
      timeZone: 'Asia/Makassar',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    return formatter.format(d);
  } catch (err) {
    return '--:--';
  }
};

// Returns YYYY-MM for monthly grouping
const getMakassarMonthString = (dateStr = getMakassarDateString()) => {
  if (!dateStr || typeof dateStr !== 'string') return getMakassarDateString().substring(0, 7);
  return dateStr.substring(0, 7);
};

// Returns Monday to Sunday start/end dates for weekly grouping
const getWeekRange = (dateStr = getMakassarDateString()) => {
  const parts = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const day = d.getUTCDay();
  const diffToMon = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diffToMon));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    startStr: monday.toISOString().split('T')[0],
    endStr: sunday.toISOString().split('T')[0]
  };
};

const getLocalData = (key, fallback) => {
  try {
    const data = localStorage.getItem(`galangan_${key}`);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
};

const setLocalData = (key, value) => {
  try {
    localStorage.setItem(`galangan_${key}`, JSON.stringify(value));
  } catch (e) {}
};

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [sessionUser, setSessionUser] = useState(() => {
    try {
      const saved = localStorage.getItem('galangan_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [allUsers, setAllUsers] = useState(() => {
    try {
      const cached = localStorage.getItem('galangan_cached_users');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    let unsubUsers = () => {};
    let isMounted = true;

    const loadCachedUsers = () => {
      try {
        const cached = localStorage.getItem('galangan_cached_users');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAllUsers(parsed);
          }
        }
      } catch (e) {}
    };

    const authenticateAndConnect = async () => {
      setAuthError(null);
      setLoading(true);

      if (!firebaseConfig || !firebaseConfig.apiKey) {
        if (isMounted) {
          setIsOfflineMode(true);
          loadCachedUsers();
          setLoading(false);
        }
        return;
      }

      try {
        if (!auth.currentUser) {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            try {
              await signInWithCustomToken(auth, __initial_auth_token);
            } catch (tokenErr) {
              await signInAnonymously(auth);
            }
          } else {
            await signInAnonymously(auth);
          }
        }
      } catch (err) {
        if (isMounted) {
          loadCachedUsers();
          setIsOfflineMode(true);
          setAuthError(null);
          setLoading(false);
        }
      }
    };

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (unsubUsers) unsubUsers();
        unsubUsers = onSnapshot(getPublicPath('users'), (snap) => {
          if (!isMounted) return;
          const usersList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllUsers(usersList);
          try {
            localStorage.setItem('galangan_cached_users', JSON.stringify(usersList));
          } catch (e) {}
          setLoading(false);
          setAuthError(null);
        }, (err) => {
          if (isMounted) {
            loadCachedUsers();
            setIsOfflineMode(true);
            setLoading(false);
          }
        });
      }
    });

    authenticateAndConnect();

    return () => {
      isMounted = false;
      unsubAuth();
      if (unsubUsers) unsubUsers();
    };
  }, [retryCount]);

  const retryAuth = () => {
    setIsOfflineMode(false);
    setRetryCount(prev => prev + 1);
  };

  const enableOfflineMode = () => {
    setIsOfflineMode(true);
    setAuthError(null);
    try {
      const cached = localStorage.getItem('galangan_cached_users');
      if (cached) {
        setAllUsers(JSON.parse(cached));
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (sessionUser) {
      try {
        localStorage.setItem('galangan_session_user', JSON.stringify(sessionUser));
      } catch (e) {}

      if (allUsers.length > 0) {
        const updatedUser = allUsers.find(u => u.id === sessionUser.id);
        if (updatedUser) {
          if (!updatedUser.isActive) {
            setSessionUser(null);
            localStorage.removeItem('galangan_session_user');
          } else if (JSON.stringify(updatedUser) !== JSON.stringify(sessionUser)) {
            setSessionUser(updatedUser);
          }
        }
      }
    } else {
      localStorage.removeItem('galangan_session_user');
    }
  }, [allUsers, sessionUser]);

  const systemInitialized = useMemo(() => {
    return allUsers.length > 0;
  }, [allUsers]);

  const login = (username, password) => {
    const cleanUser = username?.trim().toLowerCase();
    const foundUser = allUsers.find(u => u.username?.toLowerCase() === cleanUser);

    if (!foundUser) {
      return { success: false, message: 'Username tidak ditemukan.' };
    }

    if (foundUser.password !== password) {
      return { success: false, message: 'Password salah.' };
    }

    if (!foundUser.isActive) {
      return { success: false, message: 'Akun Anda telah dinonaktifkan. Hubungi Admin.' };
    }

    setSessionUser(foundUser);
    try {
      localStorage.setItem('galangan_session_user', JSON.stringify(foundUser));
    } catch (e) {}

    return { success: true };
  };

  const logout = () => {
    setSessionUser(null);
    try {
      localStorage.removeItem('galangan_session_user');
    } catch (e) {}
  };

  const contextValue = {
    sessionUser,
    setSessionUser,
    allUsers,
    setAllUsers,
    systemInitialized,
    loading,
    authError,
    isOfflineMode,
    enableOfflineMode,
    retryAuth,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

const GalanganKalimasLogo = ({ size = 'sm', variant = 'color', showText = true, layout = 'auto', className = '' }) => {
  const isLight = variant === 'light';
  const isDark = variant === 'dark';

  const orangeColor = isLight ? '#FF6B4A' : '#D9421A';
  const hullColor = isLight ? '#FFFFFF' : isDark ? '#111827' : '#23262A';
  const textColor = isLight ? '#FFFFFF' : isDark ? '#111827' : '#23262A';

  const isVertical = layout === 'vertical' || size === 'md' || size === 'lg';

  const iconWidths = {
    sm: isVertical ? 'w-24' : 'w-10',
    md: 'w-32',
    lg: 'w-44'
  };

  return (
    <div className={`flex ${isVertical ? 'flex-col items-center text-center' : 'items-center gap-2.5'} ${className}`}>
      <div className={`relative shrink-0 ${iconWidths[size] || iconWidths.sm}`}>
        <svg 
          viewBox="0 0 320 160" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-auto drop-shadow-sm transition-transform duration-200"
        >
          <path d="M 62 122 C 90 92 122 58 154 42 C 142 50 115 76 78 114 Z" fill={orangeColor} />
          <path d="M 48 130 C 88 92 145 52 218 40 C 205 48 150 74 62 122 Z" fill={orangeColor} />
          <path d="M 32 138 C 95 90 178 52 292 38 C 288 54 278 72 283 90 C 287 104 282 122 268 132 C 262 136 250 138 230 138 L 48 138 C 38 138 32 138 32 138 Z" fill={hullColor} />
        </svg>
      </div>

      {showText && (
        <div className={`flex flex-col ${isVertical ? 'items-center mt-1.5' : 'items-start text-left'}`}>
          <span 
            className={`font-black tracking-wider leading-none uppercase ${
              size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-xs'
            }`}
            style={{ color: textColor, fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            KALIMAS
          </span>
          <span 
            className={`font-bold tracking-[0.22em] leading-tight uppercase ${
              size === 'lg' ? 'text-xs mt-1' : size === 'md' ? 'text-[10px] mt-0.5' : 'text-[8.5px]'
            }`}
            style={{ color: orangeColor, fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            SHIPYARD
          </span>
        </div>
      )}
    </div>
  );
};

const Card = ({ children, className = '', style }) => {
  const hasBg = /\bbg-/.test(className);
  const hasBorder = /\bborder-/.test(className);
  return (
    <div 
      style={style}
      className={`${hasBg ? '' : 'bg-white'} rounded-xl shadow-sm ${hasBorder ? '' : 'border border-slate-200'} overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};

const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '', disabled = false }) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200',
    outline: 'border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
  };
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm active:scale-[0.98] ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed scale-100' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
            <X size={18}/>
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
};

const SystemInitScreen = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { setSessionUser, setAllUsers } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !username.trim() || !password) {
      setError('Semua kolom wajib diisi.');
      return;
    }

    if (password.length < 4) {
      setError('Password minimal 4 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setSubmitting(true);
    try {
      const adminDocId = 'superadmin_' + Date.now();
      const adminData = {
        id: adminDocId,
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password,
        role: 'SUPER_ADMIN',
        divisions: ['TANDON', 'GALLON', 'INDUSTRIAL_GAS', 'MOBIL_TANGKI'],
        isActive: true,
        createdAt: Date.now(),
        isInitialAdmin: true
      };

      try {
        await setDoc(getDocPath('users', adminDocId), adminData);
        await setDoc(getDocPath('settings', 'tandon_config'), {
          price: 20000,
          updatedAt: Date.now(),
          updatedBy: name.trim()
        }, { merge: true });
      } catch (fsErr) {
        console.warn("Firestore save failed, persisting locally:", fsErr);
      }

      const updatedUsers = [adminData];
      setAllUsers(updatedUsers);
      try {
        localStorage.setItem('galangan_cached_users', JSON.stringify(updatedUsers));
      } catch (e) {}

      setSessionUser(adminData);
    } catch (err) {
      console.error("System init error:", err);
      setError('Gagal menginisialisasi sistem. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-white text-center flex flex-col items-center">
          <div className="mb-3 bg-blue-700/60 p-2.5 rounded-2xl border border-blue-400/30 shadow-md">
            <GalanganKalimasLogo size="md" variant="light" />
          </div>
          <h1 className="text-xl font-bold">Inisialisasi Sistem</h1>
          <p className="text-blue-100 text-xs mt-1">Buat akun Super Administrator Pertama untuk memulai platform</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-100">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Nama Lengkap Super Admin</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Manager Utama" 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Username Super Admin</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              placeholder="superadmin" 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all lowercase"
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Konfirmasi Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              required 
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full mt-2 py-3.5">
            {submitting ? 'Menyiapkan Sistem...' : 'Buat Akun Super Administrator'}
          </Button>
        </form>
      </div>
    </div>
  );
};

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    const result = login(username, password);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 p-6 text-white text-center relative flex flex-col items-center">
          <div className="mb-3 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 shadow-lg">
            <GalanganKalimasLogo size="md" variant="light" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">PLATFORM OPERASIONAL</h1>
          <p className="text-xs text-slate-400 mt-1">Masuk dengan kredensial dari Admin</p>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-100">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              placeholder="Masukkan username" 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="Masukkan password" 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              required 
            />
          </div>

          <Button type="submit" className="w-full py-3.5 shadow-md shadow-blue-600/20 mt-2">
            Masuk Ke Sistem
          </Button>

          <p className="text-center text-xs text-slate-400 pt-2">
            Belum punya akun? Hubungi Administrator untuk mendaftar.
          </p>
        </form>
      </div>
    </div>
  );
};

const AdminPanel = ({ onNavigateHome }) => {
  const { allUsers, sessionUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('users');
  const [settings, setSettings] = useState({ price: 20000 });
  const [transactions, setTransactions] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  // User creation state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('OPERATOR');
  const [newUserDivisions, setNewUserDivisions] = useState(['TANDON']);
  const [userError, setUserError] = useState('');

  // Password reset modal state (Super Admin only)
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const [userSearch, setUserSearch] = useState('');

  // Price history state
  const [priceHistory, setPriceHistory] = useState([]);

  // Reports state
  const [adminReportType, setAdminReportType] = useState('daily');
  const [adminSelectedDate, setAdminSelectedDate] = useState(() => getMakassarDateString());
  const [adminSelectedMonth, setAdminSelectedMonth] = useState(() => getMakassarMonthString());
  const [adminShowAllDrivers, setAdminShowAllDrivers] = useState(true);
  const [adminCopied, setAdminCopied] = useState(false);

  useEffect(() => {
    const unsubSettings = onSnapshot(getDocPath('settings', 'tandon_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings(data);
        setLocalData('settings_tandon', data);
      }
    }, () => {
      setSettings(getLocalData('settings_tandon', { price: 20000 }));
    });

    const unsubTx = onSnapshot(getPublicPath('transactions'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(list);
      setLocalData('transactions', list);
    }, () => {
      setTransactions(getLocalData('transactions', []));
    });

    const unsubDrivers = onSnapshot(getPublicPath('drivers'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDrivers(list);
      setLocalData('drivers', list);
    }, () => {
      setDrivers(getLocalData('drivers', []));
    });

    const unsubHistory = onSnapshot(getPublicPath('price_history'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPriceHistory(list);
      setLocalData('price_history', list);
    }, () => {
      setPriceHistory(getLocalData('price_history', []));
    });

    return () => { unsubSettings(); unsubTx(); unsubDrivers(); unsubHistory(); };
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError('');

    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword) {
      setUserError('Lengkapi semua data user.');
      return;
    }

    if (newUserRole === 'SUPER_ADMIN' && sessionUser.role !== 'SUPER_ADMIN') {
      setUserError('Hanya Super Administrator yang dapat membuat akun Super Administrator.');
      return;
    }

    const cleanUsername = newUserUsername.trim().toLowerCase();
    const isDuplicate = allUsers.some(u => u.username?.toLowerCase() === cleanUsername);
    if (isDuplicate) {
      setUserError(`Username "${cleanUsername}" sudah digunakan.`);
      return;
    }

    try {
      const newDocId = 'usr_' + Date.now();
      await setDoc(getDocPath('users', newDocId), {
        id: newDocId,
        name: newUserName.trim(),
        username: cleanUsername,
        password: newUserPassword,
        role: newUserRole,
        divisions: newUserDivisions,
        isActive: true,
        createdAt: Date.now(),
        createdBy: sessionUser.name
      });

      setIsAddUserOpen(false);
      setNewUserName('');
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserRole('OPERATOR');
      setNewUserDivisions(['TANDON']);
    } catch (err) {
      console.error("Error creating user:", err);
      setUserError('Gagal menyimpan user baru.');
    }
  };

  const handleToggleUserActive = async (user) => {
    if (user.id === sessionUser.id) return;
    await updateDoc(getDocPath('users', user.id), {
      isActive: !user.isActive
    });
  };

  const handleUpdateUserRole = async (userId, role) => {
    if (role === 'SUPER_ADMIN' && sessionUser.role !== 'SUPER_ADMIN') {
      alert('Hanya Super Administrator yang dapat memberikan role Super Administrator.');
      return;
    }
    await updateDoc(getDocPath('users', userId), { role });
  };

  const handleToggleDivision = async (user, divId) => {
    const currentDivs = user.divisions || [];
    const newDivs = currentDivs.includes(divId)
      ? currentDivs.filter(d => d !== divId)
      : [...currentDivs, divId];
    
    await updateDoc(getDocPath('users', user.id), { divisions: newDivs });
  };

  const handleExecutePasswordReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (sessionUser.role !== 'SUPER_ADMIN') {
      setResetError('Hanya Super Administrator yang berhak mereset password.');
      return;
    }

    if (!newPasswordValue || newPasswordValue.length < 4) {
      setResetError('Password baru minimal 4 karakter.');
      return;
    }

    try {
      await updateDoc(getDocPath('users', resetTargetUser.id), {
        password: newPasswordValue,
        passwordResetAt: Date.now(),
        passwordResetBy: sessionUser.name
      });

      setResetSuccess(`Password untuk ${resetTargetUser.name} berhasil diperbarui.`);
      setTimeout(() => {
        setResetTargetUser(null);
        setNewPasswordValue('');
        setResetSuccess('');
      }, 1500);
    } catch (err) {
      console.error("Password reset error:", err);
      setResetError('Gagal mereset password.');
    }
  };

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    const newPrice = parseInt(e.target.price.value);
    if (!newPrice || newPrice <= 0) return;
    
    await setDoc(getDocPath('settings', 'tandon_config'), {
      price: newPrice,
      updatedAt: Date.now(),
      updatedBy: sessionUser.name
    }, { merge: true });

    await addDoc(getPublicPath('price_history'), {
      price: newPrice,
      updatedAt: Date.now(),
      updatedBy: sessionUser.name,
      updatedById: sessionUser.id
    });

    e.target.reset();
  };

  const renderUsersTab = () => {
    const filteredUsers = allUsers.filter(u => 
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.username?.toLowerCase().includes(userSearch.toLowerCase())
    );

    const isSuperAdmin = sessionUser.role === 'SUPER_ADMIN';

    return (
      <div className="space-y-4">
        {/* Mobile Search & Add Action Header */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama atau username..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            />
          </div>
          <Button onClick={() => setIsAddUserOpen(true)} className="py-3 px-4 text-xs font-bold shrink-0 shadow-sm">
            <UserPlus size={16} /> Tambah User Baru
          </Button>
        </div>

        {/* User Mobile Cards */}
        <div className="space-y-3">
          {filteredUsers.map(user => (
            <Card key={user.id} className="p-3.5 sm:p-4 bg-white shadow-sm border-slate-200/90">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    user.role === 'SUPER_ADMIN' 
                      ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                      : user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{user.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        user.role === 'SUPER_ADMIN' 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                          : user.role === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : user.role}
                      </span>
                      {!user.isActive && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          NON-AKTIF
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">@{user.username}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-slate-50">
                  {/* Password reset button - strictly for Super Admin */}
                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setResetTargetUser(user);
                        setNewPasswordValue('');
                        setResetError('');
                        setResetSuccess('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 transition-all flex items-center gap-1 active:scale-95"
                      title="Reset Password User"
                    >
                      <Key size={13} /> Reset Password
                    </button>
                  )}

                  {user.id !== sessionUser.id && (
                    <button
                      onClick={() => handleToggleUserActive(user)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                        user.isActive 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/60' 
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200/60'
                      }`}
                    >
                      {user.isActive ? 'Non-aktifkan' : 'Aktifkan'}
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Role & Access Controls */}
              <div className="pt-3 space-y-3">
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Akses Divisi (Ketuk untuk Ubah):</span>
                  <div className="grid grid-cols-2 sm:flex gap-1.5 sm:flex-wrap">
                    {[
                      { id: 'TANDON', label: 'Air Tandon' },
                      { id: 'GALLON', label: 'Air Gallon' },
                      { id: 'INDUSTRIAL_GAS', label: 'Gas Industri' },
                      { id: 'MOBIL_TANGKI', label: 'Mobil Tangki' }
                    ].map(div => {
                      const hasAccess = user.divisions?.includes(div.id);
                      return (
                        <button
                          key={div.id}
                          onClick={() => handleToggleDivision(user, div.id)}
                          className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border text-center transition-all active:scale-95 ${
                            hasAccess 
                              ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs' 
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {hasAccess ? '✓ ' : '+ '}{div.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Peran User (Role):</span>
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                    disabled={user.id === sessionUser.id || (user.role === 'SUPER_ADMIN' && !isSuperAdmin)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OPERATOR">OPERATOR</option>
                    <option value="ADMIN">ADMINISTRATOR</option>
                    {isSuperAdmin && <option value="SUPER_ADMIN">SUPER ADMINISTRATOR</option>}
                    <option value="DRIVER">DRIVER / SOPIR</option>
                    <option value="SUPERVISOR">SUPERVISOR</option>
                    <option value="MANAGEMENT">MANAGEMENT</option>
                  </select>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Modal Reset Password (Super Admin Only) */}
        <Modal 
          isOpen={!!resetTargetUser} 
          onClose={() => setResetTargetUser(null)} 
          title={`Reset Password — ${resetTargetUser?.name || ''}`}
        >
          <form onSubmit={handleExecutePasswordReset} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              Password tidak dapat dilihat. Masukkan password baru untuk mengganti password akun ini.
            </div>

            {resetError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-100">
                <AlertCircle size={16} className="shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-2 border border-emerald-100">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password Baru</label>
              <input
                type="password"
                value={newPasswordValue}
                onChange={(e) => setNewPasswordValue(e.target.value)}
                placeholder="Masukkan password baru"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                required
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full py-3.5 font-bold shadow-md bg-amber-600 hover:bg-amber-700 text-white">
              Simpan Password Baru
            </Button>
          </form>
        </Modal>

        {/* Mobile-Friendly Add User Modal */}
        <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="Tambah User Baru">
          <form onSubmit={handleCreateUser} className="space-y-3.5">
            {userError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-100">
                <AlertCircle size={16} className="shrink-0" />
                <span>{userError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Contoh: Budi Operator"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Username</label>
              <input
                type="text"
                value={newUserUsername}
                onChange={(e) => setNewUserUsername(e.target.value)}
                placeholder="budi123"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none lowercase focus:bg-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Role</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="OPERATOR">OPERATOR</option>
                <option value="ADMIN">ADMINISTRATOR</option>
                {isSuperAdmin && <option value="SUPER_ADMIN">SUPER ADMINISTRATOR</option>}
                <option value="DRIVER">DRIVER / SOPIR</option>
                <option value="SUPERVISOR">SUPERVISOR</option>
                <option value="MANAGEMENT">MANAGEMENT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Akses Divisi User</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {[
                  { id: 'TANDON', label: 'Air Tandon' },
                  { id: 'GALLON', label: 'Air Gallon' },
                  { id: 'INDUSTRIAL_GAS', label: 'Gas Industri' },
                  { id: 'MOBIL_TANGKI', label: 'Mobil Tangki' }
                ].map(div => (
                  <label key={div.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer p-1">
                    <input
                      type="checkbox"
                      checked={newUserDivisions.includes(div.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewUserDivisions([...newUserDivisions, div.id]);
                        } else {
                          setNewUserDivisions(newUserDivisions.filter(d => d !== div.id));
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>{div.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full py-3.5 font-bold shadow-md">Simpan User</Button>
          </form>
        </Modal>
      </div>
    );
  };

  const renderPriceTab = () => {
    return (
      <div className="space-y-4">
        <Card className="p-4 sm:p-5 bg-white space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <Droplet size={24} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">HARGA SAAT INI (ADMIN ONLY)</span>
              <h3 className="text-2xl font-black text-slate-900">
                Rp {(settings?.price || 20000).toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">/ Tandon</span>
              </h3>
            </div>
          </div>

          <form onSubmit={handleUpdatePrice} className="pt-3 border-t space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Ubah Harga Tandon (Rp)</label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="number"
                name="price"
                placeholder={settings?.price || 20000}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                required
              />
              <Button type="submit" className="py-3 px-5 text-xs font-bold w-full sm:w-auto shadow-sm">Simpan Harga Baru</Button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Perubahan harga hanya dapat dilakukan oleh Admin dan langsung berlaku untuk semua transaksi baru secara real-time.
            </p>
          </form>
        </Card>

        <Card className="p-4 shadow-sm">
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b flex items-center gap-1.5">
            <History size={16} className="text-blue-600" />
            Riwayat Audit Perubahan Harga
          </h4>
          <div className="divide-y text-xs">
            {priceHistory.length === 0 ? (
              <p className="text-slate-400 text-center py-4">Belum ada catatan perubahan harga.</p>
            ) : (
              priceHistory.sort((a,b) => b.updatedAt - a.updatedAt).map(h => (
                <div key={h.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">Rp {(h.price || 0).toLocaleString('id-ID')}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Diubah oleh: {h.updatedBy || 'Admin'}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono text-right">
                    {getMakassarDateString(h.updatedAt)} • {getMakassarTimeString(h.updatedAt)} WITA
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderReportsTab = () => {
    const todayStr = getMakassarDateString();
    const tandonTxs = transactions.filter(t => !t.division || t.division === 'TANDON');

    // Filter by daily, weekly, or monthly boundaries
    let filteredTxs = [];
    let reportTitle = "";
    let reportSubtitle = "";

    if (adminReportType === 'daily') {
      filteredTxs = tandonTxs.filter(t => {
        const txDateStr = t.dateString || (t.timestamp ? getMakassarDateString(t.timestamp) : '');
        return txDateStr === adminSelectedDate;
      });
      reportTitle = `Laporan Harian (${adminSelectedDate})`;
      reportSubtitle = `Data harian otomatis direset jam 00:00 WITA. Tersedia untuk semua user.`;
    } else if (adminReportType === 'weekly') {
      const { startStr, endStr } = getWeekRange(adminSelectedDate);
      filteredTxs = tandonTxs.filter(t => {
        const txDateStr = t.dateString || (t.timestamp ? getMakassarDateString(t.timestamp) : '');
        return txDateStr >= startStr && txDateStr <= endStr;
      });
      reportTitle = `Laporan Mingguan (${startStr} s/d ${endStr})`;
      reportSubtitle = `KHUSUS ADMINISTRATOR — Ringkasan performa 7 hari.`;
    } else if (adminReportType === 'monthly') {
      filteredTxs = tandonTxs.filter(t => {
        const txDateStr = t.dateString || (t.timestamp ? getMakassarDateString(t.timestamp) : '');
        return txDateStr.startsWith(adminSelectedMonth);
      });
      reportTitle = `Laporan Bulanan (${adminSelectedMonth})`;
      reportSubtitle = `KHUSUS ADMINISTRATOR — Rekapitulasi penuh bulanan.`;
    }

    const validTxs = filteredTxs.filter(t => t.status !== 'VOIDED');
    const voidedTxs = filteredTxs.filter(t => t.status === 'VOIDED');

    // Aggregate statistics per driver
    const driverStats = {};
    if (adminShowAllDrivers) {
      drivers.forEach(d => {
        driverStats[d.id] = { name: d.name, count: 0, revenue: 0 };
      });
    }

    validTxs.forEach(tx => {
      if (!driverStats[tx.driverId]) {
        driverStats[tx.driverId] = { name: tx.driverName, count: 0, revenue: 0 };
      }
      driverStats[tx.driverId].count += (Number(tx.quantity) || 1);
      driverStats[tx.driverId].revenue += (Number(tx.totalAmount) || 0);
    });

    const totalCount = validTxs.reduce((sum, tx) => sum + (Number(tx.quantity) || 1), 0);
    const totalRevenue = validTxs.reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
    const activeDriversCount = Object.values(driverStats).filter(d => d.count > 0).length;

    // Daily breakdown list for weekly & monthly views
    const dailyBreakdown = {};
    validTxs.forEach(tx => {
      const ds = tx.dateString || getMakassarDateString(tx.timestamp);
      if (!dailyBreakdown[ds]) dailyBreakdown[ds] = { count: 0, revenue: 0, txs: 0 };
      dailyBreakdown[ds].count += (Number(tx.quantity) || 1);
      dailyBreakdown[ds].revenue += (Number(tx.totalAmount) || 0);
      dailyBreakdown[ds].txs += 1;
    });

    const activeDaysCount = Object.keys(dailyBreakdown).length || 1;
    const avgTandonPerDay = (totalCount / activeDaysCount).toFixed(1);

    const handleCopyWA = () => {
      let text = `*LAPORAN OPERASIONAL ${adminReportType.toUpperCase()} (TANDON)*\n`;
      text += `📅 Periode: ${adminReportType === 'daily' ? adminSelectedDate : adminReportType === 'weekly' ? getWeekRange(adminSelectedDate).startStr + ' s/d ' + getWeekRange(adminSelectedDate).endStr : adminSelectedMonth}\n`;
      text += `📦 Total Tandon: ${totalCount} Tandon\n`;
      text += `💰 Total Omset: Rp ${totalRevenue.toLocaleString('id-ID')}\n`;
      text += `🚚 Sopir Aktif: ${activeDriversCount} Sopir\n`;
      if (adminReportType !== 'daily') {
        text += `📊 Rata-rata/Hari: ${avgTandonPerDay} Tandon/Hari\n`;
      }
      text += `\n*RINCIAN PER SOPIR:*\n`;

      const sorted = Object.values(driverStats).sort((a,b) => b.count - a.count);
      const activeOnly = sorted.filter(s => s.count > 0);

      if (activeOnly.length === 0) {
        text += `- Belum ada transaksi\n`;
      } else {
        activeOnly.forEach((s, i) => {
          text += `${i + 1}. ${s.name}: ${s.count} tandon (Rp ${s.revenue.toLocaleString('id-ID')})\n`;
        });
      }

      text += `\n_Diunduh dari Admin Panel (${sessionUser?.name})_`;

      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        setAdminCopied(true);
        setTimeout(() => setAdminCopied(false), 2000);
      } catch (err) {
        console.error("Copy failed", err);
      }
    };

    return (
      <div className="space-y-4">
        {/* Mobile Grid Sub-Navigation for Equal 3-Column Touch Buttons */}
        <div className="grid grid-cols-3 bg-slate-200 p-1 rounded-xl gap-1 text-[11px] sm:text-xs font-bold">
          <button
            onClick={() => setAdminReportType('daily')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
              adminReportType === 'daily' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar size={13} /> Harian
          </button>
          <button
            onClick={() => setAdminReportType('weekly')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
              adminReportType === 'weekly' ? 'bg-purple-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp size={13} /> Mingguan
          </button>
          <button
            onClick={() => setAdminReportType('monthly')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
              adminReportType === 'monthly' ? 'bg-purple-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 size={13} /> Bulanan
          </button>
        </div>

        {/* Date / Period Controls Card */}
        <Card className="p-3.5 bg-white flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600 shrink-0" />
            <div className="flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {adminReportType === 'daily' ? 'PILIH TANGGAL' : adminReportType === 'weekly' ? 'PILIH MINGGU (ACUAN TANGGAL)' : 'PILIH BULAN'}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                {adminReportType !== 'monthly' ? (
                  <input 
                    type="date" 
                    value={adminSelectedDate} 
                    onChange={(e) => setAdminSelectedDate(e.target.value)}
                    className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <input 
                    type="month" 
                    value={adminSelectedMonth} 
                    onChange={(e) => setAdminSelectedMonth(e.target.value)}
                    className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
                {adminReportType === 'daily' && adminSelectedDate !== todayStr && (
                  <button 
                    onClick={() => setAdminSelectedDate(todayStr)} 
                    className="text-[11px] font-bold text-blue-600 hover:underline shrink-0"
                  >
                    Hari Ini
                  </button>
                )}
              </div>
            </div>
          </div>

          <Button 
            onClick={handleCopyWA} 
            variant={adminCopied ? "secondary" : "outline"} 
            className="py-2.5 px-3 text-xs shrink-0 w-full sm:w-auto font-bold"
          >
            {adminCopied ? <Check size={15} className="text-emerald-600" /> : <Share2 size={15} />}
            <span>{adminCopied ? "Tersalin ke Clipboard!" : "Salin Laporan WA"}</span>
          </Button>
        </Card>

        {/* Info Banner */}
        <div className="bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600 font-medium">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
            {reportTitle}
          </span>
          <span className="text-[10px] font-mono text-slate-400">{reportSubtitle}</span>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Card className="p-3 sm:p-3.5 shadow-sm" style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>
            <p className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Total Tandon</p>
            <p className="text-2xl font-black mt-1 text-white">{totalCount}</p>
            <p className="text-[10px] text-blue-200 mt-0.5">{validTxs.length} Transaksi</p>
          </Card>

          <Card className="p-3 sm:p-3.5 shadow-sm" style={{ backgroundColor: '#059669', color: '#ffffff' }}>
            <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider">Total Omset</p>
            <p className="text-lg sm:text-xl font-black mt-1 text-white">Rp {totalRevenue.toLocaleString('id-ID')}</p>
            <p className="text-[10px] text-emerald-200 mt-0.5">Pendapatan Bruto</p>
          </Card>

          <Card className="p-3 sm:p-3.5 shadow-sm" style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}>
            <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-wider">Sopir Aktif</p>
            <p className="text-2xl font-black mt-1 text-white">{activeDriversCount}</p>
            <p className="text-[10px] text-indigo-200 mt-0.5">Dari {drivers.length} Master</p>
          </Card>

          <Card className="p-3 sm:p-3.5 shadow-sm" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
              {adminReportType === 'daily' ? 'Batal / Void' : 'Rata-rata/Hari'}
            </p>
            <p className="text-2xl font-black mt-1 text-emerald-400">
              {adminReportType === 'daily' ? voidedTxs.length : avgTandonPerDay}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {adminReportType === 'daily' ? 'Transaksi Batal' : `${activeDaysCount} hari aktif`}
            </p>
          </Card>
        </div>

        {/* Daily Breakdown for Weekly & Monthly Admin Reports */}
        {adminReportType !== 'daily' && (
          <Card className="p-3.5 sm:p-4 shadow-sm">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 pb-2 border-b flex items-center justify-between">
              <span>Rincian Penjualan Harian</span>
              <span className="text-[10px] text-slate-400 font-mono">{Object.keys(dailyBreakdown).length} Hari Tercatat</span>
            </h4>
            <div className="divide-y text-xs">
              {Object.keys(dailyBreakdown).length === 0 ? (
                <p className="text-slate-400 text-center py-4">Tidak ada data transaksi pada periode ini.</p>
              ) : (
                Object.keys(dailyBreakdown).sort().reverse().map(dStr => (
                  <div key={dStr} className="py-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{dStr}</p>
                      <p className="text-[10px] text-slate-400">{dailyBreakdown[dStr].txs} transaksi</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-blue-600 block sm:inline sm:mr-3">{dailyBreakdown[dStr].count} Tandon</span>
                      <span className="font-bold text-slate-900">Rp {dailyBreakdown[dStr].revenue.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* Driver Sales Table Breakdown */}
        <Card className="shadow-sm">
          <div className="p-3.5 border-b bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Rincian Pembelian per Sopir</h4>
              <p className="text-[11px] text-slate-500">Master database sopir terdaftar ({drivers.length} sopir)</p>
            </div>

            <button 
              type="button"
              onClick={() => setAdminShowAllDrivers(!adminShowAllDrivers)}
              className="w-full sm:w-auto text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1 active:scale-95"
            >
              <Filter size={13} />
              {adminShowAllDrivers ? "Sembunyikan Sopir 0 Tandon" : "Tampilkan Semua Master Sopir"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Nama Sopir</th>
                  <th className="p-3 text-center">Jumlah Tandon</th>
                  <th className="p-3 text-right">Total Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Object.values(driverStats).length === 0 && (
                  <tr><td colSpan="3" className="p-6 text-center text-slate-400">Belum ada data sopir dalam sistem master.</td></tr>
                )}
                {Object.values(driverStats)
                  .sort((a,b) => b.count - a.count || a.name.localeCompare(b.name))
                  .map((stat, i) => (
                    <tr key={i} className={`hover:bg-slate-50 ${stat.count === 0 ? 'opacity-50 bg-slate-50/50' : ''}`}>
                      <td className="p-3 font-bold text-slate-800 uppercase flex items-center gap-1.5 flex-wrap">
                        <span>{stat.name}</span>
                        {stat.count === 0 && (
                          <span className="text-[9px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded">Belum Beli</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-blue-600">{stat.count} Tandon</td>
                      <td className="p-3 text-right font-bold text-slate-900">Rp {stat.revenue.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-md sm:max-w-2xl mx-auto px-3 sm:px-4 py-4 pb-24">
      {/* Mobile Top App Bar */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={onNavigateHome} className="p-2.5 rounded-xl border-slate-200 shadow-xs">
            <ArrowLeft size={18}/>
          </Button>
          <div>
            <GalanganKalimasLogo size="sm" variant="color" className="mb-0.5" />
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">Panel Admin</h1>
              <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">Mobile Ready</span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Kelola User, Harga, & Laporan Operasional (Harian, Mingguan, Bulanan)</p>
          </div>
        </div>
      </div>

      {/* Grid 3-Column Tab Bar for Touchscreens */}
      <div className="grid grid-cols-3 bg-slate-200 p-1 rounded-xl mb-4 sm:mb-6 gap-1 shadow-xs">
        {[
          { id: 'users', label: 'User & Akses', icon: Users },
          { id: 'price', label: 'Harga Tandon', icon: Droplet },
          { id: 'reports', label: 'Laporan', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon size={15} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'price' && renderPriceTab()}
      {activeTab === 'reports' && renderReportsTab()}
    </div>
  );
};

const TandonOperator = ({ onNavigateHome, showBackButton }) => {
  const { sessionUser, logout } = useContext(AuthContext);
  const [drivers, setDrivers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({ price: 20000 });
  const [search, setSearch] = useState('');
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const [opTab, setOpTab] = useState('input');
  const [selectedDate, setSelectedDate] = useState(getMakassarDateString());
  const [showAllDriversInReport, setShowAllDriversInReport] = useState(true);
  const [reportSearch, setReportSearch] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    const unsubDrivers = onSnapshot(getPublicPath('drivers'), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDrivers(list);
      setLocalData('drivers', list);
    }, () => {
      setDrivers(getLocalData('drivers', []));
    });

    const unsubTx = onSnapshot(getPublicPath('transactions'), snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(list);
      setLocalData('transactions', list);
    }, () => {
      setTransactions(getLocalData('transactions', []));
    });

    const unsubSettings = onSnapshot(getDocPath('settings', 'tandon_config'), snap => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings(data);
        setLocalData('settings_tandon', data);
      }
    }, () => {
      setSettings(getLocalData('settings_tandon', { price: 20000 }));
    });

    return () => { unsubDrivers(); unsubTx(); unsubSettings(); };
  }, []);

  const todayStr = getMakassarDateString();

  // Transactions belonging to TODAY (Automatic midnight reset at 00:00 WITA)
  const todayTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (t.division && t.division !== 'TANDON') return false;
      const txDateStr = t.dateString || (t.timestamp ? getMakassarDateString(t.timestamp) : '');
      return txDateStr === todayStr;
    });
  }, [transactions, todayStr]);

  const validTodayTxs = useMemo(() => {
    return todayTransactions.filter(t => t.status !== 'VOIDED');
  }, [todayTransactions]);

  // Filter transactions created by current logged in user session only
  const myValidTodayTxs = useMemo(() => {
    return validTodayTxs.filter(t => t.operatorId === sessionUser.id);
  }, [validTodayTxs, sessionUser.id]);

  const myTodayCount = useMemo(() => {
    return myValidTodayTxs.reduce((sum, tx) => sum + (Number(tx.quantity) || 1), 0);
  }, [myValidTodayTxs]);
  
  const driverCounts = useMemo(() => {
    const counts = {};
    validTodayTxs.forEach(tx => {
      counts[tx.driverId] = (counts[tx.driverId] || 0) + (Number(tx.quantity) || 1);
    });
    return counts;
  }, [validTodayTxs]);

  const totalTodayCount = useMemo(() => {
    return validTodayTxs.reduce((sum, tx) => sum + (Number(tx.quantity) || 1), 0);
  }, [validTodayTxs]);

  // Persistent Daily Report Data (Selected Date)
  const reportDateTxs = useMemo(() => {
    return transactions.filter(t => {
      if (t.division && t.division !== 'TANDON') return false;
      const txDateStr = t.dateString || (t.timestamp ? getMakassarDateString(t.timestamp) : '');
      return txDateStr === selectedDate;
    });
  }, [transactions, selectedDate]);

  const validReportTxs = useMemo(() => {
    return reportDateTxs.filter(t => t.status !== 'VOIDED');
  }, [reportDateTxs]);

  const myValidReportTxs = useMemo(() => {
    return validReportTxs.filter(t => t.operatorId === sessionUser.id);
  }, [validReportTxs, sessionUser.id]);

  const myReportCount = useMemo(() => {
    return myValidReportTxs.reduce((sum, tx) => sum + (Number(tx.quantity) || 1), 0);
  }, [myValidReportTxs]);

  const voidedReportTxs = useMemo(() => {
    return reportDateTxs.filter(t => t.status === 'VOIDED');
  }, [reportDateTxs]);

  const reportDriverStats = useMemo(() => {
    const stats = {};
    
    if (showAllDriversInReport) {
      drivers.forEach(d => {
        stats[d.id] = { id: d.id, name: d.name, count: 0, revenue: 0 };
      });
    }

    validReportTxs.forEach(tx => {
      if (!stats[tx.driverId]) {
        stats[tx.driverId] = { id: tx.driverId, name: tx.driverName, count: 0, revenue: 0 };
      }
      stats[tx.driverId].count += (Number(tx.quantity) || 1);
      stats[tx.driverId].revenue += (Number(tx.totalAmount) || 0);
    });

    return stats;
  }, [validReportTxs, drivers, showAllDriversInReport]);

  const filteredReportDriverStats = useMemo(() => {
    return Object.values(reportDriverStats)
      .filter(stat => {
        if (!showAllDriversInReport && stat.count === 0) return false;
        if (reportSearch.trim() && !stat.name.toLowerCase().includes(reportSearch.toLowerCase().trim())) return false;
        return true;
      })
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });
  }, [reportDriverStats, showAllDriversInReport, reportSearch]);

  const activeDriverCount = useMemo(() => {
    return Object.values(reportDriverStats).filter(s => s.count > 0).length;
  }, [reportDriverStats]);

  const reportTotalCount = useMemo(() => {
    return validReportTxs.reduce((sum, tx) => sum + (Number(tx.quantity) || 1), 0);
  }, [validReportTxs]);

  const reportTotalRevenue = useMemo(() => {
    return validReportTxs.reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
  }, [validReportTxs]);

  const myLastTx = useMemo(() => {
    return todayTransactions
      .filter(t => t.operatorId === sessionUser.id)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  }, [todayTransactions, sessionUser.id]);

  const handleAddDriver = async (e) => {
    e.preventDefault();
    const cleanName = newDriverName.trim().toUpperCase();
    if (!cleanName) return;
    
    const existing = drivers.find(d => d.name.toUpperCase() === cleanName);
    if (existing) {
      alert(`Sopir "${cleanName}" sudah terdaftar di database terpusat.`);
      return;
    }

    const newDriver = {
      id: 'drv_' + Date.now(),
      name: cleanName,
      createdBy: sessionUser.name,
      createdById: sessionUser.id,
      createdAt: Date.now()
    };

    try {
      await addDoc(getPublicPath('drivers'), newDriver);
    } catch (err) {
      console.warn("Firestore offline, saved driver locally:", err);
    }

    const updated = [...drivers, newDriver];
    setDrivers(updated);
    setLocalData('drivers', updated);
    
    setNewDriverName('');
    setIsAddingDriver(false);
  };

  const handlePlusOne = async (driver) => {
    if (processingId === driver.id) return;
    setProcessingId(driver.id);
    
    try {
      const currentPrice = settings?.price || 20000;
      const newTx = {
        id: 'tx_' + Date.now(),
        driverId: driver.id,
        driverName: driver.name,
        operatorId: sessionUser.id,
        operatorName: sessionUser.name,
        division: 'TANDON',
        quantity: 1,
        unitPrice: currentPrice,
        totalAmount: currentPrice,
        timestamp: Date.now(),
        dateString: getMakassarDateString(),
        status: 'COMPLETED'
      };

      try {
        await addDoc(getPublicPath('transactions'), newTx);
      } catch (err) {
        console.warn("Firestore offline, saved transaction locally:", err);
      }

      const updated = [...transactions, newTx];
      setTransactions(updated);
      setLocalData('transactions', updated);

    } catch (err) {
      console.error("Tx recording error:", err);
    } finally {
      setTimeout(() => setProcessingId(null), 350);
    }
  };

  const handleVoid = async (txId) => {
    const voidData = {
      status: 'VOIDED',
      voidedAt: Date.now(),
      voidedBy: sessionUser.name,
      voidedById: sessionUser.id
    };

    try {
      await updateDoc(getDocPath('transactions', txId), voidData);
    } catch (err) {
      console.warn("Firestore offline, updated void status locally:", err);
    }

    const updated = transactions.map(t => t.id === txId ? { ...t, ...voidData } : t);
    setTransactions(updated);
    setLocalData('transactions', updated);
  };

  const handleCopyWhatsAppReport = () => {
    let text = `*LAPORAN HARIAN PENJUALAN TANDON*\n`;
    text += `📅 Tanggal: ${selectedDate}\n`;
    text += `📦 Total Tandon: ${reportTotalCount} Tandon\n`;
    text += `💰 Total Omset: Rp ${reportTotalRevenue.toLocaleString('id-ID')}\n`;
    text += `🚚 Sopir Aktif: ${activeDriverCount} Sopir\n`;
    if (voidedReportTxs.length > 0) {
      text += `❌ Transaksi Batal: ${voidedReportTxs.length} Transaksi\n`;
    }
    text += `----------------------------------\n`;
    text += `*RINCIAN PER SOPIR:*\n`;

    const activeList = Object.values(reportDriverStats)
      .filter(s => s.count > 0)
      .sort((a,b) => b.count - a.count);

    if (activeList.length === 0) {
      text += `- Belum ada transaksi tercatat\n`;
    } else {
      activeList.forEach((s, idx) => {
        text += `${idx + 1}. ${s.name}: ${s.count} tandon (Rp ${s.revenue.toLocaleString('id-ID')})\n`;
      });
    }

    text += `\n_Operator: ${sessionUser?.name || 'Petugas'} (WITA)_`;

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2200);
    } catch (err) {
      console.error("Copy error:", err);
    }
  };

  const setYesterdayDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(getMakassarDateString(d));
  };

  const filteredDrivers = drivers
    .filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-blue-600 text-white p-4 pt-5 pb-5 rounded-b-3xl shadow-lg sticky top-0 z-20">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {showBackButton && (
              <button onClick={onNavigateHome} className="p-1.5 hover:bg-blue-500 rounded-lg text-white transition-colors">
                <ArrowLeft size={20}/>
              </button>
            )}
            <GalanganKalimasLogo size="sm" variant="light" />
          </div>
          <button 
            onClick={logout} 
            className="text-blue-200 hover:text-white bg-blue-700/50 hover:bg-blue-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <LogOut size={14} /> Keluar
          </button>
        </div>
        
        {/* Total Tandon Header Banner */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-4 rounded-2xl border border-blue-400/30 shadow-lg text-white">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-blue-500/30">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50"></span>
              <span className="text-xs font-extrabold text-blue-100 uppercase tracking-wider">Tandon Hari Ini</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-blue-900/80 text-blue-200 px-2.5 py-0.5 rounded-full font-bold border border-blue-500/30 font-mono">
                {todayStr} • Reset 00:00 WITA
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-950/50 p-3 rounded-xl border border-blue-400/20">
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Total Semua Operator</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-black text-white">{totalTodayCount}</span>
                <span className="text-xs font-semibold text-blue-200">Tandon</span>
              </div>
              <p className="text-[10px] text-blue-300 mt-1 font-medium">
                Omset: <strong className="text-white">Rp {(totalTodayCount * (settings?.price || 20000)).toLocaleString('id-ID')}</strong>
              </p>
            </div>

            <div className="bg-blue-600/60 p-3 rounded-xl border border-blue-300/30">
              <span className="text-[10px] font-bold text-blue-100 uppercase tracking-wider block">Input Saya ({sessionUser?.name})</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-black text-emerald-300">{myTodayCount}</span>
                <span className="text-xs font-semibold text-blue-100">Tandon</span>
              </div>
              <p className="text-[10px] text-blue-100 mt-1 font-medium">
                Omset: <strong className="text-white">Rp {(myTodayCount * (settings?.price || 20000)).toLocaleString('id-ID')}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-blue-800/50 p-1 rounded-xl mt-3 text-xs font-semibold gap-1">
          <button 
            onClick={() => setOpTab('input')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              opTab === 'input' ? 'bg-white text-blue-700 font-bold shadow-sm' : 'text-blue-100 hover:text-white'
            }`}
          >
            <Plus size={15} /> Input Transaksi
          </button>
          <button 
            onClick={() => setOpTab('report')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              opTab === 'report' ? 'bg-white text-blue-700 font-bold shadow-sm' : 'text-blue-100 hover:text-white'
            }`}
          >
            <FileText size={15} /> Laporan Harian
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        {opTab === 'input' ? (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Cari nama sopir..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
              </div>
              <Button onClick={() => setIsAddingDriver(true)} className="px-3.5 shadow-sm">
                <Plus size={20} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pb-28">
              {filteredDrivers.map(driver => (
                <Card key={driver.id} className="p-3.5 flex items-center justify-between border-slate-200/80 shadow-sm">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 uppercase tracking-tight">{driver.name}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Hari Ini: <span className="text-blue-600 font-extrabold">{driverCounts[driver.id] || 0}</span> tandon
                    </p>
                  </div>
                  <button
                    onClick={() => handlePlusOne(driver)}
                    disabled={processingId === driver.id}
                    className={`w-16 h-14 rounded-xl flex items-center justify-center font-black text-lg shadow-md transition-all active:scale-90 ${
                      processingId === driver.id 
                        ? 'bg-slate-300 text-white cursor-not-allowed scale-100' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                    }`}
                  >
                    {processingId === driver.id ? '...' : '+1'}
                  </button>
                </Card>
              ))}

              {filteredDrivers.length === 0 && (
                <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
                  <Truck size={36} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-600">Sopir tidak ditemukan</p>
                  <p className="text-xs text-slate-400 mt-0.5">Tambah sopir baru ke master data terpusat</p>
                  <Button onClick={() => setIsAddingDriver(true)} variant="outline" className="mx-auto mt-4 py-2 px-4 text-xs">
                    + Tambah Sopir Baru
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4 pb-12">
            {/* Operator Daily Report Date Selector Card */}
            <Card className="p-3.5 bg-white space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600 shrink-0" />
                  <span className="font-bold text-xs text-slate-800">Tanggal Laporan Harian:</span>
                </div>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayStr)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      selectedDate === todayStr ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={setYesterdayDate}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      selectedDate !== todayStr ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Kemarin
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyWhatsAppReport}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                >
                  {copiedText ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                  <span>{copiedText ? "Tersalin!" : "Salin WA"}</span>
                </button>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-2.5">
              <Card className="p-3.5 shadow-sm" style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>
                <div className="flex justify-between items-start">
                  <p className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Total Tandon</p>
                  <span className="text-[9px] bg-blue-700/80 text-blue-100 font-bold px-1.5 py-0.5 rounded border border-blue-400/30">
                    Semua Operator
                  </span>
                </div>
                <p className="text-3xl font-black mt-0.5 text-white">{reportTotalCount}</p>
                <p className="text-[10px] text-blue-200 mt-1 flex justify-between items-center">
                  <span>{validReportTxs.length} Transaksi</span>
                  <span className="font-bold text-white bg-blue-800/80 px-1.5 py-0.5 rounded text-[9px]">
                    Saya: {myReportCount}
                  </span>
                </p>
              </Card>

              <Card className="p-3.5 shadow-sm" style={{ backgroundColor: '#059669', color: '#ffffff' }}>
                <div className="flex justify-between items-start">
                  <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider">Total Omset</p>
                  <span className="text-[9px] bg-emerald-700/80 text-emerald-100 font-bold px-1.5 py-0.5 rounded border border-emerald-400/30">
                    Semua
                  </span>
                </div>
                <p className="text-xl font-black mt-1 text-white">Rp {reportTotalRevenue.toLocaleString('id-ID')}</p>
                <p className="text-[10px] text-emerald-100 mt-1 flex justify-between items-center">
                  <span>Harga: Rp {(settings?.price || 20000).toLocaleString('id-ID')}</span>
                  <span className="font-bold text-white bg-emerald-800/80 px-1.5 py-0.5 rounded text-[9px]">
                    Saya: Rp {(myReportCount * (settings?.price || 20000)).toLocaleString('id-ID')}
                  </span>
                </p>
              </Card>

              <Card className="p-3 shadow-sm" style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}>
                <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-wider">Sopir Aktif</p>
                <p className="text-2xl font-black mt-0.5 text-white">{activeDriverCount} Sopir</p>
                <p className="text-[10px] text-indigo-200 mt-0.5">Dari {drivers.length} Master Sopir</p>
              </Card>

              <Card className="p-3 shadow-sm" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Batal / Void</p>
                <p className="text-2xl font-black mt-0.5 text-red-400">{voidedReportTxs.length}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 flex justify-between items-center">
                  <span>Dibatalkan</span>
                  <span className="text-slate-300 font-bold">Saya: {voidedReportTxs.filter(t => t.operatorId === sessionUser.id).length}</span>
                </p>
              </Card>
            </div>

            <Card className="p-4">
              <div className="flex flex-col gap-2.5 mb-3 pb-3 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart2 size={16} className="text-blue-600" />
                    Rincian Pembelian per Sopir
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    {filteredReportDriverStats.length} Sopir
                  </span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Cari nama sopir di laporan..."
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAllDriversInReport(!showAllDriversInReport)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 shrink-0 ${
                      showAllDriversInReport 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Filter size={12} />
                    {showAllDriversInReport ? "Semua Sopir" : "Sopir Aktif"}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {filteredReportDriverStats.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <BarChart2 size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-700">Belum Ada Transaksi Tandon</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5 mb-3">
                      Belum ada pembelian tandon recorded pada tanggal {selectedDate}.
                    </p>
                    <Button 
                      onClick={() => setOpTab('input')} 
                      className="mx-auto py-2 px-3 text-xs font-bold"
                    >
                      <Plus size={14} /> Input Transaksi Sekarang
                    </Button>
                  </div>
                ) : (
                  filteredReportDriverStats.map((stat) => (
                    <div 
                      key={stat.id} 
                      className={`flex justify-between items-center p-2.5 rounded-xl border transition-all ${
                        stat.count > 0 
                          ? 'bg-slate-50 border-slate-200/80' 
                          : 'bg-slate-50/40 border-slate-100 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-slate-900 uppercase">{stat.name}</p>
                          {stat.count === 0 && (
                            <span className="text-[9px] bg-slate-200 text-slate-500 font-bold px-1.5 py-0.2 rounded">0 Tandon</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          {stat.count > 0 ? `${stat.count} Tandon Dibeli` : 'Belum melakukan pembelian'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className={`font-bold text-xs ${stat.count > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                          Rp {stat.revenue.toLocaleString('id-ID')}
                        </p>
                        {stat.count > 0 && (
                          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {stat.count}x
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 pb-2 border-b flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <History size={16} className="text-blue-600" />
                  Riwayat Transaksi Rinci
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">
                  {reportDateTxs.length} Record
                </span>
              </h3>

              <div className="divide-y text-xs">
                {reportDateTxs.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-4">Tidak ada riwayat transaksi pada tanggal ini.</p>
                ) : (
                  reportDateTxs.sort((a,b) => b.timestamp - a.timestamp).map(tx => (
                    <div key={tx.id} className="py-2.5 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 uppercase">{tx.driverName}</span>
                          {tx.status === 'VOIDED' ? (
                            <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">DIBATALKAN</span>
                          ) : (
                            <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">+1 Tandon</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Operator: {tx.operatorName || '-'} • {getMakassarTimeString(tx.timestamp)} WITA
                        </p>
                      </div>

                      <div className="text-right">
                        <p className={`font-bold ${tx.status === 'VOIDED' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          Rp {(tx.totalAmount || 0).toLocaleString('id-ID')}
                        </p>
                        {tx.status !== 'VOIDED' && (tx.operatorId === sessionUser.id || sessionUser.role === 'ADMIN') && (
                          <button 
                            onClick={() => handleVoid(tx.id)}
                            className="text-[10px] text-red-600 hover:text-red-800 font-semibold mt-0.5"
                          >
                            Batalkan
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {opTab === 'input' && myLastTx && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-10 animate-in slide-in-from-bottom duration-200">
          <div className={`p-3.5 rounded-2xl shadow-xl flex justify-between items-center text-xs font-semibold text-white backdrop-blur-md ${
            myLastTx.status === 'VOIDED' ? 'bg-slate-900/90' : 'bg-emerald-600/95'
          }`}>
            <div className="flex items-center gap-2">
              {myLastTx.status === 'VOIDED' ? <X size={18}/> : <CheckCircle2 size={18}/>}
              <div>
                <p className="font-bold">{myLastTx.driverName} (+1 Tandon)</p>
                <p className="text-[10px] text-white/80">{getMakassarTimeString(myLastTx.timestamp)} WITA</p>
              </div>
            </div>
            {myLastTx.status !== 'VOIDED' && (
              <button 
                onClick={() => handleVoid(myLastTx.id)}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                Batal (+1)
              </button>
            )}
            {myLastTx.status === 'VOIDED' && (
              <span className="bg-red-500/30 text-red-200 px-2.5 py-1 rounded-lg text-[10px] font-bold">DIBATALKAN</span>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={isAddingDriver} onClose={() => setIsAddingDriver(false)} title="Tambah Sopir Ke Master Data">
        <form onSubmit={handleAddDriver} className="space-y-4">
          <p className="text-xs text-slate-500">
            Sopir yang ditambahkan di sini akan langsung tersimpan di database terpusat dan dapat digunakan oleh operator lain secara real-time.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Nama Sopir</label>
            <input
              type="text"
              value={newDriverName}
              onChange={(e) => setNewDriverName(e.target.value)}
              placeholder="Contoh: PAK BUDI"
              className="w-full p-3 border border-slate-200 rounded-xl uppercase font-bold text-sm bg-slate-50"
              autoFocus
              required
            />
          </div>
          <Button type="submit" className="w-full py-3">Simpan Sopir Terpusat</Button>
        </form>
      </Modal>
    </div>
  );
};

const PlaceholderModule = ({ title, icon: Icon, onNavigateHome }) => (
  <div className="max-w-md mx-auto min-h-screen bg-slate-100 p-6 flex flex-col items-center justify-center text-center">
    <GalanganKalimasLogo size="sm" variant="color" className="mb-6" />
    <div className="w-20 h-20 bg-white border border-slate-200 shadow-md text-slate-400 rounded-3xl flex items-center justify-center mb-6">
      <Icon size={40} />
    </div>
    <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
      Modul Dalam Pengembangan
    </span>
    <h2 className="text-2xl font-black text-slate-900 mb-2">{title}</h2>
    <p className="text-sm text-slate-500 mb-8 max-w-xs leading-relaxed">
      Modul operasional <strong>{title}</strong> disiapkan untuk Fase 2/3 platform dan belum dapat digunakan saat ini.
    </p>
    <Button variant="outline" onClick={onNavigateHome} className="px-6 py-3">
      <ArrowLeft size={16} /> Kembali Ke Menu Divisi
    </Button>
  </div>
);

const DivisionSelector = ({ user, onSelect, onAdminNavigate }) => {
  const { logout } = useContext(AuthContext);
  
  const divisions = [
    { id: 'TANDON', name: 'AIR TANDON', icon: Droplet, desc: 'Operasional Air Tandon', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'GALLON', name: 'AIR GALLON', icon: Package, desc: 'Modul Air Gallon (Fase 2)', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { id: 'INDUSTRIAL_GAS', name: 'GAS INDUSTRI', icon: Flame, desc: 'Modul Gas Industri (Fase 3)', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { id: 'MOBIL_TANGKI', name: 'MOBIL TANGKI', icon: Truck, desc: 'Modul Mobil Tangki (Water Tanker)', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  ];

  const userDivisions = divisions.filter(d => user.divisions?.includes(d.id));
  const isAdminOrSuper = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white p-6 flex flex-col">
      <div className="flex justify-between items-center mb-8 mt-2">
        <div>
          <GalanganKalimasLogo size="sm" variant="color" className="mb-2" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Operations</span>
          <h1 className="text-2xl font-black text-slate-900">PILIH DIVISI</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengguna: <strong>{user.name}</strong> ({user.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : user.role})
          </p>
        </div>
        <button 
          onClick={logout} 
          className="p-2.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          title="Keluar"
        >
          <LogOut size={18} />
        </button>
      </div>

      <div className="space-y-3.5 flex-1">
        {userDivisions.map(div => {
          const Icon = div.icon;
          return (
            <button
              key={div.id}
              onClick={() => onSelect(div.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 ${div.border} ${div.bg} hover:shadow-md transition-all active:scale-98 text-left`}
            >
              <div className={`p-3.5 bg-white rounded-xl shadow-sm ${div.color}`}>
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-slate-900">{div.name}</h3>
                <p className="text-xs text-slate-500">{div.desc}</p>
              </div>
              <ChevronRight className={`ml-auto ${div.color}`} size={20} />
            </button>
          );
        })}

        {userDivisions.length === 0 && (
          <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
            <p className="text-sm font-bold text-slate-700">Tidak ada akses divisi</p>
            <p className="text-xs text-slate-400 mt-1">Akun Anda belum diberi akses ke modul divisi manapun oleh Administrator.</p>
          </div>
        )}
      </div>

      {isAdminOrSuper && (
        <div className="mt-8 pt-6 border-t border-slate-100">
          <Button variant="secondary" onClick={onAdminNavigate} className="w-full py-3.5 text-sm font-bold shadow-sm">
            <Settings size={18} /> Masuk Panel Administrator
          </Button>
        </div>
      )}
    </div>
  );
};

const MainApp = () => {
  const { sessionUser, systemInitialized, loading, authError, retryAuth, enableOfflineMode, isOfflineMode } = useContext(AuthContext);
  const [currentView, setCurrentView] = useState('HOME');

  useEffect(() => {
    if (sessionUser && currentView === 'HOME') {
      const isAdminOrSuper = sessionUser.role === 'ADMIN' || sessionUser.role === 'SUPER_ADMIN';
      if (!isAdminOrSuper && sessionUser.divisions?.length === 1) {
        setCurrentView(sessionUser.divisions[0]);
      }
    }
  }, [sessionUser, currentView]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-xs text-slate-400">Memuat Sistem & Menghubungkan Firebase...</p>
        </div>
      </div>
    );
  }

  if (authError && !systemInitialized && !isOfflineMode) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Koneksi Terganggu</h2>
            <p className="text-xs text-slate-500 mt-1">
              Gagal terhubung ke server autentikasi. Anda dapat melanjutkan dalam mode offline.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <Button onClick={retryAuth} className="w-full py-3 text-xs font-bold shadow-md">
              <RefreshCw size={16} /> Coba Hubungkan Kembali
            </Button>
            <Button onClick={enableOfflineMode} variant="secondary" className="w-full py-3 text-xs font-bold">
              Lanjutkan Mode Standalone / Offline
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!systemInitialized) {
    return <SystemInitScreen />;
  }

  if (!sessionUser) {
    return <LoginScreen />;
  }

  switch (currentView) {
    case 'ADMIN':
      if (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') {
        setCurrentView('HOME');
        return null;
      }
      return <AdminPanel onNavigateHome={() => setCurrentView('HOME')} />;

    case 'TANDON':
      if (!sessionUser.divisions?.includes('TANDON') && sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') return null;
      return (
        <TandonOperator 
          onNavigateHome={() => setCurrentView('HOME')} 
          showBackButton={sessionUser.role === 'ADMIN' || sessionUser.role === 'SUPER_ADMIN' || sessionUser.divisions?.length > 1} 
        />
      );

    case 'GALLON':
      if (!sessionUser.divisions?.includes('GALLON') && sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') return null;
      return <PlaceholderModule title="Air Gallon" icon={Package} onNavigateHome={() => setCurrentView('HOME')} />;

    case 'INDUSTRIAL_GAS':
      if (!sessionUser.divisions?.includes('INDUSTRIAL_GAS') && sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') return null;
      return <PlaceholderModule title="Gas Industri" icon={Flame} onNavigateHome={() => setCurrentView('HOME')} />;

    case 'MOBIL_TANGKI':
      if (!sessionUser.divisions?.includes('MOBIL_TANGKI') && sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') return null;
      return <PlaceholderModule title="Mobil Tangki" icon={Truck} onNavigateHome={() => setCurrentView('HOME')} />;

    case 'HOME':
    default:
      return (
        <DivisionSelector 
          user={sessionUser} 
          onSelect={(div) => setCurrentView(div)} 
          onAdminNavigate={() => setCurrentView('ADMIN')}
        />
      );
  }
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
