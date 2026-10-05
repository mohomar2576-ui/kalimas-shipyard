import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, updateDoc } from 'firebase/firestore';
import { 
  Users, Settings, Plus, X, LogOut, Droplet, Package, 
  Flame, ChevronRight, ArrowLeft, Truck,
  Share2, Anchor, Trash2, 
  PieChart, Key, Ban, Check, Edit
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
    let d = (typeof date.toDate === 'function') ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) d = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Makassar', year: 'numeric', month: '2-digit', day: '2-digit' });
    const parts = formatter.formatToParts(d);
    return `${parts.find(p=>p.type==='year').value}-${parts.find(p=>p.type==='month').value}-${parts.find(p=>p.type==='day').value}`;
  } catch (err) {
    return new Date(Date.now() + (8 * 3600 * 1000)).toISOString().split('T')[0];
  }
};

const getAdjacentDateString = (dateStr = getMakassarDateString(), offset = 0) => {
  try {
    const parts = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + offset));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  } catch (err) { return getMakassarDateString(); }
};

const getMakassarTimeString = (timestamp = Date.now()) => {
  try {
    let d = (typeof timestamp.toDate === 'function') ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(d.getTime())) return '--:--';
    return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Makassar', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  } catch (err) { return '--:--'; }
};

const getLocalData = (key, fallback) => {
  try {
    const item = localStorage.getItem(`kalimas_${key}`);
    if (item) {
      const parsed = JSON.parse(item);
      if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
      return parsed;
    }
    return fallback;
  } catch (e) { return fallback; }
};

const setLocalData = (key, value) => {
  try { localStorage.setItem(`kalimas_${key}`, JSON.stringify(value)); } catch (e) {}
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-emerald-900 text-white flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
          <div className="w-16 h-16 bg-red-600/20 text-red-500 rounded-2xl flex items-center justify-center text-3xl font-black">!</div>
          <h2 className="text-xl font-black uppercase tracking-tight">Sistem Mengalami Kendala</h2>
          <p className="text-xs text-emerald-200 max-w-sm">{this.state.error?.toString() || 'Kesalahan teknis tak terduga.'}</p>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer">
            Reset Data & Muat Ulang POS
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const GalanganKalimasLogo = ({ size = 'md', variant = 'color', className = '' }) => {
  const sizes = { sm: { h: 'h-8', t1: 'text-sm', t2: 'text-[8px]' }, md: { h: 'h-12', t1: 'text-lg', t2: 'text-[10px]' }, lg: { h: 'h-16', t1: 'text-2xl', t2: 'text-xs' } };
  const s = sizes[size] || sizes.md;
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <img 
        src="GK Logo Only.svg" 
        alt="Galangan Kalimas Logo" 
        className={`${s.h} w-auto object-contain shrink-0 drop-shadow-sm`} 
      />
      <div className="flex flex-col leading-none justify-center">
        <span className={`font-black tracking-wider uppercase font-sans ${s.t1} ${variant==='light'?'text-white':'text-slate-900'}`}>KALIMAS</span>
        <span className={`font-bold tracking-[0.22em] uppercase mt-0.5 ${s.t2} text-[#DE5D36]`}>SHIPYARD</span>
      </div>
    </div>
  );
};

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer select-none shadow-sm";
  const v = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20",
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20",
    indigo: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20",
    cyan: "bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-500/20",
    purple: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20",
    orange: "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20",
    outline: "border-2 border-slate-300 hover:bg-slate-100 text-slate-700 shadow-none",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20",
    darkGreen: "bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-900/20"
  };
  return <button className={`${base} ${v[variant] || v.primary} ${className}`} {...props}>{children}</button>;
};

