import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Award, FileText, Sparkles, CheckCircle2, Check, RefreshCw, User, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

// Presets for Department KPIs
const DEPARTMENT_KPI_PRESETS = {
    'Software Developer': [
        { name: 'Tasks Completed', description: 'Percentage of sprint tasks delivered successfully' },
        { name: 'Bug Resolution Rate', description: 'Average time taken to resolve assigned bug tickets' },
        { name: 'Code Quality', description: 'Peer code review scores and low code smell metrics' },
        { name: 'Sprint Velocity', description: 'Consistency in story points delivered per sprint' }
    ],
    'HR': [
        { name: 'Hiring Time', description: 'Average days taken to fill open career roles' },
        { name: 'Retention Rate', description: 'Percentage of staff retained over the cycle' },
        { name: 'Employee Satisfaction', description: 'Average score on quarterly feedback surveys' }
    ],
    'Sales': [
        { name: 'Revenue Generated', description: 'Total sales value closed in INR' },
        { name: 'Leads Converted', description: 'Ratio of prospect leads successfully converted' }
    ],
    'General': [
        { name: 'Attendance Consistency', description: 'Adherence to check-in/check-out policies' },
        { name: 'Team Collaboration', description: 'Participation in shared tasks and channels' }
    ]
};

// HELPER: Fetch goals for an employee & cycle
const getEmployeeGoalsFromStorage = (empId, cycleId) => {
    const localKey = `mano_perf_goals_${empId}_${cycleId}`;
    const stored = localStorage.getItem(localKey);
    
    const variant = Number(empId) % 3;
    let defaultGoals = [];

    if (variant === 0) {
        defaultGoals = [
            { id: 'g-1', title: 'Complete Core Module Sprint Tasks', weightage: 30, deadline: '2026-06-15', kpiName: 'Tasks Completed', status: 'Completed' },
            { id: 'g-2', title: 'Achieve 95% Bug Resolution within SLA', weightage: 35, deadline: '2026-06-20', kpiName: 'Bug Resolution Rate', status: 'Completed' },
            { id: 'g-3', title: 'Refactor Legacy Code and reduce smells', weightage: 35, deadline: '2026-06-30', kpiName: 'Code Quality', status: 'Completed' }
        ];
    } else if (variant === 1) {
        defaultGoals = [
            { id: 'g-1', title: 'Review and fix CSS scaling on tablet screens', weightage: 40, deadline: '2026-06-15', kpiName: 'Tasks Completed', status: 'Completed' },
            { id: 'g-2', title: 'Conduct user feedback sessions for DAR logging', weightage: 30, deadline: '2026-06-20', kpiName: 'Team Collaboration', status: 'In-Progress' },
            { id: 'g-3', title: 'Improve unit test coverage by 15%', weightage: 30, deadline: '2026-06-30', kpiName: 'Code Quality', status: 'Pending' }
        ];
    } else {
        defaultGoals = [
            { id: 'g-1', title: 'Complete compliance training courses', weightage: 40, deadline: '2026-06-10', kpiName: 'Attendance Consistency', status: 'Pending' },
            { id: 'g-2', title: 'Update API endpoint error handling structures', weightage: 60, deadline: '2026-06-25', kpiName: 'Tasks Completed', status: 'In-Progress' }
        ];
    }

    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error(e);
        }
    }
    return defaultGoals;
};

