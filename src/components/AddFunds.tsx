import React from 'react';
import { motion } from 'motion/react';
import { History, ArrowLeft, Copy, Info } from 'lucide-react';
import { PaymentRecord } from '../types';
import { paymentNumbers } from '../constants';

interface AddFundsProps {
  paymentMethod: 'nagad' | 'bkash';
  fundStep: 'amount' | 'verify';
  fundAmount: string;
  fundTransactionId: string;
  isFunding: boolean;
  paymentHistory: PaymentRecord[];
  fundError: string | null;
  onSetPaymentMethod: (method: 'nagad' | 'bkash') => void;
  onSetFundStep: (step: 'amount' | 'verify') => void;
  onFundAmountChange: (val: string) => void;
  onFundTransactionIdChange: (val: string) => void;
  onAddFunds: () => void;
  onCopy: (text: string | number) => void;
  onDemoFill?: () => void;
}

export const AddFunds: React.FC<AddFundsProps> = ({
  paymentMethod,
  fundStep,
  fundAmount,
  fundTransactionId,
  isFunding,
  paymentHistory,
  fundError,
  onSetPaymentMethod,
  onSetFundStep,
  onFundAmountChange,
  onFundTransactionIdChange,
  onAddFunds,
  onCopy,
  onDemoFill
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Add Funds</h2>
        {onDemoFill && (
          <button 
            onClick={onDemoFill}
            className="text-[10px] font-bold bg-indigo-600 text-white px-3 py-1 rounded-full shadow-sm hover:bg-indigo-700 transition-colors"
          >
            Demo Fill
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => {
            onSetPaymentMethod('nagad');
            onSetFundStep('amount');
          }}
          className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'nagad' ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
        >
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center p-2">
            <img src="https://res.cloudinary.com/dlklqihg6/image/upload/v1772267091/cats3nrgrcjggahbhtw3.jpg" alt="Nagad" className="w-full object-contain" />
          </div>
          <span className={`text-xs font-bold ${paymentMethod === 'nagad' ? 'text-orange-600' : 'text-slate-500'}`}>Nagad</span>
        </button>
        <button 
          onClick={() => {
            onSetPaymentMethod('bkash');
            onSetFundStep('amount');
          }}
          className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'bkash' ? 'border-pink-500 bg-pink-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
        >
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center p-2">
            <img src="https://res.cloudinary.com/dlklqihg6/image/upload/v1772267145/frar0o02q4x5me9o5zhy.webp" alt="Bkash" className="w-full object-contain" />
          </div>
          <span className={`text-xs font-bold ${paymentMethod === 'bkash' ? 'text-pink-600' : 'text-slate-500'}`}>Bkash</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
        {fundStep === 'amount' ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${paymentMethod === 'nagad' ? 'bg-orange-100 text-orange-600' : 'bg-pink-100 text-pink-600'}`}>1</div>
              <p className="text-sm font-bold text-slate-700">টাকার পরিমাণ দিন</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">টাকার পরিমাণ (BDT)</label>
              <input 
                type="number"
                placeholder="কত টাকা অ্যাড করতে চান?"
                value={fundAmount}
                onChange={(e) => onFundAmountChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-lg"
              />
              <p className="text-[10px] text-slate-400 ml-1">সর্বনিম্ন ২০ টাকা</p>
            </div>

            <button 
              onClick={() => {
                if (!fundAmount) {
                  alert("দয়া করে টাকার পরিমাণ দিন");
                  return;
                }
                if (parseFloat(fundAmount) < 20) {
                  alert("সর্বনিম্ন ২০ টাকা অ্যাড করতে পারবেন");
                  return;
                }
                onSetFundStep('verify');
              }}
              className={`w-full py-4 rounded-2xl font-bold text-xl shadow-lg transition-all flex items-center justify-center gap-2 ${paymentMethod === 'nagad' ? 'bg-orange-600 text-white shadow-orange-200 hover:bg-orange-700' : 'bg-pink-600 text-white shadow-pink-200 hover:bg-pink-700'}`}
            >
              পরবর্তী ধাপ
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <button 
              onClick={() => onSetFundStep('amount')}
              className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> পরিমাণ পরিবর্তন করুন
            </button>

            {/* Step 1: Payment Info */}
            <div className="bg-slate-50 rounded-2xl p-5 space-y-4 border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${paymentMethod === 'nagad' ? 'bg-orange-100 text-orange-600' : 'bg-pink-100 text-pink-600'}`}>2</div>
                  <p className="text-sm font-bold text-slate-700">এই নম্বরে Send Money করুন</p>
                </div>
                <button 
                  onClick={() => onCopy(paymentNumbers[paymentMethod])}
                  className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${paymentMethod === 'nagad' ? 'text-orange-600 bg-orange-100 hover:bg-orange-200' : 'text-pink-600 bg-pink-100 hover:bg-pink-200'}`}
                >
                  <Copy className="w-3.5 h-3.5" /> কপি নম্বর
                </button>
              </div>
              
              <div className="text-center py-2">
                <p className="text-3xl font-black text-slate-900 tracking-wider font-mono">
                  {paymentNumbers[paymentMethod]}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Personal Number</p>
                <div className="mt-4 p-3 bg-white rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500">
                    পরিমাণ: <span className="text-slate-900">৳{parseFloat(fundAmount) === 20 ? '27.00' : parseFloat(fundAmount).toFixed(2)}</span>
                    {parseFloat(fundAmount) === 20 && <span className="text-rose-500 ml-1">(২০ টাকার জন্য ২৭ টাকা সেন্ড করুন)</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Inputs */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${paymentMethod === 'nagad' ? 'bg-orange-100 text-orange-600' : 'bg-pink-100 text-pink-600'}`}>3</div>
                <p className="text-sm font-bold text-slate-700">পেমেন্টের তথ্য দিন</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Transaction ID</label>
                <input 
                  type="text"
                  placeholder="TrxID (যেমন: 8N7...)"
                  value={fundTransactionId}
                  onChange={(e) => onFundTransactionIdChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-bold text-lg"
                />
              </div>

              {fundError && (
                <p className="text-sm text-rose-500 font-medium text-center bg-rose-50 py-2 rounded-xl border border-rose-100">{fundError}</p>
              )}

              <button 
                onClick={() => {
                  if (!fundTransactionId || fundTransactionId.length < 4) {
                    alert("সঠিক Transaction ID দিন");
                    return;
                  }
                  onAddFunds();
                }}
                disabled={isFunding}
                className={`w-full py-4 rounded-2xl font-bold text-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 ${paymentMethod === 'nagad' ? 'bg-orange-600 text-white shadow-orange-200 hover:bg-orange-700' : 'bg-pink-600 text-white shadow-pink-200 hover:bg-pink-700'}`}
              >
                {isFunding ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    সাবমিট হচ্ছে...
                  </>
                ) : (
                  'সাবমিট করো'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Payment History (Last 7 Days)</h3>
          <History className="w-4 h-4 text-slate-400" />
        </div>
        
        {paymentHistory.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center">
            <p className="text-sm text-slate-400">No payment history found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentHistory.map(payment => (
              <div key={payment.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-2 ${payment.method === 'nagad' ? 'bg-orange-50' : 'bg-pink-50'}`}>
                    <img 
                      src={payment.method === 'nagad' ? "https://res.cloudinary.com/dlklqihg6/image/upload/v1772267091/cats3nrgrcjggahbhtw3.jpg" : "https://res.cloudinary.com/dlklqihg6/image/upload/v1772267145/frar0o02q4x5me9o5zhy.webp"} 
                      alt={payment.method} 
                      className="w-full object-contain" 
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">৳{payment.amount.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{payment.transactionId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
                    payment.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                    payment.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-rose-50 text-rose-600'
                  }`}>
                    {payment.status}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-1">{payment.createdAt.split(',')[0]}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Important Instructions */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 space-y-3">
        <h3 className="font-bold text-indigo-900 flex items-center gap-2">
          <Info className="w-4 h-4" /> জরুরী নির্দেশনা
        </h3>
        <ul className="space-y-2 text-xs text-indigo-800">
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            সর্বনিম্ন ২০ টাকা অ্যাড করতে পারবেন।
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            টাকা পাঠানোর সময় অবশ্যই Send Money করবেন।
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            সঠিক Transaction ID দিয়ে সাবমিট করো বাটনে ক্লিক করুন।
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            টাকা অ্যাড হতে কোনো সমস্যা হলে সাপোর্ট টিকিটে যোগাযোগ করুন।
          </li>
        </ul>
      </div>
    </motion.div>
  );
};
