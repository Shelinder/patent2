// import React, { useCallback, useEffect, useMemo, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { dashboardAPI, patentAPI } from '../../utils/api';

// const SidebarItem = ({ active, icon, label, onClick }) => {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
//         active
//           ? 'bg-gradient-to-r from-[#e600c7] to-[#9b00a8] text-white shadow-[0_0_22px_rgba(230,0,199,0.35)]'
//           : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
//       }`}
//     >
//       <span className="text-lg">{icon}</span>
//       <span>{label}</span>
//     </button>
//   );
// };

// const StatCard = ({ icon, title, value, subText, tone = 'green' }) => {
//   const toneClass = tone === 'pink' ? 'text-[#ff20d8]' : 'text-emerald-400';

//   return (
//     <div className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.25)]">
//       <div className="flex items-start gap-4">
//         <div className="w-12 h-12 rounded-xl bg-[#b000a8]/80 flex items-center justify-center text-xl shadow-[0_0_18px_rgba(230,0,199,0.35)]">
//           {icon}
//         </div>

//         <div>
//           <p className="text-gray-400 text-xs mb-1">{title}</p>
//           <h3 className="text-2xl font-semibold tracking-tight">{value}</h3>
//           <p className={`text-xs mt-1 ${toneClass}`}>{subText}</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// const MiniLineChart = () => {
//   const points = [
//     22, 42, 35, 37, 30, 44, 52, 70, 64, 68, 82, 65, 78, 74, 62, 80, 72, 86,
//   ];

//   const max = Math.max(...points);
//   const min = Math.min(...points);

//   const path = points
//     .map((value, index) => {
//       const x = (index / (points.length - 1)) * 100;
//       const y = 100 - ((value - min) / (max - min)) * 80 - 10;
//       return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
//     })
//     .join(' ');

//   return (
//     <div className="h-[230px] w-full">
//       <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
//         {[20, 40, 60, 80].map((line) => (
//           <line
//             key={line}
//             x1="0"
//             x2="100"
//             y1={line}
//             y2={line}
//             stroke="rgba(255,255,255,0.08)"
//             strokeWidth="0.4"
//           />
//         ))}

//         {[12, 24, 36, 48, 60, 72, 84].map((line) => (
//           <line
//             key={line}
//             y1="0"
//             y2="100"
//             x1={line}
//             x2={line}
//             stroke="rgba(255,255,255,0.06)"
//             strokeWidth="0.35"
//           />
//         ))}

//         <path
//           d={path}
//           fill="none"
//           stroke="#e600c7"
//           strokeWidth="2"
//           vectorEffect="non-scaling-stroke"
//         />

//         <path
//           d={path}
//           fill="none"
//           stroke="#7a1cff"
//           strokeWidth="1"
//           opacity="0.65"
//           transform="translate(0,-8)"
//           vectorEffect="non-scaling-stroke"
//         />
//       </svg>
//     </div>
//   );
// };

// const UserDashboard = () => {
//   const navigate = useNavigate();

//   const user = useMemo(() => {
//     try {
//       return JSON.parse(localStorage.getItem('user')) || null;
//     } catch {
//       return null;
//     }
//   }, []);

//    const storedApiKey = localStorage.getItem('api_key');

//   const [activeTab, setActiveTab] = useState('dashboard');
//   const [loading, setLoading] = useState(true);
//   const [dashboard, setDashboard] = useState(null);
//   const [dashboardError, setDashboardError] = useState('');

//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchLoading, setSearchLoading] = useState(false);
//   const [searchError, setSearchError] = useState('');
//   const [searchedPatent, setSearchedPatent] = useState(null);
//   const [searchMeta, setSearchMeta] = useState(null);

//   const [copiedApiKey, setCopiedApiKey] = useState(false);

//   const loadDashboard = useCallback(async () => {
//     try {
//       setLoading(true);
//       setDashboardError('');

//       const response = await dashboardAPI.getDashboard();

//       if (response?.success) {
//         setDashboard(response.data);

//         if (response.data?.user) {
//           localStorage.setItem('user', JSON.stringify(response.data.user));
//         }

