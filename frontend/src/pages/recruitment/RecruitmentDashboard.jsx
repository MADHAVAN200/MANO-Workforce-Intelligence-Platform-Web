import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Briefcase, Plus, Search, Sparkles, Copy, Check, Share2, 
  Users, UserCheck, Calendar, MapPin, Award, ArrowRight,
  TrendingUp, Star, ThumbsUp, ThumbsDown, AlertCircle, Eye,
  Sliders, Grid, List, CheckCircle2, ChevronRight, X, FileText
} from 'lucide-react';
import { toast } from 'react-toastify';

// Mock baseline openings
const BASELINE_OPENINGS = [
  {
    id: 1,
    slug: 'react-developer-001',
    job_title: 'React Developer',
    department: 'Engineering',
    location: 'Bangalore, India / Remote',
    employment_type: 'Full-time',
    experience_required: '2+ Years',
    salary_range: '₹8,000,000 - ₹12,000,000 / year',
    skills_required: 'React, Redux, JavaScript, HTML5, CSS3, Tailwind CSS',
    responsibilities: 'Design and implement user interface components.\nBuild responsive and scalable web apps.\nCollaborate with backend engineers and UI/UX designers.',
    benefits: 'Health insurance & wellness benefits.\nFlexible working hours & remote work allowance.\nLearning stipend and certification reimbursement.',
    deadline: '2026-07-15',
    status: 'active'
  },
  {
    id: 2,
    slug: 'nodejs-engineer-002',
    job_title: 'Node.js Engineer',
    department: 'Engineering',
    location: 'Bangalore, India / Hybrid',
    employment_type: 'Full-time',
    experience_required: '3+ Years',
    salary_range: '₹10,000,000 - ₹15,000,000 / year',
    skills_required: 'Node.js, Express, Knex, MySQL, Redis, AWS, RESTful APIs',
    responsibilities: 'Design and maintain high-performance backend API services.\nOptimize database queries and cache layer.\nImplement security practices and access token controls.',
    benefits: 'Comprehensive health cover.\nQuarterly bonuses & stock options.\nFlexible schedules & hardware allowance.',
    deadline: '2026-07-20',
    status: 'active'
  }
];

// Mock baseline candidates
const BASELINE_CANDIDATES = [
  {
    id: 101,
    job_id: 1,
    full_name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    mobile: '+91 98765 43210',
    address: 'HSR Layout, Bangalore',
    linkedin: 'linkedin.com/in/rahul-react',
    portfolio: 'rahulsharma.dev',
    current_company: 'TechSolutions Ltd.',
    current_ctc: '₹6.5 LPA',
    expected_ctc: '₹9 LPA',
    notice_period: '30 days',
    resume_name: 'Rahul_Resume_React.pdf',
    cover_letter: 'I am a passionate frontend engineer with strong React and state-management focus.',
    stage: 'Shortlisted',
    created_at: '2026-06-01',
    ai_score: 89,
    skill_match_score: 92,
    experience_match_score: 88,
    education_match_score: 85,
    culture_fit_score: 90,
    ai_strengths: [
      'Strong React experience & hook optimizations',
      'AWS developer certification holder',
      'Proven team lead experience in dashboard projects'
    ],
    ai_weaknesses: [
      'No explicit TypeScript project experience mentioned in resume'
    ],
    ai_recommendation: 'Highly Recommended',
    extracted_skills: ['React', 'Redux', 'JavaScript', 'Tailwind CSS', 'AWS'],
    total_experience: '2.5 Years',
    relevant_experience: '2.5 Years',
    education: 'B.Tech in Computer Science, VTU',
    certifications: ['AWS Certified Developer'],
    projects: ['Customer Analytics Dashboard', 'E-commerce UI Components'],
    achievements: ['Decreased rendering delay by 40%', 'Won Internal Hackathon 2025']
  },
  {
    id: 102,
    job_id: 1,
    full_name: 'Sneha Patel',
    email: 'sneha.patel@example.com',
    mobile: '+91 91234 56789',
    address: 'Indiranagar, Bangalore',
    linkedin: 'linkedin.com/in/sneha-patel',
    portfolio: 'snehapatel.me',
    current_company: 'AppCraft Studio',
    current_ctc: '₹5.0 LPA',
    expected_ctc: '₹8.5 LPA',
    notice_period: 'Immediate',
    resume_name: 'Sneha_Patel_CV.pdf',
    cover_letter: 'Immediately available junior react dev ready to contribute.',
    stage: 'Applied',
    created_at: '2026-06-03',
    ai_score: 74,
    skill_match_score: 70,
    experience_match_score: 62,
    education_match_score: 80,
    culture_fit_score: 85,
    ai_strengths: [
      'Available immediately',
      'Solid foundations in CSS grid and layout architectures'
    ],
    ai_weaknesses: [
      'Less than 1.5 years experience',
      'No Redux state-management familiarity listed'
    ],
    ai_recommendation: 'Recommended',
    extracted_skills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'Bootstrap'],
    total_experience: '1 Year',
    relevant_experience: '1 Year',
    education: 'BCA, Bangalore University',
    certifications: [],
    projects: ['Interactive Portfolio site'],
    achievements: []
  },
  {
    id: 103,
    job_id: 2,
    full_name: 'Amit Verma',
    email: 'amit.verma@example.com',
    mobile: '+91 99887 76655',
    address: 'Whitefield, Bangalore',
    linkedin: 'linkedin.com/in/amit-v',
    portfolio: 'amitverma.dev',
    current_company: 'DataSystems Corp',
    current_ctc: '₹12.0 LPA',
    expected_ctc: '₹16.0 LPA',
    notice_period: '90 days',
    resume_name: 'Amit_Verma_Backend.pdf',
    cover_letter: 'Highly scale-focused Node backend engineer with expertise in MySQL databases.',
    stage: 'Technical Round',
    created_at: '2026-06-02',
    ai_score: 91,
    skill_match_score: 95,
    experience_match_score: 92,
    education_match_score: 90,
    culture_fit_score: 88,
    ai_strengths: [
      'Exceptional Node.js architecture understanding',
      'Experienced in Knex queries and MySQL scaling',
      'Redis cache setup for high throughput'
    ],
    ai_weaknesses: [
      '90 days notice period represents a long onboarding delay'
    ],
    ai_recommendation: 'Highly Recommended',
    extracted_skills: ['Node.js', 'Express', 'Knex', 'MySQL', 'Redis', 'Docker'],
    total_experience: '4 Years',
    relevant_experience: '4 Years',
    education: 'M.Tech in Software Systems, BITS Pilani',
    certifications: ['Oracle Database Associate'],
    projects: ['High-Performance API Gateway', 'Subscription Billing Engine'],
    achievements: ['Scaled billing system processing limit by 150%', 'Refactored backend reducing server cost by 25%']
  }
];

