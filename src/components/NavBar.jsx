// src/components/NavBar.jsx - WITH DARK MODE TOGGLE
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/web3Context';
import { useDarkMode } from '../contexts/DarkModeContext';
import { notificationsAPI } from '../services/api';
import { 
  Briefcase, LayoutDashboard, FileText, Calendar, Settings, 
  Bell, Wallet, LogOut, UserPlus, Moon, Sun 
} from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isGuestMode, isAuthenticated } = useAuth();
  const { account: walletAddress, connectWallet, isConnecting: connecting } = useWeb3();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && !isGuestMode) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isGuestMode]);

  const loadUnreadCount = async () => {
    try {
      const data = await notificationsAPI.getUnreadCount();
      setUnreadCount(data?.count || 0);
    } catch (error) {
      setUnreadCount(0);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinkClass = (path) => {
    return `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 font-medium'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;
  };

  const handleConnectWallet = async () => {
    const result = await connectWallet();
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isGuestMode ? '/applications' : '/dashboard'} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Jobclaw</span>
            {isGuestMode && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                Guest
              </span>
            )}
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className={navLinkClass('/dashboard')}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link to="/applications" className={navLinkClass('/applications')}>
              <FileText className="w-4 h-4" />
              <span>Applications</span>
            </Link>
            <Link to="/interviews" className={navLinkClass('/interviews')}>
              <Calendar className="w-4 h-4" />
              <span>Interviews</span>
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Guest Mode Actions */}
            {isGuestMode ? (
              <>
                <button
                  onClick={() => navigate('/guest-apply')}
                  className="flex items-center gap-2 px-3 py-1.5 border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800 text-sm font-medium transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>New Application</span>
                </button>
                
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 text-sm font-medium transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Exit Guest Mode"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                {/* Wallet Connect */}
                {walletAddress ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
                    <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectWallet}
                    disabled={connecting}
                    className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 transition-colors"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
                  </button>
                )}

                {/* Notifications */}
                <Link to="/notifications" className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Settings */}
                <Link to="/settings" className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Settings className="w-5 h-5" />
                </Link>

                {/* User Menu */}
                <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;