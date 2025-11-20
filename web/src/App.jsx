import { useState } from 'react';
import BusinessCard from './components/BusinessCard.jsx';
import Home from './components/Home.jsx';
import Dashboard from './components/Dashboard2.jsx';

export default function App() {
  const [tab, setTab] = useState('home');
  const [activeExhibition, setActiveExhibition] = useState(null);

  return (
    <div className="page">
      <header className="header gradient-header">
        <div className="header-inner">
          <h1>BizCard</h1>
          <nav className="nav">
            {tab === 'home' ? (
              <button className={`nav-btn active`} onClick={() => setTab('home')}>Home</button>
            ) : (
              <>
                <button className={`nav-btn ${tab === 'scan' ? 'active' : ''}`} onClick={() => setTab('scan')}>Scanner</button>
                <button className={`nav-btn ${tab === 'home' ? 'active' : ''}`} onClick={() => setTab('home')}>Home</button>
                <button className={`nav-btn ${tab === 'dash' ? 'active' : ''}`} onClick={() => setTab('dash')}>Dashboard</button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="container">
        {tab === 'scan' ? (
          <BusinessCard activeExhibition={activeExhibition} />
        ) : tab === 'home' ? (
          <Home setActiveExhibition={setActiveExhibition} setTab={setTab} />
        ) : (
          <Dashboard activeExhibition={activeExhibition} />
        )}
      </main>
      <footer className="footer">© {new Date().getFullYear()} BizCard</footer>
    </div>
  );
}

