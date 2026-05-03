import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { storageService } from '../services/storageService';
import { Wallet as WalletIcon, ArrowUp, ArrowDown, Send, CreditCard, History, Download, QrCode } from 'lucide-react';
import { Toaster } from 'sonner'

interface WalletData {
  balance: number;
  escrow_balance: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  fee: number;
  status: string;
  reference: string;
  created_at: string;
}

export default function Wallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    account_number: '',
    account_name: ''
  });

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();

    // Subscribe to realtime wallet updates
    const subscription = supabase
      .channel('wallet-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${user?.id}` },
        (payload) => {
          setWallet(payload.new as WalletData);
          toast.success('Wallet balance updated!');
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const fetchWalletData = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (!error && data) {
      setWallet(data);
    }
    setLoading(false);
  };

  const fetchTransactions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!error && data) {
      setTransactions(data);
    }
  };

  const initializePayment = async () => {
    if (!amount || parseFloat(amount) < 100) {
      toast.error('Minimum funding amount is ₦100');
      return;
    }

    setLoading(true);
    try {
      // Initialize payment with Paystack
      const response = await supabase.functions.invoke('initialize-payment', {
        body: {
          amount: parseFloat(amount) * 100, // Convert to kobo
          email: user?.email,
          reference: `KHUB-FUND-${Date.now()}`,
          metadata: {
            user_id: user?.id,
            type: 'wallet_funding'
          }
        }
      });

      if (response.data?.authorization_url) {
        // Redirect to Paystack
        window.location.href = response.data.authorization_url;
      } else {
        throw new Error('Payment initialization failed');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestWithdrawal = async () => {
    if (!amount || parseFloat(amount) < 1000) {
      toast.error('Minimum withdrawal amount is ₦1000');
      return;
    }

    if (!bankDetails.account_number || !bankDetails.bank_name) {
      toast.error('Please provide bank details');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          type: 'withdrawal',
          amount: parseFloat(amount),
          status: 'pending',
          reference: `KHUB-WD-${Date.now()}`,
          metadata: bankDetails
        });

      if (error) throw error;
      
      toast.success('Withdrawal request submitted for approval');
      setShowWithdrawModal(false);
      setAmount('');
      setBankDetails({ bank_name: '', account_number: '', account_name: '' });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !wallet) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 pb-24">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <WalletIcon className="w-6 h-6" />
            <span className="font-semibold">Total Balance</span>
          </div>
          <button className="bg-white/20 px-3 py-1 rounded-lg text-sm">
            <QrCode className="w-4 h-4 inline" /> QR
          </button>
        </div>
        <div className="mb-6">
          <div className="text-4xl font-bold">₦{wallet?.balance.toLocaleString()}</div>
          <div className="text-sm opacity-90">Available Balance</div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFundModal(true)}
            className="flex-1 bg-white text-primary py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <ArrowDown className="w-5 h-5" />
            Fund Wallet
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex-1 bg-white/20 border border-white text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <ArrowUp className="w-5 h-5" />
            Withdraw
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <button className="card p-4 text-center hover:shadow-lg transition">
          <Send className="w-6 h-6 text-primary mx-auto mb-2" />
          <span className="text-sm">Transfer</span>
        </button>
        <button className="card p-4 text-center hover:shadow-lg transition">
          <CreditCard className="w-6 h-6 text-primary mx-auto mb-2" />
          <span className="text-sm">Card</span>
        </button>
        <button className="card p-4 text-center hover:shadow-lg transition">
          <Download className="w-6 h-6 text-primary mx-auto mb-2" />
          <span className="text-sm">Statement</span>
        </button>
      </div>

      {/* Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Transactions</h2>
          <button className="text-primary text-sm">View All →</button>
        </div>
        
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              No transactions yet
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'funding' ? 'bg-green-100' :
                    tx.type === 'withdrawal' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {tx.type === 'funding' ? <ArrowDown className="w-5 h-5 text-green-600" /> :
                     tx.type === 'withdrawal' ? <ArrowUp className="w-5 h-5 text-red-600" /> :
                     <Send className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div>
                    <p className="font-semibold capitalize">{tx.type}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    tx.type === 'funding' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'funding' ? '+' : '-'} ₦{tx.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{tx.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fund Wallet Modal */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Fund Wallet</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (₦)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field"
                  placeholder="Enter amount"
                  min="100"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFundModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={initializePayment}
                  disabled={loading}
                  className="flex-1 btn-primary"
                >
                  {loading ? 'Processing...' : 'Proceed to Pay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Withdraw Funds</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (₦)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field"
                  placeholder="Enter amount"
                  min="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bank Name</label>
                <input
                  type="text"
                  value={bankDetails.bank_name}
                  onChange={(e) => setBankDetails({...bankDetails, bank_name: e.target.value})}
                  className="input-field"
                  placeholder="e.g., GTBank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Account Number</label>
                <input
                  type="text"
                  value={bankDetails.account_number}
                  onChange={(e) => setBankDetails({...bankDetails, account_number: e.target.value})}
                  className="input-field"
                  placeholder="10-digit account number"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={requestWithdrawal}
                  disabled={loading}
                  className="flex-1 btn-primary"
                >
                  {loading ? 'Processing...' : 'Request Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
