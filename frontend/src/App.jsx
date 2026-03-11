import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import './index.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const API_KEY = process.env.REACT_APP_API_KEY || '';

const ACCEPTED_TYPES = [
  'text/csv',
  'application/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

function App() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [rowsProcessed, setRowsProcessed] = useState(null);
  const fileInputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setStatus('error');
      setMessage('Only .csv and .xlsx files are accepted.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setStatus('error');
      setMessage('File size must be under 5MB.');
      return;
    }
    setFile(f);
    setStatus('idle');
    setMessage('');
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setMessage('Please select a file.');
    if (!email) return setMessage('Please enter a recipient email.');

    setStatus('loading');
    setMessage('');
    setRowsProcessed(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', email);

    try {
      const { data } = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
        },
      });
      setStatus('success');
      setMessage(data.message);
      setRowsProcessed(data.rowsProcessed);
      setFile(null);
    } catch (err) {
      setStatus('error');
      setMessage(
        err.response?.data?.error || 'Something went wrong. Please try again.'
      );
    }
  };

  const reset = () => {
    setFile(null);
    setEmail('');
    setStatus('idle');
    setMessage('');
    setRowsProcessed(null);
  };

  return (
    <div className="app">
      {/* Background grid */}
      <div className="bg-grid" aria-hidden="true" />

      <header className="header">
        <div className="logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">Rabbitt<em>AI</em></span>
        </div>
        <a
          href={`${API_URL}/api-docs`}
          target="_blank"
          rel="noreferrer"
          className="docs-link"
        >
          API Docs →
        </a>
      </header>

      <main className="main">
        <section className="hero">
          <p className="hero-eyebrow">Q1 2026 · Sales Intelligence</p>
          <h1 className="hero-title">
            Turn raw data into<br />
            <em>executive insights.</em>
          </h1>
          <p className="hero-sub">
            Upload a CSV or XLSX file. Our AI parses it, writes a professional
            brief, and sends it straight to any inbox — in seconds.
          </p>
        </section>

        {status === 'success' ? (
          <div className="card success-card">
            <div className="success-icon">✓</div>
            <h2>Brief Sent</h2>
            <p className="success-msg">{message}</p>
            {rowsProcessed && (
              <p className="rows-tag">{rowsProcessed} rows analysed</p>
            )}
            <button className="btn btn-secondary" onClick={reset}>
              Analyse another file
            </button>
          </div>
        ) : (
          <form className="card form-card" onSubmit={onSubmit} noValidate>
            {/* Drop zone */}
            <div
              className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current.click()}
              aria-label="Upload file"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                hidden
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {file ? (
                <div className="file-selected">
                  <span className="file-icon">📄</span>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    className="remove-file"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    aria-label="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="drop-prompt">
                  <span className="drop-icon">↑</span>
                  <p>Drop your file here or <strong>click to browse</strong></p>
                  <p className="drop-hint">.csv or .xlsx · max 5 MB</p>
                </div>
              )}
            </div>

            {/* Email input */}
            <div className="field">
              <label htmlFor="email">Recipient Email</label>
              <input
                id="email"
                type="email"
                placeholder="cto@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Error message */}
            {status === 'error' && message && (
              <div className="alert alert-error" role="alert">
                ⚠ {message}
              </div>
            )}

            {/* Submit */}
            <button
              className={`btn btn-primary ${status === 'loading' ? 'loading' : ''}`}
              type="submit"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <>
                  <span className="spinner" /> Generating brief…
                </>
              ) : (
                'Generate & Send Brief'
              )}
            </button>
          </form>
        )}

        {/* Steps */}
        <div className="steps">
          {[
            { n: '01', label: 'Upload', desc: 'Drop in your CSV or XLSX sales export.' },
            { n: '02', label: 'Analyse', desc: 'Gemini AI reads every row and extracts insights.' },
            { n: '03', label: 'Deliver', desc: 'A polished HTML brief lands in the inbox.' },
          ].map((s) => (
            <div className="step" key={s.n}>
              <span className="step-n">{s.n}</span>
              <strong>{s.label}</strong>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="footer">
        <span>© 2026 Rabbitt AI · Sales Insight Automator</span>
      </footer>
    </div>
  );
}

export default App;
