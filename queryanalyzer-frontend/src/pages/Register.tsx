import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api/axiosClient';
import { Code2, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 dark:bg-[#0B0F19] transition-colors duration-200">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Branding Container */}
        <div className="w-full text-center mb-8 flex flex-col items-center z-10 relative">
          <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl mb-4 inline-block">
            <Code2 className="w-10 h-10 text-blue-600 dark:text-blue-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Create an Account
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base">
            Join QueryLens to monitor your database
          </p>
        </div>

        {/* Card Container */}
        <div className="w-full bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl dark:shadow-2xl p-8 sm:p-10 relative z-20 transition-all duration-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                {...register('fullName')}
                className={`w-full bg-gray-50 dark:bg-gray-800/50 border ${errors.fullName ? 'border-rose-500 focus:ring-rose-500' : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500'} rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                placeholder="John Doe"
              />
              {errors.fullName && <p className="mt-1 text-sm text-rose-500">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                {...register('email')}
                className={`w-full bg-gray-50 dark:bg-gray-800/50 border ${errors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500'} rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-rose-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                {...register('password')}
                className={`w-full bg-gray-50 dark:bg-gray-800/50 border ${errors.password ? 'border-rose-500 focus:ring-rose-500' : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500'} rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-sm text-rose-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