const PIPELINE_STAGES = [
  'Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 
  'Technical Round', 'HR Round', 'Selected', 'Rejected', 'Offered', 'Joined'
];

const RecruitmentDashboard = () => {
  const navigate = useNavigate();
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('openings'); // openings, create, pipeline, candidates
  
  // Data State
  const [openings, setOpenings] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Form Fields for new job opening
  const [newJob, setNewJob] = useState({
    job_title: '',
    department: '',
    location: '',
    employment_type: 'Full-time',
    experience_required: '',
    salary_range: '',
    skills_required: '',
    responsibilities: '',
    benefits: '',
    deadline: '',
    status: 'active'
  });

  // AI Prompt generator fields
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingJD, setGeneratingJD] = useState(false);

  // Filter/Sort State
  const [sortBy, setSortBy] = useState('overall'); // overall, skill, experience, education, culture
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const storedOpenings = localStorage.getItem('mano_recruitment_openings');
    const storedCandidates = localStorage.getItem('mano_recruitment_candidates');

    let parsedOpenings = BASELINE_OPENINGS;
    let parsedCandidates = BASELINE_CANDIDATES;

    if (storedOpenings) {
      try { parsedOpenings = JSON.parse(storedOpenings); } catch (e) { console.error(e); }
    } else {
      localStorage.setItem('mano_recruitment_openings', JSON.stringify(BASELINE_OPENINGS));
    }

    if (storedCandidates) {
      try { parsedCandidates = JSON.parse(storedCandidates); } catch (e) { console.error(e); }
    } else {
      localStorage.setItem('mano_recruitment_candidates', JSON.stringify(BASELINE_CANDIDATES));
    }

    setOpenings(parsedOpenings);
    setCandidates(parsedCandidates);
    if (parsedOpenings.length > 0) {
      setSelectedJob(parsedOpenings[0]);
    }
  }, []);

  // Sync back to localStorage helper
  const saveOpenings = (updatedList) => {
    setOpenings(updatedList);
    localStorage.setItem('mano_recruitment_openings', JSON.stringify(updatedList));
  };

  const saveCandidates = (updatedList) => {
    setCandidates(updatedList);
    localStorage.setItem('mano_recruitment_candidates', JSON.stringify(updatedList));
  };

  // Toggle opening status
  const toggleJobStatus = (id) => {
    const updated = openings.map(job => {
      if (job.id === id) {
        const nextStatus = job.status === 'active' ? 'inactive' : 'active';
        toast.info(`Job opening set to ${nextStatus}.`);
        return { ...job, status: nextStatus };
      }
      return job;
    });
    saveOpenings(updated);
  };

  // Generate public link copy to clipboard
  const handleCopyLink = (slug) => {
    const link = `${window.location.origin}/careers/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(slug);
    toast.success('Public Career Link copied to clipboard!');
    setTimeout(() => setCopiedLink(''), 2000);
  };

  // Handle new job submission
  const handleCreateJob = (e) => {
    e.preventDefault();
    if (!newJob.job_title || !newJob.department || !newJob.skills_required) {
      toast.error('Please fill in Job Title, Department, and Skills Required.');
      return;
    }

    // Slug generation
    const cleanTitle = newJob.job_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const code = Math.floor(100 + Math.random() * 900);
    const slug = `${cleanTitle}-${code}`;

    const createdJob = {
      ...newJob,
      id: Date.now(),
      slug,
      status: 'active'
    };

    const updated = [...openings, createdJob];
    saveOpenings(updated);
    toast.success('New Career Opening created successfully!');
    setSelectedJob(createdJob);
    
    // Reset Form
    setNewJob({
      job_title: '',
      department: '',
      location: '',
      employment_type: 'Full-time',
      experience_required: '',
      salary_range: '',
      skills_required: '',
      responsibilities: '',
      benefits: '',
      deadline: '',
      status: 'active'
    });
    setActiveTab('openings');
  };

  // AI JD Generator simulation
  const handleGenerateJD = () => {
    if (!aiPrompt) {
      toast.error('Please enter requirements (e.g. "Need React Developer with 2 years experience")');
      return;
    }

    setGeneratingJD(true);

    setTimeout(() => {
      // Rule-based content generation based on text keyword matches
      const promptLower = aiPrompt.toLowerCase();
      let title = 'React Developer';
      let dept = 'Engineering';
      let skills = 'React, Redux, JavaScript, HTML5, CSS3, Tailwind CSS';
      let location = 'Remote / Hybrid';
      let exp = '2 Years';
      let responsibilities = '- Build component libraries using React and Tailwind CSS.\n- Coordinate state architectures with Redux/Zustand.\n- Integrate high-performance backend REST endpoints.';
      let benefits = '- Medical coverage.\n- Flexible remote/hybrid allowances.\n- Certification and learning budget.';
      
      if (promptLower.includes('node') || promptLower.includes('backend')) {
        title = 'Node.js Backend Developer';
        skills = 'Node.js, Express, REST APIs, PostgreSQL, MySQL, Redis, JWT';
        exp = '3+ Years';
        responsibilities = '- Structure clean and RESTful backend router patterns.\n- Optimize PostgreSQL databases and handle schema updates.\n- Construct high availability microservices.';
        benefits = '- Tech hardware allowance.\n- Premium medical coverage.\n- Performance stock incentives.';
      } else if (promptLower.includes('python') || promptLower.includes('django') || promptLower.includes('ai')) {
        title = 'Python AI Engineer';
        skills = 'Python, Django, FastAPI, PyTorch, LangChain, PostgreSQL, LLMs';
        exp = '3+ Years';
        responsibilities = '- Integrate state-of-the-art LLMs using LangChain libraries.\n- Deploy endpoints on FastAPI servers.\n- Train model sets and parse textual patterns.';
      } else if (promptLower.includes('hr') || promptLower.includes('recruiter')) {
        title = 'HR Recruiter';
        dept = 'Human Resources';
        skills = 'Recruiting, Sourcing, Interview scheduling, Communication, ATS Tools';
        exp = '1-2 Years';
        responsibilities = '- Source highly qualified engineering profiles.\n- Streamline candidate interview schedules.\n- Manage onboard workflows and documentation compliance.';
        benefits = '- Free daily lunch.\n- Premium corporate health policies.\n- Core work-life balance.';
      }

      setNewJob(prev => ({
        ...prev,
        job_title: title,
        department: dept,
        location: location,
        experience_required: exp,
        salary_range: '₹8,00,000 - ₹12,00,000 / year',
        skills_required: skills,
        responsibilities: responsibilities,
        benefits: benefits,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      }));

      setGeneratingJD(false);
      toast.success('AI parsed requirements and populated the Job Description form!');
    }, 2000);
  };

  // Move candidate to a different stage
  const handleUpdateStage = (candId, newStage) => {
    const updated = candidates.map(c => {
      if (c.id === candId) {
        toast.success(`${c.full_name} moved to: ${newStage}`);
        return { ...c, stage: newStage };
      }
      return c;
    });
    saveCandidates(updated);
  };

  // Filter candidates for selected job
  const filteredCandidates = candidates
    .filter(c => selectedJob && c.job_id === selectedJob.id)
    .filter(c => c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.extracted_skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

  // Sort candidates based on criteria
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (sortBy === 'overall') return b.ai_score - a.ai_score;
    if (sortBy === 'skill') return b.skill_match_score - a.skill_match_score;
    if (sortBy === 'experience') return b.experience_match_score - a.experience_match_score;
    if (sortBy === 'education') return b.education_match_score - a.education_match_score;
    if (sortBy === 'culture') return b.culture_fit_score - a.culture_fit_score;
    return b.ai_score - a.ai_score;
  });

  return (
    <DashboardLayout title="Careers & Recruitment" noPadding={false}>
      
      {/* Top action cards / summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-4 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-[#0969da] rounded-lg">
            <Briefcase size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-github-dark-muted font-medium">Active Openings</span>
            <p className="text-xl font-bold mt-0.5">{openings.filter(j => j.status === 'active').length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-4 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Users size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-github-dark-muted font-medium">Total Applicants</span>
            <p className="text-xl font-bold mt-0.5">{candidates.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-4 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <UserCheck size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-github-dark-muted font-medium">Top Match Score (AI)</span>
            <p className="text-xl font-bold mt-0.5">
              {candidates.length > 0 ? `${Math.max(...candidates.map(c => c.ai_score))}%` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border p-4 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-lg">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-github-dark-muted font-medium">Applied This Month</span>
            <p className="text-xl font-bold mt-0.5">{candidates.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs & Document Studio Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 font-sans">
        <div className="flex space-x-1 bg-slate-100 dark:bg-github-dark-subtle p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('openings')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-semibold transition-all duration-200 ${activeTab === 'openings'
              ? 'bg-white dark:bg-slate-700 text-[#0969da] dark:text-[#f0f6fc] shadow-sm'
              : 'text-slate-500 dark:text-github-dark-muted hover:text-slate-700 dark:hover:text-slate-200'
              }`}
          >
            <Briefcase size={16} className={`${activeTab === 'openings' ? 'text-[#0969da] dark:text-[#f0f6fc]' : 'text-slate-400'} -mt-[1px]`} />
            <span className="leading-none">Job Openings</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-semibold transition-all duration-200 ${activeTab === 'create'
              ? 'bg-white dark:bg-slate-700 text-[#0969da] dark:text-[#f0f6fc] shadow-sm'
              : 'text-slate-500 dark:text-github-dark-muted hover:text-slate-700 dark:hover:text-slate-200'
              }`}
          >
            <Plus size={16} className={`${activeTab === 'create' ? 'text-[#0969da] dark:text-[#f0f6fc]' : 'text-slate-400'} -mt-[1px]`} />
            <span className="leading-none">Create Career Opening</span>
          </button>
          <button
            onClick={() => {
              if (openings.length > 0 && !selectedJob) setSelectedJob(openings[0]);
              setActiveTab('pipeline');
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-semibold transition-all duration-200 ${activeTab === 'pipeline'
              ? 'bg-white dark:bg-slate-700 text-[#0969da] dark:text-[#f0f6fc] shadow-sm'
              : 'text-slate-500 dark:text-github-dark-muted hover:text-slate-700 dark:hover:text-slate-200'
              }`}
          >
            <Sliders size={16} className={`${activeTab === 'pipeline' ? 'text-[#0969da] dark:text-[#f0f6fc]' : 'text-slate-400'} -mt-[1px]`} />
            <span className="leading-none">Recruitment Pipeline</span>
          </button>
          <button
            onClick={() => {
              if (openings.length > 0 && !selectedJob) setSelectedJob(openings[0]);
              setActiveTab('candidates');
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-semibold transition-all duration-200 ${activeTab === 'candidates'
              ? 'bg-white dark:bg-slate-700 text-[#0969da] dark:text-[#f0f6fc] shadow-sm'
              : 'text-slate-500 dark:text-github-dark-muted hover:text-slate-700 dark:hover:text-slate-200'
              }`}
          >
            <Users size={16} className={`${activeTab === 'candidates' ? 'text-[#0969da] dark:text-[#f0f6fc]' : 'text-slate-400'} -mt-[1px]`} />
            <span className="leading-none">AI Candidates Ranking</span>
          </button>
        </div>

        {/* Document Studio Redirect Button */}
        <button
          onClick={() => navigate('/documents')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0969da] hover:bg-[#0969da]/90 text-white rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer"
        >
          <FileText size={15} />
          <span>HR Document Studio</span>
        </button>
      </div>

      {/* TAB 1: JOB OPENINGS LIST */}
      {activeTab === 'openings' && (
        <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 dark:text-github-dark-text">Job Openings Directory</h3>
              <button 
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 bg-[#0969da] hover:bg-[#0969da]/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Plus size={14} /> Create New Opening
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {openings.map(job => (
                <div 
                  key={job.id} 
                  className={`bg-slate-50/50 dark:bg-github-dark-bg/30 border rounded-2xl p-5 transition-all relative overflow-hidden flex flex-col justify-between ${job.status === 'inactive' ? 'opacity-60 border-slate-200 dark:border-github-dark-border/50' : 'border-slate-200 dark:border-github-dark-border hover:shadow-md'}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-extrabold text-base text-slate-800 dark:text-github-dark-text leading-snug">{job.job_title}</h4>
                        <span className="text-xs font-bold text-[#0969da] dark:text-github-dark-accent mt-0.5 inline-block">{job.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${job.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-slate-200 text-slate-600 dark:bg-github-dark-border dark:text-slate-400'}`}>
                          {job.status}
                        </span>
                        <button
                          onClick={() => toggleJobStatus(job.id)}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white border border-slate-200 dark:border-github-dark-border rounded px-1.5 py-0.5 transition-colors"
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-xs text-slate-500 dark:text-github-dark-muted my-4 font-medium">
                      <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {job.location}</span>
                      <span className="flex items-center gap-1.5"><Award size={14} className="text-slate-400" /> {job.experience_required} Required</span>
                      <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-slate-400" /> {job.employment_type}</span>
                      <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" /> Apply by {job.deadline}</span>
                    </div>

                    <div className="mb-4">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-github-dark-muted uppercase">Skills:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {job.skills_required.split(',').map((skill, i) => (
                          <span key={i} className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border px-2 py-0.5 rounded text-[10px] font-mono font-medium">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-github-dark-border/50 flex flex-wrap gap-3 items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-github-dark-text">
                        {candidates.filter(c => c.job_id === job.id).length} Applicants
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setActiveTab('pipeline');
                        }}
                        className="p-1.5 text-slate-500 hover:text-[#0969da] dark:hover:text-github-dark-accent rounded-lg border border-slate-200 dark:border-github-dark-border transition-colors hover:bg-slate-50 dark:hover:bg-github-dark-border/40"
                        title="View pipeline"
                      >
                        <Sliders size={14} />
                      </button>
                      <button
                        onClick={() => handleCopyLink(job.slug)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-github-dark-border hover:bg-slate-200 dark:hover:bg-github-dark-border/70 text-slate-700 dark:text-github-dark-text rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors border border-transparent dark:border-github-dark-border"
                      >
                        {copiedLink === job.slug ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        Share Link
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CREATE OPENING FORM & AI JD GENERATOR */}
        {activeTab === 'create' && (
          <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Form (2 Cols) */}
              <div className="lg:col-span-2">
                <h3 className="font-bold text-slate-800 dark:text-github-dark-text mb-6">Create Job Opening</h3>
                <form onSubmit={handleCreateJob} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-github-dark-muted mb-1 block">Job Title *</label>
                      <input
                        type="text"
                        required
                        value={newJob.job_title}
                        onChange={(e) => setNewJob({ ...newJob, job_title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                        placeholder="e.g. React Developer"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-github-dark-muted mb-1 block">Department *</label>
                      <input
                        type="text"
                        required
                        value={newJob.department}
                        onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                        placeholder="e.g. Engineering"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-github-dark-muted mb-1 block">Location *</label>
                      <input
                        type="text"
                        required
                        value={newJob.location}
                        onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                        placeholder="Bangalore, India / Remote"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-github-dark-muted mb-1 block">Employment Type</label>
                      <select
                        value={newJob.employment_type}
                        onChange={(e) => setNewJob({ ...newJob, employment_type: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-github-dark-muted mb-1 block">Experience Required *</label>
                      <input
                        type="text"
                        required
                        value={newJob.experience_required}
                        onChange={(e) => setNewJob({ ...newJob, experience_required: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                        placeholder="e.g. 2+ Years"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-github-dark-muted mb-1 block">Salary Range</label>
                      <input
                        type="text"
                        value={newJob.salary_range}
                        onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                        placeholder="e.g. ₹8,00,000 - ₹12,00,000 / year"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-github-dark-muted mb-1 block">Application Deadline *</label>
                      <input
                        type="date"
                        required
                        value={newJob.deadline}
                        onChange={(e) => setNewJob({ ...newJob, deadline: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-github-dark-muted mb-1 block">Skills Required * (Comma separated)</label>
                    <input
                      type="text"
                      required
                      value={newJob.skills_required}
                      onChange={(e) => setNewJob({ ...newJob, skills_required: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                      placeholder="React, Redux, JavaScript, CSS3"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-github-dark-muted mb-1 block">Responsibilities</label>
                    <textarea
                      rows="4"
                      value={newJob.responsibilities}
                      onChange={(e) => setNewJob({ ...newJob, responsibilities: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                      placeholder="Detail the daily responsibilities..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-github-dark-muted mb-1 block">Benefits</label>
                    <textarea
                      rows="3"
                      value={newJob.benefits}
                      onChange={(e) => setNewJob({ ...newJob, benefits: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-github-dark-bg border border-slate-200 dark:border-github-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0969da]/20 focus:border-[#0969da]"
                      placeholder="Detail company perks and benefits..."
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#0969da] hover:bg-[#0969da]/90 text-white rounded-xl text-sm font-semibold transition-all shadow-md"
                    >
                      Save Career Opening
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('openings')}
                      className="px-6 py-2.5 bg-slate-100 dark:bg-github-dark-border text-slate-700 dark:text-github-dark-text rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-github-dark-border/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: AI JD Assistant (1 Col) */}
              <div className="lg:col-span-1">
                <div className="border border-indigo-100 dark:border-indigo-950/50 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-2xl p-6 sticky top-6">
                  <h4 className="font-bold text-slate-800 dark:text-github-dark-text mb-2 flex items-center gap-1.5">
                    <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                    AI JD Generator
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    Type a simple command or requirement and let AI generate complete roles, requirements, benefits, and skills.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <textarea
                        rows="3"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-github-dark-border rounded-xl text-xs bg-white dark:bg-github-dark-subtle focus:outline-none"
                        placeholder="Need React Developer with 2 years experience..."
                      />
                    </div>

                    {generatingJD ? (
                      <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-3 text-center flex flex-col items-center gap-2 animate-pulse">
                        <Sparkles className="w-4.5 h-4.5 text-indigo-500 animate-spin" />
                        <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400">AI assembling complete JD package...</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGenerateJD}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all flex justify-center items-center gap-1 shadow-sm"
                      >
                        <Sparkles size={14} />
                        Auto-Generate JD Form
                      </button>
                    )}

                    <div className="border-t border-slate-200 dark:border-github-dark-border/50 pt-4 space-y-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Sample Prompts:</span>
                      <button
                        type="button"
                        onClick={() => setAiPrompt('Need React Developer with 2 years experience')}
                        className="w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-github-dark-border/40 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 font-mono transition-colors block border border-slate-100 dark:border-github-dark-border"
                      >
                        "Need React Developer with 2 years experience"
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiPrompt('Backend node developer with database skills and 3 years experience')}
                        className="w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-github-dark-border/40 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 font-mono transition-colors block border border-slate-100 dark:border-github-dark-border"
                      >
                        "Backend node developer with MySQL, 3 years exp"
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: PIPELINE KANBAN BOARD */}
        {activeTab === 'pipeline' && (
          <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-2xl p-6 shadow-sm flex flex-col">
            {/* Job Opening Selector Header */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100 dark:border-github-dark-border pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-github-dark-muted font-bold uppercase">Select Role:</span>
                <select
                  value={selectedJob ? selectedJob.id : ''}
                  onChange={(e) => setSelectedJob(openings.find(j => j.id === Number(e.target.value)))}
                  className="px-3 py-1.5 border border-slate-200 dark:border-github-dark-border bg-slate-50 dark:bg-github-dark-subtle rounded-lg text-xs font-bold focus:outline-none"
                >
                  {openings.map(job => (
                    <option key={job.id} value={job.id}>{job.job_title} ({job.department})</option>
                  ))}
                </select>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search applicants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0969da]"
                />
              </div>
            </div>

            {/* Kanban Columns Grid to prevent horizontal scrolling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {PIPELINE_STAGES.map(stage => {
                const stageCandidates = sortedCandidates.filter(c => c.stage === stage);
                return (
                  <div 
                    key={stage}
                    className="w-full bg-slate-50 dark:bg-github-dark-bg/40 border border-slate-100 dark:border-github-dark-border rounded-xl p-3 flex flex-col min-h-[160px] max-h-[400px]"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-3 px-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-github-dark-text">{stage}</span>
                      <span className="text-[10px] bg-slate-200 dark:bg-github-dark-border text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full">
                        {stageCandidates.length}
                      </span>
                    </div>

                    {/* Cards area */}
                    <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
                      {stageCandidates.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-github-dark-border/60 rounded-lg text-[10px] text-slate-400">
                          Empty
                        </div>
                      ) : (
                        stageCandidates.map(cand => (
                          <div 
                            key={cand.id}
                            className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-xl p-3 shadow-sm hover:border-[#0969da] transition-all group cursor-pointer"
                            onClick={() => setSelectedCandidate(cand)}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <h5 className="font-bold text-xs text-slate-800 dark:text-github-dark-text group-hover:text-[#0969da] transition-colors">
                                {cand.full_name}
                              </h5>
                              
                              {/* AI match circle */}
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                                cand.ai_score >= 85 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                                  : cand.ai_score >= 70 
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                              }`}>
                                {cand.ai_score}% Match
                              </span>
                            </div>
                            
                            <p className="text-[10px] text-slate-500 dark:text-github-dark-muted font-medium mb-2.5 truncate">
                              {cand.current_company}
                            </p>

                            <div className="flex flex-wrap gap-1 mb-2">
                              {cand.extracted_skills.slice(0, 3).map((s, idx) => (
                                <span key={idx} className="bg-slate-50 dark:bg-github-dark-border px-1.5 py-0.2 rounded text-[9px] font-mono">
                                  {s}
                                </span>
                              ))}
                              {cand.extracted_skills.length > 3 && (
                                <span className="text-[9px] text-slate-400 font-mono pl-0.5">+{cand.extracted_skills.length - 3}</span>
                              )}
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-github-dark-border/40 mt-1">
                              <span className="text-[9px] text-slate-400">{cand.created_at}</span>
                              
                              {/* Quick Move Trigger */}
                              <select
                                value={cand.stage}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleUpdateStage(cand.id, e.target.value)}
                                className="text-[9px] font-bold border-none bg-slate-50 hover:bg-slate-100 dark:bg-github-dark-border dark:hover:bg-github-dark-border/85 rounded px-1 text-slate-500 dark:text-github-dark-muted outline-none"
                              >
                                {PIPELINE_STAGES.map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: AI CANDIDATES RANKING */}
        {activeTab === 'candidates' && (
          <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100 dark:border-github-dark-border pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-github-dark-muted font-bold uppercase">Select Role:</span>
                <select
                  value={selectedJob ? selectedJob.id : ''}
                  onChange={(e) => setSelectedJob(openings.find(j => j.id === Number(e.target.value)))}
                  className="px-3 py-1.5 border border-slate-200 dark:border-github-dark-border bg-slate-50 dark:bg-github-dark-subtle rounded-lg text-xs font-bold focus:outline-none"
                >
                  {openings.map(job => (
                    <option key={job.id} value={job.id}>{job.job_title} ({job.department})</option>
                  ))}
                </select>
              </div>

              {/* Sorting triggers */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sort Candidates automatically by:</span>
                <div className="bg-slate-100 dark:bg-github-dark-border p-1 rounded-xl flex gap-1 border border-transparent dark:border-github-dark-border">
                  <button
                    onClick={() => setSortBy('overall')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${sortBy === 'overall' ? 'bg-white dark:bg-github-dark-subtle shadow-sm text-[#0969da] dark:text-github-dark-text' : 'text-slate-600 dark:text-github-dark-muted hover:text-slate-800'}`}
                  >
                    Overall Score
                  </button>
                  <button
                    onClick={() => setSortBy('skill')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${sortBy === 'skill' ? 'bg-white dark:bg-github-dark-subtle shadow-sm text-[#0969da] dark:text-github-dark-text' : 'text-slate-600 dark:text-github-dark-muted hover:text-slate-800'}`}
                  >
                    Skills Match
                  </button>
                  <button
                    onClick={() => setSortBy('experience')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${sortBy === 'experience' ? 'bg-white dark:bg-github-dark-subtle shadow-sm text-[#0969da] dark:text-github-dark-text' : 'text-slate-600 dark:text-github-dark-muted hover:text-slate-800'}`}
                  >
                    Experience Match
                  </button>
                  <button
                    onClick={() => setSortBy('education')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${sortBy === 'education' ? 'bg-white dark:bg-github-dark-subtle shadow-sm text-[#0969da] dark:text-github-dark-text' : 'text-slate-600 dark:text-github-dark-muted hover:text-slate-800'}`}
                  >
                    Education Match
                  </button>
                  <button
                    onClick={() => setSortBy('culture')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${sortBy === 'culture' ? 'bg-white dark:bg-github-dark-subtle shadow-sm text-[#0969da] dark:text-github-dark-text' : 'text-slate-600 dark:text-github-dark-muted hover:text-slate-800'}`}
                  >
                    Culture Fit
                  </button>
                </div>
              </div>
            </div>

            {/* List of candidates with ranking indicators */}
            <div className="space-y-4">
              {sortedCandidates.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-github-dark-border rounded-xl">
                  <AlertCircle size={36} className="mx-auto text-slate-400 mb-2" />
                  <h4 className="font-bold text-sm text-slate-700 dark:text-github-dark-text">No Applicants Yet</h4>
                  <p className="text-xs text-slate-500 dark:text-github-dark-muted max-w-xs mx-auto mt-1">
                    Share the public career link with candidates to receive applications.
                  </p>
                </div>
              ) : (
                sortedCandidates.map((cand, idx) => (
                  <div 
                    key={cand.id}
                    className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-center justify-between"
                  >
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      {/* Rank Indicator Badge */}
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                        idx === 0 
                          ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/50' 
                          : idx === 1
                            ? 'bg-slate-100 border-slate-300 text-slate-600 dark:bg-github-dark-border dark:border-github-dark-border/80'
                            : 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/20 dark:border-orange-900/50'
                      }`}>
                        #{idx + 1}
                      </span>

                      <div>
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-github-dark-text">{cand.full_name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cand.ai_recommendation === 'Highly Recommended' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                          }`}>
                            {cand.ai_recommendation}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-github-dark-muted font-medium mt-1">
                          Current: <span className="font-semibold text-slate-700 dark:text-github-dark-text">{cand.current_company}</span> &bull; Stage: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{cand.stage}</span>
                        </p>
                      </div>
                    </div>

                    {/* Matching scores distribution */}
                    <div className="grid grid-cols-5 gap-3 w-full md:w-auto text-center border-t border-b md:border-none border-slate-100 dark:border-github-dark-border/40 py-3 my-2 md:py-0 md:my-0">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Skills</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-github-dark-text">{cand.skill_match_score}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Experience</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-github-dark-text">{cand.experience_match_score}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Education</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-github-dark-text">{cand.education_match_score}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Culture</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-github-dark-text">{cand.culture_fit_score}%</span>
                      </div>
                      <div className="bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-100 dark:border-indigo-900/30 px-3 py-1 rounded-xl">
                        <span className="text-[10px] text-indigo-500 block uppercase font-extrabold">Overall</span>
                        <span className="text-xs font-black text-indigo-700 dark:text-indigo-400">{cand.ai_score}%</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 w-full md:w-auto justify-end">
                      <button
                        onClick={() => setSelectedCandidate(cand)}
                        className="px-4 py-2 bg-slate-100 dark:bg-github-dark-border hover:bg-slate-200 dark:hover:bg-github-dark-border/80 text-slate-700 dark:text-github-dark-text rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-transparent dark:border-github-dark-border"
                      >
                        <Eye size={14} /> View AI Report
                      </button>

                      {/* Dropdown for pipeline */}
                      <select
                        value={cand.stage}
                        onChange={(e) => handleUpdateStage(cand.id, e.target.value)}
                        className="px-3 py-2 border border-slate-200 dark:border-github-dark-border bg-slate-50 dark:bg-github-dark-subtle rounded-xl text-xs font-bold focus:outline-none"
                      >
                        {PIPELINE_STAGES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      {/* AI CANDIDATE SUMMARY MODAL */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-github-dark-subtle border border-slate-200 dark:border-github-dark-border rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-github-dark-border flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-extrabold text-xl text-slate-800 dark:text-github-dark-text">{selectedCandidate.full_name}</h3>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    selectedCandidate.ai_recommendation === 'Highly Recommended' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                  }`}>
                    {selectedCandidate.ai_recommendation}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-github-dark-muted font-medium mt-1 flex items-center gap-4">
                  <span>Email: {selectedCandidate.email}</span>
                  <span>Mobile: {selectedCandidate.mobile}</span>
                  <span>Notice Period: <strong className="text-slate-700 dark:text-github-dark-text">{selectedCandidate.notice_period}</strong></span>
                </p>
              </div>

              <button 
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-github-dark-border transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm custom-scrollbar">
              
              {/* Score bar */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-1 border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase font-extrabold block">AI Score</span>
                  <div className="w-20 h-20 rounded-full border-4 border-indigo-500 flex items-center justify-center text-2xl font-black text-indigo-700 dark:text-indigo-400 mt-2 bg-white dark:bg-github-dark-subtle shadow-sm">
                    {selectedCandidate.ai_score}%
                  </div>
                </div>

                <div className="md:col-span-4 bg-slate-50 dark:bg-github-dark-bg/50 border border-slate-200 dark:border-github-dark-border rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 items-center justify-center text-center">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-github-dark-muted uppercase">Skills Match</span>
                    <p className="text-xl font-bold mt-1">{selectedCandidate.skill_match_score}%</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-github-dark-muted uppercase">Experience Match</span>
                    <p className="text-xl font-bold mt-1">{selectedCandidate.experience_match_score}%</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-github-dark-muted uppercase">Education Match</span>
                    <p className="text-xl font-bold mt-1">{selectedCandidate.education_match_score}%</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-github-dark-muted uppercase">Culture Fit</span>
                    <p className="text-xl font-bold mt-1">{selectedCandidate.culture_fit_score}%</p>
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50/30 dark:bg-emerald-950/5 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5">
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm flex items-center gap-1.5 mb-3">
                    <ThumbsUp size={16} /> Strengths
                  </h4>
                  <ul className="space-y-2 list-disc pl-5 text-slate-600 dark:text-slate-300">
                    {selectedCandidate.ai_strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-50/30 dark:bg-red-950/5 border border-red-100 dark:border-red-900/30 rounded-2xl p-5">
                  <h4 className="font-bold text-red-800 dark:text-red-400 text-sm flex items-center gap-1.5 mb-3">
                    <ThumbsDown size={16} /> Weaknesses
                  </h4>
                  <ul className="space-y-2 list-disc pl-5 text-slate-600 dark:text-slate-300">
                    {selectedCandidate.ai_weaknesses.map((weak, idx) => (
                      <li key={idx}>{weak}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Extracted Profile Details */}
              <div className="bg-white dark:bg-github-dark-bg/20 border border-slate-200 dark:border-github-dark-border rounded-2xl p-6 space-y-5">
                <h4 className="font-bold text-slate-800 dark:text-github-dark-text border-b border-slate-100 dark:border-github-dark-border pb-2 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-indigo-500" /> Extracted Candidate Profile (AI Resume parsing)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Education</span>
                    <p className="font-semibold text-slate-800 dark:text-github-dark-text mt-1">{selectedCandidate.education}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Experience</span>
                    <p className="font-semibold text-slate-800 dark:text-github-dark-text mt-1">{selectedCandidate.total_experience} (Relevant: {selectedCandidate.relevant_experience})</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Current CTC &amp; Company</span>
                    <p className="font-semibold text-slate-800 dark:text-github-dark-text mt-1">{selectedCandidate.current_ctc} &bull; {selectedCandidate.current_company}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Parsed Skills List</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCandidate.extracted_skills.map((skill, idx) => (
                      <span key={idx} className="bg-slate-100 dark:bg-github-dark-border px-2.5 py-1 rounded text-xs font-mono font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedCandidate.projects.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Key Projects</span>
                    <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      {selectedCandidate.projects.map((proj, idx) => (
                        <li key={idx} className="font-medium">{proj}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedCandidate.achievements.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Top Achievements</span>
                    <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      {selectedCandidate.achievements.map((ach, idx) => (
                        <li key={idx} className="font-medium text-indigo-600 dark:text-indigo-400">{ach}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedCandidate.cover_letter && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Cover Note</span>
                    <p className="p-3 bg-slate-50 dark:bg-github-dark-bg/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line italic">
                      "{selectedCandidate.cover_letter}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-github-dark-border bg-slate-50 dark:bg-github-dark-bg/30 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 dark:text-github-dark-muted">Change pipeline stage:</span>
                <select
                  value={selectedCandidate.stage}
                  onChange={(e) => {
                    handleUpdateStage(selectedCandidate.id, e.target.value);
                    setSelectedCandidate(prev => ({ ...prev, stage: e.target.value }));
                  }}
                  className="px-3 py-1.5 border border-slate-200 dark:border-github-dark-border bg-white dark:bg-github-dark-subtle rounded-xl text-xs font-bold focus:outline-none"
                >
                  {PIPELINE_STAGES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-5 py-2 bg-[#0969da] hover:bg-[#0969da]/90 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default RecruitmentDashboard;
