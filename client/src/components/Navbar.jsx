import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/workspaces" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
            D
          </div>
          <span className="font-semibold text-gray-900">DevHub</span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-medium">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 hidden sm:block">{user.name}</span>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="text-sm text-gray-500 hover:text-red-600 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;