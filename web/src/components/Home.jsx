import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiCopy, FiStar, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import { deleteExhibition, listExhibitions, createExhibition, getLiveExhibitions, updateExhibition } from '../services/api.js';
import timezones from '../timezones.json'; // Assuming you have a timezones.json file
import countries from '../countries.json'; // Assuming you have a countries.json file

const parseTimezoneOffsetMinutes = (timezone) => {
  const match = /^UTC([+-])(\d{2}):(\d{2})$/.exec(timezone || '');
  if (!match) return null;
  const [, sign, hours, minutes] = match;
  const baseMinutes = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
  return sign === '-' ? -baseMinutes : baseMinutes;
};

const toUtcISOString = (value, timezone) => {
  if (!value) return '';
  const tzOffset = parseTimezoneOffsetMinutes(timezone);

  if (!tzOffset && tzOffset !== 0) {
    const localDate = new Date(value);
    if (Number.isNaN(localDate.getTime())) return '';
    return localDate.toISOString();
  }

  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) return '';
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  if ([year, month, day, hours, minutes].some((n) => Number.isNaN(n))) return '';

  const utcMillis = Date.UTC(year, month - 1, day, hours, minutes);
  const adjustedMillis = utcMillis - tzOffset * 60000;
  return new Date(adjustedMillis).toISOString();
};

