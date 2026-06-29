import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import { toast } from 'sonner';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // CRITICAL: sends HttpOnly cookies with every request
});

// No request interceptor needed — cookies are sent automatically by the browser

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Session expired — redirect to login
      // Only redirect if we're not already on the login/register page
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    } else if (error.response && error.response.data && error.response.data.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('An unexpected network error occurred');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
