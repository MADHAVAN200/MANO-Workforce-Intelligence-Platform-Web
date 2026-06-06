import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  FileText, Sparkles, Plus, Search, Filter, Printer, Trash2, 
  ArrowLeft, Download, Check, Users, FileCheck, Building, 
  Calendar, CreditCard, ChevronRight, CheckCircle2, RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';

// Baseline Mock Data for Document Catalog
const BASELINE_DOCUMENTS = [
  {
    id: 'DOC-2026-001',
    title: 'Offer Letter - Rahul Sharma',
    doc_type: 'offer_letter',
    recipient_name: 'Rahul Sharma',
    recipient_email: 'rahul.sharma@example.com',
    created_at: '2026-06-02T10:30:00.000Z',
    created_by: 'HR Manager',
    meta_data: {
      designation: 'React Developer',
      joining_date: '2026-07-01',
      ctc: '9',
      probation: '3',
      ref_no: 'MANO/HR/OL/2026/061'
    }
  },
  {
    id: 'DOC-2026-002',
    title: 'Attendance & Late Attendance Policy',
    doc_type: 'policy',
    recipient_name: 'All Employees',
    recipient_email: null,
    created_at: '2026-06-03T14:45:00.000Z',
    created_by: 'HR Director',
    meta_data: {
      category: 'Attendance & Hours',
      effective_date: '2026-06-15',
      content: 'This policy governs the office hours, late-in grace period (15 minutes), and late-mark salary deductions. All employees are expected to clock in before 9:30 AM. Repeated late marks (>3 per month) will trigger review.'
    }
  },
  {
    id: 'DOC-2026-003',
    title: 'Employment Contract - Amit Verma',
    doc_type: 'contract',
    recipient_name: 'Amit Verma',
    recipient_email: 'amit.verma@example.com',
    created_at: '2026-06-04T09:15:00.000Z',
    created_by: 'HR Manager',
    meta_data: {
      designation: 'Node.js Engineer',
      agreement_date: '2026-06-02',
      duration: 'Permanent',
      working_hours: '40 hours per week',
      remuneration: '16'
    }
  },
  {
    id: 'DOC-2026-004',
    title: 'Annual Appraisal - Priya Nair',
    doc_type: 'appraisal',
    recipient_name: 'Priya Nair',
    recipient_email: 'priya.nair@example.com',
    created_at: '2026-06-05T16:00:00.000Z',
    created_by: 'HR Director',
    meta_data: {
      designation: 'Senior QA Engineer',
      rating: '5',
      current_ctc: '11',
      revised_ctc: '13.5',
      effective_date: '2026-07-01'
    }
  }
];

// Mock Employee List for autocomplete
const SYSTEM_EMPLOYEES = [
  { name: 'Rahul Sharma', email: 'rahul.sharma@example.com', designation: 'React Developer', ctc: '6.5' },
  { name: 'Sneha Patel', email: 'sneha.patel@example.com', designation: 'React Developer', ctc: '5.0' },
  { name: 'Amit Verma', email: 'amit.verma@example.com', designation: 'Node.js Engineer', ctc: '12.0' },
  { name: 'Priya Nair', email: 'priya.nair@example.com', designation: 'Senior QA Engineer', ctc: '11.0' },
  { name: 'Vikram Malhotra', email: 'vikram.m@example.com', designation: 'Product Manager', ctc: '18.0' },
  { name: 'Neha Gupta', email: 'neha.gupta@example.com', designation: 'UI/UX Designer', ctc: '8.0' }
];

