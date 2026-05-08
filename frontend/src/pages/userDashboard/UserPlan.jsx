import React, { useCallback, useEffect, useState } from 'react';
import { plansAPI } from '../../utils/api';

const compactNumber = (value) => {
  const num = Number(value || 0);

  if (num >= 1000000) return `${(num / 1000000).toFixed(num >= 10000000 ? 0 : 1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K`;

  return String(num);
};

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

const MiniUsageChart = ({ usagePercent = 0 }) => {
  const points = [
    14, 32, 24, 27, 22, 36, 51, 45, 48, 62, 55, 70, 58, 66, 64, 72, 61, 80,
  ];

  const max = Math.max(...points);
  const min = Math.min(...points);

  const mainPath = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 100 - ((value - min) / (max - min)) * 78 - 10;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const secondaryPath = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * 100;
      const shifted = Math.max(value - 14 + (index % 3) * 5, 8);
      const y = 100 - ((shifted - min) / (max - min)) * 72 - 12;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="h-[230px] w-full relative">
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
          d={secondaryPath}
          fill="none"
          stroke="#7a1cff"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />

        <path
          d={mainPath}
          fill="none"
          stroke="#e600c7"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="absolute right-6 top-8 bg-[#101012] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-sm text-white font-semibold mb-2">Current usage</p>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-[#7a1cff]" />
          Requests used
          <span className="text-white ml-2">{usagePercent}%</span>
        </div>
      </div>
    </div>
  );
};

const FeatureRow = ({ label, value = 'Included' }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-white/10 last:border-b-0">
    <span className="flex items-center gap-3 text-sm text-gray-300">
      <span className="text-emerald-400">✓</span>
      {label}
    </span>

    <span className="text-xs text-gray-400">{value}</span>
  </div>
);

const BillingRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-5 border-b border-white/10 pb-4 last:border-b-0">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-xs text-gray-200 text-right">{value || '-'}</span>
  </div>
);