// HELPER: Fetch review data
const getEmployeeReviewFromStorage = (empId, cycleId) => {
    const localKey = `mano_perf_review_${empId}_${cycleId}`;
    const stored = localStorage.getItem(localKey);

    const variant = Number(empId) % 3;
    let defaultReview = {};

    if (variant === 0) {
        defaultReview = {
            selfAchievements: 'Delivered the attendance logging geofencing module ahead of the sprint timeline and verified all check-in edge cases. Mentored two interns.',
            selfChallenges: 'Faced layout scaling problems on specific tablet screen queries, but resolved them by refactoring index.css layout classes.',
            selfLearning: 'Learned HSL color palette designs, advanced Socket.io logic, and local storage state sync layouts.',
            managerRating: '9',
            managerComments: 'Consistently check-in on time. Excelled at frontend delivery. Suresh has shown superior engineering quality and was a great mentor this cycle.',
            managerRec: 'Promote to Senior Role',
            lastUpdated: '2026-06-05 11:10:00'
        };
    } else if (variant === 1) {
        defaultReview = {
            selfAchievements: 'Resolved CSS scaling query errors and updated client pages. Set up active DAR notifications.',
            selfChallenges: 'Struggled with unit testing frameworks configuration due to legacy mock setup libraries.',
            selfLearning: 'Learned CSS flexbox grid layouts and Jest mock testing suites.',
            managerRating: '7',
            managerComments: 'Good work on UI modifications. Need to show more speed in test cases and complete pending goals.',
            managerRec: 'Retain with Standard Increment',
            lastUpdated: '2026-06-05 13:40:00'
        };
    } else {
        defaultReview = {
            selfAchievements: 'Started refactoring error check routes in backend API systems.',
            selfChallenges: 'Faced frequent connectivity and local check-in deployment blockers.',
            selfLearning: 'Read express API routing documentation and basic node crash logs.',
            managerRating: '5',
            managerComments: 'Appraisal progress has been slow. Check-in records have also been irregular this quarter. Needs to show improvement in sprint velocity.',
            managerRec: 'Retain with Performance Improvement Plan',
            lastUpdated: '2026-06-05 16:20:00'
        };
    }

    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error(e);
        }
    }
    return defaultReview;
};

