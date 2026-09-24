import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  User, Users, Settings, Plus, X, LogOut, Droplet, Package, 
  Flame, Search, ChevronRight, ArrowLeft, Truck,
  Share2, CheckCircle2, Anchor, Trash2, Eye,
  Building, PieChart, Store, Edit, Calendar, BarChart2, Key
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-kalimas-app';

const getPublicPath = (collectionName) => collection(db, 'artifacts', appId, 'public', 'data', collectionName);
const getDocPath = (collectionName, docId) => doc(db, 'artifacts', appId, 'public', 'data', collectionName, docId);

const getMakassarDateString = (date = new Date()) => {
  try {
    let d;
    if (!date) d = new Date();
    else if (typeof date.toDate === 'function') d = date.toDate();
    else if (typeof date === 'object' && typeof date.seconds === 'number') d = new Date(date.seconds * 1000);
    else if (typeof date === 'number' || typeof date === 'string') d = new Date(date);
    else if (date instanceof Date) d = date;
    else d = new Date();

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
    const makassarTime = new Date(Date.now() + (8 * 3600 * 1000));
    return makassarTime.toISOString().split('T')[0];
  }
};

const getAdjacentDateString = (dateStr = getMakassarDateString(), offset = 0) => {
  try {
    const parts = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + offset));
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (err) {
    return getMakassarDateString();
  }
};

const getMakassarTimeString = (timestamp = Date.now()) => {
  try {
    let d;
    if (!timestamp) d = new Date();
    else if (typeof timestamp.toDate === 'function') d = timestamp.toDate();
    else if (typeof timestamp === 'object' && typeof timestamp.seconds === 'number') d = new Date(timestamp.seconds * 1000);
    else if (typeof timestamp === 'number' || typeof timestamp === 'string') d = new Date(timestamp);
    else if (timestamp instanceof Date) d = timestamp;
    else d = new Date();

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
  } catch (e) {}
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
      <svg className={`${currentSize.height} w-auto drop-shadow-xs transition-all`} viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M130 25 C145 20, 155 35, 175 42 L80 105 C60 85, 90 40, 130 25 Z" fill={shipColorTop} />
        <path d="M100 55 C120 40, 170 30, 290 28 L60 120 C75 90, 85 70, 100 55 Z" fill={shipColorMid} />
        <path d="M40 130 L285 25 C295 40, 275 80, 250 95 C220 110, 160 115, 120 118 C80 121, 55 126, 40 130 Z" fill={hullColor} />
      </svg>
      <div className="flex flex-col leading-none">
        <span className={`font-black tracking-wider uppercase font-sans ${currentSize.textKalimas} ${isLight ? 'text-white' : 'text-slate-900'}`}>KALIMAS</span>
        <span className={`font-bold tracking-[0.22em] uppercase mt-0.5 ${currentSize.textSub} ${isLight ? 'text-orange-300' : 'text-amber-600'}`}>SHIPYARD</span>
      </div>
    </div>
  );
};

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer select-none shadow-sm";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/20",
    emerald: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-500/20",
    indigo: "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-indigo-500/20",
    cyan: "bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white shadow-cyan-500/20",
    purple: "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-purple-500/20",
    secondary: "bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white shadow-slate-700/20",
    outline: "border-2 border-slate-300 hover:bg-slate-100 active:bg-slate-200 text-slate-700 shadow-none",
    danger: "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-red-500/20",
    ghost: "hover:bg-slate-100 text-slate-600 shadow-none"
  };
  return <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>{children}</button>;
};

