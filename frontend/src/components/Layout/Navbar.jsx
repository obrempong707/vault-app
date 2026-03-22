import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Shield, Package, Vault, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const navLinks = [
    { path: '/', label: 'Home', icon: Shield },
    { path: '/tracking', label: 'Track Shipment', icon: Package },
    { path: '/vault', label: 'My Vault', icon: Vault },
    { path: '/admin', label: 'Admin', icon: LayoutDashboard },
  ];

  const visibleNavLinks = navLinks.filter((link) => {
    if (link.path === '/admin') {
      return isAuthenticated && user?.isAdmin;
    }

    return true;
  });

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">VaultLogix</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleNavLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm font-medium text-slate-600">
                  Hello, {user?.name}!
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200"
              >
                Login
              </Link>
            )}
            <Link
              to="/tracking"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Track Now
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <div className="flex flex-col space-y-2">
              {visibleNavLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(link.path)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 text-left"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/login');
                  }}
                  className="px-4 py-3 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 text-left"
                >
                  Login
                </button>
              )}
              <Link
                to="/tracking"
                onClick={() => setIsOpen(false)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg text-sm font-semibold text-center transition-all duration-200"
              >
                Track Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
