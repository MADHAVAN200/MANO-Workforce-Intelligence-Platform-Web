import React, { useEffect, useMemo, useState } from 'react';
import { Copy, PlayCircle, RefreshCw, Wand2 } from 'lucide-react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const buildGenerateTemplate = (categories = []) => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDateObj = new Date(today);
    startDateObj.setDate(startDateObj.getDate() - 49); // 50 days inclusive (day 0 to day 49)
    const startDate = startDateObj.toISOString().split('T')[0];

    return {
        mode: 'generate',
        // 50 days × 4 activities + 3 breaks per day = up to 350 rows per employee.
        // Set countPerEmployee high so ensureDailyCoverage drives inserts, not this cap.
        countPerEmployee: 500,
        dateRange: {
            start: startDate,
            end: endDate
        },
        overwriteExisting: true,
        ensureDailyCoverage: true,
        // 4 real activities per day (each ~90 min in a 9h shift window)
        dailyTargetActivities: 4,
        fallbackActivitiesPerDay: 4,
        // Insert 15-min break rows between each activity block
        includeBreakEntries: true,
        breakDurationMinutes: 15,
        maxActivitiesPerSession: 6,
        target: {
            // [] means all employees; frontend normalises the string "all" to [] before sending
            userIds: 'all',
            includeInactive: false
        },
        categories: categories.length > 0
            ? categories
            : ['Site Visit', 'Inspection', 'Office Work', 'Meeting', 'Documentation']
    };
};

const buildImportTemplate = (employeeIds = []) => ({
    mode: 'import',
    records: employeeIds.slice(0, 2).map((userId, index) => ({
        user_id: userId,
        activity_date: new Date().toISOString().split('T')[0],
        start_time: `${String(9 + index).padStart(2, '0')}:00`,
        end_time: `${String(10 + index).padStart(2, '0')}:15`,
        title: 'Imported DAR Activity',
        description: 'Created from the frontend JSON import tool.',
        activity_type: 'Imported',
        status: 'COMPLETED'
    }))
});

const formatJson = (value) => JSON.stringify(value, null, 2);

const SimulationPanel = ({ allUsers = [] }) => {
    const activeUsers = useMemo(
        () => allUsers.filter((user) => !user.isDeleted),
        [allUsers]
    );

    const [categories, setCategories] = useState([]);
    const [jsonText, setJsonText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/dar/settings/list');
                const loadedCategories = res.data?.data?.categories || [];
                setCategories(loadedCategories);
                setJsonText((current) => current || formatJson(buildGenerateTemplate(loadedCategories)));
            } catch (error) {
                console.error(error);
                setJsonText((current) => current || formatJson(buildGenerateTemplate([])));
            }
        };

        fetchSettings();
    }, []);

    const handleLoadGenerateTemplate = () => {
        setJsonText(formatJson(buildGenerateTemplate(categories)));
        setResult(null);
    };

    const handleLoadImportTemplate = () => {
        setJsonText(formatJson(buildImportTemplate(activeUsers.map((user) => user.userId))));
        setResult(null);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(jsonText);
            toast.success('JSON copied to clipboard');
        } catch (error) {
            toast.error('Failed to copy JSON');
        }
    };

    const handleRunSimulation = async () => {
        let payload;

        try {
            payload = JSON.parse(jsonText);
        } catch (error) {
            toast.error('Invalid JSON. Fix the payload before running the simulator.');
            return;
        }

        setIsSubmitting(true);
        setResult(null);

        try {
            const normalizedPayload = {
                ...payload,
                target: payload?.target?.userIds === 'all'
                    ? { ...(payload.target || {}), userIds: [] }
                    : payload.target
            };

            const res = await api.post('/dar/activities/admin/simulate', normalizedPayload);
            setResult(res.data);
            toast.success(res.data.message || 'DAR simulation completed');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to run DAR simulation');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-700">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Wand2 size={22} className="text-indigo-600" />
                        DAR Simulator
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                        Paste JSON to generate DAR data from attendance windows or import explicit DAR rows in bulk.
                        Generate mode will bring each employee up to the target count, such as 50 activities.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleLoadGenerateTemplate}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Load Generate JSON
                    </button>
                    <button
                        type="button"
                        onClick={handleLoadImportTemplate}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Load Import JSON
                    </button>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Copy size={16} />
                        Copy
                    </button>
                    <button
                        type="button"
                        onClick={handleRunSimulation}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all disabled:opacity-60"
                    >
                        {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <PlayCircle size={18} />}
                        Run Simulation
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-5">
                        <div className="text-sm text-slate-500">Users Available</div>
                        <div className="mt-2 text-3xl font-bold text-slate-800 dark:text-white">{activeUsers.length}</div>
                        <div className="mt-1 text-xs text-slate-500">Generate mode targets all users in the organization.</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-5">
                        <div className="text-sm text-slate-500">Configured Categories</div>
                        <div className="mt-2 text-sm font-semibold text-slate-800 dark:text-white line-clamp-3">
                            {categories.length > 0 ? categories.join(', ') : 'No saved DAR categories'}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-5">
                        <div className="text-sm text-slate-500">JSON Notes</div>
                        <div className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
                            Use generate mode for fake DAR in bulk. Use import mode for exact rows.
                            Set target.userIds to [] to target all employee users.
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm font-bold text-slate-700 dark:text-slate-200">
                        Simulator JSON
                    </div>
                    <textarea
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                        spellCheck={false}
                        className="w-full min-h-[420px] p-5 bg-slate-950 text-slate-100 font-mono text-sm leading-6 outline-none resize-y"
                    />
                </div>

                {result && (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/20 p-5">
                            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Simulation Result</div>
                            <div className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">{result.message}</div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <div className="text-emerald-700/70 dark:text-emerald-300/70">Mode</div>
                                    <div className="font-bold text-emerald-900 dark:text-emerald-100 uppercase">{result.mode}</div>
                                </div>
                                <div>
                                    <div className="text-emerald-700/70 dark:text-emerald-300/70">Employees</div>
                                    <div className="font-bold text-emerald-900 dark:text-emerald-100">{result.totalEmployees}</div>
                                </div>
                                <div>
                                    <div className="text-emerald-700/70 dark:text-emerald-300/70">Inserted Rows</div>
                                    <div className="font-bold text-emerald-900 dark:text-emerald-100">{result.totalInserted}</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm font-bold text-slate-700 dark:text-slate-200">
                                Employee Summary
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white dark:bg-dark-card border-b border-slate-100 dark:border-slate-700">
                                            <th className="px-5 py-3">Employee</th>
                                            <th className="px-5 py-3">Inserted</th>
                                            <th className="px-5 py-3">Target</th>
                                            <th className="px-5 py-3">Achieved</th>
                                            <th className="px-5 py-3">Note</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {(result.employees || []).map((row) => (
                                            <tr key={row.user_id} className="text-sm text-slate-700 dark:text-slate-200">
                                                <td className="px-5 py-3 font-semibold">{row.user_name}</td>
                                                <td className="px-5 py-3">{row.inserted_count ?? 0}</td>
                                                <td className="px-5 py-3">{row.target_count ?? '-'}</td>
                                                <td className="px-5 py-3">{row.achieved_count ?? row.inserted_count ?? 0}</td>
                                                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{row.skipped_reason || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SimulationPanel;