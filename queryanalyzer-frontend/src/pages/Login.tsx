import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosClient';
import { Code2, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Backend sets HttpOnly cookie automatically via Set-Cookie header
      const res = await api.post('/auth/login', { email, password });
      login(res.data); // res.data is UserDTO directly (no token in body)
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error('Invalid email or password');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0B0F19] p-4 sm:p-6 transition-colors duration-300">
      <div className="w-full max-w-[920px] min-h-[540px] flex rounded-3xl overflow-hidden shadow-2xl dark:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.5)]">

        {/* ── Left Panel: Welcome / Branding ── */}
        <div className="hidden md:flex md:w-[42%] relative overflow-hidden flex-col items-center justify-center text-center p-10
          bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800
          dark:from-blue-700 dark:via-indigo-800 dark:to-slate-900">

          {/* Decorative circles */}
          <div className="absolute -top-16 -left-16 w-56 h-56 bg-white/10 rounded-full blur-xl auth-float-slow" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-2xl auth-float-medium" />
          <div className="absolute top-1/3 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-lg auth-float-fast" />

          <div className="relative z-10 flex flex-col items-center gap-6 auth-fade-up">
            <div className="p-4 bg-white/15 backdrop-blur-sm rounded-2xl shadow-lg auth-icon-bob">
              <Code2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">
              Hello, Welcome!
            </h2>
            <p className="text-blue-100/90 text-sm leading-relaxed max-w-[240px]">
              Don't have an account yet? Register now and start monitoring your database performance.
            </p>
            <Link
              to="/register"
              className="mt-2 group inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-white/60 text-white font-semibold text-sm relative overflow-hidden
                hover:bg-white hover:text-blue-700 transition-all duration-300 cursor-pointer auth-cta-shimmer"
            >
              Register
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* ── Right Panel: Login Form ── */}
        <div className="flex-1 flex flex-col justify-center bg-white dark:bg-[#111827] p-8 sm:p-12 lg:p-14">
          <div className="w-full max-w-sm mx-auto">
            {/* Mobile-only branding */}
            <div className="flex items-center gap-2 mb-2 md:hidden auth-fade-up">
              <Code2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">QueryLens</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight auth-fade-up-1">
              Sign In
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm auth-fade-up-2">
              Welcome back — sign in to continue
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Email */}
              <div className="space-y-1.5 auth-fade-up-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm
                      bg-gray-50 dark:bg-gray-800/60 
                      border border-gray-200 dark:border-gray-700
                      text-gray-900 dark:text-white
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                      transition-all duration-200"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 auth-fade-up-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type="password"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm
                      bg-gray-50 dark:bg-gray-800/60
                      border border-gray-200 dark:border-gray-700
                      text-gray-900 dark:text-white
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                      transition-all duration-200"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="auth-fade-up-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white cursor-pointer relative overflow-hidden
                    bg-gradient-to-r from-blue-600 to-indigo-600
                    hover:from-blue-700 hover:to-indigo-700
                    active:scale-[0.98]
                    shadow-lg shadow-blue-500/25 dark:shadow-blue-500/15
                    disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100
                    transition-all duration-200 flex items-center justify-center gap-2 auth-btn-glow"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                </button>
              </div>
            </form>

            {/* Mobile-only register link */}
            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 md:hidden auth-fade-up-5">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
