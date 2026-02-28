import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, CreditCard, ArrowLeft, LogOut, CheckCircle, XCircle, ShoppingBag } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, updateDoc, doc, query, orderBy, getDocs, where, getDoc } from 'firebase/firestore';

interface AdminPanelProps {
  onClose: () => void;
}

interface Transaction {
  id: string;
  transactionId: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'rejected';
  userEmail: string;
  userId: string;
  date: string;
}

interface Order {
  id: string;
  category: string;
  service: string;
  link: string;
  quantity: number;
  charge: number;
  status: string;
  userEmail: string;
  createdAt: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  balance: number;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'orders' | 'users'>('transactions');

  useEffect(() => {
    if (isAdminLoggedIn) {
      // Listen to Transactions
      const qTx = query(collection(db, "transactions"), orderBy("date", "desc"));
      const unsubscribeTx = onSnapshot(qTx, (snapshot) => {
        const txs: any[] = [];
        snapshot.forEach((doc) => {
          txs.push({ id: doc.id, ...doc.data() });
        });
        setTransactions(txs);
      });

      // Listen to Orders
      const qOrders = query(collection(db, "orders"), orderBy("timestamp", "desc"));
      const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
        const ords: any[] = [];
        snapshot.forEach((doc) => {
          ords.push({ id: doc.id, ...doc.data() });
        });
        setOrders(ords);
      });

      // Listen to Users
      const qUsers = query(collection(db, "profiles"));
      const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
        const usrs: any[] = [];
        snapshot.forEach((doc) => {
          usrs.push({ id: doc.id, ...doc.data() });
        });
        setUsers(usrs);
      });

      return () => {
        unsubscribeTx();
        unsubscribeOrders();
        unsubscribeUsers();
      };
    }
  }, [isAdminLoggedIn]);

  const handleStatusUpdate = async (id: string, status: 'completed' | 'rejected') => {
    try {
      setIsLoading(true);
      const tx = transactions.find(t => t.id === id);
      if (!tx) throw new Error("Transaction not found");

      if (status === 'completed' && tx.status !== 'completed') {
        // 1. Get User Profile
        const userDocRef = doc(db, "profiles", tx.userId);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) throw new Error("User profile not found");
        
        const userProfile = userDocSnap.data() as UserProfile;

        // 2. Update Balance
        const newBalance = (userProfile.balance || 0) + tx.amount;
        await updateDoc(userDocRef, { balance: newBalance });
      }

      // 3. Update Transaction Status
      await updateDoc(doc(db, "transactions", id), { status });
      
      alert(`পেমেন্ট ${status === 'completed' ? 'সফল' : 'বাতিল'} করা হয়েছে!`);
    } catch (err) {
      console.error("Failed to update status", err);
      alert("পেমেন্ট আপডেট করতে সমস্যা হয়েছে: " + (err as any).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Admin login attempt with:", email);
    if (email === 'mdesaalli74@gmail.com' && password === 'mdesa1111') {
      setIsAdminLoggedIn(true);
      setError('');
      alert("Admin Login Successful!");
    } else {
      setError('Invalid admin credentials');
      alert("ভুল এডমিন ইমেইল বা পাসওয়ার্ড!");
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            Admin Login
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm font-medium">{error}</div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Back to App
                </button>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = [
    { name: 'Total Users', stat: users.length.toString(), icon: Users, color: 'bg-blue-500' },
    { name: 'Total Orders', stat: orders.length.toString(), icon: ShoppingBag, color: 'bg-indigo-500' },
    { name: 'Total Transactions', stat: transactions.length.toString(), icon: CreditCard, color: 'bg-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-4">
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'transactions' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Transactions
                </button>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'orders' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Orders
                </button>
                <button 
                  onClick={() => setActiveTab('users')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'users' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Users
                </button>
              </div>
              <button 
                onClick={() => setIsAdminLoggedIn(false)}
                className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-8">
        {/* Mobile Tabs */}
        <div className="sm:hidden px-4 flex gap-2 overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-full ${activeTab === 'transactions' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
          >
            Transactions
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-full ${activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 whitespace-nowrap text-sm font-medium rounded-full ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
          >
            Users
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-3">
          {stats.map((item) => (
            <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`rounded-md p-3 ${item.color}`}>
                      <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-slate-500 truncate">{item.name}</dt>
                      <dd>
                        <div className="text-2xl font-bold text-slate-900">{item.stat}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-slate-900">Recent Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sender Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No transactions found</td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900">{tx.transactionId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{tx.userEmail}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">৳{tx.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tx.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            tx.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{tx.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {tx.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleStatusUpdate(tx.id, 'completed')}
                                disabled={isLoading}
                                className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                title="Accept"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(tx.id, 'rejected')}
                                disabled={isLoading}
                                className="text-rose-600 hover:text-rose-900 bg-rose-50 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-slate-900">Recent Orders</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Link</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Charge</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No orders found</td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{order.userEmail}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{order.service}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 truncate max-w-[150px]">
                          <a href={order.link} target="_blank" rel="noopener noreferrer">{order.link}</a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">৳{order.charge.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-slate-900">Registered Users</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No users found</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">{user.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-emerald-600">৳{user.balance.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
