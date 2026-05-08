import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    setIsLoggedIn(Boolean(token));

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUserName(parsedUser?.name || '');
      } catch {
        setUserName('');
      }
    }
  }, []);

  const handleHeaderAction = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
      return;
    }

    navigate('/login');
  };

  return (
    <div className="w-full min-h-screen bg-[#030303] text-white font-sans overflow-x-hidden selection:bg-[#e6007a] selection:text-white relative">

      {/* Dot Grid Background */}
      <div
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(145, 142, 142, 0.35) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Ambient Glows — kept subtle like image 1 */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#d9048e]/10 rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="fixed bottom-[10%] right-[-8%] w-[500px] h-[500px] bg-fuchsia-900/8 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* ── Navigation ── */}
      <nav className="flex items-center justify-between px-8 md:px-16 lg:px-24 py-6 max-w-[1440px] mx-auto relative z-20 w-full">
        <div className="flex items-center text-2xl font-serif tracking-tight font-medium">
          mixpanel
        </div>

        <div className="hidden md:flex items-center gap-2 bg-white/[0.03] border border-white/10 px-2 py-2 rounded-full backdrop-blur-md text-sm text-gray-400">
          <a href="#home" className="text-white font-medium bg-white/10 px-6 py-1.5 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.08)] transition-colors">Home</a>
          <a href="#about" className="hover:text-white px-4 transition-colors">About</a>
          <a href="#pricing" className="hover:text-white px-4 transition-colors">Pricing</a>
          <button
  type="button"
  onClick={() => navigate('/documents')}
  className="hover:text-white px-4 transition-colors"
>
  Documents
</button>
        </div>

        <button
  onClick={handleHeaderAction}
  className="bg-gradient-to-r from-[#a810a8ea] to-[#a810a8ea] px-8 py-2.5 rounded-full text-sm font-medium hover:scale-105 transition-all shadow-[0_0_20px_rgba(230,0,122,0.35)] text-white"
>
  {isLoggedIn ? `${userName ? `${userName}'s ` : ''}Dashboard` : 'Login'}
</button>
      </nav>

      {/* ── Hero Section ── */}
      <main className="w-full max-w-[1440px] mx-auto px-8 md:px-16 lg:px-24 pt-20 pb-32 text-center relative z-10">

  {/* Sweeping Glowing Curve — Figma-accurate with shadow aura */}
  <div className="absolute inset-x-0 top-0 flex justify-center pointer-events-none -z-10">
    <svg
      className="w-full h-[480px] lg:h-[560px]"
      viewBox="0 0 1440 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Core gradient — bright fuchsia #FF25E2 matching Figma border color */}
        <linearGradient id="heroGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#FF25E2" stopOpacity="0" />
          <stop offset="18%"  stopColor="#FF25E2" stopOpacity="0.85" />
          <stop offset="50%"  stopColor="#FF25E2" stopOpacity="1" />
          <stop offset="82%"  stopColor="#FF25E2" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FF25E2" stopOpacity="0" />
        </linearGradient>

        {/* Shadow/aura gradient — deep purple for the outer shadow glow */}
        <linearGradient id="heroShadow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#7b00c8" stopOpacity="0" />
          <stop offset="20%"  stopColor="#8a00d4" stopOpacity="0.6" />
          <stop offset="50%"  stopColor="#9900e0" stopOpacity="0.9" />
          <stop offset="80%"  stopColor="#8a00d4" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#7b00c8" stopOpacity="0" />
        </linearGradient>

        {/* Wide ambient glow — outermost halo layer */}
        <linearGradient id="heroHalo" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#6600bb" stopOpacity="0" />
          <stop offset="25%"  stopColor="#aa00ff" stopOpacity="0.35" />
          <stop offset="50%"  stopColor="#cc00ff" stopOpacity="0.5" />
          <stop offset="75%"  stopColor="#aa00ff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6600bb" stopOpacity="0" />
        </linearGradient>

        {/* Blur filter for the wide ambient halo */}
        <filter id="blurHalo" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="28" />
        </filter>

        {/* Blur filter for the mid shadow layer — matches Figma's 22.2 blur */}
        <filter id="blurShadow" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="18" />
        </filter>

        {/* Tight blur for the core glow stroke */}
        <filter id="blurCore" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>

        {/* Drop shadow filter for the sharp core line — Figma layer shadow */}
        <filter id="coreDropShadow" x="-15%" y="-60%" width="130%" height="220%">
          <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#9900cc" floodOpacity="0.8" />
          <feDropShadow dx="0" dy="8" stdDeviation="22" floodColor="#9900cc" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Layer 1: Outermost wide ambient halo — deep purple */}
      <path
        d="M -200 220 Q 720 540 1640 220"
        stroke="url(#heroHalo)"
        strokeWidth="280"
        filter="url(#blurHalo)"
        opacity="0.5"
      />

      {/* Layer 2: Mid shadow layer — purple aura matching Figma shadow */}
      <path
        d="M -200 215 Q 720 535 1640 215"
        stroke="url(#heroShadow)"
        strokeWidth="10"
        filter="url(#blurShadow)"
        opacity="0.01"
      />

      {/* Layer 3: Core glow — fuchsia with tight blur */}
      <path
        d="M -200 210 Q 720 530 1640 210"
        stroke="url(#heroGlow)"
        strokeWidth="96"
        filter="url(#blurCore)"
        opacity="0.1"
      />

      {/* Layer 4: Sharp bright core line with drop shadow — Figma sharp stroke */}
      <path
        d="M -200 210 Q 720 530 1640 210"
        stroke="url(#heroGlow)"
        strokeWidth="2.5"
        filter="url(#coreDropShadow)"
        opacity="0.1"
      />
    </svg>
  </div>

  {/* Floating decorative squares — top right */}
  <div className="hidden md:flex absolute right-[4%] top-[8%] flex-col gap-1.5 pointer-events-none opacity-75">
    <div className="w-14 h-14 bg-[#e6007a]/10 border border-[#e6007a]/20 backdrop-blur-sm rounded-sm" />
    <div className="w-14 h-14 bg-[#e6007a]/18 border border-[#e6007a]/20 backdrop-blur-sm rounded-sm -ml-7" />
  </div>

  {/* Floating "Free Sample" pills */}
  <div className="hidden md:flex absolute left-[4%] bottom-[18%] items-center gap-2 pointer-events-none">
    <div className="bg-[#a810a8] px-4 py-1.5 rounded-full text-[11px] font-medium shadow-[0_0_14px_#a810a8,0_0_28px_#a810a840]">Free Sample</div>
    <div className="w-2 h-2 bg-[#a810a8] rounded-sm shadow-[0_0_8px_#a810a8]" />
  </div>
  <div className="hidden md:flex absolute right-[8%] bottom-[28%] items-center gap-2 pointer-events-none">
    <div className="w-2 h-2 bg-[#a810a8] rounded-sm shadow-[0_0_8px_#a810a8]" />
    <div className="bg-[#a810a8] px-4 py-1.5 rounded-full text-[11px] font-medium shadow-[0_0_14px_#a810a8,0_0_28px_#a810a840]">Free Sample</div>
  </div>

  {/* Badge */}
  <div className="inline-flex items-center gap-2 bg-black/50 border border-white/10 px-4 py-1.5 rounded-full text-xs text-gray-300 mb-8 backdrop-blur-sm">
    <div className="w-2 h-2 rounded-full bg-[#e6007a] shadow-[0_0_8px_#e6007a]" />
    Analysis platform
  </div>

  <h1 className="text-5xl md:text-7xl lg:text-[82px] font-medium tracking-tight mb-6 leading-[1.1]">
    Monetize Patent Insights
  </h1>

  <p className="max-w-2xl mx-auto text-gray-400 text-base md:text-lg mb-12 leading-relaxed">
    Explore 160M+ global patents to uncover trends, identify gaps, and discover high-potential product opportunities.
    Save months of research with instantly accessible, structured patent insights.
  </p>

  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
    <button className="bg-[#a810a8] px-9 py-3.5 rounded-full text-sm font-semibold hover:brightness-125 hover:shadow-[0_0_40px_rgba(168,16,168,0.6)] transition-all shadow-[0_0_20px_rgba(168,16,168,0.4)]">
      Get Free Sample
    </button>
    <button className="flex items-center gap-2 bg-black/40 border border-white/20 px-9 py-3.5 rounded-full text-sm font-medium hover:bg-white/5 transition-colors text-white backdrop-blur-sm">
      Explore Insights
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  </div>
</main>

      {/* ── Actionable Patent Data ── */}
      <section id="about" className="w-full max-w-[1440px] mx-auto px-8 md:px-16 lg:px-24 py-10 relative z-10">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-4">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            Patent Data We Provide
          </div>
          <h2 className="text-3xl md:text-[40px] font-medium mb-6 tracking-tight">Actionable Patent Data, Not Raw Dumps</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-[15px] leading-relaxed">
            Access structured global patent data, technology trends, and competitor insights — all in one platform built for real decision-making.
          </p>
        </div>

        <div className="relative rounded-[32px] p-[1px] bg-gradient-to-b from-[#e6007a]/40 to-transparent mb-16 shadow-[0_0_80px_-15px_rgba(230,0,122,0.2)]">
          <div className="bg-[#050505] rounded-[31px] p-8 md:p-12 flex flex-col lg:flex-row gap-10 items-stretch">
            <div className="flex-1 lg:max-w-[50%] flex flex-col justify-center">
              <h3 className="text-3xl md:text-4xl font-medium mb-6 tracking-tight">Description</h3>
              <p className="text-[11px] text-[#888888] leading-[1.8] mb-8 font-sans tracking-wide">
                HEAT TREATING APPARATUS AND PROCESS FOR CRANKSHAFTS Filed Dec. 26, 1962 — United States Patent 3,247,353. This invention is generally concerned with heat treating apparatus and processes for hardening crankshafts...
              </p>
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden mt-auto">
                <div className="bg-white/[0.03] px-6 py-3.5 text-[12px] text-white font-medium">API Response Example</div>
                <div className="p-6">
                  <pre className="text-[11px] text-[#666] font-mono leading-[1.7] whitespace-pre-wrap">
                    <code>{`[\n  { "patent_id": "US123456", "title": "AI Image Processing", "company": "Google", "technology": "AI" },\n  { "patent_id": "CN987654", "title": "EV Battery System", "company": "BYD", "technology": "Auto" },\n  { "patent_id": "JP654321", "title": "Robotics Control Arm", "company": "Sony", "technology": "Rob" }\n]`}</code>
                  </pre>
                </div>
              </div>
            </div>
            <div className="flex-1 rounded-2xl bg-transparent relative overflow-hidden flex flex-col items-center min-h-[400px]">
              <div className="absolute top-0 right-0 w-full p-4 flex justify-end z-10">
                <div className="text-[10px] text-gray-500 font-mono tracking-widest text-right leading-relaxed flex flex-col items-end uppercase">
                  <div className="flex justify-between w-64 mb-2"><span>April 19, 1966</span><span>P. E. CARY</span><span>3,247,353</span></div>
                  <div className="text-center w-64 mb-2 opacity-60">HEAT TREATING APPARATUS...</div>
                </div>
              </div>
              <img
                src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80"
                alt="Patent Drawing Blueprint"
                className="w-full h-full object-cover grayscale invert opacity-30 mix-blend-screen pt-24 pb-8"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-20 border-b border-white/10 pb-0 mt-8">
          <div className="text-center relative pb-8 cursor-pointer">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-white" />
            <h4 className="text-[20px] md:text-[22px] font-medium mb-3 mt-6">Landscape Reports</h4>
            <p className="text-[13px] text-gray-500 max-w-[220px] leading-relaxed mx-auto">Analyze technology trends and identify innovation gaps across industries.</p>
          </div>
          <div className="text-center opacity-40 hover:opacity-100 transition-opacity cursor-pointer pb-8">
            <h4 className="text-[20px] md:text-[22px] font-medium mt-6">Competitor Analysis</h4>
          </div>
          <div className="text-center opacity-40 hover:opacity-100 transition-opacity cursor-pointer pb-8">
            <h4 className="text-[20px] md:text-[22px] font-medium mt-6">Prior Art Search</h4>
          </div>
        </div>
      </section>

      {/* ── Built for Teams & Stats ── */}
      <section className="w-full max-w-[1440px] mx-auto px-8 md:px-16 lg:px-24 py-20 relative z-10">
        <div className="grid md:grid-cols-2 gap-20 mb-24">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
              Who It's For
            </div>
            <h2 className="text-3xl md:text-[40px] font-medium mb-6 tracking-tight leading-tight">Built for Teams That Rely on Data</h2>
            <p className="text-gray-400 text-[15px] leading-relaxed max-w-md">
              Our patent datasets are designed for professionals who need reliable, structured data to drive research, strategy, and decision-making.
            </p>
          </div>
          <div className="space-y-12">
            {[
              {
                icon: <path d="M12 2v20" />,
                icon2: <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
                title: 'Startups & Founders',
                desc: 'Validate ideas, identify market gaps, and build without patent risks.',
              },
              {
                icon: <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />,
                title: 'Enterprises & R&D Teams',
                desc: 'Track competitor filings, monitor innovation trends, and plan strategy.',
              },
              {
                icon: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>,
                title: 'Investors & Analysts',
                desc: 'Discover emerging technologies and make data-backed investment decisions.',
              },
            ].map(({ icon, icon2, title, desc }) => (
              <div key={title} className="flex gap-6">
                <div className="mt-1 opacity-70">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}{icon2}</svg>
                </div>
                <div>
                  <h4 className="text-[20px] font-medium mb-2">{title}</h4>
                  <p className="text-[14px] text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col md:flex-row justify-between items-center text-center px-4 pb-10 gap-10 md:gap-0">
          {[['160M+', 'Patents Analyzed'], ['50+', 'Countries Covered'], ['10K+', 'Active Users']].map(([num, label]) => (
            <div key={label} className="text-left md:text-center w-full md:w-auto">
              <div className="text-[50px] md:text-[64px] font-medium tracking-tight mb-1">{num}</div>
              <div className="text-[15px] text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Decisions Section ── */}
      <section className="w-full max-w-[1440px] mx-auto px-8 md:px-16 lg:px-24 py-20 relative z-10">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-4">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            What You Can Do
          </div>
          <h2 className="text-3xl md:text-[40px] font-medium mb-4 tracking-tight">Turn Patent Data Into Real Decisions</h2>
          <p className="text-gray-400 text-[15px] max-w-2xl mx-auto leading-relaxed">
            Use structured patent datasets to uncover opportunities, reduce risks, and make smarter business and investment decisions.
          </p>
        </div>

        <div className="flex justify-center items-center gap-6 mt-12">
          {[0, 1].map((i) => (
            <div key={i} className="hidden md:flex w-72 h-[350px] border border-white/5 rounded-[32px] bg-[#0a0a0a] items-center justify-center opacity-40">
              <div className="w-20 h-20 border border-white/10 rounded-[20px] flex items-center justify-center bg-white/5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>
          ))}
          <div className="w-full max-w-[520px] border border-white/10 bg-[#0a0a0a] rounded-[32px] p-10 relative shadow-2xl z-10 order-first md:order-none">
            <div className="bg-[#141414] rounded-[24px] p-8 mb-8 flex flex-col sm:flex-row justify-between items-center border border-white/5">
              <div className="text-center sm:text-left mb-6 sm:mb-0">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto sm:mx-0 text-gray-300 mb-4">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                </svg>
                <div className="text-[15px] text-gray-300 mb-3">NexAI Score</div>
                <div className="bg-white/10 px-4 py-1.5 rounded-md text-xl font-medium inline-block text-gray-200">+35.8</div>
              </div>
              <div className="w-px h-24 bg-white/5 hidden sm:block mx-6" />
              <div className="space-y-4 text-[13px]">
                {[['40', 'Promotes'], ['28', 'Passives'], ['17', 'Detractors']].map(([n, l]) => (
                  <div key={l} className="flex justify-between gap-12">
                    <span className="text-gray-400">{n}</span><span className="text-gray-200">{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <h3 className="text-center text-[22px] font-medium tracking-tight mb-2">Identify Market Opportunities</h3>
            <p className="text-center text-sm text-gray-500 max-w-sm mx-auto">Discover untapped innovation areas and white-space opportunities before competitors.</p>
          </div>
        </div>
      </section>

      {/* ── Client Outcomes ── */}
      <section className="w-full max-w-[1440px] mx-auto px-8 md:px-16 lg:px-24 py-24 relative z-10">
        <div className="mb-16">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            Client Outcomes
          </div>
          <h2 className="text-3xl md:text-[40px] font-medium mb-6 tracking-tight">How Clients Turn Our Data Into Revenue</h2>
          <p className="text-gray-400 text-[15px] max-w-md leading-relaxed">
            See how companies use our patent data to generate insights, reduce risks, and unlock new revenue opportunities.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 h-auto md:h-[450px]">
          <div className="col-span-2 relative rounded-[32px] overflow-hidden bg-[#e5e5e5] group h-[450px]">
            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80" alt="Startup Team" className="absolute inset-0 w-full h-full object-cover object-top mix-blend-multiply opacity-80 group-hover:scale-[1.02] transition-transform duration-700" />
            <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
              <div className="bg-black/30 backdrop-blur-md w-fit px-4 py-1.5 rounded-full text-[11px] font-medium border border-white/10 text-white">Startup Teams</div>
              <div className="flex items-end justify-end h-full">
                <div className="bg-[#f5f5f5] text-black p-8 rounded-[24px] max-w-[380px] shadow-2xl relative overflow-hidden">
                  <div className="text-[#10b981] font-bold text-[22px] mb-5 relative z-10">+30% Revenue<br />Growth</div>
                  <div className="flex items-center gap-2 mb-3 relative z-10">
                    <div className="w-6 h-6 bg-black rounded flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full" /></div>
                    <h4 className="font-bold text-[18px]">AI startup team</h4>
                  </div>
                  <p className="text-gray-700 text-[14px] leading-relaxed relative z-10">Used our patent data to identify opportunities and launch a product that generated revenue.</p>
                  <div className="absolute bottom-16 right-0 w-40 h-24 bg-[#10b981] -z-0 opacity-90" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 80% 20%, 60% 40%, 40% 10%, 20% 50%)' }} />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-rows-2 col-span-1 gap-6 h-[450px]">
            <div className="relative rounded-[32px] overflow-hidden bg-gray-800">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80" alt="Enterprise R&D" className="absolute inset-0 w-full h-full object-cover grayscale opacity-60" />
              <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] border border-white/10 text-white z-10">Enterprise R&D</div>
            </div>
            <div className="relative rounded-[32px] overflow-hidden bg-gray-800">
              <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80" alt="IP Consultant" className="absolute inset-0 w-full h-full object-cover grayscale opacity-60" />
              <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] border border-white/10 text-white z-10">IP Consultant</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="w-full max-w-[1440px] mx-auto px-8 md:px-16 lg:px-24 py-20 relative z-10">
        <div className="mb-12 border-b border-white/10 pb-16">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            How It Works
          </div>
          <h2 className="text-3xl md:text-[40px] font-medium mb-6 tracking-tight">Get the Data You Need in Three Simple Steps</h2>
          <p className="text-gray-400 text-[15px] max-w-md leading-relaxed">Access, explore, and integrate high-quality patent datasets without complexity.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div className="rounded-[32px] overflow-hidden bg-gray-800 h-[500px] lg:h-[600px] relative">
            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80" alt="Person working on laptop" className="absolute inset-0 w-full h-full object-cover grayscale-[30%]" />
          </div>
          <div className="flex flex-col">
            {[
              ['01', 'Choose Your Data', 'Browse available datasets or request custom patent data based on your needs.'],
              ['02', 'Access & Download', 'Get instant access via CSV, JSON, or API — ready for analysis or integration.'],
              ['03', 'Use It Your Way', 'Apply the data in research, product development, investment decisions, or legal analysis.'],
            ].map(([num, title, desc]) => (
              <div key={num} className="flex gap-8 py-10 border-b border-white/10">
                <div className="text-5xl lg:text-6xl font-light text-gray-500/80 tracking-tight mt-1">{num}</div>
                <div>
                  <h4 className="text-[22px] font-medium mb-3">{title}</h4>
                  <p className="text-gray-400 text-[15px] leading-relaxed max-w-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="w-full max-w-[1440px] mx-auto px-8 md:px-16 lg:px-24 py-24 relative z-10">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-4 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            Pricing
          </div>
          <h2 className="text-3xl md:text-[40px] font-medium mb-6 tracking-tight">Flexible pricing that scales with you</h2>
          <p className="text-gray-400 text-[15px] max-w-2xl mx-auto leading-relaxed">Choose a plan that fits your team's needs, from startup to enterprise.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-end max-w-5xl mx-auto">
          {/* FREE */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-8 lg:p-10 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#e6007a]/10 to-transparent opacity-50 rounded-[24px] pointer-events-none" />
            <div className="relative z-10">
              <svg className="w-5 h-5 text-white mb-6" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6l8 6-8 6V6zm9 0l8 6-8 6V6z" /></svg>
              <h3 className="text-xl font-bold mb-2">FREE</h3>
              <div className="text-4xl font-medium mb-6">Rs 0</div>
              <p className="text-[13px] text-gray-400 mb-8 leading-relaxed h-12">Identify fast-growing technologies and emerging trends.</p>
              <button className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#a810a8ea] to-[#a810a8ea] text-white font-medium text-[15px] mb-10 hover:shadow-[0_0_20px_rgba(230,0,122,0.4)] transition-all">Get in touch</button>
              <div className="text-[15px] font-medium mb-6">Started plan includes</div>
              <ul className="space-y-4">
                {['Limited patent access', 'Basic search & filters', 'Sample insights', 'Community support'].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[14px] text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-[#a810a8ea]" /> {f}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* PRO */}
          <div className="relative rounded-[24px] p-[1px] bg-gradient-to-b from-[#a810a8ea]/60 to-[#0a0a0a] transform md:-translate-y-6 shadow-[0_-10px_60px_-15px_rgba(230,0,122,0.3)]">
            <div className="bg-[#050505] rounded-[23px] p-8 lg:p-10 h-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#a810a8ea]/20 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <svg className="w-5 h-5 text-white mb-6" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6l8 6-8 6V6zm9 0l8 6-8 6V6z" /></svg>
                <h3 className="text-xl font-bold mb-2">PRO</h3>
                <div className="text-4xl font-medium mb-6">Rs 499</div>
                <p className="text-[13px] text-gray-400 mb-8 leading-relaxed h-12">Identify fast-growing technologies and emerging trends.</p>
                <button className="w-full py-3.5 px-6 rounded-full bg-black border border-white/10 text-white font-medium text-[15px] mb-10 hover:bg-white/5 transition-all">Get in touch</button>
                <div className="text-[15px] font-medium mb-6">Started plan includes</div>
                <ul className="space-y-4">
                  {['Full patent access', 'Advanced search & filters', 'Deep insights', 'Priority support'].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-[14px] text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-[#a810a8ea]" /> {f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ENTERPRISE */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-8 lg:p-10 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#a810a8ea]/10 to-transparent opacity-50 rounded-[24px] pointer-events-none" />
            <div className="relative z-10">
              <svg className="w-5 h-5 text-white mb-6" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6l8 6-8 6V6zm9 0l8 6-8 6V6z" /></svg>
              <h3 className="text-xl font-bold mb-2">ENTERPRISE</h3>
              <div className="text-4xl font-medium mb-6">Rs 999</div>
              <p className="text-[13px] text-gray-400 mb-8 leading-relaxed h-12">Identify fast-growing technologies and emerging trends.</p>
              <button className="w-full py-3.5 px-6 rounded-full bg-black border border-white/10 text-white font-medium text-[15px] mb-10 hover:bg-white/5 transition-all">Get in touch</button>
              <div className="text-[15px] font-medium mb-6">Started plan includes</div>
              <ul className="space-y-4">
                {['Unlimited patent access', 'Custom data pipelines', 'Dedicated insights team', 'SLA & dedicated support'].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[14px] text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-[#a810a8ea]" /> {f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-white/10 pt-20 pb-8 mt-10 relative z-10">
        <div className="max-w-[1440px] mx-auto px-8 md:px-16 lg:px-24 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 mb-20">
          <div className="lg:col-span-5">
            <div className="text-3xl font-serif tracking-tight font-medium mb-6">mixpanel</div>
            <p className="text-gray-400 text-[15px] leading-relaxed max-w-xs mb-8">
              Identify fast-growing technologies and emerging trends before they go mainstream.
            </p>
            <div className="flex gap-4">
              {[
                <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />,
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />,
              ].map((path, i) => (
                <a key={i} href="#" className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:bg-gray-200 transition-colors">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">{path}</svg>
                </a>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-10">
            {[
              { title: 'Pages', links: ['Home', 'Features', 'About', 'Pricing'] },
              { title: 'Inner pages', links: ['Blog single', 'Pricing Single', 'Contact', '404'] },
              { title: 'Utility Pages', links: ['Style Guide', 'Change Log', 'License', '404'] },
            ].map(({ title, links }) => (
              <div key={title} className="flex flex-col gap-4">
                <h4 className="text-[17px] font-medium mb-2 text-white">{title}</h4>
                {links.map((l) => <a key={l} href="#" className="text-[14px] text-gray-400 hover:text-white transition-colors">{l}</a>)}
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 text-center text-gray-500 text-[12px]">
          <p>&copy; 2025 Indraq All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;