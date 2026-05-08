import React from 'react';

const SIDEBAR_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: '⌂',
  },
  {
    key: 'profile',
    label: 'User profile',
    icon: '⌕',
  },
  {
    key: 'api',
    label: 'API keys',
    icon: '♙',
  },
  {
    key: 'plan',
    label: 'Plan',
    icon: '♛',
  },
  {
    key: 'docs',
    label: 'Documentation',
    icon: '▧',
  },
];

const DashboardSidebar = ({
  activeTab = 'dashboard',
  setActiveTab,
  onHome,
  onLogout,
}) => {
  const handleTabClick = (key) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(key);
    }
  };

  return (
    <aside className="hidden lg:flex w-[230px] shrink-0 bg-[#09090a] border-r border-white/10 px-5 py-8 flex-col min-h-screen">
      {/* Logo */}
      <button
        type="button"
        onClick={onHome}
        className="text-left text-3xl font-serif tracking-tight mb-10 text-white hover:text-[#ff20d8] transition-colors"
      >
        mixpanel
      </button>

      {/* Navigation */}
      <nav className="space-y-3">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = activeTab === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleTabClick(item.key)}
              className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#e600c7] to-[#9b00a8] text-white shadow-[0_0_22px_rgba(230,0,199,0.35)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <span className="text-base w-5 flex justify-center">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="mt-auto space-y-3">
        <button
          type="button"
          onClick={onHome}
          className="w-full border border-white/10 text-gray-300 hover:text-white hover:bg-white/[0.05] rounded-xl px-5 py-3 text-sm transition-colors"
        >
          Back to Home
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="w-full border border-red-500/30 text-red-300 hover:bg-red-500/10 rounded-xl px-5 py-3 text-sm transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;