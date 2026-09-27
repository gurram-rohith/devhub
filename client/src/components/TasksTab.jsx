import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { createTask, listWorkspaceTasks, updateTaskStatus, deleteTask } from '../api/tasks';

const STATUSES = ['To Do', 'In Progress', 'Completed'];
const PRIORITY_STYLES = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-rose-100 text-rose-700',
};
const STATUS_STYLES = {
  'To Do': 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-indigo-100 text-indigo-700',
  'Completed': 'bg-emerald-100 text-emerald-700',
};

const TasksTab = ({ workspaceId, isAdmin, members }) => {
  const { user } = useAuth();
  const currentUserId = user.id || user._id;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '' });

  const fetchTasks = async () => {
    try {
      const params = filter === 'me' ? { assignedTo: 'me' } : {};
      const res = await listWorkspaceTasks(workspaceId, params);
      setTasks(res.data.tasks);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [workspaceId, filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.assignedTo) return toast.error('Title and assignee are required');
    try {
      await createTask({ workspaceId, ...form });
      toast.success('Task created');
      setForm({ title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '' });
      setShowCreate(false);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateTaskStatus(id, status);
      toast.success('Status updated');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      toast.success('Task deleted');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg text-sm">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md transition ${filter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            All Tasks
          </button>
          <button
            onClick={() => setFilter('me')}
            className={`px-3 py-1.5 rounded-md transition ${filter === 'me' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            My Tasks
          </button>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            + Create Task
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 space-y-3">
          <input placeholder="Title" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Description" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className="border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
              <option value="">Assign to...</option>
              {members.map((m) => (
                <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
              ))}
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="Low">Low priority</option>
              <option value="Medium">Medium priority</option>
              <option value="High">High priority</option>
            </select>
          </div>
          <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
            Create
          </button>
        </form>
      )}

      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm">No tasks {filter === 'me' ? 'assigned to you' : 'yet'}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const canUpdate = isAdmin || task.assignedTo._id === currentUserId;

            return (
              <div key={task._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-gray-200 transition">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                    <div className="flex flex-wrap items-center gap-x-3 text-xs text-gray-400 mt-2">
                      <span>👤 {task.assignedTo.name}</span>
                      {task.dueDate && <span>📅 Due {format(new Date(task.dueDate), 'PP')}</span>}
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDelete(task._id)} className="text-gray-400 hover:text-red-600 text-xs shrink-0 transition">
                      Delete
                    </button>
                  )}
                </div>

                <div className="flex justify-end mt-4 pt-3 border-t border-gray-50">
                  {canUpdate ? (
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task._id, e.target.value)}
                      className={`text-xs font-medium border-0 rounded-full px-3 py-1.5 outline-none cursor-pointer ${STATUS_STYLES[task.status]}`}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${STATUS_STYLES[task.status]}`}>
                      {task.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TasksTab;