//         if (response.data?.api_key?.key) {
//           localStorage.setItem('api_key', response.data.api_key.key);
//         }
//       }
//     } catch (err) {
//       if (err.response?.status === 401) {
//         localStorage.removeItem('token');
//         localStorage.removeItem('api_key');
//         localStorage.removeItem('user');
//         navigate('/login', { replace: true });
//         return;
//       }

//       setDashboard(null);
//       setDashboardError(err.response?.data?.message || 'Failed to load dashboard data.');
//     } finally {
//       setLoading(false);
//     }
//   }, [navigate]);

//   useEffect(() => {
//     loadDashboard();
//   }, [loadDashboard]);

//   const fallback = {
//     plan: {
//       name: user?.plan || 'No plan selected',
//       code: user?.plan || 'none',
//       search_limit: 0,
//       searches_used: 0,
//       searches_remaining: 0,
//       expires_at: user?.plan_expires_at || null,
//     },
//     totals: {
//       total_searches: 0,
//       successful_searches: 0,
//       failed_searches: 0,
//       reports_saved: 0,
//     },
//     recent_searches: [],
//   };

//   const data = dashboard || fallback;
//   const currentUser = data.user || user || {};
//   const plan = data.plan || fallback.plan;
//   const totals = data.totals || fallback.totals;
//   const recentSearches = data.recent_searches || [];

//   const searchLimit = Number(plan.search_limit || 0);
//   const searchesUsed = Number(plan.searches_used || 0);
//   const searchesRemaining = Number(
//     plan.searches_remaining ?? Math.max(searchLimit - searchesUsed, 0)
//   );

//   const usagePercent =
//     searchLimit > 0 ? Math.min(Math.round((searchesUsed / searchLimit) * 100), 100) : 0;

//   const apiKeyValue = data.api_key?.key || storedApiKey;

//   const maskedApiKey = apiKeyValue
//     ? `${apiKeyValue.slice(0, 6)}${'*'.repeat(22)}${apiKeyValue.slice(-4)}`
//     : 'No API key found';

//       const handlePatentSearch = async (e) => {
//     e.preventDefault();

//     const patentNumber = searchQuery.trim();

//     if (!patentNumber) {
//       setSearchError('Enter a patent number first.');
//       return;
//     }

//     try {
//       setSearchLoading(true);
//       setSearchError('');
//       setSearchedPatent(null);
//       setSearchMeta(null);

//       const response = await patentAPI.getPatentByNumber(patentNumber);

//       if (response?.success) {
//         setSearchedPatent(response.data);
//         setSearchMeta(response.meta || null);
//         await loadDashboard();
//       }
//     } catch (err) {
//       const message = err.response?.data?.message || 'Patent search failed.';
//       setSearchError(message);
//       setSearchMeta(err.response?.data?.meta || null);

//       // Not-found searches are also logged, so refresh dashboard.
//       await loadDashboard();
//     } finally {
//       setSearchLoading(false);
//     }
//   };

//   const handleCopyApiKey = async () => {
//     if (!apiKeyValue) return;

//     try {
//       await navigator.clipboard.writeText(apiKeyValue);
//       setCopiedApiKey(true);

//       setTimeout(() => {
//         setCopiedApiKey(false);
//       }, 1500);
//     } catch {
//       setCopiedApiKey(false);
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('api_key');
//     localStorage.removeItem('user');
//     navigate('/', { replace: true });
//   };

//   return (
//     <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden">
//       <div
//         className="fixed inset-0 z-0 opacity-20 pointer-events-none"
//         style={{
//           backgroundImage: 'radial-gradient(rgba(145, 142, 142, 0.35) 1px, transparent 1px)',
//           backgroundSize: '28px 28px',
//         }}
//       />

//       <div className="fixed top-[-15%] right-[-10%] w-[520px] h-[520px] bg-[#a810a8]/20 blur-[170px] rounded-full pointer-events-none" />
//       <div className="fixed bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-[#7b00ff]/10 blur-[180px] rounded-full pointer-events-none" />

//       <div className="relative z-10 flex min-h-screen">
//         {/* Sidebar */}
//         <aside className="hidden lg:flex w-[250px] shrink-0 bg-[#09090a] border-r border-white/10 px-5 py-8 flex-col">
//           <button
//             type="button"
//             onClick={() => navigate('/')}
//             className="text-left text-3xl font-serif tracking-tight mb-10"
//           >
//             mixpanel
//           </button>

