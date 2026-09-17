import React, { useState, useEffect, createContext, useContext, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  User, Users, Settings, FileText, Plus, X, LogOut, Droplet, Package, 
  Flame, Search, ChevronRight, ChevronLeft, AlertCircle, CheckCircle2, Key, ShieldCheck, 
  UserPlus, RefreshCw, Lock, ArrowLeft, History, Truck, Calendar, BarChart2,
  Share2, Check, Filter, TrendingUp, Anchor, Trash2, UserCheck, Shield, BookOpen
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-tandon-app';

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

const getMakassarMonthString = (dateStr = getMakassarDateString()) => {
  if (!dateStr || typeof dateStr !== 'string') return getMakassarDateString().substring(0, 7);
  return dateStr.substring(0, 7);
};

const formatIndonesianMonth = (monthStr) => {
  if (!monthStr || typeof monthStr !== 'string') return '';
  const parts = monthStr.split('-');
  if (parts.length < 2) return monthStr;
  const year = parts[0];
  const month = parseInt(parts[1], 10);
  const monthsIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${monthsIndo[month - 1] || monthStr} ${year}`;
};

const getAdjacentMonth = (monthStr = getMakassarMonthString(), offset = 0) => {
  try {
    const parts = monthStr.split('-').map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1 + offset, 1));
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  } catch (err) {
    return getMakassarMonthString();
  }
};

const getWeekRange = (dateStr = getMakassarDateString()) => {
  try {
    const parts = dateStr.split('-').map(Number);
    const curr = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    const day = curr.getUTCDay();
    const diffToMon = curr.getUTCDate() - day + (day === 0 ? -6 : 1);
    
    const monday = new Date(Date.UTC(curr.getUTCFullYear(), curr.getUTCMonth(), diffToMon));
    const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6));
    
    return {
      startStr: monday.toISOString().split('T')[0],
      endStr: sunday.toISOString().split('T')[0]
    };
  } catch (err) {
    return { startStr: dateStr, endStr: dateStr };
  }
};

const getLocalData = (key, fallback) => {
  try {
    const item = localStorage.getItem(`kalimas_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
};

const setLocalData = (key, value) => {
  try {
    localStorage.setItem(`kalimas_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error("Local storage error:", e);
  }
};

const GalanganKalimasLogo = ({ size = 'md', variant = 'color', className = '' }) => {
  const sizes = {
    sm: { height: 'h-8', textKalimas: 'text-sm', textSub: 'text-[8px]' },
    md: { height: 'h-11', textKalimas: 'text-lg', textSub: 'text-[10px]' },
    lg: { height: 'h-16', textKalimas: 'text-2xl', textSub: 'text-xs' },
    xl: { height: 'h-20', textKalimas: 'text-3xl', textSub: 'text-sm' }
  };

  const currentSize = sizes[size] || sizes.md;
  const isLight = variant === 'light';

  const shipColorTop = isLight ? '#f97316' : '#d97706';
  const shipColorMid = isLight ? '#fb923c' : '#ea580c';
  const hullColor = isLight ? '#ffffff' : '#1e293b';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <svg 
        className={`${currentSize.height} w-auto drop-shadow-xs transition-all`} 
        viewBox="0 0 320 180" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M130 25 C145 20, 155 35, 175 42 L80 105 C60 85, 90 40, 130 25 Z" fill={shipColorTop} />
        <path d="M100 55 C120 40, 170 30, 290 28 L60 120 C75 90, 85 70, 100 55 Z" fill={shipColorMid} />
        <path d="M40 130 L285 25 C295 40, 275 80, 250 95 C220 110, 160 115, 120 118 C80 121, 55 126, 40 130 Z" fill={hullColor} />
      </svg>

      <div className="flex flex-col leading-none">
        <span className={`font-black tracking-wider uppercase font-sans ${currentSize.textKalimas} ${isLight ? 'text-white' : 'text-slate-900'}`}>
          KALIMAS
        </span>
        <span className={`font-bold tracking-[0.22em] uppercase mt-0.5 ${currentSize.textSub} ${isLight ? 'text-orange-300' : 'text-amber-600'}`}>
          SHIPYARD
        </span>
      </div>
    </div>
  );
};

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-500/20",
    secondary: "bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800",
    outline: "border-2 border-slate-200 hover:border-slate-300 active:bg-slate-100 text-slate-700",
    danger: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-md shadow-red-500/20",
    ghost: "hover:bg-slate-100 text-slate-600"
  };
  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '', style = {}, ...props }) => {
  const hasCustomBg = className.includes('bg-');
  const bgClass = hasCustomBg ? '' : 'bg-white';

  return (
    <div 
      className={`rounded-2xl border border-slate-200/80 shadow-xs ${bgClass} ${className}`} 
      style={style} 
      {...props}
    >
      {children}
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-2 border-b">
          <h3 className="font-bold text-base text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [sessionUser, setSessionUser] = useState(() => getLocalData('session_user', null));
  const [allUsers, setAllUsers] = useState(() => getLocalData('all_users', []));
  const [systemInitialized, setSystemInitialized] = useState(() => getLocalData('sys_init', false));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    let unsubUsers = null;

    const authUnsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthError(null);
        unsubUsers = onSnapshot(getPublicPath('users'), (snap) => {
          const usersList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setAllUsers(usersList);
          setLocalData('all_users', usersList);
          
          if (usersList.length > 0) {
            setSystemInitialized(true);
            setLocalData('sys_init', true);
          } else {
            setSystemInitialized(false);
            setLocalData('sys_init', false);
          }
          setLoading(false);
        }, (err) => {
          console.warn("Firestore snapshot offline:", err);
          setLoading(false);
        });
      } else {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (err) {
          console.warn("Firebase auth error, switching to local mode:", err);
          setAuthError(err.message || 'Network request failed');
          setIsOfflineMode(true);
          setLoading(false);
        }
      }
    });

    return () => {
      authUnsub();
      if (unsubUsers) unsubUsers();
    };
  }, []);

  const login = (username, password) => {
    const cleanUsername = username.trim().toLowerCase();
    const user = allUsers.find(u => 
      u.username?.toLowerCase() === cleanUsername && 
      u.password === password && 
      u.isActive !== false
    );

    if (user) {
      setSessionUser(user);
      setLocalData('session_user', user);
      return { success: true, user };
    }
    return { success: false, message: 'Username atau password salah / akun non-aktif.' };
  };

  const logout = () => {
    setSessionUser(null);
    setLocalData('session_user', null);
  };

  const retryAuth = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInAnonymously(auth);
    } catch (e) {
      setAuthError(e.message);
      setIsOfflineMode(true);
      setLoading(false);
    }
  };

  const enableOfflineMode = () => {
    setIsOfflineMode(true);
    setAuthError(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ 
      sessionUser, 
      setSessionUser, 
      allUsers, 
      setAllUsers, 
      systemInitialized, 
      setSystemInitialized, 
      loading, 
      authError,
      isOfflineMode,
      retryAuth,
      enableOfflineMode,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const SystemInitScreen = () => {
  const { setAllUsers, setSystemInitialized, setSessionUser } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleInit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password) {
      setError('Lengkapi semua data.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const superAdminUser = {
      id: 'usr_super_' + Date.now(),
      name: name.trim(),
      username: cleanUsername,
      password: password,
      role: 'SUPER_ADMIN',
      divisions: ['TANDON', 'GALLON', 'MOBIL_TANGKI', 'AIR_KAPAL', 'INDUSTRIAL_GAS'],
      isActive: true,
      createdAt: Date.now()
    };

    try {
      await setDoc(getDocPath('users', superAdminUser.id), superAdminUser);
    } catch (err) {
      console.warn("Firestore offline, saved locally:", err);
    }

    const initialList = [superAdminUser];
    setAllUsers(initialList);
    setLocalData('all_users', initialList);

    setSystemInitialized(true);
    setLocalData('sys_init', true);

    setSessionUser(superAdminUser);
    setLocalData('session_user', superAdminUser);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5">
        <div className="text-center">
          <GalanganKalimasLogo size="lg" variant="color" className="justify-center mb-4" />
          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Inisialisasi Pertama
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">Buat Akun Super Administrator</h2>
          <p className="text-xs text-slate-500 mt-1">
            Akun pertama ini akan menjadi Super User utama untuk mengelola seluruh sistem platform.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-100">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleInit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Nama Super Admin</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Manager Operasional"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Username Login</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none lowercase focus:bg-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <Button type="submit" className="w-full py-3.5 font-bold shadow-lg mt-2">
            Inisialisasi & Masuk Platform
          </Button>
        </form>
      </div>
    </div>
  );
};

const LoginScreen = () => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    const res = login(username, password);
    if (!res.success) {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <GalanganKalimasLogo size="lg" variant="color" className="justify-center mb-4" />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">MASUK PLATFORM OPERASIONAL</h2>
          <p className="text-xs text-slate-500 mt-1">Silakan masukkan username & password akun Anda.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-100">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none lowercase focus:bg-white focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <Button type="submit" className="w-full py-4 text-sm font-bold shadow-lg">
            Masuk Akun
          </Button>
        </form>
      </div>
    </div>
  );
};

const WeeklyTrendChart = ({ validTxs, selectedDate }) => {
  const { startStr, endStr } = getWeekRange(selectedDate);

  const daysData = useMemo(() => {
    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const list = [];
    const parts = startStr.split('-').map(Number);
    const startObj = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));

    for (let i = 0; i < 7; i++) {
      const dObj = new Date(Date.UTC(startObj.getUTCFullYear(), startObj.getUTCMonth(), startObj.getUTCDate() + i));
      const dateStr = dObj.toISOString().split('T')[0];
      
      const dayTxs = validTxs.filter(t => (t.dateString || getMakassarDateString(t.timestamp)) === dateStr);
      const count = dayTxs.reduce((sum, t) => sum + (Number(t.quantity) || 1), 0);

      list.push({
        label: dayNames[i],
        dateStr,
        count
      });
    }
    return list;
  }, [validTxs, startStr]);

  const maxCount = useMemo(() => {
    const m = Math.max(...daysData.map(d => d.count), 1);
    return Math.ceil(m * 1.15);
  }, [daysData]);

  const peakDay = useMemo(() => {
    return [...daysData].sort((a,b) => b.count - a.count)[0];
  }, [daysData]);

  return (
    <Card className="p-3.5 bg-white shadow-sm mb-4">
      <div className="flex justify-between items-center mb-3 pb-2 border-b">
        <div>
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={16} className="text-purple-600" />
            Grafik Penjualan Mingguan
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">{startStr} s/d {endStr}</p>
        </div>
        {peakDay && peakDay.count > 0 && (
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
            Puncak: {peakDay.label} ({peakDay.count} tandon)
          </span>
        )}
      </div>

      <div className="h-28 flex items-end justify-between gap-1.5 px-2 pt-2">
        {daysData.map((d) => {
          const heightPercent = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
          const isSelected = d.dateStr === selectedDate;

          return (
            <div key={d.dateStr} className="flex-1 flex flex-col items-center h-full justify-end group">
              <span className={`text-[9px] font-black mb-1 transition-colors ${
                d.count > 0 ? 'text-purple-700' : 'text-slate-300'
              }`}>
                {d.count > 0 ? d.count : ''}
              </span>

              <div className="w-full max-w-[24px] bg-slate-100 rounded-t-lg relative overflow-hidden flex items-end h-full">
                <div 
                  style={{ height: `${Math.max(heightPercent, d.count > 0 ? 15 : 4)}%` }}
                  className={`w-full transition-all duration-300 rounded-t-lg ${
                    isSelected 
                      ? 'bg-purple-600 shadow-md' 
                      : d.count > 0 
                        ? 'bg-purple-400 group-hover:bg-purple-500' 
                        : 'bg-slate-200'
                  }`}
                />
              </div>

              <span className={`text-[10px] font-bold mt-1.5 ${
                isSelected ? 'text-purple-700 font-extrabold underline' : 'text-slate-500'
              }`}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const MonthlyTrendChart = ({ validTxs, selectedMonth }) => {
  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  const dailyData = useMemo(() => {
    const list = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayPad = String(day).padStart(2, '0');
      const dateStr = `${selectedMonth}-${dayPad}`;
      
      const dayTxs = validTxs.filter(t => (t.dateString || getMakassarDateString(t.timestamp)) === dateStr);
      const count = dayTxs.reduce((sum, t) => sum + (Number(t.quantity) || 1), 0);

      list.push({
        day,
        dateStr,
        count
      });
    }
    return list;
  }, [validTxs, selectedMonth, daysInMonth]);

  const maxCount = useMemo(() => {
    const m = Math.max(...dailyData.map(d => d.count), 1);
    return Math.ceil(m * 1.15);
  }, [dailyData]);

  const totalMonthCount = useMemo(() => dailyData.reduce((s, d) => s + d.count, 0), [dailyData]);

  return (
    <Card className="p-3.5 bg-white shadow-sm mb-4">
      <div className="flex justify-between items-center mb-3 pb-2 border-b">
        <div>
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <BarChart2 size={16} className="text-purple-600" />
            Grafik Penjualan Bulanan ({formatIndonesianMonth(selectedMonth)})
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Tren harian penjualan tandon sepanjang bulan</p>
        </div>
        <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
          {totalMonthCount} Tandon
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[420px] h-36 relative pt-3">
          <div className="flex h-24 items-end gap-1 px-1">
            {dailyData.map((d) => {
              const heightPercent = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
              const isWeekEnd = d.day === 7 || d.day === 14 || d.day === 21 || d.day === 28;

              return (
                <div 
                  key={d.day} 
                  className={`flex-1 flex flex-col items-center h-full justify-end relative ${
                    isWeekEnd ? 'border-r border-dashed border-purple-200 pr-0.5' : ''
                  }`}
                >
                  <span className={`text-[8px] font-black mb-0.5 ${d.count > 0 ? 'text-purple-700' : 'text-slate-300'}`}>
                    {d.count > 0 ? d.count : ''}
                  </span>

                  <div className="w-full max-w-[10px] bg-slate-100 rounded-t-xs relative overflow-hidden flex items-end h-full">
                    <div 
                      style={{ height: `${Math.max(heightPercent, d.count > 0 ? 12 : 2)}%` }}
                      className={`w-full transition-all duration-300 rounded-t-xs ${
                        d.count > 0 ? 'bg-purple-600' : 'bg-slate-200'
                      }`}
                    />
                  </div>

                  <span className="text-[8.5px] text-slate-500 font-mono mt-1">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex text-[8.5px] font-bold text-slate-400 pt-1 border-t border-slate-100">
            <div className="w-[22.5%] text-center">Minggu 1</div>
            <div className="w-[22.5%] text-center">Minggu 2</div>
            <div className="w-[22.5%] text-center">Minggu 3</div>
            <div className="w-[22.5%] text-center">Minggu 4</div>
            <div className="flex-1 text-center">M5</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const DriverTrendChart = ({ validTxList, selectedMonth, onMonthChange }) => {
  const todayStr = getMakassarDateString();
  const currentMonthStr = getMakassarMonthString();
  const activeMonthStr = selectedMonth || currentMonthStr;
  const [yearNum, monthNum] = activeMonthStr.split('-').map(Number);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  const dailyData = useMemo(() => {
    const list = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayPad = String(day).padStart(2, '0');
      const dateStr = `${activeMonthStr}-${dayPad}`;
      
      const dayTxs = validTxList.filter(t => (t.dateString || getMakassarDateString(t.timestamp)) === dateStr);
      const count = dayTxs.reduce((sum, t) => sum + (Number(t.quantity) || 1), 0);

      list.push({
        day,
        dateStr,
        count,
        isToday: dateStr === todayStr
      });
    }
    return list;
  }, [validTxList, activeMonthStr, todayStr, daysInMonth]);

  const maxCount = useMemo(() => {
    const m = Math.max(...dailyData.map(d => d.count), 1);
    return Math.ceil(m * 1.15);
  }, [dailyData]);

  const totalMonthCount = useMemo(() => dailyData.reduce((s, d) => s + d.count, 0), [dailyData]);

  return (
    <Card className="p-3.5 bg-white border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-2 border-b">
        <div>
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={16} className="text-blue-600" />
            Grafik Pembelian ({formatIndonesianMonth(activeMonthStr)})
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Tren harian pembelian tandon Anda</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onMonthChange && onMonthChange(getAdjacentMonth(activeMonthStr, -1))}
              className="p-1 hover:bg-white rounded-lg text-slate-600 transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft size={14} />
            </button>
            <input
              type="month"
              value={activeMonthStr}
              onChange={(e) => onMonthChange && onMonthChange(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-slate-800 outline-none cursor-pointer"
            />
            <button
              onClick={() => onMonthChange && onMonthChange(getAdjacentMonth(activeMonthStr, 1))}
              className="p-1 hover:bg-white rounded-lg text-slate-600 transition-colors"
              title="Bulan Berikutnya"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg shrink-0">
            {totalMonthCount} Tandon
          </span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[420px] h-36 relative pt-3">
          <div className="flex h-24 items-end gap-1 px-1">
            {dailyData.map((d) => {
              const heightPercent = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
              const isWeekEnd = d.day === 7 || d.day === 14 || d.day === 21 || d.day === 28;

              return (
                <div 
                  key={d.day} 
                  className={`flex-1 flex flex-col items-center h-full justify-end relative ${
                    isWeekEnd ? 'border-r border-dashed border-blue-200 pr-0.5' : ''
                  }`}
                >
                  <span className={`text-[8px] font-black mb-0.5 ${d.count > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                    {d.count > 0 ? d.count : ''}
                  </span>

                  <div className="w-full max-w-[10px] bg-slate-100 rounded-t-xs relative overflow-hidden flex items-end h-full">
                    <div 
                      style={{ height: `${Math.max(heightPercent, d.count > 0 ? 12 : 2)}%` }}
                      className={`w-full transition-all duration-300 rounded-t-xs ${
                        d.count > 0 ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    />
                  </div>

                  <span className={`text-[8.5px] font-mono mt-1 ${
                    d.isToday ? 'font-black text-blue-600 underline' : 'text-slate-500'
                  }`}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex text-[8.5px] font-bold text-slate-400 pt-1 border-t border-slate-100">
            <div className="w-[22.5%] text-center">Minggu 1</div>
            <div className="w-[22.5%] text-center">Minggu 2</div>
            <div className="w-[22.5%] text-center">Minggu 3</div>
            <div className="w-[22.5%] text-center">Minggu 4</div>
            <div className="flex-1 text-center">M5</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const DriverPortal = ({ user, onLogout }) => {
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({ price: 20000 });
  const [timeFilter, setTimeFilter] = useState('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => getMakassarMonthString());

  const todayStr = getMakassarDateString();
  const currentMonthStr = getMakassarMonthString();

  useEffect(() => {
    const unsubTx = onSnapshot(getPublicPath('transactions'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(list);
      setLocalData('transactions', list);
    }, () => setTransactions(getLocalData('transactions', [])));

    const unsubSettings = onSnapshot(getDocPath('settings', 'tandon_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings(data);
        setLocalData('settings_tandon', data);
      }
    }, () => setSettings(getLocalData('settings_tandon', { price: 20000 })));

    return () => { unsubTx(); unsubSettings(); };
  }, []);

  const myTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesId = user.driverId && t.driverId === user.driverId;
      const matchesName = t.driverName?.trim().toUpperCase() === user.name?.trim().toUpperCase();
      return (matchesId || matchesName) && (!t.division || t.division === 'TANDON');
    });
  }, [transactions, user]);

  const validTxList = useMemo(() => {
    return myTransactions.filter(t => t.status !== 'VOIDED');
  }, [myTransactions]);

  const totalLifetimeTandon = useMemo(() => {
    return validTxList.reduce((sum, t) => sum + (Number(t.quantity) || 1), 0);
  }, [validTxList]);

  const totalLifetimeSpent = useMemo(() => {
    return validTxList.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
  }, [validTxList]);

  const todayTandonCount = useMemo(() => {
    return validTxList
      .filter(t => (t.dateString || getMakassarDateString(t.timestamp)) === todayStr)
      .reduce((sum, t) => sum + (Number(t.quantity) || 1), 0);
  }, [validTxList, todayStr]);

  const monthTandonCount = useMemo(() => {
    return validTxList
      .filter(t => (t.dateString || getMakassarDateString(t.timestamp)).startsWith(selectedMonth))
      .reduce((sum, t) => sum + (Number(t.quantity) || 1), 0);
  }, [validTxList, selectedMonth]);

  const monthSpent = useMemo(() => {
    return validTxList
      .filter(t => (t.dateString || getMakassarDateString(t.timestamp)).startsWith(selectedMonth))
      .reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
  }, [validTxList, selectedMonth]);

  const filteredList = useMemo(() => {
    return myTransactions
      .filter(t => {
        const txDateStr = t.dateString || getMakassarDateString(t.timestamp);
        if (timeFilter === 'today') return txDateStr === todayStr;
        if (timeFilter === 'month') return txDateStr.startsWith(selectedMonth);
        return true;
      })
      .filter(t => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const ds = t.dateString || getMakassarDateString(t.timestamp);
        const op = (t.operatorName || '').toLowerCase();
        return ds.includes(q) || op.includes(q);
      })
      .sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [myTransactions, timeFilter, searchQuery, todayStr, selectedMonth]);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-100 flex flex-col pb-20">
      <div className="bg-slate-900 text-white p-4 pt-5 pb-6 rounded-b-3xl shadow-xl sticky top-0 z-20">
        <div className="flex justify-between items-center mb-3">
          <GalanganKalimasLogo size="sm" variant="light" />
          <button 
            onClick={onLogout}
            className="text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 border border-slate-700/60"
          >
            <LogOut size={14} /> Keluar
          </button>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl shadow-inner mt-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center shrink-0 font-black text-xl">
              <Truck size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">PORTAL SOPIR TANDON</span>
              <h1 className="text-lg font-black text-white uppercase truncate">{user.name}</h1>
              <p className="text-[11px] text-blue-400 font-mono">@{user.username}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-2.5">
          <Card className="p-3.5 shadow-sm" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Beli Hari Ini</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-emerald-400">{todayTandonCount}</span>
              <span className="text-xs text-slate-300 font-semibold">Tandon</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Rp {(todayTandonCount * (settings?.price || 20000)).toLocaleString('id-ID')}</p>
          </Card>

          <Card className="p-3.5 shadow-sm" style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-blue-100 font-bold uppercase tracking-wider block">Beli Bulan Ini</span>
              {selectedMonth !== currentMonthStr && (
                <button 
                  onClick={() => setSelectedMonth(currentMonthStr)}
                  className="text-[9px] font-bold bg-blue-700/80 hover:bg-blue-800 text-white px-1.5 py-0.5 rounded transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-white">{monthTandonCount}</span>
              <span className="text-xs text-blue-100 font-semibold">Tandon</span>
            </div>
            <p className="text-[10px] text-blue-200 mt-1 truncate">
              Rp {monthSpent.toLocaleString('id-ID')} ({formatIndonesianMonth(selectedMonth)})
            </p>
          </Card>
        </div>

        <Card className="p-3.5 bg-white border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Akumulasi Pembelian</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              Rp {totalLifetimeSpent.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-blue-600">{totalLifetimeTandon}</span>
            <span className="text-xs text-slate-500 font-bold ml-1">Tandon</span>
          </div>
        </Card>

        <DriverTrendChart 
          validTxList={validTxList} 
          selectedMonth={selectedMonth}
          onMonthChange={(newMonth) => setSelectedMonth(newMonth)}
        />

        <Card className="p-4 shadow-sm">
          <div className="flex flex-col gap-3 mb-3 pb-3 border-b">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <History size={16} className="text-blue-600" />
                Riwayat Pembelian
              </h3>
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                {filteredList.length} Transaksi
              </span>
            </div>

            <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
              <button
                onClick={() => setTimeFilter('today')}
                className={`py-1.5 rounded-lg transition-all ${
                  timeFilter === 'today' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`py-1.5 rounded-lg transition-all ${
                  timeFilter === 'month' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Bulan Ini
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`py-1.5 rounded-lg transition-all ${
                  timeFilter === 'all' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Cari tanggal atau nama operator..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredList.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <BookOpen size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-600">Belum Ada Transaksi Pembelian</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tidak ditemukan riwayat pembelian Tandon untuk kriteria filter ini.
                </p>
              </div>
            ) : (
              filteredList.map(tx => {
                const isVoid = tx.status === 'VOIDED';
                const ds = tx.dateString || getMakassarDateString(tx.timestamp);
                const ts = getMakassarTimeString(tx.timestamp);

                return (
                  <div 
                    key={tx.id} 
                    className={`p-3 rounded-xl border transition-all ${
                      isVoid ? 'bg-red-50/50 border-red-100 opacity-60' : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900">{ds}</span>
                          <span className="text-[10px] text-slate-400 font-mono">• {ts} WITA</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Operator: <strong className="text-slate-700">{tx.operatorName || '-'}</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-black ${isVoid ? 'line-through text-slate-400' : 'text-blue-600'}`}>
                          +{tx.quantity || 1} Tandon
                        </span>
                        <p className={`text-[11px] font-bold mt-0.5 ${isVoid ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          Rp {(tx.totalAmount || 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex justify-between items-center text-[9.5px]">
                      <span className="text-slate-400 font-mono">ID: {tx.id.substring(0, 10)}...</span>
                      {isVoid ? (
                        <span className="bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                          DIBATALKAN ({tx.voidedBy || 'Admin'})
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                          SELESAI
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const ReportsModule = ({ onNavigateHome }) => {
  const { sessionUser } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [settings, setSettings] = useState({ price: 20000 });

  const [reportType, setReportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(() => getMakassarDateString());
  const [selectedMonth, setSelectedMonth] = useState(() => getMakassarMonthString());
  const [showAllDrivers, setShowAllDrivers] = useState(true);
  const [reportSearch, setReportSearch] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubTx = onSnapshot(getPublicPath('transactions'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(list);
      setLocalData('transactions', list);
    }, () => setTransactions(getLocalData('transactions', [])));

    const unsubDrivers = onSnapshot(getPublicPath('drivers'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDrivers(list);
      setLocalData('drivers', list);
    }, () => setDrivers(getLocalData('drivers', [])));

    const unsubSettings = onSnapshot(getDocPath('settings', 'tandon_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings(data);
        setLocalData('settings_tandon', data);
      }
    }, () => setSettings(getLocalData('settings_tandon', { price: 20000 })));

    return () => { unsubTx(); unsubDrivers(); unsubSettings(); };
  }, []);

  const todayStr = getMakassarDateString();
  const currentMonthStr = getMakassarMonthString();
  const tandonTxs = transactions.filter(t => !t.division || t.division === 'TANDON');

  let filteredTxs = [];
  let reportTitle = "";
  let reportSubtitle = "";

  if (reportType === 'daily') {
    filteredTxs = tandonTxs.filter(t => {
      const txDateStr = t.dateString || (t.timestamp ? getMakassarDateString(t.timestamp) : '');
      return txDateStr === selectedDate;
    });
    reportTitle = `Laporan Harian (${selectedDate})`;
    reportSubtitle = `Data harian otomatis direset jam 00:00 WITA.`;
  } else if (reportType === 'weekly') {
    const { startStr, endStr } = getWeekRange(selectedDate);
    filteredTxs = tandonTxs.filter(t => {
      const txDateStr = t.dateString || (t.timestamp ? getMakassarDateString(t.timestamp) : '');
      return txDateStr >= startStr && txDateStr <= endStr;
    });
    reportTitle = `Laporan Mingguan (${startStr} s/d ${endStr})`;
    reportSubtitle = `Ringkasan performa 7 hari operasional.`;
  } else if (reportType === 'monthly') {
    filteredTxs = tandonTxs.filter(t => {
      const txDateStr = t.dateString || (t.timestamp ? getMakassarDateString(t.timestamp) : '');
      return txDateStr.startsWith(selectedMonth);
    });
    reportTitle = `Laporan Bulanan (${formatIndonesianMonth(selectedMonth)})`;
    reportSubtitle = `Rekapitulasi penuh bulanan operasional.`;
  }

  const validTxs = filteredTxs.filter(t => t.status !== 'VOIDED');
  const voidedTxs = filteredTxs.filter(t => t.status === 'VOIDED');

  const driverStats = {};
  if (showAllDrivers) {
    drivers.forEach(d => {
      driverStats[d.id] = { id: d.id, name: d.name, count: 0, revenue: 0 };
    });
  }

  validTxs.forEach(tx => {
    if (!driverStats[tx.driverId]) {
      driverStats[tx.driverId] = { id: tx.driverId, name: tx.driverName, count: 0, revenue: 0 };
    }
    driverStats[tx.driverId].count += (Number(tx.quantity) || 1);
    driverStats[tx.driverId].revenue += (Number(tx.totalAmount) || 0);
  });

  const totalCount = validTxs.reduce((sum, tx) => sum + (Number(tx.quantity) || 1), 0);
  const totalRevenue = validTxs.reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
  const activeDriversCount = Object.values(driverStats).filter(d => d.count > 0).length;

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

  const sortedStats = Object.values(driverStats).sort((a,b) => b.count - a.count || a.name.localeCompare(b.name));
  const filteredDriverStats = sortedStats.filter(s => s.name.toLowerCase().includes(reportSearch.toLowerCase()));

  const handleCopyWA = () => {
    let text = `*LAPORAN OPERASIONAL ${reportType.toUpperCase()} (TANDON)*\n`;
    text += `📅 Periode: ${reportType === 'daily' ? selectedDate : reportType === 'weekly' ? getWeekRange(selectedDate).startStr + ' s/d ' + getWeekRange(selectedDate).endStr : formatIndonesianMonth(selectedMonth)}\n`;
    text += `📦 Total Tandon: ${totalCount} Tandon\n`;
    text += `💰 Total Omset: Rp ${totalRevenue.toLocaleString('id-ID')}\n`;
    text += `🚚 Sopir Aktif: ${activeDriversCount} Sopir\n`;
    if (reportType !== 'daily') {
      text += `📊 Rata-rata/Hari: ${avgTandonPerDay} Tandon/Hari\n`;
    }
    text += `\n*RINCIAN PER SOPIR:*\n`;

    const activeOnly = sortedStats.filter(s => s.count > 0);

    if (activeOnly.length === 0) {
      text += `- Belum ada transaksi\n`;
    } else {
      activeOnly.forEach((s, i) => {
        text += `${i + 1}. ${s.name}: ${s.count} tandon (Rp ${s.revenue.toLocaleString('id-ID')})\n`;
      });
    }

    text += `\n_Diunduh dari Laporan Operasional (${sessionUser?.name || 'Management'})_`;

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div className="max-w-md sm:max-w-2xl mx-auto px-3 sm:px-4 py-4 pb-24">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={onNavigateHome} className="p-2.5 rounded-xl border-slate-200 shadow-xs">
            <ArrowLeft size={18}/>
          </Button>
          <div>
            <GalanganKalimasLogo size="sm" variant="color" className="mb-0.5" />
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">Laporan Operasional</h1>
              <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">Management Only</span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Rekapitulasi Harian, Mingguan, & Bulanan Penjualan Tandon</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 bg-slate-200 p-1 rounded-xl mb-4 gap-1 text-[11px] sm:text-xs font-bold shadow-xs">
        <button
          onClick={() => setReportType('daily')}
          className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            reportType === 'daily' ? 'bg-white text-purple-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar size={14} /> Harian
        </button>
        <button
          onClick={() => setReportType('weekly')}
          className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            reportType === 'weekly' ? 'bg-purple-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp size={14} /> Mingguan
        </button>
        <button
          onClick={() => setReportType('monthly')}
          className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            reportType === 'monthly' ? 'bg-purple-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart2 size={14} /> Bulanan
        </button>
      </div>

      <Card className="p-3.5 bg-white flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-sm mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-purple-600 shrink-0" />
          <div className="flex-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {reportType === 'daily' ? 'PILIH TANGGAL' : reportType === 'weekly' ? 'PILIH MINGGU (ACUAN TANGGAL)' : 'PILIH BULAN'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              {reportType !== 'monthly' ? (
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setSelectedMonth(getAdjacentMonth(selectedMonth, -1))}
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                      title="Bulan Sebelumnya"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <input 
                      type="month" 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedMonth(getAdjacentMonth(selectedMonth, 1))}
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                      title="Bulan Berikutnya"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  {selectedMonth !== currentMonthStr && (
                    <button 
                      type="button"
                      onClick={() => setSelectedMonth(currentMonthStr)} 
                      className="text-[11px] font-bold text-purple-600 hover:underline shrink-0"
                    >
                      Bulan Ini
                    </button>
                  )}
                  <span className="text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 hidden sm:inline">
                    {formatIndonesianMonth(selectedMonth)}
                  </span>
                </div>
              )}
              {reportType === 'daily' && selectedDate !== todayStr && (
                <button 
                  onClick={() => setSelectedDate(todayStr)} 
                  className="text-[11px] font-bold text-purple-600 hover:underline shrink-0"
                >
                  Hari Ini
                </button>
              )}
            </div>
          </div>
        </div>

        <Button 
          onClick={handleCopyWA} 
          variant={copied ? "secondary" : "outline"} 
          className="py-2.5 px-3 text-xs shrink-0 w-full sm:w-auto font-bold border-purple-200 text-purple-700"
        >
          {copied ? <Check size={15} className="text-emerald-600" /> : <Share2 size={15} />}
          <span>{copied ? "Tersalin ke Clipboard!" : "Salin Laporan WA"}</span>
        </Button>
      </Card>

      <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-purple-900 font-medium mb-4">
        <span className="flex items-center gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0"></span>
          {reportTitle}
        </span>
        <span className="text-[10px] font-mono text-purple-600">{reportSubtitle}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
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
            {reportType === 'daily' ? 'Batal / Void' : 'Rata-rata/Hari'}
          </p>
          <p className="text-2xl font-black mt-1 text-emerald-400">
            {reportType === 'daily' ? voidedTxs.length : avgTandonPerDay}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {reportType === 'daily' ? 'Transaksi Batal' : `${activeDaysCount} hari aktif`}
          </p>
        </Card>
      </div>

      {reportType === 'weekly' && (
        <WeeklyTrendChart validTxs={validTxs} selectedDate={selectedDate} />
      )}

      {reportType === 'monthly' && (
        <MonthlyTrendChart validTxs={validTxs} selectedMonth={selectedMonth} />
      )}

      {reportType !== 'daily' && (
        <Card className="p-3.5 sm:p-4 shadow-sm mb-4">
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

      <Card className="shadow-sm mb-4">
        <div className="p-3.5 sm:p-4">
          <div className="flex flex-col gap-2.5 mb-3 pb-3 border-b">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 size={16} className="text-purple-600" />
                Rincian Penjualan per Sopir
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                {filteredDriverStats.length} Sopir
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Cari nama sopir..."
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAllDrivers(!showAllDrivers)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 shrink-0 ${
                  showAllDrivers 
                    ? 'bg-purple-50 border-purple-200 text-purple-700' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <Filter size={12} />
                {showAllDrivers ? "Semua Sopir" : "Sopir Aktif"}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredDriverStats.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <BarChart2 size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">Belum Ada Data Sopir</p>
              </div>
            ) : (
              filteredDriverStats.map((stat) => (
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
                      {stat.count > 0 ? `${stat.count} Tandon Dibeli` : 'Belum ada pembelian'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`font-bold text-xs ${stat.count > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                      Rp {stat.revenue.toLocaleString('id-ID')}
                    </p>
                    {stat.count > 0 && (
                      <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                        {stat.count}x
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      <Card className="shadow-sm">
        <div className="p-3.5 sm:p-4">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 pb-2 border-b flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <History size={16} className="text-purple-600" />
              Riwayat Transaksi Rinci
            </span>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              {filteredTxs.length} Record
            </span>
          </h3>

          <div className="divide-y text-xs">
            {filteredTxs.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">Tidak ada riwayat transaksi pada periode ini.</p>
            ) : (
              filteredTxs.sort((a,b) => b.timestamp - a.timestamp).map(tx => (
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
                      {tx.dateString || getMakassarDateString(tx.timestamp)} • Operator: {tx.operatorName || '-'} • {getMakassarTimeString(tx.timestamp)} WITA
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`font-bold ${tx.status === 'VOIDED' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      Rp {(tx.totalAmount || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

const AdminPanel = ({ onNavigateHome }) => {
  const { allUsers, sessionUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('users');
  const [settings, setSettings] = useState({ price: 20000 });
  const [priceHistory, setPriceHistory] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('OPERATOR');
  const [newUserDivisions, setNewUserDivisions] = useState(['TANDON']);
  const [userError, setUserError] = useState('');

  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const [driverModalTarget, setDriverModalTarget] = useState(null);
  const [driverUsernameInput, setDriverUsernameInput] = useState('');
  const [driverPasswordInput, setDriverPasswordInput] = useState('');
  const [driverAccountError, setDriverAccountError] = useState('');
  const [driverAccountSuccess, setDriverAccountSuccess] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');

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

    const unsubHistory = onSnapshot(getPublicPath('price_history'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPriceHistory(list);
      setLocalData('price_history', list);
    }, () => {
      setPriceHistory(getLocalData('price_history', []));
    });

    const unsubDrivers = onSnapshot(getPublicPath('drivers'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDrivers(list);
      setLocalData('drivers', list);
    }, () => {
      setDrivers(getLocalData('drivers', []));
    });

    return () => { unsubSettings(); unsubHistory(); unsubDrivers(); };
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

    if (!['ADMIN', 'SUPER_ADMIN'].includes(sessionUser.role)) {
      setResetError('Hanya Administrator / Super Administrator yang berhak mereset password.');
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

  const handleSaveDriverAccount = async (e) => {
    e.preventDefault();
    setDriverAccountError('');
    setDriverAccountSuccess('');

    if (!driverUsernameInput.trim() || !driverPasswordInput) {
      setDriverAccountError('Username dan Password wajib diisi.');
      return;
    }

    const cleanUsername = driverUsernameInput.trim().toLowerCase();
    
    const existingDriverUser = allUsers.find(u => 
      u.driverId === driverModalTarget.id || 
      (u.role === 'DRIVER' && u.name?.toUpperCase() === driverModalTarget.name?.toUpperCase())
    );

    const duplicateUser = allUsers.find(u => 
      u.username?.toLowerCase() === cleanUsername && u.id !== existingDriverUser?.id
    );

    if (duplicateUser) {
      setDriverAccountError(`Username "${cleanUsername}" sudah digunakan oleh user lain.`);
      return;
    }

    try {
      const docId = existingDriverUser ? existingDriverUser.id : ('usr_drv_' + Date.now());
      const driverUserData = {
        id: docId,
        name: driverModalTarget.name.toUpperCase(),
        username: cleanUsername,
        password: driverPasswordInput,
        role: 'DRIVER',
        driverId: driverModalTarget.id,
        divisions: ['TANDON'],
        isActive: true,
        updatedAt: Date.now(),
        updatedBy: sessionUser.name
      };

      if (!existingDriverUser) {
        driverUserData.createdAt = Date.now();
        driverUserData.createdBy = sessionUser.name;
      }

      await setDoc(getDocPath('users', docId), driverUserData, { merge: true });

      setDriverAccountSuccess(`Akun login untuk ${driverModalTarget.name} berhasil disimpan!`);
      setTimeout(() => {
        setDriverModalTarget(null);
        setDriverUsernameInput('');
        setDriverPasswordInput('');
        setDriverAccountSuccess('');
      }, 1200);
    } catch (err) {
      console.error("Driver user creation error:", err);
      setDriverAccountError('Gagal menyimpan akun sopir.');
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
    const filteredUsers = allUsers
      .filter(u => u.role !== 'DRIVER')
      .filter(u => 
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
        u.username?.toLowerCase().includes(userSearch.toLowerCase())
      );

    const isSuperAdmin = sessionUser.role === 'SUPER_ADMIN';

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama atau username staff..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            />
          </div>
          <Button onClick={() => setIsAddUserOpen(true)} className="py-3 px-4 text-xs font-bold shrink-0 shadow-sm">
            <UserPlus size={16} /> Tambah Staff / Operator
          </Button>
        </div>

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

              <div className="pt-3 space-y-3">
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Akses Divisi (Ketuk untuk Ubah):</span>
                  <div className="grid grid-cols-2 sm:flex gap-1.5 sm:flex-wrap">
                    {[
                      { id: 'TANDON', label: 'Air Tandon' },
                      { id: 'GALLON', label: 'Air Gallon' },
                      { id: 'MOBIL_TANGKI', label: 'Mobil Tangki' },
                      { id: 'AIR_KAPAL', label: 'Air Kapal' },
                      { id: 'INDUSTRIAL_GAS', label: 'Gas Industri' }
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
                    <option value="SUPERVISOR">SUPERVISOR</option>
                    <option value="MANAGEMENT">MANAGEMENT</option>
                  </select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderDriverUsersTab = () => {
    const driverUsersMap = {};
    allUsers.filter(u => u.role === 'DRIVER').forEach(u => {
      if (u.driverId) driverUsersMap[u.driverId] = u;
      driverUsersMap[u.name?.toUpperCase()] = u;
    });

    const filteredDriversList = drivers.filter(d => 
      d.name.toLowerCase().includes(driverSearch.toLowerCase())
    ).sort((a,b) => a.name.localeCompare(b.name));

    return (
      <div className="space-y-4">
        <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-blue-950">
            <Truck size={16} className="text-blue-600" />
            Manajemen Akun Login Sopir Tandon
          </p>
          <p className="text-blue-800/80 leading-relaxed">
            Daftar ini terpisah dari manajemen staff. Buat username & password untuk setiap sopir agar mereka dapat login dan melihat riwayat pembelian tandon mereka secara mandiri.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari nama sopir di master database..."
            value={driverSearch}
            onChange={(e) => setDriverSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          />
        </div>

        <div className="space-y-2.5">
          {filteredDriversList.length === 0 ? (
            <Card className="p-6 text-center text-slate-400">
              <Truck size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-bold text-slate-600">Sopir Tidak Ditemukan</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tambahkan sopir terlebih dahulu melalui menu Operator Tandon.
              </p>
            </Card>
          ) : (
            filteredDriversList.map(driver => {
              const driverUser = driverUsersMap[driver.id] || driverUsersMap[driver.name.toUpperCase()];
              const hasAccount = !!driverUser;

              return (
                <Card key={driver.id} className="p-3.5 bg-white shadow-xs border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      hasAccount ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Truck size={20} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900 uppercase">{driver.name}</h3>
                        {hasAccount ? (
                          <span className="text-[9.5px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={10} /> Ada Akun
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            Belum Ada Login
                          </span>
                        )}
                        {hasAccount && !driverUser.isActive && (
                          <span className="text-[9.5px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            NON-AKTIF
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {hasAccount ? `@${driverUser.username}` : 'Sopir Terdaftar di Master'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end pt-2 sm:pt-0 border-t sm:border-0 border-slate-50">
                    {hasAccount && (
                      <button
                        onClick={() => handleToggleUserActive(driverUser)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                          driverUser.isActive 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/60' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200/60'
                        }`}
                      >
                        {driverUser.isActive ? 'Non-aktifkan' : 'Aktifkan'}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setDriverModalTarget(driver);
                        setDriverUsernameInput(driverUser?.username || driver.name.toLowerCase().replace(/\s+/g, ''));
                        setDriverPasswordInput('');
                        setDriverAccountError('');
                        setDriverAccountSuccess('');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all flex items-center gap-1 active:scale-95"
                    >
                      <Key size={13} />
                      {hasAccount ? 'Atur / Reset Password' : 'Buat Akun Login'}
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <Modal
          isOpen={!!driverModalTarget}
          onClose={() => setDriverModalTarget(null)}
          title={`Akun Login Sopir — ${driverModalTarget?.name || ''}`}
        >
          <form onSubmit={handleSaveDriverAccount} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              Buat atau perbarui kredensial login untuk sopir <strong className="uppercase">{driverModalTarget?.name}</strong>. Sopir dapat melihat riwayat tandon pribadinya setelah login.
            </div>

            {driverAccountError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-100">
                <AlertCircle size={16} className="shrink-0" />
                <span>{driverAccountError}</span>
              </div>
            )}

            {driverAccountSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-2 border border-emerald-100">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{driverAccountSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Username Login Sopir</label>
              <input
                type="text"
                value={driverUsernameInput}
                onChange={(e) => setDriverUsernameInput(e.target.value)}
                placeholder="sopir_budi"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none lowercase focus:bg-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                value={driverPasswordInput}
                onChange={(e) => setDriverPasswordInput(e.target.value)}
                placeholder="Masukkan password baru"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <Button type="submit" className="w-full py-3.5 font-bold shadow-md">
              Simpan Akun Login Sopir
            </Button>
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

  return (
    <div className="max-w-md sm:max-w-2xl mx-auto px-3 sm:px-4 py-4 pb-24">
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
            <p className="text-[11px] text-slate-500 hidden sm:block">Kelola User, User Sopir, & Harga Tandon</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 bg-slate-200 p-1 rounded-xl mb-4 sm:mb-6 gap-1 shadow-xs text-xs font-bold">
        {[
          { id: 'users', label: 'User Staff', icon: Users },
          { id: 'driver_users', label: 'User Sopir', icon: Truck },
          { id: 'price', label: 'Harga Tandon', icon: Droplet }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon size={14} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'driver_users' && renderDriverUsersTab()}
      {activeTab === 'price' && renderPriceTab()}

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

      <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="Tambah User Staff Baru">
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
              {sessionUser.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">SUPER ADMINISTRATOR</option>}
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
                { id: 'MOBIL_TANGKI', label: 'Mobil Tangki' },
                { id: 'AIR_KAPAL', label: 'Air Kapal' },
                { id: 'INDUSTRIAL_GAS', label: 'Gas Industri' }
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

          <Button type="submit" className="w-full py-3.5 font-bold shadow-md">Simpan Staff User</Button>
        </form>
      </Modal>
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
  const [driverError, setDriverError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [isDeletingDriver, setIsDeletingDriver] = useState(false);

  const [opTab, setOpTab] = useState('input');
  const [selectedDate, setSelectedDate] = useState(getMakassarDateString());
  const [showAllDriversInReport, setShowAllDriversInReport] = useState(true);
  const [reportSearch, setReportSearch] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  const [recentTxToast, setRecentTxToast] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

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
      .filter(s => s.name.toLowerCase().includes(reportSearch.toLowerCase()))
      .sort((a,b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [reportDriverStats, reportSearch]);

  const reportTotalCount = useMemo(() => {
    return validReportTxs.reduce((sum, tx) => sum + (Number(tx.quantity) || 1), 0);
  }, [validReportTxs]);

  const reportTotalRevenue = useMemo(() => {
    return validReportTxs.reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
  }, [validReportTxs]);

  const activeDriverCount = useMemo(() => {
    return Object.values(reportDriverStats).filter(s => s.count > 0).length;
  }, [reportDriverStats]);

  const canDeleteDriver = sessionUser?.role === 'ADMIN' || sessionUser?.role === 'SUPER_ADMIN';

  const handleDeleteDriver = async () => {
    if (!driverToDelete) return;
    setIsDeletingDriver(true);

    try {
      try {
        await deleteDoc(getDocPath('drivers', driverToDelete.id));
      } catch (err) {
        console.warn("Firestore offline, deleted driver locally:", err);
      }

      const updated = drivers.filter(d => d.id !== driverToDelete.id);
      setDrivers(updated);
      setLocalData('drivers', updated);
      setDriverToDelete(null);
    } catch (err) {
      console.error("Delete driver error:", err);
    } finally {
      setIsDeletingDriver(false);
    }
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    setDriverError('');

    const cleanName = newDriverName.trim().toUpperCase();
    if (!cleanName) {
      setDriverError('Nama sopir tidak boleh kosong.');
      return;
    }
    
    const existing = drivers.some(d => d.name?.trim().toUpperCase() === cleanName);
    if (existing) {
      setDriverError(`Sopir dengan nama "${cleanName}" sudah terdaftar di master data terpusat.`);
      return;
    }

    const driverId = 'drv_' + Date.now();
    const newDriver = {
      id: driverId,
      name: cleanName,
      createdBy: sessionUser.name,
      createdById: sessionUser.id,
      createdAt: Date.now()
    };

    try {
      await setDoc(getDocPath('drivers', driverId), newDriver);
    } catch (err) {
      console.warn("Firestore offline, saved driver locally:", err);
    }

    const updated = [...drivers, newDriver];
    setDrivers(updated);
    setLocalData('drivers', updated);
    
    setNewDriverName('');
    setDriverError('');
    setIsAddingDriver(false);
  };

  const handlePlusOne = async (driver) => {
    if (processingId === driver.id) return;
    setProcessingId(driver.id);
    
    try {
      const currentPrice = settings?.price || 20000;
      const txId = 'tx_' + Date.now();
      const newTx = {
        id: txId,
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
        await setDoc(getDocPath('transactions', txId), newTx);
      } catch (err) {
        console.warn("Firestore offline, saved transaction locally:", err);
      }

      const updated = [...transactions.filter(t => t.id !== txId), newTx];
      setTransactions(updated);
      setLocalData('transactions', updated);

      setRecentTxToast(newTx);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setRecentTxToast(null);
      }, 6000);

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

    if (recentTxToast && recentTxToast.id === txId) {
      setRecentTxToast(prev => prev ? { ...prev, ...voidData } : null);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setRecentTxToast(null);
      }, 2000);
    }
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
      setTimeout(() => setCopiedText(false), 2000);
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
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900 uppercase tracking-tight truncate">{driver.name}</h3>
                      {canDeleteDriver && (
                        <button
                          type="button"
                          onClick={() => setDriverToDelete(driver)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          title="Hapus Sopir dari Master Data"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
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
            <Card className="p-3.5 bg-white space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600 shrink-0" />
                  <span className="font-bold text-xs text-slate-800">Tanggal Laporan Shift:</span>
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
                        {tx.status !== 'VOIDED' && (tx.operatorId === sessionUser.id || sessionUser.role === 'ADMIN' || sessionUser.role === 'SUPER_ADMIN') && (
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

      {opTab === 'input' && recentTxToast && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-30 animate-in slide-in-from-bottom duration-200">
          <div className={`p-3.5 rounded-2xl shadow-xl flex justify-between items-center text-xs font-semibold text-white backdrop-blur-md ${
            recentTxToast.status === 'VOIDED' ? 'bg-slate-900/95 border border-slate-700' : 'bg-emerald-600/95 border border-emerald-500/30'
          }`}>
            <div className="flex items-center gap-2.5">
              {recentTxToast.status === 'VOIDED' ? (
                <X size={18} className="text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 size={18} className="text-emerald-200 shrink-0" />
              )}
              <div>
                <p className="font-bold text-white">
                  {recentTxToast.driverName} ({recentTxToast.status === 'VOIDED' ? 'DIBATALKAN' : '+1 Tandon'})
                </p>
                <p className="text-[10px] text-white/80">{getMakassarTimeString(recentTxToast.timestamp)} WITA</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {recentTxToast.status !== 'VOIDED' && (
                <button 
                  type="button"
                  onClick={() => handleVoid(recentTxToast.id)}
                  className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Batal (+1)
                </button>
              )}

              {recentTxToast.status === 'VOIDED' && (
                <span className="bg-red-500/30 text-red-200 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                  Batal Berhasil
                </span>
              )}

              <button 
                type="button"
                onClick={() => setRecentTxToast(null)}
                className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal 
        isOpen={isAddingDriver} 
        onClose={() => {
          setIsAddingDriver(false);
          setDriverError('');
        }} 
        title="Tambah Sopir Ke Master Data"
      >
        <form onSubmit={handleAddDriver} className="space-y-4">
          <p className="text-xs text-slate-500">
            Sopir yang ditambahkan di sini akan langsung tersimpan di database terpusat dan dapat digunakan oleh operator lain secara real-time.
          </p>

          {driverError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-100">
              <AlertCircle size={16} className="shrink-0" />
              <span>{driverError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Nama Sopir</label>
            <input
              type="text"
              value={newDriverName}
              onChange={(e) => {
                setNewDriverName(e.target.value);
                if (driverError) setDriverError('');
              }}
              placeholder="Contoh: PAK BUDI"
              className="w-full p-3 border border-slate-200 rounded-xl uppercase font-bold text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              required
            />
          </div>
          <Button type="submit" className="w-full py-3">Simpan Sopir Terpusat</Button>
        </form>
      </Modal>

      <Modal 
        isOpen={!!driverToDelete} 
        onClose={() => setDriverToDelete(null)} 
        title="Konfirmasi Hapus Sopir"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-800">
            <AlertCircle size={20} className="shrink-0 text-red-600 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-red-900">Apakah Anda yakin ingin menghapus sopir ini?</p>
              <p className="text-red-700 leading-relaxed">
                Sopir <strong className="uppercase font-black text-red-900">{driverToDelete?.name}</strong> akan dihapus dari master database terpusat. Transaksi terdahulu yang sudah tercatat akan tetap tersimpan di laporan.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              type="button"
              variant="secondary" 
              onClick={() => setDriverToDelete(null)} 
              className="flex-1 py-3 text-xs font-bold"
              disabled={isDeletingDriver}
            >
              Batal
            </Button>
            <Button 
              type="button"
              variant="danger" 
              onClick={handleDeleteDriver} 
              className="flex-1 py-3 text-xs font-bold shadow-sm"
              disabled={isDeletingDriver}
            >
              {isDeletingDriver ? 'Menghapus...' : 'Ya, Hapus Sopir'}
            </Button>
          </div>
        </div>
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
      <ArrowLeft size={16} /> Kembali Ke Menu Utama
    </Button>
  </div>
);

const DivisionSelector = ({ user, onSelect, onAdminNavigate }) => {
  const { logout } = useContext(AuthContext);
  
  const divisions = [
    { id: 'TANDON', name: 'AIR TANDON', icon: Droplet, desc: 'Operasional Air Tandon', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'GALLON', name: 'AIR GALLON', icon: Package, desc: 'Modul Air Gallon (Fase 2)', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { id: 'MOBIL_TANGKI', name: 'MOBIL TANGKI', icon: Truck, desc: 'Modul Mobil Tangki (Water Tanker)', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { id: 'AIR_KAPAL', name: 'AIR KAPAL', icon: Anchor, desc: 'Modul Air Kapal (Vessel Water Supply)', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
    { id: 'INDUSTRIAL_GAS', name: 'GAS INDUSTRI', icon: Flame, desc: 'Modul Gas Industri (Fase 3)', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  ];

  const userDivisions = divisions.filter(d => user.divisions?.includes(d.id));
  const isAdminOrSuper = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const isReportingRole = ['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'MANAGEMENT'].includes(user.role);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white p-6 flex flex-col">
      <div className="flex justify-between items-center mb-8 mt-2">
        <div>
          <GalanganKalimasLogo size="sm" variant="color" className="mb-2" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Operations</span>
          <h1 className="text-2xl font-black text-slate-900">PILIH MODUL</h1>
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

        {isReportingRole && (
          <button
            onClick={() => onSelect('REPORTS')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-purple-200 bg-purple-50 hover:shadow-md transition-all active:scale-98 text-left"
          >
            <div className="p-3.5 bg-white rounded-xl shadow-sm text-purple-600">
              <BarChart2 size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">LAPORAN OPERASIONAL</h3>
                <span className="text-[9px] font-bold bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded">MANAGEMENT</span>
              </div>
              <p className="text-xs text-slate-500">Rekap Harian, Mingguan & Bulanan Multi-Divisi</p>
            </div>
            <ChevronRight className="ml-auto text-purple-600" size={20} />
          </button>
        )}

        {userDivisions.length === 0 && !isReportingRole && (
          <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
            <p className="text-sm font-bold text-slate-700">Tidak ada akses modul</p>
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
  const { sessionUser, systemInitialized, loading, authError, retryAuth, enableOfflineMode, isOfflineMode, logout } = useContext(AuthContext);
  const [currentView, setCurrentView] = useState('HOME');

  useEffect(() => {
    if (!sessionUser) {
      setCurrentView('HOME');
      return;
    }

    if (sessionUser.role === 'DRIVER') {
      setCurrentView('DRIVER_PORTAL');
      return;
    }

    if (currentView === 'DRIVER_PORTAL' && sessionUser.role !== 'DRIVER') {
      setCurrentView('HOME');
      return;
    }

    if (currentView === 'HOME') {
      const isReportingRole = ['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'MANAGEMENT'].includes(sessionUser.role);
      const isAdminOrSuper = sessionUser.role === 'ADMIN' || sessionUser.role === 'SUPER_ADMIN';
      
      if (!isAdminOrSuper && !isReportingRole && sessionUser.divisions?.length === 1) {
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

  if (sessionUser.role === 'DRIVER') {
    return <DriverPortal user={sessionUser} onLogout={logout} />;
  }

  switch (currentView) {
    case 'DRIVER_PORTAL':
      if (sessionUser.role !== 'DRIVER') {
        return (
          <DivisionSelector 
            user={sessionUser} 
            onSelect={(div) => setCurrentView(div)} 
            onAdminNavigate={() => setCurrentView('ADMIN')}
          />
        );
      }
      return <DriverPortal user={sessionUser} onLogout={logout} />;

    case 'ADMIN':
      if (sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') {
        setCurrentView('HOME');
        return null;
      }
      return <AdminPanel onNavigateHome={() => setCurrentView('HOME')} />;

    case 'REPORTS':
      if (!['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'MANAGEMENT'].includes(sessionUser.role)) {
        setCurrentView('HOME');
        return null;
      }
      return <ReportsModule onNavigateHome={() => setCurrentView('HOME')} />;

    case 'TANDON':
      if (!sessionUser.divisions?.includes('TANDON') && sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') return null;
      return (
        <TandonOperator 
          onNavigateHome={() => setCurrentView('HOME')} 
          showBackButton={sessionUser.role === 'ADMIN' || sessionUser.role === 'SUPER_ADMIN' || sessionUser.divisions?.length > 1 || ['SUPERVISOR', 'MANAGEMENT'].includes(sessionUser.role)} 
        />
      );

    case 'GALLON':
      if (!sessionUser.divisions?.includes('GALLON') && sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') return null;
      return <PlaceholderModule title="Air Gallon" icon={Package} onNavigateHome={() => setCurrentView('HOME')} />;

    case 'MOBIL_TANGKI':
      if (!sessionUser.divisions?.includes('MOBIL_TANGKI') && sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') return null;
      return <PlaceholderModule title="Mobil Tangki" icon={Truck} onNavigateHome={() => setCurrentView('HOME')} />;

    case 'AIR_KAPAL':
      if (!sessionUser.divisions?.includes('AIR_KAPAL') && sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') return null;
      return <PlaceholderModule title="Air Kapal" icon={Anchor} onNavigateHome={() => setCurrentView('HOME')} />;

    case 'INDUSTRIAL_GAS':
      if (!sessionUser.divisions?.includes('INDUSTRIAL_GAS') && sessionUser.role !== 'ADMIN' && sessionUser.role !== 'SUPER_ADMIN') return null;
      return <PlaceholderModule title="Gas Industri" icon={Flame} onNavigateHome={() => setCurrentView('HOME')} />;

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