const Card = ({ children, className = '', ...props }) => (
  <div className={`rounded-2xl border border-slate-200/80 shadow-xs ${className.includes('bg-')?'':'bg-white'} ${className}`} {...props}>{children}</div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-2 border-b">
          <h3 className="font-bold text-base text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"><X size={18} /></button>
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
  const [systemInitialized, setSystemInitialized] = useState(() => {
    const localInit = getLocalData('sys_init', false);
    const users = getLocalData('all_users', []);
    return localInit || users.length > 0;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = null;
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (err) {}
    };
    initAuth();

    const authUnsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          unsub = onSnapshot(getPublicPath('users'), (snap) => {
            const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
            if (list.length > 0) {
              setAllUsers(list); 
              setLocalData('all_users', list);
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

    const handleFocus = () => {
      try { auth.currentUser || signInAnonymously(auth); } catch (e) {}
    };
    window.addEventListener('focus', handleFocus);

    return () => { 
      authUnsub(); 
      if (unsub) unsub(); 
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const login = (username, password) => {
    const cleanUsername = username.trim().toLowerCase();
    const usersList = Array.isArray(allUsers) && allUsers.length > 0 ? allUsers : getLocalData('all_users', []);
    const user = usersList.find(u => u.username?.toLowerCase() === cleanUsername && u.password === password && u.isActive !== false);
    if (user) { setSessionUser(user); setLocalData('session_user', user); return { success: true }; }

    const checkPortal = (listKey, divisionName, roleName, nameField) => {
      const list = getLocalData(listKey, []);
      const match = list.find(c => c.username?.toLowerCase() === cleanUsername && (c.password||'123456') === password);
      if (match) {
        if (match.portalAccessEnabled === false) return { found: true, active: false };
        const u = { ...match, name: match[nameField] || match.name, role: roleName, divisions: [divisionName] };
        return { found: true, active: true, user: u };
      }
      return { found: false };
    };

    const drvCheck = checkPortal('tandon_drivers', 'TANDON', 'DRIVER', 'name');
    if (drvCheck.found) {
      if (!drvCheck.active) return { success: false, message: 'Portal Anda dinonaktifkan oleh Administrator.' };
      setSessionUser(drvCheck.user); setLocalData('session_user', drvCheck.user); return { success: true };
    }

    const tcCheck = checkPortal('tangki_customers', 'MOBIL_TANGKI', 'CUSTOMER_TANGKI', 'name');
    if (tcCheck.found) {
      if (!tcCheck.active) return { success: false, message: 'Portal Anda dinonaktifkan oleh Administrator.' };
      setSessionUser(tcCheck.user); setLocalData('session_user', tcCheck.user); return { success: true };
    }

    const gcCheck = checkPortal('gallon_customers', 'GALLON', 'CUSTOMER_GALLON', 'name');
    if (gcCheck.found) {
      if (!gcCheck.active) return { success: false, message: 'Portal Anda dinonaktifkan oleh Administrator.' };
      setSessionUser(gcCheck.user); setLocalData('session_user', gcCheck.user); return { success: true };
    }

    const shCheck = checkPortal('kapal_ships', 'AIR_KAPAL', 'CUSTOMER_KAPAL', 'shipName');
    if (shCheck.found) {
      if (!shCheck.active) return { success: false, message: 'Portal Anda dinonaktifkan oleh Administrator.' };
      setSessionUser(shCheck.user); setLocalData('session_user', shCheck.user); return { success: true };
    }

    const gsCheck = checkPortal('gas_customers', 'GAS_INDUSTRI', 'CUSTOMER_GAS', 'name');
    if (gsCheck.found) {
      if (!gsCheck.active) return { success: false, message: 'Portal Anda dinonaktifkan oleh Administrator.' };
      setSessionUser(gsCheck.user); setLocalData('session_user', gsCheck.user); return { success: true };
    }

    return { success: false, message: 'Username atau password salah / non-aktif.' };
  };

  const logout = () => { setSessionUser(null); setLocalData('session_user', null); };

  return <AuthContext.Provider value={{ sessionUser, allUsers, setAllUsers, systemInitialized, setSystemInitialized, login, logout }}>{children}</AuthContext.Provider>;
};

const SystemInitScreen = () => {
  const { setAllUsers, setSystemInitialized } = useContext(AuthContext);
  const [name, setName] = useState(''); const [user, setUser] = useState(''); const [pwd, setPwd] = useState('');

  const handleInit = async (e) => {
    e.preventDefault();
    if (!name || !user || !pwd) return;
    const admin = { id: 'usr_'+Date.now(), name, username: user.toLowerCase(), password: pwd, role: 'SUPER_ADMIN', divisions: ['TANDON', 'GALLON', 'MOBIL_TANGKI', 'AIR_KAPAL', 'GAS_INDUSTRI'], isActive: true };
    
    setAllUsers([admin]); setLocalData('all_users', [admin]);
    setSystemInitialized(true); setLocalData('sys_init', true);
    
    try { 
      await setDoc(getDocPath('users', admin.id), admin); 
      
      const defaultConfigs = [
        { key: 'tandon_config', price: 20000 },
        { key: 'gallon_config', price: 6000 },
        { key: 'tangki_config', price: 350000 },
        { key: 'kapal_config', price: 50000 },
        { key: 'gas_config', price: 150000 }
      ];
      
      await Promise.all(defaultConfigs.map(conf => 
        setDoc(getDocPath('settings', conf.key), { 
          price: conf.price, 
          updatedBy: 'SYSTEM_INIT', 
          updatedAt: Date.now() 
        }).catch(()=>{})
      ));
    } catch(err){
      console.warn("Inisialisasi tersimpan di local cache:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 space-y-5 shadow-2xl">
        <GalanganKalimasLogo size="lg" className="justify-center mb-4" />
        <h2 className="text-xl font-extrabold text-center">Inisialisasi Super Admin POS</h2>
        <form onSubmit={handleInit} className="space-y-4">
          <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Nama Lengkap" className="w-full p-3 bg-slate-50 border rounded-xl text-sm" required />
          <input type="text" value={user} onChange={e=>setUser(e.target.value)} placeholder="Username" className="w-full p-3 bg-slate-50 border rounded-xl text-sm lowercase" required />
          <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Password" className="w-full p-3 bg-slate-50 border rounded-xl text-sm" required />
          <Button type="submit" variant="emerald" className="w-full py-3.5">Buat Sistem POS</Button>
        </form>
      </div>
    </div>
  );
};

const LoginScreen = () => {
  const { login } = useContext(AuthContext);
  const [user, setUser] = useState(''); const [pwd, setPwd] = useState(''); const [err, setErr] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const res = login(user, pwd);
    if (!res.success) setErr(res.message);
  };

  return (
    <div className="min-h-screen bg-emerald-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 space-y-5 shadow-2xl border-4 border-emerald-800">
        <GalanganKalimasLogo size="lg" className="justify-center mb-4" />
        <h2 className="text-xl font-black text-center uppercase tracking-tight text-emerald-900">Login Point-of-Sales (POS)</h2>
        {err && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-100">{err}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="text" value={user} onChange={e=>setUser(e.target.value)} placeholder="Username" className="w-full p-3.5 bg-slate-50 border rounded-xl text-sm lowercase" required />
          <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Password" className="w-full p-3.5 bg-slate-50 border rounded-xl text-sm" required />
          <Button type="submit" variant="emerald" className="w-full py-4 text-sm shadow-lg">Masuk POS</Button>
        </form>
      </div>
    </div>
  );
};

const DivisionHeader = ({ title, icon: Icon, price, priceLabel, colorClass, onNavigateHome }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2.5">
      <Button variant="outline" onClick={onNavigateHome} className="p-2.5 rounded-xl border-slate-200"><ArrowLeft size={18}/></Button>
      <div>
        <span className={`text-[10px] font-black tracking-widest uppercase ${colorClass}`}>DIVISI POS</span>
        <h1 className="text-xl font-black flex items-center gap-1.5"><Icon size={20} className={colorClass} /> {title}</h1>
      </div>
    </div>
    <span className={`text-xs font-bold px-3 py-1 rounded-full border bg-slate-50 ${colorClass}`}>Rp {price.toLocaleString('id-ID')} {priceLabel}</span>
  </div>
);

const DivisionSplitStatsCards = ({ todayVol, myTodayVol, todayRev, myTodayRev, unitLabel }) => (
  <div className="grid grid-cols-2 gap-3">
    <Card className="p-3.5 bg-emerald-600 text-white space-y-1 shadow-sm border-emerald-500">
      <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block">TOTAL VOLUME</span>
      <div className="text-2xl font-black">{todayVol} <span className="text-xs font-normal">{unitLabel}</span></div>
      <div className="text-[11px] font-medium text-emerald-100 pt-1 border-t border-emerald-500/40 flex justify-between">
        <span>Input Saya:</span><span className="font-bold">{myTodayVol} {unitLabel}</span>
      </div>
    </Card>
    <Card className="p-3.5 bg-emerald-600 text-white space-y-1 shadow-sm border-emerald-500">
      <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block">TOTAL OMSET</span>
      <div className="text-xl font-black">Rp {todayRev.toLocaleString('id-ID')}</div>
      <div className="text-[11px] font-medium text-emerald-100 pt-1 border-t border-emerald-500/40 flex justify-between">
        <span>Omset Saya:</span><span className="font-bold">Rp {myTodayRev.toLocaleString('id-ID')}</span>
      </div>
    </Card>
  </div>
);

const SharedOperatorTemplate = ({ user, title, icon, unitLabel, dbKeys, priceLabel = '', textClass, variantClass, buttonVariant, onNavigateHome }) => {
  const isReadOnly = user.role === 'MANAGEMENT';
  const canVoidAny = ['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(user.role);
  const canAddEntity = !isReadOnly && !(dbKeys.divType === 'GAS_INDUSTRI' && user.role === 'OPERATOR');
  
  const fallbackPrices = useMemo(() => ({
    TANDON: 20000, GALLON: 6000, MOBIL_TANGKI: 350000, AIR_KAPAL: 50000, GAS_INDUSTRI: 150000
  }), []);

  const [activeTab, setActiveTab] = useState('INPUT'); 
  const [entities, setEntities] = useState(() => getLocalData(dbKeys.entity, []));
  const [allTx, setAllTx] = useState(() => getLocalData('transactions', []));
  const [search, setSearch] = useState('');
  
  const [globalPrice, setGlobalPrice] = useState(() => fallbackPrices[dbKeys.divType] || 20000); 
  const [shiftViewDate, setShiftViewDate] = useState('TODAY');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newCustType, setNewCustType] = useState('PENGGUNA');
  const [newAddr, setNewAddr] = useState('');
  const [newWa, setNewWa] = useState('');
  const [addError, setAddError] = useState('');

  const todayStr = useMemo(() => getMakassarDateString(), []);
  const shiftActiveDateStr = shiftViewDate === 'TODAY' ? todayStr : getAdjacentDateString(todayStr, -1);

  useEffect(() => {
    let unsubs = [];
    try {
      unsubs.push(onSnapshot(getDocPath('settings', dbKeys.config), snap => { 
        if(snap.exists() && Number(snap.data().price) > 0) {
          setGlobalPrice(Number(snap.data().price));
        } else {
          setGlobalPrice(fallbackPrices[dbKeys.divType] || 20000);
        }
      }, ()=>{}));
      
      unsubs.push(onSnapshot(getPublicPath(dbKeys.entity), snap => { 
        const l = snap.docs.map(d=>({id:d.id,...d.data()})); 
        if(Array.isArray(l)) { setEntities(l); setLocalData(dbKeys.entity, l); } 
      }, ()=>{}));
      
      unsubs.push(onSnapshot(getPublicPath('transactions'), snap => { 
        const l = snap.docs.map(d=>({id:d.id,...d.data()})); 
        if(Array.isArray(l)) { setAllTx(l); setLocalData('transactions', l); } 
      }, ()=>{}));
    } catch(e){}
    return () => unsubs.forEach(u => u && u());
  }, [dbKeys.entity, dbKeys.config, dbKeys.divType, fallbackPrices]);

  const handleAddTx = async (entity, qty = 1) => {
    if (isReadOnly || !entity) return;
    
    const safeGlobalPrice = (globalPrice > 0) ? globalPrice : (fallbackPrices[dbKeys.divType] || 20000);
    const customEntPrice = Number(entity.price);
    const unitP = (customEntPrice && customEntPrice > 0) ? customEntPrice : safeGlobalPrice;
    
    const total = qty * unitP;
    
    const docId = `tx_${dbKeys.prefix}_${Date.now()}`;
    const newTx = { 
      id: docId, entityId: entity.id, entityName: entity.name || entity.shipName, 
      operatorName: user.name, divisionType: dbKeys.divType, quantity: qty, 
      unitPrice: unitP, totalAmount: total, timestamp: Date.now(), 
      dateStr: todayStr, status: 'COMPLETED' 
    };
    
    const safeTx = Array.isArray(allTx) ? allTx : [];
    const updated = [...safeTx, newTx];
    setAllTx(updated); setLocalData('transactions', updated);
    try { await setDoc(getDocPath('transactions', docId), newTx); } catch(e){}
  };

  const handleAddNewEntity = async (e) => {
    e.preventDefault();
    const cleanName = newName.trim().toUpperCase();
    const cleanWa = newWa.trim();
    if (!cleanName || !cleanWa) {
      setAddError('Nama dan No. WhatsApp wajib diisi!');
      return;
    }

    const nameFieldKey = dbKeys.nameField;
    const safeEntities = Array.isArray(entities) ? entities : [];
    const isDuplicate = safeEntities.some(ent => (ent[nameFieldKey] || '').toUpperCase() === cleanName);
    if (isDuplicate) {
      setAddError(`Nama "${cleanName}" sudah terdaftar! Nama harus unik.`);
      return;
    }

    const docId = `${dbKeys.prefix}_${Date.now()}`;
    const cleanUser = cleanName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + Math.floor(Math.random() * 900 + 100);
    
    const newEnt = { 
      id: docId, 
      [dbKeys.nameField]: cleanName, 
      address: newAddr.trim(),
      whatsapp: cleanWa,
      price: 0, 
      username: cleanUser, 
      password: '123456', 
      portalAccessEnabled: true,
      createdAt: Date.now() 
    };

    if (dbKeys.divType === 'MOBIL_TANGKI' || dbKeys.divType === 'GAS_INDUSTRI') newEnt.companyName = newCompany.trim();
    if (dbKeys.divType === 'AIR_KAPAL') newEnt.agentName = newCompany.trim();
    if (dbKeys.divType === 'GALLON') {
      newEnt.customerType = newCustType;
      if (newCustType === 'RESELLER') newEnt.resellerName = newCompany.trim();
    }
    
    const updated = [...safeEntities, newEnt];
    setEntities(updated); 
    setLocalData(dbKeys.entity, updated);
    
    setIsAddOpen(false); setNewName(''); setNewAddr(''); setNewWa(''); setNewCompany(''); setNewCustType('PENGGUNA'); setAddError('');
    try { 
      await setDoc(getDocPath(dbKeys.entity, docId), newEnt); 
    } catch(e){}
  };

  const handleUndo = async (txId) => {
    const safeTx = Array.isArray(allTx) ? allTx : [];
    const txToVoid = safeTx.find(t => t.id === txId);
    if (!txToVoid) return;
    const isMyTxToday = txToVoid.operatorName === user.name && txToVoid.dateStr === todayStr;
    if (isReadOnly || (!canVoidAny && !isMyTxToday)) return;
    const updated = safeTx.map(t => t.id === txId ? { ...t, status: 'VOIDED', voidedBy: user.name } : t);
    setAllTx(updated); setLocalData('transactions', updated);
    try { await updateDoc(getDocPath('transactions', txId), { status: 'VOIDED', voidedBy: user.name }); } catch(e){}
  };

  const safeEntities = Array.isArray(entities) ? entities : [];
  const filtered = safeEntities.filter(e => (e.name||e.shipName)?.toLowerCase().includes(search.toLowerCase()));
  const safeAllTx = Array.isArray(allTx) ? allTx : [];
  const todayActiveTx = safeAllTx.filter(t => t.divisionType === dbKeys.divType && t.dateStr === todayStr && t.status !== 'VOIDED');
  const todayVol = todayActiveTx.reduce((s, t) => s + (t.quantity || 1), 0);
  const todayRev = todayActiveTx.reduce((s, t) => s + (t.totalAmount || 0), 0);
  const myTodayTx = todayActiveTx.filter(t => t.operatorName === user.name);
  const myTodayVol = myTodayTx.reduce((s, t) => s + (t.quantity || 1), 0);
  const myTodayRev = myTodayTx.reduce((s, t) => s + (t.totalAmount || 0), 0);
  const displayTxList = safeAllTx.filter(t => t.divisionType === dbKeys.divType && t.dateStr === shiftActiveDateStr);

  const validDisplayTx = displayTxList.filter(t => t.status !== 'VOIDED');
  const tabVol = validDisplayTx.reduce((s, t) => s + (t.quantity || 1), 0);
  const tabRev = validDisplayTx.reduce((s, t) => s + (t.totalAmount || 0), 0);
  const myTabTx = validDisplayTx.filter(t => t.operatorName === user.name);
  const myTabVol = myTabTx.reduce((s, t) => s + (t.quantity || 1), 0);
  const myTabRev = myTabTx.reduce((s, t) => s + (t.totalAmount || 0), 0);

  const getAddButtons = (entity) => {
    if (isReadOnly) return null;
    const lastMyTxForEntity = todayActiveTx.slice().reverse().find(t => t.entityId === entity.id && t.operatorName === user.name && t.status !== 'VOIDED');
    let btns = null;
    if (dbKeys.divType === 'TANDON' || dbKeys.divType === 'MOBIL_TANGKI') {
      btns = <button onClick={()=>handleAddTx(entity, 1)} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"><Plus size={14}/> +1</button>;
    } else if (dbKeys.divType === 'GALLON') {
      btns = [1, 5, 10, 20].map(v => <button key={v} onClick={()=>handleAddTx(entity, v)} className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] rounded-lg shadow-xs cursor-pointer">+{v}</button>);
    } else if (dbKeys.divType === 'AIR_KAPAL' || dbKeys.divType === 'GAS_INDUSTRI') {
      btns = [10, 20, 50].map(v => <button key={v} onClick={()=>handleAddTx(entity, v)} className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] rounded-lg shadow-xs cursor-pointer">+{v}</button>);
    }
    return (
      <div className="flex items-center gap-1.5">
        {lastMyTxForEntity && (
          <button onClick={()=>handleUndo(lastMyTxForEntity.id)} title="Batalkan Transaksi Terakhir" className="p-1.5 text-red-500 hover:bg-red-50 border border-red-100 rounded-lg cursor-pointer shadow-xs transition-all"><Trash2 size={16} /></button>
        )}
        {btns}
      </div>
    );
  };

  const formLabel = dbKeys.divType === 'TANDON' ? 'Nama Supir' : dbKeys.divType === 'AIR_KAPAL' ? 'Nama Kapal' : 'Nama Pembeli';

  return (
    <div className="max-w-md sm:max-w-xl mx-auto px-3 sm:px-4 py-4 pb-24 space-y-4">
      <DivisionHeader title={title} icon={icon} price={globalPrice} priceLabel={priceLabel} colorClass={textClass} onNavigateHome={onNavigateHome} />
      <DivisionSplitStatsCards todayVol={todayVol} myTodayVol={myTodayVol} todayRev={todayRev} myTodayRev={myTodayRev} unitLabel={unitLabel} />

      <div className="grid grid-cols-2 gap-1 bg-slate-200 p-1 rounded-2xl text-xs font-bold">
        <button onClick={() => setActiveTab('INPUT')} className={`py-2.5 rounded-xl transition-all ${activeTab==='INPUT'?`bg-white ${textClass} shadow-xs`:'text-slate-600'}`}>Input Penjualan</button>
        <button onClick={() => setActiveTab('REPORT')} className={`py-2.5 rounded-xl transition-all ${activeTab==='REPORT'?`bg-white ${textClass} shadow-xs`:'text-slate-600'}`}>Laporan Harian</button>
      </div>

      {activeTab === 'INPUT' && (
        <div className="space-y-4">
          <Card className={`p-4 space-y-3 ${variantClass}`}>
            <div className="flex justify-between items-center pb-2 border-b">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1"><Users size={14} className={textClass}/> Pilih {formLabel}</label>
              {canAddEntity && <Button onClick={()=>{setIsAddOpen(true); setAddError('');}} variant={buttonVariant} className="py-1.5 px-3 text-[11px]"><Plus size={14} /> Baru</Button>}
            </div>
            <input type="text" placeholder="Cari nama..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500" />
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filtered.map(ent => {
                const count = todayActiveTx.filter(t => t.entityId === ent.id).reduce((s,t) => s + (t.quantity||1), 0);
                return (
                  <div key={ent.id} className="flex justify-between items-center p-2.5 rounded-xl border bg-slate-50 border-slate-200 gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-slate-900 truncate">{ent.name||ent.shipName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">(Total: {count})</span>
                      </div>
                      {ent.companyName && <p className="text-[10px] text-slate-500 truncate mt-0.5">PT: {ent.companyName}</p>}
                      {ent.agentName && <p className="text-[10px] text-slate-500 truncate mt-0.5">Agen: {ent.agentName}</p>}
                      {ent.address && <p className="text-[10px] text-slate-500 truncate mt-0.5">{ent.address}</p>}
                    </div>
                    {!isReadOnly && <div className="flex items-center gap-1 shrink-0">{getAddButtons(ent)}</div>}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'REPORT' && (
        <div className="space-y-4">
          <DivisionSplitStatsCards todayVol={tabVol} myTodayVol={myTabVol} todayRev={tabRev} myTodayRev={myTabRev} unitLabel={unitLabel} />

          <Card className="p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-xs uppercase text-slate-800">Riwayat Harian</h3>
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-[11px] font-bold shadow-inner">
                <button onClick={()=>setShiftViewDate('TODAY')} className={`px-3 py-1.5 rounded-lg transition-all ${shiftViewDate==='TODAY'?'bg-white shadow-xs text-emerald-700':'text-slate-500 hover:text-slate-700'}`}>Hari Ini</button>
                <button onClick={()=>setShiftViewDate('YESTERDAY')} className={`px-3 py-1.5 rounded-lg transition-all ${shiftViewDate==='YESTERDAY'?'bg-white shadow-xs text-emerald-700':'text-slate-500 hover:text-slate-700'}`}>Kemarin</button>
              </div>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {displayTxList.length === 0 ? <p className="text-xs text-slate-400 text-center py-6 italic">Belum ada transaksi.</p> : displayTxList.slice().reverse().map(tx => (
                <div key={tx.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-100">
                  <div>
                    <p className="font-extrabold uppercase">{tx.entityName}</p>
                    <p className="text-[10px] text-slate-400">{getMakassarTimeString(tx.timestamp)} WITA — {tx.quantity} {unitLabel} — Op: {tx.operatorName}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className={`font-black ${textClass}`}>Rp {(tx.totalAmount||0).toLocaleString('id-ID')}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${tx.status==='VOIDED'?'bg-red-100 text-red-700':'bg-emerald-100 text-emerald-800'}`}>{tx.status==='VOIDED'?'DIBATALKAN':'SELESAI'}</span>
                    </div>
                    {(canVoidAny || (tx.operatorName === user.name && tx.dateStr === todayStr)) && tx.status !== 'VOIDED' && !isReadOnly && (
                      <button onClick={()=>handleUndo(tx.id)} title="Batalkan Transaksi" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"><Trash2 size={16}/></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Modal isOpen={isAddOpen} onClose={()=>setIsAddOpen(false)} title={`Tambah ${formLabel}`}>
        <form onSubmit={handleAddNewEntity} className="space-y-3">
          {addError && <div className="p-2 bg-red-50 text-red-700 text-xs font-bold rounded-lg">{addError}</div>}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">{formLabel} (Wajib Unik)</label>
            <input type="text" value={newName} onChange={e=>setNewName(e.target.value)} placeholder={`Input ${formLabel}...`} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" required autoFocus />
          </div>
          
          {(dbKeys.divType === 'MOBIL_TANGKI' || dbKeys.divType === 'GAS_INDUSTRI') && (
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Nama PT (Opsional)</label>
              <input type="text" value={newCompany} onChange={e=>setNewCompany(e.target.value)} placeholder="Nama PT / Perusahaan" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" />
            </div>
          )}

          {dbKeys.divType === 'AIR_KAPAL' && (
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Nama Agen (Opsional)</label>
              <input type="text" value={newCompany} onChange={e=>setNewCompany(e.target.value)} placeholder="Nama Agen Kapal" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" />
            </div>
          )}

          {dbKeys.divType === 'GALLON' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Tipe Pelanggan</label>
                <select value={newCustType} onChange={e=>setNewCustType(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase">
                  <option value="PENGGUNA">Pengguna</option>
                  <option value="RESELLER">Reseller</option>
                </select>
              </div>
              {newCustType === 'RESELLER' && (
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Nama Reseller</label>
                  <input type="text" value={newCompany} onChange={e=>setNewCompany(e.target.value)} placeholder="Nama Toko/Reseller" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">Alamat</label>
            <input type="text" value={newAddr} onChange={e=>setNewAddr(e.target.value)} placeholder="Alamat lengkap lokasi" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">No. WhatsApp (Wajib)</label>
            <input type="text" value={newWa} onChange={e=>setNewWa(e.target.value)} placeholder="08xxxxxxxxxx" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
          </div>
          
          <Button type="submit" variant={buttonVariant} className="w-full py-3">Simpan Data & Akun</Button>
        </form>
      </Modal>
    </div>
  );
};

const ReportsModule = ({ user, onNavigateHome }) => {
  const [reportTab, setReportTab] = useState('TODAY');
  const [todaySubMode, setTodaySubMode] = useState('TODAY');
  const [selectedDate, setSelectedDate] = useState(() => getMakassarDateString());
  const [selectedWeekDate, setSelectedWeekDate] = useState(() => getMakassarDateString());
  const [selectedMonthStr, setSelectedMonthStr] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedDiv, setSelectedDiv] = useState(null);
  const [allTx, setAllTx] = useState(() => getLocalData('transactions', []));
  
  useEffect(() => {
    let unsubs = [];
    try {
      unsubs.push(onSnapshot(getPublicPath('transactions'), snap => { 
        const l = snap.docs.map(d=>({id:d.id,...d.data()})); 
        if(Array.isArray(l)) { setAllTx(l); setLocalData('transactions', l); } 
      }, ()=>{}));
    } catch(e){}
    return () => unsubs.forEach(u => u && u());
  }, []);

  const todayStr = getMakassarDateString();
  const yesterdayStr = getAdjacentDateString(todayStr, -1);
  const activeDateStr = todaySubMode === 'TODAY' ? todayStr : (todaySubMode === 'YESTERDAY' ? yesterdayStr : selectedDate);

  const safeAllTx = Array.isArray(allTx) ? allTx : [];
  const activeTx = useMemo(() => {
    if (reportTab === 'TODAY') return safeAllTx.filter(t => t.dateStr === activeDateStr && t.status !== 'VOIDED');
    if (reportTab === 'WEEK') {
      try {
        const parts = selectedWeekDate.split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const day = d.getDay() || 7;
        const monday = new Date(d); monday.setDate(d.getDate() - day + 1);
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
        const s = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
        const e = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
        return safeAllTx.filter(t => t.dateStr >= s && t.dateStr <= e && t.status !== 'VOIDED');
      } catch (err) { return safeAllTx.filter(t => t.dateStr === todayStr && t.status !== 'VOIDED'); }
    }
    return safeAllTx.filter(t => t.dateStr?.startsWith(selectedMonthStr) && t.status !== 'VOIDED');
  }, [reportTab, todaySubMode, selectedDate, selectedWeekDate, selectedMonthStr, safeAllTx]);

  const totalOmset = activeTx.reduce((s, t) => s + (t.totalAmount || 0), 0);

  const divs = [
    { key: 'TANDON', name: 'Air Tandon', bg: 'bg-blue-600', txt: 'text-blue-600', unitLabel: 'Tandon' },
    { key: 'GALLON', name: 'Air Gallon', bg: 'bg-indigo-600', txt: 'text-indigo-600', unitLabel: 'Gallon' },
    { key: 'MOBIL_TANGKI', name: 'Mobil Tangki', bg: 'bg-emerald-600', txt: 'text-emerald-600', unitLabel: 'Tangki' },
    { key: 'AIR_KAPAL', name: 'Air Kapal', bg: 'bg-cyan-600', txt: 'text-cyan-600', unitLabel: 'Ton' },
    { key: 'GAS_INDUSTRI', name: 'Gas Industri', bg: 'bg-orange-600', txt: 'text-orange-600', unitLabel: 'Tabung' },
  ];

  const divRevenues = divs.map(d => {
    const ts = activeTx.filter(t => t.divisionType === d.key);
    return { ...d, rev: ts.reduce((s,t) => s+(t.totalAmount||0),0), vol: ts.reduce((s,t) => s+(t.quantity||1),0), txs: ts };
  });
  const maxDivRev = Math.max(...divRevenues.map(d => d.rev), 1000);

  const weeklyData = useMemo(() => {
    if (reportTab !== 'WEEK') return [];
    try {
      const parts = selectedWeekDate.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const day = d.getDay() || 7;
      const monday = new Date(d); monday.setDate(d.getDate() - day + 1);
      return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((n, i) => {
        const td = new Date(monday); td.setDate(monday.getDate() + i);
        const ds = `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(2, '0')}-${String(td.getDate()).padStart(2, '0')}`;
        const dayTx = safeAllTx.filter(t => t.dateStr === ds && t.status !== 'VOIDED');
        return { name: n, ds, omset: dayTx.reduce((s, t) => s + (t.totalAmount || 0), 0) };
      });
    } catch(e) { return []; }
  }, [selectedWeekDate, safeAllTx, reportTab]);

  const maxWeek = Math.max(...weeklyData.map(w => w.omset), 10000);

  const monthData = useMemo(() => {
    if (reportTab !== 'MONTH') return [];
    try {
      const [yr, mo] = selectedMonthStr.split('-').map(Number);
      const days = new Date(yr, mo, 0).getDate();
      let res = [];
      for (let i = 1; i <= days; i++) {
        const ds = `${yr}-${String(mo).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const txs = safeAllTx.filter(t => t.dateStr === ds && t.status !== 'VOIDED');
        res.push({ day: i, ds, omset: txs.reduce((s,t) => s + (t.totalAmount||0), 0) });
      }
      return res;
    } catch(e) { return []; }
  }, [selectedMonthStr, safeAllTx, reportTab]);

  const maxMo = Math.max(...monthData.map(m => m.omset), 10000);

  const handleWhatsAppShare = () => {
    const text = `*📊 LAPORAN POS*\n💰 Total: Rp ${totalOmset.toLocaleString('id-ID')}\n\n` +
      divRevenues.map(d => `- ${d.name}: ${d.vol} (Rp ${d.rev.toLocaleString('id-ID')})`).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-md sm:max-w-2xl mx-auto px-3 sm:px-4 py-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={onNavigateHome} className="p-2.5 rounded-xl border-slate-200"><ArrowLeft size={18}/></Button>
          <div>
            <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">LAPORAN POS</span>
            <h1 className="text-xl font-black flex items-center gap-1.5"><PieChart size={20} className="text-emerald-600" /> Penjualan</h1>
          </div>
        </div>
        <Button variant="emerald" onClick={handleWhatsAppShare} className="py-2 px-3 text-xs shadow-md"><Share2 size={15} /> Kirim WA</Button>
      </div>

      <div className="grid grid-cols-3 gap-1 bg-slate-200 p-1 rounded-2xl text-xs font-extrabold shadow-inner">
        <button onClick={() => {setReportTab('TODAY'); setSelectedDiv(null);}} className={`py-2.5 rounded-xl transition-all ${reportTab==='TODAY'?'bg-emerald-600 text-white shadow-md':'text-slate-700'}`}>Hari Ini</button>
        <button onClick={() => {setReportTab('WEEK'); setSelectedDiv(null);}} className={`py-2.5 rounded-xl transition-all ${reportTab==='WEEK'?'bg-emerald-600 text-white shadow-md':'text-slate-700'}`}>Minggu Ini</button>
        <button onClick={() => {setReportTab('MONTH'); setSelectedDiv(null);}} className={`py-2.5 rounded-xl transition-all ${reportTab==='MONTH'?'bg-emerald-600 text-white shadow-md':'text-slate-700'}`}>Bulan Ini</button>
      </div>

      <Card className="p-4 space-y-4 border-slate-200 shadow-sm">
        {reportTab === 'TODAY' && (
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex gap-2">
              <button onClick={()=>setTodaySubMode('TODAY')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${todaySubMode==='TODAY'?'bg-emerald-600 text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Hari Ini</button>
              <button onClick={()=>setTodaySubMode('YESTERDAY')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${todaySubMode==='YESTERDAY'?'bg-emerald-600 text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>Kemarin</button>
            </div>
            <input type="date" value={activeDateStr} onChange={e=>{setSelectedDate(e.target.value); setTodaySubMode('CUSTOM');}} className="p-1.5 bg-slate-50 border rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        )}
        {reportTab === 'WEEK' && (
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase">Pilih Tanggal (Acuan Minggu)</span>
            <input type="date" value={selectedWeekDate} onChange={e=>setSelectedWeekDate(e.target.value)} className="p-1.5 bg-slate-50 border rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        )}
        {reportTab === 'MONTH' && (
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase">Pilih Bulan</span>
            <input type="month" value={selectedMonthStr} onChange={e=>setSelectedMonthStr(e.target.value)} className="p-1.5 bg-slate-50 border rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        )}

        <div className="p-4 bg-emerald-600 text-white rounded-2xl space-y-1 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><PieChart size={64}/></div>
          <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block relative z-10">TOTAL OMSET GABUNGAN</span>
          <div className="text-3xl font-black relative z-10">Rp {totalOmset.toLocaleString('id-ID')}</div>
        </div>

        <div className="pt-2">
          <h3 className="font-extrabold text-xs uppercase text-slate-700 mb-2">Pendapatan Per Divisi <span className="text-[9px] text-slate-400 font-normal lowercase">(Klik grafik vertikal untuk detail)</span></h3>
          <div className="flex justify-around items-end h-48 pt-6 pb-2 px-2 bg-slate-50 rounded-xl border border-slate-200">
            {divRevenues.map(d => {
              const hp = maxDivRev > 0 ? Math.max(Math.round((d.rev/maxDivRev)*100), 5) : 5;
              const isSel = selectedDiv === d.key;
              return (
                <div key={d.key} onClick={() => setSelectedDiv(isSel ? null : d.key)} className="flex flex-col items-center gap-2 h-full justify-end cursor-pointer group flex-1">
                  <span className={`text-[9px] font-bold transition-all ${isSel ? d.txt : 'text-slate-500 opacity-0 group-hover:opacity-100'}`}>
                    {d.rev > 0 ? `${(d.rev/1000).toLocaleString('id-ID')}k` : '0'}
                  </span>
                  <div className={`w-full max-w-[28px] rounded-t-md transition-all shadow-sm ${d.bg} ${isSel ? 'opacity-100 shadow-md ring-2 ring-offset-1 ring-emerald-500' : 'opacity-60 group-hover:opacity-80'}`} style={{height:`${hp}%`}}></div>
                  <span className={`text-[9px] font-extrabold text-center leading-tight ${isSel ? d.txt : 'text-slate-600'}`}>
                    {d.name.split(' ').map((w,i)=><React.Fragment key={i}>{w}<br/></React.Fragment>)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {selectedDiv && (
          <div className="space-y-2.5 pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-extrabold text-xs uppercase flex items-center gap-1.5">
                {divs.find(d=>d.key===selectedDiv)?.name} - Performa Operator
              </h3>
              <button onClick={()=>setSelectedDiv(null)} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded-md hover:bg-slate-200 font-bold transition-all cursor-pointer">Tutup</button>
            </div>
            {(() => {
              const divTxs = activeTx.filter(t => t.divisionType === selectedDiv);
              const opsMap = {};
              divTxs.forEach(t => {
                const op = t.operatorName || 'SYSTEM';
                if (!opsMap[op]) opsMap[op] = { count: 0, omset: 0, vol: 0 };
                opsMap[op].count++; opsMap[op].omset += (t.totalAmount||0); opsMap[op].vol += (t.quantity||1);
              });
              const sortedOps = Object.entries(opsMap).sort((a,b) => b[1].omset - a[1].omset);
              
              if (sortedOps.length === 0) return <p className="text-xs text-slate-400 text-center py-4 border border-dashed rounded-xl bg-slate-50">Belum ada transaksi di divisi ini.</p>;

              return sortedOps.map(([name, data]) => (
                <div key={name} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex justify-between items-center text-xs">
                  <div>
                    <span className="font-black uppercase text-slate-800 block">{name}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{data.count} Transaksi ({data.vol} {divs.find(d=>d.key===selectedDiv)?.unitLabel || 'Volume'})</span>
                  </div>
                  <span className="font-black text-emerald-600 text-sm">Rp {data.omset.toLocaleString('id-ID')}</span>
                </div>
              ));
            })()}
          </div>
        )}

        {reportTab === 'WEEK' && (
          <div className="pt-4 border-t border-slate-100 animate-in fade-in">
            <h3 className="font-extrabold text-xs uppercase mb-2">Tren Mingguan</h3>
            <div className="grid grid-cols-7 gap-1 items-end h-32 pt-6 pb-2 px-2 bg-slate-50 rounded-xl border border-slate-200">
              {weeklyData.map(w => {
                const hp = maxWeek > 0 ? Math.max(Math.round((w.omset/maxWeek)*100),6) : 6;
                const isSel = w.ds === selectedWeekDate;
                return (
                  <div key={w.name} onClick={()=>setSelectedWeekDate(w.ds)} className="flex flex-col items-center gap-1 h-full justify-end cursor-pointer group">
                    <span className="text-[9px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-all">{w.omset>0?`${Math.round(w.omset/1000)}k`:'0'}</span>
                    <div className={`w-full rounded-t-lg transition-all ${isSel?'bg-emerald-600 shadow-md':'bg-emerald-300'}`} style={{height:`${hp}%`}}></div>
                    <span className={`text-[10px] font-bold ${isSel?'text-emerald-700 font-black':'text-slate-600'}`}>{w.name.slice(0,3)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {reportTab === 'MONTH' && (
          <div className="pt-4 border-t border-slate-100 animate-in fade-in">
            <h3 className="font-extrabold text-xs uppercase mb-2">Tren Bulanan (Harian)</h3>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-1 items-end h-36 pt-6 pb-2 px-2 bg-slate-50 rounded-xl border border-slate-200 min-w-max">
                {monthData.map(m => {
                  const hp = maxMo > 0 ? Math.max(Math.round((m.omset/maxMo)*100),6) : 6;
                  return (
                    <div key={m.day} className="flex flex-col items-center gap-1 h-full justify-end w-6 group cursor-pointer" title={`${m.ds}: Rp ${m.omset.toLocaleString()}`}>
                      <div className="w-4 rounded-t transition-colors bg-emerald-400 group-hover:bg-emerald-600" style={{height:`${hp}%`}}></div>
                      <span className="text-[9px] font-bold text-slate-600">{m.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const AdminPanel = ({ onNavigateHome }) => {
  const { sessionUser, allUsers, setAllUsers } = useContext(AuthContext);
  const [activeCategory, setActiveCategory] = useState('INTERNAL'); 
  const [activeCustTab, setActiveCustTab] = useState('TANDON');
  
  const canManageCredentials = ['ADMIN', 'SUPER_ADMIN'].includes(sessionUser.role);
  
  const [prices, setPrices] = useState({ TANDON: 20000, GALLON: 6000, TANGKI: 350000, KAPAL: 50000, GAS: 150000 });
  const [custData, setCustData] = useState([]);
  
  const [isCustModalOpen, setIsCustModalOpen] = useState(false);
  const [editingCust, setEditingCust] = useState(null);
  const [custError, setCustError] = useState('');
  
  const [custForm, setCustForm] = useState({
      name: '', address: '', whatsapp: '', username: '', password: '',
      companyName: '', agentName: '', customerType: 'PENGGUNA', resellerName: '', customPrice: ''
  });

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUser, setNewUserUser] = useState('');
  const [newUserPwd, setNewUserPwd] = useState('123456');
  const [newUserRole, setNewUserRole] = useState('OPERATOR');
  const [newUserDivs, setNewUserDivs] = useState(['TANDON']);
  const [userAddError, setUserAddError] = useState('');

  const [resetTarget, setResetTarget] = useState(null);
  const [resetPwd, setResetPwd] = useState('123456');
  const [resetMsg, setResetMsg] = useState('');

  const custConfigs = {
    TANDON: { key: 'tandon_drivers', nameField: 'name', prefix: 'td', label: 'Supir Tandon', priceKey: 'TANDON' },
    TANGKI: { key: 'tangki_customers', nameField: 'name', prefix: 'mt', label: 'Pembeli Mobil Tangki', priceKey: 'TANGKI' },
    GALLON: { key: 'gallon_customers', nameField: 'name', prefix: 'gl', label: 'Pembeli Air Gallon', priceKey: 'GALLON' },
    KAPAL: { key: 'kapal_ships', nameField: 'shipName', prefix: 'ak', label: 'Kapal', priceKey: 'KAPAL' },
    GAS: { key: 'gas_customers', nameField: 'name', prefix: 'gs', label: 'Gas Industri', priceKey: 'GAS' }
  };

  useEffect(() => {
    let unsubs = [];
    try {
      unsubs.push(onSnapshot(getDocPath('settings', 'tandon_config'), snap => { if(snap.exists()) setPrices(p=>({...p, TANDON: snap.data().price||20000})); }, ()=>{}));
      unsubs.push(onSnapshot(getDocPath('settings', 'gallon_config'), snap => { if(snap.exists()) setPrices(p=>({...p, GALLON: snap.data().price||6000})); }, ()=>{}));
      unsubs.push(onSnapshot(getDocPath('settings', 'tangki_config'), snap => { if(snap.exists()) setPrices(p=>({...p, TANGKI: snap.data().price||350000})); }, ()=>{}));
      unsubs.push(onSnapshot(getDocPath('settings', 'kapal_config'), snap => { if(snap.exists()) setPrices(p=>({...p, KAPAL: snap.data().price||50000})); }, ()=>{}));
      unsubs.push(onSnapshot(getDocPath('settings', 'gas_config'), snap => { if(snap.exists()) setPrices(p=>({...p, GAS: snap.data().price||150000})); }, ()=>{}));
    } catch(e){}
    return () => unsubs.forEach(u => u && u());
  }, []);

  useEffect(() => {
    if (activeCategory !== 'CUSTOMER') return;
    const conf = custConfigs[activeCustTab];
    const initialLocal = getLocalData(conf.key, []);
    setCustData(Array.isArray(initialLocal) ? initialLocal : []);

    const unsub = onSnapshot(getPublicPath(conf.key), snap => {
      const l = snap.docs.map(d=>({id:d.id,...d.data()}));
      if (Array.isArray(l)) {
        setCustData(l);
        setLocalData(conf.key, l);
      }
    }, () => {});
    return () => unsub();
  }, [activeCategory, activeCustTab]);

  const updatePrice = async (key, confKey, val) => {
    if (!canManageCredentials) return;
    const v = parseInt(val) || 0;
    setPrices(p => ({...p, [key]: v}));
    try { await setDoc(getDocPath('settings', confKey), { price: v, updatedBy: sessionUser.name, updatedAt: Date.now() }, { merge: true }); } catch(e){}
  };

  const openAddCust = () => {
    setCustForm({
        name: '', address: '', whatsapp: '', username: '', password: '123456',
        companyName: '', agentName: '', customerType: 'PENGGUNA', resellerName: '',
        customPrice: ''
    });
    setEditingCust(null);
    setCustError('');
    setIsCustModalOpen(true);
  };

  const openEditCust = (c) => {
    const nameKey = custConfigs[activeCustTab].nameField;
    setCustForm({
        name: c[nameKey] || '',
        address: c.address || '',
        whatsapp: c.whatsapp || '',
        username: c.username || '',
        password: '',
        companyName: c.companyName || '',
        agentName: c.agentName || '',
        customerType: c.customerType || 'PENGGUNA',
        resellerName: c.resellerName || '',
        customPrice: (c.price && c.price > 0) ? c.price : ''
    });
    setEditingCust(c);
    setCustError('');
    setIsCustModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    const cleanName = custForm.name.trim().toUpperCase();
    if (!cleanName) return setCustError('Nama wajib diisi.');

    const conf = custConfigs[activeCustTab];
    const nameKey = conf.nameField;
    const safeCustData = Array.isArray(custData) ? custData : [];

    const isDuplicate = safeCustData.some(c => (c[nameKey] || '').toUpperCase() === cleanName && c.id !== editingCust?.id);
    if (isDuplicate) return setCustError(`Nama "${cleanName}" sudah terdaftar.`);

    const generatedUser = custForm.username.trim().toLowerCase() || cleanName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + Math.floor(Math.random() * 900 + 100);

    const payload = {
        [nameKey]: cleanName,
        address: custForm.address.trim(),
        whatsapp: custForm.whatsapp.trim(),
        username: generatedUser,
        price: Number(custForm.customPrice) || 0,
        updatedAt: Date.now()
    };

    if (!editingCust) {
        payload.id = `${conf.prefix}_${Date.now()}`;
        payload.password = (custForm.password || '').trim() || '123456';
        payload.portalAccessEnabled = true;
        payload.createdAt = Date.now();
    }

    if (activeCustTab === 'TANGKI' || activeCustTab === 'GAS') payload.companyName = custForm.companyName.trim();
    if (activeCustTab === 'KAPAL') payload.agentName = custForm.agentName.trim();
    if (activeCustTab === 'GALLON') {
        payload.customerType = custForm.customerType;
        if (custForm.customerType === 'RESELLER') payload.resellerName = custForm.resellerName.trim();
    }

    const updatedList = editingCust
        ? safeCustData.map(c => c.id === editingCust.id ? { ...c, ...payload } : c)
        : [...safeCustData, payload];

    setCustData(updatedList);
    setLocalData(conf.key, updatedList);
    setIsCustModalOpen(false);

    try {
        if (editingCust) {
            await updateDoc(getDocPath(conf.key, editingCust.id), payload);
        } else {
            await setDoc(getDocPath(conf.key, payload.id), payload);
        }
    } catch(err) {}
  };

  const handleAddInternalUser = async (e) => {
    e.preventDefault();
    if (!canManageCredentials) return;
    const cleanName = newUserName.trim();
    const cleanUser = newUserUser.trim().toLowerCase();
    const cleanPwd = newUserPwd.trim();
    if (!cleanName || !cleanUser || !cleanPwd) return setUserAddError('Nama, username, dan password wajib diisi.');
    
    const safeAllUsers = Array.isArray(allUsers) ? allUsers : [];
    if (safeAllUsers.some(u => u.username?.toLowerCase() === cleanUser)) return setUserAddError(`Username "@${cleanUser}" sudah digunakan!`);

    const userId = 'usr_' + Date.now();
    const newUserObj = {
      id: userId, name: cleanName, username: cleanUser, password: cleanPwd, role: newUserRole,
      divisions: newUserRole === 'MANAGEMENT' || newUserRole === 'SUPER_ADMIN' ? ['TANDON', 'GALLON', 'MOBIL_TANGKI', 'AIR_KAPAL', 'GAS_INDUSTRI'] : newUserDivs,
      isActive: true, createdAt: Date.now()
    };

    const updated = [...safeAllUsers, newUserObj];
    setAllUsers(updated); setLocalData('all_users', updated);
    setIsAddUserOpen(false);
    setNewUserName(''); setNewUserUser(''); setNewUserPwd('123456'); setNewUserRole('OPERATOR'); setNewUserDivs(['TANDON']); setUserAddError('');
    try { await setDoc(getDocPath('users', userId), newUserObj); } catch(e) {}
  };

  const togglePortalAccess = async (cust) => {
    if (!canManageCredentials) return;
    const conf = custConfigs[activeCustTab];
    const newStatus = cust.portalAccessEnabled === false ? true : false;
    const updated = custData.map(c => c.id === cust.id ? { ...c, portalAccessEnabled: newStatus } : c);
    setCustData(updated); setLocalData(conf.key, updated);
    try { await updateDoc(getDocPath(conf.key, cust.id), { portalAccessEnabled: newStatus }); } catch(e) {}
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!canManageCredentials || !resetTarget) return;
    const conf = custConfigs[activeCustTab];
    const updated = custData.map(c => c.id === resetTarget.id ? { ...c, password: resetPwd } : c);
    
    setCustData(updated); setLocalData(conf.key, updated);
    try {
      await updateDoc(getDocPath(conf.key, resetTarget.id), { password: resetPwd });
      setResetMsg('Password berhasil diubah!');
      setTimeout(() => { setResetTarget(null); setResetMsg(''); }, 1500);
    } catch(err) { setResetMsg('Gagal mengubah password.'); }
  };

  const currConf = custConfigs[activeCustTab];
  const activeFormLabel = activeCustTab === 'TANDON' ? 'Nama Supir' : activeCustTab === 'KAPAL' ? 'Nama Kapal' : 'Nama Pembeli';

  return (
    <div className="max-w-md sm:max-w-3xl mx-auto px-3 sm:px-4 py-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={onNavigateHome} className="p-2.5 rounded-xl border-emerald-200"><ArrowLeft size={18} className="text-emerald-700"/></Button>
          <div>
            <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase">ADMINISTRASI POS</span>
            <h1 className="text-xl font-black text-emerald-900"><Settings size={20} className="inline-block text-emerald-700" /> Panel Admin</h1>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-1.5 bg-emerald-100/50 p-1 rounded-2xl text-xs font-extrabold border border-emerald-100">
        <button onClick={()=>setActiveCategory('INTERNAL')} className={`py-3 rounded-xl transition-all ${activeCategory==='INTERNAL'?'bg-emerald-600 text-white shadow-md':'text-emerald-700'}`}>Internal</button>
        <button onClick={()=>setActiveCategory('CUSTOMER')} className={`py-3 rounded-xl transition-all ${activeCategory==='CUSTOMER'?'bg-emerald-600 text-white shadow-md':'text-emerald-700'}`}>Customer / Akun</button>
        <button onClick={()=>setActiveCategory('PRICING')} className={`py-3 rounded-xl transition-all ${activeCategory==='PRICING'?'bg-emerald-600 text-white shadow-md':'text-emerald-700'}`}>Master Harga</button>
      </div>
      
      {activeCategory === 'INTERNAL' && (
        <Card className="p-4 space-y-3 border-emerald-100">
          <div className="flex justify-between items-center border-b border-emerald-50 pb-2">
            <h3 className="font-black text-sm text-emerald-900">Manajemen User Staf</h3>
            {canManageCredentials && (
              <Button onClick={()=>{setIsAddUserOpen(true); setUserAddError('');}} variant="emerald" className="py-1.5 px-3 text-xs"><Plus size={14}/> Tambah Staf</Button>
            )}
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(Array.isArray(allUsers) ? allUsers : []).map(u => (
              <div key={u.id} className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-black uppercase text-emerald-900">{u.name} <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">{u.role}</span></span>
                  <p className="text-[10px] text-emerald-600">@{u.username} {u.divisions && `• Div: ${u.divisions.join(', ')}`}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeCategory === 'CUSTOMER' && (
        <Card className="p-4 space-y-4 border-emerald-100">
          <div className="flex gap-2 border-b border-emerald-50 pb-3 overflow-x-auto text-[11px] font-bold">
            <button onClick={()=>setActiveCustTab('TANDON')} className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeCustTab==='TANDON'?'bg-emerald-600 text-white':'bg-emerald-50 text-emerald-700'}`}>Sopir Tandon</button>
            <button onClick={()=>setActiveCustTab('TANGKI')} className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeCustTab==='TANGKI'?'bg-emerald-600 text-white':'bg-emerald-50 text-emerald-700'}`}>Pelanggan Tangki</button>
            <button onClick={()=>setActiveCustTab('GALLON')} className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeCustTab==='GALLON'?'bg-emerald-600 text-white':'bg-emerald-50 text-emerald-700'}`}>Pelanggan Galon</button>
            <button onClick={()=>setActiveCustTab('KAPAL')} className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeCustTab==='KAPAL'?'bg-emerald-600 text-white':'bg-emerald-50 text-emerald-700'}`}>Kapal / Agen</button>
            <button onClick={()=>setActiveCustTab('GAS')} className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeCustTab==='GAS'?'bg-emerald-600 text-white':'bg-emerald-50 text-emerald-700'}`}>Gas Industri</button>
          </div>
          
          <div className="flex justify-between items-center">
            <h3 className="font-black text-sm text-emerald-900">Daftar Akun: {activeCustTab}</h3>
            {canManageCredentials && (
              <Button onClick={openAddCust} variant="emerald" className="py-1.5 px-3 text-xs"><Plus size={14}/> Tambah Akun</Button>
            )}
          </div>
          
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {custData.length === 0 ? (
              <p className="text-xs text-emerald-600 text-center py-6 italic">Belum ada data akun.</p>
            ) : (
              custData.map(c => {
                const nameKey = custConfigs[activeCustTab].nameField;
                const isEnabled = c.portalAccessEnabled !== false;
                const activeMasterPrice = prices[custConfigs[activeCustTab].priceKey] || 0;
                const displayPrice = (c.price && Number(c.price) > 0) ? `Rp ${Number(c.price).toLocaleString('id-ID')} (Khusus)` : `Rp ${activeMasterPrice.toLocaleString('id-ID')} (Master)`;
                return (
                  <div key={c.id} className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs gap-3 hover:bg-emerald-50 transition-all">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black uppercase text-emerald-900 truncate">{c[nameKey]}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {isEnabled ? 'Portal Aktif' : 'Portal Dinonaktifkan'}
                        </span>
                      </div>
                      {c.companyName && <p className="text-[10px] text-emerald-700 font-bold mt-0.5">PT: {c.companyName}</p>}
                      {c.agentName && <p className="text-[10px] text-emerald-700 font-bold mt-0.5">Agen: {c.agentName}</p>}
                      {c.customerType && <p className="text-[10px] text-emerald-700 font-bold mt-0.5">Tipe: {c.customerType} {c.resellerName && `- ${c.resellerName}`}</p>}
                      <p className="text-[10px] text-emerald-600 font-mono mt-0.5">@{c.username} • Harga: {displayPrice}</p>
                      {c.address && <p className="text-[10px] text-slate-500 truncate mt-0.5">{c.address} {c.whatsapp && `• WA: ${c.whatsapp}`}</p>}
                    </div>
                    {canManageCredentials && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => openEditCust(c)} title="Edit Akun" className="p-1.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer transition-colors">
                          <Edit size={15}/>
                        </button>
                        <button onClick={()=>togglePortalAccess(c)} title={isEnabled ? "Nonaktifkan Portal" : "Aktifkan Portal"} className={`p-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${isEnabled ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200'}`}>
                          {isEnabled ? <Ban size={15}/> : <Check size={15}/>}
                        </button>
                        <button onClick={()=>{setResetTarget(c); setResetPwd('123456'); setResetMsg('');}} title="Reset Password" className="p-1.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer transition-colors">
                          <Key size={15}/>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {activeCategory === 'PRICING' && (
        <Card className="p-4 space-y-4 border-emerald-100">
          <h3 className="font-black text-sm border-b border-emerald-50 pb-2 text-emerald-900">Master Harga Standar</h3>
          <div className="space-y-3">
            {[
              { id: 'TANDON', name: 'Air Tandon', conf: 'tandon_config' },
              { id: 'GALLON', name: 'Air Gallon', conf: 'gallon_config' },
              { id: 'TANGKI', name: 'Mobil Tangki', conf: 'tangki_config' },
              { id: 'KAPAL', name: 'Air Kapal / Ton', conf: 'kapal_config' },
              { id: 'GAS', name: 'Gas Industri', conf: 'gas_config' },
            ].map(div => (
              <div key={div.id} className="flex items-center justify-between p-3 border border-emerald-100 rounded-xl bg-emerald-50/50">
                <span className="text-xs font-bold uppercase text-emerald-800">{div.name}</span>
                <input type="number" value={prices[div.id]} onChange={e=>updatePrice(div.id, div.conf, e.target.value)} disabled={!canManageCredentials} className="w-32 p-2 border border-emerald-200 rounded-lg text-sm font-black text-right outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-900" />
              </div>
            ))}
          </div>
          {!canManageCredentials && <p className="text-xs text-red-500 font-bold text-center">Hanya Administrator yang dapat mengubah harga.</p>}
        </Card>
      )}

      <Modal isOpen={isAddUserOpen} onClose={()=>setIsAddUserOpen(false)} title="Tambah Staf Internal Baru">
        <form onSubmit={handleAddInternalUser} className="space-y-3">
          {userAddError && <div className="p-2 bg-red-50 text-red-700 text-xs font-bold rounded-lg">{userAddError}</div>}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">Nama Lengkap</label>
            <input type="text" value={newUserName} onChange={e=>{setNewUserName(e.target.value); setNewUserUser(e.target.value.replace(/[^a-zA-Z0-9]/g,'').toLowerCase());}} placeholder="NAMA LENGKAP STAF" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required autoFocus />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">Username Login</label>
            <input type="text" value={newUserUser} onChange={e=>setNewUserUser(e.target.value)} placeholder="username" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold lowercase" required />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">Password</label>
            <input type="text" value={newUserPwd} onChange={e=>setNewUserPwd(e.target.value)} placeholder="123456" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">Peran (Role)</label>
            <select value={newUserRole} onChange={e=>setNewUserRole(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold">
              <option value="OPERATOR">Operator</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="ADMIN">Administrator</option>
              <option value="MANAGEMENT">Management (Read-Only)</option>
              <option value="SUPER_ADMIN">Super Administrator</option>
            </select>
          </div>
          {newUserRole !== 'MANAGEMENT' && newUserRole !== 'SUPER_ADMIN' && (
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Akses Divisi</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                {[
                  { id: 'TANDON', name: 'Air Tandon' },
                  { id: 'GALLON', name: 'Air Gallon' },
                  { id: 'MOBIL_TANGKI', name: 'Mobil Tangki' },
                  { id: 'AIR_KAPAL', name: 'Air Kapal' },
                  { id: 'GAS_INDUSTRI', name: 'Gas Industri' },
                ].map(d => (
                  <label key={d.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newUserDivs.includes(d.id)}
                      onChange={e => {
                        if (e.target.checked) setNewUserDivs([...newUserDivs, d.id]);
                        else setNewUserDivs(newUserDivs.filter(x => x !== d.id));
                      }}
                    />
                    <span>{d.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <Button type="submit" variant="emerald" className="w-full py-3">Simpan Staf Baru</Button>
        </form>
      </Modal>

      <Modal isOpen={isCustModalOpen} onClose={()=>setIsCustModalOpen(false)} title={editingCust ? `Edit ${currConf.label}` : `Tambah ${currConf.label}`}>
        <form onSubmit={handleSaveCustomer} className="space-y-3">
          {custError && <div className="p-2 bg-red-50 text-red-700 text-xs font-bold rounded-lg">{custError}</div>}
          
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">{activeFormLabel} (Wajib Unik)</label>
            <input type="text" value={custForm.name} onChange={e=>{
                setCustForm({...custForm, name: e.target.value, username: e.target.value.replace(/[^a-zA-Z0-9]/g,'').toLowerCase()});
            }} placeholder={`Masukkan ${activeFormLabel.toLowerCase()}...`} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" required autoFocus />
          </div>
          
          {(activeCustTab === 'TANGKI' || activeCustTab === 'GAS') && (
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Nama PT (Opsional)</label>
              <input type="text" value={custForm.companyName} onChange={e=>setCustForm({...custForm, companyName: e.target.value})} placeholder="Nama PT / Perusahaan" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" />
            </div>
          )}

          {activeCustTab === 'KAPAL' && (
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Nama Agen (Opsional)</label>
              <input type="text" value={custForm.agentName} onChange={e=>setCustForm({...custForm, agentName: e.target.value})} placeholder="Nama Agen Kapal" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" />
            </div>
          )}

          {activeCustTab === 'GALLON' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Tipe Pelanggan</label>
                <select value={custForm.customerType} onChange={e=>setCustForm({...custForm, customerType: e.target.value})} className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase">
                  <option value="PENGGUNA">Pengguna</option>
                  <option value="RESELLER">Reseller</option>
                </select>
              </div>
              {custForm.customerType === 'RESELLER' && (
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Nama Reseller</label>
                  <input type="text" value={custForm.resellerName} onChange={e=>setCustForm({...custForm, resellerName: e.target.value})} placeholder="Nama Toko/Reseller" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold uppercase" />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">Alamat</label>
            <input type="text" value={custForm.address} onChange={e=>setCustForm({...custForm, address: e.target.value})} placeholder="Alamat lengkap lokasi" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">No. WhatsApp (Wajib)</label>
            <input type="text" value={custForm.whatsapp} onChange={e=>setCustForm({...custForm, whatsapp: e.target.value})} placeholder="08xxxxxxxxxx" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
          </div>

          <div className="pt-2 border-t mt-2">
            <label className="text-[10px] font-bold uppercase text-emerald-700 flex items-center justify-between">
              Harga Khusus (Rp)
              <span className="text-[9px] text-slate-400 normal-case font-normal">*Kosongkan untuk mengikuti Master Harga</span>
            </label>
            <input type="number" value={custForm.customPrice} onChange={e=>setCustForm({...custForm, customPrice: e.target.value})} placeholder={`Master: Rp ${(prices[currConf.priceKey]||0).toLocaleString('id-ID')}`} className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-black text-emerald-900 placeholder:text-emerald-400/70 placeholder:font-medium" />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500">Username Login</label>
              <input type="text" value={custForm.username} onChange={e=>setCustForm({...custForm, username: e.target.value})} placeholder="username" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold lowercase" required />
            </div>
            {!editingCust && canManageCredentials && (
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Password</label>
                <input type="text" value={custForm.password} onChange={e=>setCustForm({...custForm, password: e.target.value})} placeholder="123456" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required />
              </div>
            )}
          </div>
          <Button type="submit" variant="emerald" className="w-full py-3">{editingCust ? 'Simpan Perubahan' : 'Simpan Data & Akun'}</Button>
        </form>
      </Modal>

      <Modal isOpen={!!resetTarget} onClose={()=>{setResetTarget(null); setResetMsg('');}} title={`Reset Password`}>
        <form onSubmit={handleResetSubmit} className="space-y-4">
          <p className="text-xs font-bold text-slate-600">Username: <span className="text-emerald-700">@{resetTarget?.username}</span></p>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">Password Baru</label>
            <input type="text" value={resetPwd} onChange={e=>setResetPwd(e.target.value)} placeholder="Masukkan password baru" className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold" required autoFocus />
          </div>
          {resetMsg && <div className="p-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg text-center border border-emerald-100">{resetMsg}</div>}
          <Button type="submit" variant="emerald" className="w-full py-3 shadow-md">Update Password</Button>
        </form>
      </Modal>
    </div>
  );
};

const DivisionSelector = ({ user, onSelectDivision }) => {
  const isManagement = user.role === 'MANAGEMENT';
  const divs = [
    { id: 'TANDON', name: 'Air Tandon', icon: Droplet, c: 'border-blue-200 bg-blue-50 text-blue-700' },
    { id: 'GALLON', name: 'Air Gallon', icon: Package, c: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
    { id: 'MOBIL_TANGKI', name: 'Mobil Tangki', icon: Truck, c: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { id: 'AIR_KAPAL', name: 'Air Kapal', icon: Anchor, c: 'border-cyan-200 bg-cyan-50 text-cyan-700' },
    { id: 'GAS_INDUSTRI', name: 'Gas Industri', icon: Flame, c: 'border-orange-200 bg-orange-50 text-orange-700' },
  ];
  const userDivs = Array.isArray(user.divisions) ? user.divisions : [];
  const allowed = isManagement ? divs : divs.filter(d => userDivs.includes(d.id));

  return (
    <div className="max-w-md sm:max-w-xl mx-auto px-4 py-6 space-y-5 pb-24">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
        <GalanganKalimasLogo size="sm" />
        <div className="text-right">
          <p className="text-xs font-black uppercase text-slate-900">{user.name}</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{user.role}</span>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-slate-500 uppercase">Divisi Penjualan POS</h3>
        <div className="grid gap-3">
          {allowed.map(d => {
            const Icon = d.icon;
            return (
              <Card key={d.id} onClick={()=>onSelectDivision(d.id)} className={`p-4 border-2 flex items-center justify-between cursor-pointer hover:shadow-md transition-all ${isManagement?'border-slate-300 bg-slate-100 text-slate-600':d.c}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isManagement?'bg-slate-200 text-slate-700':'bg-white shadow-xs'}`}><Icon size={24}/></div>
                  <h4 className="font-extrabold text-sm uppercase">{d.name}</h4>
                </div>
                <ChevronRight size={18} />
              </Card>
            );
          })}
        </div>
      </div>
      {['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'MANAGEMENT'].includes(user.role) && (
        <div className="pt-2 space-y-2">
          <Card onClick={()=>onSelectDivision('REPORTS')} className="p-4 border-2 border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center justify-between cursor-pointer hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white"><PieChart size={24}/></div>
              <h4 className="font-extrabold text-sm uppercase">Laporan POS</h4>
            </div><ChevronRight size={18}/>
          </Card>
          {['ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
            <Button variant="emerald" onClick={()=>onSelectDivision('ADMIN')} className="w-full py-3.5 shadow-emerald-500/30"><Settings size={18}/> Panel Admin</Button>
          )}
        </div>
      )}
    </div>
  );
};

const DriverPortal = ({ user, logout }) => (
  <div className="min-h-screen bg-slate-100 p-4">
    <div className="max-w-md mx-auto space-y-4">
      <div className="bg-emerald-700 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold text-emerald-200">PORTAL {user.role}</span>
          <h2 className="font-black uppercase text-lg">{user.name}</h2>
        </div>
        <button onClick={logout} className="p-2 bg-emerald-800 rounded-lg hover:bg-emerald-900"><LogOut size={16}/></button>
      </div>
      <Card className="p-6 text-center text-slate-500 border-dashed border-2">
        <p className="text-sm font-bold">Riwayat Pembelian & Data Analitik Anda akan tampil di sini.</p>
      </Card>
    </div>
  </div>
);

const MainApp = () => {
  const { sessionUser, logout, systemInitialized } = useContext(AuthContext);
  const [currentView, setCurrentView] = useState('HOME');
  useEffect(() => { setCurrentView('HOME'); }, [sessionUser?.id]);

  if (!systemInitialized) return <SystemInitScreen />;
  if (!sessionUser) return <LoginScreen />;
  if (['DRIVER', 'CUSTOMER_TANGKI', 'CUSTOMER_GALLON', 'CUSTOMER_KAPAL', 'CUSTOMER_GAS'].includes(sessionUser.role)) return <DriverPortal user={sessionUser} logout={logout} />;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 flex justify-between items-center shadow-xs">
        <GalanganKalimasLogo size="sm" />
        <button onClick={logout} className="p-2 bg-red-50 text-red-600 rounded-xl shadow-xs"><LogOut size={16} /></button>
      </header>
      <main>
        {currentView === 'HOME' && <DivisionSelector user={sessionUser} onSelectDivision={setCurrentView} />}
        {currentView === 'TANDON' && <SharedOperatorTemplate user={sessionUser} onNavigateHome={()=>setCurrentView('HOME')} title="Air Tandon" icon={Droplet} unitLabel="Tandon" textClass="text-blue-600" variantClass="border-blue-100" buttonVariant="primary" dbKeys={{entity: 'tandon_drivers', nameField: 'name', divType: 'TANDON', prefix: 'td', config: 'tandon_config'}} />}
        {currentView === 'GALLON' && <SharedOperatorTemplate user={sessionUser} onNavigateHome={()=>setCurrentView('HOME')} title="Air Gallon" icon={Package} unitLabel="Gallon" textClass="text-indigo-600" variantClass="border-indigo-100" buttonVariant="indigo" dbKeys={{entity: 'gallon_customers', nameField: 'name', divType: 'GALLON', prefix: 'gl', config: 'gallon_config'}} />}
        {currentView === 'MOBIL_TANGKI' && <SharedOperatorTemplate user={sessionUser} onNavigateHome={()=>setCurrentView('HOME')} title="Mobil Tangki" icon={Truck} unitLabel="Tangki" textClass="text-emerald-600" variantClass="border-emerald-100" buttonVariant="emerald" dbKeys={{entity: 'tangki_customers', nameField: 'name', divType: 'MOBIL_TANGKI', prefix: 'mt', config: 'tangki_config'}} />}
        {currentView === 'AIR_KAPAL' && <SharedOperatorTemplate user={sessionUser} onNavigateHome={()=>setCurrentView('HOME')} title="Air Kapal" icon={Anchor} unitLabel="Ton" priceLabel="/ Ton" textClass="text-cyan-600" variantClass="border-cyan-100" buttonVariant="cyan" dbKeys={{entity: 'kapal_ships', nameField: 'shipName', divType: 'AIR_KAPAL', prefix: 'ak', config: 'kapal_config'}} />}
        {currentView === 'GAS_INDUSTRI' && <SharedOperatorTemplate user={sessionUser} onNavigateHome={()=>setCurrentView('HOME')} title="Gas Industri" icon={Flame} unitLabel="Tabung" textClass="text-orange-600" variantClass="border-orange-100" buttonVariant="orange" dbKeys={{entity: 'gas_customers', nameField: 'name', divType: 'GAS_INDUSTRI', prefix: 'gs', config: 'gas_config'}} />}
        {currentView === 'REPORTS' && <ReportsModule user={sessionUser} onNavigateHome={()=>setCurrentView('HOME')} />}
        {currentView === 'ADMIN' && <AdminPanel onNavigateHome={()=>setCurrentView('HOME')} />}
      </main>
    </div>
  );
};

export default function App() { 
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
