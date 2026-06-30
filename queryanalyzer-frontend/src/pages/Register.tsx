import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/axiosClient';
import { Code2, Loader2, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    try {
      await api.post('/auth/register', data);
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error('This email is already registered.');
      } else {
        toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0B0F19] p-4 sm:p-6 transition-colors duration-300">
      <div className="w-full max-w-[920px] min-h-[580px] flex flex-row-reverse rounded-3xl overflow-hidden shadow-2xl dark:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.5)]">

        {/* ── Right Panel: Welcome / Branding (visually on the right via flex-row-reverse) ── */}
        <div className="hidden md:flex md:w-[42%] relative overflow-hidden flex-col items-center justify-center text-center p-10
          bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800
          dark:from-indigo-700 dark:via-blue-800 dark:to-slate-900">

          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-xl auth-float-slow" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/5 rounded-full blur-2xl auth-float-medium" />
          <div className="absolute top-1/3 left-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-lg auth-float-fast" />

          <div className="relative z-10 flex flex-col items-center gap-6 auth-fade-up">
            <div className="p-4 bg-white/15 backdrop-blur-sm rounded-2xl shadow-lg auth-icon-bob">
              <Code2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">
              Welcome Back!
            </h2>
            <p className="text-blue-100/90 text-sm leading-relaxed max-w-[240px]">
              Already have an account? Sign in now to access your query performance dashboard.
            </p>
            <Link
              to="/login"
              className="mt-2 group inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-white/60 text-white font-semibold text-sm relative overflow-hidden
                hover:bg-white hover:text-indigo-700 transition-all duration-300 cursor-pointer auth-cta-shimmer"
            >
              Sign In
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* ── Left Panel: Register Form ── */}
        <div className="flex-1 flex flex-col justify-center bg-white dark:bg-[#111827] p-8 sm:p-12 lg:p-14">
          <div className="w-full max-w-sm mx-auto">
            {/* Mobile-only branding */}
            <div className="flex items-center gap-2 mb-2 md:hidden auth-fade-up">
              <Code2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">QueryLens</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight auth-fade-up-1">
              Create Account
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm auth-fade-up-2">
              Join QueryLens to monitor your database
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5 auth-fade-up-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    {...register('fullName')}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm
                      bg-gray-50 dark:bg-gray-800/60
                      border ${errors.fullName ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/50 focus:border-rose-500' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500/50 focus:border-blue-500'}
                      text-gray-900 dark:text-white
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:outline-none focus:ring-2
                      transition-all duration-200`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.fullName && <p className="text-xs text-rose-500 mt-0.5 pl-1">{errors.fullName.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5 auth-fade-up-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type="email"
                    {...register('email')}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm
                      bg-gray-50 dark:bg-gray-800/60
                      border ${errors.email ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/50 focus:border-rose-500' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500/50 focus:border-blue-500'}
                      text-gray-900 dark:text-white
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:outline-none focus:ring-2
                      transition-all duration-200`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="text-xs text-rose-500 mt-0.5 pl-1">{errors.email.message}</p>}
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
                    {...register('password')}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm
                      bg-gray-50 dark:bg-gray-800/60
                      border ${errors.password ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/50 focus:border-rose-500' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500/50 focus:border-blue-500'}
                      text-gray-900 dark:text-white
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:outline-none focus:ring-2
                      transition-all duration-200`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="text-xs text-rose-500 mt-0.5 pl-1">{errors.password.message}</p>}
              </div>

              {/* Submit */}
              <div className="auth-fade-up-5 mt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white cursor-pointer relative overflow-hidden
                    bg-gradient-to-r from-indigo-600 to-blue-600
                    hover:from-indigo-700 hover:to-blue-700
                    active:scale-[0.98]
                    shadow-lg shadow-indigo-500/25 dark:shadow-indigo-500/15
                    disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100
                    transition-all duration-200 flex items-center justify-center gap-2 auth-btn-glow"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                </button>
              </div>
            </form>

            {/* Mobile-only login link */}
            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 md:hidden auth-fade-up-5">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
