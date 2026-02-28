import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, CreditCard, ArrowLeft, LogOut, CheckCircle, XCircle } from 'lucide-react';

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

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions/all');
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchTransactions();
      const interval = setInterval(fetchTransactions, 5000); // Auto refresh
      return () => clearInterval(interval);
    }
  }, [isAdminLoggedIn]);

  const handleStatusUpdate = async (id: string, status: 'completed' | 'rejected') => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/transactions/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'mdesaalli74@gmail.com' && password === 'mdesa1111') {
      setIsAdminLoggedIn(true);
      setError('');
    } else {
      setError('Invalid admin credentials');
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
  const uniqueUsers = new Set(transactions.map(t => t.userEmail)).size;
  const stats = [
    { name: 'Total Users', stat: uniqueUsers.toString(), icon: Users, color: 'bg-blue-500' },
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
            <div className="flex items-center">
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
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
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

        {/* Recent Transactions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-slate-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-slate-900">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Transaction ID</th>
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
      </main>
    </div>
  );
};
