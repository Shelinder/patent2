import React, { useMemo, useState } from 'react';

const formatDateTime = (value) => {
  if (!value) return 'Never used';

  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Never used';
  }
};

const compactNumber = (value) => {
  const num = Number(value || 0);

  if (num >= 1000000) return `${(num / 1000000).toFixed(num >= 10000000 ? 0 : 1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K`;

  return String(num);
};

const maskKey = (key = '') => {
  if (!key) return 'No API key found';
  if (key.length <= 14) return key;

  return `${key.slice(0, 8)}${'*'.repeat(18)}${key.slice(-6)}`;
};

const StatCard = ({ icon, title, value, subText }) => (
  <div className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-5 shadow-[0_0_35px_rgba(0,0,0,0.35)]">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-[#b000a8]/80 flex items-center justify-center text-xl shadow-[0_0_18px_rgba(230,0,199,0.35)]">
        {icon}
      </div>

      <div>
        <p className="text-gray-400 text-xs mb-1">{title}</p>
        <h3 className="text-2xl font-semibold tracking-tight text-white">{value}</h3>
        <p className="text-xs mt-1 text-emerald-400">{subText}</p>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ children, tone = 'green' }) => {
  const className =
    tone === 'green'
      ? 'bg-emerald-500/10 text-emerald-400'
      : tone === 'red'
        ? 'bg-red-500/10 text-red-300'
        : 'bg-yellow-500/10 text-yellow-300';

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-md text-[11px] ${className}`}>
      {children}
    </span>
  );
};

const UserApiKeys = ({
  apiKeyValue = '',
  plan = {},
  totals = {},
  recentSearches = [],
  searchesUsed = 0,
  searchLimit = 0,
  usagePercent = 0,
  onGenerateKey = null,
}) => {
  const [copiedKeyId, setCopiedKeyId] = useState('');
  const [environment, setEnvironment] = useState('Production');

  const successfulSearches = Number(totals?.successful_searches || 0);
  const totalSearches = Number(totals?.total_searches || 0);
  const failedSearches = Number(totals?.failed_searches || 0);

  const successRate =
    totalSearches > 0 ? Math.round((successfulSearches / totalSearches) * 1000) / 10 : 0;

  const searchesRemaining = Number(
    plan?.searches_remaining ?? Math.max(Number(searchLimit || 0) - Number(searchesUsed || 0), 0)
  );

  const apiKeys = useMemo(() => {
    if (!apiKeyValue) return [];

    return [
      {
        id: 'primary-key',
        name: 'Primary API key',
        key: apiKeyValue,
        environment: 'Production',
        lastUsage: recentSearches?.[0]?.created_at || null,
        requests: searchesUsed,
        status: 'Active',
      },
    ];
  }, [apiKeyValue, recentSearches, searchesUsed]);

  const handleCopy = async (keyId, key) => {
    if (!key) return;

    try {
      await navigator.clipboard.writeText(key);
      setCopiedKeyId(keyId);

      setTimeout(() => {
        setCopiedKeyId('');
      }, 1400);
    } catch {
      setCopiedKeyId('');
    }
  };

  const handleGenerateKey = () => {
    if (!onGenerateKey) return;
    onGenerateKey(environment);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
          API Keys
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Monitor innovation trends, access structured patent data, and manage your research API access.
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="▦"
          title="Total API Keys"
          value={apiKeys.length}
          subText={`${apiKeys.length} active`}
        />

        <StatCard
          icon="⌘"
          title="Requests this month"
          value={compactNumber(searchesUsed)}
          subText={`of ${compactNumber(searchLimit)} limit`}
        />

        <StatCard
          icon="◷"
          title="Remaining requests"
          value={compactNumber(searchesRemaining)}
          subText={`${usagePercent}% used`}
        />

        <StatCard
          icon="▧"
          title="Success rate"
          value={`${successRate}%`}
          subText={`${failedSearches} failed / not found`}
        />
      </div>

      <div className="grid xl:grid-cols-[1fr_330px] gap-6">
        {/* Left */}
        <div className="space-y-6">
          {/* Keys table */}
          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-8 border-b border-white/10 mb-5 overflow-x-auto">
              {['Your API Keys', 'Usage & limit', 'Webhook'].map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  className={`pb-3 text-sm whitespace-nowrap transition-colors ${
                    index === 0
                      ? 'text-[#ff20d8] border-b-2 border-[#ff20d8]'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <h2 className="text-lg font-semibold text-white mb-4">Your API Keys</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white/[0.04] text-gray-500">
                    <th className="py-3 px-4 font-medium rounded-l-lg">Key name</th>
                    <th className="py-3 px-4 font-medium">Key</th>
                    <th className="py-3 px-4 font-medium">Environment</th>
                    <th className="py-3 px-4 font-medium">Last usage</th>
                    <th className="py-3 px-4 font-medium">Requests</th>
                    <th className="py-3 px-4 font-medium rounded-r-lg">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {apiKeys.length > 0 ? (
                    apiKeys.map((item) => (
                      <tr key={item.id} className="border-b border-white/5 last:border-b-0">
                        <td className="py-4 px-4 text-gray-300">{item.name}</td>

                        <td className="py-4 px-4">
                          <button
                            type="button"
                            onClick={() => handleCopy(item.id, item.key)}
                            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                          >
                            <span className="font-mono text-xs">{maskKey(item.key)}</span>
                            <span className="text-[#ff20d8] text-xs">
                              {copiedKeyId === item.id ? 'Copied' : 'Copy'}
                            </span>
                          </button>
                        </td>

                        <td className="py-4 px-4">
                          <span className="bg-[#ff20d8]/15 text-[#ff20d8] px-3 py-1 rounded-md text-[11px]">
                            {item.environment}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-gray-500">{formatDateTime(item.lastUsage)}</td>
                        <td className="py-4 px-4 text-gray-300">{compactNumber(item.requests)}</td>

                        <td className="py-4 px-4">
                          <StatusBadge>{item.status}</StatusBadge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-gray-500">
                        No API key found. Select a plan first to activate API access.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent activity */}
          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold text-white mb-5">Recent API Activity</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-white/10">
                    <th className="py-3 pr-4 font-medium">Time</th>
                    <th className="py-3 pr-4 font-medium">Event</th>
                    <th className="py-3 pr-4 font-medium">Key</th>
                    <th className="py-3 pr-4 font-medium">Patent</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentSearches?.length > 0 ? (
                    recentSearches.slice(0, 8).map((item) => {
                      const statusCode =
                        item.status === 'success' ? '200' : item.status === 'not_found' ? '404' : '500';

                      return (
                        <tr key={item.id} className="border-b border-white/5 last:border-b-0">
                          <td className="py-3 pr-4 text-gray-500">{formatDateTime(item.created_at)}</td>
                          <td className="py-3 pr-4 text-gray-300">Search patent</td>
                          <td className="py-3 pr-4 text-gray-300">Production key</td>
                          <td className="py-3 pr-4 text-gray-300">{item.patent_number}</td>
                          <td
                            className={`py-3 pr-4 ${
                              item.status === 'success' ? 'text-emerald-400' : 'text-red-300'
                            }`}
                          >
                            {statusCode}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500">
                        No API activity yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right */}
        <aside className="space-y-6">
          {/* Create key */}
          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold text-white mb-2">Create new API Key</h2>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              Generate a new API key to access the patent intelligence API.
            </p>

            <label className="block text-xs text-gray-400 mb-2">Environment</label>

            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff20d8]/60 mb-5"
            >
              <option>Production</option>
              <option>Development</option>
              <option>Testing</option>
            </select>

            <button
              type="button"
              onClick={handleGenerateKey}
              disabled={!onGenerateKey}
              className="w-full bg-gradient-to-r from-[#e600c7] to-[#9b00a8] py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate new Key
            </button>

            <p className="text-xs text-gray-500 mt-6">
              ⓘ You can have up to 10 active API keys.
            </p>

            {!onGenerateKey && (
              <p className="text-xs text-yellow-300 mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                Key generation backend route is not added yet.
              </p>
            )}
          </section>

          {/* Rate limit */}
          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Rate limit</h2>
              <button type="button" className="text-[#ff20d8] text-xs">
                View all limits →
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs text-gray-500">Request per month</span>
                <span className="text-xs text-gray-200">{compactNumber(searchLimit)}</span>
              </div>

              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs text-gray-500">Requests used</span>
                <span className="text-xs text-gray-200">{compactNumber(searchesUsed)}</span>
              </div>

              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs text-gray-500">Requests remaining</span>
                <span className="text-xs text-gray-200">{compactNumber(searchesRemaining)}</span>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Usage health</span>
                <span>{usagePercent}%</span>
              </div>

              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#ff20d8] to-[#9b00ff] rounded-full"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>

            <div
              className={`mt-5 rounded-xl px-4 py-3 text-xs ${
                usagePercent >= 90
                  ? 'bg-red-500/10 text-red-300'
                  : usagePercent >= 70
                    ? 'bg-yellow-500/10 text-yellow-300'
                    : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              {usagePercent >= 90
                ? 'Your limit is almost consumed.'
                : usagePercent >= 70
                  ? 'Your usage is getting high.'
                  : 'Your limits are healthy.'}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default UserApiKeys;