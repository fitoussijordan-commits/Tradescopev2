'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AccountContext = createContext();

export function AccountProvider({ accounts, children }) {
  const [currentAccountId, setCurrentAccountId] = useState(null);

  // Active accounts = non-burned (for selector)
  const activeAccounts = accounts.filter(a => !a.is_burned);

  useEffect(() => {
    const saved = localStorage.getItem('ts-current-account');
    if (saved && activeAccounts.find(a => a.id === saved)) {
      setCurrentAccountId(saved);
    } else if (activeAccounts.length > 0) {
      setCurrentAccountId(activeAccounts[0].id);
    }
  }, [accounts]);

  const selectAccount = (id) => {
    setCurrentAccountId(id);
    localStorage.setItem('ts-current-account', id);
  };

  const currentAccount = activeAccounts.find(a => a.id === currentAccountId) || activeAccounts[0] || null;

  return (
    <AccountContext.Provider value={{ accounts: activeAccounts, allAccounts: accounts, currentAccount, currentAccountId, selectAccount }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be inside AccountProvider');
  return ctx;
}
