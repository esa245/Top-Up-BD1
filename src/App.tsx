import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  TrendingUp, 
  Facebook, 
  Zap 
} from 'lucide-react';
import { motion } from 'motion/react';
import { db, auth } from './firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  addDoc, 
  getDoc, 
  setDoc,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';

// Types & Constants
import { Category, Service, Order, PaymentRecord, UserData, ApiService } from './types';
import { USD_TO_BDT } from './constants';

// Components
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { NewOrder } from './components/NewOrder';
import { OrderHistory } from './components/OrderHistory';
import { AddFunds } from './components/AddFunds';
import { Support } from './components/Support';
import { Account } from './components/Account';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // App State
  const [activeTab, setActiveTab] = useState<'new-order' | 'orders' | 'add-funds' | 'support' | 'account'>('new-order');
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  const [charge, setCharge] = useState(0);
  const [transactionId, setTransactionId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [isInitialAuthLoading, setIsInitialAuthLoading] = useState(true);
  const [balance, setBalance] = useState<string>('0.00');
  const [paymentMethod, setPaymentMethod] = useState<'nagad' | 'bkash'>('nagad');
  const [fundAmount, setFundAmount] = useState('');
  const [fundTransactionId, setFundTransactionId] = useState('');
  const [isFunding, setIsFunding] = useState(false);
  const [fundStep, setFundStep] = useState<'amount' | 'verify'>('amount');
  const [fundError, setFundError] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [isRealServices, setIsRealServices] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Fetch user transactions and apply balance (Firebase Real-time)
  useEffect(() => {
    if (!isLoggedIn || !currentUser || !currentUser.uuid) return;

    // Fetch Orders from Firestore
    const ordersQuery = query(
      collection(db, "orders"),
      where("userId", "==", currentUser.uuid),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const fetchedOrders: Order[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedOrders.push({
          id: data.id,
          category: data.category,
          service: data.service,
          link: data.link,
          quantity: data.quantity,
          charge: data.charge,
          transactionId: data.transactionId,
          status: data.status,
          createdAt: data.createdAt
        });
      });
      setOrders(fetchedOrders);
    });

    const q = query(
      collection(db, "transactions"), 
      where("userEmail", "==", currentUser.email)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const transactions: any[] = [];
      snapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() });
      });

      // Update local payment history
      const updatedHistory = transactions.map((t: any) => ({
        id: t.id,
        method: t.method,
        amount: t.amount,
        transactionId: t.transactionId,
        status: t.status,
        createdAt: t.date
      }));
      setPaymentHistory(updatedHistory);
    });

    // Real-time Profile Listener
    const unsubscribeProfile = onSnapshot(doc(db, "profiles", currentUser.uuid), (doc) => {
      if (doc.exists()) {
        const profile = doc.data();
        setCurrentUser(prev => prev ? {
          ...prev,
          name: profile.full_name,
          balance: profile.balance
        } : null);
        setBalance(profile.balance.toString());
      }
    });

    return () => {
      unsubscribe();
      unsubscribeOrders();
      unsubscribeProfile();
    };
  }, [isLoggedIn, currentUser]);

  // Combined Loading State - Only block UI for initial auth check
  const isLoading = isInitialAuthLoading;

  // Fetch Services
  useEffect(() => {
    const fallbackServices = [
      { category: 'Facebook Services', service: 1, name: 'Facebook Page Likes', rate: '0.50', min: '100', max: '10000', type: 'Default', refill: true, cancel: false },
      { category: 'Facebook Services', service: 2, name: 'Facebook Post Likes', rate: '0.10', min: '100', max: '50000', type: 'Default', refill: false, cancel: false },
      { category: 'TikTok Services', service: 3, name: 'TikTok Views', rate: '0.01', min: '1000', max: '1000000', type: 'Default', refill: false, cancel: false },
      { category: 'Instagram Services', service: 5, name: 'Instagram Followers', rate: '0.80', min: '100', max: '50000', type: 'Default', refill: true, cancel: true },
      { category: 'YouTube Services', service: 9, name: 'YouTube Subscribers', rate: '2.50', min: '100', max: '5000', type: 'Default', refill: true, cancel: true },
    ];

    const processServices = (data: any[]) => {
      const grouped: { [key: string]: Category } = {};
      
      // Filter out invalid items
      const validServices = data.filter(svc => svc && typeof svc === 'object' && (svc.service || svc.id));

      validServices.forEach((svc: ApiService) => {
        const categoryName = svc.category || 'Other Services';
        if (!grouped[categoryName]) {
          const catLower = categoryName.toLowerCase();
          const isFB = catLower.includes('facebook') || catLower.includes('fb');
          const isTT = catLower.includes('tiktok') || catLower.includes('tik tok');
          const isIG = catLower.includes('instagram') || catLower.includes('ig');
          const isYT = catLower.includes('youtube') || catLower.includes('yt');
          const isTW = catLower.includes('twitter') || catLower.includes('x');
          const isTG = catLower.includes('telegram') || catLower.includes('tg');
          
          grouped[categoryName] = {
            id: categoryName,
            name: categoryName,
            icon: isFB ? <Facebook className="w-4 h-4" /> : 
                  isTT ? <TrendingUp className="w-4 h-4" /> : 
                  isIG ? <Zap className="w-4 h-4" /> :
                  isYT ? <Zap className="w-4 h-4" /> : 
                  isTW ? <Zap className="w-4 h-4" /> :
                  isTG ? <Zap className="w-4 h-4" /> : <Zap className="w-4 h-4" />,
            services: []
          };
        }
        
        const rate = parseFloat(svc.rate?.toString() || '0');
        // Convert USD to BDT and add a small margin (e.g., 5 BDT)
        const rateInBDT = (rate * USD_TO_BDT) + 5;
        
        grouped[categoryName].services.push({
          id: svc.service?.toString() || svc.id?.toString() || Math.random().toString(),
          name: svc.name || 'Unknown Service',
          ratePer1000: rateInBDT,
          min: parseInt(svc.min?.toString() || '10'),
          max: parseInt(svc.max?.toString() || '10000'),
          description: [
            `Type: ${svc.type || 'Default'}`,
            `Refill: ${svc.refill ? 'Yes' : 'No'}`,
            `Cancel: ${svc.cancel ? 'Yes' : 'No'}`,
            `Rate: ৳${rateInBDT.toFixed(2)} per 1000`
          ]
        });
      });

      const catList = Object.values(grouped);
      if (catList.length > 0) {
        setCategories(catList);
        setSelectedCategory(catList[0]);
        setSelectedService(catList[0].services[0]);
      }
    };

    // Try to fetch real services
    const fetchRealServices = async () => {
      setIsServicesLoading(true);
      try {
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'services' })
        });
        
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Server Error (${response.status})`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          console.error("MotherPanel API Error:", data.error);
          setServicesError(`API Error: ${data.error}`);
          // Fallback if real fails
          processServices(fallbackServices);
          return;
        }

        let servicesArray = [];
        if (Array.isArray(data)) {
          servicesArray = data;
        } else if (data && typeof data === 'object' && Array.isArray(data.services)) {
          servicesArray = data.services;
        } else if (data && typeof data === 'object') {
          servicesArray = Object.values(data).filter(item => item && typeof item === 'object' && ('service' in item || 'id' in item));
        }

        if (servicesArray.length > 0) {
          processServices(servicesArray);
          setIsRealServices(true);
          setServicesError(null);
          console.log(`Loaded ${servicesArray.length} real services from MotherPanel`);
        } else {
          setServicesError("No services found from provider.");
          processServices(fallbackServices);
        }
      } catch (e: any) {
        console.error("Service Fetch Error:", e);
        const errorMessage = e.message === 'Failed to fetch' 
          ? "Network Error: Could not connect to the server. Please check your internet or server status."
          : `Error: ${e.message || "Failed to connect to provider."}`;
        setServicesError(errorMessage);
        processServices(fallbackServices);
      } finally {
        setIsServicesLoading(false);
      }
    };

    fetchRealServices();
  }, []);

  // Automatic Order Status Polling
  useEffect(() => {
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'in progress');
    if (pendingOrders.length === 0) return;

    const interval = setInterval(() => {
      pendingOrders.forEach(order => {
        refreshOrderStatus(order.id);
      });
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [orders]);

  // Auth Effects
  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      handleTabChange(e.detail);
    };
    window.addEventListener('switchTab', handleSwitchTab);
    
    // Global fail-safe: Force loading screen to disappear almost instantly (0.8s)
    const globalTimeout = setTimeout(() => {
      setIsInitialAuthLoading(false);
    }, 800);

    const fetchAndSetProfile = async (user: any) => {
      try {
        const profileDoc = await getDoc(doc(db, "profiles", user.uid));
        let profile = profileDoc.exists() ? profileDoc.data() : null;

        if (!profile) {
          const newProfile = { 
            id: user.uid,
            full_name: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email,
            balance: 0
          };
          await setDoc(doc(db, "profiles", user.uid), newProfile);
          profile = newProfile;
        }

        if (profile) {
          setCurrentUser({
            uuid: user.uid,
            email: user.email!,
            name: profile.full_name,
            balance: profile.balance
          });
          setBalance(profile.balance.toString());
        } else {
          // Fallback if profile still not available
          setCurrentUser({
            uuid: user.uid,
            email: user.email!,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            balance: 0
          });
        }
        setIsLoggedIn(true);
      } catch (err) {
        console.error("Auth process error:", err);
      }
    };

    const initAuth = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Immediately show the app if session exists
          setIsLoggedIn(true);
          setIsInitialAuthLoading(false);
          // Fetch profile in background
          fetchAndSetProfile(user);
        } else {
          setIsInitialAuthLoading(false);
        }
      } catch (err) {
        console.error("Session check error:", err);
        setIsInitialAuthLoading(false);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        await fetchAndSetProfile(user);
        setShowAuthModal(false);
        setIsInitialAuthLoading(false);
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setBalance('0.00');
      }
    });

    return () => {
      clearTimeout(globalTimeout);
      unsubscribe();
      window.removeEventListener('switchTab', handleSwitchTab);
    };
  }, []);

  // Handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        const user = userCredential.user;
        
        // Update profile with name
        await updateProfile(user, { displayName: authName });
        
        // Create profile in Firestore
        const newProfile = { 
          id: user.uid,
          full_name: authName || user.email?.split('@')[0] || 'User',
          email: user.email,
          balance: 0
        };
        await setDoc(doc(db, "profiles", user.uid), newProfile);
        
        alert("Account created successfully!");
        setShowAuthModal(false);
      } else if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        setShowAuthModal(false);
      } else if (authMode === 'forgot-password') {
        await sendPasswordResetEmail(auth, authEmail);
        alert("Password reset email sent! Check your inbox.");
        setAuthMode('login');
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let errorMessage = "লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।";
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = "ভুল ইমেইল বা পাসওয়ার্ড! দয়া করে সঠিক তথ্য দিন।";
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = "এই ইমেইলটি দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা হয়েছে। লগইন করার চেষ্টা করুন।";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "সঠিক ইমেইল এড্রেস দিন।";
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।";
      }
      
      alert(errorMessage);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setCurrentUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleTabChange = (tab: any) => {
    if (!isLoggedIn && (tab === 'add-funds' || tab === 'account' || tab === 'orders')) {
      setShowAuthModal(true);
      return;
    }
    setActiveTab(tab);
  };

  useEffect(() => {
    if (selectedService && quantity) {
      const qty = parseInt(quantity) || 0;
      const calculatedCharge = (qty / 1000) * selectedService.ratePer1000;
      setCharge(calculatedCharge);
    } else {
      setCharge(0);
    }
  }, [quantity, selectedService]);

  const handleVerify = async () => {
    if (!selectedService || !currentUser) return;
    
    setIsVerifying(true);
    try {
      // 1. Check if user has enough balance
      if (currentUser.balance < charge) {
        alert("আপনার ব্যালেন্স পর্যাপ্ত নয়। দয়া করে ফান্ড অ্যাড করুন।");
        setIsVerifying(false);
        return;
      }

      // 2. Deduct Balance from Firestore
      const newBalance = currentUser.balance - charge;
      try {
        await updateDoc(doc(db, "profiles", currentUser.uuid), { balance: newBalance });
      } catch (err) {
        console.error("Error deducting balance:", err);
        throw new Error("Failed to deduct balance.");
      }

      // 3. Place Order via Proxy
      const orderRes = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'add', 
          service: selectedService.id, 
          link, 
          quantity 
        })
      });
      
      const orderData = await orderRes.json();
      
      if (orderData.order) {
        // 4. Update local state and store order in Firestore
        const newOrder: Order = {
          id: orderData.order.toString(),
          category: selectedCategory?.name || '',
          service: selectedService.name,
          link,
          quantity: parseInt(quantity),
          charge,
          transactionId: transactionId || 'BALANCE',
          status: 'pending',
          createdAt: new Date().toLocaleString()
        };

        try {
          await addDoc(collection(db, "orders"), {
            ...newOrder,
            userEmail: currentUser.email,
            userId: currentUser.uuid,
            timestamp: new Date()
          });
        } catch (err) {
          console.error("Error storing order in Firestore:", err);
          // We don't throw here because the order was already placed at the provider
        }

        setCurrentUser({ ...currentUser, balance: newBalance });
        setBalance(newBalance.toString());
        setOrders(prev => [newOrder, ...prev]);
      alert(`অর্ডার সফলভাবে সম্পন্ন হয়েছে! অর্ডার আইডি: ${orderData.order}`);
      setStep('form');
      setLink('');
      setQuantity('');
      setTransactionId('');
      setActiveTab('orders');
    } else {
      // Refund balance if order fails
      try {
        await updateDoc(doc(db, "profiles", currentUser.uuid), { balance: currentUser.balance });
      } catch (err) {
        console.error("Error refunding balance:", err);
      }
      
      alert("অর্ডার করতে সমস্যা হয়েছে: " + (orderData.error || "Unknown error"));
    }
  } catch (error: any) {
    console.error("Verification Error:", error);
    alert("অর্ডার প্রসেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
  } finally {
    setIsVerifying(false);
  }
};

  const handleAddFunds = async () => {
    setFundError(null);
    if (!fundAmount) {
      setFundError("আপনার টাকা কম ২০ টাকার নিচে হবে না");
      return;
    }
    if (parseFloat(fundAmount) < 20) {
      setFundError("আপনার টাকা কম ২০ টাকার নিচে হবে না");
      return;
    }
    if (!fundTransactionId || fundTransactionId.length < 4) {
      setFundError("সঠিক Transaction ID দিন");
      return;
    }
    if (!currentUser) return;
    
    setIsFunding(true);
    console.log("Submitting transaction to Firebase:", { fundTransactionId, fundAmount, paymentMethod });
    
    // 1. Submit Transaction to Firebase (Background)
    const newTx = {
      transactionId: fundTransactionId,
      amount: parseFloat(fundAmount),
      method: paymentMethod,
      userEmail: currentUser.email,
      userId: currentUser.uuid,
      status: 'pending',
      date: new Date().toLocaleString(),
      applied: false
    };

    // Fire and forget - don't await
    addDoc(collection(db, "transactions"), newTx)
      .then((docRef) => {
        console.log("Transaction submitted successfully! Doc ID:", docRef.id);
      })
      .catch((error) => {
        console.error("Funding Error (Background):", error);
      });
      
    // 2. Immediate Feedback
    alert("আপনার রিকোয়েস্টটি পেন্ডিং এ আছে। ওকে।");
    setFundAmount('');
    setFundTransactionId('');
    setFundStep('amount');
    setFundError(null);
    setIsFunding(false);
  };

  const refreshOrderStatus = async (id: string) => {
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', order: id })
      });
      const data = await res.json();
      if (data.status) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: data.status.toLowerCase() } : o));
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Order Received!</h2>
          <p className="text-slate-600 mb-8">Your payment from number ending in <span className="font-mono font-bold">{transactionId}</span> has been verified.</p>
          <button onClick={() => { setStep('form'); setIsSuccess(false); setLink(''); setQuantity(''); setTransactionId(''); }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-semibold hover:bg-indigo-700 transition-colors">
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 animate-pulse">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-500 font-bold animate-pulse">Loading Top Up BD...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <AuthModal 
          show={true}
          mode={authMode}
          email={authEmail}
          password={authPassword}
          name={authName}
          showPassword={showPassword}
          isLoading={isAuthLoading}
          isClosable={false}
          onClose={() => {}}
          onModeChange={setAuthMode}
          onEmailChange={setAuthEmail}
          onPasswordChange={setAuthPassword}
          onNameChange={setAuthName}
          onTogglePassword={() => setShowPassword(!showPassword)}
          onSubmit={handleAuth}
        />
      </div>
    );
  }

  if (showAdminPanel) {
    return <AdminPanel onClose={() => setShowAdminPanel(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header 
        isLoggedIn={isLoggedIn} 
        balance={balance} 
        userName={currentUser?.name}
        onTabChange={handleTabChange} 
        onShowAuth={() => setShowAuthModal(true)} 
        onAdminClick={() => setShowAdminPanel(true)}
      />

      <main className="max-w-lg mx-auto p-4 pb-24">
        {activeTab === 'new-order' && (
          <NewOrder 
            isLoading={isServicesLoading}
            isRealServices={isRealServices}
            servicesError={servicesError}
            categories={categories}
            selectedCategory={selectedCategory}
            selectedService={selectedService}
            link={link}
            quantity={quantity}
            charge={charge}
            transactionId={transactionId}
            isVerifying={isVerifying}
            step={step}
            userBalance={parseFloat(balance)}
            onCategoryChange={(e) => {
              const cat = categories.find(c => c.id === e.target.value);
              if (cat) { setSelectedCategory(cat); setSelectedService(cat.services[0]); }
            }}
            onServiceChange={(e) => {
              const svc = selectedCategory?.services.find(s => s.id === e.target.value);
              if (svc) setSelectedService(svc);
            }}
            onLinkChange={setLink}
            onQuantityChange={setQuantity}
            onTransactionIdChange={setTransactionId}
            onSubmitOrder={(e) => {
              e.preventDefault();
              if (!isLoggedIn) { setShowAuthModal(true); return; }
              if (!link) { alert("দয়া করে লিংক দিন"); return; }
              if (!quantity) { alert("দয়া করে পরিমাণ দিন"); return; }
              if (!selectedService) { alert("দয়া করে একটি সার্ভিস সিলেক্ট করুন"); return; }
              
              const qty = parseInt(quantity);
              if (qty < selectedService.min) {
                alert(`সর্বনিম্ন পরিমাণ ${selectedService.min}`);
                return;
              }
              if (qty > selectedService.max) {
                alert(`সর্বোচ্চ পরিমাণ ${selectedService.max}`);
                return;
              }
              
              setStep('payment');
            }}
            onVerify={handleVerify}
            onSetStep={setStep}
            onCopy={(text) => navigator.clipboard.writeText(text.toString())}
            onRefreshServices={() => {
              setIsServicesLoading(true);
              // The fetchRealServices is inside the useEffect, I should move it out or trigger it.
              // For simplicity, I'll just reload the page or trigger the effect if I can.
              // Actually, I'll move fetchRealServices outside the useEffect.
              window.location.reload();
            }}
          />
        )}

        {activeTab === 'orders' && (
          <OrderHistory 
            orders={orders} 
            onRefresh={refreshOrderStatus} 
            onRefreshAll={() => orders.forEach(o => refreshOrderStatus(o.id))}
            onNewOrder={() => setActiveTab('new-order')}
          />
        )}

        {activeTab === 'add-funds' && (
          <AddFunds 
            paymentMethod={paymentMethod}
            fundStep={fundStep}
            fundAmount={fundAmount}
            fundTransactionId={fundTransactionId}
            isFunding={isFunding}
            paymentHistory={paymentHistory}
            fundError={fundError}
            onSetPaymentMethod={setPaymentMethod}
            onSetFundStep={(step) => {
              setFundError(null);
              setFundStep(step);
            }}
            onFundAmountChange={(val) => {
              setFundError(null);
              setFundAmount(val);
            }}
            onFundTransactionIdChange={(val) => {
              setFundError(null);
              setFundTransactionId(val);
            }}
            onAddFunds={handleAddFunds}
            onCopy={(text) => navigator.clipboard.writeText(text.toString())}
          />
        )}

        {activeTab === 'support' && <Support />}

        {activeTab === 'account' && (
          <Account 
            currentUser={currentUser} 
            balance={balance} 
            orders={orders} 
            onLogout={handleLogout} 
            onAdminClick={() => setShowAdminPanel(true)}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      <AuthModal 
        show={showAuthModal}
        mode={authMode}
        email={authEmail}
        password={authPassword}
        name={authName}
        showPassword={showPassword}
        isLoading={isAuthLoading}
        onClose={() => setShowAuthModal(false)}
        onModeChange={setAuthMode}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onNameChange={setAuthName}
        onTogglePassword={() => setShowPassword(!showPassword)}
        onSubmit={handleAuth}
      />
    </div>
  );
}