const Card = ({ children, className = '', style = {}, ...props }) => {
  const hasCustomBg = className.includes('bg-');
  const bgClass = hasCustomBg ? '' : 'bg-white';
  return <div className={`rounded-2xl border border-slate-200/80 shadow-xs ${bgClass} ${className}`} style={style} {...props}>{children}</div>;
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-2 border-b">
          <h3 className="font-bold text-base text-slate-900">{title || ''}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"><X size={18} /></button>
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

  useEffect(() => {
    let unsubUsers = null;
    const authUnsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          unsubUsers = onSnapshot(getPublicPath('users'), (snap) => {
            const usersList = snap.docs.map(d => ({ ...d.data(), id: d.id }));
            if (usersList.length > 0) {
              setAllUsers(usersList);
              setLocalData('all_users', usersList);
              setSystemInitialized(true);
              setLocalData('sys_init', true);
            }
            setLoading(false);
          }, () => { setLoading(false); });
        } catch (e) { setLoading(false); }
      } else {
        try { await signInAnonymously(auth); } catch (err) { setLoading(false); }
      }
    });
    return () => {
      authUnsub();
      if (unsubUsers) unsubUsers();
    };
  }, []);

  const login = (username, password) => {
    const cleanUsername = username.trim().toLowerCase();
    const usersToCheck = allUsers.length > 0 ? allUsers : getLocalData('all_users', []);
    const user = usersToCheck.find(u => u.username?.toLowerCase() === cleanUsername && u.password === password && u.isActive !== false);
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

  return (
    <AuthContext.Provider value={{ sessionUser, setSessionUser, allUsers, setAllUsers, systemInitialized, setSystemInitialized, loading, login, logout }}>
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
    if (!name.trim() || !username.trim() || !password) { setError('Lengkapi semua data.'); return; }
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
    try { await setDoc(getDocPath('users', superAdminUser.id), superAdminUser); } catch (err) {}
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
          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full uppercase tracking-wider">Inisialisasi Pertama</span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">Buat Akun Super Administrator</h2>
          <p className="text-xs text-slate-500 mt-1">Akun pertama ini akan menjadi Super User utama untuk mengelola seluruh sistem platform.</p>
        </div>
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-100"><span>⚠️</span><span>{error}</span></div>}
        <form onSubmit={handleInit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Nama Super Admin</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Manager Operasional" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Username Login</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none lowercase focus:bg-white focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500" required />
          </div>
          <Button type="submit" className="w-full py-3.5 font-bold shadow-lg mt-2">Inisialisasi & Masuk Platform</Button>
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
    if (!res.success) setError(res.message);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <GalanganKalimasLogo size="lg" variant="color" className="justify-center mb-4" />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">MASUK PLATFORM OPERASIONAL</h2>
          <p className="text-xs text-slate-500 mt-1">Silakan masukkan username & password akun Anda.</p>
        </div>
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2 border border-red-100"><span>⚠️</span><span>{error}</span></div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Masukkan username" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none lowercase focus:bg-white focus:ring-2 focus:ring-blue-500" required autoFocus />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500" required />
          </div>
          <Button type="submit" className="w-full py-4 text-sm font-bold shadow-lg">Masuk Akun</Button>
        </form>
      </div>
    </div>
  );
};

const TandonOperator = ({ user, onNavigateHome }) => {
  const isReadOnly = user.role === 'MANAGEMENT';
  const [activeTab, setActiveTab] = useState('INPUT'); 
  const [drivers, setDrivers] = useState(() => getLocalData('tandon_drivers', [{ id: 'drv_1', name: 'PAK RUDI' }, { id: 'drv_2', name: 'PAK JOKO' }]));
  const [allTx, setAllTx] = useState(() => getLocalData('tandon_tx', []));
  const [search, setSearch] = useState('');
  const [tandonPrice, setTandonPrice] = useState(20000);
  const [shiftViewDate, setShiftViewDate] = useState('TODAY');

  const [lastTxId, setLastTxId] = useState(null);
  const [undoTimer, setUndoTimer] = useState(0);

  const todayStr = useMemo(() => getMakassarDateString(), []);
  const yesterdayStr = useMemo(() => getAdjacentDateString(todayStr, -1), [todayStr]);
  const shiftActiveDateStr = shiftViewDate === 'TODAY' ? todayStr : yesterdayStr;

  useEffect(() => {
    let unsubPrice = null, unsubDrivers = null, unsubTx = null;
    try {
      unsubPrice = onSnapshot(getDocPath('settings', 'tandon_config'), snap => {
        if (snap.exists() && snap.data().price) setTandonPrice(snap.data().price);
      }, () => {});
      unsubDrivers = onSnapshot(getPublicPath('drivers'), snap => {
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (list.length > 0) { setDrivers(list); setLocalData('tandon_drivers', list); }
      }, () => {});
      unsubTx = onSnapshot(getPublicPath('transactions'), snap => {
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (list.length > 0) { setAllTx(list); setLocalData('tandon_tx', list); }
      }, () => {});
    } catch (e) {}
    return () => {
      if (unsubPrice) unsubPrice();
      if (unsubDrivers) unsubDrivers();
      if (unsubTx) unsubTx();
    };
  }, []);

  useEffect(() => {
    let interval = null;
    if (undoTimer > 0) interval = setInterval(() => setUndoTimer(prev => prev - 1), 1000);
    else setLastTxId(null);
    return () => clearInterval(interval);
  }, [undoTimer]);

  const handleAddTx = async (drv) => {
    if (isReadOnly || !drv) return;
    const docId = 'tx_td_' + Date.now();
    const newTx = {
      id: docId,
      driverId: drv.id,
      driverName: drv.name,
      operatorName: user.name,
      divisionType: 'TANDON',
      quantity: 1,
      unitPrice: tandonPrice,
      totalAmount: tandonPrice,
      timestamp: Date.now(),
      dateStr: todayStr,
      status: 'COMPLETED'
    };
    const updated = [...allTx, newTx];
    setAllTx(updated);
    setLocalData('tandon_tx', updated);
    setLastTxId(docId);
    setUndoTimer(6);
    try { await setDoc(getDocPath('transactions', docId), newTx); } catch (err) {}
  };

  const handleUndoLastTx = async () => {
    if (!lastTxId || isReadOnly) return;
    const updated = allTx.map(t => t.id === lastTxId ? { ...t, status: 'VOIDED', voidedBy: user.name } : t);
    setAllTx(updated);
    setLocalData('tandon_tx', updated);
    setLastTxId(null);
    setUndoTimer(0);
    try { await updateDoc(getDocPath('transactions', lastTxId), { status: 'VOIDED', voidedBy: user.name }); } catch (err) {}
  };

  const filteredDrivers = drivers.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()));
  
  const todayActiveTx = allTx.filter(t => t.divisionType === 'TANDON' && t.dateStr === todayStr && t.status !== 'VOIDED');
  const todayVol = todayActiveTx.reduce((s, t) => s + (t.quantity || 1), 0);
  const todayRev = todayVol * tandonPrice;

  const myTodayTx = todayActiveTx.filter(t => t.operatorName === user.name);
  const myTodayVol = myTodayTx.reduce((s, t) => s + (t.quantity || 1), 0);
  const myTodayRev = myTodayVol * tandonPrice;

  const yesterdayActiveTx = allTx.filter(t => t.divisionType === 'TANDON' && t.dateStr === yesterdayStr && t.status !== 'VOIDED');
  const yesterdayVol = yesterdayActiveTx.reduce((s, t) => s + (t.quantity || 1), 0);
  const yesterdayRev = yesterdayVol * tandonPrice;

  const displayTxList = allTx.filter(t => t.divisionType === 'TANDON' && t.dateStr === shiftActiveDateStr);

  return (
    <div className="max-w-md sm:max-w-xl mx-auto px-3 sm:px-4 py-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={onNavigateHome} className="p-2.5 rounded-xl border-slate-200"><ArrowLeft size={18}/></Button>
          <div>
            <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase">DIVISI OPERASIONAL</span>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-1.5"><Droplet size={20} className="text-blue-600" /> Air Tandon</h1>
          </div>
        </div>
        <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">Rp {tandonPrice.toLocaleString('id-ID')} / Tandon</span>
      </div>

      {isReadOnly && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-bold text-amber-800 flex items-center justify-center gap-2"><Eye size={16} /> Mode Read-Only (Management Oversight)</div>}

      <div className="grid grid-cols-2 gap-2.5">
        <Card className="p-3 bg-blue-600 text-white space-y-0.5 shadow-sm">
          <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">TOTAL SEMUA OPERATOR</span>
          <div className="text-2xl font-black">{todayVol} <span className="text-xs font-normal">Tandon</span></div>
          <p className="text-[10.5px] text-blue-100 font-semibold">Rp {todayRev.toLocaleString('id-ID')}</p>
        </Card>
        <Card className="p-3 bg-slate-800 text-white space-y-0.5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">INPUT SAYA</span>
          <div className="text-2xl font-black text-emerald-400">{myTodayVol} <span className="text-xs font-normal text-slate-300">Tandon</span></div>
          <p className="text-[10.5px] text-slate-300 font-semibold">Rp {myTodayRev.toLocaleString('id-ID')}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-1 bg-slate-200 p-1 rounded-2xl text-xs font-bold">
        <button onClick={() => setActiveTab('INPUT')} className={`py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'INPUT' ? 'bg-white text-blue-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}>Input Transaksi</button>
        <button onClick={() => setActiveTab('REPORT')} className={`py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'REPORT' ? 'bg-white text-blue-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}>Laporan Harian</button>
      </div>

      {activeTab === 'INPUT' && (
        <div className="space-y-4">
          <Card className="p-4 bg-white space-y-3 border-blue-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1"><Truck size={14} className="text-blue-600" /> Daftar Sopir Tandon</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={15} />
              <input type="text" placeholder="Cari nama sopir..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-blue-500" />
              {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={14} /></button>}
            </div>
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredDrivers.map(drv => {
                const driverOrdersCount = todayActiveTx.filter(t => t.driverId === drv.id || t.driverName?.toUpperCase() === drv.name?.toUpperCase()).reduce((s, t) => s + (t.quantity || 1), 0);
                return (
                  <div key={drv.id} className="flex items-center justify-between p-2.5 rounded-xl border bg-slate-50 border-slate-200 hover:bg-slate-100 transition-all gap-2">
                    <div className="min-w-0 flex-1 mr-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-slate-900 truncate">{drv.name || ''}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 shrink-0">(Total: {driverOrdersCount} Tandon)</span>
                      </div>
                    </div>
                    {!isReadOnly && (
                      <button onClick={() => handleAddTx(drv)} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1 shrink-0 cursor-pointer"><Plus size={14} /> +1 Tandon</button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {undoTimer > 0 && !isReadOnly && (
            <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-xs"><CheckCircle2 size={16} className="text-emerald-400" /><span>Tandon berhasil dicatat! ({undoTimer}s)</span></div>
              <button onClick={handleUndoLastTx} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg cursor-pointer">BATALKAN</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'REPORT' && (
        <Card className="p-4 bg-white space-y-3">
          <div className="flex justify-between items-center pb-1 border-b">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase">Riwayat Transaksi Harian</h3>
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-[11px] font-bold">
              <button onClick={() => setShiftViewDate('TODAY')} className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${shiftViewDate === 'TODAY' ? 'bg-blue-600 text-white shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'}`}>Hari Ini</button>
              <button onClick={() => setShiftViewDate('YESTERDAY')} className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${shiftViewDate === 'YESTERDAY' ? 'bg-blue-600 text-white shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'}`}>Kemarin</button>
            </div>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {displayTxList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 italic">Belum ada transaksi pada {shiftViewDate === 'TODAY' ? 'Hari Ini' : 'Kemarin'}.</p>
            ) : (
              displayTxList.slice().reverse().map(tx => (
                <div key={tx.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100">
                  <div>
                    <p className="font-extrabold text-slate-900 uppercase">{tx.driverName || 'Umum'}</p>
                    <p className="text-[10px] text-slate-400">{getMakassarTimeString(tx.timestamp)} WITA — Op: {tx.operatorName || ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-blue-600">Rp {(tx.totalAmount || 0).toLocaleString('id-ID')}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${tx.status === 'VOIDED' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>{tx.status === 'VOIDED' ? 'DIBATALKAN' : 'SELESAI'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

const GallonOperator = ({ user, onNavigateHome }) => {
  const isReadOnly = user.role === 'MANAGEMENT';
  const [activeTab, setActiveTab] = useState('INPUT'); 
  const [customers, setCustomers] = useState(() => getLocalData('gallon_customers', [{ id: 'gc_1', name: 'TOKO BERKAH', customerType: 'Reseller', price: 6000 }]));
  const [allTx, setAllTx] = useState(() => getLocalData('gallon_tx', []));
  const [search, setSearch] = useState('');
  const [globalPrice, setGlobalPrice] = useState(6000);
  const [shiftViewDate, setShiftViewDate] = useState('TODAY');

  const [lastTxId, setLastTxId] = useState(null);
  const [undoTimer, setUndoTimer] = useState(0);

  const todayStr = useMemo(() => getMakassarDateString(), []);
  const yesterdayStr = useMemo(() => getAdjacentDateString(todayStr, -1), [todayStr]);
  const shiftActiveDateStr = shiftViewDate === 'TODAY' ? todayStr : yesterdayStr;

  useEffect(() => {
    let unsubPrice = null, unsubCust = null, unsubTx = null;
    try {
      unsubPrice = onSnapshot(getDocPath('settings', 'gallon_config'), snap => {
        if (snap.exists() && snap.data().price) setGlobalPrice(snap.data().price);
      }, () => {});
      unsubCust = onSnapshot(getPublicPath('gallon_customers'), snap => {
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (list.length > 0) { setCustomers(list); setLocalData('gallon_customers', list); }
      }, () => {});
      unsubTx = onSnapshot(getPublicPath('transactions'), snap => {
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (list.length > 0) { setAllTx(list); setLocalData('gallon_tx', list); }
      }, () => {});
    } catch (e) {}
    return () => {
      if (unsubPrice) unsubPrice();
      if (unsubCust) unsubCust();
      if (unsubTx) unsubTx();
    };
  }, []);

  useEffect(() => {
    let interval = null;
    if (undoTimer > 0) interval = setInterval(() => setUndoTimer(prev => prev - 1), 1000);
    else setLastTxId(null);
    return () => clearInterval(interval);
  }, [undoTimer]);

  const handleAddTx = async (cust, customQty) => {
    if (isReadOnly || !cust) return;
    const unitPrice = cust.price || globalPrice;
    const total = customQty * unitPrice;
    const docId = 'tx_gl_' + Date.now();
    const newTx = {
      id: docId,
      customerId: cust.id,
      customerName: cust.name,
      operatorName: user.name,
      divisionType: 'GALLON',
      quantity: customQty,
      unitPrice: unitPrice,
      totalAmount: total,
      timestamp: Date.now(),
      dateStr: todayStr,
      status: 'COMPLETED'
    };
    const updated = [...allTx, newTx];
    setAllTx(updated);
    setLocalData('gallon_tx', updated);
    setLastTxId(docId);
    setUndoTimer(6);
    try { await setDoc(getDocPath('transactions', docId), newTx); } catch (err) {}
  };

  const handleUndoLastTx = async () => {
    if (!lastTxId || isReadOnly) return;
    const updated = allTx.map(t => t.id === lastTxId ? { ...t, status: 'VOIDED', voidedBy: user.name } : t);
    setAllTx(updated);
    setLocalData('gallon_tx', updated);
    setLastTxId(null);
    setUndoTimer(0);
    try { await updateDoc(getDocPath('transactions', lastTxId), { status: 'VOIDED', voidedBy: user.name }); } catch (err) {}
  };

  const filteredCust = customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));
  
  const todayActiveTx = allTx.filter(t => t.divisionType === 'GALLON' && t.dateStr === todayStr && t.status !== 'VOIDED');
  const todayVol = todayActiveTx.reduce((s, t) => s + (t.quantity || 1), 0);
  const todayRev = todayActiveTx.reduce((s, t) => s + (t.totalAmount || 0), 0);

  const myTodayTx = todayActiveTx.filter(t => t.operatorName === user.name);
  const myTodayVol = myTodayTx.reduce((s, t) => s + (t.quantity || 1), 0);
  const myTodayRev = myTodayTx.reduce((s, t) => s + (t.totalAmount || 0), 0);

  const displayTxList = allTx.filter(t => t.divisionType === 'GALLON' && t.dateStr === shiftActiveDateStr);

  return (
    <div className="max-w-md sm:max-w-xl mx-auto px-3 sm:px-4 py-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={onNavigateHome} className="p-2.5 rounded-xl border-slate-200"><ArrowLeft size={18}/></Button>
          <div>
            <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase">DIVISI OPERASIONAL</span>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-1.5"><Package size={20} className="text-indigo-600" /> Air Gallon</h1>
          </div>
        </div>
        <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">Global: Rp {globalPrice.toLocaleString('id-ID')} / Gallon</span>
      </div>

      {isReadOnly && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-bold text-amber-800 flex items-center justify-center gap-2"><Eye size={16} /> Mode Read-Only (Management Oversight)</div>}

      <div className="grid grid-cols-2 gap-2.5">
        <Card className="p-3 bg-indigo-600 text-white space-y-0.5 shadow-sm">
          <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">TOTAL SEMUA OPERATOR</span>
          <div className="text-2xl font-black">{todayVol} <span className="text-xs font-normal">Gallon</span></div>
          <p className="text-[10.5px] text-indigo-100 font-semibold">Rp {todayRev.toLocaleString('id-ID')}</p>
        </Card>
        <Card className="p-3 bg-slate-800 text-white space-y-0.5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">INPUT SAYA</span>
          <div className="text-2xl font-black text-amber-400">{myTodayVol} <span className="text-xs font-normal text-slate-300">Gallon</span></div>
          <p className="text-[10.5px] text-slate-300 font-semibold">Rp {myTodayRev.toLocaleString('id-ID')}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-1 bg-slate-200 p-1 rounded-2xl text-xs font-bold">
        <button onClick={() => setActiveTab('INPUT')} className={`py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'INPUT' ? 'bg-white text-indigo-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}>Input Transaksi</button>
        <button onClick={() => setActiveTab('REPORT')} className={`py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'REPORT' ? 'bg-white text-indigo-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}>Laporan Harian</button>
      </div>

      {activeTab === 'INPUT' && (
        <div className="space-y-4">
          <Card className="p-4 bg-white space-y-3 border-indigo-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1"><Store size={14} className="text-indigo-600" /> Daftar Pelanggan Gallon</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={15} />
              <input type="text" placeholder="Cari nama pelanggan..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500" />
              {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={14} /></button>}
            </div>
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredCust.map(c => {
                const custOrdersCount = todayActiveTx.filter(t => t.customerId === c.id || t.customerName?.toUpperCase() === c.name?.toUpperCase()).reduce((s, t) => s + (t.quantity || 1), 0);
                return (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl border bg-slate-50 border-slate-200 hover:bg-slate-100 transition-all gap-2">
                    <div className="min-w-0 flex-1 mr-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-slate-900 truncate">{c.name || ''}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 shrink-0">(Total: {custOrdersCount} Gallon)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">Rp {(c.price || globalPrice).toLocaleString('id-ID')} / gallon</span>
                    </div>
                    {!isReadOnly && (
                      <div className="flex items-center gap-1 shrink-0">
                        {[1, 5, 10, 20].map(val => (
                          <button key={val} onClick={() => handleAddTx(c, val)} className="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-[11px] rounded-lg shadow-xs cursor-pointer" title={`Tambah ${val} Gallon`}>+{val}</button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {undoTimer > 0 && !isReadOnly && (
            <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-xs"><CheckCircle2 size={16} className="text-emerald-400" /><span>Gallon berhasil dicatat! ({undoTimer}s)</span></div>
              <button onClick={handleUndoLastTx} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg cursor-pointer">BATALKAN</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'REPORT' && (
        <Card className="p-4 bg-white space-y-3">
          <div className="flex justify-between items-center pb-1 border-b">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase">Riwayat Transaksi Harian</h3>
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-[11px] font-bold">
              <button onClick={() => setShiftViewDate('TODAY')} className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${shiftViewDate === 'TODAY' ? 'bg-indigo-600 text-white shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'}`}>Hari Ini</button>
              <button onClick={() => setShiftViewDate('YESTERDAY')} className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${shiftViewDate === 'YESTERDAY' ? 'bg-indigo-600 text-white shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'}`}>Kemarin</button>
            </div>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {displayTxList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 italic">Belum ada transaksi pada {shiftViewDate === 'TODAY' ? 'Hari Ini' : 'Kemarin'}.</p>
            ) : (
              displayTxList.slice().reverse().map(tx => (
                <div key={tx.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100">
                  <div>
                    <p className="font-extrabold text-slate-900 uppercase">{tx.customerName || 'Umum'}</p>
                    <p className="text-[10px] text-slate-400">{getMakassarTimeString(tx.timestamp)} WITA — {tx.quantity} Gallon — Op: {tx.operatorName || ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-indigo-600">Rp {(tx.totalAmount || 0).toLocaleString('id-ID')}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${tx.status === 'VOIDED' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>{tx.status === 'VOIDED' ? 'DIBATALKAN' : 'SELESAI'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

const TangkiOperator = ({ user, onNavigateHome }) => {
  const isReadOnly = user.role === 'MANAGEMENT';
  const canVoid = ['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(user.role);

  const [activeTab, setActiveTab] = useState('INPUT'); 
  const [customers, setCustomers] = useState(() => getLocalData('tangki_customers', [{ id: 'tc_1', name: 'PT PELINDO TANGKI', price: 350000 }]));
  const [allTx, setAllTx] = useState(() => getLocalData('tangki_tx', []));
  const [search, setSearch] = useState('');
  const [shiftViewDate, setShiftViewDate] = useState('TODAY');
  const [tangkiPrice, setTangkiPrice] = useState(350000);

  const todayStr = useMemo(() => getMakassarDateString(), []);
  const yesterdayStr = useMemo(() => getAdjacentDateString(todayStr, -1), [todayStr]);
  const shiftActiveDateStr = shiftViewDate === 'TODAY' ? todayStr : yesterdayStr;

  useEffect(() => {
    let unsubPrice = null, unsubCust = null, unsubTx = null;
    try {
      unsubPrice = onSnapshot(getDocPath('settings', 'tangki_config'), snap => {
        if (snap.exists() && snap.data().price) setTangkiPrice(snap.data().price);
      }, () => {});
      unsubCust = onSnapshot(getPublicPath('tangki_customers'), snap => {
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (list.length > 0) { setCustomers(list); setLocalData('tangki_customers', list); }
      }, () => {});
      unsubTx = onSnapshot(getPublicPath('transactions'), snap => {
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (list.length > 0) { setAllTx(list); setLocalData('tangki_tx', list); }
      }, () => {});
    } catch (e) {}
    return () => {
      if (unsubPrice) unsubPrice();
      if (unsubCust) unsubCust();
      if (unsubTx) unsubTx();
    };
  }, []);

  const handleAddTx = async (cust) => {
    if (isReadOnly || !cust) return;
    const price = cust.price || tangkiPrice;
    const docId = 'tx_mt_' + Date.now();
    const newTx = {
      id: docId,
      customerId: cust.id,
      customerName: cust.name,
      operatorName: user.name,
      divisionType: 'MOBIL_TANGKI',
      quantity: 1,
      unitPrice: price,
      totalAmount: price,
      timestamp: Date.now(),
      dateStr: todayStr,
      status: 'COMPLETED'
    };
    const updated = [...allTx, newTx];
    setAllTx(updated);
    setLocalData('tangki_tx', updated);
    try { await setDoc(getDocPath('transactions', docId), newTx); } catch (err) {}
  };

  const handleVoidTx = async (txId) => {
    if (!canVoid || isReadOnly) return;
    const updated = allTx.map(t => t.id === txId ? { ...t, status: 'VOIDED', voidedBy: user.name } : t);
    setAllTx(updated);
    setLocalData('tangki_tx', updated);
    try { await updateDoc(getDocPath('transactions', txId), { status: 'VOIDED', voidedBy: user.name }); } catch (err) {}
  };

  const filteredCust = customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));
  
  const todayActiveTx = allTx.filter(t => t.divisionType === 'MOBIL_TANGKI' && t.dateStr === todayStr && t.status !== 'VOIDED');
  const todayVol = todayActiveTx.reduce((s, t) => s + (t.quantity || 1), 0);
  const todayRev = todayActiveTx.reduce((s, t) => s + (t.totalAmount || 0), 0);

  const myTodayTx = todayActiveTx.filter(t => t.operatorName === user.name);
  const myTodayVol = myTodayTx.reduce((s, t) => s + (t.quantity || 1), 0);
  const myTodayRev = myTodayVol * tangkiPrice;

  const displayTxList = allTx.filter(t => t.divisionType === 'MOBIL_TANGKI' && t.dateStr === shiftActiveDateStr);

  return (
    <div className="max-w-md sm:max-w-xl mx-auto px-3 sm:px-4 py-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={onNavigateHome} className="p-2.5 rounded-xl border-slate-200"><ArrowLeft size={18}/></Button>
          <div>
            <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">DIVISI OPERASIONAL</span>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-1.5"><Truck size={20} className="text-emerald-600" /> Mobil Tangki</h1>
          </div>
        </div>
        <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">Rp {tangkiPrice.toLocaleString('id-ID')} / Tangki</span>
      </div>

      {isReadOnly && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-bold text-amber-800 flex items-center justify-center gap-2"><Eye size={16} /> Mode Read-Only (Management Oversight)</div>}

      <div className="grid grid-cols-2 gap-2.5">
        <Card className="p-3 bg-emerald-600 text-white space-y-0.5 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block">TOTAL SEMUA OPERATOR</span>
          <div className="text-2xl font-black">{todayVol} <span className="text-xs font-normal">Tangki</span></div>
          <p className="text-[10.5px] text-emerald-100 font-semibold">Rp {todayRev.toLocaleString('id-ID')}</p>
        </Card>
        <Card className="p-3 bg-slate-800 text-white space-y-0.5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">INPUT SAYA</span>
          <div className="text-2xl font-black text-amber-400">{myTodayVol} <span className="text-xs font-normal text-slate-300">Tangki</span></div>
          <p className="text-[10.5px] text-slate-300 font-semibold">Rp {myTodayRev.toLocaleString('id-ID')}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-1 bg-slate-200 p-1 rounded-2xl text-xs font-bold">
        <button onClick={() => setActiveTab('INPUT')} className={`py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'INPUT' ? 'bg-white text-emerald-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}>Input Transaksi</button>
        <button onClick={() => setActiveTab('REPORT')} className={`py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'REPORT' ? 'bg-white text-emerald-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}>Laporan Harian</button>
      </div>

      {activeTab === 'INPUT' && (
        <Card className="p-4 bg-white space-y-3 border-emerald-100">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1"><Building size={14} className="text-emerald-600" /> Pilih Pelanggan Mobil Tangki</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={15} />
            <input type="text" placeholder="Cari nama pelanggan tangki..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={14} /></button>}
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {filteredCust.map(c => {
              const custOrdersCount = todayActiveTx.filter(t => t.customerId === c.id || t.customerName?.toUpperCase() === c.name?.toUpperCase()).reduce((s, t) => s + (t.quantity || 1), 0);
              return (
                <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl border bg-slate-50 border-slate-200 hover:bg-slate-100 transition-all gap-2">
                  <div className="min-w-0 flex-1 mr-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-slate-900 truncate">{c.name || ''}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">(Total: {custOrdersCount} Tangki)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Rp {(c.price || tangkiPrice).toLocaleString('id-ID')} / Tangki</span>
                  </div>
                  {!isReadOnly && (
                    <button onClick={() => handleAddTx(c)} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1 shrink-0 cursor-pointer"><Plus size={14} /> +1 Tangki</button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {activeTab === 'REPORT' && (
        <Card className="p-4 bg-white space-y-3">
          <div className="flex justify-between items-center pb-1 border-b">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase">Riwayat Transaksi Harian</h3>
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-[11px] font-bold">
              <button onClick={() => setShiftViewDate('TODAY')} className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${shiftViewDate === 'TODAY' ? 'bg-emerald-600 text-white shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'}`}>Hari Ini</button>
              <button onClick={() => setShiftViewDate('YESTERDAY')} className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${shiftViewDate === 'YESTERDAY' ? 'bg-emerald-600 text-white shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'}`}>Kemarin</button>
            </div>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {displayTxList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 italic">Belum ada transaksi pada {shiftViewDate === 'TODAY' ? 'Hari Ini' : 'Kemarin'}.</p>
            ) : (
              displayTxList.slice().reverse().map(tx => (
                <div key={tx.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100">
                  <div>
                    <p className="font-extrabold text-slate-900 uppercase">{tx.customerName || 'Umum'}</p>
                    <p className="text-[10px] text-slate-400">{getMakassarTimeString(tx.timestamp)} WITA — Operator: {tx.operatorName || ''}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="font-black text-emerald-600">Rp {(tx.totalAmount || 0).toLocaleString('id-ID')}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${tx.status === 'VOIDED' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>{tx.status === 'VOIDED' ? 'DIBATALKAN' : 'SELESAI'}</span>
                    </div>
                    {canVoid && tx.status !== 'VOIDED' && !isReadOnly && (
                      <button onClick={() => handleVoidTx(tx.id)} className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer" title="Batalkan Pesanan"><X size={16} /></button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

const AirKapalOperator = ({ user, onNavigateHome }) => {
  const isReadOnly = user.role === 'MANAGEMENT';
  const canVoid = ['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(user.role);

  const [activeTab, setActiveTab] = useState('INPUT'); 
  const [ships, setShips] = useState(() => getLocalData('kapal_ships', [{ id: 'shp_1', shipName: 'KM. SEJAHTERA', customerName: 'PT PELAYARAN MAJU', price: 50000 }]));
  const [allTx, setAllTx] = useState(() => getLocalData('kapal_tx', []));
  const [search, setSearch] = useState('');
  const [shiftViewDate, setShiftViewDate] = useState('TODAY');
  const [kapalPrice, setKapalPrice] = useState(50000);

  const todayStr = useMemo(() => getMakassarDateString(), []);
  const yesterdayStr = useMemo(() => getAdjacentDateString(todayStr, -1), [todayStr]);
  const shiftActiveDateStr = shiftViewDate === 'TODAY' ? todayStr : yesterdayStr;

  useEffect(() => {
    let unsubPrice = null, unsubShips = null, unsubTx = null;
    try {
      unsubPrice = onSnapshot(getDocPath('settings', 'kapal_config'), snap => {
        if (snap.exists() && snap.data().price) setKapalPrice(snap.data().price);
      }, () => {});
      unsubShips = onSnapshot(getPublicPath('kapal_ships'), snap => {
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (list.length > 0) { setShips(list); setLocalData('kapal_ships', list); }
      }, () => {});
      unsubTx = onSnapshot(getPublicPath('transactions'), snap => {
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (list.length > 0) { setAllTx(list); setLocalData('kapal_tx', list); }
      }, () => {});
    } catch (e) {}
    return () => {
      if (unsubPrice) unsubPrice();
      if (unsubShips) unsubShips();
      if (unsubTx) unsubTx();
    };
  }, []);

  const handleAddTx = async (ship, customTon) => {
    if (isReadOnly || !ship) return;
    const unitPrice = ship.price || kapalPrice;
    const total = customTon * unitPrice;
    const docId = 'tx_ak_' + Date.now();
    const newTx = {
      id: docId,
      shipId: ship.id,
      shipName: ship.shipName,
      customerName: ship.customerName,
      operatorName: user.name,
      divisionType: 'AIR_KAPAL',
      quantity: customTon,
      unitPrice: unitPrice,
      totalAmount: total,
      timestamp: Date.now(),
      dateStr: todayStr,
      status: 'COMPLETED'
    };
    const updated = [...allTx, newTx];
    setAllTx(updated);
    setLocalData('kapal_tx', updated);
    try { await setDoc(getDocPath('transactions', docId), newTx); } catch (err) {}
  };

  const handleVoidTx = async (txId) => {
    if (!canVoid || isReadOnly) return;
    const updated = allTx.map(t => t.id === txId ? { ...t, status: 'VOIDED', voidedBy: user.name } : t);
    setAllTx(updated);
    setLocalData('kapal_tx', updated);
    try { await updateDoc(getDocPath('transactions', txId), { status: 'VOIDED', voidedBy: user.name }); } catch (err) {}
  };

  const filteredShips = ships.filter(s => s.shipName?.toLowerCase().includes(search.toLowerCase()) || s.customerName?.toLowerCase().includes(search.toLowerCase()));
  
  const todayActiveTx = allTx.filter(t => t.divisionType === 'AIR_KAPAL' && t.dateStr === todayStr && t.status !== 'VOIDED');
  const todayVol = todayActiveTx.reduce((s, t) => s + (t.quantity || 1), 0);
  const todayRev = todayActiveTx.reduce((s, t) => s + (t.totalAmount || 0), 0);

  const myTodayTx = todayActiveTx.filter(t => t.operatorName === user.name);
  const myTodayVol = myTodayTx.reduce((s, t) => s + (t.quantity || 1), 0);
  const myTodayRev = myTodayVol * kapalPrice;

  const displayTxList = allTx.filter(t => t.divisionType === 'AIR_KAPAL' && t.dateStr === shiftActiveDateStr);

  return (
    <div className="max-w-md sm:max-w-xl mx-auto px-3 sm:px-4 py-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={onNavigateHome} className="p-2.5 rounded-xl border-slate-200"><ArrowLeft size={18}/></Button>
          <div>
            <span className="text-[10px] font-black tracking-widest text-cyan-600 uppercase">DIVISI OPERASIONAL</span>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-1.5"><Anchor size={20} className="text-cyan-600" /> Air Kapal</h1>
          </div>
        </div>
        <span className="text-xs font-bold bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full border border-cyan-200">Rp {kapalPrice.toLocaleString('id-ID')} / Ton</span>
      </div>

      {isReadOnly && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-bold text-amber-800 flex items-center justify-center gap-2"><Eye size={16} /> Mode Read-Only (Management Oversight)</div>}

      <div className="grid grid-cols-2 gap-2.5">
        <Card className="p-3 bg-cyan-600 text-white space-y-0.5 shadow-sm">
          <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider block">TOTAL SEMUA OPERATOR</span>
          <div className="text-2xl font-black">{todayVol} <span className="text-xs font-normal">Ton</span></div>
          <p className="text-[10.5px] text-cyan-100 font-semibold">Rp {todayRev.toLocaleString('id-ID')}</p>
        </Card>
        <Card className="p-3 bg-slate-800 text-white space-y-0.5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">INPUT SAYA</span>
          <div className="text-2xl font-black text-amber-400">{myTodayVol} <span className="text-xs font-normal text-slate-300">Ton</span></div>
          <p className="text-[10.5px] text-slate-300 font-semibold">Rp {myTodayRev.toLocaleString('id-ID')}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-1 bg-slate-200 p-1 rounded-2xl text-xs font-bold">
        <button onClick={() => setActiveTab('INPUT')} className={`py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'INPUT' ? 'bg-white text-cyan-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}>Input Transaksi</button>
        <button onClick={() => setActiveTab('REPORT')} className={`py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'REPORT' ? 'bg-white text-cyan-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}>Laporan Harian</button>
      </div>

      {activeTab === 'INPUT' && (
        <Card className="p-4 bg-white space-y-3 border-cyan-100">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1"><Anchor size={14} className="text-cyan-600" /> Pilih Kapal Sandar</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={15} />
            <input type="text" placeholder="Cari nama kapal atau agen..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-cyan-500" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"><X size={14} /></button>}
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {filteredShips.map(s => {
              const shipOrdersCount = todayActiveTx.filter(t => t.shipId === s.id || t.shipName?.toUpperCase() === s.shipName?.toUpperCase()).reduce((sum, t) => sum + (t.quantity || 1), 0);
              return (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl border bg-slate-50 border-slate-200 hover:bg-slate-100 transition-all gap-2">
                  <div className="min-w-0 flex-1 mr-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-slate-900 truncate">{s.shipName || ''}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 shrink-0">(Total: {shipOrdersCount} Ton)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate">Agen: {s.customerName || ''} — Rp {(s.price || kapalPrice).toLocaleString('id-ID')}/T</span>
                  </div>
                  {!isReadOnly && (
                    <div className="flex items-center gap-1 shrink-0">
                      {[10, 20, 50, 100].map(val => (
                        <button key={val} onClick={() => handleAddTx(s, val)} className="px-2 py-1.5 bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white font-black text-[11px] rounded-lg shadow-xs cursor-pointer" title={`Tambah ${val} Ton`}>+{val}T</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {activeTab === 'REPORT' && (
        <Card className="p-4 bg-white space-y-3">
          <div className="flex justify-between items-center pb-1 border-b">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase">Riwayat Transaksi Harian</h3>
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-[11px] font-bold">
              <button onClick={() => setShiftViewDate('TODAY')} className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${shiftViewDate === 'TODAY' ? 'bg-cyan-600 text-white shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'}`}>Hari Ini</button>
              <button onClick={() => setShiftViewDate('YESTERDAY')} className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${shiftViewDate === 'YESTERDAY' ? 'bg-cyan-600 text-white shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'}`}>Kemarin</button>
            </div>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {displayTxList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 italic">Belum ada transaksi pada {shiftViewDate === 'TODAY' ? 'Hari Ini' : 'Kemarin'}.</p>
            ) : (
              displayTxList.slice().reverse().map(tx => (
                <div key={tx.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100">
                  <div>
                    <p className="font-extrabold text-slate-900 uppercase">{tx.shipName || 'Umum'}</p>
                    <p className="text-[10px] text-slate-400">{getMakassarTimeString(tx.timestamp)} WITA — {tx.quantity} Ton — Op: {tx.operatorName || ''}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="font-black text-cyan-600">Rp {(tx.totalAmount || 0).toLocaleString('id-ID')}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${tx.status === 'VOIDED' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>{tx.status === 'VOIDED' ? 'DIBATALKAN' : 'SELESAI'}</span>
                    </div>
                    {canVoid && tx.status !== 'VOIDED' && !isReadOnly && (
                      <button onClick={() => handleVoidTx(tx.id)} className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer" title="Batalkan Pesanan"><X size={16} /></button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

const GasOperator = ({ user, onNavigateHome }) => {
  const isReadOnly = user.role === 'MANAGEMENT';
  const [cylinders, setCylinders] = useState([
    { id: 'g1', name: 'Tabung Oksigen 6m3 (Besar)', stock: 45 },
    { id: 'g2', name: 'Tabung Asetilin (Acetylene)', stock: 20 },
    { id: 'g3', name: 'Tabung Argon', stock: 15 },
    { id: 'g4', name: 'Tabung LPG 50kg', stock: 30 }
  ]);

  return (
    <div className="max-w-md sm:max-w-xl mx-auto px-3 sm:px-4 py-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={onNavigateHome} className="p-2.5 rounded-xl border-slate-200"><ArrowLeft size={18}/></Button>
          <div>
            <span className="text-[10px] font-black tracking-widest text-orange-600 uppercase">DIVISI OPERASIONAL</span>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-1.5"><Flame size={20} className="text-orange-600" /> Gas Industri</h1>
          </div>
        </div>
      </div>
      {isReadOnly && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-bold text-amber-800 flex items-center justify-center gap-2"><Eye size={16} /> Mode Read-Only (Management Oversight)</div>}
      <Card className="p-4 bg-white space-y-3">
        <h3 className="font-black text-xs text-slate-900 uppercase">Stok & Pengisian Tabung Gas</h3>
        <div className="space-y-2">
          {cylinders.map(c => (
            <div key={c.id} className="p-3 bg-slate-50 rounded-xl border flex items-center justify-between text-xs">
              <div>
                <span className="font-bold uppercase text-slate-900 block">{c.name}</span>
                <span className="text-[10px] text-slate-500">Stok Tersedia: {c.stock} Tabung</span>
              </div>
              {!isReadOnly && (
                <button onClick={() => alert(`Refill dicatat untuk ${c.name}`)} className="px-3 py-1.5 bg-orange-600 text-white font-bold rounded-lg text-xs cursor-pointer">+ Refill</button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const ReportsModule = ({ user, onNavigateHome }) => {
  const [reportTab, setReportTab] = useState('TODAY'); // TODAY, WEEK, MONTH
  const [todaySubMode, setTodaySubMode] = useState('TODAY'); // TODAY, YESTERDAY, CUSTOM
  const [selectedDate, setSelectedDate] = useState(() => getMakassarDateString());
  const [selectedWeekDate, setSelectedWeekDate] = useState(() => getMakassarDateString());
  const [selectedMonthStr, setSelectedMonthStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [allTx, setAllTx] = useState(() => [
    ...getLocalData('tandon_tx', []),
    ...getLocalData('gallon_tx', []),
    ...getLocalData('tangki_tx', []),
    ...getLocalData('kapal_tx', [])
  ]);

  useEffect(() => {
    let unsub = null;
    try {
      unsub = onSnapshot(getPublicPath('transactions'), snap => {
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (list.length > 0) setAllTx(list);
      }, () => {});
    } catch (e) {}
    return () => { if (unsub) unsub(); };
  }, []);

  const todayStr = getMakassarDateString();
  const yesterdayStr = getAdjacentDateString(todayStr, -1);
  
  const activeDateStr = reportTab === 'TODAY' 
    ? (todaySubMode === 'TODAY' ? todayStr : (todaySubMode === 'YESTERDAY' ? yesterdayStr : selectedDate))
    : todayStr;

  const getActiveTransactions = () => {
    if (reportTab === 'TODAY') {
      return allTx.filter(t => t.dateStr === activeDateStr && t.status !== 'VOIDED');
    } else if (reportTab === 'WEEK') {
      try {
        const parts = selectedWeekDate.split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const day = d.getDay() || 7;
        const monday = new Date(d);
        monday.setDate(d.getDate() - day + 1);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const startStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
        const endStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;

        return allTx.filter(t => t.dateStr >= startStr && t.dateStr <= endStr && t.status !== 'VOIDED');
      } catch (e) {
        return allTx.filter(t => t.dateStr === todayStr && t.status !== 'VOIDED');
      }
    } else {
      return allTx.filter(t => t.dateStr?.startsWith(selectedMonthStr) && t.status !== 'VOIDED');
    }
  };

  const activeTx = useMemo(() => getActiveTransactions(), [reportTab, todaySubMode, selectedDate, selectedWeekDate, selectedMonthStr, allTx]);
  const totalOmset = activeTx.reduce((s, t) => s + (t.totalAmount || 0), 0);

  const divisions = [
    { key: 'TANDON', name: 'Air Tandon', color: 'bg-blue-600', text: 'text-blue-600' },
    { key: 'GALLON', name: 'Air Gallon', color: 'bg-indigo-600', text: 'text-indigo-600' },
    { key: 'MOBIL_TANGKI', name: 'Mobil Tangki', color: 'bg-emerald-600', text: 'text-emerald-600' },
    { key: 'AIR_KAPAL', name: 'Air Kapal', color: 'bg-cyan-600', text: 'text-cyan-600' },
    { key: 'INDUSTRIAL_GAS', name: 'Gas Industri', color: 'bg-orange-600', text: 'text-orange-600' },
  ];

  const getWeeklyData = () => {
    try {
      const parts = selectedWeekDate.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const day = d.getDay() || 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - day + 1);
      
      const weekDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      return weekDays.map((dayName, idx) => {
        const targetD = new Date(monday);
        targetD.setDate(monday.getDate() + idx);
        const dateStr = `${targetD.getFullYear()}-${String(targetD.getMonth() + 1).padStart(2, '0')}-${String(targetD.getDate()).padStart(2, '0')}`;
        const dayTx = allTx.filter(t => t.dateStr === dateStr && t.status !== 'VOIDED');
        const omset = dayTx.reduce((s, t) => s + (t.totalAmount || 0), 0);
        return { name: dayName, dateStr, omset };
      });
    } catch (e) {
      return [];
    }
  };

  const weeklyData = useMemo(() => getWeeklyData(), [selectedWeekDate, allTx]);
  const maxWeeklyOmset = Math.max(...weeklyData.map(w => w.omset), 100000);

  const getMonthlyDailyData = () => {
    try {
      const [year, month] = selectedMonthStr.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      const dailyList = [];
      for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
        const dayStr = String(dayNum).padStart(2, '0');
        const monthStr = String(month).padStart(2, '0');
        const dateStr = `${year}-${monthStr}-${dayStr}`;
        const dayTx = allTx.filter(t => t.dateStr === dateStr && t.status !== 'VOIDED');
        const omset = dayTx.reduce((s, t) => s + (t.totalAmount || 0), 0);
        dailyList.push({ dayNum, dateStr, omset });
      }
      return dailyList;
    } catch (e) {
      return [];
    }
  };

  const monthlyDailyData = useMemo(() => getMonthlyDailyData(), [selectedMonthStr, allTx]);
  const maxMonthlyOmset = Math.max(...monthlyDailyData.map(m => m.omset), 100000);

  const operatorsMap = {};
  activeTx.forEach(t => {
    const op = t.operatorName || 'SYSTEM';
    if (!operatorsMap[op]) operatorsMap[op] = { count: 0, omset: 0, vol: 0 };
    operatorsMap[op].count += 1;
    operatorsMap[op].omset += (t.totalAmount || 0);
    operatorsMap[op].vol += (t.quantity || 1);
  });

  const handleWhatsAppShare = () => {
    const periodLabel = reportTab === 'TODAY' ? `Hari Ini (${activeDateStr})` : reportTab === 'WEEK' ? `Minggu Ini` : `Bulan Ini (${selectedMonthStr})`;
    const text = `*📊 LAPORAN OPERASIONAL GALANGAN KALIMAS*\n🗓️ Periode: ${periodLabel}\n💰 Total Omset: Rp ${totalOmset.toLocaleString('id-ID')}\n\n*Rincian Per Divisi:*` +
      divisions.map(div => {
        const divTx = activeTx.filter(t => t.divisionType === div.key);
        const rev = divTx.reduce((s, t) => s + (t.totalAmount || 0), 0);
        const vol = divTx.reduce((s, t) => s + (t.quantity || 1), 0);
        return `\n- ${div.name}: ${vol} unit (Rp ${rev.toLocaleString('id-ID')})`;
      }).join('');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-md sm:max-w-2xl mx-auto px-3 sm:px-4 py-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={onNavigateHome} className="p-2.5 rounded-xl border-slate-200"><ArrowLeft size={18}/></Button>
          <div>
            <span className="text-[10px] font-black tracking-widest text-purple-600 uppercase">LAPORAN EKSEKUTIF</span>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-1.5"><PieChart size={20} className="text-purple-600" /> Laporan Operasional</h1>
          </div>
        </div>
        <Button variant="cyan" onClick={handleWhatsAppShare} className="py-2 px-3 text-xs cursor-pointer"><Share2 size={15} /> WhatsApp</Button>
      </div>

      <div className="grid grid-cols-3 gap-1 bg-slate-200 p-1 rounded-2xl text-xs font-extrabold">
        <button onClick={() => setReportTab('TODAY')} className={`py-2.5 rounded-xl transition-all cursor-pointer ${reportTab === 'TODAY' ? 'bg-purple-600 text-white shadow-md font-black' : 'text-slate-700 hover:text-slate-900'}`}>Hari Ini</button>
        <button onClick={() => setReportTab('WEEK')} className={`py-2.5 rounded-xl transition-all cursor-pointer ${reportTab === 'WEEK' ? 'bg-purple-600 text-white shadow-md font-black' : 'text-slate-700 hover:text-slate-900'}`}>Minggu</button>
        <button onClick={() => setReportTab('MONTH')} className={`py-2.5 rounded-xl transition-all cursor-pointer ${reportTab === 'MONTH' ? 'bg-purple-600 text-white shadow-md font-black' : 'text-slate-700 hover:text-slate-900'}`}>Bulan Ini</button>
      </div>

      <Card className="p-4 bg-white space-y-4">
        {reportTab === 'TODAY' && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b">
            <div className="flex gap-2">
              <button onClick={() => setTodaySubMode('TODAY')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${todaySubMode === 'TODAY' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Hari Ini</button>
              <button onClick={() => setTodaySubMode('YESTERDAY')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${todaySubMode === 'YESTERDAY' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Kemarin</button>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              <input type="date" value={activeDateStr} onChange={(e) => { setSelectedDate(e.target.value); setTodaySubMode('CUSTOM'); }} className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
        )}

        {reportTab === 'WEEK' && (
          <div className="flex justify-between items-center pb-3 border-b">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase block">Pilih Tanggal Acuan Minggu</span>
              <span className="text-[10px] text-slate-400">Sistem otomatis menghitung Senin s/d Minggu</span>
            </div>
            <input type="date" value={selectedWeekDate} onChange={(e) => setSelectedWeekDate(e.target.value)} className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        )}

        {reportTab === 'MONTH' && (
          <div className="flex justify-between items-center pb-3 border-b">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase block">Pilih Bulan Laporan</span>
              <span className="text-[10px] text-slate-400">Menampilkan omset harian tanggal 1 s/d akhir bulan</span>
            </div>
            <input type="month" value={selectedMonthStr} onChange={(e) => setSelectedMonthStr(e.target.value)} className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        )}

        <div className="p-4 bg-purple-900 text-white rounded-2xl space-y-1 shadow-md">
          <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">TOTAL OMSET GABUNGAN</span>
          <div className="text-3xl font-black">Rp {totalOmset.toLocaleString('id-ID')}</div>
          <p className="text-[11px] text-purple-300">{activeTx.length} Total Transaksi Tercatat Gabungan</p>
        </div>

        <div className="space-y-2.5 pt-2">
          <h3 className="font-extrabold text-xs text-slate-700 uppercase">Rincian Per Divisi</h3>
          {divisions.map(div => {
            const divTx = activeTx.filter(t => t.divisionType === div.key);
            const rev = divTx.reduce((s, t) => s + (t.totalAmount || 0), 0);
            const vol = divTx.reduce((s, t) => s + (t.quantity || 1), 0);
            const percentage = totalOmset > 0 ? Math.round((rev / totalOmset) * 100) : 0;
            return (
              <div key={div.key} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-black uppercase ${div.text}`}>{div.name}</span>
                  <span className="font-black text-slate-900">Rp {rev.toLocaleString('id-ID')} ({percentage}%)</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${div.color} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-500">{vol} Transaksi / Volume Tercatat</p>
              </div>
            );
          })}
        </div>

        {reportTab === 'WEEK' && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-extrabold text-xs text-slate-700 uppercase flex items-center gap-1.5"><BarChart2 size={14} className="text-purple-600" /> Grafik Tren Mingguan (Senin — Minggu)</h3>
            <div className="grid grid-cols-7 gap-1.5 items-end h-32 pt-6 pb-2 px-2 bg-slate-50 rounded-xl border">
              {weeklyData.map(w => {
                const heightPct = maxWeeklyOmset > 0 ? Math.max(Math.round((w.omset / maxWeeklyOmset) * 100), 6) : 6;
                const isSelected = w.dateStr === selectedWeekDate;
                return (
                  <div key={w.name} onClick={() => setSelectedWeekDate(w.dateStr)} className="flex flex-col items-center gap-1 h-full justify-end cursor-pointer group">
                    <span className="text-[9px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-all">{w.omset > 0 ? `${Math.round(w.omset/1000)}k` : '0'}</span>
                    <div className={`w-full rounded-t-lg transition-all ${isSelected ? 'bg-purple-600' : 'bg-purple-300 group-hover:bg-purple-400'}`} style={{ height: `${heightPct}%` }}></div>
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-purple-700 font-black' : 'text-slate-600'}`}>{w.name.slice(0, 3)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {reportTab === 'MONTH' && (
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-extrabold text-xs text-slate-700 uppercase flex items-center gap-1.5"><BarChart2 size={14} className="text-purple-600" /> Grafik Tren Bulanan Harian (Tanggal 1 — Akhir Bulan)</h3>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-1 items-end h-36 pt-6 pb-2 px-2 bg-slate-50 rounded-xl border min-w-max">
                {monthlyDailyData.map(m => {
                  const heightPct = maxMonthlyOmset > 0 ? Math.max(Math.round((m.omset / maxMonthlyOmset) * 100), 6) : 6;
                  return (
                    <div key={m.dayNum} className="flex flex-col items-center gap-1 h-full justify-end group w-6" title={`${m.dateStr}: Rp ${m.omset.toLocaleString('id-ID')}`}>
                      <span className="text-[8px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-all">{m.omset > 0 ? `${Math.round(m.omset/1000)}k` : ''}</span>
                      <div className="w-4 rounded-t bg-purple-500 group-hover:bg-purple-600 transition-all" style={{ height: `${heightPct}%` }}></div>
                      <span className="text-[9px] font-bold text-slate-600">{m.dayNum}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2.5 pt-4 border-t">
          <h3 className="font-extrabold text-xs text-slate-700 uppercase">Performa Operator</h3>
          {Object.keys(operatorsMap).length === 0 ? (
            <p className="text-xs text-slate-400 italic">Belum ada transaksi tercatat untuk periode ini.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(operatorsMap).map(([opName, data]) => (
                <div key={opName} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold uppercase text-slate-900 block">{opName}</span>
                    <span className="text-[10px] text-slate-500">{data.count} Transaksi ({data.vol} Total Volume)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-purple-700">Rp {data.omset.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

const AdminPanel = ({ onNavigateHome }) => {
  const { sessionUser, allUsers, setAllUsers } = useContext(AuthContext);
  const [activeCategory, setActiveCategory] = useState('INTERNAL'); // INTERNAL, CUSTOMER, PRICING
  const [customerSubTab, setCustomerSubTab] = useState('DRIVERS'); // DRIVERS, TANGKI_CUST, GALLON_CUST, SHIPS

  const [drivers, setDrivers] = useState(() => getLocalData('tandon_drivers', []));
  const [tangkiCust, setTangkiCust] = useState(() => getLocalData('tangki_customers', []));
  const [gallonCust, setGallonCust] = useState(() => getLocalData('gallon_customers', []));
  const [ships, setShips] = useState(() => getLocalData('kapal_ships', []));
  
  const [tandonPrice, setTandonPrice] = useState(20000);
  const [gallonPrice, setGallonPrice] = useState(6000);
  const [tangkiPrice, setTangkiPrice] = useState(350000);
  const [kapalPrice, setKapalPrice] = useState(50000);

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('OPERATOR');
  const [newUserDivisions, setNewUserDivisions] = useState(['TANDON']);
  const [userError, setUserError] = useState('');

  const [editUserTarget, setEditUserTarget] = useState(null);
  const [editPasswordTarget, setEditPasswordTarget] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const [editDriverTarget, setEditDriverTarget] = useState(null);
  const [editTangkiTarget, setEditTangkiTarget] = useState(null);
  const [editGallonTarget, setEditGallonTarget] = useState(null);
  const [editShipTarget, setEditShipTarget] = useState(null);

  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [driverUsername, setDriverUsername] = useState('');
  const [driverPassword, setDriverPassword] = useState('');

  const [isAddTangkiOpen, setIsAddTangkiOpen] = useState(false);
  const [tangkiName, setTangkiName] = useState('');
  const [tangkiCustPrice, setTangkiCustPrice] = useState(350000);
  const [tangkiUsername, setTangkiUsername] = useState('');
  const [tangkiPassword, setTangkiPassword] = useState('');

  const [isAddGallonOpen, setIsAddGallonOpen] = useState(false);
  const [gallonName, setGallonName] = useState('');
  const [gallonType, setGallonType] = useState('Konsumen');
  const [gallonCustPrice, setGallonCustPrice] = useState(6000);
  const [gallonUsername, setGallonUsername] = useState('');
  const [gallonPassword, setGallonPassword] = useState('');

  const [isAddShipOpen, setIsAddShipOpen] = useState(false);
  const [shipName, setShipName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [shipPrice, setShipPrice] = useState(50000);
  const [shipUsername, setShipUsername] = useState('');
  const [shipPassword, setShipPassword] = useState('');

  const canResetPassword = ['ADMIN', 'SUPER_ADMIN'].includes(sessionUser.role);
  const canEditCustomer = ['SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'].includes(sessionUser.role);

  useEffect(() => {
    let unsubDrivers = null, unsubTangki = null, unsubGallon = null, unsubShips = null;
    let unsubT = null, unsubG = null, unsubM = null, unsubK = null;
    try {
      unsubDrivers = onSnapshot(getPublicPath('drivers'), snap => {
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (list.length > 0) { setDrivers(list); setLocalData('tandon_drivers', list); }
      }, () => {});
      unsubTangki = onSnapshot(getPublicPath('tangki_customers'), snap => {
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (list.length > 0) { setTangkiCust(list); setLocalData('tangki_customers', list); }
      }, () => {});
      unsubGallon = onSnapshot(getPublicPath('gallon_customers'), snap => {
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (list.length > 0) { setGallonCust(list); setLocalData('gallon_customers', list); }
      }, () => {});
      unsubShips = onSnapshot(getPublicPath('kapal_ships'), snap => {
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (list.length > 0) { setShips(list); setLocalData('kapal_ships', list); }
      }, () => {});
      unsubT = onSnapshot(getDocPath('settings', 'tandon_config'), snap => { if (snap.exists()) setTandonPrice(snap.data().price || 20000); }, () => {});
      unsubG = onSnapshot(getDocPath('settings', 'gallon_config'), snap => { if (snap.exists()) setGallonPrice(snap.data().price || 6000); }, () => {});
      unsubM = onSnapshot(getDocPath('settings', 'tangki_config'), snap => { if (snap.exists()) setTangkiPrice(snap.data().price || 350000); }, () => {});
      unsubK = onSnapshot(getDocPath('settings', 'kapal_config'), snap => { if (snap.exists()) setKapalPrice(snap.data().price || 50000); }, () => {});
    } catch (e) {}
    return () => {
      if (unsubDrivers) unsubDrivers();
      if (unsubTangki) unsubTangki();
      if (unsubGallon) unsubGallon();
      if (unsubShips) unsubShips();
      if (unsubT) unsubT();
      if (unsubG) unsubG();
      if (unsubM) unsubM();
      if (unsubK) unsubK();
    };
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserError('');
    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword) { setUserError('Lengkapi semua data staff.'); return; }
    if (newUserRole !== 'MANAGEMENT' && newUserDivisions.length === 0) { setUserError('Pilih minimal 1 divisi.'); return; }

    const cleanUsername = newUserUsername.trim().toLowerCase();
    const isDuplicate = allUsers.some(u => u.username?.toLowerCase() === cleanUsername);
    if (isDuplicate) { setUserError(`Username "${cleanUsername}" sudah digunakan.`); return; }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: newUserName.trim(),
      username: cleanUsername,
      password: newUserPassword,
      role: newUserRole,
      divisions: newUserRole === 'MANAGEMENT' ? ['TANDON', 'GALLON', 'MOBIL_TANGKI', 'AIR_KAPAL', 'INDUSTRIAL_GAS'] : newUserDivisions,
      isActive: true,
      createdAt: Date.now()
    };
    const updatedList = [...allUsers, newUser];
    setAllUsers(updatedList);
    setLocalData('all_users', updatedList);
    setIsAddUserOpen(false);
    setNewUserName(''); setNewUserUsername(''); setNewUserPassword('');
    try { await setDoc(getDocPath('users', newUser.id), newUser); } catch (err) {}
  };

  const handleToggleUserActive = async (user) => {
    const updatedStatus = user.isActive === false ? true : false;
    const updatedList = allUsers.map(u => u.id === user.id ? { ...u, isActive: updatedStatus } : u);
    setAllUsers(updatedList);
    setLocalData('all_users', updatedList);
    try { await updateDoc(getDocPath('users', user.id), { isActive: updatedStatus }); } catch (err) {}
  };

  const handleSavePrices = async (e) => {
    e.preventDefault();
    try {
      await setDoc(getDocPath('settings', 'tandon_config'), { price: Number(tandonPrice) });
      await setDoc(getDocPath('settings', 'gallon_config'), { price: Number(gallonPrice) });
      await setDoc(getDocPath('settings', 'tangki_config'), { price: Number(tangkiPrice) });
      await setDoc(getDocPath('settings', 'kapal_config'), { price: Number(kapalPrice) });
      alert('Harga standar global berhasil diperbarui!');
    } catch (err) { alert('Harga disimpan secara lokal.'); }
  };

  return (
    <div className="max-w-md sm:max-w-3xl mx-auto px-3 sm:px-4 py-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={onNavigateHome} className="p-2.5 rounded-xl border-slate-200"><ArrowLeft size={18}/></Button>
          <div>
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">ADMINISTRASI SISTEM</span>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-1.5"><Settings size={20} className="text-slate-800" /> Panel Admin</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 bg-slate-200 p-1 rounded-2xl text-xs font-extrabold shadow-inner">
        <button onClick={() => setActiveCategory('INTERNAL')} className={`py-3 rounded-xl transition-all cursor-pointer ${activeCategory === 'INTERNAL' ? 'bg-slate-800 text-white shadow-md font-black' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'}`}>a. User Internal</button>
        <button onClick={() => setActiveCategory('CUSTOMER')} className={`py-3 rounded-xl transition-all cursor-pointer ${activeCategory === 'CUSTOMER' ? 'bg-slate-800 text-white shadow-md font-black' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'}`}>b. Customer</button>
        <button onClick={() => setActiveCategory('PRICING')} className={`py-3 rounded-xl transition-all cursor-pointer ${activeCategory === 'PRICING' ? 'bg-slate-800 text-white shadow-md font-black' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'}`}>c. Master Harga</button>
      </div>

      {activeCategory === 'INTERNAL' && (
        <Card className="p-4 bg-white space-y-3">
          <div className="flex justify-between items-center pb-2 border-b">
            <div>
              <h3 className="font-black text-sm text-slate-900">Manajemen User Internal</h3>
              <p className="text-[11px] text-slate-500">Kelola akun Operator, Supervisor, Admin, dan Management.</p>
            </div>
            <Button onClick={() => setIsAddUserOpen(true)} className="py-2 px-3 text-xs bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"><Plus size={15} /> Staff Baru</Button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allUsers.map(u => (
              <div key={u.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black uppercase text-slate-900 truncate">{u.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold text-[9px]">{u.role}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">@{u.username} — Divisi: {(Array.isArray(u.divisions) ? u.divisions : []).join(', ')}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setEditUserTarget(u)} className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 cursor-pointer" title="Edit Staff"><Edit size={14} /></button>
                  {canResetPassword && (
                    <button onClick={() => { setEditPasswordTarget(u); setNewPasswordValue(''); }} className="p-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg text-amber-800 cursor-pointer" title="Reset Password"><Key size={14} /></button>
                  )}
                  <button onClick={() => handleToggleUserActive(u)} className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${u.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{u.isActive !== false ? 'AKTIF' : 'NON-AKTIF'}</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeCategory === 'CUSTOMER' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-slate-200 p-1 rounded-xl text-xs font-bold">
            <button onClick={() => setCustomerSubTab('DRIVERS')} className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer ${customerSubTab === 'DRIVERS' ? 'bg-slate-800 text-white shadow-xs font-black' : 'text-slate-700 hover:bg-slate-300/60'}`}>Sopir Tandon</button>
            <button onClick={() => setCustomerSubTab('TANGKI_CUST')} className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer ${customerSubTab === 'TANGKI_CUST' ? 'bg-slate-800 text-white shadow-xs font-black' : 'text-slate-700 hover:bg-slate-300/60'}`}>Pelanggan Tangki</button>
            <button onClick={() => setCustomerSubTab('GALLON_CUST')} className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer ${customerSubTab === 'GALLON_CUST' ? 'bg-slate-800 text-white shadow-xs font-black' : 'text-slate-700 hover:bg-slate-300/60'}`}>Pelanggan Gallon</button>
            <button onClick={() => setCustomerSubTab('SHIPS')} className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer ${customerSubTab === 'SHIPS' ? 'bg-slate-800 text-white shadow-xs font-black' : 'text-slate-700 hover:bg-slate-300/60'}`}>Kapal & Agen</button>
          </div>

          {customerSubTab === 'DRIVERS' && (
            <Card className="p-4 bg-white space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="font-black text-sm text-slate-900">Master Sopir Tandon & Portal Akses</h3>
                  <p className="text-[11px] text-slate-500">Kelola sopir tandon beserta kredensial login portal sopir.</p>
                </div>
                {canEditCustomer && (
                  <Button onClick={() => { setDriverName(''); setDriverUsername(''); setDriverPassword(''); setIsAddDriverOpen(true); }} className="py-2 px-3 text-xs bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"><Plus size={15} /> Sopir Baru</Button>
                )}
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {drivers.map(d => (
                  <div key={d.id} className="p-3 bg-slate-50 border rounded-xl text-xs flex justify-between items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-black uppercase text-slate-900 block truncate">{d.name}</span>
                      <span className="text-[10px] text-slate-500">Portal Login: {d.username ? `@${d.username}` : <span className="text-amber-600 italic">Belum ada akun portal</span>}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canEditCustomer && (
                        <>
                          <button onClick={() => setEditDriverTarget(d)} className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 cursor-pointer" title="Edit Sopir"><Edit size={14} /></button>
                          <button onClick={async () => {
                            const updated = drivers.filter(x => x.id !== d.id);
                            setDrivers(updated);
                            setLocalData('tandon_drivers', updated);
                            try { await deleteDoc(getDocPath('drivers', d.id)); } catch(e){}
                          }} className="p-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 cursor-pointer" title="Hapus Sopir"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {customerSubTab === 'TANGKI_CUST' && (
            <Card className="p-4 bg-white space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="font-black text-sm text-slate-900">Pelanggan Mobil Tangki & Portal</h3>
                  <p className="text-[11px] text-slate-500">Kelola pelanggan tangki beserta akses login portal customer.</p>
                </div>
                {canEditCustomer && (
                  <Button onClick={() => { setTangkiName(''); setTangkiCustPrice(tangkiPrice); setTangkiUsername(''); setTangkiPassword(''); setIsAddTangkiOpen(true); }} className="py-2 px-3 text-xs bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"><Plus size={15} /> Pelanggan Baru</Button>
                )}
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {tangkiCust.map(c => (
                  <div key={c.id} className="p-3 bg-slate-50 border rounded-xl text-xs flex justify-between items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-black uppercase text-slate-900 block truncate">{c.name}</span>
                      <span className="text-[10px] text-slate-500">Rp {(c.price || tangkiPrice).toLocaleString('id-ID')} / Tangki — Portal: {c.username ? `@${c.username}` : <span className="text-amber-600 italic">Belum ada akun</span>}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canEditCustomer && (
                        <>
                          <button onClick={() => setEditTangkiTarget(c)} className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 cursor-pointer" title="Edit Pelanggan"><Edit size={14} /></button>
                          <button onClick={async () => {
                            const updated = tangkiCust.filter(x => x.id !== c.id);
                            setTangkiCust(updated);
                            setLocalData('tangki_customers', updated);
                            try { await deleteDoc(getDocPath('tangki_customers', c.id)); } catch(e){}
                          }} className="p-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 cursor-pointer" title="Hapus Pelanggan"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {customerSubTab === 'GALLON_CUST' && (
            <Card className="p-4 bg-white space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="font-black text-sm text-slate-900">Pelanggan Air Gallon & Portal</h3>
                  <p className="text-[11px] text-slate-500">Kelola depot/konsumen gallon beserta akun portal.</p>
                </div>
                {canEditCustomer && (
                  <Button onClick={() => { setGallonName(''); setGallonType('Konsumen'); setGallonCustPrice(gallonPrice); setGallonUsername(''); setGallonPassword(''); setIsAddGallonOpen(true); }} className="py-2 px-3 text-xs bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"><Plus size={15} /> Pelanggan Baru</Button>
                )}
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {gallonCust.map(c => (
                  <div key={c.id} className="p-3 bg-slate-50 border rounded-xl text-xs flex justify-between items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-black uppercase text-slate-900 block truncate">{c.name} ({c.customerType})</span>
                      <span className="text-[10px] text-slate-500">Rp {(c.price || gallonPrice).toLocaleString('id-ID')} / Gallon — Portal: {c.username ? `@${c.username}` : <span className="text-amber-600 italic">Belum ada akun</span>}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canEditCustomer && (
                        <>
                          <button onClick={() => setEditGallonTarget(c)} className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 cursor-pointer" title="Edit Pelanggan"><Edit size={14} /></button>
                          <button onClick={async () => {
                            const updated = gallonCust.filter(x => x.id !== c.id);
                            setGallonCust(updated);
                            setLocalData('gallon_customers', updated);
                            try { await deleteDoc(getDocPath('gallon_customers', c.id)); } catch(e){}
                          }} className="p-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 cursor-pointer" title="Hapus Pelanggan"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {customerSubTab === 'SHIPS' && (
            <Card className="p-4 bg-white space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h3 className="font-black text-sm text-slate-900">Master Kapal, Agen & Portal</h3>
                  <p className="text-[11px] text-slate-500">Kelola kapal sandar & agen pelayaran beserta akses portal.</p>
                </div>
                {canEditCustomer && (
                  <Button onClick={() => { setShipName(''); setAgentName(''); setShipPrice(kapalPrice); setShipUsername(''); setShipPassword(''); setIsAddShipOpen(true); }} className="py-2 px-3 text-xs bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"><Plus size={15} /> Kapal Baru</Button>
                )}
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {ships.map(s => (
                  <div key={s.id} className="p-3 bg-slate-50 border rounded-xl text-xs flex justify-between items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-black uppercase text-slate-900 block truncate">{s.shipName}</span>
                      <span className="text-[10px] text-slate-500">Agen: {s.customerName} — Rp {(s.price || kapalPrice).toLocaleString('id-ID')}/Ton — Portal: {s.username ? `@${s.username}` : <span className="text-amber-600 italic">Belum ada akun</span>}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canEditCustomer && (
                        <>
                          <button onClick={() => setEditShipTarget(s)} className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 cursor-pointer" title="Edit Kapal"><Edit size={14} /></button>
                          <button onClick={async () => {
                            const updated = ships.filter(x => x.id !== s.id);
                            setShips(updated);
                            setLocalData('kapal_ships', updated);
                            try { await deleteDoc(getDocPath('kapal_ships', s.id)); } catch(e){}
                          }} className="p-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 cursor-pointer" title="Hapus Kapal"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeCategory === 'PRICING' && (
        <Card className="p-4 bg-white space-y-4">
          <h3 className="font-black text-sm text-slate-900 border-b pb-2">Master Harga Standar Global</h3>
          <form onSubmit={handleSavePrices} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Harga Standar Air Tandon (Rp)</label>
              <input type="number" value={tandonPrice} onChange={(e) => setTandonPrice(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Harga Standar Air Gallon (Rp)</label>
              <input type="number" value={gallonPrice} onChange={(e) => setGallonPrice(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Harga Standar Mobil Tangki (Rp)</label>
              <input type="number" value={tangkiPrice} onChange={(e) => setTangkiPrice(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Harga Standar Air Kapal per Ton (Rp)</label>
              <input type="number" value={kapalPrice} onChange={(e) => setKapalPrice(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
            </div>
            <Button type="submit" className="w-full py-3 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer">Simpan Harga Global</Button>
          </form>
        </Card>
      )}

      <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="Tambah Staff / User Internal">
        <form onSubmit={handleAddUser} className="space-y-3">
          {userError && <div className="p-2.5 bg-red-50 text-red-700 rounded-xl text-xs">{userError}</div>}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Nama Lengkap</label>
            <input type="text" value={newUserName} onChange={e=>setNewUserName(e.target.value)} placeholder="Nama Staff" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Username</label>
            <input type="text" value={newUserUsername} onChange={e=>setNewUserUsername(e.target.value)} placeholder="username" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold lowercase" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Password</label>
            <input type="password" value={newUserPassword} onChange={e=>setNewUserPassword(e.target.value)} placeholder="••••••••" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Role Akses</label>
            <select value={newUserRole} onChange={e=>setNewUserRole(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold">
              <option value="OPERATOR">Operator</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="ADMIN">Administrator</option>
              <option value="MANAGEMENT">Management (Read-Only)</option>
              <option value="SUPER_ADMIN">Super Administrator</option>
            </select>
          </div>
          {newUserRole !== 'MANAGEMENT' && (
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Divisi Ditugaskan (Wajib Pilih min. 1)</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                {['TANDON', 'GALLON', 'MOBIL_TANGKI', 'AIR_KAPAL', 'INDUSTRIAL_GAS'].map(div => (
                  <label key={div} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border cursor-pointer">
                    <input type="checkbox" checked={newUserDivisions.includes(div)} onChange={(e) => {
                      if (e.target.checked) setNewUserDivisions([...newUserDivisions, div]);
                      else setNewUserDivisions(newUserDivisions.filter(d => d !== div));
                    }} />
                    <span>{div}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <Button type="submit" className="w-full py-3 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer">Simpan User Baru</Button>
        </form>
      </Modal>

      <Modal isOpen={!!editUserTarget} onClose={() => setEditUserTarget(null)} title="Edit Staff / User Internal">
        {editUserTarget && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const updatedList = allUsers.map(u => u.id === editUserTarget.id ? editUserTarget : u);
            setAllUsers(updatedList);
            setLocalData('all_users', updatedList);
            setEditUserTarget(null);
            try { await setDoc(getDocPath('users', editUserTarget.id), editUserTarget); } catch(err){}
          }} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Nama Lengkap</label>
              <input type="text" value={editUserTarget.name || ''} onChange={e=>setEditUserTarget({...editUserTarget, name: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Role Akses</label>
              <select value={editUserTarget.role || 'OPERATOR'} onChange={e=>setEditUserTarget({...editUserTarget, role: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold">
                <option value="OPERATOR">Operator</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Administrator</option>
                <option value="MANAGEMENT">Management (Read-Only)</option>
                <option value="SUPER_ADMIN">Super Administrator</option>
              </select>
            </div>
            {editUserTarget.role !== 'MANAGEMENT' && (
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Divisi Ditugaskan</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  {['TANDON', 'GALLON', 'MOBIL_TANGKI', 'AIR_KAPAL', 'INDUSTRIAL_GAS'].map(div => {
                    const divs = Array.isArray(editUserTarget.divisions) ? editUserTarget.divisions : [];
                    return (
                      <label key={div} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border cursor-pointer">
                        <input type="checkbox" checked={divs.includes(div)} onChange={(e) => {
                          const newDivs = e.target.checked ? [...divs, div] : divs.filter(d => d !== div);
                          setEditUserTarget({...editUserTarget, divisions: newDivs});
                        }} />
                        <span>{div}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <Button type="submit" className="w-full py-3 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer">Simpan Perubahan</Button>
          </form>
        )}
      </Modal>

      <Modal isOpen={!!editPasswordTarget} onClose={() => setEditPasswordTarget(null)} title="Reset Password User">
        {editPasswordTarget && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!newPasswordValue) return;
            const updatedList = allUsers.map(u => u.id === editPasswordTarget.id ? { ...u, password: newPasswordValue } : u);
            setAllUsers(updatedList);
            setLocalData('all_users', updatedList);
            setEditPasswordTarget(null);
            setNewPasswordValue('');
            try { await updateDoc(getDocPath('users', editPasswordTarget.id), { password: newPasswordValue }); } catch(err){}
            alert('Password berhasil direset!');
          }} className="space-y-3">
            <p className="text-xs text-slate-600">Reset password untuk <strong>{editPasswordTarget.name}</strong> (@{editPasswordTarget.username}):</p>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Password Baru</label>
              <input type="password" value={newPasswordValue} onChange={e=>setNewPasswordValue(e.target.value)} placeholder="••••••••" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
            </div>
            <Button type="submit" className="w-full py-3 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer">Konfirmasi Reset Password</Button>
          </form>
        )}
      </Modal>

      <Modal isOpen={isAddDriverOpen} onClose={() => setIsAddDriverOpen(false)} title="Tambah Sopir Tandon & Akun Portal">
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!driverName.trim()) return;
          const cleanName = driverName.trim().toUpperCase();
          const cleanUsername = (driverUsername.trim() || driverName.replace(/\s+/g, '').toLowerCase());
          const docId = 'drv_' + Date.now();
          const newD = { id: docId, name: cleanName, username: cleanUsername, password: driverPassword || '123456', createdAt: Date.now() };
          const newPortalUser = {
            id: 'usr_drv_' + Date.now(),
            name: cleanName,
            username: cleanUsername,
            password: driverPassword || '123456',
            role: 'DRIVER',
            divisions: ['TANDON'],
            isActive: true,
            createdAt: Date.now()
          };
          const updated = [...drivers, newD];
          setDrivers(updated);
          setLocalData('tandon_drivers', updated);
          
          const updatedUsers = [...allUsers, newPortalUser];
          setAllUsers(updatedUsers);
          setLocalData('all_users', updatedUsers);

          setIsAddDriverOpen(false); setDriverName(''); setDriverUsername(''); setDriverPassword('');
          try { 
            await setDoc(getDocPath('drivers', docId), newD); 
            await setDoc(getDocPath('users', newPortalUser.id), newPortalUser);
          } catch(err){}
        }} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Nama Lengkap Sopir</label>
            <input type="text" value={driverName} onChange={e => { setDriverName(e.target.value); if (!driverUsername) setDriverUsername(e.target.value.replace(/\s+/g, '').toLowerCase()); }} placeholder="NAMA SOPIR" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Username Portal Sopir</label>
            <input type="text" value={driverUsername} onChange={e=>setDriverUsername(e.target.value)} placeholder="username_sopir" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold lowercase" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Password Portal</label>
            <input type="password" value={driverPassword} onChange={e=>setDriverPassword(e.target.value)} placeholder="•••••••• (Default: 123456)" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" />
          </div>
          <Button type="submit" className="w-full py-3 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer">Simpan Sopir & Akun Portal</Button>
        </form>
      </Modal>

      <Modal isOpen={!!editDriverTarget} onClose={() => setEditDriverTarget(null)} title="Edit Sopir Tandon">
        {editDriverTarget && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const updated = drivers.map(d => d.id === editDriverTarget.id ? editDriverTarget : d);
            setDrivers(updated);
            setLocalData('tandon_drivers', updated);
            setEditDriverTarget(null);
            try { await setDoc(getDocPath('drivers', editDriverTarget.id), editDriverTarget); } catch(err){}
          }} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Nama Lengkap Sopir</label>
              <input type="text" value={editDriverTarget.name || ''} onChange={e=>setEditDriverTarget({...editDriverTarget, name: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Username Portal</label>
              <input type="text" value={editDriverTarget.username || ''} onChange={e=>setEditDriverTarget({...editDriverTarget, username: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold lowercase" />
            </div>
            {canResetPassword && (
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Password Portal Baru</label>
                <input type="password" value={editDriverTarget.password || ''} onChange={e=>setEditDriverTarget({...editDriverTarget, password: e.target.value})} placeholder="Biarkan kosong jika tidak diubah" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" />
              </div>
            )}
            <Button type="submit" className="w-full py-3 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer">Simpan Perubahan</Button>
          </form>
        )}
      </Modal>

      <Modal isOpen={isAddTangkiOpen} onClose={() => setIsAddTangkiOpen(false)} title="Tambah Pelanggan Tangki & Portal">
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!tangkiName.trim()) return;
          const cleanName = tangkiName.trim().toUpperCase();
          const cleanUsername = (tangkiUsername.trim() || tangkiName.replace(/\s+/g, '').toLowerCase());
          const docId = 'tcust_' + Date.now();
          const newC = { id: docId, name: cleanName, price: Number(tangkiCustPrice), username: cleanUsername, password: tangkiPassword || '123456', createdAt: Date.now() };
          const newPortalUser = {
            id: 'usr_tc_' + Date.now(),
            name: cleanName,
            username: cleanUsername,
            password: tangkiPassword || '123456',
            role: 'CUSTOMER',
            divisions: ['MOBIL_TANGKI'],
            isActive: true,
            createdAt: Date.now()
          };
          const updated = [...tangkiCust, newC];
          setTangkiCust(updated);
          setLocalData('tangki_customers', updated);

          const updatedUsers = [...allUsers, newPortalUser];
          setAllUsers(updatedUsers);
          setLocalData('all_users', updatedUsers);

          setIsAddTangkiOpen(false); setTangkiName(''); setTangkiUsername(''); setTangkiPassword('');
          try { 
            await setDoc(getDocPath('tangki_customers', docId), newC); 
            await setDoc(getDocPath('users', newPortalUser.id), newPortalUser);
          } catch(e){}
        }} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Nama Pelanggan Tangki</label>
            <input type="text" value={tangkiName} onChange={e => { setTangkiName(e.target.value); if(!tangkiUsername) setTangkiUsername(e.target.value.replace(/\s+/g, '').toLowerCase()); }} placeholder="NAMA PELANGGAN" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Harga Khusus per Tangki (Rp)</label>
            <input type="number" value={tangkiCustPrice} onChange={e=>setTangkiCustPrice(e.target.value)} placeholder="350000" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Username Portal</label>
            <input type="text" value={tangkiUsername} onChange={e=>setTangkiUsername(e.target.value)} placeholder="username" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold lowercase" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Password Portal</label>
            <input type="password" value={tangkiPassword} onChange={e=>setTangkiPassword(e.target.value)} placeholder="•••••••• (Default: 123456)" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" />
          </div>
          <Button type="submit" className="w-full py-3 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer">Simpan Pelanggan & Akun Portal</Button>
        </form>
      </Modal>

      <Modal isOpen={!!editTangkiTarget} onClose={() => setEditTangkiTarget(null)} title="Edit Pelanggan Tangki">
        {editTangkiTarget && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const updated = tangkiCust.map(c => c.id === editTangkiTarget.id ? editTangkiTarget : c);
            setTangkiCust(updated);
            setLocalData('tangki_customers', updated);
            setEditTangkiTarget(null);
            try { await setDoc(getDocPath('tangki_customers', editTangkiTarget.id), editTangkiTarget); } catch(err){}
          }} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Nama Pelanggan</label>
              <input type="text" value={editTangkiTarget.name || ''} onChange={e=>setEditTangkiTarget({...editTangkiTarget, name: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Harga per Tangki (Rp)</label>
              <input type="number" value={editTangkiTarget.price || tangkiPrice} onChange={e=>setEditTangkiTarget({...editTangkiTarget, price: Number(e.target.value)})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Username Portal</label>
              <input type="text" value={editTangkiTarget.username || ''} onChange={e=>setEditTangkiTarget({...editTangkiTarget, username: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold lowercase" />
            </div>
            {canResetPassword && (
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Password Portal Baru</label>
                <input type="password" value={editTangkiTarget.password || ''} onChange={e=>setEditTangkiTarget({...editTangkiTarget, password: e.target.value})} placeholder="Biarkan kosong jika tidak diubah" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" />
              </div>
            )}
            <Button type="submit" className="w-full py-3 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer">Simpan Perubahan</Button>
          </form>
        )}
      </Modal>

      <Modal isOpen={isAddGallonOpen} onClose={() => setIsAddGallonOpen(false)} title="Tambah Pelanggan Gallon & Portal">
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!gallonName.trim()) return;
          const cleanName = gallonName.trim().toUpperCase();
          const cleanUsername = (gallonUsername.trim() || gallonName.replace(/\s+/g, '').toLowerCase());
          const docId = 'gcust_' + Date.now();
          const newG = { id: docId, name: cleanName, customerType: gallonType, price: Number(gallonCustPrice), username: cleanUsername, password: gallonPassword || '123456', createdAt: Date.now() };
          const newPortalUser = {
            id: 'usr_gc_' + Date.now(),
            name: cleanName,
            username: cleanUsername,
            password: gallonPassword || '123456',
            role: 'CUSTOMER',
            divisions: ['GALLON'],
            isActive: true,
            createdAt: Date.now()
          };
          const updated = [...gallonCust, newG];
          setGallonCust(updated);
          setLocalData('gallon_customers', updated);

          const updatedUsers = [...allUsers, newPortalUser];
          setAllUsers(updatedUsers);
          setLocalData('all_users', updatedUsers);

          setIsAddGallonOpen(false); setGallonName(''); setGallonUsername(''); setGallonPassword('');
          try { 
            await setDoc(getDocPath('gallon_customers', docId), newG); 
            await setDoc(getDocPath('users', newPortalUser.id), newPortalUser);
          } catch(e){}
        }} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Nama Pelanggan / Toko</label>
            <input type="text" value={gallonName} onChange={e => { setGallonName(e.target.value); if(!gallonUsername) setGallonUsername(e.target.value.replace(/\s+/g, '').toLowerCase()); }} placeholder="TOKO MAJU JAYA" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Kategori</label>
            <select value={gallonType} onChange={e=>setGallonType(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold">
              <option value="Konsumen">Konsumen Langsung</option>
              <option value="Reseller">Reseller / Depot</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Harga per Gallon (Rp)</label>
            <input type="number" value={gallonCustPrice} onChange={e=>setGallonCustPrice(e.target.value)} placeholder="6000" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Username Portal</label>
            <input type="text" value={gallonUsername} onChange={e=>setGallonUsername(e.target.value)} placeholder="username" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold lowercase" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Password Portal</label>
            <input type="password" value={gallonPassword} onChange={e=>setGallonPassword(e.target.value)} placeholder="•••••••• (Default: 123456)" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" />
          </div>
          <Button type="submit" className="w-full py-3 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer">Simpan Pelanggan & Akun Portal</Button>
        </form>
      </Modal>

      <Modal isOpen={!!editGallonTarget} onClose={() => setEditGallonTarget(null)} title="Edit Pelanggan Gallon">
        {editGallonTarget && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const updated = gallonCust.map(c => c.id === editGallonTarget.id ? editGallonTarget : c);
            setGallonCust(updated);
            setLocalData('gallon_customers', updated);
            setEditGallonTarget(null);
            try { await setDoc(getDocPath('gallon_customers', editGallonTarget.id), editGallonTarget); } catch(err){}
          }} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Nama Pelanggan / Toko</label>
              <input type="text" value={editGallonTarget.name || ''} onChange={e=>setEditGallonTarget({...editGallonTarget, name: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Kategori</label>
              <select value={editGallonTarget.customerType || 'Konsumen'} onChange={e=>setEditGallonTarget({...editGallonTarget, customerType: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold">
                <option value="Konsumen">Konsumen Langsung</option>
                <option value="Reseller">Reseller / Depot</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Harga per Gallon (Rp)</label>
              <input type="number" value={editGallonTarget.price || gallonPrice} onChange={e=>setEditGallonTarget({...editGallonTarget, price: Number(e.target.value)})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Username Portal</label>
              <input type="text" value={editGallonTarget.username || ''} onChange={e=>setEditGallonTarget({...editGallonTarget, username: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold lowercase" />
            </div>
            {canResetPassword && (
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Password Portal Baru</label>
                <input type="password" value={editGallonTarget.password || ''} onChange={e=>setEditGallonTarget({...editGallonTarget, password: e.target.value})} placeholder="Biarkan kosong jika tidak diubah" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" />
              </div>
            )}
            <Button type="submit" className="w-full py-3 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer">Simpan Perubahan</Button>
          </form>
        )}
      </Modal>

      <Modal isOpen={isAddShipOpen} onClose={() => setIsAddShipOpen(false)} title="Tambah Kapal & Agen Portal">
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!shipName.trim() || !agentName.trim()) return;
          const cleanShip = shipName.trim().toUpperCase();
          const cleanAgent = agentName.trim().toUpperCase();
          const cleanUsername = (shipUsername.trim() || shipName.replace(/\s+/g, '').toLowerCase());
          const docId = 'ship_' + Date.now();
          const newS = { id: docId, shipName: cleanShip, customerName: cleanAgent, price: Number(shipPrice), username: cleanUsername, password: shipPassword || '123456', createdAt: Date.now() };
          const newPortalUser = {
            id: 'usr_ship_' + Date.now(),
            name: `${cleanShip} (${cleanAgent})`,
            username: cleanUsername,
            password: shipPassword || '123456',
            role: 'CUSTOMER',
            divisions: ['AIR_KAPAL'],
            isActive: true,
            createdAt: Date.now()
          };
          const updated = [...ships, newS];
          setShips(updated);
          setLocalData('kapal_ships', updated);

          const updatedUsers = [...allUsers, newPortalUser];
          setAllUsers(updatedUsers);
          setLocalData('all_users', updatedUsers);

          setIsAddShipOpen(false); setShipName(''); setAgentName(''); setShipUsername(''); setShipPassword('');
          try { 
            await setDoc(getDocPath('kapal_ships', docId), newS); 
            await setDoc(getDocPath('users', newPortalUser.id), newPortalUser);
          } catch(e){}
        }} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Nama Kapal</label>
            <input type="text" value={shipName} onChange={e => { setShipName(e.target.value); if(!shipUsername) setShipUsername(e.target.value.replace(/\s+/g, '').toLowerCase()); }} placeholder="KM. SEJAHTERA" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Nama Agen / Customer</label>
            <input type="text" value={agentName} onChange={e=>setAgentName(e.target.value)} placeholder="PT PELAYARAN MAJU" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Harga per Ton (Rp)</label>
            <input type="number" value={shipPrice} onChange={e=>setShipPrice(e.target.value)} placeholder="50000" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Username Portal</label>
            <input type="text" value={shipUsername} onChange={e=>setShipUsername(e.target.value)} placeholder="username" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold lowercase" required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Password Portal</label>
            <input type="password" value={shipPassword} onChange={e=>setShipPassword(e.target.value)} placeholder="•••••••• (Default: 123456)" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" />
          </div>
          <Button type="submit" className="w-full py-3 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer">Simpan Kapal & Akun Portal</Button>
        </form>
      </Modal>

      <Modal isOpen={!!editShipTarget} onClose={() => setEditShipTarget(null)} title="Edit Kapal & Agen">
        {editShipTarget && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const updated = ships.map(s => s.id === editShipTarget.id ? editShipTarget : s);
            setShips(updated);
            setLocalData('kapal_ships', updated);
            setEditShipTarget(null);
            try { await setDoc(getDocPath('kapal_ships', editShipTarget.id), editShipTarget); } catch(err){}
          }} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Nama Kapal</label>
              <input type="text" value={editShipTarget.shipName || ''} onChange={e=>setEditShipTarget({...editShipTarget, shipName: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Nama Agen / Customer</label>
              <input type="text" value={editShipTarget.customerName || ''} onChange={e=>setEditShipTarget({...editShipTarget, customerName: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Harga per Ton (Rp)</label>
              <input type="number" value={editShipTarget.price || kapalPrice} onChange={e=>setEditShipTarget({...editShipTarget, price: Number(e.target.value)})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Username Portal</label>
              <input type="text" value={editShipTarget.username || ''} onChange={e=>setEditShipTarget({...editShipTarget, username: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold lowercase" />
            </div>
            {canResetPassword && (
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Password Portal Baru</label>
                <input type="password" value={editShipTarget.password || ''} onChange={e=>setEditShipTarget({...editShipTarget, password: e.target.value})} placeholder="Biarkan kosong jika tidak diubah" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" />
              </div>
            )}
            <Button type="submit" className="w-full py-3 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer">Simpan Perubahan</Button>
          </form>
        )}
      </Modal>
    </div>
  );
};

const DivisionSelector = ({ user, onSelectDivision }) => {
  const isManagement = user.role === 'MANAGEMENT';

  const divisions = [
    { id: 'TANDON', name: 'Air Tandon', desc: 'Distribusi air tandon via sopir', icon: Droplet, color: 'border-blue-200 bg-blue-50 text-blue-700' },
    { id: 'GALLON', name: 'Air Gallon', desc: 'Pengisian dan penjualan gallon air', icon: Package, color: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
    { id: 'MOBIL_TANGKI', name: 'Mobil Tangki', desc: 'Distribusi air bersih mobil tangki', icon: Truck, color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { id: 'AIR_KAPAL', name: 'Air Kapal', desc: 'Pasokan air bersih kapal sandar', icon: Anchor, color: 'border-cyan-200 bg-cyan-50 text-cyan-700' },
    { id: 'INDUSTRIAL_GAS', name: 'Gas Industri', desc: 'Tabung gas industri & pengelasan', icon: Flame, color: 'border-orange-200 bg-orange-50 text-orange-700' },
  ];

  const allowedDivisions = isManagement ? divisions : divisions.filter(d => (Array.isArray(user.divisions) ? user.divisions : []).some(divKey => String(divKey).toUpperCase() === d.id));

  return (
    <div className="max-w-md sm:max-w-xl mx-auto px-4 py-6 space-y-5 pb-24">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <GalanganKalimasLogo size="sm" />
        <div className="text-right">
          <p className="text-xs font-black uppercase text-slate-900">{user.name}</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{user.role}</span>
        </div>
      </div>

      {isManagement && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-bold text-amber-800 flex items-center justify-center gap-2"><Eye size={16} /> Mode Management (Read-Only Akses Lengkap)</div>}

      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Pilih Divisi Operasional</h3>
        <div className="grid gap-3">
          {allowedDivisions.map(div => {
            const Icon = div.icon;
            const cardStyle = isManagement ? 'border-slate-300 bg-slate-100 text-slate-600' : div.color;
            return (
              <Card key={div.id} onClick={() => onSelectDivision(div.id)} className={`p-4 border-2 flex items-center justify-between cursor-pointer hover:shadow-md transition-all ${cardStyle}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isManagement ? 'bg-slate-200 text-slate-700' : 'bg-white shadow-xs'}`}><Icon size={24} /></div>
                  <div>
                    <h4 className="font-extrabold text-sm uppercase">{div.name}</h4>
                    <p className="text-xs opacity-80">{div.desc}</p>
                  </div>
                </div>
                <ChevronRight size={18} />
              </Card>
            );
          })}
        </div>
      </div>

      {(['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'MANAGEMENT'].includes(user.role)) && (
        <div className="pt-2 space-y-2">
          <Card onClick={() => onSelectDivision('REPORTS')} className="p-4 border-2 border-purple-200 bg-purple-50 text-purple-700 flex items-center justify-between cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white shadow-xs"><PieChart size={24} /></div>
              <div>
                <h4 className="font-extrabold text-sm uppercase">Laporan Operasional</h4>
                <p className="text-xs opacity-80">Rekapitulasi omset & grafik eksekutif</p>
              </div>
            </div>
            <ChevronRight size={18} />
          </Card>

          {(['ADMIN', 'SUPER_ADMIN'].includes(user.role)) && (
            <Button variant="secondary" onClick={() => onSelectDivision('ADMIN')} className="w-full py-3.5 shadow-sm flex items-center justify-center gap-2 bg-slate-800 text-white hover:bg-slate-900 cursor-pointer">
              <Settings size={18} /> Panel Admin
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const MainApp = () => {
  const { sessionUser, logout, systemInitialized } = useContext(AuthContext);
  const [currentView, setCurrentView] = useState('HOME');

  useEffect(() => { setCurrentView('HOME'); }, [sessionUser?.id]);

  if (!systemInitialized) return <SystemInitScreen />;
  if (!sessionUser) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 flex justify-between items-center shadow-xs">
        <GalanganKalimasLogo size="sm" />
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-slate-900 block">{sessionUser.name}</span>
            <span className="text-[10px] text-slate-500 uppercase">{sessionUser.role}</span>
          </div>
          <button onClick={() => { logout(); setCurrentView('HOME'); }} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all cursor-pointer" title="Keluar"><LogOut size={16} /></button>
        </div>
      </header>
      <main>
        {currentView === 'HOME' && <DivisionSelector user={sessionUser} onSelectDivision={(div) => setCurrentView(div)} />}
        {currentView === 'TANDON' && <TandonOperator user={sessionUser} onNavigateHome={() => setCurrentView('HOME')} />}
        {currentView === 'GALLON' && <GallonOperator user={sessionUser} onNavigateHome={() => setCurrentView('HOME')} />}
        {currentView === 'MOBIL_TANGKI' && <TangkiOperator user={sessionUser} onNavigateHome={() => setCurrentView('HOME')} />}
        {currentView === 'AIR_KAPAL' && <AirKapalOperator user={sessionUser} onNavigateHome={() => setCurrentView('HOME')} />}
        {currentView === 'INDUSTRIAL_GAS' && <GasOperator user={sessionUser} onNavigateHome={() => setCurrentView('HOME')} />}
        {currentView === 'REPORTS' && <ReportsModule user={sessionUser} onNavigateHome={() => setCurrentView('HOME')} />}
        {currentView === 'ADMIN' && <AdminPanel onNavigateHome={() => setCurrentView('HOME')} />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
