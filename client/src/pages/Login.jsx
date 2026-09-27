import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!EMAIL_REGEX.test(form.email)) errs.email = 'Enter a valid email address';

    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await loginUser(form);
      login(res.data.token, res.data.user);
      navigate('/workspaces');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-2xl font-bold mb-3 shadow-lg shadow-indigo-200">
            D
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Log in to your DevHub workspace</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 space-y-5 border border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className={`w-full border rounded-lg px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-indigo-500/30 ${
                errors.email ? 'border-red-400' : 'border-gray-300 focus:border-indigo-500'
              }`}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className={`w-full border rounded-lg px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-indigo-500/30 ${
                errors.password ? 'border-red-400' : 'border-gray-300 focus:border-indigo-500'
              }`}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2.5 transition disabled:opacity-50 shadow-sm"
          >
            {submitting ? 'Logging in...' : 'Log In'}
          </button>

          <p className="text-sm text-center text-gray-500">
            No account? <Link to="/register" className="text-indigo-600 font-medium hover:underline">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;