const UserPlan = ({
 plan = {},
  totals = {},
  searchesUsed = 0,
  searchLimit = 0,
  usagePercent = 0,
  onManagePlan = null,
  onComparePlans = null,
  onPlanChanged = null,
}) => {
  const planName = plan?.name || plan?.code || 'No active plan';
  const planCode = plan?.code || 'none';

  const searchesRemaining = Number(
    plan?.searches_remaining ?? Math.max(Number(searchLimit || 0) - Number(searchesUsed || 0), 0)
  );

  const monthlyPrice = Number(plan?.price_inr || 0);
  const billingCycle = plan?.billing_interval || 'monthly';

  const features =
    plan?.features?.length > 0
      ? plan.features
      : ['Basic search & filters', 'Patent result tracking', 'Usage analytics', 'API access'];

  const planDescription =
    plan?.description ||
    'For professional research teams looking to access structured patent intelligence and search analytics.';

    const [availablePlans, setAvailablePlans] = useState([]);
const [plansLoading, setPlansLoading] = useState(false);
const [plansError, setPlansError] = useState('');
const [selectingPlanCode, setSelectingPlanCode] = useState('');

const loadPlans = useCallback(async () => {
  try {
    setPlansLoading(true);
    setPlansError('');

    const response = await plansAPI.getPlans();

    if (response?.success) {
      setAvailablePlans(response.data || []);
    }
  } catch (err) {
    setPlansError(err.response?.data?.message || 'Failed to load plans.');
  } finally {
    setPlansLoading(false);
  }
}, []);

useEffect(() => {
  loadPlans();
}, [loadPlans]);

const handleSelectPlan = async (planCode) => {
  if (!planCode) return;

  try {
    setSelectingPlanCode(planCode);
    setPlansError('');

    const response = await plansAPI.selectPlan(planCode);

    if (response?.success) {
      if (response.data?.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      if (response.data?.api_key) {
        localStorage.setItem('api_key', response.data.api_key);
      }

      if (onPlanChanged) {
        await onPlanChanged();
      }

      await loadPlans();
    }
  } catch (err) {
    setPlansError(err.response?.data?.message || 'Failed to activate plan.');
  } finally {
    setSelectingPlanCode('');
  }
};

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
          Plan & Billing
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Manage your current plan, monthly usage, billing details and upgrade options.
        </p>
      </div>

      <div className="grid xl:grid-cols-[1fr_330px] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Current plan */}
          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,0,0,0.35)]">
            <div className="grid lg:grid-cols-[260px_1fr] gap-8">
              <div className="flex gap-5">
                <div className="w-24 h-24 rounded-full bg-[#161616] flex items-center justify-center shrink-0">
                  <span className="text-5xl text-yellow-400">♛</span>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">Current plan</p>

                  <h2 className="text-3xl font-semibold capitalize text-white mb-2">
                    {planName}
                  </h2>

                  <span className="inline-flex bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-md text-xs">
                    Active
                  </span>

                  <p className="text-xs text-gray-500 mt-5">
                    Renew on {formatDate(plan?.expires_at)}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-[1fr_1fr] gap-8">
                <div className="md:border-l md:border-white/10 md:pl-8">
                  <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                    {planDescription}
                  </p>

                  <button
                    type="button"
                    onClick={onManagePlan || undefined}
                    className="mt-6 bg-[#a810a8] hover:brightness-125 transition-all text-white px-5 py-2.5 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    Manage plan ⚙
                  </button>
                </div>

                <div className="space-y-1">
                  <FeatureRow
                    label={`${compactNumber(searchLimit)} API requests/month`}
                    value={`${compactNumber(searchesRemaining)} remaining`}
                  />

                  {features.map((feature) => (
                    <FeatureRow key={feature} label={feature} />
                  ))}

                  <FeatureRow label="Team members" value={planCode === 'pro' ? '50' : '1'} />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,0,0,0.35)]">
  <div className="flex items-center justify-between gap-4 mb-6">
    <div>
      <h2 className="text-lg font-semibold text-white">Available plans</h2>
      <p className="text-xs text-gray-500 mt-1">
        Compare all plans from database and upgrade anytime.
      </p>
    </div>

    <button
      type="button"
      onClick={loadPlans}
      className="text-[#ff20d8] text-xs font-semibold hover:underline"
    >
      Refresh
    </button>
  </div>

  {plansError && (
    <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl px-4 py-3 text-sm">
      {plansError}
    </div>
  )}

  {plansLoading ? (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 text-sm text-gray-400">
      Loading plans...
    </div>
  ) : availablePlans.length === 0 ? (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 text-sm text-gray-400">
      No plans found.
    </div>
  ) : (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {availablePlans.map((item) => {
        const itemCode = item.code || item.plan_code;
        const isCurrent = itemCode === planCode;
        const itemFeatures = Array.isArray(item.features) ? item.features : [];

        return (
          <div
            key={item.id || itemCode}
            className={`rounded-2xl border p-5 bg-black/40 ${
              isCurrent ? 'border-emerald-400/40' : 'border-white/10'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-white font-semibold capitalize">
                  {item.name || itemCode}
                </h3>

                <p className="text-xs text-gray-500">
                  {item.billing_interval || 'monthly'}
                </p>
              </div>

              {isCurrent && (
                <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs">
                  Current
                </span>
              )}
            </div>

            <p className="text-3xl font-semibold text-white mb-3">
              ₹{Number(item.price_inr || 0)}
            </p>

            <p className="text-xs text-gray-400 leading-relaxed min-h-[40px]">
              {item.description || 'Patent search plan.'}
            </p>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="bg-black/40 border border-white/10 rounded-xl p-3">
                <p className="text-xs text-gray-500">Search limit</p>
                <p className="text-sm text-white font-semibold">
                  {compactNumber(item.search_limit || 0)}
                </p>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-xl p-3">
                <p className="text-xs text-gray-500">Results/search</p>
                <p className="text-sm text-white font-semibold">
                  {item.results_per_search || '-'}
                </p>
              </div>
            </div>

            {itemFeatures.length > 0 && (
              <div className="space-y-2 mb-4">
                {itemFeatures.slice(0, 3).map((feature, index) => (
                  <p key={`${itemCode}-${index}`} className="text-xs text-gray-300">
                    <span className="text-emerald-400 mr-2">✓</span>
                    {feature}
                  </p>
                ))}
              </div>
            )}

            <button
              type="button"
              disabled={isCurrent || selectingPlanCode === itemCode}
              onClick={() => handleSelectPlan(itemCode)}
              className="w-full bg-gradient-to-r from-[#e600c7] to-[#9b00a8] py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCurrent
                ? 'Already active'
                : selectingPlanCode === itemCode
                  ? 'Activating...'
                  : Number(item.price_inr || 0) === 0
                    ? 'Start free plan'
                    : 'Upgrade plan'}
            </button>
          </div>
        );
      })}
    </div>
  )}
</section>

          {/* Usage */}
          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Usage this month</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Track your search limit consumption for the current billing cycle.
                </p>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500">Usage</p>
                <p className="text-sm text-white font-semibold">{usagePercent}% used</p>
              </div>
            </div>

            <MiniUsageChart usagePercent={usagePercent} />

            <div className="grid sm:grid-cols-4 border-t border-white/10 mt-2">
              {[
                ['Search limit', compactNumber(searchLimit)],
                ['Used', compactNumber(searchesUsed)],
                ['Remaining', compactNumber(searchesRemaining)],
                ['Success', compactNumber(totals?.successful_searches || 0)],
              ].map(([label, value]) => (
                <div key={label} className="p-4 border-r border-white/10 last:border-r-0">
                  <p className="text-gray-500 text-xs mb-1">{label}</p>
                  <p className="font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <aside className="space-y-6">
          {/* Billing summary */}
          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold text-white mb-6">Billing summary</h2>

            <div className="space-y-4">
              <BillingRow label="Plan" value={`${planName} plan`} />
              <BillingRow label="Billing cycle" value={billingCycle} />
              <BillingRow label="Monthly price" value={`₹${monthlyPrice}`} />
              <BillingRow label="Next billing date" value={formatDate(plan?.expires_at)} />
              <BillingRow label="Payment method" value={monthlyPrice > 0 ? '•••• •••• •••• 4587' : 'Free plan'} />
            </div>

            <button
              type="button"
              disabled={monthlyPrice === 0}
              className="w-full mt-6 bg-gradient-to-r from-[#e600c7] to-[#9b00a8] py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update payment method
            </button>

            <button
              type="button"
              className="w-full mt-4 text-[#ff20d8] text-sm font-semibold"
            >
              View billing history →
            </button>
          </section>

          {/* Upgrade */}
          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold text-white mb-3">Upgrade for more power</h2>

            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              For professional and small teams looking to enhance their patent research with advanced AI and analytics.
            </p>

            <button
              type="button"
              onClick={onComparePlans || undefined}
              className="text-[#ff20d8] text-sm font-semibold hover:underline"
            >
              Compare plans →
            </button>
          </section>

          {/* Limit health */}
          <section className="bg-[#0b0b0d] border border-white/10 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold text-white mb-5">Limit health</h2>

            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Monthly usage</span>
              <span>{usagePercent}%</span>
            </div>

            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ff20d8] to-[#9b00ff] rounded-full"
                style={{ width: `${usagePercent}%` }}
              />
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
                ? 'Your search limit is almost consumed. Upgrade soon.'
                : usagePercent >= 70
                  ? 'Your usage is getting high.'
                  : 'Your plan usage is healthy.'}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default UserPlan;