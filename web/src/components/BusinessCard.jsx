import { useEffect, useRef, useState } from 'react';
import { saveCardEntry, extractOcr } from '../services/api.js';
import { FiUpload, FiImage, FiMic, FiStopCircle, FiTrash2 } from 'react-icons/fi';

const FORM_FIELDS = ['name', 'email', 'phone', 'address', 'website', 'company'];
const DEFAULT_FIELDS = FORM_FIELDS.reduce((acc, field) => ({ ...acc, [field]: '' }), { extras: {} });

export default function BusinessCard({ activeExhibition }) {
  const [imageFile, setImageFile] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [fields, setFields] = useState({ ...DEFAULT_FIELDS });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState({ ocr: false, save: false });
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const isLive = activeExhibition && activeExhibition.isLive;

  useEffect(() => {
    if (activeExhibition && !isLive) {
      showMessage('This exhibition is not live. You can view cards in the dashboard.', 'info');
    }
  }, [activeExhibition, isLive]);

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    window.clearTimeout(showMessage._t);
    showMessage._t = window.setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const onPickImage = async (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setImageFile(f);
      if (!fields || Object.keys(fields).length === 0) setFields({ ...DEFAULT_FIELDS });
      // Auto-run OCR on upload
      try {
        setLoading((s) => ({ ...s, ocr: true }));
        const result = await extractOcr(f);
        if (result?.success && result.fields) {
          setFields(prev => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(result.fields).filter(([_, val]) => typeof val === "string" && val.trim() !== "")
            )
          }));

          showMessage('OCR extracted successfully', 'success');
        }
      } catch (e1) {
        showMessage('OCR failed to auto-extract', 'error');
      } finally {
        setLoading((s) => ({ ...s, ocr: false }));
      }
    }
  };

  const onRecord = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        showMessage('Audio recording not supported in this browser', 'error');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data && e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setIsRecording(false);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch (e) {
      showMessage(`Cannot start recording: ${e.message}`, 'error');
    }
  };

  const onStop = () => {
    try {
      mediaRecorderRef.current?.stop();
    } catch (e) {
      showMessage('Failed to stop recording', 'error');
    }
  };

  const onDeleteAudio = () => setAudioBlob(null);

  const handleChange = (key, value) => setFields((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      setLoading((s) => ({ ...s, save: true }));
      const result = await saveCardEntry(imageFile, audioBlob, fields, activeExhibition?._id ?? null, activeExhibition?.createdBy ?? '');
      if (result?.success) {
        showMessage('Card saved successfully!', 'success');
        setFields({ ...DEFAULT_FIELDS });
        setImageFile(null);
        setAudioBlob(null);
      } else {
        showMessage(result?.message || 'Failed to save card', 'error');
      }
    } catch (e) {
      showMessage(e.message || 'Save failed', 'error');
    } finally {
      setLoading((s) => ({ ...s, save: false }));
    }
  };


  const audioUrl = audioBlob ? URL.createObjectURL(audioBlob) : '';
  const imageUrl = imageFile ? URL.createObjectURL(imageFile) : '';

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); if (imageUrl) URL.revokeObjectURL(imageUrl); }, [audioUrl, imageUrl]);

  return (
    <div className="card-page">
      {activeExhibition ? (
        <div style={{ marginBottom: 12 }}>
          <strong>Active Exhibition:</strong> {activeExhibition.name} (Date: {new Date(activeExhibition.startTime).toLocaleDateString()})
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <em>No active exhibition selected. Save will create a standalone card.</em>
        </div>
      )}
      {message.text && (
        <div className={`msg ${message.type}`}>{message.text}</div>
      )}

      {(loading.ocr || loading.save) && <div className="loader" aria-busy="true" />}

      {!imageFile && (
        <label className="upload-box">
          <input type="file" accept="image/*" onChange={onPickImage} hidden />
          <div className="upload-icon" aria-hidden><FiUpload size={42} /></div>
          <div className="upload-text">Tap to upload business card image</div>
          <div className="upload-sub">or use camera to take photo</div>
        </label>
      )}

      <div className="actions">
        <label className="btn">
          <input type="file" accept="image/*" capture="environment" onChange={onPickImage} hidden />
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <FiImage /> Upload
          </span>
        </label>

        {!isRecording ? (
          <button className="btn" onClick={onRecord}>
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <FiMic /> Record
            </span>
          </button>
        ) : (
          <button className="btn danger" onClick={onStop}>
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <FiStopCircle /> Stop
            </span>
          </button>
        )}

        {/* <button className="btn" onClick={handleOcr} disabled={!imageFile}>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <FiCpu /> OCR
          </span>
        </button> */}
      </div>

      {isRecording && (
        <div className="waveform" aria-live="polite">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="wave" style={{ height: `${30 + (i % 5) * 6}px` }} />
          ))}
        </div>
      )}

      {audioBlob && (
        <div className="audio-box">
          <div className="audio-title">Audio Recording</div>
          <div className="audio-controls">
            <audio controls src={audioUrl} />
            <button className="btn danger" onClick={onDeleteAudio}>
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <FiTrash2 /> Delete
              </span>
            </button>
          </div>
        </div>
      )}

      {imageFile && (
        <img className="preview" alt="preview" src={imageUrl} />
      )}

      <div className="table">
        {FORM_FIELDS.map((field) => (
          <div className="row" key={field}>
            <label className="label" htmlFor={`f-${field}`}>{field}</label>
            <input
              id={`f-${field}`}
              className="input"
              placeholder={`Enter ${field}`}
              value={fields[field] || ''}
              onChange={(e) => handleChange(field, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="primary" onClick={handleSave} disabled={loading.save || (activeExhibition && !isLive)}>Save Card</button>
    </div>
  );
}


