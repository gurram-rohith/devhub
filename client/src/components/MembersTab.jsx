import toast from 'react-hot-toast';
import api from '../api/axios';

const MembersTab = ({ workspace, isAdmin, currentUserId, onMemberRemoved }) => {
  const handleRemove = async (userId, name) => {
    if (!confirm(`Remove ${name} from this workspace?`)) return;
    try {
      await api.delete(`/workspaces/${workspace._id}/members/${userId}`);
      toast.success(`${name} removed`);
      onMemberRemoved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-2">
      {workspace.members.map((m) => (
        <div key={m.user._id} className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
          <div>
            <p className="font-medium">{m.user.name}</p>
            <p className="text-xs text-gray-500">{m.user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded ${m.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              {m.role}
            </span>
            {isAdmin && m.user._id !== currentUserId && (
              <button onClick={() => handleRemove(m.user._id, m.user.name)} className="text-red-600 text-xs">
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MembersTab;