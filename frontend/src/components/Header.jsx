import React, { useEffect, useState } from 'react';
import { Bell, Sun, Moon, Search } from 'lucide-react';

const Header = () => {
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'dark');
  const isLoggedIn = !!localStorage.getItem('auth_token');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border fixed top-0 right-0 bg-card text-foreground z-[99] left-64 w-[calc(100%-16rem)]">
      {/* LEFT: Quick Search Input Bar */}
      <div className="flex items-center flex-1">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search payments, payouts, templates..." 
            className="w-full h-9 pl-9 pr-3 text-xs font-medium rounded-lg border border-border bg-background text-foreground placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* RIGHT: Theme Switcher & Notifs */}
      <div className="flex items-center gap-3">
        {/* Light/Dark mode switcher */}
        <button 
          onClick={toggleTheme} 
          className="bg-background border border-border hover:bg-muted text-foreground cursor-pointer w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-200"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-slate-400" /> : <Moon className="h-4 w-4 text-slate-400" />}
        </button>

        {/* Notifications */}
        <button className="relative bg-background border border-border hover:bg-muted text-foreground cursor-pointer w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-200">
          <Bell className="h-4 w-4 text-slate-400" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500 shadow-md shadow-red-500" />
        </button>
      </div>
    </header>
  );
};

export default Header;