export default function Home({ setActiveExhibition, setTab, userName }) {
  const navigate = useNavigate();
  const [exhibitions, setExhibitions] = useState([]);
  const [live, setLive] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedNav, setSelectedNav] = useState('live'); // 'live', 'upcoming', 'completed'
  const isAdmin = !!localStorage.getItem('adminToken');
  const [form, setForm] = useState({
    name: '',
    startTime: '',
    endTime: '',
    timezone: '',
    country: '',
    locationType: 'DOMESTIC',
    venue: '',
    organizationDetails: '',
    organizerContactPerson: '',
    organizerEmail: '',
    organizerMobile: '',
    createdBy: userName || '',
  });
  const [viewing, setViewing] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'duplicate' | 'edit'
  const [editingExhibition, setEditingExhibition] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { exhibition: {...}, id: '...' } or null

  const buildEmptyForm = () => ({
    name: '',
    startTime: '',
    endTime: '',
    timezone: '',
    country: '',
    locationType: 'DOMESTIC',
    venue: '',
    organizationDetails: '',
    organizerContactPerson: '',
    organizerEmail: '',
    organizerMobile: '',
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

    const startUtc = toUtcISOString(form.startTime, form.timezone);
    const endUtc = toUtcISOString(form.endTime, form.timezone);

    if (!startUtc || !endUtc) {
      setMessage({ type: 'error', text: 'Invalid start or end time' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return;
    }

    if (new Date(startUtc) >= new Date(endUtc)) {
      setMessage({ type: 'error', text: 'End time must be after start time' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return;
    }

    const payload = {
      ...form,
      startTime: startUtc,
      endTime: endUtc,
    };

    if (modalMode === 'edit' && editingExhibition) {
      handleUpdate(editingExhibition._id, payload);
    } else {
      handleCreate(payload);
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      setCreating(true);
      const res = await updateExhibition(id, payload);
      if (res?.success) {
        await refreshAll();
        setShowCreate(false);
        setForm(buildEmptyForm());
        setEditingExhibition(null);
        setModalMode('create');
        setMessage({ type: 'success', text: 'Exhibition updated' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Update failed' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setCreating(false);
    }
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
      locationType: exhibition.locationType || 'DOMESTIC',
      venue: exhibition.venue || '',
      organizationDetails: exhibition.organizationDetails || '',
      organizerContactPerson: exhibition.organizerContactPerson || '',
      organizerEmail: exhibition.organizerEmail || '',
      organizerMobile: exhibition.organizerMobile || '',
      createdBy: userName || exhibition.createdBy || '',
    });
    setModalMode('duplicate');
    setShowCreate(true);
  };

  const handleOpenEdit = (exhibition) => {
    if (!exhibition) return;
    setEditingExhibition(exhibition);
    setForm({
      name: exhibition.name,
      startTime: formatDateForInput(exhibition.startTime),
      endTime: formatDateForInput(exhibition.endTime),
      timezone: exhibition.timezone || '',
      country: exhibition.country || '',
      locationType: exhibition.locationType || 'DOMESTIC',
      venue: exhibition.venue || '',
      organizationDetails: exhibition.organizationDetails || '',
      organizerContactPerson: exhibition.organizerContactPerson || '',
      organizerEmail: exhibition.organizerEmail || '',
      organizerMobile: exhibition.organizerMobile || '',
      createdBy: exhibition.createdBy || userName || '',
    });
    setModalMode('edit');
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
    setDeleteConfirm({ exhibition, id: exhibition._id });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const handleDeleteProceed = async () => {
    if (deleteConfirm) {
      await handleDeleteConfirmed(deleteConfirm.id);
      setDeleteConfirm(null);
    }
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

  const openExhibitionForm = (ex) => {
    if (!ex?._id) return;
    navigate(`/exhibition-form/${ex._id}`);
  };

  const statusSummary = [
    { key: 'live', label: 'Live Exhibitions', count: exhibitionBuckets.live.length, tone: 'live' },
    { key: 'upcoming', label: 'Upcoming', count: exhibitionBuckets.upcoming.length, tone: 'upcoming' },
    { key: 'completed', label: 'Completed', count: exhibitionBuckets.completed.length, tone: 'completed' },
  ];

  const renderExhibitionsCards = () => {
    if (filteredExhibitions.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          <p>No {selectedNav} exhibitions found.</p>
        </div>
      );
    }

    return (
      <div className="exhibitions-cards-container">
        {filteredExhibitions.map((ex) => {
          const isLive = live.find((l) => l._id === ex._id) != null;
          const country = countries.find(c => c.code === ex.country);
          const statusText = isLive ? 'Live' : selectedNav === 'upcoming' ? 'Upcoming' : 'Completed';
          const statusClass = isLive ? 'pill-live' : selectedNav === 'upcoming' ? 'pill-upcoming' : 'pill-completed';

          return (
            <div key={ex._id} className="exhibition-card">
              <div className="exhibition-card-details">
                <div className="exhibition-card-row">
                  <span className="exhibition-card-label">NAME</span>
                  <span className="exhibition-card-value">{ex.name}</span>
                </div>
                <div className="exhibition-card-row">
                  <span className="exhibition-card-label">START</span>
                  <span className="exhibition-card-value">{new Date(ex.startTime).toLocaleString()}</span>
                </div>
                <div className="exhibition-card-row">
                  <span className="exhibition-card-label">END</span>
                  <span className="exhibition-card-value">{new Date(ex.endTime).toLocaleString()}</span>
                </div>
                <div className="exhibition-card-row">
                  <span className="exhibition-card-label">TIMEZONE</span>
                  <span className="exhibition-card-value">{ex.timezone}</span>
                </div>
                <div className="exhibition-card-row">
                  <span className="exhibition-card-label">COUNTRY</span>
                  <span className="exhibition-card-value">
                    {country && <span className="country-flag" style={{ fontSize: '20px', marginRight: '8px' }}>{country.flag}</span>}
                    {country ? country.name : ex.country}
                  </span>
                </div>
                <div className="exhibition-card-row">
                  <span className="exhibition-card-label">LOCATION</span>
                  <span className="exhibition-card-value">{ex.locationType || '—'}</span>
                </div>
                {ex.venue && (
                  <div className="exhibition-card-row">
                    <span className="exhibition-card-label">VENUE</span>
                    <span className="exhibition-card-value">{ex.venue}</span>
                  </div>
                )}
                {ex.organizationDetails && (
                  <div className="exhibition-card-row">
                    <span className="exhibition-card-label">ORG. DETAILS</span>
                    <span className="exhibition-card-value">{ex.organizationDetails}</span>
                  </div>
                )}
                {(ex.organizerContactPerson || ex.organizerEmail || ex.organizerMobile) && (
                  <>
                    {ex.organizerContactPerson && (
                      <div className="exhibition-card-row">
                        <span className="exhibition-card-label">CONTACT PERSON</span>
                        <span className="exhibition-card-value">{ex.organizerContactPerson}</span>
                      </div>
                    )}
                    {ex.organizerEmail && (
                      <div className="exhibition-card-row">
                        <span className="exhibition-card-label">EMAIL</span>
                        <span className="exhibition-card-value">{ex.organizerEmail}</span>
                      </div>
                    )}
                    {ex.organizerMobile && (
                      <div className="exhibition-card-row">
                        <span className="exhibition-card-label">MOBILE</span>
                        <span className="exhibition-card-value">{ex.organizerMobile}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="exhibition-card-row">
                  <span className="exhibition-card-label">STATUS</span>
                  <span className={`pill ${statusClass}`}>{statusText}</span>
                </div>
                <div className="exhibition-card-row">
                  <span className="exhibition-card-label">CREATED BY</span>
                  <span className="exhibition-card-value">{ex.createdBy || '—'}</span>
                </div>
              </div>
              <div className="exhibition-card-actions">
                <div className="exhibition-card-actions-label">ACTIONS</div>
                <div className="exhibition-card-actions-buttons">
                  {isAdmin && (
                    <button className="btn btn-view" onClick={() => openExhibitionForm(ex)} style={{ padding: '0 12px', height: '32px' }}>
                      Checklist
                    </button>
                  )}
                  {(isAdmin || selectedNav !== 'completed') && (
                    <button className="btn btn-view" onClick={() => setViewing(ex)} style={{ padding: '0', height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FiEye />
                    </button>
                  )}
                  {isAdmin && (
                    <>
                      <button className="btn btn-duplicate" onClick={() => handleOpenDuplicate(ex)} style={{ padding: '0', height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiCopy />
                      </button>
                      <button className="btn btn-view" onClick={() => handleOpenEdit(ex)} style={{ padding: '0', height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiEdit2 />
                      </button>
                      <button className="btn btn-delete" onClick={() => requestDelete(ex)} style={{ padding: '0', height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiTrash2 />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderExhibitionsTable = () => {
    if (filteredExhibitions.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          <p>No {selectedNav} exhibitions found.</p>
        </div>
      );
    }

    return (
      <div className="exhibitions-panel table" style={{
        padding: '12px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
      }}>
        <table className="exhibitions-table" aria-label={`${selectedNav || ''} exhibitions`} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', color: '#8094AE' }}>NAME</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', color: '#8094AE' }}>DATE & TIME</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', color: '#8094AE' }}>TZ</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', color: '#8094AE' }}>COUNTRY</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', color: '#8094AE' }}>LOCATION</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', color: '#8094AE' }}>ORGANIZER</th>
              <th style={{ textAlign: 'center', padding: '10px 16px', fontSize: '11px', color: '#8094AE' }}>STATUS</th>
              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', color: '#8094AE' }}>CREATOR</th>
              <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: '11px', color: '#8094AE' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredExhibitions.map((ex) => {
              const isLive = live.find((l) => l._id === ex._id) != null;
              const country = countries.find(c => c.code === ex.country);
              return (
                <tr key={ex._id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                  <td data-label="Name" style={{ padding: '12px 16px', fontWeight: '700', color: '#36c0cb' }}>{ex.name}</td>
                  <td data-label="Date" style={{ padding: '12px 16px', fontSize: '12px', color: '#526484' }}>
                    <div style={{ fontWeight: '600' }}>Starts: {new Date(ex.startTime).toLocaleDateString()}</div>
                    <div style={{ fontSize: '11px', color: '#8094AE' }}>Ends: {new Date(ex.endTime).toLocaleDateString()}</div>
                  </td>
                  <td data-label="Timezone" style={{ padding: '12px 16px', fontSize: '12px', color: '#8094AE' }}>{ex.timezone?.replace('UTC', '') || '—'}</td>
                  <td data-label="Country" style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px' }}>
                      {country && <span style={{ fontSize: '18px' }}>{country.flag}</span>}
                      <span style={{ fontWeight: '500' }}>{country ? country.name : ex.country}</span>
                    </div>
                  </td>
                  <td data-label="Location" style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#36c0cb' }}>{ex.locationType}</div>
                    {ex.venue && <div style={{ fontSize: '11px', color: '#8094AE', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ex.venue}>{ex.venue}</div>}
                  </td>
                  <td data-label="Organizer" style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '12px', lineHeight: '1.4', maxWidth: '200px' }}>
                      <div style={{ fontWeight: '600', color: '#36c0cb' }}>{ex.organizationDetails || '—'}</div>
                      <div style={{ fontSize: '11px', color: '#8094AE' }}>{ex.organizerEmail}</div>
                    </div>
                  </td>
                  <td data-label="Status" style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span className={`pill ${isLive ? 'pill-live' : selectedNav === 'upcoming' ? 'pill-upcoming' : 'pill-completed'}`} style={{
                      padding: '4px 10px',
                      fontSize: '10px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      fontWeight: '700',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      {isLive ? 'Live' : selectedNav === 'upcoming' ? 'Upcoming' : 'Completed'}
                    </span>
                  </td>
                  <td data-label="Created By" style={{ padding: '12px 16px', fontSize: '12px', color: '#526484' }}>{ex.createdBy || '—'}</td>
                  <td data-label="Actions" style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {isAdmin && (
                        <button
                          className="btn"
                          title="Open Checklist"
                          onClick={(e) => { e.stopPropagation(); openExhibitionForm(ex); }}
                          style={{
                            padding: '0 12px',
                            height: '32px',
                            fontSize: '12px',
                            minWidth: '85px',
                            borderRadius: '8px',
                            flexShrink: 0
                          }}
                        >
                          Checklist
                        </button>
                      )}
                      {(isAdmin || selectedNav !== 'completed') && (
                        <button
                          className="btn"
                          onClick={() => setViewing(ex)}
                          title="View"
                          style={{
                            padding: '0',
                            height: '32px',
                            width: '32px',
                            minWidth: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            flexShrink: 0
                          }}
                        >
                          <FiEye size={16} />
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            className="btn"
                            onClick={() => handleOpenDuplicate(ex)}
                            title="Duplicate"
                            style={{
                              padding: '0',
                              height: '32px',
                              width: '32px',
                              minWidth: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              flexShrink: 0
                            }}
                          >
                            <FiCopy size={16} />
                          </button>
                          <button
                            className="btn"
                            onClick={() => handleOpenEdit(ex)}
                            title="Edit"
                            style={{
                              padding: '0',
                              height: '32px',
                              width: '32px',
                              minWidth: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              flexShrink: 0
                            }}
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            className="btn danger"
                            onClick={() => requestDelete(ex)}
                            title="Delete"
                            style={{
                              padding: '0',
                              height: '32px',
                              width: '32px',
                              minWidth: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              flexShrink: 0
                            }}
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </>
                      )}
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
              <rect width="200" height="200" rx="20" fill="url(#gradient1)" />
              <path d="M100 60L140 100L100 140L60 100L100 60Z" fill="url(#gradient2)" opacity="0.8" />
              <circle cx="100" cy="100" r="30" fill="url(#gradient3)" />
              <defs>
                <linearGradient id="gradient1" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60a5fa" stopOpacity="0.2" />
                  <stop offset="1" stopColor="#f472b6" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="gradient2" x1="60" y1="60" x2="140" y2="140" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60a5fa" />
                  <stop offset="1" stopColor="#f472b6" />
                </linearGradient>
                <linearGradient id="gradient3" x1="70" y1="70" x2="130" y2="130" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f472b6" />
                  <stop offset="1" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 style={{ marginTop: '24px', marginBottom: '12px', fontSize: '24px' }}>Get Started</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '24px', maxWidth: '400px' }}>
            {isAdmin
              ? "Create your first exhibition to start scanning business cards and managing your contacts."
              : "No exhibitions found. Wait for an admin to create one."}
          </p>
          {isAdmin && (
            <button
              className="primary"
              onClick={handleOpenCreate}
              style={{ maxWidth: '250px' }}
            >
              <FiPlus style={{ marginRight: '8px' }} />
              Create Exhibition
            </button>
          )}
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
        <div className="home-content-container" style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div className="landing-header">
            <div className="landing-header-copy">
              <h1>Exhibitions</h1>
            </div>
            <div className="landing-header-cta">
              {isAdmin && (
                <button
                  className="btn"
                  onClick={handleOpenCreate}
                >
                  <FiPlus /> Create Exhibition
                </button>
              )}
            </div>
          </div>

          <div className="status-summary" style={{ gap: '12px', marginBottom: '16px' }}>
            {statusSummary.map((card) => (
              <button
                key={card.key}
                type="button"
                className={`status-card status-${card.tone} ${selectedNav === card.key ? 'active' : ''}`}
                onClick={() => setSelectedNav(card.key)}
                style={{
                  background: selectedNav === card.key ? (card.tone === 'live' ? '#36c0cb' : '#f0f2f5') : 'white',
                  border: '1px solid #e0e6ed',
                  color: selectedNav === card.key ? (card.tone === 'live' ? 'white' : '#3a2272') : '#526484',
                  boxShadow: selectedNav === card.key ? '0 4px 12px rgba(58, 34, 114, 0.15)' : 'none',
                  padding: '12px 16px',
                  borderRadius: '10px'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em' }}>{card.label}</div>
                <div style={{ fontSize: '24px', fontWeight: '800' }}>{card.count}</div>
              </button>
            ))}
          </div>

          {error && <div className="msg error">{error}</div>}
          {message.text && <div className={`msg ${message.type}`}>{message.text}</div>}

          {deleteConfirm && (
            <div className="confirm-modal-overlay">
              <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Confirm Deletion</h3>
                <p>Delete "{deleteConfirm.exhibition?.name}" and all associated cards? This action cannot be undone.</p>
                <div className="confirm-modal-actions">
                  <button className="btn secondary" onClick={handleDeleteCancel}>Cancel</button>
                  <button className="btn danger" onClick={handleDeleteProceed}>Delete</button>
                </div>
              </div>
            </div>
          )}

          {!selectedNav ? renderEmptyState() : (
            <>
              <div className="exhibitions-desktop">{renderExhibitionsTable()}</div>
              <div className="exhibitions-mobile">{renderExhibitionsCards()}</div>
            </>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-panel form-modal">
            <div className="modal-header">
              <h3>{modalMode === 'duplicate' ? 'Duplicate Exhibition' : 'Create Exhibition'}</h3>
              <button className="btn" onClick={closeCreateModal}>Close</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field full">
                  <label className="label">Name of Exhibition</label>
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
                <div className="form-field">
                  <label className="label">Location</label>
                  <select className="input" value={form.locationType} onChange={(e) => setForm((f) => ({ ...f, locationType: e.target.value }))}>
                    <option value="DOMESTIC">Domestic</option>
                    <option value="INTERNATIONAL">International</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="label">Venue</label>
                  <input
                    className="input"
                    placeholder="Exhibition venue"
                    value={form.venue}
                    onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                  />
                </div>
                <div className="form-field full">
                  <label className="label">Organization Details</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Organizer details, booth info, etc."
                    value={form.organizationDetails}
                    onChange={(e) => setForm((f) => ({ ...f, organizationDetails: e.target.value }))}
                  />
                </div>
                <div className="form-field">
                  <label className="label">Contact Person</label>
                  <input
                    className="input"
                    value={form.organizerContactPerson}
                    onChange={(e) => setForm((f) => ({ ...f, organizerContactPerson: e.target.value }))}
                    placeholder="Organizer name"
                  />
                </div>
                <div className="form-field">
                  <label className="label">Contact Email</label>
                  <input
                    type="email"
                    className="input"
                    value={form.organizerEmail}
                    onChange={(e) => setForm((f) => ({ ...f, organizerEmail: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="form-field">
                  <label className="label">Mobile Number</label>
                  <input
                    className="input"
                    value={form.organizerMobile}
                    onChange={(e) => setForm((f) => ({ ...f, organizerMobile: e.target.value }))}
                    placeholder="+1 555 123 4567"
                  />
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
                  {modalMode === 'duplicate' ? 'Create Duplicate' : modalMode === 'edit' ? 'Update Exhibition' : 'Save Exhibition'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="modal" role="dialog" aria-modal="true">
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
                {viewing.locationType && <div><strong>Location:</strong> {viewing.locationType}</div>}
                {viewing.venue && <div><strong>Venue:</strong> {viewing.venue}</div>}
                {viewing.organizationDetails && <div><strong>Org. Details:</strong> {viewing.organizationDetails}</div>}
                {viewing.organizerContactPerson && <div><strong>Contact Person:</strong> {viewing.organizerContactPerson}</div>}
                {viewing.organizerEmail && <div><strong>Email:</strong> {viewing.organizerEmail}</div>}
                {viewing.organizerMobile && <div><strong>Mobile:</strong> {viewing.organizerMobile}</div>}
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