//           <div className="space-y-3">
//             <SidebarItem
//               active={activeTab === 'dashboard'}
//               icon="⌂"
//               label="Dashboard"
//               onClick={() => setActiveTab('dashboard')}
//             />
//             <SidebarItem
//               active={activeTab === 'profile'}
//               icon="♙"
//               label="User profile"
//               onClick={() => setActiveTab('profile')}
//             />
//             <SidebarItem
//               active={activeTab === 'api'}
//               icon="⚿"
//               label="API keys"
//               onClick={() => setActiveTab('api')}
//             />
//             <SidebarItem
//               active={activeTab === 'plan'}
//               icon="♛"
//               label="Plan"
//               onClick={() => setActiveTab('plan')}
//             />
//             <SidebarItem
//               active={activeTab === 'docs'}
//               icon="▣"
//               label="Documentation"
//               onClick={() => setActiveTab('docs')}
//             />
//           </div>

//           <div className="mt-auto space-y-3">
//             <button
//               type="button"
//               onClick={() => navigate('/')}
//               className="w-full border border-white/10 text-gray-300 hover:text-white hover:bg-white/[0.05] rounded-xl px-5 py-3 text-sm transition-colors"
//             >
//               Back to Home
//             </button>

//             <button
//               type="button"
//               onClick={handleLogout}
//               className="w-full border border-red-500/30 text-red-300 hover:bg-red-500/10 rounded-xl px-5 py-3 text-sm transition-colors"
//             >
//               Logout
//             </button>
//           </div>
//         </aside>

//         {/* Main */}
//         <main className="flex-1 h-screen overflow-y-auto px-5 md:px-8 py-7">
//           <div className="max-w-[1280px] mx-auto">
//             {/* Header */}
//             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">
//               <div>
//                 <p className="text-xs text-[#ff20d8] mb-2">
//                   ●  Welcome back, {currentUser?.name || 'User'} 👋
//                 </p>

//                 <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
//                   Patent Intelligence Dashboard
//                 </h1>

//                 <p className="text-gray-400 text-sm mt-2">
//                   Monitor innovation trends, API usage, searched patent data, and your monthly search limits.
//                 </p>
//               </div>

//               <div className="flex items-center gap-3">
//                 <div className="bg-[#0b0b0d] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300">
//   {plan.expires_at
//     ? `Valid till ${new Date(plan.expires_at).toLocaleDateString()}`
//     : 'No active plan'}
// </div>

//                 <button
//                   type="button"
//                   onClick={() => navigate('/')}
//                   className="lg:hidden bg-[#a810a8] px-5 py-3 rounded-xl text-sm font-semibold"
//                 >
//                   Home
//                 </button>
//               </div>
//             </div>

//             {loading && (
//               <div className="mb-5 bg-[#0b0b0d] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-400">
//                 Loading dashboard data...
//               </div>
//             )}

//             {dashboardError && !loading && (
//   <div className="mb-5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-200">
//     {dashboardError}
//   </div>
// )}

// {dashboard && !data.active_plan && (
//   <div className="mb-5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-sm text-yellow-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
//     <span>No active plan found. Select Free or Pro to start searching patents.</span>

//     <button
//       type="button"
//       onClick={() => navigate('/#pricing')}
//       className="bg-[#a810a8] px-5 py-2 rounded-lg text-white text-sm font-semibold"
//     >
//       Choose Plan
//     </button>
//   </div>
// )}

//             <div className="grid xl:grid-cols-[1fr_320px] gap-6">
//               <div className="space-y-6">
//                 {/* Stats */}
//                 <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
//                   <StatCard
//                     icon="▦"
//                     title="Total patent searches"
//                     value={totals.total_searches || 0}
//                     subText="All time"
//                   />

//                   <StatCard
//                     icon="⌘"
//                     title="Search limit remaining"
//                     value={searchesRemaining}
//                     subText={`${searchLimit || 0} monthly limit`}
//                   />

//                   <StatCard
//                     icon="▣"
//                     title="Successful results"
//                     value={totals.successful_searches || 0}
//                     subText="Patent found"
//                   />

