import React from 'react';

const formatDate = (value) => {
  if (!value) return 'Not available';

  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Not available';
  }
};

const getInitials = (name = '', email = '') => {
  const source = name || email || 'User';

  return source
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

const DetailRow = ({ label, value }) => (
  <div className="border-b border-white/10 pb-3 last:border-b-0">
    <p className="text-[11px] text-gray-500 mb-1">{label}</p>
    <p className="text-[12px] text-gray-200">{value || '-'}</p>
  </div>
);

const SecurityRow = ({ label, value, tone = 'pink' }) => (
  <div className="flex items-center justify-between border-b border-white/10 py-4 last:border-b-0">
    <p className="text-[12px] text-gray-300">{label}</p>
    <button
      type="button"
      className={`text-[11px] ${
        tone === 'green' ? 'text-emerald-400' : 'text-[#ff20d8]'
      }`}
    >
      {value}
    </button>
  </div>
);

const UserProfile = ({
  user = {},
  plan = {},
  apiKeyValue = '',
  totals = {},
  recentSearches = [],
  teamMembers = [],
}) => {
  const initials = getInitials(user?.name, user?.email);

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '-';

  const activePlanName = plan?.name || plan?.code || 'No active plan';
  const planBadge = plan?.code ? plan.code.toUpperCase() : 'USER';

  const joinedDate = formatDate(plan?.starts_at || user?.created_at);
  const lastLoginDate = formatDate(user?.last_login_at);
  const planExpiryDate = formatDate(plan?.expires_at || user?.plan_expires_at);

  const members =
    teamMembers.length > 0
      ? teamMembers
      : [
          {
            id: user?.id || 'self',
            name: displayName,
            email: displayEmail,
            role: 'Owner',
            accessLevel: 'Full access',
            joined: joinedDate,
            status: 'Active',
          },
        ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
          User profile
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Manage your account settings, security and organization details.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-white/10 mb-6 overflow-x-auto">
        {['Profile', 'Security', 'Team members', 'Activity log'].map((tab, index) => (
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

      <div className="grid xl:grid-cols-[1fr_360px] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Main profile card */}
          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,0,0,0.35)]">
            <div className="grid lg:grid-cols-[250px_1fr] gap-8">
              {/* Avatar / identity */}
              <div className="flex flex-col items-center lg:items-start">
                <div className="relative mb-4">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#ff20d8] via-[#9b00a8] to-[#651fff] p-[2px]">
                    <div className="w-full h-full rounded-full bg-[#151515] flex items-center justify-center text-3xl font-semibold text-white">
                      {initials}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="absolute right-1 bottom-1 w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center text-xs"
                  >
                    📷
                  </button>
                </div>

                <button
                  type="button"
                  className="text-[#ff20d8] text-sm font-medium hover:underline"
                >
                  ✎ Edit profile
                </button>
              </div>

              <div className="grid md:grid-cols-[1fr_260px] gap-8">
                {/* Basic info */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-semibold text-white">{displayName}</h2>
                    <span className="bg-[#ff20d8]/20 text-[#ff20d8] px-3 py-1 rounded-md text-[11px]">
                      {planBadge}
                    </span>
                  </div>

                  <div className="space-y-3 mt-5 text-sm">
                    <p className="flex items-center gap-3 text-gray-400">
                      <span className="text-gray-500">✉</span>
                      {displayEmail}
                    </p>

                    <p className="flex items-center gap-3 text-gray-400">
                      <span className="text-gray-500">🏢</span>
                      Patent intelligence workspace
                    </p>

                    <p className="flex items-center gap-3 text-gray-400">
                      <span className="text-gray-500">▣</span>
                      Current plan: {activePlanName}
                    </p>

                    <p className="flex items-center gap-3 text-gray-400">
                      <span className="text-gray-500">◷</span>
                      Plan expiry: {planExpiryDate}
                    </p>

                    <p className="flex items-center gap-3 text-gray-400">
                      <span className="text-gray-500">⌘</span>
                      API key: {apiKeyValue ? 'Active' : 'Not generated'}
                    </p>
                  </div>

                  <span className="inline-flex mt-5 bg-emerald-500/10 text-emerald-400 px-5 py-2 rounded-md text-xs">
                    Active
                  </span>
                </div>

                {/* Profile details */}
                <div className="space-y-4 md:border-l md:border-white/10 md:pl-8">
                  <DetailRow label="Full name" value={displayName} />
                  <DetailRow label="Role" value="Patent platform user" />
                  <DetailRow label="Department" value="Research & development" />
                  <DetailRow label="Location" value="India" />
                  <DetailRow label="Time zone" value="GMT+05:30 (Asia/Kolkata)" />
                </div>
              </div>
            </div>
          </section>

          {/* Team members */}
          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                <span className="text-[#ff20d8]">♚</span>
                Team members
              </h2>

              <button
                type="button"
                className="text-emerald-400 text-xs hover:underline"
              >
                Invite member ↗
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-white/10">
                    <th className="py-3 pr-4 font-medium">Member</th>
                    <th className="py-3 pr-4 font-medium">Role</th>
                    <th className="py-3 pr-4 font-medium">Access level</th>
                    <th className="py-3 pr-4 font-medium">Joined</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {members.map((member) => (
                    <tr key={member.id || member.email} className="border-b border-white/5 last:border-b-0">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff20d8] to-[#6d00ff] flex items-center justify-center text-xs text-white">
                            {getInitials(member.name, member.email)}
                          </div>

                          <div>
                            <p className="text-white text-sm">{member.name || 'User'}</p>
                            <p className="text-gray-500 text-xs">{member.email || '-'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 pr-4 text-gray-400">{member.role || 'Member'}</td>
                      <td className="py-3 pr-4 text-gray-400">{member.accessLevel || 'Full access'}</td>
                      <td className="py-3 pr-4 text-gray-500">{member.joined || joinedDate}</td>
                      <td className="py-3 pr-4 text-emerald-400">{member.status || 'Active'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Security */}
          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-white mb-5">
              <span className="text-[#ff20d8]">◇</span>
              Account security
            </h2>

            <div className="border border-white/10 rounded-xl px-5">
              <SecurityRow label="Password" value="Change" />
              <SecurityRow label="Two factor authentication" value="Enable" tone="green" />
              <SecurityRow label="Email verification" value="Verified" tone="green" />
              <SecurityRow label="Session management" value="Manage" />
            </div>
          </section>

          {/* Workspace */}
          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-white mb-5">
              <span className="text-[#ff20d8]">▣</span>
              Workspace details
            </h2>

            <div className="space-y-4">
              <DetailRow label="Workspace name" value={`${displayName}'s workspace`} />
              <DetailRow label="Workspace plan" value={activePlanName} />
              <DetailRow label="Workspace size" value={`${members.length} member${members.length > 1 ? 's' : ''}`} />
              <DetailRow label="Search limit" value={`${plan?.search_limit || 0} searches/month`} />
              <DetailRow label="Searches used" value={plan?.searches_used || 0} />
              <DetailRow label="Searches remaining" value={plan?.searches_remaining || 0} />
            </div>

            <button
              type="button"
              className="w-full mt-6 text-[#ff20d8] text-sm font-medium hover:underline"
            >
              ⚙ Manage workspace settings
            </button>
          </section>
        </div>
      </div>

      {/* Activity row */}
      <section className="mt-6 bg-[#0b0b0d] border border-white/10 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Activity log</h2>
            <p className="text-xs text-gray-500 mt-1">
              Recent patent searches and token usage from your account.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs text-gray-400">
            <span>Total: {totals?.total_searches || 0}</span>
            <span className="text-emerald-400">Success: {totals?.successful_searches || 0}</span>
            <span className="text-red-300">Failed: {totals?.failed_searches || 0}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {(recentSearches || []).slice(0, 3).map((item) => (
            <div key={item.id} className="bg-black/40 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm font-medium text-white truncate">{item.patent_number}</p>
                <span
                  className={`text-[10px] px-2 py-1 rounded-full ${
                    item.status === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-300'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <p className="text-xs text-gray-500 mb-2">
                {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
              </p>

              <p className={item.consumed_token ? 'text-emerald-400 text-xs' : 'text-gray-500 text-xs'}>
                {item.consumed_token ? 'Token consumed' : 'No token consumed'}
              </p>
            </div>
          ))}

          {(!recentSearches || recentSearches.length === 0) && (
            <div className="md:col-span-3 text-sm text-gray-500 bg-black/40 border border-white/10 rounded-xl p-5">
              No activity yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default UserProfile;