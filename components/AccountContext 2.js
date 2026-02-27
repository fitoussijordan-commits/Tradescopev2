'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AccountContext = createContext();

export function AccountProvider({ accounts, children }) {
  const [currentAccountId, setCurrentAccountId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('ts-current-account');
    if (saved && accounts.find(a => a.id === saved)) {
      setCurrentAccountId(saved);
    } else if (accounts.length > 0) {
      setCurrentAccountId(accounts[0].id);
    }
  }, [accounts]);

  const selectAccount = (id) => {
    setCurrentAccountId(id);
    localStorage.setItem('ts-current-account', id);
  };

  const currentAccount = accounts.find(a => a.id === currentAccountId) || accounts[0] || null;

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
