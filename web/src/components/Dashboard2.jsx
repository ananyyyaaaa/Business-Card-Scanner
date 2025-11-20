import { useEffect, useMemo, useState } from 'react';
import { FiMic } from 'react-icons/fi';
import { getCards, getCardsForExhibition } from '../services/api.js';

export default function Dashboard({ activeExhibition }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (activeExhibition && activeExhibition._id) {
          const res = await getCardsForExhibition(activeExhibition._id);
          setCards(res?.data || []);
        } else {
          const res = await getCards();
          setCards(res?.data || []);
        }
      } catch (e) {
        setError(e.message || 'Failed to load cards');
      } finally {
        setLoading(false);
      }
    })();
  }, [activeExhibition]);

  return (
    <div className="dash">
      <div className="dash-header">
        <h2>Dashboard</h2>
        <p className="muted">Recently saved cards</p>
      </div>
      {loading && <div className="loader" aria-busy="true" />}
      {error && <div className="msg error">{error}</div>}
      <div className="grid">
        {cards.map((c) => (
          <article className="card gradient-card" key={c._id} role="button" tabIndex={0} onClick={() => setSelected(c)} onKeyDown={(e) => { if (e.key === 'Enter') setSelected(c); }}>
            <div className="card-media">
              {c.image ? (
                <img src={c.image} alt={c.name || 'card'} />
              ) : (
                <div className="ph">No Image</div>
              )}
            </div>
            <div className="card-body">
              <div className="card-title-row">
                <h3 className="card-title">{c.name || 'Unnamed'}</h3>
                {c.audio ? (
                  <span className="pill pill-rec" title="Recording saved" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <FiMic /> REC saved
                  </span>
                ) : (
                  <span className="pill pill-muted">No REC</span>
                )}
              </div>
              <div className="meta-row">
                <span className="meta">{new Date(c.createdAt).toLocaleString()}</span>
                {c.email && <span className="meta">{c.email}</span>}
              </div>
            </div>
          </article>
        ))}
      </div>

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
              <div style={{ marginTop: 8 }}>
                <span className="pill pill-rec" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><FiMic /> REC saved</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
