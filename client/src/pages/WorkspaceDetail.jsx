import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getWorkspace, getWorkspaceStats } from '../api/workspaces';
import { useAuth } from '../context/AuthContext';
import EventsTab from '../components/EventsTab';
import TasksTab from '../components/TasksTab';
import MembersTab from '../components/MembersTab';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TABS = ['Overview', 'Events', 'Tasks', 'Members'];
const STATUS_COLORS = { 'To Do': '#94a3b8', 'In Progress': '#6366f1', 'Completed': '#22c55e' };

const WorkspaceDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  const fetchWorkspace = async () => {
    try {
      const res = await getWorkspace(id);
      setWorkspace(res.data.workspace);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load workspace');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await getWorkspaceStats(id);
      setStats(res.data.stats);
    } catch {
      // non-critical — Overview just shows less info if this fails
    }
  };

  useEffect(() => {
    fetchWorkspace();
    fetchStats();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Loading workspace...</div>
      </div>
    );
  }
  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Workspace not found.</div>
      </div>
    );
  }

  // Derive the current user's role from the populated members array
  const membership = workspace.members.find((m) => m.user._id === user.id || m.user._id === user._id);
  const isAdmin = membership?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
              {workspace.description && (
                <p className="text-gray-500 text-sm mt-0.5">{workspace.description}</p>
              )}
            </div>
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full h-fit ${
                isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {membership?.role}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Invite code: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{workspace.inviteCode}</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'Overview') fetchStats(); // keep counts fresh when revisiting
              }}
              className={`px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-center">
  <p className="text-3xl font-bold text-indigo-600">{stats?.totalMembers ?? '—'}</p>
  <p className="text-xs text-indigo-400 mt-1">Members</p>
</div>
<div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
  <p className="text-3xl font-bold text-emerald-600">{stats?.upcomingEvents ?? '—'}</p>
  <p className="text-xs text-emerald-500 mt-1">Upcoming Events</p>
</div>
<div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
  <p className="text-3xl font-bold text-amber-600">{stats?.tasks?.total ?? '—'}</p>
  <p className="text-xs text-amber-500 mt-1">Total Tasks</p>
</div>

            {stats?.tasks && stats.tasks.total > 0 && (
              <div className="col-span-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Task Breakdown</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={['To Do', 'In Progress', 'Completed'].map((status) => ({
                        name: status,
                        value: stats.tasks[status],
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                    >
                      {['To Do', 'In Progress', 'Completed'].map((status) => (
                        <Cell key={status} fill={STATUS_COLORS[status]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {stats?.tasks && stats.tasks.total === 0 && (
              <div className="col-span-full bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center text-sm text-gray-400">
                No tasks yet — create one to see the breakdown here.
              </div>
            )}
          </div>
        )}

        {activeTab === 'Events' && <EventsTab workspaceId={id} isAdmin={isAdmin} />}
        {activeTab === 'Tasks' && <TasksTab workspaceId={id} isAdmin={isAdmin} members={workspace.members} />}
        {activeTab === 'Members' && (
          <MembersTab
            workspace={workspace}
            isAdmin={isAdmin}
            currentUserId={user.id || user._id}
            onMemberRemoved={fetchWorkspace}
          />
        )}
      </div>
    </div>
  );
};

export default WorkspaceDetail;