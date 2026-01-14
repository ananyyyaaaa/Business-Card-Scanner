import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiSave, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { getExhibitionChecklist, updateExhibitionChecklist, getAllUsers } from '../services/api.js';

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
  { name: 'logisticsAwb', label: 'Tracking Number', placeholder: 'AWB123456789' },
  { name: 'logisticsSamples', label: 'Samples Status', placeholder: 'In Transit / Delivered' },
];

export default function ExhibitionForm() {
  const { id } = useParams();

  const initialState = {
    standNumber: '',
    standType: '',
    dimensions: '',
    perfInvoice: null,
    totalPayment: 0,
    deposits: [], // [{ amount: number, payslip: File | string }]
    portalLink: '',
    portalId: '',
    portalPasscode: '',
    exhibitors: [{ name: '', designation: '', email: '', mobile: '' }], // Array of exhibitors
    badgeChecklist: false,
    accommodationDetails: '',
    ticketsDetails: '',
    tickets: [], // [{ file: File | string }]
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
    samplesPallet: '', // Legacy, kept for backward compat if needed or removed
    samplesWeight: '',
    samplesDimensions: '',
    pallets: [{ name: '', weight: '', dimensions: '' }],
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
    remarks: '',
    insuranceChecklist: false,
    insuranceFile: null,
  };

  const [form, setForm] = useState(initialState);
  const [isEditing, setIsEditing] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    getAllUsers().then(res => {
      if (res.success) setAvailableUsers(res.data);
    }).catch(err => console.error('Failed to load users', err));
  }, []);

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
          totalPayment: data.totalPayment || 0,
          deposits: data.deposits || [],
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
          tickets: data.tickets || [],
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
          pallets: (data.pallets && data.pallets.length > 0)
            ? data.pallets
            : (data.samplesPallet || data.samplesWeight || data.samplesDimensions)
              ? [{ name: data.samplesPallet || '', weight: data.samplesWeight || '', dimensions: data.samplesDimensions || '' }]
              : [{ name: '', weight: '', dimensions: '' }],
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
          remarks: data.remarks || '',
          insuranceChecklist: data.insuranceChecklist || false,
          insuranceFile: data.insuranceFile || null,
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

  const handleUserSelect = (index, userId) => {
    const user = availableUsers.find(u => u._id === userId);
    if (user) {
      setForm(prev => ({
        ...prev,
        exhibitors: prev.exhibitors.map((ex, i) =>
          i === index ? {
            ...ex,
            name: user.name,
            email: user.email,
            designation: user.designation || '',
            mobile: user.phoneNumber || ''
          } : ex
        )
      }));
    }
  };

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (field, e) => {
    const file = e.target.files?.[0];
    if (!file) {
      handleChange(field, null);
      return;
    }

    if (file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: 'Only PDF files are allowed.' });
      e.target.value = ''; // Reset input
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size > MAX_SIZE) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB.' });
      e.target.value = ''; // Reset input
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    handleChange(field, file);
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
        'logisticsQuote', 'logisticsPayment', 'logisticsAwb', 'logisticsSamples',
        'remarks', 'totalPayment'
      ];

      textFields.forEach(key => {
        formData.append(key, form[key] || '');
      });

      // Add exhibitors array as JSON
      formData.append('exhibitors', JSON.stringify(form.exhibitors || []));

      // Add boolean fields
      const booleanFields = [
        'paymentChecklist', 'badgeChecklist', 'accommodationChecklist',
        'posterChecklist', 'samplesDispatchChecklist', 'insuranceChecklist'
      ];
      booleanFields.forEach(key => {
        formData.append(key, form[key] ? 'true' : 'false');
      });

      // Handle file uploads - only append if it's a new File object
      if (form.perfInvoice instanceof File) {
        formData.append('perfInvoice', form.perfInvoice);
      }

      // Handle deposits array
      const depositMetadata = (form.deposits || []).map(dep => ({
        amount: dep.amount,
        payslip: (dep.payslip instanceof File) ? "" : dep.payslip
      }));
      formData.append('deposits', JSON.stringify(depositMetadata));

      (form.deposits || []).forEach(dep => {
        if (dep.payslip instanceof File) {
          formData.append('payslip', dep.payslip);
        }
      });

      // Handle tickets array
      const ticketMetadata = (form.tickets || []).map(t => ({
        file: (t.file instanceof File) ? "" : t.file
      }));
      formData.append('tickets', JSON.stringify(ticketMetadata));

      (form.tickets || []).forEach(t => {
        if (t.file instanceof File) {
          formData.append('ticketFile', t.file);
        }
      });

      // Handle pallets array
      formData.append('pallets', JSON.stringify(form.pallets || []));

      if (form.standDesign instanceof File) {
        formData.append('standDesign', form.standDesign);
      }
      if (form.samplesPackingList instanceof File) {
        formData.append('samplesPackingList', form.samplesPackingList);
      }
      if (form.insuranceFile instanceof File) {
        formData.append('insuranceFile', form.insuranceFile);
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
            field === 'samplesPackingList' ? 'Packing List (uploaded)' :
              field === 'insuranceFile' ? 'Insurance File (uploaded)' : 'PDF (uploaded)';
    }
    return null;
  };

  const getMultiPdfName = (value, index) => {
    if (value instanceof File) return value.name;
    if (typeof value === 'string' && value.startsWith('data:')) {
      return `Payslip ${index + 1} (uploaded)`;
    }
    return 'PDF (uploaded)';
  };

  const totalDeposited = (form.deposits || []).reduce((sum, dep) => sum + Number(dep.amount || 0), 0);
  const remainingBalance = Math.max(0, (form.totalPayment || 0) - totalDeposited);
  const isPaymentComplete = (form.totalPayment || 0) > 0 && totalDeposited >= form.totalPayment;

  const addDeposit = () => {
    setForm(prev => ({
      ...prev,
      deposits: [...(prev.deposits || []), { amount: '', payslip: null }]
    }));
  };

  const updateDeposit = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      deposits: prev.deposits.map((dep, i) => i === idx ? { ...dep, [field]: value } : dep)
    }));
  };

  const handleDepositFile = (idx, e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      updateDeposit(idx, 'payslip', file);
    } else if (file) {
      setMessage({ type: 'error', text: 'Only PDF files are allowed' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      e.target.value = '';
    }
  };

  const removeDeposit = (idx) => {
    setForm(prev => ({
      ...prev,
      deposits: prev.deposits.filter((_, i) => i !== idx)
    }));
  };

  const addTicket = () => {
    setForm(prev => ({
      ...prev,
      tickets: [...(prev.tickets || []), { file: null }]
    }));
  };

  const removeTicket = (idx) => {
    setForm(prev => ({
      ...prev,
      tickets: prev.tickets.filter((_, i) => i !== idx)
    }));
  };

  const handleTicketFile = (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Only PDF and JPEG files are allowed' });
      e.target.value = '';
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_SIZE) {
      setMessage({ type: 'error', text: 'File size must be less than 100MB' });
      e.target.value = '';
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setForm(prev => ({
      ...prev,
      tickets: prev.tickets.map((t, i) => i === idx ? { ...t, file: file } : t)
    }));
  };

  const getTicketFileName = (value, index) => {
    if (value instanceof File) return value.name;
    if (typeof value === 'string' && value.startsWith('data:')) {
      return `Ticket ${index + 1} (uploaded)`;
    }
    return 'Ticket (uploaded)';
  };

  const addPallet = () => {
    setForm(prev => ({
      ...prev,
      pallets: [...(prev.pallets || []), { name: '', weight: '', dimensions: '' }]
    }));
  };

  const removePallet = (index) => {
    if (form.pallets.length <= 1) {
      // Optional: clear the last one instead of removing if you want to enforce at least one
      updatePallet(index, 'name', '');
      updatePallet(index, 'weight', '');
      updatePallet(index, 'dimensions', '');
      return;
    }
    setForm(prev => ({
      ...prev,
      pallets: prev.pallets.filter((_, i) => i !== index)
    }));
  };

  const updatePallet = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      pallets: prev.pallets.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
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
                onChange={(e) => handleFileChange('perfInvoice', e)}
              />
              {hasPdf('perfInvoice') && (
                <span className="muted" style={{ display: 'block', marginTop: '8px' }}>
                  {getPdfName('perfInvoice')}
                </span>
              )}
            </div>
            <div className="form-row">
              <label>Total Exhibition Payment (Currency)</label>
              <input
                type="number"
                className="input"
                placeholder="e.g. 10000"
                value={form.totalPayment}
                onChange={(e) => handleChange('totalPayment', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="payment-tracker" style={{
              marginTop: '24px',
              padding: '20px',
              background: 'rgba(58, 34, 114, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(58, 34, 114, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#333333' }}>Payment Deposits Tracker</h3>
                {isPaymentComplete && (
                  <span className="pill pill-live" style={{ padding: '4px 12px', fontSize: '11px', fontWeight: 'bold' }}>
                    PAYMENT COMPLETED
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e0e6ed' }}>
                  <div style={{ fontSize: '12px', color: '#8094AE', textTransform: 'uppercase', marginBottom: '4px' }}>Total Deposited</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#364A63' }}>{totalDeposited.toLocaleString()}</div>
                </div>
                <div style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e0e6ed' }}>
                  <div style={{ fontSize: '12px', color: '#8094AE', textTransform: 'uppercase', marginBottom: '4px' }}>Remaining Balance</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: remainingBalance > 0 ? '#ef4444' : '#10b981' }}>{remainingBalance.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(form.deposits || []).map((dep, idx) => (
                  <div key={idx} style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(120px, 1fr) 2fr auto',
                    gap: '12px',
                    alignItems: 'end',
                    padding: '12px',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e0e6ed'
                  }}>
                    <div>
                      <label style={{ fontSize: '11px', marginBottom: '4px' }}>Amount</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="0.00"
                        value={dep.amount}
                        disabled={!isEditing}
                        onChange={(e) => updateDeposit(idx, 'amount', e.target.value)}
                        style={{ height: '36px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', marginBottom: '4px' }}>Payslip (PDF)</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        disabled={!isEditing}
                        onChange={(e) => handleDepositFile(idx, e)}
                        style={{ fontSize: '12px' }}
                      />
                      {dep.payslip && (
                        <div style={{ fontSize: '11px', color: '#8094AE', marginTop: '4px' }}>
                          {getMultiPdfName(dep.payslip, idx)}
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <button
                        className="btn danger"
                        onClick={() => removeDeposit(idx)}
                        style={{ padding: '0 12px', height: '36px' }}
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {isEditing && !isPaymentComplete && (
                <button
                  className="btn"
                  onClick={addDeposit}
                  style={{ marginTop: '16px', width: '100%', borderStyle: 'dashed' }}
                >
                  <FiPlus /> Add Next Deposit
                </button>
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
            <div className="form-row" style={{ marginTop: '20px' }}>
              <label className="checkbox-row" style={{ fontWeight: '600' }}>
                <input
                  type="checkbox"
                  checked={!!form.insuranceChecklist}
                  disabled={!isEditing}
                  onChange={(e) => handleChange('insuranceChecklist', e.target.checked)}
                />
                Insurance Taken?
              </label>
              {form.insuranceChecklist && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(96,165,250,0.05)', borderRadius: '8px', border: '1px dashed rgba(96,165,250,0.2)' }}>
                  <label style={{ display: 'block', marginBottom: '8px' }}>Upload Insurance Document (PDF)</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    disabled={!isEditing}
                    onChange={(e) => handleFileChange('insuranceFile', e)}
                  />
                  {hasPdf('insuranceFile') && (
                    <span className="muted" style={{ display: 'block', marginTop: '8px', fontSize: '13px' }}>
                      {getPdfName('insuranceFile')}
                    </span>
                  )}
                </div>
              )}
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
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#364a63' }}>Exhibitor {index + 1}</h3>
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
                {isEditing && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: '#666' }}>Select User to Autofill</label>
                    <select
                      className="input"
                      onChange={(e) => handleUserSelect(index, e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>Select a user to autofill...</option>
                      {availableUsers.map(u => (
                        <option key={u._id} value={u._id}>
                          {u.name} {u.designation ? `(${u.designation})` : ''} - {u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-grid two-column">
                  <div className="form-row">
                    <label>
                      Name <span className="required">*</span>
                    </label>
                    <input
                      className="input-exhibitor"
                      placeholder="Primary attendee"
                      value={exhibitor.name || ''}
                      onChange={(e) => updateExhibitor(index, 'name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-row">
                    <label>Designation</label>
                    <input
                      className="input-exhibitor"
                      placeholder="e.g. Technical Consultant"
                      value={exhibitor.designation || ''}
                      onChange={(e) => updateExhibitor(index, 'designation', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-row">
                    <label>Email ID</label>
                    <input
                      className="input-exhibitor"
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
                      className="input-exhibitor"
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
            <div className="form-row">
              <label>Uploaded Tickets (PDF/JPEG)</label>
              {(form.tickets || []).map((ticket, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                  padding: '12px',
                  background: 'rgba(96,165,250,0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(96,165,250,0.2)'
                }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/jpg"
                      disabled={!isEditing}
                      onChange={(e) => handleTicketFile(idx, e)}
                    />
                    {ticket.file && (
                      <span className="muted" style={{ display: 'block', marginTop: '4px', fontSize: '12px' }}>
                        {getTicketFileName(ticket.file, idx)}
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      className="btn danger"
                      onClick={() => removeTicket(idx)}
                      style={{ padding: '0 12px', height: '36px' }}
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              ))}
              {isEditing && (
                <button
                  type="button"
                  className="btn"
                  onClick={addTicket}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                >
                  <FiPlus /> Add Ticket
                </button>
              )}
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
                onChange={(e) => handleFileChange('standDesign', e)}
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
            <p style={{ color: '#36cbc0' }}>Samples & Logistics</p>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ color: '#36cbc0' }}>Dispatch Pallets / Boxes</label>
                {isEditing && (
                  <button type="button" className="btn" onClick={addPallet} style={{ fontSize: '12px', padding: '4px 8px' }}>
                    <FiPlus /> Add Pallet
                  </button>
                )}
              </div>
              {(form.pallets || []).map((pallet, index) => (
                <div key={index} className="form-grid three-column" style={{
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: index < (form.pallets || []).length - 1 ? '1px dashed #eee' : 'none'
                }}>
                  <div className="form-row">
                    <label style={{ fontSize: '12px', color: '#666' }}>Name / ID</label>
                    <input
                      className="input"
                      placeholder="Pallet A / Box 1"
                      value={pallet.name}
                      onChange={(e) => updatePallet(index, 'name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-row">
                    <label style={{ fontSize: '12px', color: '#666' }}>Weight</label>
                    <input
                      className="input"
                      placeholder="150 kg"
                      value={pallet.weight}
                      onChange={(e) => updatePallet(index, 'weight', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-row">
                    <label style={{ fontSize: '12px', color: '#666' }}>Dimensions</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        className="input"
                        placeholder="L x W x H"
                        value={pallet.dimensions}
                        onChange={(e) => updatePallet(index, 'dimensions', e.target.value)}
                        disabled={!isEditing}
                      />
                      {isEditing && (form.pallets || []).length > 1 && (
                        <button
                          className="btn danger"
                          onClick={() => removePallet(index)}
                          style={{ padding: '0 8px' }}
                          title="Remove Pallet"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="form-row">
              <label>Packaging List (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                disabled={!isEditing}
                onChange={(e) => handleFileChange('samplesPackingList', e)}
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

          <section className="form-block">
            <h2>Additional Remarks</h2>
            <div className="form-row">
              <label>Remarks</label>
              <textarea
                className="input multiline"
                placeholder="Add any additional notes or internal remarks here..."
                value={form.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                disabled={!isEditing}
                style={{ minHeight: '120px' }}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


