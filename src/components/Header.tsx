import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Utensils, Heart, MessageSquare, Search, LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

export default function Header() {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const links = [
    {
      to: '/',
      icon: <Search className="w-5 h-5" />,
      label: 'Find Events',
      exact: true
    },
    {
      to: '/chat',
      icon: <MessageSquare className="w-5 h-5" />,
      label: 'AI Assistant'
    },
    {
      to: '/plan',
      icon: <Calendar className="w-5 h-5" />,
      label: 'Plan Date'
    },
    {
      to: '/restaurants',
      icon: <Utensils className="w-5 h-5" />,
      label: 'Restaurants'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      setShowMobileMenu(false);
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black/95 backdrop-blur-lg border-b border-zinc-800 z-50">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 z-50">
          <div className="relative">
            <Heart className="w-6 h-6 text-red-500 animate-pulse" />
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-lg"></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-transparent bg-clip-text">
              DateAI
            </span>
            <span className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-md font-medium border border-blue-500/20">
              BETA
            </span>
          </div>
        </Link>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden z-50 p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
        >
          {showMobileMenu ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 sm:gap-6">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setShowMobileMenu(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                isActive(link.to)
                  ? 'text-white bg-zinc-800'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              {link.icon}
              <span className="hidden sm:inline text-sm font-medium">{link.label}</span>
            </Link>
          ))}

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">
                  {currentUser.displayName || 'Account'}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 py-1 animate-fade-in">
                  <Link
                    to="/saved"
                    className="block px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Saved Items
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Sign In</span>
            </button>
          )}
        </nav>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-lg z-40 md:hidden animate-fade-in">
            <div className="flex flex-col h-full pt-24 pb-8 px-6">
              <nav className="flex-1 space-y-2">
                {links.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive(link.to)
                        ? 'text-white bg-zinc-800'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {link.icon}
                    <span className="text-base font-medium">{link.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="pt-4 border-t border-zinc-800">
                {currentUser ? (
                  <div className="space-y-2">
                    <Link
                      to="/saved"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Heart className="w-5 h-5" />
                      <span className="text-base font-medium">Saved Items</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-base font-medium">Log Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-base font-medium">Sign In</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </header>
  );
}