//                   <StatCard
//                     icon="⚠"
//                     title="Failed / not found"
//                     value={totals.failed_searches || 0}
//                     subText="No token should be consumed"
//                     tone="pink"
//                   />
//                 </div>

//                 {/* Patent Search */}
// <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
//   <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
//     <div>
//       <h2 className="text-lg font-semibold">Search patent</h2>
//       <p className="text-xs text-gray-500 mt-1">
//         Successful searches consume one token. Not-found searches are logged but do not consume token.
//       </p>
//     </div>

//     <div className="text-xs text-gray-400">
//       Remaining: <span className="text-white font-semibold">{searchesRemaining}</span> / {searchLimit}
//     </div>
//   </div>

//   <form onSubmit={handlePatentSearch} className="flex flex-col md:flex-row gap-3">
//     <input
//       type="text"
//       value={searchQuery}
//       onChange={(e) => setSearchQuery(e.target.value)}
//       placeholder="Enter patent number, e.g. AP993A"
//       className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-[#ff20d8]/60"
//     />

//     <button
//       type="submit"
//       disabled={searchLoading || searchesRemaining <= 0}
//       className="bg-gradient-to-r from-[#e600c7] to-[#9b00a8] px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
//     >
//       {searchLoading ? 'Searching...' : searchesRemaining <= 0 ? 'Limit Finished' : 'Search'}
//     </button>
//   </form>

//   {searchError && (
//     <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl px-4 py-3 text-sm">
//       {searchError}
//     </div>
//   )}

//   {searchMeta && (
//     <div className="mt-4 grid sm:grid-cols-4 gap-3">
//       {[
//         ['Plan', searchMeta.plan_code || plan.code || '-'],
//         ['Limit', searchMeta.search_limit ?? searchLimit],
//         ['Used', searchMeta.searches_used ?? searchesUsed],
//         ['Remaining', searchMeta.searches_remaining ?? searchesRemaining],
//       ].map(([label, value]) => (
//         <div key={label} className="bg-black/40 border border-white/10 rounded-xl p-3">
//           <p className="text-xs text-gray-500 mb-1">{label}</p>
//           <p className="text-sm font-semibold">{value}</p>
//         </div>
//       ))}
//     </div>
//   )}

//   {searchedPatent && (
//     <div className="mt-5 bg-black/40 border border-white/10 rounded-2xl p-5">
//       <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
//         <div>
//           <p className="text-xs text-[#ff20d8] mb-1">{searchedPatent.patent_number}</p>
//           <h3 className="text-lg font-semibold">
//             {searchedPatent.title_en || 'Untitled patent'}
//           </h3>
//         </div>

//         <span className="w-max bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs">
//           Token consumed
//         </span>
//       </div>

//       <p className="text-sm text-gray-400 line-clamp-4">
//         {searchedPatent.abstract_en || 'No abstract available.'}
//       </p>
//     </div>
//   )}
// </section>

//                 {/* Chart */}
//                 <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
//                   <div className="flex items-center justify-between mb-4">
//                     <div>
//                       <h2 className="text-lg font-semibold">Patent search trends</h2>
//                       <p className="text-xs text-gray-500 mt-1">Monthly activity overview</p>
//                     </div>

//                     <button className="border border-white/10 bg-white/[0.03] rounded-lg px-4 py-2 text-xs text-gray-300">
//                       Last 12 months
//                     </button>
//                   </div>

//                   <div className="flex items-center gap-5 text-xs mb-2">
//                     <span className="flex items-center gap-2 text-gray-400">
//                       <span className="w-2 h-2 rounded-full bg-[#7a1cff]" />
//                       Total filing
//                     </span>

//                     <span className="flex items-center gap-2 text-gray-400">
//                       <span className="w-2 h-2 rounded-full bg-[#e600c7]" />
//                       Searches
//                     </span>
//                   </div>

//                   <MiniLineChart />

//                   <div className="grid sm:grid-cols-4 border-t border-white/10 mt-2">
//                     {[
//                       ['Search attempts', totals.total_searches || 0],
//                       ['Successful searches', totals.successful_searches || 0],
//                       ['Searches used', searchesUsed],
//                       ['Remaining limit', searchesRemaining],
//                     ].map(([label, value]) => (
//                       <div key={label} className="p-4 border-r border-white/10 last:border-r-0">
//                         <p className="text-gray-500 text-xs mb-1">{label}</p>
//                         <p className="font-semibold">{value}</p>
//                       </div>
//                     ))}
//                   </div>
//                 </section>

