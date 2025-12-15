import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiSave, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { getExhibitionChecklist, updateExhibitionChecklist } from '../services/api.js';

const STAND_FIELDS = [
  { name: 'standNumber', label: 'Stand Number', placeholder: 'e.g. A-12' },
  { name: 'standType', label: 'Type of Stand', placeholder: 'RAW SPACE / SHELL SPACE' },
  { name: 'dimensions', label: 'Dimensions (SQM) L x W', placeholder: 'e.g. 36 sqm (6m x 6m)' },
];

const CHECKLISTS = [
  { name: 'paymentChecklist', label: 'Payment Installments Checklist' },
  { name: 'badgeChecklist', label: 'Badges Submitted' },
  { name: 'posterChecklist', label: 'Exhibition Posters Ready' },
  { name: 'samplesDispatchChecklist', label: 'Samples Dispatch Confirmed' },
];

const EXHIBITOR_FIELDS = [
  { name: 'exhibitorName', label: 'Company Exhibitor – Name', placeholder: 'Primary attendee' },
  { name: 'exhibitorDesignation', label: 'Designation', placeholder: 'e.g. Technical Consultant' },
  { name: 'exhibitorEmail', label: 'Email ID', placeholder: 'name@company.com' },
  { name: 'exhibitorMobile', label: 'Mobile Number', placeholder: '+44 (0) 7444 045 025' },
];

const CONTRACTOR_FIELDS = [
  { name: 'contractorCompany', label: 'Stand Contractor – Company', placeholder: 'Design House Ltd.' },
  { name: 'contractorPerson', label: 'Contact Person', placeholder: 'Project Manager' },
  { name: 'contractorEmail', label: 'Email', placeholder: 'contact@design.com' },
  { name: 'contractorMobile', label: 'Mobile', placeholder: '+1 555 222 3333' },
  { name: 'contractorQuote', label: 'Final Quote', placeholder: 'USD 25,000' },
  { name: 'contractorAdvance', label: 'Advance Payment', placeholder: 'USD 10,000' },
  { name: 'contractorBalance', label: 'Balance Payment', placeholder: 'USD 15,000' },
];

const LOGISTICS_FIELDS = [
  { name: 'logisticsCompany', label: 'Logistics Company', placeholder: 'Transit Co.' },
  { name: 'logisticsContact', label: 'Contact Person', placeholder: 'Logistics Manager' },
  { name: 'logisticsEmail', label: 'Email ID', placeholder: 'logistics@example.com' },
  { name: 'logisticsMobile', label: 'Mobile', placeholder: '+971 4 123 4567' },
  { name: 'logisticsQuote', label: 'Final Quote', placeholder: 'USD 8,000' },
  { name: 'logisticsPayment', label: 'Payment Status', placeholder: 'Advance Paid / Due' },
  { name: 'logisticsAwb', label: 'AWB Number', placeholder: 'AWB123456789' },
  { name: 'logisticsSamples', label: 'Samples Status', placeholder: 'In Transit / Delivered' },
];

