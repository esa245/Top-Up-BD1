import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Settings, LogOut, ChevronDown, User, Gift, Share2 } from 'lucide-react';
import { UserData, Order, PaymentRecord } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, increment, getDocs, query, collection, where } from 'firebase/firestore';

interface AccountProps {
  currentUser: UserData | null;
  balance: string;
  orders: Order[];
  paymentHistory: PaymentRecord[];
  onLogout: () => void;
  onAdminClick: () => void;
}

export const Account: React.FC<AccountProps> = ({ currentUser, balance, orders, paymentHistory, onLogout }) => {
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [referralName, setReferralName] = useState('');

  const handleReferralSubmit = async () => {
    if (!referralName.trim()) return;
    
    try {
      // 1. Check if referrer exists (using customId)
      const q = query(collection(db, "profiles"), where("customId", "==", referralName.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert("এই আইডির কোনো ইউজার পাওয়া যায়নি।");
        return;
      }

      // 2. Prevent self-referral
      if (currentUser?.customId === referralName.trim()) {
         alert("আপনি নিজেকে রেফার করতে পারবেন না।");
         return;
      }

      // 3. Update current user profile
      if (currentUser?.uuid) {
        const userRef = doc(db, "profiles", currentUser.uuid);
        
        // Add 5 taka balance and set referredBy
        await updateDoc(userRef, {
          referredBy: referralName.trim(),
          balance: increment(5)
        });

        alert(`অভিনন্দন! আপনি ৫ টাকা জিতেছেন।`);
        setReferralName('');
      }
    } catch (error) {
      console.error("Error submitting referral:", error);
      alert("সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Join this awesome app!',
      text: `Join me on this app! Use my ID "${currentUser?.customId}" as referral.`,
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError' && !err.message?.includes('canceled')) {
          console.error('Error sharing:', err);
        }
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-indigo-50 border-4 border-white shadow-lg flex items-center justify-center text-indigo-400">
              <User className="w-12 h-12" />
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{currentUser?.name || 'User'}</h3>
            <p className="text-slate-500 text-sm">{currentUser?.email}</p>
            {currentUser?.customId && (
              <div className="flex items-center gap-1 justify-center mt-1">
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  ID: {currentUser.customId}
                </span>
                <button 
                  onClick={() => navigator.clipboard.writeText(currentUser.customId || '')}
                  className="text-slate-400 hover:text-indigo-600"
                >
                  <Share2 className="w-3 h-3" />
                </button>
              </div>
            )}
            <p className="text-slate-400 text-[10px] mt-1">Member since Feb 2026</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50">
          <div className="bg-slate-50 p-4 rounded-2xl text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Current Balance</p>
            <p className="text-xl font-black text-emerald-600">৳{parseFloat(balance).toFixed(2)}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl text-center">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Total Spent</p>
            <p className="text-xl font-black text-indigo-600">৳{orders.reduce((acc, o) => acc + o.charge, 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Refer a Friend Section */}
        <div className="p-5 border-b border-slate-50">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                        <Gift className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-700">Refer a Friend</span>
                </div>
                <button 
                  onClick={handleShare}
                  className="p-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors"
                  title="Share with friends"
                >
                  <Share2 className="w-5 h-5" />
                </button>
            </div>
            <p className="text-sm text-slate-500 mb-3">আপনার বন্ধুকে শেয়ার করুন ও তার ৬ সংখ্যার ইউজার আইডি এখানে লিখুন এবং জিতে নিন ৫ টাকা</p>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="বন্ধুর ৬ সংখ্যার ইউজার আইডি" 
                    value={referralName}
                    onChange={(e) => setReferralName(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <button 
                    onClick={handleReferralSubmit}
                    className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors"
                >
                    Submit
                </button>
            </div>
        </div>

        {/* Payment History Toggle */}
        <div className="border-b border-slate-50">
            <button 
            onClick={() => setShowPaymentHistory(!showPaymentHistory)}
            className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <CreditCard className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700">Payment History</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform ${showPaymentHistory ? '' : '-rotate-90'}`} />
            </button>
            
            <AnimatePresence>
                {showPaymentHistory && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-slate-50"
                    >
                        {paymentHistory && paymentHistory.length > 0 ? (
                            <div className="p-4 space-y-3">
                                {paymentHistory.map((payment) => (
                                    <div key={payment.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-bold text-slate-700 capitalize">{payment.method}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{payment.transactionId}</p>
                                            <p className="text-[10px] text-slate-400">{payment.createdAt}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">৳{payment.amount}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                payment.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                                payment.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                                                'bg-amber-100 text-amber-600'
                                            }`}>
                                                {payment.status === 'completed' ? 'Accepted' : 
                                                 payment.status === 'rejected' ? 'Rejected' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                No payment history found.
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <button className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              <Settings className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-700">Settings</span>
          </div>
          <ChevronDown className="w-5 h-5 text-slate-300 -rotate-90" />
        </button>
        <button 
          onClick={onLogout}
          className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors text-rose-500"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-bold">Logout</span>
          </div>
        </button>
      </div>
    </motion.div>
  );
};