const DocumentGenerator = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'create'
  const [documents, setDocuments] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null); // 'offer_letter', 'policy', 'contract', 'appraisal' or null
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDocumentForPrint, setSelectedDocumentForPrint] = useState(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_email: '',
    designation: '',
    joining_date: '',
    ctc: '',
    probation: '3',
    category: 'General',
    effective_date: '',
    content: '',
    agreement_date: '',
    duration: 'Permanent',
    working_hours: '40 hours per week',
    remuneration: '',
    rating: '5',
    current_ctc: '',
    revised_ctc: '',
    ref_no: ''
  });

  // Load from localStorage
  useEffect(() => {
    const storedDocs = localStorage.getItem('mano_hr_documents');
    if (storedDocs) {
      try {
        setDocuments(JSON.parse(storedDocs));
      } catch (e) {
        console.error("Error parsing stored documents:", e);
        setDocuments(BASELINE_DOCUMENTS);
      }
    } else {
      localStorage.setItem('mano_hr_documents', JSON.stringify(BASELINE_DOCUMENTS));
      setDocuments(BASELINE_DOCUMENTS);
    }
  }, []);

  // Update localStorage
  const saveDocuments = (updatedList) => {
    setDocuments(updatedList);
    localStorage.setItem('mano_hr_documents', JSON.stringify(updatedList));
  };

  // Autocomplete when picking employee
  const handleEmployeeSelect = (employee) => {
    setFormData(prev => ({
      ...prev,
      recipient_name: employee.name,
      recipient_email: employee.email,
      designation: employee.designation,
      current_ctc: employee.ctc,
      ctc: (parseFloat(employee.ctc) * 1.25).toFixed(1) // Default to 25% hike for offer letter
    }));
    toast.info(`Pre-filled fields for ${employee.name}`);
  };

  // Auto reference number generator
  useEffect(() => {
    if (selectedTemplate) {
      const date = new Date();
      const code = Math.floor(100 + Math.random() * 900);
      const prefix = selectedTemplate.toUpperCase().substring(0, 3);
      const yearMonth = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      setFormData(prev => ({
        ...prev,
        ref_no: `MANO/HR/${prefix}/${yearMonth}/${code}`
      }));
    }
  }, [selectedTemplate]);

  // Handle document submission/saving
  const handleGenerate = (e) => {
    e.preventDefault();
    if (!formData.recipient_name) {
      toast.error('Recipient Name is required.');
      return;
    }

    let docTitle = '';
    if (selectedTemplate === 'offer_letter') docTitle = `Offer Letter - ${formData.recipient_name}`;
    else if (selectedTemplate === 'appraisal') docTitle = `Appraisal Letter - ${formData.recipient_name}`;
    else if (selectedTemplate === 'contract') docTitle = `Employment Contract - ${formData.recipient_name}`;
    else docTitle = formData.category + ' Policy - ' + (formData.effective_date || 'Draft');

    const newDoc = {
      id: `DOC-${Date.now()}`,
      title: docTitle,
      doc_type: selectedTemplate,
      recipient_name: formData.recipient_name,
      recipient_email: formData.recipient_email || null,
      created_at: new Date().toISOString(),
      created_by: 'HR Manager',
      meta_data: { ...formData }
    };

    const updated = [newDoc, ...documents];
    saveDocuments(updated);
    toast.success('Document compiled and cataloged successfully!');
    
    // Reset templates and go back
    setSelectedTemplate(null);
    setActiveTab('list');
  };

  // Delete document
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this document from the records?')) {
      const filtered = documents.filter(doc => doc.id !== id);
      saveDocuments(filtered);
      toast.success('Document deleted from database.');
    }
  };

  // Open print preview
  const handlePrint = (doc) => {
    setSelectedDocumentForPrint(doc);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Filters logic
  const filteredDocs = documents
    .filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        doc.recipient_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || doc.doc_type === typeFilter;
      return matchesSearch && matchesType;
    });

  // Salary breakdown helper
  const calculateSalaryBreakdown = (ctcLpa) => {
    const lpa = parseFloat(ctcLpa) || 0;
    const monthlyTotal = Math.round((lpa * 100000) / 12);
    const basic = Math.round(monthlyTotal * 0.4);
    const hra = Math.round(basic * 0.5);
    const pf = Math.round(basic * 0.12);
    const special = monthlyTotal - (basic + hra + pf);
    return { basic, hra, pf, special, total: monthlyTotal };
  };

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <DashboardLayout title="HR Document Generation Workspace" noPadding={false}>
      
      {/* Printable Area - Hidden on screen, visible only on print */}
      {selectedDocumentForPrint && (
        <div className="print-only hidden">
          <div className="bg-white text-black p-10 font-serif" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box', margin: '0 auto' }}>
            
            {/* Document Header */}
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-5 mb-8">
              <div className="flex items-center gap-3">
                <img src="/mano-logo.svg" alt="MANO Logo" className="w-12 h-12 object-contain" />
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">MANO TECHNOLOGIES PRIVATE LIMITED</h1>
                  <p className="text-[10px] text-slate-500 font-sans">CIN: U72900KA2025PTC123456 | HR Department</p>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-500 font-sans leading-relaxed">
                <p>HSR Sector 6, HighTech Towers</p>
                <p>Bangalore, Karnataka, India</p>
                <p>hr@mano.co.in | www.mano.co.in</p>
              </div>
            </div>

            {/* Document Meta */}
            <div className="flex justify-between items-start text-xs font-sans mb-8">
              <div>
                <p><span className="font-bold">Ref No:</span> {selectedDocumentForPrint.meta_data?.ref_no || 'MANO/HR/2026/001'}</p>
                <p className="mt-1"><span className="font-bold">Date:</span> {new Date(selectedDocumentForPrint.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800">CONFIDENTIAL</p>
              </div>
            </div>

            {/* Document Content Render */}
            <div className="text-xs leading-relaxed text-slate-900 space-y-4">
              
              {/* Dynamic rendering by template type */}
              {selectedDocumentForPrint.doc_type === 'offer_letter' && (
                <>
                  <div className="mb-6 font-sans">
                    <p className="font-bold">To,</p>
                    <p className="font-bold text-sm">{selectedDocumentForPrint.recipient_name}</p>
                    {selectedDocumentForPrint.recipient_email && <p className="text-slate-500">{selectedDocumentForPrint.recipient_email}</p>}
                  </div>

                  <h2 className="text-center text-sm font-bold underline mb-6 tracking-wide">LETTER OF APPOINTMENT</h2>

                  <p>Dear {selectedDocumentForPrint.recipient_name},</p>
                  <p>
                    We are pleased to offer you employment at MANO Technologies Private Limited for the position of <span className="font-bold">{selectedDocumentForPrint.meta_data?.designation}</span>. Your regular employment is scheduled to commence on <span className="font-bold">{new Date(selectedDocumentForPrint.meta_data?.joining_date || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>.
                  </p>
                  <p>
                    Your Gross Annual Compensation (CTC) will be <span className="font-bold">INR {selectedDocumentForPrint.meta_data?.ctc} LPA (Lakhs Per Annum)</span>. A detailed breakdown of your monthly components is outlined in Annexure A below.
                  </p>
                  <p>
                    You will be on a probation period of <span className="font-bold">{selectedDocumentForPrint.meta_data?.probation} months</span> from your date of joining. Upon successful completion of your probation, your employment status will be confirmed.
                  </p>
                  
                  {/* Salary Annexure Table */}
                  <div className="mt-8 mb-8">
                    <p className="font-bold mb-2 text-xs">Annexure A: Salary Structures Details</p>
                    <table className="w-full text-[11px] border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 p-2 text-left">Salary Component</th>
                          <th className="border border-slate-300 p-2 text-right">Monthly (INR)</th>
                          <th className="border border-slate-300 p-2 text-right">Annualized (INR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const s = calculateSalaryBreakdown(selectedDocumentForPrint.meta_data?.ctc);
                          return (
                            <>
                              <tr>
                                <td className="border border-slate-300 p-2">Basic Salary (40%)</td>
                                <td className="border border-slate-300 p-2 text-right">{formatCurrency(s.basic)}</td>
                                <td className="border border-slate-300 p-2 text-right">{formatCurrency(s.basic * 12)}</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-300 p-2">House Rent Allowance (HRA)</td>
                                <td className="border border-slate-300 p-2 text-right">{formatCurrency(s.hra)}</td>
                                <td className="border border-slate-300 p-2 text-right">{formatCurrency(s.hra * 12)}</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-300 p-2">Special Allowance</td>
                                <td className="border border-slate-300 p-2 text-right">{formatCurrency(s.special)}</td>
                                <td className="border border-slate-300 p-2 text-right">{formatCurrency(s.special * 12)}</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-300 p-2">Provident Fund (PF Employer Contribution)</td>
                                <td className="border border-slate-300 p-2 text-right">{formatCurrency(s.pf)}</td>
                                <td className="border border-slate-300 p-2 text-right">{formatCurrency(s.pf * 12)}</td>
                              </tr>
                              <tr className="font-bold bg-slate-50">
                                <td className="border border-slate-300 p-2 text-left">Cost To Company (Gross CTC)</td>
                                <td className="border border-slate-300 p-2 text-right">{formatCurrency(s.total)}</td>
                                <td className="border border-slate-300 p-2 text-right">{formatCurrency(s.total * 12)}</td>
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {selectedDocumentForPrint.doc_type === 'policy' && (
                <>
                  <h2 className="text-center text-sm font-bold underline mb-6 tracking-wide uppercase">
                    ORGANIZATION POLICY DOCUMENT: {selectedDocumentForPrint.meta_data?.category}
                  </h2>
                  <p className="font-bold">Effective Date: {new Date(selectedDocumentForPrint.meta_data?.effective_date || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  
                  <div className="whitespace-pre-line text-slate-800 leading-relaxed font-serif mt-4 p-4 bg-slate-50/50 rounded-lg">
                    {selectedDocumentForPrint.meta_data?.content}
                  </div>
                  
                  <p className="mt-6">
                    This document serves as an official company policy code. All active staff members, employees, and consultants are mandated to abide by these guidelines. Violations of this policy will review status and may result in disciplinary action up to termination.
                  </p>
                </>
              )}

              {selectedDocumentForPrint.doc_type === 'contract' && (
                <>
                  <div className="mb-6 font-sans">
                    <p className="font-bold">Between,</p>
                    <p className="font-bold">MANO Technologies Private Limited ("The Employer")</p>
                    <p className="mt-3 font-bold">And,</p>
                    <p className="font-bold text-sm">{selectedDocumentForPrint.recipient_name} ("The Employee")</p>
                  </div>

                  <h2 className="text-center text-sm font-bold underline mb-6 tracking-wide">EMPLOYMENT AGREEMENT</h2>

                  <p>
                    This agreement sets forth the terms of employment starting on <span className="font-bold">{new Date(selectedDocumentForPrint.meta_data?.agreement_date || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>.
                  </p>
                  <p>
                    <span className="font-bold">1. Position:</span> The Employee is appointed to the designation of <span className="font-bold">{selectedDocumentForPrint.meta_data?.designation}</span>.
                  </p>
                  <p>
                    <span className="font-bold">2. Term & Hours:</span> This is a <span className="font-bold">{selectedDocumentForPrint.meta_data?.duration}</span> contract. The Employee's standard commitment will be <span className="font-bold">{selectedDocumentForPrint.meta_data?.working_hours}</span>.
                  </p>
                  <p>
                    <span className="font-bold">3. Compensation:</span> In consideration for the services provided, the Employer will compensate the Employee at the rate of <span className="font-bold">INR {selectedDocumentForPrint.meta_data?.remuneration} LPA</span>, payable in monthly intervals subject to standard taxes and benefits.
                  </p>
                  <p>
                    <span className="font-bold">4. Confidentially & NDA:</span> The Employee covenants that they will not disclose, exploit, or leak proprietary software codes, client databases, or company trade secrets during or after their tenure with the Employer.
                  </p>
                </>
              )}

              {selectedDocumentForPrint.doc_type === 'appraisal' && (
                <>
                  <div className="mb-6 font-sans">
                    <p className="font-bold">To,</p>
                    <p className="font-bold text-sm">{selectedDocumentForPrint.recipient_name}</p>
                    <p className="text-slate-500 font-bold">{selectedDocumentForPrint.meta_data?.designation}</p>
                  </div>

                  <h2 className="text-center text-sm font-bold underline mb-6 tracking-wide">COMPENSATION REVISION & PERFORMANCE APPRAISAL</h2>

                  <p>Dear {selectedDocumentForPrint.recipient_name},</p>
                  <p>
                    We want to take this opportunity to thank you for your contribution to the achievements of the past fiscal cycle. Following a review of your performance with a rating score of <span className="font-bold">{selectedDocumentForPrint.meta_data?.rating} / 5 Stars</span>, we are pleased to inform you that your compensation structure is revised.
                  </p>
                  <p>
                    Effective from <span className="font-bold">{new Date(selectedDocumentForPrint.meta_data?.effective_date || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>, your annual Cost to Company (CTC) is revised from <span className="font-bold">INR {selectedDocumentForPrint.meta_data?.current_ctc} LPA</span> to <span className="font-bold">INR {selectedDocumentForPrint.meta_data?.revised_ctc} LPA</span>.
                  </p>
                  <p>
                    All other terms of your employment contract continue to remain in force. We look forward to your continued dedication and leadership in achieving the organization's goals.
                  </p>
                </>
              )}

            </div>

            {/* Document Signatures */}
            <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between font-sans text-xs text-slate-800">
              <div>
                <p className="font-bold text-slate-900">For MANO Technologies Pvt Ltd</p>
                <div className="h-16 flex items-end">
                  <img src="/mano-logo.svg" alt="signature" className="w-12 h-6 object-contain opacity-30 select-none pointer-events-none" />
                </div>
                <p className="border-t border-slate-400 pt-1 w-48 font-bold">Authorized HR Signatory</p>
              </div>
              
              {selectedDocumentForPrint.doc_type !== 'policy' && (
                <div className="text-right">
                  <p className="font-bold text-slate-900">Accepted & Agreed By</p>
                  <div className="h-16"></div>
                  <p className="border-t border-slate-400 pt-1 w-48 font-bold ml-auto">{selectedDocumentForPrint.recipient_name}</p>
                </div>
              )}
            </div>

            {/* Document Footer */}
            <div className="mt-20 text-center text-[9px] text-slate-400 font-sans">
              <p>This is a computer-generated official document. Digital signature records are maintained in compliance with IT Acts.</p>
              <p className="mt-0.5">MANO Inc © 2026. All Rights Reserved.</p>
            </div>

          </div>
        </div>
      )}

      {/* Main Screen Layout Container (Hides when printing) */}
      <div className="no-print space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/20 text-[#0969da] dark:text-github-dark-accent rounded-xl">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-github-dark-text tracking-tight">HR Document Studio</h2>
              <p className="text-xs text-slate-500 dark:text-github-dark-muted mt-0.5 font-medium">Generate, preview, catalog, and print official letters and company policies.</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setActiveTab('list');
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'list' 
                  ? 'bg-slate-100 dark:bg-github-dark-border text-slate-800 dark:text-github-dark-text shadow-sm'
                  : 'text-slate-500 dark:text-github-dark-muted hover:bg-slate-50 dark:hover:bg-github-dark-border/40 hover:text-slate-700'
              }`}
            >
              Document Library
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'create' 
                  ? 'bg-slate-100 dark:bg-github-dark-border text-slate-800 dark:text-github-dark-text shadow-sm'
                  : 'text-slate-500 dark:text-github-dark-muted hover:bg-slate-50 dark:hover:bg-github-dark-border/40 hover:text-slate-700'
              }`}
            >
              <Plus size={14} /> Create Document
            </button>
          </div>
        </div>

        {/* Tab View Contents */}
        {activeTab === 'list' ? (
          
          /* VIEW 1: ARCHIVE / HISTORY CATALOG */
          <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-2xl p-6 shadow-sm">
            
            {/* Catalog Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
              
              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search catalog or recipient..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-[11px] font-bold text-slate-400 dark:text-github-dark-muted flex items-center gap-1">
                  <Filter size={12} />
                  FILTER BY TYPE:
                </span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                >
                  <option value="all">All Documents</option>
                  <option value="offer_letter">Offer Letters</option>
                  <option value="policy">Company Policies</option>
                  <option value="contract">Employment Contracts</option>
                  <option value="appraisal">Appraisal Letters</option>
                </select>
              </div>

            </div>

            {/* Document Listing Table */}
            {filteredDocs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-github-dark-border text-slate-400 dark:text-github-dark-muted font-bold uppercase tracking-wider">
                      <th className="pb-3.5 pl-3">Document ID</th>
                      <th className="pb-3.5">Title</th>
                      <th className="pb-3.5">Recipient</th>
                      <th className="pb-3.5">Type</th>
                      <th className="pb-3.5">Generated On</th>
                      <th className="pb-3.5 text-right pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-github-dark-border">
                    {filteredDocs.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-github-dark-border/20 transition-all">
                        <td className="py-4 pl-3 font-mono font-bold text-slate-500 dark:text-slate-400">
                          {doc.id}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-lg ${
                              doc.doc_type === 'offer_letter' ? 'bg-blue-50 text-[#0969da]' :
                              doc.doc_type === 'policy' ? 'bg-emerald-50 text-emerald-600' :
                              doc.doc_type === 'contract' ? 'bg-purple-50 text-purple-600' :
                              'bg-amber-50 text-amber-600'
                            }`}>
                              <FileText size={16} />
                            </div>
                            <span className="font-extrabold text-slate-700 dark:text-github-dark-text">{doc.title}</span>
                          </div>
                        </td>
                        <td className="py-4 font-bold text-slate-600 dark:text-slate-300">
                          {doc.recipient_name}
                        </td>
                        <td className="py-4">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            doc.doc_type === 'offer_letter' ? 'bg-blue-100 text-[#0969da] dark:bg-blue-950/20 dark:text-blue-400' :
                            doc.doc_type === 'policy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                            doc.doc_type === 'contract' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                          }`}>
                            {doc.doc_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 text-slate-500 dark:text-github-dark-muted font-medium">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 text-right pr-3">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handlePrint(doc)}
                              className="p-1.5 text-slate-500 hover:text-[#0969da] dark:hover:text-github-dark-accent rounded-lg border border-slate-200 dark:border-github-dark-border transition-colors hover:bg-slate-100 dark:hover:bg-github-dark-border/40"
                              title="Print / Save PDF"
                            >
                              <Printer size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg border border-slate-200 dark:border-github-dark-border transition-colors hover:bg-slate-100 dark:hover:bg-github-dark-border/40"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-github-dark-muted font-semibold">No generated documents match your filters.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 px-4 py-2 bg-[#0969da] text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-[#0969da]/90 transition-all"
                >
                  Generate First Document
                </button>
              </div>
            )}

          </div>

        ) : (
          
          /* VIEW 2: TEMPLATE SELECTOR & WORKSPACE BUILDER */
          <div className="space-y-6">
            
            {/* Step 1: Template Card Grid Selector */}
            {!selectedTemplate && (
              <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-extrabold text-slate-800 dark:text-github-dark-text mb-5 text-base">Select Document Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Template Card: Offer Letter */}
                  <div 
                    onClick={() => {
                      setFormData({ ...formData, recipient_name: '', recipient_email: '', designation: '', joining_date: '', ctc: '', probation: '3' });
                      setSelectedTemplate('offer_letter');
                    }}
                    className="border-2 border-dashed border-slate-200 dark:border-github-dark-border hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-github-dark-bg/20 hover:bg-blue-50/10 p-5 rounded-2xl text-center cursor-pointer transition-all duration-200 group hover:shadow-md"
                  >
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/20 text-[#0969da] dark:text-github-dark-accent rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                      <FileText size={24} />
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-github-dark-text group-hover:text-[#0969da]">Offer Letter</h4>
                    <p className="text-[11px] text-slate-500 dark:text-github-dark-muted mt-2 leading-relaxed font-medium">Standard letter of appointment with annualized salary structures and probation criteria.</p>
                  </div>

                  {/* Template Card: Company Policy */}
                  <div 
                    onClick={() => {
                      setFormData({ ...formData, recipient_name: 'All Employees', recipient_email: '', category: 'Attendance', effective_date: '', content: '' });
                      setSelectedTemplate('policy');
                    }}
                    className="border-2 border-dashed border-slate-200 dark:border-github-dark-border hover:border-emerald-400 dark:hover:border-emerald-600 bg-slate-50/50 dark:bg-github-dark-bg/20 hover:bg-emerald-50/10 p-5 rounded-2xl text-center cursor-pointer transition-all duration-200 group hover:shadow-md"
                  >
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                      <Building size={24} />
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-github-dark-text group-hover:text-emerald-600">Company Policy</h4>
                    <p className="text-[11px] text-slate-500 dark:text-github-dark-muted mt-2 leading-relaxed font-medium">Define HR terms of work, guidelines, leave policies, and organizational procedures.</p>
                  </div>

                  {/* Template Card: Contract */}
                  <div 
                    onClick={() => {
                      setFormData({ ...formData, recipient_name: '', recipient_email: '', designation: '', agreement_date: '', duration: 'Permanent', working_hours: '40 hours per week', remuneration: '' });
                      setSelectedTemplate('contract');
                    }}
                    className="border-2 border-dashed border-slate-200 dark:border-github-dark-border hover:border-purple-400 dark:hover:border-purple-600 bg-slate-50/50 dark:bg-github-dark-bg/20 hover:bg-purple-50/10 p-5 rounded-2xl text-center cursor-pointer transition-all duration-200 group hover:shadow-md"
                  >
                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                      <FileCheck size={24} />
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-github-dark-text group-hover:text-purple-600">Employment Contract</h4>
                    <p className="text-[11px] text-slate-500 dark:text-github-dark-muted mt-2 leading-relaxed font-medium">Create detailed legal agreements specifying terms, confidentiality (NDAs), and duties.</p>
                  </div>

                  {/* Template Card: Appraisal */}
                  <div 
                    onClick={() => {
                      setFormData({ ...formData, recipient_name: '', recipient_email: '', designation: '', rating: '5', current_ctc: '', revised_ctc: '', effective_date: '' });
                      setSelectedTemplate('appraisal');
                    }}
                    className="border-2 border-dashed border-slate-200 dark:border-github-dark-border hover:border-amber-400 dark:hover:border-amber-600 bg-slate-50/50 dark:bg-github-dark-bg/20 hover:bg-amber-50/10 p-5 rounded-2xl text-center cursor-pointer transition-all duration-200 group hover:shadow-md"
                  >
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                      <CreditCard size={24} />
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-github-dark-text group-hover:text-amber-600">Appraisal Letter</h4>
                    <p className="text-[11px] text-slate-500 dark:text-github-dark-muted mt-2 leading-relaxed font-medium">Increment notifications based on performance evaluations and annual score matrixes.</p>
                  </div>

                </div>
              </div>
            )}

            {/* Step 2: Split Workspace editor when a template is selected */}
            {selectedTemplate && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Form Input Panel (2/5th width) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Active Header & Autocomplete helper */}
                  <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-5 rounded-2xl shadow-sm">
                    
                    <div className="flex items-center gap-2 mb-4">
                      <button 
                        onClick={() => setSelectedTemplate(null)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-github-dark-border/40 text-slate-500 rounded-lg transition-all"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <h3 className="font-extrabold text-slate-800 dark:text-github-dark-text text-sm">
                        Edit: {selectedTemplate.toUpperCase().replace('_', ' ')}
                      </h3>
                    </div>

                    {/* Autocomplete selector for existing employees */}
                    {selectedTemplate !== 'policy' && (
                      <div className="border border-indigo-100 dark:border-indigo-950/50 bg-indigo-50/10 dark:bg-indigo-950/5 rounded-xl p-3.5">
                        <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1.5 block uppercase tracking-wider flex items-center gap-1">
                          <Users size={12} />
                          Quick Populate (Employee Master)
                        </label>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {SYSTEM_EMPLOYEES.map((emp, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleEmployeeSelect(emp)}
                              className="px-2 py-1 bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border hover:border-indigo-400 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded shadow-sm hover:shadow transition-all"
                            >
                              {emp.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form fields inputs */}
                  <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-5 rounded-2xl shadow-sm">
                    <form onSubmit={handleGenerate} className="space-y-4">
                      
                      {/* Common fields for all templates EXCEPT Policy */}
                      {selectedTemplate !== 'policy' && (
                        <>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Recipient Full Name *</label>
                            <input
                              type="text"
                              required
                              value={formData.recipient_name}
                              onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                              placeholder="e.g. Rahul Sharma"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Recipient Email</label>
                            <input
                              type="email"
                              value={formData.recipient_email}
                              onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                              placeholder="e.g. rahul.sharma@example.com"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Designation / Job Title</label>
                            <input
                              type="text"
                              value={formData.designation}
                              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                              placeholder="e.g. React Developer"
                            />
                          </div>
                        </>
                      )}

                      {/* Offer Letter Specific Inputs */}
                      {selectedTemplate === 'offer_letter' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Annual CTC (INR Lakhs) *</label>
                            <input
                              type="number"
                              step="0.1"
                              required
                              value={formData.ctc}
                              onChange={(e) => setFormData({ ...formData, ctc: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                              placeholder="e.g. 9.5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Date of Joining</label>
                            <input
                              type="date"
                              value={formData.joining_date}
                              onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Probation (Months)</label>
                            <select
                              value={formData.probation}
                              onChange={(e) => setFormData({ ...formData, probation: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                            >
                              <option value="3">3 Months</option>
                              <option value="6">6 Months</option>
                              <option value="0">None</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Policy Specific Inputs */}
                      {selectedTemplate === 'policy' && (
                        <>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Policy Title *</label>
                            <input
                              type="text"
                              required
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                              placeholder="e.g. Leave & Holidays"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Effective Date</label>
                            <input
                              type="date"
                              value={formData.effective_date}
                              onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Policy Content *</label>
                            <textarea
                              rows="6"
                              required
                              value={formData.content}
                              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da] font-serif leading-relaxed"
                              placeholder="Enter company regulations, definitions, guidelines, code of conduct details..."
                            />
                          </div>
                        </>
                      )}

                      {/* Contract Specific Inputs */}
                      {selectedTemplate === 'contract' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Annual Remuneration (INR Lakhs) *</label>
                            <input
                              type="number"
                              required
                              value={formData.remuneration}
                              onChange={(e) => setFormData({ ...formData, remuneration: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                              placeholder="e.g. 15.0"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Agreement Date</label>
                            <input
                              type="date"
                              value={formData.agreement_date}
                              onChange={(e) => setFormData({ ...formData, agreement_date: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Contract Duration</label>
                            <input
                              type="text"
                              value={formData.duration}
                              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                              placeholder="e.g. 1 Year, Permanent"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Working Commitment</label>
                            <input
                              type="text"
                              value={formData.working_hours}
                              onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                              placeholder="e.g. 40 hours per week"
                            />
                          </div>
                        </div>
                      )}

                      {/* Appraisal Specific Inputs */}
                      {selectedTemplate === 'appraisal' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Current CTC (LPA) *</label>
                            <input
                              type="number"
                              required
                              value={formData.current_ctc}
                              onChange={(e) => setFormData({ ...formData, current_ctc: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                              placeholder="e.g. 8.0"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Revised CTC (LPA) *</label>
                            <input
                              type="number"
                              required
                              value={formData.revised_ctc}
                              onChange={(e) => setFormData({ ...formData, revised_ctc: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                              placeholder="e.g. 10.5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Performance Rating</label>
                            <select
                              value={formData.rating}
                              onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                            >
                              <option value="5">Outstanding (5 Stars)</option>
                              <option value="4">Exceeds Expectations (4 Stars)</option>
                              <option value="3">Meets Expectations (3 Stars)</option>
                              <option value="2">Needs Improvement (2 Stars)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-github-dark-muted mb-1 block uppercase">Effective Date</label>
                            <input
                              type="date"
                              value={formData.effective_date}
                              onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Compilation and Action Buttons */}
                      <div className="flex gap-3 pt-3">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-[#0969da] hover:bg-[#0969da]/90 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 shadow-sm transition-all"
                        >
                          <FileCheck size={14} />
                          Compile & Save Document
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTemplate(null);
                            setActiveTab('list');
                          }}
                          className="px-4 py-2.5 bg-slate-100 dark:bg-github-dark-border hover:bg-slate-200 dark:hover:bg-github-dark-border/80 text-slate-700 dark:text-github-dark-text rounded-xl text-xs font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>

                    </form>
                  </div>

                </div>

                {/* Right Panel: Live scrollable letterhead document preview (3/5th width) */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="bg-slate-100 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border p-3 rounded-2xl flex items-center justify-between shadow-inner">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-github-dark-muted flex items-center gap-1 pl-1">
                      <Sparkles size={12} className="text-amber-500" />
                      LIVE PREVIEW (A4 CANVAS SHEET)
                    </span>
                  </div>

                  {/* High Fidelity Scrollable A4 Document Page */}
                  <div className="border border-slate-200 dark:border-github-dark-border bg-white text-black p-10 font-serif shadow-xl rounded-2xl max-h-[700px] overflow-y-auto w-full select-none leading-relaxed">
                    
                    {/* Official Letterhead */}
                    <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
                      <div className="flex items-center gap-2">
                        <img src="/mano-logo.svg" alt="MANO" className="w-10 h-10 object-contain" />
                        <div>
                          <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">MANO TECHNOLOGIES PRIVATE LIMITED</h1>
                          <p className="text-[9px] text-slate-500 font-sans mt-1">CIN: U72900KA2025PTC123456 | HR Department</p>
                        </div>
                      </div>
                      <div className="text-right text-[9px] text-slate-500 font-sans leading-tight">
                        <p>HSR Sector 6, HighTech Towers</p>
                        <p>Bangalore, Karnataka, India</p>
                        <p>hr@mano.co.in</p>
                      </div>
                    </div>

                    {/* Reference and Date */}
                    <div className="flex justify-between items-start text-[10px] font-sans mb-6">
                      <div>
                        <p><span className="font-bold">Ref No:</span> {formData.ref_no || 'MANO/HR/2026/XXX'}</p>
                        <p className="mt-0.5"><span className="font-bold">Date:</span> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800 tracking-wider">CONFIDENTIAL</p>
                      </div>
                    </div>

                    {/* Preview Core Texts */}
                    <div className="text-[10px] text-slate-900 space-y-3 leading-relaxed">
                      
                      {selectedTemplate === 'offer_letter' && (
                        <>
                          <div className="mb-4 font-sans">
                            <p className="font-bold">To,</p>
                            <p className="font-bold text-slate-800 text-xs">{formData.recipient_name || '[Candidate Name]'}</p>
                            <p className="text-slate-500">{formData.recipient_email || '[Candidate Email]'}</p>
                          </div>

                          <h2 className="text-center text-xs font-bold underline mb-4 uppercase tracking-wider">LETTER OF APPOINTMENT</h2>

                          <p>Dear {formData.recipient_name || '[Candidate Name]'},</p>
                          <p>
                            We are pleased to offer you employment at MANO Technologies Private Limited for the position of <span className="font-bold">{formData.designation || '[Designation / Role]'}</span>. Your regular employment is scheduled to commence on <span className="font-bold">{formData.joining_date ? new Date(formData.joining_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '[Joining Date]'}</span>.
                          </p>
                          <p>
                            Your Gross Annual Compensation (CTC) will be <span className="font-bold">INR {formData.ctc || 'XX.X'} LPA (Lakhs Per Annum)</span>. A detailed breakdown of your monthly components is outlined in Annexure A below.
                          </p>
                          <p>
                            You will be on a probation period of <span className="font-bold">{formData.probation} months</span> from your date of joining. Upon successful completion of your probation, your employment status will be confirmed.
                          </p>

                          {/* Annexure Table Preview */}
                          <div className="mt-4 mb-4">
                            <p className="font-bold mb-1 text-[10px]">Annexure A: Salary Breakdown details</p>
                            <table className="w-full text-[9px] border-collapse border border-slate-300 font-sans">
                              <thead>
                                <tr className="bg-slate-100 font-bold">
                                  <th className="border border-slate-300 p-1.5 text-left">Salary Component</th>
                                  <th className="border border-slate-300 p-1.5 text-right">Monthly (INR)</th>
                                  <th className="border border-slate-300 p-1.5 text-right">Annualized (INR)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const s = calculateSalaryBreakdown(formData.ctc);
                                  return (
                                    <>
                                      <tr>
                                        <td className="border border-slate-300 p-1.5">Basic Salary (40%)</td>
                                        <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(s.basic)}</td>
                                        <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(s.basic * 12)}</td>
                                      </tr>
                                      <tr>
                                        <td className="border border-slate-300 p-1.5">House Rent Allowance (HRA)</td>
                                        <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(s.hra)}</td>
                                        <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(s.hra * 12)}</td>
                                      </tr>
                                      <tr>
                                        <td className="border border-slate-300 p-1.5">Special Allowance</td>
                                        <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(s.special)}</td>
                                        <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(s.special * 12)}</td>
                                      </tr>
                                      <tr>
                                        <td className="border border-slate-300 p-1.5">Provident Fund (PF)</td>
                                        <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(s.pf)}</td>
                                        <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(s.pf * 12)}</td>
                                      </tr>
                                      <tr className="font-bold bg-slate-50">
                                        <td className="border border-slate-300 p-1.5 text-left">Cost To Company (Gross CTC)</td>
                                        <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(s.total)}</td>
                                        <td className="border border-slate-300 p-1.5 text-right">{formatCurrency(s.total * 12)}</td>
                                      </tr>
                                    </>
                                  );
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}

                      {selectedTemplate === 'policy' && (
                        <>
                          <h2 className="text-center text-xs font-bold underline mb-4 uppercase tracking-wider">
                            ORGANIZATION POLICY DOCUMENT: {formData.category || '[Category]'}
                          </h2>
                          <p className="font-bold">Effective Date: {formData.effective_date ? new Date(formData.effective_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '[Effective Date]'}</p>
                          
                          <div className="whitespace-pre-line text-slate-800 leading-relaxed font-serif p-3 bg-slate-50 border border-slate-100 rounded-lg">
                            {formData.content || 'Please fill in the policy contents in the input panel to generate details...'}
                          </div>

                          <p className="mt-4">
                            This document serves as an official company policy code. All active staff members, employees, and consultants are mandated to abide by these guidelines.
                          </p>
                        </>
                      )}

                      {selectedTemplate === 'contract' && (
                        <>
                          <div className="mb-4 font-sans">
                            <p className="font-bold">Between,</p>
                            <p className="font-bold">MANO Technologies Private Limited ("The Employer")</p>
                            <p className="mt-2 font-bold">And,</p>
                            <p className="font-bold text-slate-800 text-xs">{formData.recipient_name || '[Employee Name]'} ("The Employee")</p>
                          </div>

                          <h2 className="text-center text-xs font-bold underline mb-4 uppercase tracking-wider">EMPLOYMENT AGREEMENT</h2>

                          <p>
                            This agreement sets forth the terms of employment starting on <span className="font-bold">{formData.agreement_date ? new Date(formData.joining_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '[Agreement Date]'}</span>.
                          </p>
                          <p>
                            <span className="font-bold">1. Position:</span> The Employee is appointed to the designation of <span className="font-bold">{formData.designation || '[Designation]'}</span>.
                          </p>
                          <p>
                            <span className="font-bold">2. Term & Hours:</span> This is a <span className="font-bold">{formData.duration}</span> contract. The Employee's standard commitment will be <span className="font-bold">{formData.working_hours}</span>.
                          </p>
                          <p>
                            <span className="font-bold">3. Compensation:</span> In consideration for the services provided, the Employer will compensate the Employee at the rate of <span className="font-bold">INR {formData.remuneration || 'XX.X'} LPA</span>, payable in monthly intervals.
                          </p>
                          <p>
                            <span className="font-bold">4. Confidentially:</span> The Employee covenants that they will not disclose, exploit, or leak proprietary software codes or trade secrets during or after their tenure.
                          </p>
                        </>
                      )}

                      {selectedTemplate === 'appraisal' && (
                        <>
                          <div className="mb-4 font-sans">
                            <p className="font-bold">To,</p>
                            <p className="font-bold text-slate-800 text-xs">{formData.recipient_name || '[Employee Name]'}</p>
                            <p className="text-slate-500 font-bold">{formData.designation || '[Designation]'}</p>
                          </div>

                          <h2 className="text-center text-xs font-bold underline mb-4 uppercase tracking-wider">COMPENSATION REVISION</h2>

                          <p>Dear {formData.recipient_name || '[Employee Name]'},</p>
                          <p>
                            We want to take this opportunity to thank you for your contribution to the achievements of the past fiscal cycle. Following a review of your performance with a rating score of <span className="font-bold">{formData.rating} / 5 Stars</span>, we are pleased to inform you that your compensation structure is revised.
                          </p>
                          <p>
                            Effective from <span className="font-bold">{formData.effective_date ? new Date(formData.effective_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '[Effective Date]'}</span>, your annual Cost to Company (CTC) is revised from <span className="font-bold">INR {formData.current_ctc || 'XX.X'} LPA</span> to <span className="font-bold">INR {formData.revised_ctc || 'XX.X'} LPA</span>.
                          </p>
                          <p>
                            All other terms of your employment contract continue to remain in force. We look forward to your continued dedication.
                          </p>
                        </>
                      )}

                    </div>

                    {/* Signatures preview */}
                    <div className="mt-10 pt-4 border-t border-slate-100 flex justify-between font-sans text-[9px] text-slate-700">
                      <div>
                        <p className="font-bold text-slate-900">For MANO Technologies Pvt Ltd</p>
                        <div className="h-10"></div>
                        <p className="border-t border-slate-300 pt-0.5 w-32 font-bold">Authorized HR Signatory</p>
                      </div>
                      
                      {selectedTemplate !== 'policy' && (
                        <div className="text-right">
                          <p className="font-bold text-slate-900">Accepted & Agreed By</p>
                          <div className="h-10"></div>
                          <p className="border-t border-slate-300 pt-0.5 w-32 font-bold ml-auto">{formData.recipient_name || '[Employee Name]'}</p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default DocumentGenerator;