export default function ExhibitionForm() {
  const { id } = useParams();

  const initialState = {
    standNumber: '',
    standType: '',
    dimensions: '',
    perfInvoice: null,
    paymentProof: null,
    portalLink: '',
    portalId: '',
    portalPasscode: '',
    exhibitors: [{ name: '', designation: '', email: '', mobile: '' }], // Array of exhibitors
    badgeChecklist: false,
    accommodationDetails: '',
    ticketsDetails: '',
    accommodationChecklist: false,
    contractorCompany: '',
    contractorPerson: '',
    contractorEmail: '',
    contractorMobile: '',
    contractorQuote: '',
    contractorAdvance: '',
    contractorBalance: '',
    standDesign: null,
    posterChecklist: false,
    samplesPallet: '',
    samplesWeight: '',
    samplesDimensions: '',
    samplesPackingList: null,
    samplesDispatchChecklist: false,
    logisticsCompany: '',
    logisticsContact: '',
    logisticsEmail: '',
    logisticsMobile: '',
    logisticsQuote: '',
    logisticsPayment: '',
    logisticsAwb: '',
    logisticsSamples: '',
    paymentChecklist: false,
  };

  const [form, setForm] = useState(initialState);
  const [isEditing, setIsEditing] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load checklist data when component mounts or ID changes
  useEffect(() => {
    if (id) {
      loadChecklist();
    }
  }, [id]);

  const loadChecklist = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getExhibitionChecklist(id);
      if (res.success && res.data) {
        const data = res.data;
        setForm({
          standNumber: data.standNumber || '',
          standType: data.standType || '',
          dimensions: data.dimensions || '',
          perfInvoice: data.perfInvoice || null,
          paymentProof: data.paymentProof || null,
          portalLink: data.portalLink || '',
          portalId: data.portalId || '',
          portalPasscode: data.portalPasscode || '',
          exhibitors: data.exhibitors && Array.isArray(data.exhibitors) && data.exhibitors.length > 0
            ? data.exhibitors
            : (data.exhibitorName || data.exhibitorMobile
              ? [{ name: data.exhibitorName || '', designation: data.exhibitorDesignation || '', email: data.exhibitorEmail || '', mobile: data.exhibitorMobile || '' }]
              : [{ name: '', designation: '', email: '', mobile: '' }]),
          badgeChecklist: data.badgeChecklist || false,
          accommodationDetails: data.accommodationDetails || '',
          ticketsDetails: data.ticketsDetails || '',
          accommodationChecklist: data.accommodationChecklist || false,
          contractorCompany: data.contractorCompany || '',
          contractorPerson: data.contractorPerson || '',
          contractorEmail: data.contractorEmail || '',
          contractorMobile: data.contractorMobile || '',
          contractorQuote: data.contractorQuote || '',
          contractorAdvance: data.contractorAdvance || '',
          contractorBalance: data.contractorBalance || '',
          standDesign: data.standDesign || null,
          posterChecklist: data.posterChecklist || false,
          samplesPallet: data.samplesPallet || '',
          samplesWeight: data.samplesWeight || '',
          samplesDimensions: data.samplesDimensions || '',
          samplesPackingList: data.samplesPackingList || null,
          samplesDispatchChecklist: data.samplesDispatchChecklist || false,
          logisticsCompany: data.logisticsCompany || '',
          logisticsContact: data.logisticsContact || '',
          logisticsEmail: data.logisticsEmail || '',
          logisticsMobile: data.logisticsMobile || '',
          logisticsQuote: data.logisticsQuote || '',
          logisticsPayment: data.logisticsPayment || '',
          logisticsAwb: data.logisticsAwb || '',
          logisticsSamples: data.logisticsSamples || '',
          paymentChecklist: data.paymentChecklist || false,
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to load checklist data' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  const addExhibitor = () => {
    setForm(prev => ({
      ...prev,
      exhibitors: [...(prev.exhibitors || []), { name: '', designation: '', email: '', mobile: '' }]
    }));
  };

  const removeExhibitor = (index) => {
    if (form.exhibitors.length <= 1) {
      setMessage({ type: 'error', text: 'At least one exhibitor is required' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    setForm(prev => ({
      ...prev,
      exhibitors: prev.exhibitors.filter((_, i) => i !== index)
    }));
  };

  const updateExhibitor = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      exhibitors: prev.exhibitors.map((exhibitor, i) =>
        i === index ? { ...exhibitor, [field]: value } : exhibitor
      )
    }));
  };

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!id) {
      setMessage({ type: 'error', text: 'No exhibition ID found. Please access this form from an exhibition.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();

      // Add all text fields to FormData
      const textFields = [
        'standNumber', 'standType', 'dimensions', 'portalLink', 'portalId', 'portalPasscode',
        'accommodationDetails', 'ticketsDetails',
        'contractorCompany', 'contractorPerson', 'contractorEmail', 'contractorMobile',
        'contractorQuote', 'contractorAdvance', 'contractorBalance',
        'samplesPallet', 'samplesWeight', 'samplesDimensions',
        'logisticsCompany', 'logisticsContact', 'logisticsEmail', 'logisticsMobile',
        'logisticsQuote', 'logisticsPayment', 'logisticsAwb', 'logisticsSamples'
      ];

      textFields.forEach(key => {
        formData.append(key, form[key] || '');
      });

      // Add exhibitors array as JSON
      formData.append('exhibitors', JSON.stringify(form.exhibitors || []));

      // Add boolean fields
      const booleanFields = [
        'paymentChecklist', 'badgeChecklist', 'accommodationChecklist',
        'posterChecklist', 'samplesDispatchChecklist'
      ];
      booleanFields.forEach(key => {
        formData.append(key, form[key] ? 'true' : 'false');
      });

      // Handle file uploads - only append if it's a new File object
      if (form.perfInvoice instanceof File) {
        formData.append('perfInvoice', form.perfInvoice);
      }
      if (form.paymentProof instanceof File) {
        formData.append('paymentProof', form.paymentProof);
      }
      if (form.standDesign instanceof File) {
        formData.append('standDesign', form.standDesign);
      }
      if (form.samplesPackingList instanceof File) {
        formData.append('samplesPackingList', form.samplesPackingList);
      }

      const res = await updateExhibitionChecklist(id, formData);
      if (res.success) {
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Checklist saved successfully' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        // Reload to get updated data including base64 PDFs
        await loadChecklist();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to save checklist' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const hasPdf = (field) => {
    const value = form[field];
    return value && (value instanceof File || (typeof value === 'string' && value.startsWith('data:')));
  };

  const getPdfName = (field) => {
    const value = form[field];
    if (value instanceof File) return value.name;
    if (typeof value === 'string' && value.startsWith('data:')) {
      return field === 'perfInvoice' ? 'Performa Invoice (uploaded)' :
        field === 'paymentProof' ? 'Payment Proof (uploaded)' :
          field === 'standDesign' ? 'Stand Design (uploaded)' :
            field === 'samplesPackingList' ? 'Packing List (uploaded)' : 'PDF (uploaded)';
    }
    return null;
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loader" />
        <p className="muted" style={{ marginTop: '16px' }}>Loading checklist data...</p>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <div className="msg error">No exhibition ID provided. Please access this form from an exhibition.</div>
      </div>
    );
  }

  return (
    <div className="exhibition-form-page">
      <div className="exhibition-form-card">
        <header>
          <div>
            <p className="eyebrow">STANDARD CHECKLIST</p>
            <h1>Exhibition Workspace</h1>
            <p className="muted">
              Capture every detail required by operations, finance and logistics. Replace these sample fields with your final schema when ready.
            </p>
          </div>
          <div className="actions">
            <button className="btn" onClick={handleEdit} disabled={isEditing || saving}>
              <FiEdit2 /> Edit
            </button>
            <button className="btn primary" onClick={handleSave} disabled={!isEditing || saving}>
              <FiSave /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </header>
        {message.text && <div className={`msg ${message.type}`}>{message.text}</div>}

        <div className="form-section">
          <section className="form-block">
            <h2>Stand Details</h2>
            <p className="muted">Basic information for raw/shell stand reservations.</p>
            <div className="form-grid two-column">
              {STAND_FIELDS.map(field => (
                <div key={field.name} className="form-row">
                  <label>
                    {field.label} <span className="required">*</span>
                  </label>
                  <input
                    className="input"
                    placeholder={field.placeholder}
                    value={form[field.name]}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              ))}
            </div>
            <div className="form-row">
              <label>Performa Invoice (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                disabled={!isEditing}
                onChange={(e) => handleChange('perfInvoice', e.target.files?.[0] || null)}
              />
              {hasPdf('perfInvoice') && (
                <span className="muted" style={{ display: 'block', marginTop: '8px' }}>
                  {getPdfName('perfInvoice')}
                </span>
              )}
            </div>
            <div className="form-row">
              <label>Payment Proof / Installments (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                disabled={!isEditing}
                onChange={(e) => handleChange('paymentProof', e.target.files?.[0] || null)}
              />
              {hasPdf('paymentProof') && (
                <span className="muted" style={{ display: 'block', marginTop: '8px' }}>
                  {getPdfName('paymentProof')}
                </span>
              )}
            </div>
            <div className="checkbox-grid three-column">
              {CHECKLISTS.map(item => (
                <label key={item.name} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={!!form[item.name]}
                    disabled={!isEditing}
                    onChange={(e) => handleChange(item.name, e.target.checked)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </section>

          <section className="form-block">
            <h2>Exhibition Portal</h2>
            <p className="muted">Login credentials provided by the organiser.</p>
            <div className="form-row">
              <label>Portal Link</label>
              <input
                className="input"
                placeholder="https://portal.example.com"
                value={form.portalLink}
                onChange={(e) => handleChange('portalLink', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="form-row">
              <label>Portal ID</label>
              <input
                className="input"
                placeholder="username / exhibitor id"
                value={form.portalId}
                onChange={(e) => handleChange('portalId', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="form-row">
              <label>Portal Passcode</label>
              <input
                className="input"
                placeholder="••••••••"
                value={form.portalPasscode}
                onChange={(e) => handleChange('portalPasscode', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </section>

          <section className="form-block">
            <div className="exhibitor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2>Company Exhibitors</h2>
                <p className="muted">At least one exhibitor is mandatory. You can add multiple exhibitors.</p>
              </div>
              {isEditing && (
                <button
                  type="button"
                  className="btn"
                  onClick={addExhibitor}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FiPlus /> Add Exhibitor
                </button>
              )}
            </div>
            {(form.exhibitors || []).map((exhibitor, index) => (
              <div key={index} className="exhibitor-block" style={{
                border: '1px solid rgba(96,165,250,0.2)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                background: 'rgba(96,165,250,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#e0e0e0' }}>Exhibitor {index + 1}</h3>
                  {isEditing && form.exhibitors.length > 1 && (
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => removeExhibitor(index)}
                      style={{ padding: '6px 12px', height: 'auto' }}
                    >
                      <FiTrash2 /> Remove
                    </button>
                  )}
                </div>
                <div className="form-grid two-column">
                  <div className="form-row">
                    <label>
                      Name <span className="required">*</span>
                    </label>
                    <input
                      className="input"
                      placeholder="Primary attendee"
                      value={exhibitor.name || ''}
                      onChange={(e) => updateExhibitor(index, 'name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-row">
                    <label>Designation</label>
                    <input
                      className="input"
                      placeholder="e.g. Technical Consultant"
                      value={exhibitor.designation || ''}
                      onChange={(e) => updateExhibitor(index, 'designation', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-row">
                    <label>Email ID</label>
                    <input
                      className="input"
                      placeholder="name@company.com"
                      value={exhibitor.email || ''}
                      onChange={(e) => updateExhibitor(index, 'email', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-row">
                    <label>
                      Mobile Number <span className="required">*</span>
                    </label>
                    <input
                      className="input"
                      placeholder="+44 (0) 7444 045 025"
                      value={exhibitor.mobile || ''}
                      onChange={(e) => updateExhibitor(index, 'mobile', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            ))}
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={!!form.badgeChecklist}
                onChange={(e) => handleChange('badgeChecklist', e.target.checked)}
                disabled={!isEditing}
              />
              Exhibitor badges submitted (checklist)
            </label>
            <div className="form-row">
              <label>Accommodation & Tickets</label>
              <textarea
                className="input multiline"
                placeholder="Hotel name, booking reference, ticket numbers"
                value={form.accommodationDetails}
                onChange={(e) => handleChange('accommodationDetails', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="form-row">
              <label>Tickets / Travel Notes</label>
              <textarea
                className="input multiline"
                placeholder="Flight numbers, check-in info"
                value={form.ticketsDetails}
                onChange={(e) => handleChange('ticketsDetails', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </section>

          <section className="form-block">
            <h2>Stand Contractor</h2>
            <div className="form-grid two-column">
              {CONTRACTOR_FIELDS.map(field => (
                <div key={field.name} className="form-row">
                  <label>{field.label}</label>
                  <input
                    className="input"
                    placeholder={field.placeholder}
                    value={form[field.name]}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              ))}
            </div>
            <div className="form-row">
              <label>Stand Design (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                disabled={!isEditing}
                onChange={(e) => handleChange('standDesign', e.target.files?.[0] || null)}
              />
              {hasPdf('standDesign') && (
                <span className="muted" style={{ display: 'block', marginTop: '8px' }}>
                  {getPdfName('standDesign')}
                </span>
              )}
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={!!form.posterChecklist}
                onChange={(e) => handleChange('posterChecklist', e.target.checked)}
                disabled={!isEditing}
              />
              Exhibition posters ready (checklist)
            </label>
          </section>

          <section className="form-block">
            <h2>Samples & Logistics</h2>
            <div className="form-grid three-column">
              <div className="form-row">
                <label>Dispatch Pallet / Box</label>
                <input
                  className="input"
                  placeholder="Pallet A / Box 1"
                  value={form.samplesPallet}
                  onChange={(e) => handleChange('samplesPallet', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-row">
                <label>Weight</label>
                <input
                  className="input"
                  placeholder="150 kg"
                  value={form.samplesWeight}
                  onChange={(e) => handleChange('samplesWeight', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-row">
                <label>Dimensions</label>
                <input
                  className="input"
                  placeholder="1m x 0.8m x 1.2m"
                  value={form.samplesDimensions}
                  onChange={(e) => handleChange('samplesDimensions', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="form-row">
              <label>Packaging List (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                disabled={!isEditing}
                onChange={(e) => handleChange('samplesPackingList', e.target.files?.[0] || null)}
              />
              {hasPdf('samplesPackingList') && (
                <span className="muted" style={{ display: 'block', marginTop: '8px' }}>
                  {getPdfName('samplesPackingList')}
                </span>
              )}
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={!!form.samplesDispatchChecklist}
                onChange={(e) => handleChange('samplesDispatchChecklist', e.target.checked)}
                disabled={!isEditing}
              />
              Samples dispatch confirmed
            </label>

            <div className="form-grid two-column">
              {LOGISTICS_FIELDS.map(field => (
                <div key={field.name} className="form-row">
                  <label>{field.label}</label>
                  <input
                    className="input"
                    placeholder={field.placeholder}
                    value={form[field.name]}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

