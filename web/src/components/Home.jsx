import { useEffect, useState, useMemo } from 'react';
import { FiPlus, FiCopy } from 'react-icons/fi';
import { deleteExhibition } from '../services/api.js';
import { listExhibitions, createExhibition, getLiveExhibitions } from '../services/api.js';
import timezones from '../timezones.json'; // Assuming you have a timezones.json file
import countries from '../countries.json'; // Assuming you have a countries.json file

export default function Home({ setActiveExhibition, setTab, userName }) {
  const [exhibitions, setExhibitions] = useState([]);
  const [live, setLive] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedNav, setSelectedNav] = useState('live'); // 'live', 'upcoming', 'completed'
  const [form, setForm] = useState({
    name: '',
    startTime: '',
    endTime: '',
    timezone: '',
    country: '',
    createdBy: userName || '',
  });
  const [viewing, setViewing] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'duplicate'

  const buildEmptyForm = () => ({
    name: '',
    startTime: '',
    endTime: '',
    timezone: '',
    country: '',
    createdBy: userName || '',
  });

  const formatDateForInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  // Update createdBy when userName changes
  useEffect(() => {
    if (userName) {
      setForm(prev => ({ ...prev, createdBy: userName }));
    }
  }, [userName]);

  const loadExhibitions = async () => {
    try {
      const res = await listExhibitions();
      setExhibitions(res?.data || []);
    } catch (e) {
      setError(e.message || 'Failed to load exhibitions');
    }
  };

  const loadLiveExhibitions = async () => {
    try {
      const l = await getLiveExhibitions();
      setLive(l?.data || []);
    } catch (e) {
      // silent - don't show error for live exhibitions
    }
  };

  const refreshAll = async () => {
    await loadExhibitions();
    await loadLiveExhibitions();
  };

  // Initial load
  useEffect(() => {
    refreshAll();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (payload) => {
    if (!payload) return;
    try {
      setCreating(true);
      const res = await createExhibition(payload);
      if (res?.success) {
        await refreshAll();
        const wasDuplicate = modalMode === 'duplicate';
        setShowCreate(false);
        setForm(buildEmptyForm());
        setModalMode('create');
        setMessage({ type: 'success', text: wasDuplicate ? 'Duplicate exhibition created' : 'Exhibition created' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Create failed' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setCreating(false);
    }
  };

  const handleSaveExhibition = () => {
    if (creating) return;
    if (!form.name || !form.startTime || !form.endTime || !form.timezone || !form.country) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return;
    }

    handleCreate({ ...form });
  };

  const handleOpenCreate = () => {
    setForm(buildEmptyForm());
    setModalMode('create');
    setShowCreate(true);
  };

  const handleOpenDuplicate = (exhibition) => {
    if (!exhibition) return;
    setForm({
      name: `${exhibition.name} Copy`,
      startTime: formatDateForInput(exhibition.startTime),
      endTime: formatDateForInput(exhibition.endTime),
      timezone: exhibition.timezone || '',
      country: exhibition.country || '',
      createdBy: userName || exhibition.createdBy || '',
    });
    setModalMode('duplicate');
    setShowCreate(true);
  };

  const closeCreateModal = () => {
    setShowCreate(false);
    setModalMode('create');
  };

  const handleDeleteConfirmed = async (id) => {
    if (!id) return;
    try {
      await deleteExhibition(id);
      if (viewing?._id === id) {
        setViewing(null);
      }
      await refreshAll();
      setMessage({ type: 'success', text: 'Exhibition deleted' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Delete failed' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const requestDelete = async (exhibition) => {
    if (!exhibition) return;
    const confirmed = window.confirm(`Delete "${exhibition.name}" and all associated cards? This action cannot be undone.`);
    if (!confirmed) return;
    await handleDeleteConfirmed(exhibition._id);
  };

  const exhibitionBuckets = useMemo(() => {
    const now = new Date();
    const buckets = {
      live: [],
      upcoming: [],
      completed: [],
    };

    exhibitions.forEach((exhibition) => {
      const isLive = live.some((l) => l._id === exhibition._id);
      if (isLive) {
        buckets.live.push(exhibition);
        return;
      }

      const startTime = new Date(exhibition.startTime);
      if (startTime > now) {
        buckets.upcoming.push(exhibition);
        return;
      }

      const endTime = new Date(exhibition.endTime);
      endTime.setHours(endTime.getHours() + 12); // buffer
      if (endTime < now) {
        buckets.completed.push(exhibition);
      }
    });

    return buckets;
  }, [exhibitions, live]);

  // Filter exhibitions based on selected navigation
  const filteredExhibitions = useMemo(() => {
    if (!selectedNav) return [];
    return exhibitionBuckets[selectedNav] || [];
  }, [exhibitionBuckets, selectedNav]);

  const statusSummary = [
    { key: 'live', label: 'Live Exhibitions', count: exhibitionBuckets.live.length, tone: 'live' },
    { key: 'upcoming', label: 'Upcoming', count: exhibitionBuckets.upcoming.length, tone: 'upcoming' },
    { key: 'completed', label: 'Completed', count: exhibitionBuckets.completed.length, tone: 'completed' },
  ];

  const renderExhibitionsTable = () => {
    if (filteredExhibitions.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          <p>No {selectedNav} exhibitions found.</p>
        </div>
      );
    }

    return (
      <div className="exhibitions-panel table" style={{ padding: 0 }}>
        <table className="exhibitions-table" aria-label={`${selectedNav || ''} exhibitions`} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Start Time</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>End Time</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Timezone</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Country</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Created By</th>
              <th style={{ textAlign: 'right', padding: '12px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExhibitions.map((ex) => {
              const isLive = live.find((l) => l._id === ex._id) != null;
              const country = countries.find(c => c.code === ex.country);
              return (
                <tr key={ex._id}>
                  <td data-label="Name" style={{ padding: '16px', fontWeight: '600' }}>{ex.name}</td>
                  <td data-label="Start" style={{ padding: '16px' }}>{new Date(ex.startTime).toLocaleString()}</td>
                  <td data-label="End" style={{ padding: '16px' }}>{new Date(ex.endTime).toLocaleString()}</td>
                  <td data-label="Timezone" style={{ padding: '16px' }}>{ex.timezone}</td>
                  <td data-label="Country" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {country && <span className="country-flag" style={{ fontSize: '24px', lineHeight: '1' }}>{country.flag}</span>}
                      <span>{country ? country.name : ex.country}</span>
                    </div>
                  </td>
                  <td data-label="Status" style={{ padding: '16px' }}>
                    <span className={`pill ${isLive ? 'pill-live' : selectedNav === 'upcoming' ? 'pill-upcoming' : 'pill-completed'}`}>
                      {isLive ? 'Live' : selectedNav === 'upcoming' ? 'Upcoming' : 'Completed'}
                    </span>
                  </td>
                  <td data-label="Created By" style={{ padding: '16px' }}>{ex.createdBy || '—'}</td>
                  <td data-label="Actions" style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button className="btn" onClick={() => setViewing(ex)}>View</button>
                      <button className="btn" onClick={() => handleOpenDuplicate(ex)}>
                        <FiCopy /> Duplicate
                      </button>
                      <button className="btn danger" onClick={() => requestDelete(ex)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderEmptyState = () => {
    return (
      <div className="landing-empty-state">
        <div className="empty-state-content">
          <div className="empty-state-image">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="200" height="200" rx="20" fill="url(#gradient1)"/>
              <path d="M100 60L140 100L100 140L60 100L100 60Z" fill="url(#gradient2)" opacity="0.8"/>
              <circle cx="100" cy="100" r="30" fill="url(#gradient3)"/>
              <defs>
                <linearGradient id="gradient1" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60a5fa" stopOpacity="0.2"/>
                  <stop offset="1" stopColor="#f472b6" stopOpacity="0.2"/>
                </linearGradient>
                <linearGradient id="gradient2" x1="60" y1="60" x2="140" y2="140" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60a5fa"/>
                  <stop offset="1" stopColor="#f472b6"/>
                </linearGradient>
                <linearGradient id="gradient3" x1="70" y1="70" x2="130" y2="130" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f472b6"/>
                  <stop offset="1" stopColor="#60a5fa"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 style={{ marginTop: '24px', marginBottom: '12px', fontSize: '24px' }}>Get Started</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '24px', maxWidth: '400px' }}>
            Create your first exhibition to start scanning business cards and managing your contacts.
          </p>
          <button className="primary" onClick={handleOpenCreate} style={{ maxWidth: '250px' }}>
            <FiPlus style={{ marginRight: '8px' }} />
            Create Exhibition
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="landing-page">
      <div className="landing-sidebar">
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-nav-item ${selectedNav === 'live' ? 'active' : ''}`}
            onClick={() => setSelectedNav('live')}
          >
            Live Exhibitions
          </button>
          <button 
            className={`sidebar-nav-item ${selectedNav === 'upcoming' ? 'active' : ''}`}
            onClick={() => setSelectedNav('upcoming')}
          >
            Upcoming
          </button>
          <button 
            className={`sidebar-nav-item ${selectedNav === 'completed' ? 'active' : ''}`}
            onClick={() => setSelectedNav('completed')}
          >
            Completed
          </button>
        </nav>
      </div>
      <div className="landing-content">
        <div className="landing-header">
          <div className="landing-header-copy">
            <h1>Exhibitions</h1>
            <p className="landing-header-subtitle">
              Monitor live events, prepare upcoming shows, and review completed exhibitions on any device.
            </p>
          </div>
          <div className="landing-header-cta">
            <button className="btn" onClick={handleOpenCreate}>
              <FiPlus /> Create Exhibition
            </button>
          </div>
        </div>

        <div className="status-summary">
          {statusSummary.map((card) => (
            <button
              key={card.key}
              type="button"
              className={`status-card status-${card.tone} ${selectedNav === card.key ? 'active' : ''}`}
              onClick={() => setSelectedNav(card.key)}
            >
              <span className="status-label">{card.label}</span>
              <span className="status-count">{card.count}</span>
            </button>
          ))}
        </div>

        {error && <div className="msg error">{error}</div>}
        {message.text && <div className={`msg ${message.type}`}>{message.text}</div>}

        {!selectedNav ? renderEmptyState() : renderExhibitionsTable()}
      </div>

      {showCreate && (
        <div className="modal" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) closeCreateModal(); }}>
          <div className="modal-panel form-modal">
            <div className="modal-header">
              <h3>{modalMode === 'duplicate' ? 'Duplicate Exhibition' : 'Create Exhibition'}</h3>
              <button className="btn" onClick={closeCreateModal}>Close</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field full">
                  <label className="label">Name</label>
                  <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-field full">
                  <label className="label">Start Time</label>
                  <input type="datetime-local" className="input" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
                </div>
                <div className="form-field full">
                  <label className="label">End Time</label>
                  <input type="datetime-local" className="input" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label className="label">Timezone</label>
                  <select className="input" value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}>
                    <option value="">Select Timezone</option>
                    {timezones.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="label">Country</label>
                  <select className="input" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}>
                    <option value="">Select Country</option>
                    {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-field full">
                  <label className="label">Created By</label>
                  <input 
                    className="input" 
                    value={form.createdBy} 
                    onChange={(e) => setForm((f) => ({ ...f, createdBy: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="primary" onClick={handleSaveExhibition} disabled={creating}>
                  {modalMode === 'duplicate' ? 'Create Duplicate' : 'Save Exhibition'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="modal" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setViewing(null); }}>
          <div className="modal-panel">
            <div className="modal-header">
              <h3>Exhibition Details</h3>
              <button className="btn" onClick={() => setViewing(null)}>Close</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gap: 10, width: '100%' }}>
                <div><strong>Name:</strong> {viewing.name}</div>
                <div><strong>Start Time:</strong> {new Date(viewing.startTime).toLocaleString()}</div>
                <div><strong>End Time:</strong> {new Date(viewing.endTime).toLocaleString()}</div>
                <div><strong>Timezone:</strong> {viewing.timezone}</div>
                <div><strong>Country:</strong> {viewing.country}</div>
                <div><strong>Created By:</strong> {viewing.createdBy || '—'}</div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="primary" onClick={() => {
                    const isLive = live.find((l) => l._id === viewing._id) != null;
                    setActiveExhibition({ ...viewing, isLive });
                    setViewing(null);
                    setTab('dashboard');
                  }}>View Dashboard</button>
                  
                  {live.find((l) => l._id === viewing._id) && (
                    <button className="primary" onClick={() => {
                      const isLive = live.find((l) => l._id === viewing._id) != null;
                      setActiveExhibition({ ...viewing, isLive });
                      setViewing(null);
                      setTab('scan');
                    }}>Scan Card</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
