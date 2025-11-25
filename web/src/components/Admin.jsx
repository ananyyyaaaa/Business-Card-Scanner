import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiX } from 'react-icons/fi';
import { getIpRequests, approveIpRequest, listExhibitions, getLiveExhibitions } from '../services/api';
import countries from '../countries.json';

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ip-requests'); // 'ip-requests', 'exhibitions'
  const [ipRequests, setIpRequests] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [live, setLive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const loadIpRequests = async () => {
    try {
      const res = await getIpRequests();
      setIpRequests(res?.data || []);
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load IP requests');
    }
  };

  const loadExhibitions = async () => {
    try {
      const res = await listExhibitions();
      setExhibitions(res?.data || []);
      try {
        const l = await getLiveExhibitions();
        setLive(l?.data || []);
      } catch (e) {
        // silent
      }
    } catch (e) {
      setError(e.message || 'Failed to load exhibitions');
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadIpRequests();
      await loadExhibitions();
      setLoading(false);
    })();
  }, []);

  // Auto-refresh IP requests every 10 seconds
  useEffect(() => {
    if (activeTab === 'ip-requests') {
      loadIpRequests();
      const interval = setInterval(() => {
        loadIpRequests();
      }, 10000); // 10 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'exhibitions') {
      loadExhibitions();
      const interval = setInterval(() => {
        loadExhibitions();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleApprove = async (requestId, approved) => {
    try {
      await approveIpRequest(requestId, approved);
      setMessage({ type: 'success', text: `IP request ${approved ? 'approved' : 'rejected'}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      await loadIpRequests();
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Failed to update request' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return null;
    const country = countries.find(c => c.code === countryCode);
    return country ? country.flag : null;
  };

  const getCountryName = (countryCode) => {
    if (!countryCode) return 'Unknown';
    const country = countries.find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  };

  // Sort exhibitions: live first, then by start time
  const sortedExhibitions = [...exhibitions].sort((a, b) => {
    const aIsLive = live.find((l) => l._id === a._id) != null;
    const bIsLive = live.find((l) => l._id === b._id) != null;
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;
    return new Date(a.startTime) - new Date(b.startTime);
  });

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loader" />
      </div>
    );
  }

  const pendingCount = ipRequests.filter(r => !r.approved).length;

  return (
    <div className="admin-page">
      <div className="admin-hero">
        <div>
          <h1 className="admin-title">Admin Panel</h1>
          <p className="muted">Manage IP approvals and exhibitions</p>
        </div>
        <button className="btn danger" onClick={handleLogout}>Logout</button>
      </div>

      <div className="admin-tabs">
        <button
          className={`btn admin-tab ${activeTab === 'ip-requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('ip-requests')}
        >
          IP Requests
          {pendingCount > 0 && (
            <span className="admin-badge">{pendingCount}</span>
          )}
        </button>
        <button
          className={`btn admin-tab ${activeTab === 'exhibitions' ? 'active' : ''}`}
          onClick={() => setActiveTab('exhibitions')}
        >
          Exhibitions
        </button>
      </div>

      {message.text && <div className={`msg ${message.type}`}>{message.text}</div>}
      {error && <div className="msg error">{error}</div>}

      {activeTab === 'ip-requests' && (
        <div>
          <div className="admin-section-head">
            <h2>IP Approval Requests</h2>
            <div className="admin-stats">
              <div className="admin-stat danger">
                <span>Pending</span>
                <strong>{pendingCount}</strong>
              </div>
              <div className="admin-stat success">
                <span>Approved</span>
                <strong>{ipRequests.filter(r => r.approved).length}</strong>
              </div>
            </div>
          </div>
          {ipRequests.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 40px', 
              color: 'var(--muted)',
              background: 'linear-gradient(180deg, rgba(96,165,250,0.05), rgba(244,114,182,0.05))',
              borderRadius: '16px',
              border: '1px dashed rgba(96,165,250,0.3)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <p style={{ fontSize: '18px', margin: 0 }}>No IP requests found</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>IP requests will appear here when users log in</p>
            </div>
          ) : (
            <div className="exhibitions-panel table table-scroll admin-table-wrapper">
              <table className="exhibitions-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>IP Address</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Country</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Date</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ipRequests
                    .sort((a, b) => {
                      // Pending requests first
                      if (a.approved !== b.approved) {
                        return a.approved ? 1 : -1;
                      }
                      // Then by date (newest first)
                      return new Date(b.createdAt) - new Date(a.createdAt);
                    })
                    .map((request) => {
                    const isApproved = request.approved === true;
                    return (
                      <tr 
                        key={request._id} 
                        style={{ 
                          background: !isApproved ? 'rgba(239,68,68,0.05)' : 'transparent',
                          borderLeft: !isApproved ? '4px solid #ef4444' : '4px solid transparent'
                        }}
                      >
                        <td style={{ padding: '16px', fontWeight: '600' }}>{request.userName || '—'}</td>
                        <td style={{ padding: '16px' }}>{request.userEmail || '—'}</td>
                        <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '14px' }}>{request.ipAddress || '—'}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {getCountryFlag(request.countryCode) && (
                              <span style={{ fontSize: '24px' }}>{getCountryFlag(request.countryCode)}</span>
                            )}
                            <span>{getCountryName(request.countryCode)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className={`pill ${isApproved ? 'pill-live' : 'pill-muted'}`}>
                            {isApproved ? '✓ Approved' : '⏳ Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontSize: '13px', color: 'var(--muted)' }}>
                          {new Date(request.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          {!isApproved ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                className="btn"
                                onClick={() => handleApprove(request._id, true)}
                                style={{ 
                                  background: 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(22,163,74,0.25))', 
                                  borderColor: '#22c55e',
                                  color: '#22c55e',
                                  fontWeight: '600'
                                }}
                              >
                                <FiCheck style={{ marginRight: '6px' }} />
                                Approve
                              </button>
                              <button
                                className="btn danger"
                                onClick={() => handleApprove(request._id, false)}
                                style={{ fontWeight: '600' }}
                              >
                                <FiX style={{ marginRight: '6px' }} />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--muted)', fontSize: '13px' }}>
                              Approved {request.approvedAt ? new Date(request.approvedAt).toLocaleDateString() : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'exhibitions' && (
        <div>
          <h2 style={{ marginBottom: '20px' }}>All Exhibitions</h2>
          {sortedExhibitions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
              <p>No exhibitions found</p>
            </div>
          ) : (
            <div className="exhibitions-panel table table-scroll admin-table-wrapper">
              <table className="exhibitions-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Start Time</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>End Time</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Timezone</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Country</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedExhibitions.map((ex) => {
                    const isLive = live.find((l) => l._id === ex._id) != null;
                    const now = new Date();
                    const startTime = new Date(ex.startTime);
                    const endTime = new Date(ex.endTime);
                    endTime.setHours(endTime.getHours() + 12);
                    const isUpcoming = startTime > now && !isLive;
                    const isCompleted = endTime < now && !isLive;
                    const country = countries.find(c => c.code === ex.country);
                    
                    return (
                      <tr key={ex._id}>
                        <td style={{ padding: '16px', fontWeight: '600' }}>{ex.name}</td>
                        <td style={{ padding: '16px' }}>{new Date(ex.startTime).toLocaleString()}</td>
                        <td style={{ padding: '16px' }}>{new Date(ex.endTime).toLocaleString()}</td>
                        <td style={{ padding: '16px' }}>{ex.timezone}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {country && <span style={{ fontSize: '20px' }}>{country.flag}</span>}
                            <span>{country ? country.name : ex.country}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className={`pill ${isLive ? 'pill-live' : isUpcoming ? 'pill-upcoming' : 'pill-completed'}`}>
                            {isLive ? 'Live' : isUpcoming ? 'Upcoming' : 'Completed'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>{ex.createdBy || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

