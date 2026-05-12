'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

const AccountContext = createContext();

export function AccountProvider({ accounts: serverAccounts, children }) {
  const [accounts, setAccounts] = useState(serverAccounts || []);
  const [currentAccountId, setCurrentAccountId] = useState(null);

  // Sync with server accounts when they change (e.g. after router.refresh())
  useEffect(() => {
    if (serverAccounts && serverAccounts.length > 0) {
      setAccounts(serverAccounts);
    }
  }, [serverAccounts]);

  // Also fetch client-side to catch any stale server cache
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('trading_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        if (data && data.length > 0) {
          setAccounts(data);
        }
      } catch (e) {
        // Silently fail, server accounts are the fallback
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    const activeAccounts = accounts.filter(a => !a.is_burned);
    const saved = localStorage.getItem('ts-current-account');
    if (saved && accounts.find(a => a.id === saved && !a.is_burned)) {
      setCurrentAccountId(saved);
    } else if (activeAccounts.length > 0) {
      setCurrentAccountId(activeAccounts[0].id);
    } else {
      setCurrentAccountId(null);
    }
  }, [accounts]);

  const selectAccount = (id) => {
    setCurrentAccountId(id);
    localStorage.setItem('ts-current-account', id);
  };

  const activeAccounts = accounts.filter(a => !a.is_burned);
  const currentAccount = activeAccounts.find(a => a.id === currentAccountId) || null;

  return (
    <AccountContext.Provider value={{ accounts, currentAccount, currentAccountId, selectAccount }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be inside AccountProvider');
  return ctx;
}
