import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { labourService } from '../../services/labourService';
import { toast } from 'react-toastify';
import {
    Hammer, Plus, Search, Building, Calendar, DollarSign, Clock,
    UserPlus, Edit2, Trash2, Save, AlertTriangle, CheckCircle,
    XCircle, Info, HelpCircle, ChevronRight, User, Phone, Briefcase
} from 'lucide-react';

const LabourManagement = () => {
    // Navigation / Tab state
    const [activeTab, setActiveTab] = useState('sites'); // 'sites', 'labours', 'attendance', 'finances'

    // Data States
    const [sites, setSites] = useState([]);
    const [labours, setLabours] = useState([]);
    const [financeSummary, setFinanceSummary] = useState([]);
    const [monthDetails, setMonthDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    // Filter/Search States
    const [siteSearch, setSiteSearch] = useState('');
    const [labourSearch, setLabourSearch] = useState('');
    const [labourSiteFilter, setLabourSiteFilter] = useState('All');
    
    // Attendance States
    const [attendanceSiteId, setAttendanceSiteId] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRoster, setAttendanceRoster] = useState([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);

    // Monthly Grid States
    const [gridSiteId, setGridSiteId] = useState('');
    const [gridMonth, setGridMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [gridData, setGridData] = useState([]);
    const [gridLoading, setGridLoading] = useState(false);
    const [gridMonthDetails, setGridMonthDetails] = useState(null);

    // Modal Control States
    const [showSiteModal, setShowSiteModal] = useState(false);
    const [editingSite, setEditingSite] = useState(null);
    const [siteForm, setSiteForm] = useState({ site_name: '', location_details: '', status: 'Active' });

    const [showLabourModal, setShowLabourModal] = useState(false);
    const [editingLabour, setEditingLabour] = useState(null);
    const [labourForm, setLabourForm] = useState({
        name: '', phone: '', sex: 'Male', role: '',
        wage_type: 'Daily Wage', monthly_salary: '', allowed_leaves: '0', site_id: ''
    });

    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [advanceForm, setAdvanceForm] = useState({ labour_id: '', name: '', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });

    // ==========================================
    // DATA FETCHING HANDLERS
    // ==========================================

    const fetchSites = async () => {
        try {
            const data = await labourService.getAllSites();
            setSites(data);
            if (data.length > 0) {
                if (!attendanceSiteId) {
                    setAttendanceSiteId(data[0].site_id.toString());
                }
                if (!gridSiteId) {
                    setGridSiteId(data[0].site_id.toString());
                }
            }
        } catch (err) {
            toast.error(err.message || 'Failed to fetch sites');
        }
    };

    const fetchLabours = async () => {
        try {
            const data = await labourService.getAllLabours();
            setLabours(data);
        } catch (err) {
            toast.error(err.message || 'Failed to fetch labours');
        }
    };

    const fetchFinances = async () => {
        try {
            const res = await labourService.getFinancesSummary();
            setFinanceSummary(res.summary || []);
            setMonthDetails(res.monthDetails || null);
        } catch (err) {
            toast.error(err.message || 'Failed to fetch financial details');
        }
    };

    const fetchGridData = async () => {
        if (!gridSiteId || !gridMonth) return;
        setGridLoading(true);
        try {
            const res = await labourService.getMonthlyGridAttendance(gridSiteId, gridMonth);
            setGridData(res.grid || []);
            setGridMonthDetails(res.monthDetails || null);
        } catch (err) {
            toast.error(err.message || 'Failed to fetch monthly grid data');
            setGridData([]);
        }
        setGridLoading(false);
    };

    const loadTabInitialData = async (tab) => {
        setLoading(true);
        if (tab === 'sites') {
            await fetchSites();
        } else if (tab === 'labours') {
            await fetchSites();
            await fetchLabours();
        } else if (tab === 'attendance') {
            await fetchSites();
        } else if (tab === 'grid') {
            await fetchSites();
            await fetchGridData();
        } else if (tab === 'finances') {
            await fetchFinances();
        }
        setLoading(false);
    };

    useEffect(() => {
        loadTabInitialData(activeTab);
    }, [activeTab]);

    // Load Attendance roster when site or date changes
    const loadAttendanceRoster = async () => {
        if (!attendanceSiteId || !attendanceDate) return;
        setAttendanceLoading(true);
        try {
            const res = await labourService.getSiteAttendance(attendanceSiteId, attendanceDate);
            setAttendanceRoster(res.roster || []);
        } catch (err) {
            toast.error(err.message || 'Failed to fetch attendance roster');
            setAttendanceRoster([]);
        }
        setAttendanceLoading(false);
    };

    useEffect(() => {
        if (activeTab === 'attendance') {
            loadAttendanceRoster();
        }
    }, [attendanceSiteId, attendanceDate, activeTab]);

    useEffect(() => {
        if (activeTab === 'grid') {
            fetchGridData();
        }
    }, [gridSiteId, gridMonth, activeTab]);

    // ==========================================
    // SITE HANDLERS
    // ==========================================

    const handleSaveSite = async (e) => {
        e.preventDefault();
        try {
            if (editingSite) {
                await labourService.updateSite(editingSite.site_id, siteForm);
                toast.success('Site updated successfully');
            } else {
                await labourService.createSite(siteForm);
                toast.success('Site created successfully');
            }
            setShowSiteModal(false);
            setEditingSite(null);
            setSiteForm({ site_name: '', location_details: '', status: 'Active' });
            fetchSites();
        } catch (err) {
            toast.error(err.message || 'Failed to save site');
        }
    };

    const handleEditSite = (site) => {
        setEditingSite(site);
        setSiteForm({
            site_name: site.site_name,
            location_details: site.location_details || '',
            status: site.status
        });
        setShowSiteModal(true);
    };

    const handleDeleteSite = async (siteId) => {
        if (!window.confirm('Are you sure you want to delete this site? assigned labours will be unassigned.')) return;
        try {
            await labourService.deleteSite(siteId);
            toast.success('Site deleted successfully');
            fetchSites();
        } catch (err) {
            toast.error(err.message || 'Failed to delete site');
        }
    };

    // ==========================================
    // LABOUR HANDLERS
    // ==========================================

    const handleSaveLabour = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...labourForm,
                monthly_salary: Number(labourForm.monthly_salary),
                allowed_leaves: labourForm.wage_type === 'Fixed Salary' ? Number(labourForm.allowed_leaves) : 0,
                site_id: labourForm.site_id ? Number(labourForm.site_id) : null
            };

            if (editingLabour) {
                await labourService.updateLabour(editingLabour.labour_id, payload);
                toast.success('Labour profile updated successfully');
            } else {
                await labourService.createLabour(payload);
                toast.success('Labour profile created successfully');
            }
            setShowLabourModal(false);
            setEditingLabour(null);
            setLabourForm({
                name: '', phone: '', sex: 'Male', role: '',
                wage_type: 'Daily Wage', monthly_salary: '', allowed_leaves: '0', site_id: ''
            });
            fetchLabours();
        } catch (err) {
            toast.error(err.message || 'Failed to save labour worker');
        }
    };

    const handleEditLabour = (lab) => {
        setEditingLabour(lab);
        setLabourForm({
            name: lab.name,
            phone: lab.phone || '',
            sex: lab.sex || 'Male',
            role: lab.role,
            wage_type: lab.wage_type,
            monthly_salary: lab.monthly_salary,
            allowed_leaves: lab.allowed_leaves?.toString() || '0',
            site_id: lab.site_id?.toString() || ''
        });
        setShowLabourModal(true);
    };

    const handleDeleteLabour = async (labourId) => {
        if (!window.confirm('Are you sure you want to delete this labour worker? All history will be deleted.')) return;
        try {
            await labourService.deleteLabour(labourId);
            toast.success('Labour deleted successfully');
            fetchLabours();
        } catch (err) {
            toast.error(err.message || 'Failed to delete labour worker');
        }
    };

    // ==========================================
    // ATTENDANCE HANDLERS
    // ==========================================

    const handleStatusChange = (labourId, newStatus) => {
        setAttendanceRoster(prev =>
            prev.map(item => item.labour_id === labourId ? { ...item, status: newStatus } : item)
        );
    };

    const handleSaveAttendance = async () => {
        try {
            await labourService.saveSiteAttendance(attendanceSiteId, attendanceDate, attendanceRoster);
            toast.success('Daily attendance checklist saved successfully!');
            loadAttendanceRoster();
        } catch (err) {
            toast.error(err.message || 'Failed to save attendance roster');
        }
    };

    const getDaysInMonthArray = () => {
        if (!gridMonth) return [];
        const [yr, mo] = gridMonth.split('-');
        const year = Number(yr);
        const monthNum = Number(mo);
        const daysCount = new Date(year, monthNum, 0).getDate();
        
        const arr = [];
        for (let d = 1; d <= daysCount; d++) {
            const dateObj = new Date(year, monthNum - 1, d);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3).toUpperCase();
            arr.push({
                dayNum: d,
                dayName,
                dateStr: `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            });
        }
        return arr;
    };

    // ==========================================
    // FINANCES HANDLERS
    // ==========================================

    const handleOpenAdvance = (labour) => {
        setAdvanceForm({
            labour_id: labour.labour_id,
            name: labour.name,
            amount: '',
            date: new Date().toISOString().split('T')[0],
            notes: ''
        });
        setShowAdvanceModal(true);
    };

    const handleSaveAdvance = async (e) => {
        e.preventDefault();
        try {
            await labourService.logLabourAdvance({
                labour_id: Number(advanceForm.labour_id),
                amount: Number(advanceForm.amount),
                date: advanceForm.date,
                notes: advanceForm.notes
            });
            toast.success(`Advance logged successfully for ${advanceForm.name}`);
            setShowAdvanceModal(false);
            fetchFinances();
        } catch (err) {
            toast.error(err.message || 'Failed to log advance payment');
        }
    };

    // ==========================================
    // RENDERING
    // ==========================================

    return (
        <DashboardLayout title="Labour Management">
            <div className="space-y-6">
                
                {/* Upper tab switcher */}
                <div className="flex bg-[#f6f8fa] dark:bg-[#161b22] p-1 rounded-xl border border-[#d0d7de] dark:border-[#30363d] w-fit select-none">
                    {[
                        { id: 'sites', label: 'Overview & Sites', icon: <Building size={14} /> },
                        { id: 'labours', label: 'Labours Directory', icon: <User size={14} /> },
                        { id: 'attendance', label: 'Daily Attendance', icon: <Calendar size={14} /> },
                        { id: 'grid', label: 'Attendance Grid', icon: <Calendar size={14} /> },
                        { id: 'finances', label: 'Salary & Finances', icon: <DollarSign size={14} /> }
                    ].map((tab) => {
                        const isSelected = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                    isSelected
                                        ? 'bg-white dark:bg-slate-700 text-[#0969da] dark:text-[#f0f6fc] shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Main Content Pane */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Clock className="animate-spin text-indigo-500" size={32} />
                        <span className="text-xs text-slate-500 font-medium">Fetching details...</span>
                    </div>
                ) : (
                    <>
                        {/* ==========================================
                            TAB 1: SITES & OVERVIEW
                            ========================================== */}
                        {activeTab === 'sites' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-4 rounded-xl shadow-sm">
                                    <div>
                                        <h3 className="font-bold text-sm text-slate-800 dark:text-github-dark-text">Project Construction Sites</h3>
                                        <p className="text-slate-450 dark:text-github-dark-muted text-[11px] mt-0.5">Manage building sites and keep track of labour workforce counts assigned to each location.</p>
                                    </div>
                                    <button
                                        onClick={() => { setEditingSite(null); setSiteForm({ site_name: '', location_details: '', status: 'Active' }); setShowSiteModal(true); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                    >
                                        <Plus size={14} />
                                        <span>Create Site</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {sites.length === 0 ? (
                                        <div className="col-span-full border border-dashed border-slate-300 dark:border-github-dark-border rounded-xl p-10 text-center">
                                            <Building className="mx-auto text-slate-300 dark:text-slate-700 mb-2" size={32} />
                                            <h4 className="text-xs font-bold text-slate-500">No Construction Sites Found</h4>
                                            <p className="text-[10px] text-slate-400 mt-1">Create a site first to start assigning labour forces.</p>
                                        </div>
                                    ) : (
                                        sites.map(site => (
                                            <div key={site.site_id} className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-xl p-4 shadow-sm hover:shadow transition-all flex flex-col justify-between h-40">
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-sm text-slate-800 dark:text-github-dark-text">{site.site_name}</h4>
                                                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                                                            site.status === 'Active'
                                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                                                                : site.status === 'Completed'
                                                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}>
                                                            {site.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 dark:text-github-dark-muted mt-2 min-h-[3em] line-clamp-2">
                                                        {site.location_details || 'No location details registered.'}
                                                    </p>
                                                </div>

                                                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-github-dark-border/40 text-xs">
                                                    <span className="text-slate-400 dark:text-github-dark-muted text-[10px]">
                                                        Created {new Date(site.created_at).toLocaleDateString()}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditSite(site)}
                                                            className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-github-dark-border"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSite(site.site_id)}
                                                            className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded border border-slate-200 dark:border-github-dark-border"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ==========================================
                            TAB 2: LABOURS DIRECTORY
                            ========================================== */}
                        {activeTab === 'labours' && (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-4 rounded-xl shadow-sm">
                                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                        <div className="relative w-full sm:w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search labour by name or role..."
                                                value={labourSearch}
                                                onChange={(e) => setLabourSearch(e.target.value)}
                                                className="pl-9 pr-4 py-1.5 w-full bg-slate-50 dark:bg-github-dark-subtle/50 border border-slate-200 dark:border-github-dark-border rounded-lg text-xs text-slate-700 dark:text-github-dark-text focus:outline-none"
                                            />
                                        </div>
                                        <select
                                            value={labourSiteFilter}
                                            onChange={(e) => setLabourSiteFilter(e.target.value)}
                                            className="px-3 py-1.5 bg-slate-50 dark:bg-github-dark-subtle/50 border border-slate-200 dark:border-github-dark-border rounded-lg text-xs text-slate-700 dark:text-github-dark-text cursor-pointer"
                                        >
                                            <option value="All">All Sites</option>
                                            <option value="Unassigned">Unassigned</option>
                                            {sites.map(s => (
                                                <option key={s.site_id} value={s.site_id}>{s.site_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        onClick={() => { setEditingLabour(null); setLabourForm({ name: '', phone: '', sex: 'Male', role: '', wage_type: 'Daily Wage', monthly_salary: '', allowed_leaves: '0', site_id: '' }); setShowLabourModal(true); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                    >
                                        <UserPlus size={14} />
                                        <span>Add Labour Worker</span>
                                    </button>
                                </div>

                                <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-xl shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-github-dark-border/40 text-slate-450 dark:text-github-dark-muted font-bold border-b border-slate-200 dark:border-github-dark-border">
                                                <th className="p-3">Labour Name</th>
                                                <th className="p-3">Role / Designation</th>
                                                <th className="p-3">Assigned Site</th>
                                                <th className="p-3">Wage Model</th>
                                                <th className="p-3">Monthly Salary</th>
                                                <th className="p-3">Paid Leaves Limit</th>
                                                <th className="p-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {labours
                                                .filter(lab => {
                                                    const matchesSearch = lab.name.toLowerCase().includes(labourSearch.toLowerCase()) ||
                                                        lab.role.toLowerCase().includes(labourSearch.toLowerCase());

                                                    let matchesSite = true;
                                                    if (labourSiteFilter === 'Unassigned') {
                                                        matchesSite = lab.site_id === null;
                                                    } else if (labourSiteFilter !== 'All') {
                                                        matchesSite = lab.site_id === Number(labourSiteFilter);
                                                    }

                                                    return matchesSearch && matchesSite;
                                                })
                                                .map(lab => (
                                                    <tr key={lab.labour_id} className="border-b border-slate-100 dark:border-github-dark-border/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                                        <td className="p-3 font-semibold text-slate-800 dark:text-github-dark-text">
                                                            <div>{lab.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{lab.phone || 'No phone'} | {lab.sex}</div>
                                                        </td>
                                                        <td className="p-3 text-slate-600 dark:text-slate-400">{lab.role}</td>
                                                        <td className="p-3 text-slate-600 dark:text-slate-400">
                                                            {lab.site_name ? (
                                                                <span className="flex items-center gap-1">
                                                                    <Building size={12} className="text-slate-400" />
                                                                    {lab.site_name}
                                                                </span>
                                                            ) : (
                                                                <span className="text-amber-500 italic">Unassigned</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                lab.wage_type === 'Fixed Salary'
                                                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                                                                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                                                            }`}>
                                                                {lab.wage_type}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                                                            ₹{Number(lab.monthly_salary).toLocaleString()}
                                                        </td>
                                                        <td className="p-3 text-slate-600 dark:text-slate-400">
                                                            {lab.wage_type === 'Fixed Salary' ? `${lab.allowed_leaves} days/mo` : 'N/A'}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <div className="flex justify-end gap-1.5">
                                                                <button
                                                                    onClick={() => handleEditLabour(lab)}
                                                                    className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-github-dark-border"
                                                                >
                                                                    <Edit2 size={12} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteLabour(lab.labour_id)}
                                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded border border-slate-200 dark:border-github-dark-border"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ==========================================
                            TAB 3: DAILY ATTENDANCE CHECKLIST
                            ========================================== */}
                        {activeTab === 'attendance' && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-4 rounded-xl shadow-sm">
                                    <div className="flex-1 flex flex-col gap-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Select Site</label>
                                        <select
                                            value={attendanceSiteId}
                                            onChange={(e) => setAttendanceSiteId(e.target.value)}
                                            className="px-3 py-2 bg-slate-50 dark:bg-github-dark-subtle/50 border border-slate-200 dark:border-github-dark-border rounded-lg text-xs font-semibold text-slate-700 dark:text-github-dark-text cursor-pointer focus:outline-none"
                                        >
                                            {sites.map(s => (
                                                <option key={s.site_id} value={s.site_id}>{s.site_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Select Date</label>
                                        <input
                                            type="date"
                                            value={attendanceDate}
                                            onChange={(e) => setAttendanceDate(e.target.value)}
                                            className="px-3 py-1.5 bg-slate-50 dark:bg-github-dark-subtle/50 border border-slate-200 dark:border-github-dark-border rounded-lg text-xs font-semibold text-slate-700 dark:text-github-dark-text focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {attendanceLoading ? (
                                    <div className="flex justify-center py-20">
                                        <Clock className="animate-spin text-indigo-500" size={28} />
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-xl shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-slate-200 dark:border-github-dark-border flex justify-between items-center bg-slate-50/50 dark:bg-github-dark-border/10">
                                            <div>
                                                <span className="font-bold text-xs text-slate-800 dark:text-github-dark-text">Daily Roll Call Checklist</span>
                                                <span className="ml-2 text-[10px] text-slate-450 dark:text-github-dark-muted font-mono">{attendanceRoster.length} workers registered</span>
                                            </div>
                                            <button
                                                disabled={attendanceRoster.length === 0}
                                                onClick={handleSaveAttendance}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                                            >
                                                <Save size={14} />
                                                <span>Save Attendance</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-5 bg-slate-50/30 dark:bg-transparent">
                                            {attendanceRoster.length === 0 ? (
                                                <div className="col-span-full py-10 text-center text-slate-450 dark:text-github-dark-muted italic">
                                                    No labours assigned to this site. Assign labours in the Labours Directory tab.
                                                </div>
                                            ) : (
                                                attendanceRoster.map(item => (
                                                    <div key={item.labour_id} className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-xl p-4 flex flex-col justify-between gap-4 shadow-sm hover:shadow hover:border-slate-300 dark:hover:border-github-dark-border-strong transition-all duration-200">
                                                        <div>
                                                            <h4 className="font-bold text-xs text-slate-800 dark:text-github-dark-text truncate">{item.name}</h4>
                                                            <p className="text-[10px] text-slate-450 dark:text-github-dark-muted font-mono uppercase mt-0.5">{item.role}</p>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-github-dark-border/40">
                                                            {[
                                                                { id: 'Present', label: 'Full Day', activeColor: 'bg-emerald-500 text-white dark:bg-emerald-600', inactiveColor: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-github-dark-border/60' },
                                                                { id: 'Half Day', label: 'Half Day', activeColor: 'bg-amber-500 text-white dark:bg-amber-600', inactiveColor: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-github-dark-border/60' },
                                                                { id: 'Absent', label: 'Absent', activeColor: 'bg-rose-500 text-white dark:bg-rose-600', inactiveColor: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-github-dark-border/60' },
                                                                { id: 'Paid Leave', label: 'Paid Leave', activeColor: 'bg-indigo-500 text-white dark:bg-indigo-600', inactiveColor: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-github-dark-border/60' }
                                                            ].map(statusOpt => {
                                                                const isSelected = item.status === statusOpt.id;
                                                                return (
                                                                    <button
                                                                        key={statusOpt.id}
                                                                        onClick={() => handleStatusChange(item.labour_id, statusOpt.id)}
                                                                        className={`py-1.5 px-2 rounded-lg text-[9px] font-bold text-center transition-all cursor-pointer ${
                                                                            isSelected ? statusOpt.activeColor + ' shadow-sm' : statusOpt.inactiveColor
                                                                        }`}
                                                                    >
                                                                        {statusOpt.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ==========================================
                            TAB 3.5: ATTENDANCE GRID VIEW
                            ========================================== */}
                        {activeTab === 'grid' && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-4 rounded-xl shadow-sm">
                                    <div className="flex-1 flex flex-col gap-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Select Site</label>
                                        <select
                                            value={gridSiteId}
                                            onChange={(e) => setGridSiteId(e.target.value)}
                                            className="px-3 py-2 bg-slate-50 dark:bg-github-dark-subtle/50 border border-slate-200 dark:border-github-dark-border rounded-lg text-xs font-semibold text-slate-700 dark:text-github-dark-text cursor-pointer focus:outline-none"
                                        >
                                            {sites.map(s => (
                                                <option key={s.site_id} value={s.site_id}>{s.site_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Select Month</label>
                                        <input
                                            type="month"
                                            value={gridMonth}
                                            onChange={(e) => setGridMonth(e.target.value)}
                                            className="px-3 py-1.5 bg-slate-50 dark:bg-github-dark-subtle/50 border border-slate-200 dark:border-github-dark-border rounded-lg text-xs font-semibold text-slate-700 dark:text-github-dark-text focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {gridLoading ? (
                                    <div className="flex justify-center py-20">
                                        <Clock className="animate-spin text-indigo-500" size={28} />
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-xl shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-slate-200 dark:border-github-dark-border bg-slate-50/50 dark:bg-github-dark-border/10">
                                            <h4 className="font-bold text-xs text-slate-800 dark:text-github-dark-text">Monthly Attendance Matrix</h4>
                                            <p className="text-[10px] text-slate-450 dark:text-github-dark-muted mt-0.5 font-mono">Horizontal scroll representation of roll calls</p>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                                                <thead>
                                                    <tr className="bg-slate-50/60 dark:bg-github-dark-border/20 border-b border-slate-200 dark:border-github-dark-border font-bold text-slate-450 dark:text-github-dark-muted">
                                                        <th className="p-4 sticky left-0 bg-white dark:bg-[#0d1117] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[150px] border-r border-slate-200 dark:border-github-dark-border">Worker Name / Role</th>
                                                        {getDaysInMonthArray().map(day => (
                                                            <th key={day.dateStr} className="p-2 text-center min-w-[44px]">
                                                                <div className="flex flex-col items-center">
                                                                    <span className="text-[8px] font-bold uppercase text-slate-400">{day.dayName}</span>
                                                                    <span className="text-[10px] font-black text-slate-700 dark:text-github-dark-text mt-0.5">{day.dayNum}</span>
                                                                </div>
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {gridData.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={getDaysInMonthArray().length + 1} className="p-10 text-center text-slate-400 italic">
                                                                No active labours found for this site in the selected period.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        gridData.map(row => (
                                                            <tr key={row.labour_id} className="border-b border-slate-150 dark:border-github-dark-border/40 hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                                                                <td className="p-4 sticky left-0 bg-white dark:bg-[#0d1117] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-200 dark:border-github-dark-border">
                                                                    <div className="font-bold text-slate-850 dark:text-github-dark-text text-xs">{row.name}</div>
                                                                    <div className="text-[9px] text-slate-400 dark:text-github-dark-muted font-mono mt-0.5">{row.role}</div>
                                                                </td>
                                                                {getDaysInMonthArray().map(day => {
                                                                    const status = row.attendance[day.dateStr];
                                                                    const dateObj = new Date(day.dateStr);
                                                                    const dayNum = dateObj.getDay();
                                                                    let cellContent = null;
                                                                    
                                                                    if (status === 'Present') {
                                                                        cellContent = (
                                                                            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-black shadow-sm" title="Present">P</span>
                                                                        );
                                                                    } else if (status === 'Half Day') {
                                                                        cellContent = (
                                                                            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-black shadow-sm" title="Half Day">HD</span>
                                                                        );
                                                                    } else if (status === 'Absent') {
                                                                        cellContent = (
                                                                            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black shadow-sm" title="Absent">A</span>
                                                                        );
                                                                    } else if (status === 'Paid Leave') {
                                                                        cellContent = (
                                                                            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-500 text-white text-[9px] font-black shadow-sm" title="Paid Leave">PL</span>
                                                                        );
                                                                    } else if (dayNum === 6) { // Saturday
                                                                        cellContent = (
                                                                            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[9px] font-bold">SA</span>
                                                                        );
                                                                    } else if (dayNum === 0) { // Sunday
                                                                        cellContent = (
                                                                            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 dark:bg-[#161b22] text-slate-500 dark:text-slate-400 text-[9px] font-bold">SU</span>
                                                                        );
                                                                    } else {
                                                                        cellContent = (
                                                                            <span className="text-slate-300 dark:text-slate-600">-</span>
                                                                        );
                                                                    }
                                                                    
                                                                    return (
                                                                        <td key={day.dateStr} className="p-2 text-center align-middle">
                                                                            <div className="flex justify-center items-center">
                                                                                {cellContent}
                                                                            </div>
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ==========================================
                            TAB 4: SALARY & FINANCES
                            ========================================== */}
                        {activeTab === 'finances' && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                                    <div>
                                        <h3 className="font-bold text-sm text-slate-800 dark:text-github-dark-text">Salary & Advance Ledger</h3>
                                        <p className="text-slate-450 dark:text-github-dark-muted text-[11px] mt-0.5">
                                            Dynamically pro-rated wage tracker. Pay scale totals recalculate daily based on marked attendance days.
                                        </p>
                                    </div>
                                    {monthDetails && (
                                        <div className="px-3 py-1.5 bg-slate-100 dark:bg-github-dark-border text-slate-600 dark:text-github-dark-text font-mono text-[10px] font-bold rounded-lg border border-slate-200 dark:border-github-dark-border/60">
                                            🗓️ JUNE MONTHLY PERIOD: DAYS ELAPSED {monthDetails.elapsedDays} OF {monthDetails.totalDays}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-xl shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-github-dark-border/40 text-slate-450 dark:text-github-dark-muted font-bold border-b border-slate-200 dark:border-github-dark-border">
                                                <th className="p-3">Labour Worker</th>
                                                <th className="p-3">Assigned Site</th>
                                                <th className="p-3">Attendance Stats</th>
                                                <th className="p-3">Base Salary</th>
                                                <th className="p-3 text-indigo-650 dark:text-indigo-400">Accrued Credit</th>
                                                <th className="p-3 text-amber-600">Advances Taken</th>
                                                <th className="p-3">Net Payable (Credits - Advances)</th>
                                                <th className="p-3 text-right pr-4">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {financeSummary.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="p-10 text-center text-slate-450 dark:text-github-dark-muted italic">
                                                        No active labours to compute ledger summaries for.
                                                    </td>
                                                </tr>
                                            ) : (
                                                financeSummary.map(row => {
                                                    const advanceAlert = row.advances_taken > row.accrued_credit;
                                                    return (
                                                        <tr key={row.labour_id} className="border-b border-slate-100 dark:border-github-dark-border/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                                            <td className="p-3 font-semibold text-slate-800 dark:text-github-dark-text">
                                                                <div>{row.name}</div>
                                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{row.role} | {row.wage_type}</div>
                                                            </td>
                                                            <td className="p-3 text-slate-600 dark:text-slate-400">{row.site_name}</td>
                                                            <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">
                                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{row.attendance.present}P</span> /{' '}
                                                                <span className="text-amber-550 dark:text-amber-500 font-bold">{row.attendance.half_day}HD</span> /{' '}
                                                                <span className="text-rose-500 font-bold">{row.attendance.absent}A</span> /{' '}
                                                                <span className="text-indigo-500 font-bold">{row.attendance.paid_leave || 0}PL</span>
                                                            </td>
                                                            <td className="p-3 text-slate-500">₹{row.monthly_salary.toLocaleString()}</td>
                                                            <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                                                                ₹{row.accrued_credit.toLocaleString()}
                                                            </td>
                                                            <td className="p-3 font-bold text-amber-500">
                                                                ₹{row.advances_taken.toLocaleString()}
                                                            </td>
                                                            <td className={`p-3 font-black text-sm ${advanceAlert ? 'text-rose-500' : 'text-slate-800 dark:text-github-dark-text'}`}>
                                                                <div className="flex items-center gap-1">
                                                                    <span>₹{row.net_payable.toLocaleString()}</span>
                                                                    {advanceAlert && (
                                                                        <AlertTriangle size={13} className="text-rose-500" title="Advances exceed accrued credit" />
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-right pr-4">
                                                                <button
                                                                    onClick={() => handleOpenAdvance(row)}
                                                                    className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 rounded transition-colors"
                                                                >
                                                                    Log Advance
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ==========================================
                    MODAL: SITE FORM (ADD/EDIT)
                    ========================================== */}
                {showSiteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
                            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-github-dark-border">
                                <h4 className="font-bold text-sm text-slate-800 dark:text-github-dark-text">
                                    {editingSite ? 'Edit Construction Site' : 'Create Construction Site'}
                                </h4>
                                <button onClick={() => setShowSiteModal(false)} className="text-slate-400 hover:text-slate-650"><XCircle size={18} /></button>
                            </div>
                            <form onSubmit={handleSaveSite} className="p-4 space-y-4 text-xs">
                                <div>
                                    <label className="block text-slate-450 font-semibold mb-1">Site Name</label>
                                    <input
                                        type="text"
                                        value={siteForm.site_name}
                                        onChange={(e) => setSiteForm({ ...siteForm, site_name: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-lg focus:outline-none"
                                        required
                                        placeholder="e.g., Phoenix Mall Project"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-450 font-semibold mb-1">Location Details / Address</label>
                                    <textarea
                                        value={siteForm.location_details}
                                        onChange={(e) => setSiteForm({ ...siteForm, location_details: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-lg focus:outline-none"
                                        rows={3}
                                        placeholder="Site physical address, gate number, coordinates, or notes."
                                    />
                                </div>
                                {editingSite && (
                                    <div>
                                        <label className="block text-slate-450 font-semibold mb-1">Status</label>
                                        <select
                                            value={siteForm.status}
                                            onChange={(e) => setSiteForm({ ...siteForm, status: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-lg focus:outline-none"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowSiteModal(false)}
                                        className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-lg font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ==========================================
                    MODAL: LABOUR FORM (ADD/EDIT)
                    ========================================== */}
                {showLabourModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
                            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-github-dark-border">
                                <h4 className="font-bold text-sm text-slate-800 dark:text-github-dark-text">
                                    {editingLabour ? 'Edit Labour Profile' : 'Add New Labour Worker'}
                                </h4>
                                <button onClick={() => setShowLabourModal(false)} className="text-slate-400 hover:text-slate-650"><XCircle size={18} /></button>
                            </div>
                            <form onSubmit={handleSaveLabour} className="p-4 grid grid-cols-2 gap-4 text-xs">
                                <div className="col-span-2">
                                    <label className="block text-slate-450 font-semibold mb-1">Labour Full Name</label>
                                    <input
                                        type="text"
                                        value={labourForm.name}
                                        onChange={(e) => setLabourForm({ ...labourForm, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-lg focus:outline-none"
                                        required
                                        placeholder="e.g., Ramesh Kumar"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-450 font-semibold mb-1">Contact Phone</label>
                                    <input
                                        type="tel"
                                        value={labourForm.phone}
                                        onChange={(e) => setLabourForm({ ...labourForm, phone: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-lg focus:outline-none"
                                        placeholder="10-digit mobile number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-450 font-semibold mb-1">Sex</label>
                                    <select
                                        value={labourForm.sex}
                                        onChange={(e) => setLabourForm({ ...labourForm, sex: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-lg focus:outline-none cursor-pointer"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-450 font-semibold mb-1">Role (free text input)</label>
                                    <input
                                        type="text"
                                        value={labourForm.role}
                                        onChange={(e) => setLabourForm({ ...labourForm, role: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-lg focus:outline-none"
                                        required
                                        placeholder="e.g., Mason, Carpenter, Helper"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-450 font-semibold mb-1">Assign Construction Site</label>
                                    <select
                                        value={labourForm.site_id}
                                        onChange={(e) => setLabourForm({ ...labourForm, site_id: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-lg focus:outline-none cursor-pointer"
                                    >
                                        <option value="">Unassigned / Independent</option>
                                        {sites.map(s => (
                                            <option key={s.site_id} value={s.site_id}>{s.site_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-450 font-semibold mb-1">Wage Model</label>
                                    <select
                                        value={labourForm.wage_type}
                                        onChange={(e) => setLabourForm({ ...labourForm, wage_type: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-lg focus:outline-none cursor-pointer"
                                    >
                                        <option value="Daily Wage">Daily Wage (strictly pro-rated)</option>
                                        <option value="Fixed Salary">Fixed Monthly Salary</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-450 font-semibold mb-1">Monthly Salary (INR)</label>
                                    <input
                                        type="number"
                                        value={labourForm.monthly_salary}
                                        onChange={(e) => setLabourForm({ ...labourForm, monthly_salary: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-lg focus:outline-none"
                                        required
                                        min="0"
                                        placeholder="e.g., 25000"
                                    />
                                </div>
                                {labourForm.wage_type === 'Fixed Salary' && (
                                    <div>
                                        <label className="block text-slate-450 font-semibold mb-1">Allowed Paid Leaves (per month)</label>
                                        <input
                                            type="number"
                                            value={labourForm.allowed_leaves}
                                            onChange={(e) => setLabourForm({ ...labourForm, allowed_leaves: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-lg focus:outline-none"
                                            min="0"
                                            placeholder="e.g., 2"
                                        />
                                    </div>
                                )}
                                {editingLabour && (
                                    <div className="col-span-2">
                                        <label className="block text-slate-450 font-semibold mb-1">Status</label>
                                        <select
                                            value={labourForm.status}
                                            onChange={(e) => setLabourForm({ ...labourForm, status: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-lg focus:outline-none cursor-pointer"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                )}

                                <div className="col-span-2 flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowLabourModal(false)}
                                        className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-lg font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ==========================================
                    MODAL: LOG ADVANCE SALARY
                    ========================================== */}
                {showAdvanceModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
                            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-github-dark-border">
                                <h4 className="font-bold text-sm text-slate-800 dark:text-github-dark-text flex items-center gap-1.5">
                                    <DollarSign size={16} className="text-amber-500" />
                                    <span>Log Salary Advance</span>
                                </h4>
                                <button onClick={() => setShowAdvanceModal(false)} className="text-slate-400 hover:text-slate-650"><XCircle size={18} /></button>
                            </div>
                            <form onSubmit={handleSaveAdvance} className="p-4 space-y-4 text-xs">
                                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3 rounded-lg text-slate-600 dark:text-slate-350">
                                    Logging salary advance for <strong>{advanceForm.name}</strong>. This amount will be automatically deducted from their next payroll payout credit.
                                </div>
                                <div>
                                    <label className="block text-slate-450 font-semibold mb-1">Advance Amount (INR)</label>
                                    <input
                                        type="number"
                                        value={advanceForm.amount}
                                        onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-lg focus:outline-none"
                                        required
                                        min="1"
                                        placeholder="e.g., 2000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-450 font-semibold mb-1">Logging Date</label>
                                    <input
                                        type="date"
                                        value={advanceForm.date}
                                        onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-lg focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-450 font-semibold mb-1">Notes / Description</label>
                                    <input
                                        type="text"
                                        value={advanceForm.notes}
                                        onChange={(e) => setAdvanceForm({ ...advanceForm, notes: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-lg focus:outline-none"
                                        placeholder="e.g., Festival Advance, Medical emergency"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanceModal(false)}
                                        className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-lg font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold shadow-sm"
                                    >
                                        Record Payment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default LabourManagement;