//                 <div className="grid xl:grid-cols-3 gap-6">
//                   {/* Technology Area */}
//                   <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
//                     <h2 className="text-lg font-semibold mb-5">Top technology area</h2>

//                     <div className="flex items-center justify-center gap-5 mb-5">
//                       <div className="w-24 h-24 rounded-full border-[12px] border-[#7a1cff] border-r-[#03c36b] border-b-[#ff20d8]" />
//                       <div className="w-24 h-24 rounded-full border-[12px] border-[#7a1cff] border-l-[#03c36b] border-b-[#ff20d8]" />
//                     </div>

//                     <div className="space-y-3 text-xs">
//                       {[
//                         ['AI / machine learning', '23%'],
//                         ['Battery technology', '23%'],
//                         ['Electronics vehicles', '23%'],
//                         ['Others', '23%'],
//                       ].map(([label, value]) => (
//                         <div key={label} className="flex items-center justify-between text-gray-400">
//                           <span className="flex items-center gap-2">
//                             <span className="w-2 h-2 rounded-full bg-[#e600c7]" />
//                             {label}
//                           </span>
//                           <span>{value}</span>
//                         </div>
//                       ))}
//                     </div>
//                   </section>

//                   {/* Recent Activity */}
//                   <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
//                     <h2 className="text-lg font-semibold mb-5">Recent activity</h2>

//                     <div className="space-y-4">
//                       {recentSearches.length > 0 ? (
//                         recentSearches.slice(0, 5).map((item) => (
//                           <div key={item.id} className="flex items-start gap-3">
//                             <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm">
//                               🔎
//                             </div>

//                             <div className="min-w-0 flex-1">
//                               <div className="flex justify-between gap-2">
//                                 <p className="text-sm font-medium truncate">
//                                   {item.patent_number}
//                                 </p>
//                                 <span className="text-xs text-gray-500">
//                                   {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
//                                 </span>
//                               </div>

//                               <p className="text-xs text-gray-500 truncate">
//                                 Result: {item.status}
//                               </p>
//                             </div>
//                           </div>
//                         ))
//                       ) : (
//                         <div className="text-sm text-gray-500">
//                           No patent search activity yet.
//                         </div>
//                       )}
//                     </div>
//                   </section>

//                   {/* AI Alerts */}
//                   <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
//                     <h2 className="text-lg font-semibold mb-5">AI opportunity alerts</h2>

//                     <div className="space-y-4">
//                       {[
//                         ['Quantum computing', 'High'],
//                         ['Battery optimization', 'Medium'],
//                         ['Medical imaging', 'High'],
//                         ['Autonomous sensors', 'Medium'],
//                       ].map(([name, level]) => (
//                         <div key={name} className="flex items-center gap-3">
//                           <div className="w-9 h-9 rounded-full bg-[#b000a8]/60 flex items-center justify-center">
//                             🔍
//                           </div>

//                           <div className="flex-1 min-w-0">
//                             <p className="text-sm font-medium truncate">Patent search</p>
//                             <p className="text-xs text-gray-500 truncate">{name}</p>
//                           </div>

//                           <span
//                             className={`text-[10px] px-3 py-1 rounded-full border ${
//                               level === 'High'
//                                 ? 'border-[#ff20d8] text-[#ff20d8]'
//                                 : 'border-yellow-500 text-yellow-400'
//                             }`}
//                           >
//                             {level}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                   </section>
//                 </div>

//                 {/* Search Logs */}
//                 <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
//                   <div className="flex items-center justify-between mb-5">
//                     <div>
//                       <h2 className="text-lg font-semibold">Patent search history</h2>
//                       <p className="text-xs text-gray-500 mt-1">
//                         Shows what user searched, result status, and whether token was consumed.
//                       </p>
//                     </div>
//                   </div>

