import React, { useState, useEffect } from 'react';
import MobileDashboardLayout from '../../components/MobileDashboardLayout';
import { labourService } from '../../services/labourService';
import { toast } from 'react-toastify';
import {
    Building, Calendar, DollarSign, Clock, Plus, Search,
    UserPlus, Edit2, Trash2, Save, AlertTriangle, User, Phone, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileLabourManagement = () => {
    // Navigation / Tab state
    const [activeTab, setActiveTab] = useState('sites'); // 'sites', 'labours', 'attendance', 'finances'

    // Data States
    const [sites, setSites] = useState([]);
    const [labours, setLabours] = useState([]);
    const [financeSummary, setFinanceSummary] = useState([]);
    const [monthDetails, setMonthDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    // Filter/Search States
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

    const loadAttendanceRoster = async () => {
        if (!attendanceSiteId || !attendanceDate) return;
        setAttendanceLoading(true);
        try {
            const res = await labourService.getSiteAttendance(attendanceSiteId, attendanceDate);
            setAttendanceRoster(res.roster || []);
        } catch (err) {
            toast.error(err.message || 'Failed to fetch roster');
            setAttendanceRoster([]);
        }
        setAttendanceLoading(false);
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
                toast.success('Site updated');
            } else {
                await labourService.createSite(siteForm);
                toast.success('Site created');
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
        if (!window.confirm('Delete this site? Assigned labours will be unassigned.')) return;
        try {
            await labourService.deleteSite(siteId);
            toast.success('Site deleted');
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
                toast.success('Worker updated');
            } else {
                await labourService.createLabour(payload);
                toast.success('Worker added');
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
        if (!window.confirm('Delete this worker? All data will be deleted.')) return;
        try {
            await labourService.deleteLabour(labourId);
            toast.success('Worker deleted');
            fetchLabours();
        } catch (err) {
            toast.error(err.message || 'Failed to delete worker');
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
            toast.success('Daily attendance checklist saved!');
            loadAttendanceRoster();
        } catch (err) {
            toast.error(err.message || 'Failed to save attendance roster');
        }
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
            toast.success(`Advance logged for ${advanceForm.name}`);
            setShowAdvanceModal(false);
            fetchFinances();
        } catch (err) {
            toast.error(err.message || 'Failed to log advance');
        }
    };

    return (
        <MobileDashboardLayout title="Labour Management">
            <div className="space-y-4 pb-24 text-xs">
                
                {/* Status Tabs - Pill Style */}
                <div className="bg-slate-200/50 dark:bg-github-dark-border/50 p-1.5 flex rounded-2xl backdrop-blur-md border border-white/20 dark:border-white/5 sticky top-16 z-20">
                    {[
                        { id: 'sites', label: 'Sites' },
                        { id: 'labours', label: 'Labours' },
                        { id: 'attendance', label: 'Checklist' },
                        { id: 'grid', label: 'Grid' },
                        { id: 'finances', label: 'Ledger' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2.5 text-[10px] font-semibold rounded-xl transition-all ${
                                activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 transform scale-[1.02]'
                                    : 'text-slate-500 dark:text-github-dark-muted'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Clock className="animate-spin text-indigo-500" size={24} />
                        <span className="text-[10px] text-slate-400">Loading data...</span>
                    </div>
                ) : (
                    <>
                        {/* ==========================================
                            TAB 1: SITES
                            ========================================== */}
                        {activeTab === 'sites' && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-3.5 rounded-2xl">
                                    <span className="font-bold text-slate-700 dark:text-white">Active Projects</span>
                                    <button
                                        onClick={() => { setEditingSite(null); setSiteForm({ site_name: '', location_details: '', status: 'Active' }); setShowSiteModal(true); }}
                                        className="p-1.5 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Add Site
                                    </button>
                                </div>

                                {sites.length === 0 ? (
                                    <div className="p-10 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400">
                                        No construction sites found.
                                    </div>
                                ) : (
                                    sites.map(site => (
                                        <div key={site.site_id} className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-sm">
                                            <div>
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">{site.site_name}</h4>
                                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                                                        site.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {site.status}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 dark:text-github-dark-muted mt-1.5">{site.location_details || 'No details.'}</p>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-github-dark-border/40">
                                                <button onClick={() => handleEditSite(site)} className="p-1 text-slate-500 rounded border border-slate-200 dark:border-github-dark-border"><Edit2 size={12} /></button>
                                                <button onClick={() => handleDeleteSite(site.site_id)} className="p-1 text-red-500 rounded border border-slate-200 dark:border-github-dark-border"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* ==========================================
                            TAB 2: LABOURS DIRECTORY
                            ========================================== */}
                        {activeTab === 'labours' && (
                            <div className="space-y-3">
                                <div className="flex flex-col gap-2.5 bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-3 rounded-2xl">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Search worker by name or role..."
                                            value={labourSearch}
                                            onChange={(e) => setLabourSearch(e.target.value)}
                                            className="pl-8 pr-4 py-2 w-full bg-slate-50 dark:bg-github-dark-subtle/50 border border-slate-200 dark:border-github-dark-border rounded-xl text-xs text-slate-700 dark:text-github-dark-text focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            value={labourSiteFilter}
                                            onChange={(e) => setLabourSiteFilter(e.target.value)}
                                            className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl cursor-pointer"
                                        >
                                            <option value="All">All Sites</option>
                                            <option value="Unassigned">Unassigned</option>
                                            {sites.map(s => (
                                                <option key={s.site_id} value={s.site_id}>{s.site_name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => { setEditingLabour(null); setLabourForm({ name: '', phone: '', sex: 'Male', role: '', wage_type: 'Daily Wage', monthly_salary: '', allowed_leaves: '0', site_id: '' }); setShowLabourModal(true); }}
                                            className="px-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-1 shrink-0"
                                        >
                                            <Plus size={14} /> Add Labour
                                        </button>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    {labours
                                        .filter(lab => {
                                            const matchesSearch = lab.name.toLowerCase().includes(labourSearch.toLowerCase()) ||
                                                lab.role.toLowerCase().includes(labourSearch.toLowerCase());
                                            let matchesSite = true;
                                            if (labourSiteFilter === 'Unassigned') matchesSite = lab.site_id === null;
                                            else if (labourSiteFilter !== 'All') matchesSite = lab.site_id === Number(labourSiteFilter);
                                            return matchesSearch && matchesSite;
                                        })
                                        .map(lab => (
                                            <div key={lab.labour_id} className="bg-white dark:bg-github-dark-subtle p-3.5 rounded-2xl border border-slate-100 dark:border-github-dark-border shadow-sm flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 dark:text-white text-xs">{lab.name}</h4>
                                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{lab.role} | {lab.wage_type}</p>
                                                    <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wide flex items-center gap-1 font-semibold">
                                                        <Building size={10} />
                                                        {lab.site_name || 'Unassigned'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleEditLabour(lab)} className="p-2 text-slate-400 rounded-xl border border-slate-200 dark:border-github-dark-border"><Edit2 size={12} /></button>
                                                    <button onClick={() => handleDeleteLabour(lab.labour_id)} className="p-2 text-red-500 rounded-xl border border-slate-200 dark:border-github-dark-border"><Trash2 size={12} /></button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* ==========================================
                            TAB 3: ATTENDANCE CHECKLIST
                            ========================================== */}
                        {activeTab === 'attendance' && (
                            <div className="space-y-3">
                                <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-3.5 rounded-2xl grid grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] uppercase font-bold text-slate-400">Site</label>
                                        <select
                                            value={attendanceSiteId}
                                            onChange={(e) => setAttendanceSiteId(e.target.value)}
                                            className="px-2 py-1.5 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl cursor-pointer"
                                        >
                                            {sites.map(s => (
                                                <option key={s.site_id} value={s.site_id}>{s.site_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] uppercase font-bold text-slate-400">Date</label>
                                        <input
                                            type="date"
                                            value={attendanceDate}
                                            onChange={(e) => setAttendanceDate(e.target.value)}
                                            className="px-2 py-1 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-2xl overflow-hidden shadow-sm">
                                    <div className="p-3 border-b border-slate-100 dark:border-github-dark-border flex justify-between items-center bg-slate-50 dark:bg-github-dark-border/40">
                                        <span className="font-bold text-xs">Workers Checklist ({attendanceRoster.length})</span>
                                        <button
                                            disabled={attendanceRoster.length === 0}
                                            onClick={handleSaveAttendance}
                                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-1 shadow-sm disabled:opacity-50 text-[10px] cursor-pointer"
                                        >
                                            <Save size={12} /> Save Roster
                                        </button>
                                    </div>

                                    {attendanceLoading ? (
                                        <div className="py-10 flex justify-center"><Clock className="animate-spin text-indigo-500" size={20} /></div>
                                    ) : attendanceRoster.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400 italic">No labours on this site.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3 p-3 bg-slate-50/50 dark:bg-transparent">
                                            {attendanceRoster.map(item => (
                                                <div key={item.labour_id} className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-xl p-3.5 flex flex-col gap-3.5 shadow-sm">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 dark:text-white text-xs truncate">{item.name}</h4>
                                                        <p className="text-[9px] text-slate-450 dark:text-github-dark-muted font-mono uppercase mt-0.5">{item.role}</p>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-github-dark-border/40">
                                                        {[
                                                            { id: 'Present', label: 'Full Day', activeColor: 'bg-emerald-500 text-white dark:bg-emerald-600', inactiveColor: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-github-dark-border/60' },
                                                            { id: 'Half Day', label: 'Half Day', activeColor: 'bg-amber-500 text-white dark:bg-amber-600', inactiveColor: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-github-dark-border/60' },
                                                            { id: 'Absent', label: 'Absent', activeColor: 'bg-rose-500 text-white dark:bg-rose-600', inactiveColor: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-github-dark-border/60' },
                                                            { id: 'Paid Leave', label: 'Paid Leave', activeColor: 'bg-indigo-500 text-white dark:bg-indigo-600', inactiveColor: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-github-dark-border/60' }
                                                        ].map(statusOpt => {
                                                            const isSelected = item.status === statusOpt.id;
                                                            return (
                                                                <button
                                                                    key={statusOpt.id}
                                                                    onClick={() => handleStatusChange(item.labour_id, statusOpt.id)}
                                                                    className={`py-1.5 rounded-lg text-[9px] font-bold text-center transition-all cursor-pointer ${
                                                                        isSelected ? statusOpt.activeColor + ' shadow-sm' : statusOpt.inactiveColor
                                                                    }`}
                                                                >
                                                                    {statusOpt.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ==========================================
                            TAB 3.5: ATTENDANCE GRID VIEW
                            ========================================== */}
                        {activeTab === 'grid' && (
                            <div className="space-y-3">
                                <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-3.5 rounded-2xl grid grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] uppercase font-bold text-slate-400">Site</label>
                                        <select
                                            value={gridSiteId}
                                            onChange={(e) => setGridSiteId(e.target.value)}
                                            className="px-2 py-1.5 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl cursor-pointer"
                                        >
                                            {sites.map(s => (
                                                <option key={s.site_id} value={s.site_id}>{s.site_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] uppercase font-bold text-slate-400">Month</label>
                                        <input
                                            type="month"
                                            value={gridMonth}
                                            onChange={(e) => setGridMonth(e.target.value)}
                                            className="px-2 py-1 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {gridLoading ? (
                                    <div className="py-10 flex justify-center"><Clock className="animate-spin text-indigo-500" size={20} /></div>
                                ) : (
                                    <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-2xl overflow-hidden shadow-sm">
                                        <div className="p-3 border-b border-slate-100 dark:border-github-dark-border bg-slate-50 dark:bg-github-dark-border/40">
                                            <span className="font-bold text-xs">Attendance Matrix</span>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                                                <thead>
                                                    <tr className="bg-slate-50/60 dark:bg-github-dark-border/20 border-b border-slate-200 dark:border-github-dark-border font-bold text-slate-400">
                                                        <th className="p-3 sticky left-0 bg-white dark:bg-[#0d1117] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[120px] border-r border-slate-250 dark:border-github-dark-border">Worker Name / Role</th>
                                                        {getDaysInMonthArray().map(day => (
                                                            <th key={day.dateStr} className="p-2 text-center min-w-[36px]">
                                                                <div className="flex flex-col items-center">
                                                                    <span className="text-[8px] font-bold text-slate-400">{day.dayName}</span>
                                                                    <span className="text-[9px] font-black text-slate-700 dark:text-github-dark-text mt-0.5">{day.dayNum}</span>
                                                                </div>
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {gridData.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={getDaysInMonthArray().length + 1} className="p-8 text-center text-slate-400 italic">
                                                                No active labours found.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        gridData.map(row => (
                                                            <tr key={row.labour_id} className="border-b border-slate-150 dark:border-github-dark-border/40">
                                                                <td className="p-3 sticky left-0 bg-white dark:bg-[#0d1117] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-250 dark:border-github-dark-border">
                                                                    <div className="font-bold text-slate-800 dark:text-github-dark-text text-[11px]">{row.name}</div>
                                                                    <div className="text-[8px] text-slate-400 dark:text-github-dark-muted font-mono mt-0.5">{row.role}</div>
                                                                </td>
                                                                {getDaysInMonthArray().map(day => {
                                                                    const status = row.attendance[day.dateStr];
                                                                    const dateObj = new Date(day.dateStr);
                                                                    const dayNum = dateObj.getDay();
                                                                    let cellContent = null;
                                                                    
                                                                    if (status === 'Present') {
                                                                        cellContent = (
                                                                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[8px] font-black shadow-sm" title="Present">P</span>
                                                                        );
                                                                    } else if (status === 'Half Day') {
                                                                        cellContent = (
                                                                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-500 text-white text-[8px] font-black shadow-sm" title="Half Day">HD</span>
                                                                        );
                                                                    } else if (status === 'Absent') {
                                                                        cellContent = (
                                                                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[8px] font-black shadow-sm" title="Absent">A</span>
                                                                        );
                                                                    } else if (status === 'Paid Leave') {
                                                                        cellContent = (
                                                                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-500 text-white text-[8px] font-black shadow-sm" title="Paid Leave">PL</span>
                                                                        );
                                                                    } else if (dayNum === 6) { // Saturday
                                                                        cellContent = (
                                                                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[8px] font-bold">SA</span>
                                                                        );
                                                                    } else if (dayNum === 0) { // Sunday
                                                                        cellContent = (
                                                                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-[#161b22] text-slate-500 dark:text-slate-400 text-[8px] font-bold">SU</span>
                                                                        );
                                                                    } else {
                                                                        cellContent = (
                                                                            <span className="text-slate-350 dark:text-slate-650">-</span>
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
                            TAB 4: FINANCES
                            ========================================== */}
                        {activeTab === 'finances' && (
                            <div className="space-y-3">
                                {monthDetails && (
                                    <div className="bg-slate-100 dark:bg-github-dark-border p-2.5 rounded-xl text-[9px] font-bold text-slate-600 dark:text-github-dark-text text-center border border-slate-200/50">
                                        🗓️ DAYS ELAPSED {monthDetails.elapsedDays} OF {monthDetails.totalDays} IN MONTH
                                    </div>
                                )}

                                <div className="grid gap-3">
                                    {financeSummary.length === 0 ? (
                                        <div className="p-10 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400">
                                            No active labours to show ledger.
                                        </div>
                                    ) : (
                                        financeSummary.map(row => {
                                            const advanceAlert = row.advances_taken > row.accrued_credit;
                                            return (
                                                <div key={row.labour_id} className="bg-white dark:bg-github-dark-subtle p-3.5 rounded-2xl border border-slate-200 dark:border-github-dark-border flex flex-col gap-2.5 shadow-sm">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 dark:text-white text-xs">{row.name}</h4>
                                                            <p className="text-[9px] text-slate-400">{row.site_name} | {row.wage_type}</p>
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 font-mono">
                                                            {row.attendance.present}P / {row.attendance.half_day}HD / {row.attendance.absent}A / {row.attendance.paid_leave || 0}PL
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-[#161b22]/40 p-2.5 rounded-xl border border-slate-100 dark:border-github-dark-border/40 text-[9px]">
                                                        <div>
                                                            <span className="block text-slate-400">Accrued Credit</span>
                                                            <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{row.accrued_credit}</span>
                                                        </div>
                                                        <div>
                                                            <span className="block text-slate-400">Advances Taken</span>
                                                            <span className="font-bold text-amber-500">₹{row.advances_taken}</span>
                                                        </div>
                                                        <div>
                                                            <span className="block text-slate-400">Net Payable</span>
                                                            <span className={`font-black flex items-center gap-0.5 ${advanceAlert ? 'text-rose-500' : 'text-slate-700 dark:text-white'}`}>
                                                                ₹{row.net_payable}
                                                                {advanceAlert && <AlertTriangle size={10} className="text-rose-500" />}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center pt-1">
                                                        <span className="text-[9px] text-slate-400">Base Salary: ₹{row.monthly_salary}</span>
                                                        <button
                                                            onClick={() => handleOpenAdvance(row)}
                                                            className="px-2 py-1 text-[9px] font-bold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                                                        >
                                                            Log Advance
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* MODALS */}
                {/* Site Modal (Same structure but mobile responsive sizing) */}
                {showSiteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 p-4 space-y-4">
                            <h4 className="font-bold text-slate-800 dark:text-white">
                                {editingSite ? 'Edit Site' : 'Create Site'}
                            </h4>
                            <form onSubmit={handleSaveSite} className="space-y-3">
                                <input
                                    type="text"
                                    value={siteForm.site_name}
                                    onChange={(e) => setSiteForm({ ...siteForm, site_name: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl focus:outline-none"
                                    required
                                    placeholder="Site Name"
                                />
                                <textarea
                                    value={siteForm.location_details}
                                    onChange={(e) => setSiteForm({ ...siteForm, location_details: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl focus:outline-none"
                                    rows={2}
                                    placeholder="Location details"
                                />
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setShowSiteModal(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-bold">Cancel</button>
                                    <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Labour Modal */}
                {showLabourModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 p-4 space-y-4 max-h-[85vh] overflow-y-auto">
                            <h4 className="font-bold text-slate-800 dark:text-white">
                                {editingLabour ? 'Edit Worker' : 'Add Labour Worker'}
                            </h4>
                            <form onSubmit={handleSaveLabour} className="space-y-3">
                                <input
                                    type="text"
                                    value={labourForm.name}
                                    onChange={(e) => setLabourForm({ ...labourForm, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl"
                                    required
                                    placeholder="Worker Name"
                                />
                                <input
                                    type="tel"
                                    value={labourForm.phone}
                                    onChange={(e) => setLabourForm({ ...labourForm, phone: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl"
                                    placeholder="Phone number"
                                />
                                <select
                                    value={labourForm.sex}
                                    onChange={(e) => setLabourForm({ ...labourForm, sex: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                <input
                                    type="text"
                                    value={labourForm.role}
                                    onChange={(e) => setLabourForm({ ...labourForm, role: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl"
                                    required
                                    placeholder="Role (e.g. Mason, Carpenter)"
                                />
                                <select
                                    value={labourForm.site_id}
                                    onChange={(e) => setLabourForm({ ...labourForm, site_id: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl"
                                >
                                    <option value="">Unassigned / Independent</option>
                                    {sites.map(s => (
                                        <option key={s.site_id} value={s.site_id}>{s.site_name}</option>
                                    ))}
                                </select>
                                <select
                                    value={labourForm.wage_type}
                                    onChange={(e) => setLabourForm({ ...labourForm, wage_type: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl"
                                >
                                    <option value="Daily Wage">Daily Wage</option>
                                    <option value="Fixed Salary">Fixed Salary</option>
                                </select>
                                <input
                                    type="number"
                                    value={labourForm.monthly_salary}
                                    onChange={(e) => setLabourForm({ ...labourForm, monthly_salary: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl"
                                    required
                                    placeholder="Monthly Salary"
                                />
                                {labourForm.wage_type === 'Fixed Salary' && (
                                    <input
                                        type="number"
                                        value={labourForm.allowed_leaves}
                                        onChange={(e) => setLabourForm({ ...labourForm, allowed_leaves: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl"
                                        placeholder="Allowed Leaves"
                                    />
                                )}
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setShowLabourModal(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-bold">Cancel</button>
                                    <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Advance Modal */}
                {showAdvanceModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-4 space-y-4">
                            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                                <DollarSign size={16} className="text-amber-500" />
                                <span>Log Advance ({advanceForm.name})</span>
                            </h4>
                            <form onSubmit={handleSaveAdvance} className="space-y-3">
                                <input
                                    type="number"
                                    value={advanceForm.amount}
                                    onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl"
                                    required
                                    placeholder="Advance Amount"
                                />
                                <input
                                    type="date"
                                    value={advanceForm.date}
                                    onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl"
                                    required
                                />
                                <input
                                    type="text"
                                    value={advanceForm.notes}
                                    onChange={(e) => setAdvanceForm({ ...advanceForm, notes: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-github-dark-border rounded-xl"
                                    placeholder="Notes (e.g. Festival)"
                                />
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setShowAdvanceModal(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-bold">Cancel</button>
                                    <button type="submit" className="flex-1 py-2 bg-amber-500 text-white rounded-xl font-bold">Record</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </MobileDashboardLayout>
    );
};

export default MobileLabourManagement;
