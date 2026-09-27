import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyWorkspaces, createWorkspace, joinWorkspace } from '../api/workspaces';
import { useAuth } from '../context/AuthContext';

const Workspaces = () => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [inviteCode, setInviteCode] = useState('');

  const fetchWorkspaces = async () => {
    try {
      const res = await getMyWorkspaces();
      setWorkspaces(res.data.workspaces);
    } catch {
      toast.error('Could not load workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkspaces(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Workspace name is required');
    try {
      await createWorkspace(form);
      toast.success('Workspace created');
      setForm({ name: '', description: '' });
      setShowCreate(false);
      fetchWorkspaces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return toast.error('Enter an invite code');
    try {
      await joinWorkspace({ inviteCode: inviteCode.toUpperCase() });
      toast.success('Joined workspace');
      setInviteCode('');
      setShowJoin(false);
      fetchWorkspaces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join workspace');
    }
  };

  const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-violet-500'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-slate-50 to-white">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-gray-500 text-sm mt-1">Here are your workspaces</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Join with code
            </button>
            <button
              onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm"
            >
              + New Workspace
            </button>
          </div>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 space-y-3 animate-fadeIn">
            <input
              placeholder="Workspace name" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              placeholder="Description (optional)" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
              Create Workspace
            </button>
          </form>
        )}

        {showJoin && (
          <form onSubmit={handleJoin} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 space-y-3">
            <input
              placeholder="Enter 6-character invite code" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none uppercase tracking-widest font-mono focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
            />
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
              Join Workspace
            </button>
          </form>
        )}

        {loading ? (
          <div className="text-gray-400 text-sm">Loading workspaces...</div>
        ) : workspaces.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">No workspaces yet — create one or join with an invite code.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((ws, i) => (
              <Link
                key={ws._id}
                to={`/workspaces/${ws._id}`}
                className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition"
              >
                <div className={`w-10 h-10 rounded-lg ${colors[i % colors.length]} text-white flex items-center justify-center font-bold mb-3`}>
                  {ws.name[0].toUpperCase()}
                </div>
                <h2 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition">{ws.name}</h2>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ws.description || 'No description'}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">{ws.members.length} member{ws.members.length !== 1 && 's'}</span>
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-500">{ws.inviteCode}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Workspaces;