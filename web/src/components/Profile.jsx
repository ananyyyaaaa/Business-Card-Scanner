import { useEffect, useState, useMemo } from 'react';
import { listExhibitions, getLiveExhibitions } from '../services/api.js';
import countries from '../countries.json';

export default function Profile({ userName }) {
  const [exhibitions, setExhibitions] = useState([]);
  const [live, setLive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadExhibitions = async () => {
    try {
      const res = await listExhibitions();
      const allExhibitions = res?.data || [];
      // Filter exhibitions created by this user
      const userExhibitions = allExhibitions.filter(ex => ex.createdBy === userName);
      setExhibitions(userExhibitions);
    } catch (e) {
      setError(e.message || 'Failed to load exhibitions');
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadExhibitions();
      try {
        const l = await getLiveExhibitions();
        setLive(l?.data || []);
      } catch (e) {
        // silent
      }
      setLoading(false);
    })();
  }, [userName]);

  // Sort exhibitions: live first, then by start time
  const sortedExhibitions = useMemo(() => {
    return [...exhibitions].sort((a, b) => {
      const aIsLive = live.find((l) => l._id === a._id) != null;
      const bIsLive = live.find((l) => l._id === b._id) != null;
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      return new Date(a.startTime) - new Date(b.startTime);
    });
  }, [exhibitions, live]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="dash">
      <div className="dash-header">
        <div>
          <h2>My Profile</h2>
          <p className="muted">Exhibitions created by {userName}</p>
        </div>
      </div>

      {error && <div className="msg error">{error}</div>}

      {sortedExhibitions.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 40px', 
          color: 'var(--muted)',
          background: 'linear-gradient(180deg, rgba(96,165,250,0.05), rgba(244,114,182,0.05))',
          borderRadius: '16px',
          border: '1px dashed rgba(96,165,250,0.3)',
          marginTop: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <p style={{ fontSize: '18px', margin: 0 }}>No exhibitions created yet</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Create your first exhibition to get started</p>
        </div>
      ) : (
        <div className="exhibitions-panel table" style={{ padding: 0, marginTop: '20px' }}>
          <table className="exhibitions-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Start Time</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>End Time</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Timezone</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Country</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Status</th>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