//                   <div className="overflow-x-auto">
//                     <table className="w-full text-left text-sm">
//                       <thead>
//                         <tr className="border-b border-white/10 text-gray-500">
//                           <th className="py-3 pr-4 font-medium">Patent number</th>
//                           <th className="py-3 pr-4 font-medium">Result</th>
//                           <th className="py-3 pr-4 font-medium">Token used</th>
//                           <th className="py-3 pr-4 font-medium">Date</th>
//                         </tr>
//                       </thead>

//                       <tbody>
//                         {recentSearches.length > 0 ? (
//                           recentSearches.map((item) => (
//                             <tr key={item.id} className="border-b border-white/5 last:border-b-0">
//                               <td className="py-4 pr-4 text-white">{item.patent_number}</td>
//                               <td className="py-4 pr-4">
//                                 <span
//                                   className={`px-3 py-1 rounded-full text-xs ${
//                                     item.status === 'success'
//                                       ? 'bg-emerald-500/10 text-emerald-400'
//                                       : 'bg-red-500/10 text-red-300'
//                                   }`}
//                                 >
//                                   {item.status}
//                                 </span>
//                               </td>
//                               <td className="py-4 pr-4 text-gray-300">
//                                 {item.consumed_token ? 'Yes' : 'No'}
//                               </td>
//                               <td className="py-4 pr-4 text-gray-500">
//                                 {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
//                               </td>
//                             </tr>
//                           ))
//                         ) : (
//                           <tr>
//                             <td colSpan="4" className="py-8 text-center text-gray-500">
//                               No search logs found yet.
//                             </td>
//                           </tr>
//                         )}
//                       </tbody>
//                     </table>
//                   </div>
//                 </section>
//               </div>

//               {/* Right side */}
//               <aside className="space-y-6">
//                 {/* API Access */}
//                 <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
//                   <div className="flex items-center gap-3 mb-5">
//                     <div className="w-10 h-10 rounded-xl bg-[#b000a8]/60 flex items-center justify-center">
//                       ⌘
//                     </div>
//                     <h2 className="text-lg font-semibold">API Access</h2>
//                   </div>

//                   <p className="text-xs text-gray-500 mb-2">Your API key</p>

//                   <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-gray-300 break-all mb-4">
//                     {maskedApiKey}
//                   </div>

//                   <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
//                     <span>Usage this month</span>
//                     <span>{usagePercent}%</span>
//                   </div>

//                   <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
//                     <div
//                       className="h-full bg-gradient-to-r from-[#ff20d8] to-[#9b00ff] rounded-full"
//                       style={{ width: `${usagePercent}%` }}
//                     />
//                   </div>

//                   <p className="text-xs text-gray-500 mb-5">
//                     {searchesUsed}/{searchLimit || 0} searches used
//                   </p>

//                   <button
//   type="button"
//   onClick={handleCopyApiKey}
//   disabled={!apiKeyValue}
//   className="w-full bg-gradient-to-r from-[#e600c7] to-[#9b00a8] py-3 rounded-xl text-sm font-semibold mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
// >
//   {copiedApiKey ? 'Copied' : 'Copy API Key'}
// </button>

//                   <button
//                     type="button"
//                     className="w-full text-[#ff20d8] text-sm font-semibold"
//                   >
//                     API Document →
//                   </button>
//                 </section>

//                 {/* Current Plan */}
//                 <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
//                   <div className="flex items-center justify-between mb-5">
//                     <div className="flex items-center gap-3">
//                       <span className="text-yellow-400 text-xl">♛</span>
//                       <h2 className="text-lg font-semibold">Current plan</h2>
//                     </div>

//                     <button
//                       type="button"
//                       onClick={() => navigate('/#pricing')}
//                       className="border border-[#ff20d8]/40 text-[#ff20d8] px-4 py-2 rounded-lg text-xs"
//                     >
//                       Manage plan
//                     </button>
//                   </div>

//                   <h3 className="text-2xl font-semibold capitalize mb-5">
//                     {plan.name || plan.code}
//                   </h3>

//                   <div className="space-y-3 text-sm">
//                     <div className="flex items-center justify-between gap-3">
//                       <span className="flex items-center gap-2 text-gray-300">
//                         <span className="text-emerald-400">✓</span>
//                         {searchLimit || 0} searches/month
//                       </span>
//                       <span className="text-gray-500 text-xs">{searchesRemaining} remaining</span>
//                     </div>

