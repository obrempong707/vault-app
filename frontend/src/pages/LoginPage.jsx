import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Shield, User } from 'lucide-react';
import Card from '../components/UI/Card';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.message);
      setIsSubmitting(false);
      return;
    }

    navigate(result.user.isAdmin ? '/admin' : '/vault');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 rounded-full border border-blue-400/30 mb-6">
            <Lock className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-blue-300 text-sm font-medium">Secure Access</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Login to VaultLogix</h1>
          <p className="text-lg text-slate-300 max-w-xl mx-auto">
            Sign in with your account email and password to securely access your dashboard.
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <Card className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@vaultlogix.com or client@vaultlogix.com"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-200"
            >
              {isSubmitting ? 'Signing in...' : 'Login'}
            </button>
          </form>

        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
