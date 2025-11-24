import { useEffect, useMemo, useState } from 'react';
import { FiMic, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { getCards, getCardsForExhibition, updateCard } from '../services/api.js';

// Function to check if the exhibition is active
const isExhibitionActive = (exhibition) => {
  if (!exhibition) return false;
  const now = new Date();
  const startTime = new Date(exhibition.startTime);
  const endTime = new Date(exhibition.endTime);
  // Add a 12-hour buffer to the end time
  endTime.setHours(endTime.getHours() + 12);
  return now >= startTime && now <= endTime;
};

export default function Dashboard({ activeExhibition }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [exhibitionEnded, setExhibitionEnded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingFields, setEditingFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (activeExhibition) {
      const now = new Date();
      const endTime = new Date(activeExhibition.endTime);
      endTime.setHours(endTime.getHours() + 12);
      setExhibitionEnded(now > endTime);
    }
  }, [activeExhibition]);

  // Load cards function
  useEffect(() => {
    const loadCards = async () => {
      try {
        setLoading(true);
        if (activeExhibition && activeExhibition._id) {
          const res = await getCardsForExhibition(activeExhibition._id);
          setCards(res?.data || []);
        } else {
          const res = await getCards();
          setCards(res?.data || []);
        }
        setError('');
      } catch (e) {
        setError(e.message || 'Failed to load cards');
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadCards();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadCards();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [activeExhibition]);

  const getEditableSnapshot = (card) => {
    const snapshot = {};
    allFields.forEach((field) => {
      snapshot[field] = card.fields?.[field] ?? card[field] ?? '';
    });
    return snapshot;
  };

  const handleEdit = (card) => {
    setEditingId(card._id);
    setEditingFields(getEditableSnapshot(card));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingFields({});
  };

  const handleFieldChange = (field, value) => {
    setEditingFields(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (cardId) => {
    try {
      setSaving(true);
      await updateCard(cardId, editingFields);
      setMessage({ type: 'success', text: 'Card updated successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      setEditingId(null);
      setEditingFields({});
      // Reload cards
      const loadCards = async () => {
        try {
          if (activeExhibition && activeExhibition._id) {
            const res = await getCardsForExhibition(activeExhibition._id);
            setCards(res?.data || []);
          } else {
            const res = await getCards();
            setCards(res?.data || []);
          }
        } catch (e) {
          setError(e.message || 'Failed to load cards');
        }
      };
      await loadCards();
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Failed to update card' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setSaving(false);
    }
  };

  const getFieldValue = (card, field) => {
    if (editingId === card._id) {
      return editingFields[field] ?? '';
    }
    // Check both card.fields and direct card properties for OCR extracted data
    return card.fields?.[field] || card[field] || '';
  };

  const allFields = ['name', 'email', 'phone', 'address', 'company', 'website'];

  return (
    <div className="dash">
      <div className="dash-header">
        <h2>Dashboard</h2>
        <p className="muted">All saved cards - Click Edit to modify details</p>
      </div>
      {exhibitionEnded && (
        <div className="msg info">
          The exhibition has ended. You can still view and edit the cards, but you cannot add new ones.
        </div>
      )}
      {message.text && <div className={`msg ${message.type}`}>{message.text}</div>}
      {loading && <div className="loader" aria-busy="true" />}
      {error && <div className="msg error">{error}</div>}
      
      {cards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          <p>No cards found. Scan a card to get started!</p>
        </div>
      ) : (
        <div className="exhibitions-panel table table-scroll" style={{ padding: 0, marginTop: '20px' }}>
          <table className="exhibitions-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Image</th>
                {allFields.map(field => (
                  <th key={field} style={{ textAlign: 'left', padding: '12px 16px', textTransform: 'capitalize' }}>
                    {field}
                  </th>
                ))}
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Audio</th>
                <th style={{ textAlign: 'right', padding: '12px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => {
                const isEditing = editingId === card._id;
                return (
                  <tr
                    key={card._id}
                    className={isEditing ? 'editing' : ''}
                    onClick={(e) => {
                      if (isEditing) return;
                      if (e.target.closest('.action-cell')) return;
                      setSelected(card);
                    }}
                    style={{ cursor: isEditing ? 'default' : 'pointer' }}
                  >
                    <td style={{ padding: '16px' }}>
                      {card.image ? (
                        <img 
                          src={card.image} 
                          alt={card.fields?.name || 'card'} 
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                      ) : (
                        <div style={{ width: '60px', height: '60px', background: 'var(--panel)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                          No Image
                        </div>
                      )}
                    </td>
                    {allFields.map(field => (
                      <td key={field} style={{ padding: '16px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            className="input"
                            value={getFieldValue(card, field)}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            style={{ width: '100%', minWidth: '150px', padding: '8px' }}
                            placeholder={`Enter ${field}`}
                          />
                        ) : (
                          <span>{getFieldValue(card, field) || '—'}</span>
                        )}
                      </td>
                    ))}
                    <td style={{ padding: '16px' }}>
                      {new Date(card.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {card.audio ? (
                        <span className="pill pill-rec" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <FiMic /> REC
                        </span>
                      ) : (
                        <span className="pill pill-muted">No REC</span>
                      )}
                    </td>
                    <td className="action-cell" style={{ padding: '16px', textAlign: 'right' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn" 
                            onClick={() => handleSave(card._id)} 
                            disabled={saving}
                            style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(22,163,74,0.2))', borderColor: '#22c55e' }}
                          >
                            <FiSave /> {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button 
                            className="btn danger" 
                            onClick={handleCancelEdit}
                            disabled={saving}
                          >
                            <FiX /> Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button 
                            className="btn" 
                            onClick={(e) => { e.stopPropagation(); handleEdit(card); }}
                            style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(244,114,182,0.2))' }}
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button 
                            className="btn" 
                            onClick={(e) => { e.stopPropagation(); setSelected(card); }}
                          >
                            View
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <DetailModal card={selected} onClose={() => setSelected(null)} />)
      }
    </div>
  );
}

function DetailModal({ card, onClose }) {
  const created = useMemo(() => new Date(card.createdAt).toLocaleString(), [card.createdAt]);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Card details" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel">
        <div className="modal-header">
          <h3>{card.name || 'Unnamed'}</h3>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          <div className="modal-media">
            {card.image ? (
              <img src={card.image} alt={card.name || 'card'} />
            ) : (
              <div className="ph">No Image</div>
            )}
          </div>
          <div className="modal-meta">
            <div><strong>Date:</strong> {created}</div>
            {card.name && <div><strong>Name:</strong> {card.name}</div>}
            {card.email && <div><strong>Email:</strong> {card.email}</div>}
            {card.phone && <div><strong>Phone:</strong> {card.phone}</div>}
            {card.address && <div><strong>Address:</strong> {card.address}</div>}
            {card.company && <div><strong>Company:</strong> {card.company}</div>}
            {card.website && (
              <div>
                <strong>Website:</strong>{' '}
                <a href={card.website.startsWith('http') ? card.website : `https://${card.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer">
                  {card.website}
                </a>
              </div>
            )}
            {card.audio ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="pill pill-rec"><FiMic /> REC</span>
                  <span>Audio recording</span>
                </div>
                <audio controls src={card.audio} style={{ width: '100%' }} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