//                     {(plan.features?.length
//   ? plan.features
//   : ['Basic search & filters', 'Patent result tracking', 'Usage analytics']
// ).map((feature) => (
//   <p key={feature} className="flex items-center gap-2 text-gray-300">
//     <span className="text-emerald-400">✓</span>
//     {feature}
//   </p>
// ))}
//                   </div>

//                   <div className="mt-5 pt-5 border-t border-white/10">
//                     <p className="text-xs text-gray-500">Expires at</p>
//                     <p className="text-sm text-gray-300 mt-1">
//                       {plan.expires_at ? new Date(plan.expires_at).toLocaleDateString() : 'No active expiry'}
//                     </p>
//                   </div>
//                 </section>

//                 {/* Documentation */}
//                 <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
//                   <div className="flex items-center justify-between mb-5">
//                     <h2 className="text-lg font-semibold">Documentation</h2>
//                     <button className="text-[#ff20d8] text-xs">View all docs</button>
//                   </div>

//                   <div className="space-y-4">
//                     {[
//                       'How to search patent',
//                       'How token usage works',
//                       'API key authentication',
//                     ].map((doc) => (
//                       <button
//                         key={doc}
//                         type="button"
//                         className="w-full flex items-center gap-3 border-b border-white/10 pb-4 last:border-b-0 text-left"
//                       >
//                         <span className="w-9 h-9 rounded-lg bg-[#b000a8]/70 flex items-center justify-center">
//                           ▣
//                         </span>

//                         <span className="flex-1">
//                           <span className="block text-sm font-medium">{doc}</span>
//                           <span className="block text-xs text-gray-500">Documentation</span>
//                         </span>

//                         <span className="text-gray-500">›</span>
//                       </button>
//                     ))}
//                   </div>
//                 </section>
//               </aside>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// export default UserDashboard;


import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { dashboardAPI } from '../../utils/api';

import DashboardSidebar from './components/DashboardSidebar';
import DashboardHome from './DashboardHome';
import UserProfile from './UserProfile';
import UserApiKeys from './UserApiKeys';
import UserPlan from './UserPlan';

const DocumentationComingSoon = () => {
  return (
    <div className="w-full">
      <div className="mb-7">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
          Documentation
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          API documentation will be created later in a Swagger-style layout.
        </p>
      </div>

      <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-3">Documentation pending</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          We will build this after the dashboard, profile, API keys, and plan pages are fully wired.
          This should not be a fake static documentation page. It should explain real endpoints,
          authentication, request examples, responses, errors, and limits.
        </p>
      </section>
    </div>
  );
};

