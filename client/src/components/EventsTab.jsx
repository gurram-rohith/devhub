import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { createEvent, listWorkspaceEvents, deleteEvent, rsvpEvent, cancelRsvp } from '../api/events';

const EventsTab = ({ workspaceId, isAdmin }) => {
  const { user } = useAuth();
  const currentUserId = user.id || user._id;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', startTime: '', endTime: '', location: '', meetingUrl: '', maxCapacity: 10,
  });
  const [busyEventId, setBusyEventId] = useState(null);

  const fetchEvents = async () => {
    try {
      const res = await listWorkspaceEvents(workspaceId);
      setEvents(res.data.events);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [workspaceId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startTime || !form.endTime) {
      return toast.error('Title, start time, and end time are required');
    }
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      return toast.error('End time must be after start time');
    }
    if (form.meetingUrl && !/^https?:\/\/.+/.test(form.meetingUrl)) {
      return toast.error('Meeting link must start with http:// or https://');
    }

    try {
      await createEvent({ workspaceId, ...form, maxCapacity: Number(form.maxCapacity) });
      toast.success('Event created');
      setForm({ title: '', description: '', startTime: '', endTime: '', location: '', meetingUrl: '', maxCapacity: 10 });
      setShowCreate(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    try {
      await deleteEvent(id);
      toast.success('Event deleted');
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleRsvp = async (id) => {
    setBusyEventId(id);
    try {
      await rsvpEvent(id);
      toast.success("You're in!");
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'RSVP failed');
    } finally {
      setBusyEventId(null);
    }
  };

  const handleCancelRsvp = async (id) => {
    setBusyEventId(id);
    try {
      await cancelRsvp(id);
      toast.success('RSVP cancelled');
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel RSVP');
    } finally {
      setBusyEventId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      {isAdmin && (
        <div className="mb-4">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            + Create Event
          </button>
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 space-y-3">
          <input placeholder="Title" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Description" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start time</label>
              <input type="datetime-local" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End time</label>
              <input type="datetime-local" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>

          <input type="number" min="1" placeholder="Max capacity" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })} />
          <input placeholder="Location (optional, e.g. Room 204)" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input placeholder="Meeting link (optional, e.g. https://meet.google.com/xyz)" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} />

          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
            Create
          </button>
        </form>
      )}

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm">No events scheduled yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const isAttending = ev.attendees.some((a) => (a._id || a) === currentUserId);
            const isFull = ev.attendees.length >= ev.maxCapacity;
            const seatsLeft = ev.maxCapacity - ev.attendees.length;
            const isBusy = busyEventId === ev._id;
            const pct = Math.min(100, Math.round((ev.attendees.length / ev.maxCapacity) * 100));

            const start = new Date(ev.startTime);
            const end = new Date(ev.endTime);
            const now = new Date();
            const meetingStatus = now < start ? 'upcoming' : now > end ? 'ended' : 'live';

            return (
              <div key={ev._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-gray-200 transition">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{ev.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        meetingStatus === 'live' ? 'bg-red-100 text-red-700 animate-pulse' :
                        meetingStatus === 'ended' ? 'bg-gray-100 text-gray-500' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {meetingStatus === 'live' ? '🔴 Live now' : meetingStatus === 'ended' ? 'Ended' : 'Upcoming'}
                      </span>
                    </div>
                    {ev.description && <p className="text-sm text-gray-500 mt-0.5">{ev.description}</p>}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-2">
                      <span>📅 {format(start, 'PPp')} – {format(end, 'p')}</span>
                      {ev.location && <span>📍 {ev.location}</span>}
                      {ev.meetingUrl && meetingStatus !== 'ended' && ( <a
                        
                          href={ev.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 font-medium hover:underline"
                        >
                          🔗 {meetingStatus === 'live' ? 'Join now' : 'Meeting link'}
                        </a>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDelete(ev._id)} className="text-gray-400 hover:text-red-600 text-xs shrink-0 transition">
                      Delete
                    </button>
                  )}
                </div>

                <div className="mt-4">
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                    <div
                      className={`h-1.5 rounded-full transition-all ${isFull ? 'bg-red-400' : 'bg-indigo-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-medium ${isFull ? 'text-red-500' : 'text-gray-500'}`}>
                      {isFull ? 'Full' : `${seatsLeft} seat${seatsLeft !== 1 ? 's' : ''} left`} · {ev.attendees.length}/{ev.maxCapacity}
                    </span>

                    {isAttending ? (
                      <button
                        onClick={() => handleCancelRsvp(ev._id)}
                        disabled={isBusy}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                      >
                        {isBusy ? '...' : 'Cancel RSVP'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRsvp(ev._id)}
                        disabled={isBusy || isFull || meetingStatus === 'ended'}
                        className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:hover:bg-indigo-600"
                      >
                        {isBusy ? '...' : meetingStatus === 'ended' ? 'Event ended' : isFull ? 'Full' : 'RSVP'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsTab;