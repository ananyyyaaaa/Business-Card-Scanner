import { useEffect, useState } from 'react';
import { FiPlus, FiCopy, FiPlay } from 'react-icons/fi';
import { deleteExhibition } from '../services/api.js';
import { listExhibitions, createExhibition, duplicateExhibition, getLiveExhibitions } from '../services/api.js';

export default function Home({ setActiveExhibition, setTab }) {
  const [exhibitions, setExhibitions] = useState([]);
  const [live, setLive] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', time: '', createdBy: '' });
  const [viewing, setViewing] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadExhibitions = async () => {
    try {
      const res = await listExhibitions();
      setExhibitions(res?.data || []);
    } catch (e) {
      setError(e.message || 'Failed to load exhibitions');
    }
  };

  useEffect(() => {
    (async () => {
      await loadExhibitions();
      try {
        const l = await getLiveExhibitions();
        setLive(l?.data || []);
      } catch (e) {
        // silent
      }
    })();
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.date) {
      setMessage({ type: 'error', text: 'Please enter name and date' });
      return;
    }
    if (!window.confirm(`Create exhibition "${form.name}" on ${form.date}?`)) return;
    try {
      setCreating(true);
      const res = await createExhibition(form);
      if (res?.success) {
        await loadExhibitions();
        setShowCreate(false);
        setForm({ name: '', date: '', time: '', createdBy: '' });
        setMessage({ type: 'success', text: 'Exhibition created' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Create failed' });
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (id) => {
    if (!window.confirm('Duplicate this exhibition?')) return;
    try {
      await duplicateExhibition(id);
      await loadExhibitions();
      setMessage({ type: 'success', text: 'Exhibition duplicated' });
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Duplicate failed' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exhibition and all its cards? This cannot be undone.')) return;
    try {
      await deleteExhibition(id);
      await loadExhibitions();
      setMessage({ type: 'success', text: 'Exhibition deleted' });
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Delete failed' });
    }
  };

  return (
    <div className="dash">
      <div className="dash-header">
        <h2>Exhibitions</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setShowCreate(true)}><FiPlus /> Create Exhibition</button>
        </div>
      </div>

      {error && <div className="msg error">{error}</div>}
      {message.text && <div className={`msg ${message.type}`}>{message.text}</div>}

      <div className="exhibitions-panel table" style={{ padding: 0 }}>
        <table className="exhibitions-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Time</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Live</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Created By</th>
              <th style={{ textAlign: 'right', padding: '12px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exhibitions.map((ex) => {
              const isLive = live.find((l) => l._id === ex._id) != null;
              return (
                <tr key={ex._id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>{ex.name}</td>
                  <td style={{ padding: '12px 16px' }}>{new Date(ex.date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px' }}>{ex.time || '-'}</td>
                  <td style={{ padding: '12px 16px' }}><span className={`pill ${isLive ? 'pill-rec' : 'pill-muted'}`}>{isLive ? 'Live' : 'Not Live'}</span></td>
                  <td style={{ padding: '12px 16px' }}>{ex.createdBy || '—'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button className="btn" onClick={() => setViewing(ex)}>View</button>
                    <button className="btn" style={{ marginLeft: 8 }} onClick={() => handleDuplicate(ex._id)}>Duplicate</button>
                    <button className="btn danger" style={{ marginLeft: 8 }} onClick={() => handleDelete(ex._id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="modal" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal-panel">
            <div className="modal-header">
              <h3>Create Exhibition</h3>
              <button className="btn" onClick={() => setShowCreate(false)}>Close</button>
            </div>
            <div className="modal-body">
              <div className="table">
                <div className="row"><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
                <div className="row"><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
                <div className="row"><label className="label">Time</label><input type="time" className="input" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} /></div>
                <div className="row"><label className="label">Created By</label><input className="input" value={form.createdBy} onChange={(e) => setForm((f) => ({ ...f, createdBy: e.target.value }))} /></div>
              </div>
              <div style={{ marginTop: 10 }}>
                <button className="primary" onClick={handleCreate} disabled={creating}>Save Exhibition</button>
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
                <div><strong>Date:</strong> {new Date(viewing.date).toLocaleDateString()}</div>
                <div><strong>Time:</strong> {viewing.time || '—'}</div>
                <div><strong>Created By:</strong> {viewing.createdBy || '—'}</div>
                <div style={{ marginTop: 12 }}>
                  <button className="primary" onClick={() => { setActiveExhibition(viewing); setViewing(null); setTab('scan'); }}>Open & Start Scanning</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
