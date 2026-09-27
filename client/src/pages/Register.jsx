import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registerUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';

    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!EMAIL_REGEX.test(form.email)) errs.email = 'Enter a valid email address';

    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';

    if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await registerUser({ name: form.name, email: form.email, password: form.password });
      login(res.data.token, res.data.user);
      navigate('/workspaces');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-indigo-500/30 ${
          errors[key] ? 'border-red-400' : 'border-gray-300 focus:border-indigo-500'
        }`}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-2xl font-bold mb-3 shadow-lg shadow-indigo-200">
            D
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join DevHub to manage your team's workspace</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 space-y-5 border border-gray-100">
          {field('name', 'Full name', 'text', 'Jane Doe')}
          {field('email', 'Email', 'email', 'you@example.com')}
          {field('password', 'Password', 'password', 'At least 8 characters')}
          {field('confirmPassword', 'Confirm password', 'password', 'Re-enter your password')}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2.5 transition disabled:opacity-50 shadow-sm"
          >
            {submitting ? 'Creating account...' : 'Register'}
          </button>

          <p className="text-sm text-center text-gray-500">
            Already have an account? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;