const UserDashboard = () => {
  const navigate = useNavigate();

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  }, []);

  const storedApiKey = localStorage.getItem('api_key');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setDashboardError('');

      const response = await dashboardAPI.getDashboard();

      if (response?.success) {
        setDashboard(response.data);

        if (response.data?.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        if (response.data?.api_key?.key) {
          localStorage.setItem('api_key', response.data.api_key.key);
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('api_key');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
        return;
      }

      setDashboard(null);
      setDashboardError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const fallback = {
    active_plan: false,
    user: storedUser || {},
    plan: {
      name: storedUser?.plan || 'No active plan',
      code: storedUser?.plan || 'none',
      search_limit: 0,
      searches_used: 0,
      searches_remaining: 0,
      expires_at: storedUser?.plan_expires_at || null,
      features: [],
    },
    api_key: {
      key: storedApiKey || '',
      total_usage: 0,
      is_active: Boolean(storedApiKey),
    },
    totals: {
      total_searches: 0,
      successful_searches: 0,
      failed_searches: 0,
      consumed_searches: 0,
      reports_saved: 0,
    },
    recent_searches: [],
  };

  const data = dashboard || fallback;

  const currentUser = data.user || storedUser || {};
  const plan = data.plan || fallback.plan;
  const totals = data.totals || fallback.totals;
  const recentSearches = data.recent_searches || [];
  const apiKeyValue = data.api_key?.key || storedApiKey || '';

  const searchLimit = Number(plan?.search_limit || 0);
  const searchesUsed = Number(plan?.searches_used || 0);
  const searchesRemaining = Number(
    plan?.searches_remaining ?? Math.max(searchLimit - searchesUsed, 0)
  );

  const usagePercent =
    searchLimit > 0 ? Math.min(Math.round((searchesUsed / searchLimit) * 100), 100) : 0;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('api_key');
    localStorage.removeItem('user');

    navigate('/', { replace: true });
  };

  const handleHome = () => {
    navigate('/');
  };

  const renderActiveTab = () => {
    if (activeTab === 'profile') {
      return (
        <UserProfile
          user={currentUser}
          plan={plan}
          apiKeyValue={apiKeyValue}
          totals={totals}
          recentSearches={recentSearches}
        />
      );
    }

    if (activeTab === 'api') {
      return (
        <UserApiKeys
          apiKeyValue={apiKeyValue}
          plan={plan}
          totals={totals}
          recentSearches={recentSearches}
          searchesUsed={searchesUsed}
          searchLimit={searchLimit}
          usagePercent={usagePercent}
        />
      );
    }

    if (activeTab === 'plan') {
      return (
        <UserPlan
          plan={plan}
  totals={totals}
  searchesUsed={searchesUsed}
  searchLimit={searchLimit}
  usagePercent={usagePercent}
  onManagePlan={() => setActiveTab('plan')}
  onComparePlans={() => navigate('/#pricing')}
  onPlanChanged={loadDashboard}
        />
      );
    }

    if (activeTab === 'docs') {
      return <DocumentationComingSoon />;
    }

    return (
      <>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">
          <div>
            <p className="text-xs text-[#ff20d8] mb-2">
              ● Welcome back, {currentUser?.name || 'User'} 👋
            </p>

            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
              Patent Intelligence Dashboard
            </h1>

            <p className="text-gray-400 text-sm mt-2">
              Monitor innovation trends, API usage, searched patent data, and your monthly search limits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#0b0b0d] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300">
              {plan?.expires_at
                ? `Valid till ${new Date(plan.expires_at).toLocaleDateString()}`
                : 'No active plan'}
            </div>

            <button
              type="button"
              onClick={handleHome}
              className="lg:hidden bg-[#a810a8] px-5 py-3 rounded-xl text-sm font-semibold"
            >
              Home
            </button>
          </div>
        </div>

        <DashboardHome
          plan={plan}
          totals={totals}
          recentSearches={recentSearches}
          apiKeyValue={apiKeyValue}
          searchLimit={searchLimit}
          searchesUsed={searchesUsed}
          searchesRemaining={searchesRemaining}
          usagePercent={usagePercent}
          loadDashboard={loadDashboard}
          onManagePlan={() => setActiveTab('plan')}
          onOpenDocs={() => setActiveTab('docs')}
        />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden">
      <div
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(145, 142, 142, 0.35) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="fixed top-[-15%] right-[-10%] w-[520px] h-[520px] bg-[#a810a8]/20 blur-[170px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-[#7b00ff]/10 blur-[180px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex min-h-screen">
        <DashboardSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onHome={handleHome}
          onLogout={handleLogout}
        />

        <main className="flex-1 h-screen overflow-y-auto px-5 md:px-8 py-7">
          <div className="max-w-[1280px] mx-auto">
            {/* Mobile tab bar */}
            <div className="lg:hidden mb-6 overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                {[
                  ['dashboard', 'Dashboard'],
                  ['profile', 'Profile'],
                  ['api', 'API keys'],
                  ['plan', 'Plan'],
                  ['docs', 'Docs'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${
                      activeTab === key
                        ? 'bg-[#a810a8] border-[#a810a8] text-white'
                        : 'bg-black/30 border-white/10 text-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="mb-5 bg-[#0b0b0d] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-400">
                Loading dashboard data...
              </div>
            )}

            {dashboardError && !loading && (
              <div className="mb-5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-200">
                {dashboardError}
              </div>
            )}

            {dashboard && !data.active_plan && (
              <div className="mb-5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-sm text-yellow-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <span>No active plan found. Select Free or Pro to start searching patents.</span>

                <button
                  type="button"
                  onClick={() => navigate('/#pricing')}
                  className="bg-[#a810a8] px-5 py-2 rounded-lg text-white text-sm font-semibold"
                >
                  Choose Plan
                </button>
              </div>
            )}

            {renderActiveTab()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;