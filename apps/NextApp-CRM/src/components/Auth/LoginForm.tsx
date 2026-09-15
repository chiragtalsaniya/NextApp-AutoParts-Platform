import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003366] to-blue-900 dark:from-[#0a192f] dark:to-[#1e293b] flex items-center justify-center p-4">
      <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-3xl w-full max-w-md p-8 relative transition-colors">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-[#003366] to-blue-700 dark:from-blue-900 dark:to-blue-700 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900">
          <ShieldCheck className="w-10 h-10 text-white" />
        </div>
        <div className="text-center mb-10 mt-12">
          <h1 className="text-3xl font-extrabold text-[#003366] dark:text-blue-200 mb-1 tracking-tight">NextApp Inc.</h1>
          <p className="text-gray-600 dark:text-gray-400 text-base">Auto Parts Dealer CMS</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-white/80 dark:bg-slate-800/80 focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-700 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Enter your email"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-slate-700 rounded-lg bg-white/80 dark:bg-slate-800/80 focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-700 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#003366] dark:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-800 dark:hover:bg-blue-800 focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-700 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowDemo((v) => !v)}
            className="w-full flex items-center justify-center gap-2 text-sm text-blue-700 dark:text-blue-300 hover:underline focus:outline-none mb-2"
            aria-expanded={showDemo}
            aria-controls="demo-credentials"
          >
            {showDemo ? 'Hide' : 'Show'} Demo Credentials
          </button>
          <div
            id="demo-credentials"
            className={`overflow-hidden transition-all duration-300 ${showDemo ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'} bg-blue-50 dark:bg-slate-800 rounded-lg px-4 py-3`}
            aria-hidden={!showDemo}
          >
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Demo Credentials:</p>
            <div className="text-xs space-y-1">
              <p><strong>Super Admin:</strong> super@nextapp.com / password</p>
              <p><strong>Admin:</strong> admin@company1.com / password</p>
              <p><strong>Manager:</strong> manager@store1.com / password</p>
              <p><strong>Retailer:</strong> retailer@downtownauto.com / password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};