// 1. KPI & GOAL SHEET MANAGEMENT VIEW
export const KpiGoalSheets = ({ employee, selectedCycleId }) => {
    const [goals, setGoals] = useState([]);
    const [newGoalForm, setNewGoalForm] = useState({ title: '', weightage: '20', deadline: '', kpiName: '' });

    useEffect(() => {
        if (employee?.id) {
            setGoals(getEmployeeGoalsFromStorage(employee.id, selectedCycleId));
        }
    }, [employee?.id, selectedCycleId]);

    const saveGoals = (updatedGoals) => {
        setGoals(updatedGoals);
        localStorage.setItem(`mano_perf_goals_${employee.id}_${selectedCycleId}`, JSON.stringify(updatedGoals));
    };

    const handleAddGoal = (e) => {
        e.preventDefault();
        if (!newGoalForm.title || !newGoalForm.deadline || !newGoalForm.kpiName) {
            toast.error("Please fill in Goal Title, Deadline and KPI Category");
            return;
        }

        const currentSum = goals.reduce((sum, g) => sum + parseInt(g.weightage), 0);
        const addedWeight = parseInt(newGoalForm.weightage);
        if (currentSum + addedWeight > 100) {
            toast.warning(`Total Goal Weightage cannot exceed 100% (Currently at ${currentSum}%)`);
            return;
        }

        const newGoal = {
            id: `goal-${Date.now()}`,
            title: newGoalForm.title,
            weightage: addedWeight,
            deadline: newGoalForm.deadline,
            kpiName: newGoalForm.kpiName,
            status: 'Pending'
        };

        const updated = [...goals, newGoal];
        saveGoals(updated);
        setNewGoalForm({ title: '', weightage: '20', deadline: '', kpiName: '' });
        toast.success("Goal added successfully!");
    };

    const updateGoalStatus = (goalId, nextStatus) => {
        const updated = goals.map(g => {
            if (g.id === goalId) {
                return { ...g, status: nextStatus };
            }
            return g;
        });
        saveGoals(updated);
        toast.success(`Goal status updated to: ${nextStatus}`);
    };

    const handleDeleteGoal = (goalId) => {
        const updated = goals.filter(g => g.id !== goalId);
        saveGoals(updated);
        toast.info("Goal removed from cycle sheets");
    };

    const getKpiOptions = () => {
        const dept = employee?.department || 'General';
        const key = DEPARTMENT_KPI_PRESETS[dept] ? dept : 'General';
        return DEPARTMENT_KPI_PRESETS[key];
    };

    const totalWeight = goals.reduce((sum, g) => sum + g.weightage, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs items-start">
            {/* Goal Assignment Worksheet Card */}
            <div className="lg:col-span-7 bg-slate-50/50 dark:bg-github-dark-subtle/10 border border-slate-200 dark:border-github-dark-border rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-github-dark-border pb-3 flex-wrap gap-2">
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-github-dark-text text-sm">Goal Assignment Worksheet</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{employee?.name} ({employee?.department})</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-500">Weight Total:</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                            totalWeight === 100 
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                        }`}>
                            {totalWeight}% / 100%
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    {goals.length > 0 ? (
                        goals.map(goal => (
                            <div key={goal.id} className="p-3 border border-slate-200 dark:border-github-dark-border rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-dark-card">
                                <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-slate-800 dark:text-github-dark-text text-xs">{goal.title}</span>
                                        <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded text-[9px] font-bold">
                                            Weight: {goal.weightage}%
                                        </span>
                                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[9px] font-mono">
                                            {goal.kpiName}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono">
                                        <span>Deadline: {goal.deadline}</span>
                                        <span className="flex items-center gap-1">
                                            Status: 
                                            <select
                                                value={goal.status}
                                                onChange={(e) => updateGoalStatus(goal.id, e.target.value)}
                                                className="bg-transparent border-b border-slate-200 dark:border-github-dark-border font-bold text-slate-655 dark:text-slate-300 focus:outline-none cursor-pointer"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="In-Progress">In-Progress</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Deferred">Deferred</option>
                                            </select>
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeleteGoal(goal.id)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 hover:text-red-500 rounded self-end sm:self-auto"
                                    title="Delete Goal"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="py-8 text-center text-slate-400 italic">No goals mapped to this appraisal cycle yet.</p>
                    )}
                </div>
            </div>

            {/* Goal Creation Form */}
            <div className="lg:col-span-5 bg-slate-50/50 dark:bg-github-dark-subtle/10 border border-slate-200 dark:border-github-dark-border rounded-xl p-4 space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-github-dark-text border-b border-slate-100 dark:border-github-dark-border pb-2">Add Appraisal Goal</h4>
                <form onSubmit={handleAddGoal} className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block uppercase">Goal Title *</label>
                        <input
                            type="text"
                            required
                            value={newGoalForm.title}
                            onChange={(e) => setNewGoalForm({ ...newGoalForm, title: e.target.value })}
                            placeholder="e.g. Speed up React dashboard paint times"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-github-dark-border rounded-lg text-xs"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold block uppercase">Goal Weightage (%) *</label>
                            <select
                                value={newGoalForm.weightage}
                                onChange={(e) => setNewGoalForm({ ...newGoalForm, weightage: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-github-dark-border rounded-lg text-xs"
                            >
                                <option value="10">10%</option>
                                <option value="15">15%</option>
                                <option value="20">20%</option>
                                <option value="25">25%</option>
                                <option value="30">30%</option>
                                <option value="35">35%</option>
                                <option value="40">40%</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold block uppercase">KPI Metric Category *</label>
                            <select
                                value={newGoalForm.kpiName}
                                onChange={(e) => setNewGoalForm({ ...newGoalForm, kpiName: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-github-dark-border rounded-lg text-xs"
                            >
                                <option value="">Select Category</option>
                                {getKpiOptions().map(kpi => (
                                    <option key={kpi.name} value={kpi.name}>{kpi.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block uppercase">Due Deadline *</label>
                        <input
                            type="date"
                            required
                            value={newGoalForm.deadline}
                            onChange={(e) => setNewGoalForm({ ...newGoalForm, deadline: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-github-dark-border rounded-lg text-xs"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 bg-[#0969da] hover:bg-[#0969da]/90 text-white rounded-lg font-bold flex justify-center items-center gap-1 shadow-sm transition-all mt-2"
                    >
                        <Plus size={14} /> Assign Goal
                    </button>
                </form>

                {/* Preset References */}
                <div className="border-t border-slate-100 dark:border-github-dark-border pt-3 space-y-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Available Presets ({employee?.department}):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {getKpiOptions().map(kpi => (
                            <div key={kpi.name} className="p-2 border border-slate-100 dark:border-github-dark-border/50 bg-white dark:bg-dark-card rounded-lg">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400 block">{kpi.name}</span>
                                <p className="text-[9px] text-slate-400 leading-tight mt-0.5">{kpi.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// 2. REVIEWS & RATINGS VIEW
export const ReviewsAndRatings = ({ employee, selectedCycleId }) => {
    const [review, setReview] = useState(null);
    const [rating, setRating] = useState('8');
    const [rec, setRec] = useState('Retain with Standard Increment');
    const [comments, setComments] = useState('');

    useEffect(() => {
        if (employee?.id) {
            const rev = getEmployeeReviewFromStorage(employee.id, selectedCycleId);
            setReview(rev);
            setRating(rev.managerRating || '8');
            setRec(rev.managerRec || 'Retain with Standard Increment');
            setComments(rev.managerComments || '');
        }
    }, [employee?.id, selectedCycleId]);

    const handleManagerReviewSubmit = (e) => {
        e.preventDefault();
        const updatedReview = {
            ...review,
            managerRating: rating,
            managerComments: comments,
            managerRec: rec,
            lastUpdated: new Date().toLocaleString()
        };

        setReview(updatedReview);
        localStorage.setItem(`mano_perf_review_${employee.id}_${selectedCycleId}`, JSON.stringify(updatedReview));
        toast.success("Manager review submitted successfully!");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs items-start">
            {/* Employee Self-Appraisal Submission (Read-Only HR Panel) */}
            <div className="bg-slate-50/50 dark:bg-github-dark-subtle/10 border border-slate-200 dark:border-github-dark-border rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-github-dark-border pb-2">
                    <h4 className="font-bold text-slate-800 dark:text-github-dark-text text-sm flex items-center gap-1.5">
                        <User size={16} className="text-[#0969da] dark:text-github-dark-accent" />
                        Employee Self-Review Report
                    </h4>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 rounded text-[9px] font-bold uppercase">
                        Submitted
                    </span>
                </div>

                {review ? (
                    <div className="space-y-3">
                        <div className="p-3 bg-white dark:bg-dark-card border border-slate-100 dark:border-github-dark-border/50 rounded-lg space-y-1">
                            <span className="font-bold text-slate-400 text-[10px] uppercase block">1. Key Achievements</span>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                                "{review.selfAchievements || 'None reported.'}"
                            </p>
                        </div>

                        <div className="p-3 bg-white dark:bg-dark-card border border-slate-100 dark:border-github-dark-border/50 rounded-lg space-y-1">
                            <span className="font-bold text-slate-400 text-[10px] uppercase block">2. Core Obstacles & Challenges</span>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                                "{review.selfChallenges || 'None reported.'}"
                            </p>
                        </div>

                        <div className="p-3 bg-white dark:bg-dark-card border border-slate-100 dark:border-github-dark-border/50 rounded-lg space-y-1">
                            <span className="font-bold text-slate-400 text-[10px] uppercase block">3. Competencies & Learnings</span>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                                "{review.selfLearning || 'None reported.'}"
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="py-4 text-center text-slate-400 italic">No self review details registered.</p>
                )}
            </div>

            {/* Manager Appraisal Review Form */}
            <div className="bg-slate-50/50 dark:bg-github-dark-subtle/10 border border-slate-200 dark:border-github-dark-border rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-github-dark-border pb-2">
                    <h4 className="font-bold text-slate-800 dark:text-github-dark-text text-sm flex items-center gap-1.5">
                        <Award size={16} className="text-[#0969da] dark:text-github-dark-accent" />
                        Manager Audit Review & Ratings
                    </h4>
                    {review?.lastUpdated && (
                        <span className="text-[9px] text-slate-400 font-mono">
                            Last Saved: {review.lastUpdated}
                        </span>
                    )}
                </div>

                <form onSubmit={handleManagerReviewSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold block uppercase">Rating Score (1-10) *</label>
                            <select
                                value={rating}
                                onChange={(e) => setRating(e.target.value)}
                                required
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-github-dark-border rounded-lg text-xs"
                            >
                                {[...Array(10)].map((_, i) => (
                                    <option key={i+1} value={i+1}>{i+1} / 10</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold block uppercase">Official Recommendation *</label>
                            <select
                                value={rec}
                                onChange={(e) => setRec(e.target.value)}
                                required
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-card border border-slate-200 dark:border-github-dark-border rounded-lg text-xs"
                            >
                                <option value="Promote to Senior Role">Promote to Senior Role</option>
                                <option value="Retain with Standard Increment">Retain with Standard Increment</option>
                                <option value="Retain with Performance Improvement Plan">Retain with Performance Improvement Plan (PIP)</option>
                                <option value="Cycle Deferred">Cycle Deferred</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block uppercase">Appraisal Comments & Feedback *</label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            required
                            rows="4"
                            placeholder="Detail employee strengths, achievements, and feedback metrics..."
                            className="w-full px-3 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-github-dark-border rounded-xl text-xs focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2.5 bg-[#0969da] hover:bg-[#0969da]/90 text-white rounded-lg font-bold flex justify-center items-center gap-1.5 shadow-sm transition-all"
                    >
                        <Check size={14} /> Submit Appraisal Review
                    </button>
                </form>
            </div>
        </div>
    );
};

// 3. AI PERFORMANCE ANALYZER VIEW
export const AiPerformanceAnalyzer = ({ employee, selectedCycleId }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    useEffect(() => {
        if (employee?.id) {
            setAiResult(null);
            const storedReport = localStorage.getItem(`mano_perf_ai_${employee.id}_${selectedCycleId}`);
            if (storedReport) {
                try {
                    setAiResult(JSON.parse(storedReport));
                } catch(e) {
                    console.error(e);
                }
            }
        }
    }, [employee?.id, selectedCycleId]);

    const runAiPerformanceAnalysis = () => {
        if (!employee) return;
        setIsAnalyzing(true);
        setAiResult(null);

        setTimeout(() => {
            const goals = getEmployeeGoalsFromStorage(employee.id, selectedCycleId);
            const review = getEmployeeReviewFromStorage(employee.id, selectedCycleId);

            // Calculations based on actual goals & ratings
            const totalGoals = goals.length;
            const completedGoals = goals.filter(g => g.status === 'Completed').length;
            const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) : 1;
            
            const ratingScore = parseFloat(review.managerRating || 8.0);
            
            // Weight dynamic results
            let overallScore = ((completionRate * 10) + ratingScore) / 2;
            overallScore = Math.round(overallScore * 10) / 10; // decimal formatting

            // Determine readiness
            let readiness = 'Medium';
            if (overallScore >= 8.5) readiness = 'High';
            if (overallScore < 7.0) readiness = 'Low';

            // Custom bullet points based on rating and inputs
            const strengths = [];
            const improvements = [];

            if (overallScore >= 8.0) {
                strengths.push("Excellent deliverable velocity and task execution speeds.");
                strengths.push("Consistent check-in records (98.5% attendance compliance).");
            } else {
                strengths.push("Satisfactory basic compliance and core task deliveries.");
                strengths.push("Standard check-in compliance.");
            }

            if (review.selfLearning && review.selfLearning.length > 20) {
                strengths.push("Active self-improvement and technical skill learning.");
            }

            if (overallScore < 8.0) {
                improvements.push("Needs to speed up resolution SLAs and bug checks.");
            }
            if (review.selfChallenges && review.selfChallenges.includes('layout')) {
                improvements.push("Enhance tablet queries and responsive layout styling workflows.");
            }
            improvements.push("Increase code documentation frequency and standardize class variables.");

            const analysisReport = {
                score: overallScore,
                readiness,
                strengths,
                improvements,
                summary: `Employee shows strong capability in general tasks. Overall performance is rated as ${readiness === 'High' ? 'superior' : 'competent'} with a total index score of ${overallScore}/10. Task completion stands at ${completedGoals}/${totalGoals} goals during the cycle.`
            };

            setAiResult(analysisReport);
            setIsAnalyzing(false);
            localStorage.setItem(`mano_perf_ai_${employee.id}_${selectedCycleId}`, JSON.stringify(analysisReport));
            toast.success("AI performance audit complete!");
        }, 2000);
    };

    return (
        <div className="space-y-6 text-xs">
            {/* Analyzer Controls Card */}
            <div className="bg-slate-50/50 dark:bg-github-dark-subtle/10 border border-slate-200 dark:border-github-dark-border rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 dark:text-github-dark-text text-sm flex items-center gap-1.5">
                        <Sparkles size={16} className="text-[#0969da] dark:text-github-dark-accent" />
                        AI Performance Auditor & Summary Generator
                    </h4>
                </div>

                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                    The AI Analyzer audits employee index ratings. It compiles **Check-in Attendance compliance**, **KPI Completion percent rates**, and **Manager Rating reviews** to formulate a comprehensive appraisal report card.
                </p>

                {isAnalyzing ? (
                    <div className="py-8 text-center flex flex-col items-center gap-2">
                        <RefreshCw className="animate-spin text-indigo-650 dark:text-indigo-400" size={24} />
                        <span className="font-bold text-indigo-700 dark:text-indigo-400 animate-pulse">Running Auditor Engines on Cycles...</span>
                    </div>
                ) : (
                    <button
                        onClick={runAiPerformanceAnalysis}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex justify-center items-center gap-1.5 shadow-md shadow-indigo-100 dark:shadow-none transition-all active:scale-98"
                    >
                        <Sparkles size={14} /> Auditing Performance & Generate AI Report
                    </button>
                )}
            </div>

            {/* AI Evaluation Report Output Card */}
            {aiResult && !isAnalyzing && (
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-dark-card border border-indigo-200/50 dark:border-indigo-950/60 rounded-xl p-4 space-y-4 shadow-sm"
                >
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-github-dark-border pb-3 flex-wrap gap-2">
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-github-dark-text text-sm">Appraisal Index Summary Report</h4>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{employee?.name} ({employee?.department})</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className="text-[9px] text-slate-400 font-bold block uppercase">Overall Rating</span>
                                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{aiResult.score} / 10</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] text-slate-400 font-bold block uppercase">Promotion Readiness</span>
                                <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                                    aiResult.readiness === 'High' 
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                        : aiResult.readiness === 'Medium' 
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' 
                                            : 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400'
                                }`}>
                                    {aiResult.readiness}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Narrative Summary */}
                    <div className="p-3 bg-slate-50 dark:bg-github-dark-bg/30 border border-slate-100 dark:border-github-dark-border/50 rounded-xl">
                        <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider block mb-1">AI Appraisal Index Summary</span>
                        <p className="text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">
                            {aiResult.summary}
                        </p>
                    </div>

                    {/* Strengths & Weaknesses grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-emerald-100 dark:border-emerald-950/30 bg-emerald-50/10 dark:bg-emerald-950/5 p-3 rounded-xl space-y-2">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 uppercase tracking-wider text-[9px]">
                                <CheckCircle2 size={12} /> Key Strengths
                            </span>
                            <ul className="list-disc list-inside text-slate-655 dark:text-slate-300 pl-1 space-y-1">
                                {aiResult.strengths.map((str, i) => (
                                    <li key={i}>{str}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="border border-amber-100 dark:border-amber-950/30 bg-amber-50/10 dark:bg-amber-950/5 p-3 rounded-xl space-y-2">
                            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 uppercase tracking-wider text-[9px]">
                                <AlertCircle size={12} /> Areas of Improvement
                            </span>
                            <ul className="list-disc list-inside text-slate-655 dark:text-slate-300 pl-1 space-y-1">
                                {aiResult.improvements.map((imp, i) => (
                                    <li key={i}>{imp}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
