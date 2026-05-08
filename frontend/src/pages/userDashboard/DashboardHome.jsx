import React, { useState } from 'react';
import { patentAPI } from '../../utils/api';

const compactNumber = (value) => {
  const num = Number(value || 0);

  if (num >= 1000000) return `${(num / 1000000).toFixed(num >= 10000000 ? 0 : 1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K`;

  return String(num);
};

const formatDateTime = (value) => {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

const maskKey = (key = '') => {
  if (!key) return 'No API key found';
  if (key.length <= 14) return key;

  return `${key.slice(0, 6)}${'*'.repeat(22)}${key.slice(-4)}`;
};

const StatCard = ({ icon, title, value, subText, tone = 'green' }) => {
  const toneClass = tone === 'pink' ? 'text-[#ff20d8]' : 'text-emerald-400';

  return (
    <div className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.25)]">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#b000a8]/80 flex items-center justify-center text-xl shadow-[0_0_18px_rgba(230,0,199,0.35)]">
          {icon}
        </div>

        <div>
          <p className="text-gray-400 text-xs mb-1">{title}</p>
          <h3 className="text-2xl font-semibold tracking-tight text-white">{value}</h3>
          <p className={`text-xs mt-1 ${toneClass}`}>{subText}</p>
        </div>
      </div>
    </div>
  );
};

const MiniLineChart = () => {
  const points = [
    22, 42, 35, 37, 30, 44, 52, 70, 64, 68, 82, 65, 78, 74, 62, 80, 72, 86,
  ];

  const max = Math.max(...points);
  const min = Math.min(...points);

  const path = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 100 - ((value - min) / (max - min)) * 80 - 10;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="h-[230px] w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {[20, 40, 60, 80].map((line) => (
          <line
            key={`h-${line}`}
            x1="0"
            x2="100"
            y1={line}
            y2={line}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.4"
          />
        ))}

        {[12, 24, 36, 48, 60, 72, 84].map((line) => (
          <line
            key={`v-${line}`}
            y1="0"
            y2="100"
            x1={line}
            x2={line}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.35"
          />
        ))}

        <path
          d={path}
          fill="none"
          stroke="#e600c7"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        <path
          d={path}
          fill="none"
          stroke="#7a1cff"
          strokeWidth="1"
          opacity="0.65"
          transform="translate(0,-8)"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};

