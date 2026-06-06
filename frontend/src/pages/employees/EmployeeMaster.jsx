import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import {
    Search, Filter, Plus, FileText, CheckCircle2, AlertTriangle, 
    ShieldAlert, Clock, RefreshCw, Upload, Eye, Trash2, CheckCircle, 
    XCircle, AlertCircle, Sparkles, Building, Briefcase, User, Users, Info, 
    Check, ChevronDown, ChevronUp, UserCheck, UserX, ArrowRight, 
    ShieldCheck, Download, Trash, ClipboardCheck, Calendar, MapPin, X, File, Award
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { KpiGoalSheets, ReviewsAndRatings, AiPerformanceAnalyzer } from '../performance/PerformanceViews';

// Standard Document Categories from user request
const DOCUMENT_CATEGORIES = [
    {
        id: 'identity',
        name: 'Identity Documents',
        items: [
            { key: 'aadhaar', name: 'Aadhaar Card', required: true },
            { key: 'pan', name: 'PAN Card', required: true },
            { key: 'passport', name: 'Passport', required: false },
            { key: 'license', name: 'Driving License', required: false }
        ]
    },
    {
        id: 'educational',
        name: 'Educational Documents',
        items: [
            { key: 'ssc', name: 'SSC (10th Marksheet)', required: true },
            { key: 'hsc', name: 'HSC (12th Marksheet)', required: true },
            { key: 'diploma', name: 'Diploma Certificate', required: false },
            { key: 'degree', name: 'Degree Certificate', required: true },
            { key: 'consolidated', name: 'Consolidated Marksheet', required: true }
        ]
    },
    {
        id: 'employment',
        name: 'Employment Documents',
        items: [
            { key: 'offer_letter', name: 'Previous Offer Letter', required: true },
            { key: 'experience_letter', name: 'Experience Letter', required: true },
            { key: 'relieving_letter', name: 'Relieving Letter', required: true },
            { key: 'salary_slips', name: 'Salary Slips (Last 3 Months)', required: true }
        ]
    },
    {
        id: 'banking',
        name: 'Banking Documents',
        items: [
            { key: 'cheque', name: 'Cancelled Cheque', required: true },
            { key: 'passbook', name: 'Passbook Copy', required: true },
            { key: 'bank_statement', name: 'Bank Statement', required: true }
        ]
    },
    {
        id: 'compliance',
        name: 'Compliance Documents',
        items: [
            { key: 'pf', name: 'PF Details', required: false },
            { key: 'uan', name: 'UAN Number', required: true },
            { key: 'esic', name: 'ESIC Details', required: false }
        ]
    },
    {
        id: 'other',
        name: 'Other Documents',
        items: [
            { key: 'photo', name: 'Passport Photo', required: true },
            { key: 'signature', name: 'Signature Specimen', required: true },
            { key: 'emergency_contact', name: 'Emergency Contact Detail', required: true },
            { key: 'medical_dec', name: 'Medical Declaration', required: true }
        ]
    }
];

// Checklist items from user request
const CHECKLIST_ITEMS = [
    { key: 'docs_submitted', label: 'Documents Submitted' },
    { key: 'offer_accepted', label: 'Offer Accepted' },
    { key: 'contract_signed', label: 'Contract Signed' },
    { key: 'laptop_assigned', label: 'Laptop Assigned' },
    { key: 'email_created', label: 'Email Created' },
    { key: 'training_assigned', label: 'Training Assigned' },
    { key: 'manager_assigned', label: 'Manager Assigned' }
];

const DEFAULT_CYCLES = [
    { id: 'cycle-1', name: 'Q1 2026 Performance Cycle', type: 'Quarterly', status: 'Evaluating', startDate: '2026-01-01', endDate: '2026-03-31' },
    { id: 'cycle-2', name: 'Q2 2026 Performance Cycle', type: 'Quarterly', status: 'Active', startDate: '2026-04-01', endDate: '2026-06-30' },
    { id: 'cycle-3', name: 'Mid-Year 2026 Appraisal', type: 'Half Yearly', status: 'Closed', startDate: '2026-01-01', endDate: '2026-06-30' },
    { id: 'cycle-4', name: 'Annual Review 2026', type: 'Yearly', status: 'Closed', startDate: '2026-01-01', endDate: '2026-12-31' }
];

const EmployeeMaster = () => {
    const { user: currentUser } = useAuth();
    
    // UI states
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deptFilter, setDeptFilter] = useState('All');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [drawerTab, setDrawerTab] = useState('profile'); // profile, documents, checklist, ai_verify, perf_goals, perf_reviews, perf_analyzer
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedCycleId, setSelectedCycleId] = useState('cycle-2');
    const [cycles, setCycles] = useState([]);
    
    // Document Upload state helper
    const [uploadModal, setUploadModal] = useState({
        isOpen: false,
        docKey: '',
        docName: '',
        category: ''
    });
    const [uploadForm, setUploadForm] = useState({
        fileName: '',
        expiryDate: '',
        nameOnDoc: '',
        isExpiredSim: false,
        isMismatchSim: false
    });

    // Verification Anim state
    const [isVerifying, setIsVerifying] = useState(false);

    // Fetch employee directory
    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await adminService.getAllUsers(true);
            if (res.success) {
                const formatted = res.users.map(u => ({
                    id: u.user_id,
                    user_code: u.user_code || `EMP-${u.user_id}`,
                    name: u.user_name,
                    email: u.email,
                    phone: u.phone_no || '-',
                    department: u.dept_name || 'General',
                    designation: u.desg_name || u.user_type,
                    status: u.is_deleted ? 'Deleted' : (u.is_active ? 'Active' : 'Inactive'),
                    profile_image_url: u.profile_image_url
                }));
                setEmployees(formatted);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load employee list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
        
        const stored = localStorage.getItem('mano_performance_cycles');
        if (stored) {
            try {
                setCycles(JSON.parse(stored));
            } catch (e) {
                setCycles(DEFAULT_CYCLES);
            }
        } else {
            localStorage.setItem('mano_performance_cycles', JSON.stringify(DEFAULT_CYCLES));
            setCycles(DEFAULT_CYCLES);
        }
    }, []);

    // Get list of unique departments for filter dropdown
    const departments = ['All', ...new Set(employees.map(e => e.department))];

    // Load extra profile info from localStorage or initialize defaults
    const getEmployeeProfile = (empId, empName) => {
        const localKey = `mano_empmaster_profile_${empId}`;
        const stored = localStorage.getItem(localKey);
        
        // Seed variations based on empId to give a realistic dashboard view out-of-the-box
        const variant = Number(empId) % 3;
        let defaultProfile = {};

        if (variant === 0) {
            // Case 0: Onboarding Completed, 100% Passed Profile
            defaultProfile = {
                dob: '1992-04-12',
                gender: 'Female',
                address: 'Flat 402, Sunshine Apartments, Indiranagar, Bangalore, Karnataka',
                joining_date: '2024-05-10',
                employment_type: 'Full-time',
                work_location: 'Headquarters',
                reporting_manager: 'Suresh Kumar (VP of Engineering)',
                documents: {
                    aadhaar: { uploaded: true, fileName: `Aadhaar_${empName.replace(/\s+/g, '_')}.pdf`, uploadedAt: '2024-05-02', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    pan: { uploaded: true, fileName: `PAN_${empName.replace(/\s+/g, '_')}.pdf`, uploadedAt: '2024-05-02', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    ssc: { uploaded: true, fileName: 'SSC_Marksheet.pdf', uploadedAt: '2024-05-03', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    hsc: { uploaded: true, fileName: 'HSC_Marksheet.pdf', uploadedAt: '2024-05-03', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    degree: { uploaded: true, fileName: 'Degree_Certificate.pdf', uploadedAt: '2024-05-03', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    consolidated: { uploaded: true, fileName: 'Consolidated_Transcript.pdf', uploadedAt: '2024-05-03', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    offer_letter: { uploaded: true, fileName: 'Previous_Offer_Letter.pdf', uploadedAt: '2024-05-04', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    experience_letter: { uploaded: true, fileName: 'Experience_Certificate.pdf', uploadedAt: '2024-05-04', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    relieving_letter: { uploaded: true, fileName: 'Relieving_Letter.pdf', uploadedAt: '2024-05-04', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    salary_slips: { uploaded: true, fileName: 'Last_3_Months_PaySlips.pdf', uploadedAt: '2024-05-04', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    cheque: { uploaded: true, fileName: 'Cancelled_Cheque.pdf', uploadedAt: '2024-05-05', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    passbook: { uploaded: true, fileName: 'Bank_Passbook_Copy.pdf', uploadedAt: '2024-05-05', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    bank_statement: { uploaded: true, fileName: 'Bank_Statement_6Months.pdf', uploadedAt: '2024-05-05', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    uan: { uploaded: true, fileName: 'UAN_Card.pdf', uploadedAt: '2024-05-06', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    photo: { uploaded: true, fileName: 'Passport_Photo.jpg', uploadedAt: '2024-05-01', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    signature: { uploaded: true, fileName: 'Signature_Specimen.png', uploadedAt: '2024-05-01', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    emergency_contact: { uploaded: true, fileName: 'Emergency_Declaration.pdf', uploadedAt: '2024-05-01', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    medical_dec: { uploaded: true, fileName: 'Medical_Fitness_Form.pdf', uploadedAt: '2024-05-01', expiryDate: null, nameOnDoc: empName, status: 'Verified' }
                },
                onboarding_checklist: {
                    docs_submitted: true,
                    offer_accepted: true,
                    contract_signed: true,
                    laptop_assigned: true,
                    email_created: true,
                    training_assigned: true,
                    manager_assigned: true
                },
                ai_verification_results: {
                    missing_documents: [],
                    expired_documents: [],
                    mismatched_information: [],
                    lastChecked: '2026-06-05 10:00:00'
                }
            };
        } else if (variant === 1) {
            // Case 1: Active Onboarding, Missing and Warning Flags
            defaultProfile = {
                dob: '1998-11-23',
                gender: 'Male',
                address: 'H-90, Sector 15, HSR Layout, Bangalore, Karnataka',
                joining_date: '2026-05-01',
                employment_type: 'Full-time',
                work_location: 'Remote',
                reporting_manager: 'Ananya Sen (HR Specialist)',
                documents: {
                    aadhaar: { uploaded: true, fileName: `Aadhaar_${empName.replace(/\s+/g, '_')}.pdf`, uploadedAt: '2026-05-02', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    pan: { uploaded: true, fileName: `PAN_${empName.replace(/\s+/g, '_')}.pdf`, uploadedAt: '2026-05-02', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    passport: { uploaded: true, fileName: 'Passport_Scan.pdf', uploadedAt: '2026-05-03', expiryDate: '2025-12-15', nameOnDoc: empName, status: 'Expired', isExpiredSim: true },
                    ssc: { uploaded: true, fileName: 'SSC_Marksheet.pdf', uploadedAt: '2026-05-03', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    hsc: { uploaded: true, fileName: 'HSC_Marksheet.pdf', uploadedAt: '2026-05-03', expiryDate: null, nameOnDoc: empName, status: 'Verified' },
                    salary_slips: { uploaded: true, fileName: 'Previous_PaySlips.pdf', uploadedAt: '2026-05-04', expiryDate: null, nameOnDoc: `${empName.split(' ')[0]} V.`, status: 'Mismatched', isMismatchSim: true },
                    photo: { uploaded: true, fileName: 'Profile_Pic.jpg', uploadedAt: '2026-05-01', expiryDate: null, nameOnDoc: empName, status: 'Verified' }
                },
                onboarding_checklist: {
                    docs_submitted: true,
                    offer_accepted: true,
                    contract_signed: true,
                    laptop_assigned: true,
                    email_created: false,
                    training_assigned: false,
                    manager_assigned: true
                },
                ai_verification_results: {
                    missing_documents: ['Degree Certificate', 'Consolidated Marksheet', 'Previous Offer Letter', 'Experience Letter', 'Relieving Letter', 'Cancelled Cheque', 'Passbook Copy', 'Bank Statement', 'UAN Number', 'Signature Specimen', 'Emergency Contact Detail', 'Medical Declaration'],
                    expired_documents: ['Passport (Expired on 2025-12-15)'],
                    mismatched_information: [`Salary Slips lists name "${empName.split(' ')[0]} V." instead of "${empName}"`],
                    lastChecked: '2026-06-05 14:30:00'
                }
            };
        } else {
            // Case 2: Newly Joined, Onboarding Pending
            defaultProfile = {
                dob: '2001-01-15',
                gender: 'Male',
                address: '32, MG Road, Trinity Junction, Bangalore, Karnataka',
                joining_date: '2026-06-01',
                employment_type: 'Intern',
                work_location: 'Headquarters',
                reporting_manager: 'Rohan Mehra (Tech Lead)',
                documents: {
                    photo: { uploaded: true, fileName: 'Intern_Photo.jpg', uploadedAt: '2026-06-01', expiryDate: null, nameOnDoc: empName, status: 'Verified' }
                },
                onboarding_checklist: {
                    docs_submitted: false,
                    offer_accepted: true,
                    contract_signed: false,
                    laptop_assigned: false,
                    email_created: false,
                    training_assigned: false,
                    manager_assigned: false
                },
                ai_verification_results: {
                    missing_documents: ['Aadhaar Card', 'PAN Card', 'SSC (10th Marksheet)', 'HSC (12th Marksheet)', 'Degree Certificate', 'Consolidated Marksheet', 'Previous Offer Letter', 'Experience Letter', 'Relieving Letter', 'Salary Slips (Last 3 Months)', 'Cancelled Cheque', 'Passbook Copy', 'Bank Statement', 'UAN Number', 'Signature Specimen', 'Emergency Contact Detail', 'Medical Declaration'],
                    expired_documents: [],
                    mismatched_information: [],
                    lastChecked: '2026-06-05 17:15:00'
                }
            };
        }

        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Ensure structural integrity
                return {
                    ...defaultProfile,
                    ...parsed,
                    documents: { ...defaultProfile.documents, ...parsed.documents },
                    onboarding_checklist: { ...defaultProfile.onboarding_checklist, ...parsed.onboarding_checklist },
                    ai_verification_results: { ...defaultProfile.ai_verification_results, ...parsed.ai_verification_results }
                };
            } catch (e) {
                console.error(e);
            }
        }
        return defaultProfile;
    };

    // Save profile update to localStorage
    const saveEmployeeProfile = (empId, updatedData) => {
        const localKey = `mano_empmaster_profile_${empId}`;
        localStorage.setItem(localKey, JSON.stringify(updatedData));
        
        // If employee drawer is open, refresh selected employee detail state
        if (selectedEmployee && selectedEmployee.id === empId) {
            setSelectedEmployee(prev => ({
                ...prev,
                profile: updatedData
            }));
        }
    };

    // Click handler to open details
    const handleSelectEmployee = (emp) => {
        const profile = getEmployeeProfile(emp.id, emp.name);
        setSelectedEmployee({
            ...emp,
            profile
        });
        setDrawerTab('profile');
        setIsEditMode(false);
    };

    // Save basic information
    const handleInfoSubmit = (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        
        const updatedProfile = {
            ...selectedEmployee.profile,
            dob: data.get('dob'),
            gender: data.get('gender'),
            address: data.get('address'),
            joining_date: data.get('joining_date'),
            employment_type: data.get('employment_type'),
            work_location: data.get('work_location'),
            reporting_manager: data.get('reporting_manager')
        };

        saveEmployeeProfile(selectedEmployee.id, updatedProfile);
        setIsEditMode(false);
        toast.success("Profile details updated successfully!");
    };

    // Checklist toggler
    const handleChecklistToggle = (itemKey) => {
        const currentChecklist = selectedEmployee.profile.onboarding_checklist;
        const updatedChecklist = {
            ...currentChecklist,
            [itemKey]: !currentChecklist[itemKey]
        };

        const updatedProfile = {
            ...selectedEmployee.profile,
            onboarding_checklist: updatedChecklist
        };

        saveEmployeeProfile(selectedEmployee.id, updatedProfile);
    };

    // Document Modal Open
    const openUploadModal = (itemKey, itemName, categoryId) => {
        setUploadForm({
            fileName: `${itemName.replace(/\s+/g, '_')}_Scan.pdf`,
            expiryDate: '',
            nameOnDoc: selectedEmployee.name,
            isExpiredSim: false,
            isMismatchSim: false
        });
        setUploadModal({
            isOpen: true,
            docKey: itemKey,
            docName: itemName,
            category: categoryId
        });
    };

    // Save uploaded document details
    const handleDocumentUploadSave = (e) => {
        e.preventDefault();
        
        const docRecord = {
            uploaded: true,
            fileName: uploadForm.fileName,
            uploadedAt: new Date().toLocaleDateString(),
            expiryDate: uploadForm.expiryDate || null,
            nameOnDoc: uploadForm.nameOnDoc,
            isExpiredSim: uploadForm.isExpiredSim,
            isMismatchSim: uploadForm.isMismatchSim,
            status: 'Uploaded'
        };

        // Determine if simulation triggers instantly
        if (uploadForm.isExpiredSim) {
            docRecord.status = 'Expired';
        } else if (uploadForm.isMismatchSim) {
            docRecord.status = 'Mismatched';
        } else {
            docRecord.status = 'Verified';
        }

        const updatedDocs = {
            ...selectedEmployee.profile.documents,
            [uploadModal.docKey]: docRecord
        };

        // Auto-check the "Documents Submitted" checklist item if key documents exist
        const hasAadhaar = updatedDocs['aadhaar']?.uploaded;
        const hasPan = updatedDocs['pan']?.uploaded;
        const autoCheckDocsSubmitted = (hasAadhaar && hasPan);

        const updatedProfile = {
            ...selectedEmployee.profile,
            documents: updatedDocs,
            onboarding_checklist: {
                ...selectedEmployee.profile.onboarding_checklist,
                docs_submitted: autoCheckDocsSubmitted ? true : selectedEmployee.profile.onboarding_checklist.docs_submitted
            }
        };

        saveEmployeeProfile(selectedEmployee.id, updatedProfile);
        setUploadModal(prev => ({ ...prev, isOpen: false }));
        toast.success(`Uploaded ${uploadModal.docName} successfully!`);
    };

    // Delete Document
    const handleDeleteDocument = (docKey, docName) => {
        const updatedDocs = { ...selectedEmployee.profile.documents };
        delete updatedDocs[docKey];

        const updatedProfile = {
            ...selectedEmployee.profile,
            documents: updatedDocs
        };

        saveEmployeeProfile(selectedEmployee.id, updatedProfile);
        toast.info(`Removed ${docName}`);
    };

    // AI scanner simulation
    const runAiVerification = () => {
        setIsVerifying(true);
        setTimeout(() => {
            const missing = [];
            const expired = [];
            const mismatched = [];

            // 1. Scan required documents
            DOCUMENT_CATEGORIES.forEach(category => {
                category.items.forEach(item => {
                    const doc = selectedEmployee.profile.documents[item.key];
                    if (item.required && (!doc || !doc.uploaded)) {
                        missing.push(item.name);
                    } else if (doc && doc.uploaded) {
                        // 2. Scan for expiration date in past
                        if (doc.expiryDate) {
                            const expDate = new Date(doc.expiryDate);
                            if (expDate < new Date()) {
                                expired.push(`${item.name} (Expired on ${doc.expiryDate})`);
                                doc.status = 'Expired';
                            }
                        }
                        if (doc.isExpiredSim) {
                            expired.push(`${item.name} (Simulated Expiration error)`);
                        }

                        // 3. Scan for Name Mismatches
                        if (doc.nameOnDoc && doc.nameOnDoc.trim().toLowerCase() !== selectedEmployee.name.trim().toLowerCase()) {
                            mismatched.push(`${item.name} lists name "${doc.nameOnDoc}" instead of "${selectedEmployee.name}"`);
                            doc.status = 'Mismatched';
                        }
                        if (doc.isMismatchSim) {
                            mismatched.push(`${item.name} lists name "${doc.nameOnDoc || 'Wrong Name'}" instead of "${selectedEmployee.name}"`);
                        }
                    }
                });
            });

            const updatedProfile = {
                ...selectedEmployee.profile,
                ai_verification_results: {
                    missing_documents: missing,
                    expired_documents: expired,
                    mismatched_information: mismatched,
                    lastChecked: new Date().toLocaleString()
                }
            };

            saveEmployeeProfile(selectedEmployee.id, updatedProfile);
            setIsVerifying(false);
            toast.success("AI Document Audit complete!");
        }, 2000);
    };

    // Helper: calculate onboarding progress percentage
    const getOnboardingProgress = (checklist) => {
        if (!checklist) return 0;
        const total = CHECKLIST_ITEMS.length;
        const checked = CHECKLIST_ITEMS.filter(item => checklist[item.key]).length;
        return Math.round((checked / total) * 100);
    };

    // Statistics counts
    const totalEmployeesCount = employees.length;
    
    // Count of employees with complete onboarding
    const completedOnboardingCount = employees.filter(emp => {
        const profile = getEmployeeProfile(emp.id, emp.name);
        return getOnboardingProgress(profile.onboarding_checklist) === 100;
    }).length;

    // Count of employees currently onboarding (progress between 1% and 99%)
    const inProgressOnboardingCount = employees.filter(emp => {
        const profile = getEmployeeProfile(emp.id, emp.name);
        const prog = getOnboardingProgress(profile.onboarding_checklist);
        return prog > 0 && prog < 100;
    }).length;

    // Count of documents flags across all employees
    const getDocumentIssuesCount = () => {
        let issues = 0;
        employees.forEach(emp => {
            const profile = getEmployeeProfile(emp.id, emp.name);
            const docs = profile.documents;
            Object.keys(docs).forEach(k => {
                if (docs[k].status === 'Expired' || docs[k].status === 'Mismatched' || docs[k].isExpiredSim || docs[k].isMismatchSim) {
                    issues++;
                }
            });
        });
        return issues;
    };

    // Filter list
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              emp.user_code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
        return matchesSearch && matchesDept;
    });

    return (
        <DashboardLayout title="Employee Master Dashboard" noPadding={false}>
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-4 rounded-xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-[#0969da] rounded-lg">
                        <Users size={20} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 dark:text-github-dark-muted font-medium">Employee Master Count</span>
                        <p className="text-xl font-bold mt-0.5">{totalEmployeesCount}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-4 rounded-xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 dark:text-github-dark-muted font-medium">Onboarding Completed</span>
                        <p className="text-xl font-bold mt-0.5">{completedOnboardingCount}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-4 rounded-xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg">
                        <Clock size={20} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 dark:text-github-dark-muted font-medium">Onboarding In-Progress</span>
                        <p className="text-xl font-bold mt-0.5">{inProgressOnboardingCount}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-4 rounded-xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 dark:text-github-dark-muted font-medium">Document Warnings (AI)</span>
                        <p className="text-xl font-bold mt-0.5">{getDocumentIssuesCount()}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search employee or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full bg-white dark:bg-dark-card border border-slate-200 dark:border-github-dark-border rounded-lg text-xs text-slate-700 dark:text-github-dark-text focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* Department Dropdown */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-github-dark-border rounded-lg text-xs text-slate-700 dark:text-github-dark-text focus:outline-none"
                        >
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="text-xs text-slate-400 dark:text-github-dark-muted">
                    Showing <strong>{filteredEmployees.length}</strong> of <strong>{totalEmployeesCount}</strong> registered employee files
                </div>
            </div>

            {/* Employee Directory Table */}
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-github-dark-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50 dark:bg-github-dark-subtle border-b border-slate-200 dark:border-github-dark-border">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-github-dark-muted">Employee ID</th>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-github-dark-muted">Name</th>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-github-dark-muted">Department</th>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-github-dark-muted">Designation</th>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-github-dark-muted">Manager</th>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-github-dark-muted">Joining Date</th>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-github-dark-muted">Onboarding Progress</th>
                                <th className="px-6 py-4 font-bold text-slate-500 dark:text-github-dark-muted">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-slate-400 italic">
                                        Loading employee directory...
                                    </td>
                                </tr>
                            ) : filteredEmployees.length > 0 ? (
                                filteredEmployees.map((emp) => {
                                    const profile = getEmployeeProfile(emp.id, emp.name);
                                    const progress = getOnboardingProgress(profile.onboarding_checklist);
                                    
                                    return (
                                        <tr
                                            key={emp.id}
                                            onClick={() => handleSelectEmployee(emp)}
                                            className="hover:bg-slate-50 dark:hover:bg-github-dark-border/40 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4 font-mono font-medium text-[#0969da] dark:text-github-dark-accent">
                                                {emp.user_code}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-github-dark-text">
                                                {emp.name}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                {emp.department}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                {emp.designation}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                                {profile.reporting_manager}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono">
                                                {profile.joining_date}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 min-w-[120px]">
                                                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-300 ${
                                                                progress === 100 
                                                                    ? 'bg-emerald-500' 
                                                                    : progress > 50 
                                                                        ? 'bg-indigo-500' 
                                                                        : 'bg-amber-500'
                                                            }`} 
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-semibold">{progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                    emp.status === 'Active' 
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                                                }`}>
                                                    {emp.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-slate-400 italic">
                                        No employees found matching filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Profile Drawer Component */}
            <AnimatePresence>
                {selectedEmployee && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEmployee(null)}
                            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="fixed right-0 top-0 h-full w-full max-w-[950px] z-50 bg-white dark:bg-dark-card border-l border-slate-200 dark:border-github-dark-border shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-github-dark-border bg-slate-50 dark:bg-github-dark-subtle/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                                        {selectedEmployee.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-github-dark-text leading-tight">{selectedEmployee.name}</h3>
                                        <p className="text-[10px] text-slate-400 dark:text-github-dark-muted font-mono">{selectedEmployee.user_code} • {selectedEmployee.designation}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedEmployee(null)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Drawer Tabs Navigation */}
                            <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none border-b border-slate-100 dark:border-github-dark-border text-xs bg-slate-50/50 dark:bg-github-dark-subtle/10 px-2">
                                {[
                                    { id: 'profile', label: 'Profile Information', icon: <User size={14} /> },
                                    { id: 'checklist', label: 'Onboarding Checklist', icon: <CheckCircle2 size={14} /> },
                                    { id: 'documents', label: 'Document Files', icon: <FileText size={14} /> },
                                    { id: 'ai_verify', label: 'AI Auditor', icon: <Sparkles size={14} /> },
                                    { id: 'perf_goals', label: 'KPI & Goals', icon: <Award size={14} /> },
                                    { id: 'perf_reviews', label: 'Reviews & Ratings', icon: <FileText size={14} /> },
                                    { id: 'perf_analyzer', label: 'AI Performance', icon: <Sparkles size={14} /> }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setDrawerTab(tab.id)}
                                        className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-medium transition-all shrink-0 ${
                                            drawerTab === tab.id
                                                ? 'border-[#0969da] text-[#0969da] dark:border-github-dark-accent dark:text-[#f0f6fc]'
                                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-github-dark-muted dark:hover:text-slate-200'
                                        }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Drawer Body Area */}
                            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar text-xs">
                                
                                {/* Cycle selector banner for performance tabs */}
                                {['perf_goals', 'perf_reviews', 'perf_analyzer'].includes(drawerTab) && (
                                    <div className="bg-slate-50 dark:bg-github-dark-subtle/30 border border-slate-200 dark:border-github-dark-border p-3 rounded-xl flex items-center justify-between gap-4 mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Appraisal Period:</span>
                                            <select
                                                value={selectedCycleId}
                                                onChange={(e) => setSelectedCycleId(e.target.value)}
                                                className="px-2 py-1 bg-white dark:bg-dark-card border border-slate-200 dark:border-github-dark-border rounded text-[11px] text-slate-700 dark:text-github-dark-text focus:outline-none cursor-pointer"
                                            >
                                                {cycles.map(cycle => (
                                                    <option key={cycle.id} value={cycle.id}>{cycle.name} ({cycle.status})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 rounded">
                                            Evaluations
                                        </span>
                                    </div>
                                )}
                                
                                {/* TAB 1: PROFILE INFORMATION */}
                                {drawerTab === 'profile' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-slate-800 dark:text-github-dark-text uppercase tracking-wider text-[10px]">Employment & Personal Master Profile</h4>
                                            {!isEditMode ? (
                                                <button
                                                    onClick={() => setIsEditMode(true)}
                                                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/50 rounded-lg font-medium transition-all"
                                                >
                                                    Edit Details
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setIsEditMode(false)}
                                                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-github-dark-border rounded-lg font-medium transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>

                                        <form onSubmit={handleInfoSubmit} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                {/* Personal Section */}
                                            <div className="bg-slate-50/50 dark:bg-github-dark-subtle/20 p-4 rounded-xl border border-slate-100 dark:border-github-dark-border/40 space-y-4">
                                                <h5 className="font-bold text-indigo-600 dark:text-indigo-400 border-b border-indigo-100/50 dark:border-indigo-900/20 pb-2">Personal Information</h5>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-400 dark:text-github-dark-muted font-bold uppercase">Full Name</label>
                                                        <p className="font-semibold text-slate-700 dark:text-slate-200 py-1">{selectedEmployee.name}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-400 dark:text-github-dark-muted font-bold uppercase">Contact Email</label>
                                                        <p className="font-semibold text-slate-700 dark:text-slate-200 py-1 font-mono">{selectedEmployee.email || '-'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-400 dark:text-github-dark-muted font-bold uppercase">Phone Number</label>
                                                        <p className="font-semibold text-slate-700 dark:text-slate-200 py-1 font-mono">{selectedEmployee.phone || '-'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-400 dark:text-github-dark-muted font-bold uppercase">Date of Birth</label>
                                                        {isEditMode ? (
                                                            <input
                                                                type="date"
                                                                name="dob"
                                                                defaultValue={selectedEmployee.profile.dob}
                                                                className="w-full px-2 py-1 bg-white dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded text-xs"
                                                            />
                                                        ) : (
                                                            <p className="font-semibold text-slate-700 dark:text-slate-200 py-1 font-mono">{selectedEmployee.profile.dob}</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-400 dark:text-github-dark-muted font-bold uppercase">Gender</label>
                                                        {isEditMode ? (
                                                            <select
                                                                name="gender"
                                                                defaultValue={selectedEmployee.profile.gender}
                                                                className="w-full px-2 py-1 bg-white dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded text-xs"
                                                            >
                                                                <option value="Male">Male</option>
                                                                <option value="Female">Female</option>
                                                                <option value="Other">Other</option>
                                                            </select>
                                                        ) : (
                                                            <p className="font-semibold text-slate-700 dark:text-slate-200 py-1">{selectedEmployee.profile.gender}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-slate-400 dark:text-github-dark-muted font-bold uppercase">Correspondence Address</label>
                                                    {isEditMode ? (
                                                        <textarea
                                                            name="address"
                                                            rows="2"
                                                            defaultValue={selectedEmployee.profile.address}
                                                            className="w-full px-2 py-1 bg-white dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded text-xs focus:outline-none"
                                                        />
                                                    ) : (
                                                        <p className="font-semibold text-slate-700 dark:text-slate-200 py-1 leading-relaxed">{selectedEmployee.profile.address}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Employment Section */}
                                            <div className="bg-slate-50/50 dark:bg-github-dark-subtle/20 p-4 rounded-xl border border-slate-100 dark:border-github-dark-border/40 space-y-4">
                                                <h5 className="font-bold text-indigo-600 dark:text-indigo-400 border-b border-indigo-100/50 dark:border-indigo-900/20 pb-2">Employment Information</h5>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-400 dark:text-github-dark-muted font-bold uppercase">Employee Code</label>
                                                        <p className="font-semibold text-slate-700 dark:text-slate-200 py-1 font-mono">{selectedEmployee.user_code}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-400 dark:text-github-dark-muted font-bold uppercase">Department</label>
                                                        <p className="font-semibold text-slate-700 dark:text-slate-200 py-1">{selectedEmployee.department}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-400 dark:text-github-dark-muted font-bold uppercase">Designation</label>
                                                        <p className="font-semibold text-slate-700 dark:text-slate-200 py-1">{selectedEmployee.designation}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-400 dark:text-github-dark-muted font-bold uppercase">Joining Date</label>
                                                        {isEditMode ? (
                                                            <input
                                                                type="date"
                                                                name="joining_date"
                                                                defaultValue={selectedEmployee.profile.joining_date}
                                                                className="w-full px-2 py-1 bg-white dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded text-xs"
                                                            />
                                                        ) : (
                                                            <p className="font-semibold text-slate-700 dark:text-slate-200 py-1 font-mono">{selectedEmployee.profile.joining_date}</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-400 dark:text-github-dark-muted font-bold uppercase">Employment Type</label>
                                                        {isEditMode ? (
                                                            <select
                                                                name="employment_type"
                                                                defaultValue={selectedEmployee.profile.employment_type}
                                                                className="w-full px-2 py-1 bg-white dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded text-xs"
                                                            >
                                                                <option value="Full-time">Full-time</option>
                                                                <option value="Part-time">Part-time</option>
                                                                <option value="Contract">Contract</option>
                                                                <option value="Intern">Intern</option>
                                                            </select>
                                                        ) : (
                                                            <p className="font-semibold text-slate-700 dark:text-slate-200 py-1">{selectedEmployee.profile.employment_type}</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-400 dark:text-github-dark-muted font-bold uppercase">Work Location</label>
                                                        {isEditMode ? (
                                                            <input
                                                                type="text"
                                                                name="work_location"
                                                                defaultValue={selectedEmployee.profile.work_location}
                                                                className="w-full px-2 py-1 bg-white dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded text-xs"
                                                            />
                                                        ) : (
                                                            <p className="font-semibold text-slate-700 dark:text-slate-200 py-1">{selectedEmployee.profile.work_location}</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1 col-span-2">
                                                        <label className="text-[10px] text-slate-400 dark:text-github-dark-muted font-bold uppercase">Reporting Manager</label>
                                                        {isEditMode ? (
                                                            <input
                                                                type="text"
                                                                name="reporting_manager"
                                                                defaultValue={selectedEmployee.profile.reporting_manager}
                                                                className="w-full px-2 py-1 bg-white dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded text-xs"
                                                            />
                                                        ) : (
                                                            <p className="font-semibold text-slate-700 dark:text-slate-200 py-1">{selectedEmployee.profile.reporting_manager}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            </div>

                                            {isEditMode && (
                                                <button
                                                    type="submit"
                                                    className="w-full py-2 bg-[#0969da] hover:bg-[#0969da]/90 text-white rounded-lg font-bold flex justify-center items-center gap-1.5 shadow-sm transition-all"
                                                >
                                                    <Check size={16} /> Save Changes
                                                </button>
                                            )}
                                        </form>
                                    </div>
                                )}

                                {/* TAB 2: ONBOARDING CHECKLIST */}
                                {drawerTab === 'checklist' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-slate-800 dark:text-github-dark-text uppercase tracking-wider text-[10px]">Onboarding Stage Tracking</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-400">Overall Progress:</span>
                                                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-full font-bold">
                                                    {getOnboardingProgress(selectedEmployee.profile.onboarding_checklist)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-github-dark-subtle/20 p-4 rounded-xl border border-slate-100 dark:border-github-dark-border/40 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                                    <div 
                                                        className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                                                        style={{ width: `${getOnboardingProgress(selectedEmployee.profile.onboarding_checklist)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                                                Toggle items below to record checklist progress for onboarding. Changes persist in realtime.
                                            </p>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                                {CHECKLIST_ITEMS.map((item) => {
                                                    const checked = selectedEmployee.profile.onboarding_checklist[item.key];
                                                    return (
                                                        <div 
                                                            key={item.key} 
                                                            onClick={() => handleChecklistToggle(item.key)}
                                                            className="flex items-center justify-between p-3 bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-github-dark-subtle/10 border border-slate-200 dark:border-github-dark-border/60 rounded-xl cursor-pointer transition-all hover:shadow-sm"
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                                                    checked 
                                                                        ? 'bg-[#0969da] border-transparent text-white' 
                                                                        : 'border-slate-350 dark:border-slate-750 bg-white dark:bg-github-dark-bg'
                                                                }`}>
                                                                    {checked && <Check size={10} strokeWidth={4} />}
                                                                </div>
                                                                <span className={`font-semibold ${checked ? 'text-slate-400 line-through' : 'text-slate-750 dark:text-slate-250'}`}>
                                                                    {item.label}
                                                                </span>
                                                            </div>
                                                            {checked ? (
                                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                                                                    <CheckCircle2 size={12} /> Done
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-amber-500 dark:text-amber-400 font-bold flex items-center gap-0.5">
                                                                    <Clock size={12} /> Pending
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: DOCUMENT UPLOADS */}
                                {drawerTab === 'documents' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-slate-800 dark:text-github-dark-text uppercase tracking-wider text-[10px]">Document Collection & Status</h4>
                                            <span className="text-[10px] text-slate-400">
                                                {Object.keys(selectedEmployee.profile.documents).length} document files uploaded
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {DOCUMENT_CATEGORIES.map(category => {
                                                const uploadedInCategory = category.items.filter(item => selectedEmployee.profile.documents[item.key]?.uploaded).length;
                                                return (
                                                    <div 
                                                        key={category.id} 
                                                        className="border border-slate-200 dark:border-github-dark-border rounded-xl overflow-hidden"
                                                    >
                                                        <div className="bg-slate-50 dark:bg-github-dark-subtle/50 px-4 py-3 flex justify-between items-center border-b border-slate-100 dark:border-github-dark-border">
                                                            <div className="flex items-center gap-2">
                                                                <Building size={14} className="text-indigo-500" />
                                                                <span className="font-bold text-slate-800 dark:text-github-dark-text">{category.name}</span>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                {uploadedInCategory} / {category.items.length} uploaded
                                                            </span>
                                                        </div>
                                                        <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800/30">
                                                            {category.items.map(item => {
                                                                const doc = selectedEmployee.profile.documents[item.key];
                                                                return (
                                                                    <div key={item.key} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                                        <div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                                                                                {item.required ? (
                                                                                    <span className="text-[9px] px-1 bg-red-50 text-red-500 border border-red-100 rounded">Required</span>
                                                                                ) : (
                                                                                    <span className="text-[9px] px-1 bg-slate-50 text-slate-400 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded">Optional</span>
                                                                                )}
                                                                            </div>
                                                                            {doc?.uploaded ? (
                                                                                <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                                                                                    <File size={10} /> {doc.fileName} • Uploaded on {doc.uploadedAt}
                                                                                </p>
                                                                            ) : (
                                                                                <p className="text-[10px] text-slate-400 italic mt-0.5">Not submitted yet</p>
                                                                            )}
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            {doc?.uploaded ? (
                                                                                <>
                                                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                                                        doc.status === 'Verified' 
                                                                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                                                                                            : doc.status === 'Expired' 
                                                                                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' 
                                                                                                : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                                                                                    }`}>
                                                                                        {doc.status}
                                                                                    </span>
                                                                                    <button 
                                                                                        onClick={() => handleDeleteDocument(item.key, item.name)}
                                                                                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 rounded"
                                                                                        title="Remove document"
                                                                                    >
                                                                                        <Trash size={12} />
                                                                                    </button>
                                                                                </>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => openUploadModal(item.key, item.name, category.id)}
                                                                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-github-dark-border rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
                                                                                >
                                                                                    <Upload size={10} /> Upload
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 4: AI DOCUMENT VERIFICATION AUDITOR */}
                                {drawerTab === 'ai_verify' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-slate-800 dark:text-github-dark-text uppercase tracking-wider text-[10px] flex items-center gap-1">
                                                <Sparkles size={14} className="text-indigo-500" />
                                                AI Document Verification Auditor
                                            </h4>
                                            {selectedEmployee.profile.ai_verification_results.lastChecked && (
                                                <span className="text-[9px] text-slate-400 font-mono">
                                                    Audited: {selectedEmployee.profile.ai_verification_results.lastChecked}
                                                </span>
                                            )}
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-github-dark-subtle/20 p-5 rounded-xl border border-slate-100 dark:border-github-dark-border/40 space-y-4">
                                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                                                The AI Engine will perform real-time verification checks on all uploaded files. It cross-references document OCR readouts, checks validity dates, and flags missing files.
                                            </p>

                                            {isVerifying ? (
                                                <div className="py-8 text-center flex flex-col items-center gap-2">
                                                    <RefreshCw className="animate-spin text-indigo-600 dark:text-indigo-400" size={24} />
                                                    <span className="font-bold text-indigo-700 dark:text-indigo-400 animate-pulse">Scanning and Auditing Document Packages...</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={runAiVerification}
                                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex justify-center items-center gap-1.5 shadow-md shadow-indigo-100 dark:shadow-none transition-all active:scale-98"
                                                >
                                                    <Sparkles size={14} /> Run AI Document Audit
                                                </button>
                                            )}

                                            {/* Results display */}
                                            {!isVerifying && selectedEmployee.profile.ai_verification_results.lastChecked && (
                                                <div className="space-y-4 border-t border-slate-200 dark:border-github-dark-border/40 pt-4">
                                                    <h5 className="font-bold text-slate-800 dark:text-github-dark-text">AI Verification Findings</h5>
                                                    
                                                    {/* Missing Docs */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase">
                                                            <XCircle size={12} /> Missing Documents ({selectedEmployee.profile.ai_verification_results.missing_documents.length})
                                                        </div>
                                                        {selectedEmployee.profile.ai_verification_results.missing_documents.length > 0 ? (
                                                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 pl-1">
                                                                {selectedEmployee.profile.ai_verification_results.missing_documents.map((d, i) => (
                                                                    <li key={i}>{d} is required but missing</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-slate-400 italic pl-1">All required documents have been uploaded.</p>
                                                        )}
                                                    </div>

                                                    {/* Expired Docs */}
                                                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-github-dark-border/20">
                                                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase">
                                                            <AlertCircle size={12} /> Expired Documents ({selectedEmployee.profile.ai_verification_results.expired_documents.length})
                                                        </div>
                                                        {selectedEmployee.profile.ai_verification_results.expired_documents.length > 0 ? (
                                                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 pl-1">
                                                                {selectedEmployee.profile.ai_verification_results.expired_documents.map((d, i) => (
                                                                    <li key={i}>{d}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-slate-400 italic pl-1">No validity expiration warnings found.</p>
                                                        )}
                                                    </div>

                                                    {/* Mismatched Info */}
                                                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-github-dark-border/20">
                                                        <div className="flex items-center gap-1 text-red-500 font-bold text-[10px] uppercase">
                                                            <AlertTriangle size={12} /> Mismatched Information ({selectedEmployee.profile.ai_verification_results.mismatched_information.length})
                                                        </div>
                                                        {selectedEmployee.profile.ai_verification_results.mismatched_information.length > 0 ? (
                                                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1 pl-1">
                                                                {selectedEmployee.profile.ai_verification_results.mismatched_information.map((d, i) => (
                                                                    <li key={i}>{d}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-slate-400 italic pl-1">All document text matches employee record fields.</p>
                                                        )}
                                                    </div>

                                                    {/* Overall Status */}
                                                    <div className="bg-slate-100 dark:bg-github-dark-bg p-3 rounded-lg flex items-center justify-between mt-4">
                                                        <span className="font-bold text-slate-500">Audit Health Result:</span>
                                                        {selectedEmployee.profile.ai_verification_results.missing_documents.length === 0 &&
                                                         selectedEmployee.profile.ai_verification_results.expired_documents.length === 0 &&
                                                         selectedEmployee.profile.ai_verification_results.mismatched_information.length === 0 ? (
                                                            <span className="text-emerald-600 dark:text-emerald-400 font-black uppercase flex items-center gap-1">
                                                                <CheckCircle2 size={14} /> Clear (100% Passed)
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-600 dark:text-red-400 font-black uppercase flex items-center gap-1">
                                                                <ShieldAlert size={14} /> Review Flagged Items
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 5: KPI & GOALS */}
                                {drawerTab === 'perf_goals' && (
                                    <KpiGoalSheets 
                                        employee={selectedEmployee} 
                                        selectedCycleId={selectedCycleId} 
                                    />
                                )}

                                {/* TAB 6: REVIEWS & RATINGS */}
                                {drawerTab === 'perf_reviews' && (
                                    <ReviewsAndRatings 
                                        employee={selectedEmployee} 
                                        selectedCycleId={selectedCycleId} 
                                    />
                                )}

                                {/* TAB 7: AI PERFORMANCE ANALYZER */}
                                {drawerTab === 'perf_analyzer' && (
                                    <AiPerformanceAnalyzer 
                                        employee={selectedEmployee} 
                                        selectedCycleId={selectedCycleId} 
                                    />
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Document Upload Dialog */}
            {uploadModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[2px] font-sans text-xs">
                    <div className="w-full max-w-md bg-white dark:bg-dark-card border border-slate-200 dark:border-github-dark-border p-6 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-github-dark-text">Upload {uploadModal.docName}</h3>
                                <p className="text-[10px] text-slate-400">Configure file parameters and simulate OCR AI verification checks.</p>
                            </div>
                            <button 
                                onClick={() => setUploadModal(prev => ({ ...prev, isOpen: false }))}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleDocumentUploadSave} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase block">File Name</label>
                                <input
                                    type="text"
                                    required
                                    value={uploadForm.fileName}
                                    onChange={(e) => setUploadForm({ ...uploadForm, fileName: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-github-dark-subtle/30 rounded-lg"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase block">Name written on Document (For OCR Match)</label>
                                <input
                                    type="text"
                                    required
                                    value={uploadForm.nameOnDoc}
                                    onChange={(e) => setUploadForm({ ...uploadForm, nameOnDoc: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-github-dark-subtle/30 rounded-lg text-xs"
                                />
                                <p className="text-[9px] text-slate-400">Modify this field to test the <strong>AI Mismatched Information</strong> trigger.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase block">Expiration Date (Optional)</label>
                                <input
                                    type="date"
                                    value={uploadForm.expiryDate}
                                    onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-github-dark-subtle/30 rounded-lg text-xs"
                                />
                                <p className="text-[9px] text-slate-400">Set this to a past date to test the <strong>AI Expired Documents</strong> warnings.</p>
                            </div>

                            {/* Simulation Checkboxes */}
                            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-lg border border-indigo-100/30 space-y-2">
                                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">Simulate Edge Case Flagging</span>
                                
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="expiredSim"
                                        checked={uploadForm.isExpiredSim}
                                        onChange={(e) => setUploadForm({ ...uploadForm, isExpiredSim: e.target.checked })}
                                        className="rounded border-slate-300"
                                    />
                                    <label htmlFor="expiredSim" className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                                        Force Document Expiration Warning
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="mismatchSim"
                                        checked={uploadForm.isMismatchSim}
                                        onChange={(e) => setUploadForm({ ...uploadForm, isMismatchSim: e.target.checked })}
                                        className="rounded border-slate-300"
                                    />
                                    <label htmlFor="mismatchSim" className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                                        Force Name Mismatch Warning
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 bg-[#0969da] hover:bg-[#0969da]/90 text-white rounded-xl font-bold flex justify-center items-center gap-1.5 shadow-sm"
                            >
                                <Upload size={14} /> Submit Document Upload
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default EmployeeMaster;