const DashboardHome = ({
  plan = {},
  totals = {},
  recentSearches = [],
  apiKeyValue = '',
  searchLimit = 0,
  searchesUsed = 0,
  searchesRemaining = 0,
  usagePercent = 0,
  loadDashboard,
  onManagePlan,
  onOpenDocs,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchedPatent, setSearchedPatent] = useState(null);
  const [searchMeta, setSearchMeta] = useState(null);
  const [copiedApiKey, setCopiedApiKey] = useState(false);

  const handlePatentSearch = async (e) => {
    e.preventDefault();

    const patentNumber = searchQuery.trim();

    if (!patentNumber) {
      setSearchError('Enter a patent number first.');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError('');
      setSearchedPatent(null);
      setSearchMeta(null);

      const response = await patentAPI.getPatentByNumber(patentNumber);

      if (response?.success) {
        setSearchedPatent(response.data);
        setSearchMeta(response.meta || null);

        if (typeof loadDashboard === 'function') {
          await loadDashboard();
        }
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || 'Patent search failed.');
      setSearchMeta(err.response?.data?.meta || null);

      if (typeof loadDashboard === 'function') {
        await loadDashboard();
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCopyApiKey = async () => {
    if (!apiKeyValue) return;

    try {
      await navigator.clipboard.writeText(apiKeyValue);
      setCopiedApiKey(true);

      setTimeout(() => {
        setCopiedApiKey(false);
      }, 1400);
    } catch {
      setCopiedApiKey(false);
    }
  };

  return (
    <div className="grid xl:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            icon="▦"
            title="Total patent searches"
            value={totals?.total_searches || 0}
            subText="All time"
          />

          <StatCard
            icon="⌘"
            title="Search limit remaining"
            value={searchesRemaining}
            subText={`${searchLimit || 0} monthly limit`}
          />

          <StatCard
            icon="▣"
            title="Successful results"
            value={totals?.successful_searches || 0}
            subText="Patent found"
          />

          <StatCard
            icon="⚠"
            title="Failed / not found"
            value={totals?.failed_searches || 0}
            subText="No token consumed"
            tone="pink"
          />
        </div>

        {/* Patent Search */}
        <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Search patent</h2>
              <p className="text-xs text-gray-500 mt-1">
                Successful searches consume one token. Not-found searches are logged but do not consume token.
              </p>
            </div>

            <div className="text-xs text-gray-400">
              Remaining:{' '}
              <span className="text-white font-semibold">{searchesRemaining}</span> / {searchLimit}
            </div>
          </div>

          <form onSubmit={handlePatentSearch} className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter patent number, e.g. AP993A"
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-[#ff20d8]/60"
            />

            <button
              type="submit"
              disabled={searchLoading || searchesRemaining <= 0}
              className="bg-gradient-to-r from-[#e600c7] to-[#9b00a8] px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searchLoading ? 'Searching...' : searchesRemaining <= 0 ? 'Limit Finished' : 'Search'}
            </button>
          </form>

          {searchError && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl px-4 py-3 text-sm">
              {searchError}
            </div>
          )}

          {searchMeta && (
            <div className="mt-4 grid sm:grid-cols-4 gap-3">
              {[
                ['Plan', searchMeta.plan_code || plan?.code || '-'],
                ['Limit', searchMeta.search_limit ?? searchLimit],
                ['Used', searchMeta.searches_used ?? searchesUsed],
                ['Remaining', searchMeta.searches_remaining ?? searchesRemaining],
              ].map(([label, value]) => (
                <div key={label} className="bg-black/40 border border-white/10 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          )}

          {searchedPatent && (
            <div className="mt-5 bg-black/40 border border-white/10 rounded-2xl p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs text-[#ff20d8] mb-1">
                    {searchedPatent.patent_number}
                  </p>

                  <h3 className="text-lg font-semibold text-white">
                    {searchedPatent.title_en || 'Untitled patent'}
                  </h3>
                </div>

                <span className="w-max bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs">
                  Token consumed
                </span>
              </div>

              <p className="text-sm text-gray-400 max-h-24 overflow-hidden">
                {searchedPatent.abstract_en || 'No abstract available.'}
              </p>
            </div>
          )}
        </section>

        {/* Chart */}
        <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Patent search trends</h2>
              <p className="text-xs text-gray-500 mt-1">Monthly activity overview</p>
            </div>

            <button
              type="button"
              className="border border-white/10 bg-white/[0.03] rounded-lg px-4 py-2 text-xs text-gray-300"
            >
              Last 12 months
            </button>
          </div>

          <div className="flex items-center gap-5 text-xs mb-2">
            <span className="flex items-center gap-2 text-gray-400">
              <span className="w-2 h-2 rounded-full bg-[#7a1cff]" />
              Total filing
            </span>

            <span className="flex items-center gap-2 text-gray-400">
              <span className="w-2 h-2 rounded-full bg-[#e600c7]" />
              Searches
            </span>
          </div>

          <MiniLineChart />

          <div className="grid sm:grid-cols-4 border-t border-white/10 mt-2">
            {[
              ['Search attempts', totals?.total_searches || 0],
              ['Successful searches', totals?.successful_searches || 0],
              ['Searches used', searchesUsed],
              ['Remaining limit', searchesRemaining],
            ].map(([label, value]) => (
              <div key={label} className="p-4 border-r border-white/10 last:border-r-0">
                <p className="text-gray-500 text-xs mb-1">{label}</p>
                <p className="font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid xl:grid-cols-3 gap-6">
          {/* Technology Area */}
          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-white mb-5">Top technology area</h2>

            <div className="flex items-center justify-center gap-5 mb-5">
              <div className="w-24 h-24 rounded-full border-[12px] border-[#7a1cff] border-r-[#03c36b] border-b-[#ff20d8]" />
              <div className="w-24 h-24 rounded-full border-[12px] border-[#7a1cff] border-l-[#03c36b] border-b-[#ff20d8]" />
            </div>

            <div className="space-y-3 text-xs">
              {[
                ['AI / machine learning', '23%'],
                ['Battery technology', '23%'],
                ['Electronics vehicles', '23%'],
                ['Others', '23%'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-gray-400">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#e600c7]" />
                    {label}
                  </span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-white mb-5">Recent activity</h2>

            <div className="space-y-4">
              {recentSearches.length > 0 ? (
                recentSearches.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm">
                      🔎
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <p className="text-sm font-medium text-white truncate">
                          {item.patent_number}
                        </p>

                        <span className="text-xs text-gray-500">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 truncate">
                        Result: {item.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No patent search activity yet.</div>
              )}
            </div>
          </section>

          {/* AI Alerts */}
          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-white mb-5">AI opportunity alerts</h2>

            <div className="space-y-4">
              {[
                ['Quantum computing', 'High'],
                ['Battery optimization', 'Medium'],
                ['Medical imaging', 'High'],
                ['Autonomous sensors', 'Medium'],
              ].map(([name, level]) => (
                <div key={name} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#b000a8]/60 flex items-center justify-center">
                    🔍
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">Patent search</p>
                    <p className="text-xs text-gray-500 truncate">{name}</p>
                  </div>

                  <span
                    className={`text-[10px] px-3 py-1 rounded-full border ${
                      level === 'High'
                        ? 'border-[#ff20d8] text-[#ff20d8]'
                        : 'border-yellow-500 text-yellow-400'
                    }`}
                  >
                    {level}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Search Logs */}
        <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Patent search history</h2>
              <p className="text-xs text-gray-500 mt-1">
                Shows what user searched, result status, and whether token was consumed.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-500">
                  <th className="py-3 pr-4 font-medium">Patent number</th>
                  <th className="py-3 pr-4 font-medium">Result</th>
                  <th className="py-3 pr-4 font-medium">Token used</th>
                  <th className="py-3 pr-4 font-medium">Date</th>
                </tr>
              </thead>

              <tbody>
                {recentSearches.length > 0 ? (
                  recentSearches.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 last:border-b-0">
                      <td className="py-4 pr-4 text-white">{item.patent_number}</td>

                      <td className="py-4 pr-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            item.status === 'success'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-4 pr-4 text-gray-300">
                        {item.consumed_token ? 'Yes' : 'No'}
                      </td>

                      <td className="py-4 pr-4 text-gray-500">
                        {formatDateTime(item.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      No search logs found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Right side */}
      <aside className="space-y-6">
        {/* API Access */}
        <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#b000a8]/60 flex items-center justify-center">
              ⌘
            </div>

            <h2 className="text-lg font-semibold text-white">API Access</h2>
          </div>

          <p className="text-xs text-gray-500 mb-2">Your API key</p>

          <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-gray-300 break-all mb-4">
            {maskKey(apiKeyValue)}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Usage this month</span>
            <span>{usagePercent}%</span>
          </div>

          <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-[#ff20d8] to-[#9b00ff] rounded-full"
              style={{ width: `${usagePercent}%` }}
            />
          </div>

          <p className="text-xs text-gray-500 mb-5">
            {compactNumber(searchesUsed)}/{compactNumber(searchLimit || 0)} searches used
          </p>

          <button
            type="button"
            onClick={handleCopyApiKey}
            disabled={!apiKeyValue}
            className="w-full bg-gradient-to-r from-[#e600c7] to-[#9b00a8] py-3 rounded-xl text-sm font-semibold mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copiedApiKey ? 'Copied' : 'Copy API Key'}
          </button>

          <button
            type="button"
            onClick={onOpenDocs}
            className="w-full text-[#ff20d8] text-sm font-semibold"
          >
            API Document →
          </button>
        </section>

        {/* Current Plan */}
        <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="text-yellow-400 text-xl">♛</span>
              <h2 className="text-lg font-semibold text-white">Current plan</h2>
            </div>

            <button
              type="button"
              onClick={onManagePlan}
              className="border border-[#ff20d8]/40 text-[#ff20d8] px-4 py-2 rounded-lg text-xs"
            >
              Manage plan
            </button>
          </div>

          <h3 className="text-2xl font-semibold capitalize text-white mb-5">
            {plan?.name || plan?.code || 'No active plan'}
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-gray-300">
                <span className="text-emerald-400">✓</span>
                {searchLimit || 0} searches/month
              </span>

              <span className="text-gray-500 text-xs">{searchesRemaining} remaining</span>
            </div>

            {(plan?.features?.length
              ? plan.features
              : ['Basic search & filters', 'Patent result tracking', 'Usage analytics']
            ).map((feature) => (
              <p key={feature} className="flex items-center gap-2 text-gray-300">
                <span className="text-emerald-400">✓</span>
                {feature}
              </p>
            ))}
          </div>

          <div className="mt-5 pt-5 border-t border-white/10">
            <p className="text-xs text-gray-500">Expires at</p>
            <p className="text-sm text-gray-300 mt-1">
              {plan?.expires_at ? new Date(plan.expires_at).toLocaleDateString() : 'No active expiry'}
            </p>
          </div>
        </section>

        {/* Documentation */}
        <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Documentation</h2>

            <button
              type="button"
              onClick={onOpenDocs}
              className="text-[#ff20d8] text-xs"
            >
              View all docs
            </button>
          </div>

          <div className="space-y-4">
            {[
              'How to search patent',
              'How token usage works',
              'API key authentication',
            ].map((doc) => (
              <button
                key={doc}
                type="button"
                onClick={onOpenDocs}
                className="w-full flex items-center gap-3 border-b border-white/10 pb-4 last:border-b-0 text-left"
              >
                <span className="w-9 h-9 rounded-lg bg-[#b000a8]/70 flex items-center justify-center">
                  ▣
                </span>

                <span className="flex-1">
                  <span className="block text-sm font-medium text-white">{doc}</span>
                  <span className="block text-xs text-gray-500">Documentation</span>
                </span>

                <span className="text-gray-500">›</span>
              </button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
};

export default DashboardHome;