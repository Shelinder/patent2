import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, patentAPI, plansAPI } from '../utils/api';

const parseMaybeJson = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const formatDate = (value) => {
  if (!value) return '-';

  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

const stringifyValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
};

const getDocumentIdText = (item) => {
  const doc = item?.['document-id'] || item?.documentId || item;

  if (!doc || typeof doc !== 'object') return stringifyValue(item);

  const parts = [
    doc.country,
    doc['doc-number'],
    doc.doc_number,
    doc.kind,
    doc.date,
  ].filter(Boolean);

  return parts.length ? parts.join(' / ') : stringifyValue(doc);
};

const getApplicantNames = (applicants) => {
  const parsed = parseMaybeJson(applicants);
  const list = parsed?.['exch:applicant'];

  if (!Array.isArray(list)) return [];

  return list
    .map((item) => item?.['exch:applicant-name']?.name)
    .filter(Boolean);
};

const getInventorNames = (inventors) => {
  const parsed = parseMaybeJson(inventors);
  const list = parsed?.['exch:inventor'];

  if (!Array.isArray(list)) return [];

  return list
    .map((item) => item?.['exch:inventor-name']?.name)
    .filter(Boolean);
};

const getArrayFromPossibleObject = (value, key) => {
  const parsed = parseMaybeJson(value);

  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;

  if (key && Array.isArray(parsed[key])) return parsed[key];

  return [parsed];
};

const InfoCard = ({ label, value }) => (
  <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-sm text-white font-medium break-words">{value || '-'}</p>
  </div>
);

const JsonBlock = ({ value }) => (
  <pre className="bg-black/50 border border-white/10 rounded-2xl p-4 text-xs text-gray-300 overflow-x-auto max-h-[360px] leading-6">
    {stringifyValue(parseMaybeJson(value))}
  </pre>
);

const Section = ({ title, children }) => (
  <section className="bg-[#0b0b0d] border border-white/10 rounded-[24px] p-6">
    <h3 className="text-lg font-semibold mb-5">{title}</h3>
    {children}
  </section>
);

const PlanPopup = ({
  open,
  plans = [],
  currentPlan = null,
  loading = false,
  selectingPlanCode = '',
  error = '',
  onClose,
  onSelectPlan,
  onGoDashboard,
}) => {
  if (!open) return null;

  const currentPlanCode = currentPlan?.code || currentPlan?.plan_code || '';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-5">
      <div className="w-full max-w-5xl bg-[#080808] border border-white/10 rounded-[28px] shadow-[0_0_80px_rgba(168,16,168,0.25)] overflow-hidden">
        <div className="flex items-start justify-between gap-5 px-6 md:px-8 py-6 border-b border-white/10">
          <div>
            <p className="text-xs text-[#ff20d8] font-semibold mb-2">
              Plan required
            </p>

            <h2 className="text-2xl md:text-3xl font-semibold text-white">
              Choose a plan to search patents
            </h2>

            <p className="text-sm text-gray-400 mt-2 max-w-2xl">
              Patent searches consume plan tokens. Select a plan first, then you can search by patent number.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="px-6 md:px-8 py-6">
          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-200 rounded-2xl px-5 py-4 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-black/40 border border-white/10 rounded-2xl p-8 text-center text-gray-400">
              Loading plans...
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-black/40 border border-white/10 rounded-2xl p-8 text-center text-gray-400">
              No plans found. Please contact support.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {plans.map((plan) => {
                const planCode = plan.code || plan.plan_code;
                const isCurrent = currentPlanCode && planCode === currentPlanCode;
                const features = Array.isArray(plan.features) ? plan.features : [];

                return (
                  <div
                    key={plan.id || planCode}
                    className={`rounded-2xl border p-5 bg-black/40 ${
                      isCurrent
                        ? 'border-emerald-400/40 shadow-[0_0_30px_rgba(16,185,129,0.12)]'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white capitalize">
                          {plan.name || planCode}
                        </h3>

                        <p className="text-xs text-gray-500 mt-1">
                          {plan.billing_interval || 'monthly'}
                        </p>
                      </div>

                      {isCurrent && (
                        <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="mb-5">
                      <span className="text-3xl font-semibold text-white">
                        ₹{Number(plan.price_inr || 0)}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">
                        / {plan.billing_interval || 'month'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 leading-relaxed min-h-[44px]">
                      {plan.description || 'Patent search access plan.'}
                    </p>

                    <div className="grid grid-cols-2 gap-3 my-5">
                      <InfoCard label="Search limit" value={plan.search_limit ?? '-'} />
                      <InfoCard label="Results/search" value={plan.results_per_search ?? '-'} />
                    </div>

                    {features.length > 0 && (
                      <div className="space-y-2 mb-5">
                        {features.slice(0, 4).map((feature, index) => (
                          <p key={`${planCode}-${index}`} className="text-xs text-gray-300">
                            <span className="text-emerald-400 mr-2">✓</span>
                            {feature}
                          </p>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isCurrent || selectingPlanCode === planCode}
                      onClick={() => onSelectPlan(planCode)}
                      className="w-full bg-gradient-to-r from-[#e600c7] to-[#9b00a8] py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCurrent
                        ? 'Already active'
                        : selectingPlanCode === planCode
                          ? 'Activating...'
                          : Number(plan.price_inr || 0) === 0
                            ? 'Start free plan'
                            : 'Upgrade plan'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={onGoDashboard}
              className="border border-white/10 text-gray-300 hover:text-white hover:bg-white/[0.05] rounded-xl px-5 py-3 text-sm"
            >
              Go to dashboard
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-white/10 hover:bg-white/15 rounded-xl px-5 py-3 text-sm text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getFulltextSection = (description, sectionName) => {
  const sections = getArrayFromPossibleObject(description);
  const target = String(sectionName || '').toUpperCase();

  return sections.find(
    (item) => String(item?.section || '').toUpperCase() === target
  );
};

const getFulltextParagraphs = (description, sectionName) => {
  const section = getFulltextSection(description, sectionName);
  const paragraphs = section?.paragraphs;

  return Array.isArray(paragraphs) ? paragraphs.filter(Boolean) : [];
};

const getLandscapeValues = (landscapes, name) => {
  const list = getArrayFromPossibleObject(landscapes);
  const target = String(name || '').toLowerCase();

  const item = list.find(
    (entry) => String(entry?.name || '').toLowerCase() === target
  );

  return Array.isArray(item?.values) ? item.values.filter(Boolean) : [];
};

const ParagraphList = ({ paragraphs = [], emptyText = 'No data found.' }) => {
  if (!paragraphs.length) {
    return <p className="text-sm text-gray-500">{emptyText}</p>;
  }

  return (
    <div className="space-y-4 max-h-[620px] overflow-y-auto pr-2">
      {paragraphs.map((text, index) => (
        <p
          key={index}
          className="bg-black/30 border border-white/10 rounded-2xl p-4 text-sm text-gray-300 leading-7"
        >
          {text}
        </p>
      ))}
    </div>
  );
};

const Documents = () => {
  const navigate = useNavigate();

  const [patentNumber, setPatentNumber] = useState('');
  const [patent, setPatent] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [dashboard, setDashboard] = useState(null);
const [dashboardLoading, setDashboardLoading] = useState(true);

const [plans, setPlans] = useState([]);
const [plansLoading, setPlansLoading] = useState(false);
const [planPopupOpen, setPlanPopupOpen] = useState(false);
const [planError, setPlanError] = useState('');
const [selectingPlanCode, setSelectingPlanCode] = useState('');


const currentPlan = dashboard?.plan || null;

const hasActivePlan = useMemo(() => {
  return Boolean(dashboard?.active_plan && currentPlan?.code && currentPlan?.code !== 'none');
}, [dashboard, currentPlan]);

const searchesRemaining = Number(currentPlan?.searches_remaining || 0);

const loadDashboard = useCallback(async () => {
  try {
    setDashboardLoading(true);

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
  } finally {
    setDashboardLoading(false);
  }
}, [navigate]);

const loadPlans = useCallback(async () => {
  try {
    setPlansLoading(true);
    setPlanError('');

    const response = await plansAPI.getPlans();

    if (response?.success) {
      setPlans(response.data || []);
    }
  } catch (err) {
    setPlanError(err.response?.data?.message || 'Failed to load plans.');
  } finally {
    setPlansLoading(false);
  }
}, []);

const openPlanPopup = useCallback(async () => {
  setPlanPopupOpen(true);

  if (plans.length === 0) {
    await loadPlans();
  }
}, [loadPlans, plans.length]);

const handleSelectPlan = async (planCode) => {
  if (!planCode) return;

  try {
    setSelectingPlanCode(planCode);
    setPlanError('');

    const response = await plansAPI.selectPlan(planCode);

    if (response?.success) {
      if (response.data?.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      if (response.data?.api_key) {
        localStorage.setItem('api_key', response.data.api_key);
      }

      await loadDashboard();

      setPlanPopupOpen(false);
      setError('');
    }
  } catch (err) {
    setPlanError(err.response?.data?.message || 'Failed to activate plan.');
  } finally {
    setSelectingPlanCode('');
  }
};

useEffect(() => {
  loadDashboard();
}, [loadDashboard]);

  const handleSearch = async (e) => {
  e.preventDefault();

  const value = patentNumber.trim();

  if (!value) {
    setError('Enter a patent number first.');
    return;
  }

  if (dashboardLoading) {
    setError('Checking your plan. Please try again in a moment.');
    return;
  }

  if (!hasActivePlan) {
    setError('');
    setPatent(null);
    setMeta(null);
    await openPlanPopup();
    return;
  }

  if (searchesRemaining <= 0) {
    setError('');
    setPatent(null);
    setMeta(null);
    setPlanError('Your current plan search limit is consumed. Please upgrade your plan.');
    await openPlanPopup();
    return;
  }

  try {
    setLoading(true);
    setError('');
    setPatent(null);
    setMeta(null);

    const response = await patentAPI.getPatentByNumber(value);

    if (response?.success) {
      setPatent(response.data);
      setMeta(response.meta || null);
      await loadDashboard();
    }
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.message || 'Patent search failed.';

    if (status === 403 || status === 429) {
      setPlanError(message);
      await openPlanPopup();
    } else {
      setError(message);
    }

    setMeta(err.response?.data?.meta || null);
  } finally {
    setLoading(false);
  }
};

  const publicationRefs = getArrayFromPossibleObject(patent?.publication_refs);
  const applicationRefs = getArrayFromPossibleObject(patent?.application_refs);
  const priorityClaims = getArrayFromPossibleObject(
    patent?.priority_claims,
    'exch:priority-claim'
  );

  const cpcItems = getArrayFromPossibleObject(
    patent?.cpc,
    'patent-classification'
  );

  const ipcrItems = getArrayFromPossibleObject(
    patent?.ipcr,
    'classification-ipcr'
  );

  const applicantNames = getApplicantNames(patent?.applicants);
  const inventorNames = getInventorNames(patent?.inventors);

  const citations = getArrayFromPossibleObject(
    patent?.citations,
    'exch:citation'
  );

  const isFulltextPatent = patent?.source_table === 'patent_fulltext';

const fulltextDescriptionParagraphs = getFulltextParagraphs(
  patent?.description,
  'DESCRIPTION'
);

const fulltextClaimsParagraphs = getFulltextParagraphs(
  patent?.description,
  'CLAIMS'
);

const googleSourceParagraphs = getFulltextParagraphs(
  patent?.description,
  'GOOGLE_PATENTS_SOURCE'
);

const fulltextImages = getArrayFromPossibleObject(patent?.images);
const fulltextClassifications = getArrayFromPossibleObject(patent?.classifications);
const fulltextLandscapes = getArrayFromPossibleObject(patent?.landscapes);

const fulltextInventors = getLandscapeValues(patent?.landscapes, 'Inventors');
const fulltextAssignees = getLandscapeValues(patent?.landscapes, 'Assignees');

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans overflow-x-hidden">
      <div
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(145, 142, 142, 0.35) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="fixed top-[-15%] left-[-10%] w-[600px] h-[600px] bg-[#a810a8]/20 blur-[180px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[520px] h-[520px] bg-[#7b00ff]/10 blur-[180px] rounded-full pointer-events-none" />

      <nav className="relative z-10 flex items-center justify-between px-8 md:px-16 lg:px-24 py-6 max-w-[1440px] mx-auto">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-2xl font-serif tracking-tight font-medium"
        >
          mixpanel
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-[#a810a8ea] to-[#a810a8ea] px-6 py-2.5 rounded-full text-sm font-medium hover:scale-105 transition-all shadow-[0_0_20px_rgba(230,0,122,0.35)]"
          >
            Dashboard
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-[1280px] mx-auto px-8 md:px-16 lg:px-24 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-black/50 border border-white/10 px-4 py-1.5 rounded-full text-xs text-gray-300 mb-6 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-[#e6007a] shadow-[0_0_8px_#e6007a]" />
            Patent documents
          </div>

          <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-5">
            Search Patent Documents
          </h1>

          <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Search by exact patent number. Example:{' '}
            <span className="text-white font-medium">AP993A</span>.
            Successful searches consume one token from your active plan.
          </p>
        </div>

        <section className="bg-[#0b0b0d] border border-white/10 rounded-[28px] p-5 md:p-7 shadow-[0_0_60px_rgba(168,16,168,0.12)] mb-8">
        <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-black/30 border border-white/10 rounded-2xl px-5 py-4">
  <div>
    <p className="text-xs text-gray-500">Current plan</p>
    <p className="text-sm text-white font-semibold capitalize">
      {hasActivePlan ? currentPlan?.name || currentPlan?.code : 'No active plan'}
    </p>
  </div>

  <div className="flex items-center gap-3">
    {hasActivePlan && (
      <p className="text-xs text-gray-400">
        Remaining:{' '}
        <span className="text-white font-semibold">
          {currentPlan?.searches_remaining ?? 0}
        </span>
        {' '} / {currentPlan?.search_limit ?? 0}
      </p>
    )}

    <button
      type="button"
      onClick={openPlanPopup}
      className="text-[#ff20d8] text-sm font-semibold hover:underline"
    >
      {hasActivePlan ? 'View / upgrade plans' : 'Choose plan'}
    </button>
  </div>
</div>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-2">
                Patent number
              </label>

              <input
                type="text"
                value={patentNumber}
                onChange={(e) => setPatentNumber(e.target.value)}
                placeholder="Enter patent number, e.g. AP993A"
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-600 outline-none focus:border-[#ff20d8]/70 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || dashboardLoading}
              className="md:self-end bg-gradient-to-r from-[#e600c7] to-[#9b00a8] px-8 py-4 rounded-2xl text-sm font-semibold hover:brightness-125 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {dashboardLoading ? 'Checking plan...' : loading ? 'Searching...' : 'Search Patent'}
            </button>
          </form>

          {error && (
            <div className="mt-5 bg-red-500/10 border border-red-500/20 text-red-200 rounded-2xl px-5 py-4 text-sm">
              {error}
            </div>
          )}

          {meta && (
            <div className="mt-5 grid sm:grid-cols-4 gap-3">
              <InfoCard label="Plan" value={meta.plan_code || '-'} />
              <InfoCard label="Limit" value={meta.search_limit ?? '-'} />
              <InfoCard label="Used" value={meta.searches_used ?? '-'} />
              <InfoCard label="Remaining" value={meta.searches_remaining ?? '-'} />
            </div>
          )}
        </section>

        {!patent ? (
          <section className="bg-[#0b0b0d] border border-white/10 rounded-[28px] p-10 text-center">
            <div className="w-16 h-16 bg-[#a810a8]/20 border border-[#a810a8]/30 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl">
              ▣
            </div>

            <h2 className="text-xl font-semibold mb-2">No patent selected</h2>

            <p className="text-gray-500 text-sm">
              Enter an exact patent number above to view complete patent details.
            </p>
          </section>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <section className="bg-[#0b0b0d] border border-white/10 rounded-[28px] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.35)]">
              <div className="p-6 md:p-8 border-b border-white/10">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                  <div>
                    <p className="text-[#ff20d8] text-sm font-semibold mb-2">
                      {patent.patent_number}
                    </p>

                    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
                      {patent.title_en || 'Untitled patent'}
                    </h2>

                    <p className="text-gray-500 text-sm">
                      Published: {formatDate(patent.date_publ)}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <span className="bg-white/5 border border-white/10 text-gray-300 px-4 py-2 rounded-full text-xs">
                      {patent.country || '-'}
                    </span>

                    <span className="bg-white/5 border border-white/10 text-gray-300 px-4 py-2 rounded-full text-xs">
                      Doc: {patent.doc_number || '-'}
                    </span>

                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-xs">
                      Token consumed
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <h3 className="text-lg font-semibold mb-3">Abstract</h3>

                <p className="text-gray-400 text-sm leading-7">
                  {patent.abstract_en || 'No abstract available for this patent.'}
                </p>
              </div>
            </section>

            {isFulltextPatent && (
  <>
    {/* Google patent quick links */}
    <Section title="Google Patent source">
      <div className="grid md:grid-cols-2 gap-4">
        <InfoCard label="Source table" value={patent.source_table} />
        <InfoCard label="PDF link" value={patent.pdf_link} />
      </div>

      <div className="flex flex-wrap gap-3 mt-5">
        {patent.pdf_link && (
          <a
            href={patent.pdf_link}
            target="_blank"
            rel="noreferrer"
            className="bg-gradient-to-r from-[#e600c7] to-[#9b00a8] px-5 py-3 rounded-xl text-sm font-semibold"
          >
            Download PDF
          </a>
        )}

        {googleSourceParagraphs[0] && (
          <a
            href={googleSourceParagraphs[0]}
            target="_blank"
            rel="noreferrer"
            className="bg-white/10 border border-white/10 px-5 py-3 rounded-xl text-sm font-semibold text-white"
          >
            Open Google Patent
          </a>
        )}
      </div>
    </Section>

    {/* Images */}
    <Section title={`Images (${fulltextImages.length})`}>
      {fulltextImages.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fulltextImages.map((src, index) => (
            <a
              key={`${src}-${index}`}
              href={src}
              target="_blank"
              rel="noreferrer"
              className="bg-white rounded-2xl overflow-hidden border border-white/10 p-3"
            >
              <img
                src={src}
                alt={`Patent figure ${index + 1}`}
                className="w-full h-48 object-contain"
              />
            </a>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No images found.</p>
      )}
    </Section>

    {/* Full description */}
    <Section title={`Description (${fulltextDescriptionParagraphs.length})`}>
      <ParagraphList
        paragraphs={fulltextDescriptionParagraphs}
        emptyText="No description found."
      />
    </Section>

    {/* Claims */}
    <Section title={`Claims (${fulltextClaimsParagraphs.length})`}>
      <ParagraphList
        paragraphs={fulltextClaimsParagraphs}
        emptyText="No claims found. Update Google scraper claims selector if this remains empty."
      />
    </Section>

    {/* Google classifications */}
    <Section title={`Google classifications (${fulltextClassifications.length})`}>
      {fulltextClassifications.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {fulltextClassifications.map((item, index) => (
            <div
              key={index}
              className="bg-black/40 border border-white/10 rounded-2xl p-4"
            >
              <p className="text-sm text-gray-300 leading-6">
                {item?.text || stringifyValue(item)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No classifications found.</p>
      )}
    </Section>

    {/* Landscapes */}
    <Section title="Landscapes / people">
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Inventors</h4>

          {fulltextInventors.length > 0 ? (
            <div className="space-y-3">
              {fulltextInventors.map((name, index) => (
                <p
                  key={`${name}-${index}`}
                  className="bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-gray-300"
                >
                  {name}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No inventors found.</p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Assignees</h4>

          {fulltextAssignees.length > 0 ? (
            <div className="space-y-3">
              {fulltextAssignees.map((name, index) => (
                <p
                  key={`${name}-${index}`}
                  className="bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-gray-300"
                >
                  {name}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No assignees found.</p>
          )}
        </div>
      </div>

      {fulltextLandscapes.length > 0 && (
        <details className="mt-5">
          <summary className="cursor-pointer text-[#ff20d8] text-sm font-medium mb-4">
            View raw landscape data
          </summary>

          <JsonBlock value={fulltextLandscapes} />
        </details>
      )}
    </Section>
  </>
)}

{!isFulltextPatent && (
  <>
              {/* Basic DB fields */}
            <Section title="Patent record details">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoCard label="ID" value={patent.id} />
                <InfoCard label="Doc ID" value={patent.doc_id} />
                <InfoCard label="Family ID" value={patent.family_id} />
                <InfoCard label="Country" value={patent.country} />
                <InfoCard label="Doc number" value={patent.doc_number} />
                <InfoCard label="Kind" value={patent.kind} />
                <InfoCard label="Representative" value={patent.is_representative ? 'Yes' : 'No'} />
                <InfoCard label="Originating office" value={patent.originating_office} />
                <InfoCard label="Language of filing" value={patent.language_of_filing || '-'} />
                <InfoCard label="Publication date" value={formatDate(patent.date_publ)} />
                <InfoCard label="Last exchange" value={formatDate(patent.date_of_last_exchange)} />
                <InfoCard label="Added DOCDB" value={formatDate(patent.date_added_docdb)} />
                <InfoCard label="Created at" value={formatDate(patent.created_at)} />
                <InfoCard label="Updated at" value={formatDate(patent.updated_at)} />
              </div>
            </Section>

            {/* References */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Section title="Publication references">
                {publicationRefs.length > 0 ? (
                  <div className="space-y-3">
                    {publicationRefs.map((item, index) => (
                      <div key={index} className="bg-black/40 border border-white/10 rounded-2xl p-4">
                        <p className="text-sm text-white">{getDocumentIdText(item)}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Format: {item?.['@data-format'] || '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No publication references found.</p>
                )}
              </Section>

              <Section title="Application references">
                {applicationRefs.length > 0 ? (
                  <div className="space-y-3">
                    {applicationRefs.map((item, index) => (
                      <div key={index} className="bg-black/40 border border-white/10 rounded-2xl p-4">
                        <p className="text-sm text-white">{getDocumentIdText(item)}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Format: {item?.['@data-format'] || '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No application references found.</p>
                )}
              </Section>
            </div>

            {/* Priority + Classification */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Section title="Priority claims">
                {priorityClaims.length > 0 ? (
                  <div className="space-y-3">
                    {priorityClaims.map((item, index) => (
                      <div key={index} className="bg-black/40 border border-white/10 rounded-2xl p-4">
                        <p className="text-sm text-white">{getDocumentIdText(item)}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Sequence: {item?.['@sequence'] || '-'} | Format: {item?.['@data-format'] || '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No priority claims found.</p>
                )}
              </Section>

              <Section title="IPC / IPCR classification">
                <div className="space-y-4">
                  <InfoCard
                    label="IPC main classification"
                    value={
                      parseMaybeJson(patent.ipc)?.['main-classification'] ||
                      parseMaybeJson(patent.ipc)?.edition ||
                      '-'
                    }
                  />

                  {ipcrItems.length > 0 ? (
                    ipcrItems.map((item, index) => (
                      <InfoCard key={index} label={`IPCR ${index + 1}`} value={item?.text || stringifyValue(item)} />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No IPCR data found.</p>
                  )}
                </div>
              </Section>
            </div>

            {/* CPC */}
            <Section title="CPC classifications">
              {cpcItems.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {cpcItems.map((item, index) => (
                    <div key={index} className="bg-black/40 border border-white/10 rounded-2xl p-4">
                      <p className="text-sm text-white font-medium mb-2">
                        {item?.['classification-symbol'] || `CPC ${index + 1}`}
                      </p>

                      <p className="text-xs text-gray-500">
                        Office: {item?.['generating-office'] || '-'} | Status: {item?.['classification-status'] || '-'}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Value: {item?.['classification-value'] || '-'} | Position: {item?.['symbol-position'] || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No CPC data found.</p>
              )}
            </Section>

            {/* People */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Section title="Applicants">
                {applicantNames.length > 0 ? (
                  <div className="space-y-3">
                    {applicantNames.map((name, index) => (
                      <p key={`${name}-${index}`} className="bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-gray-300">
                        {name}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No applicants found.</p>
                )}
              </Section>

              <Section title="Inventors">
                {inventorNames.length > 0 ? (
                  <div className="space-y-3">
                    {inventorNames.map((name, index) => (
                      <p key={`${name}-${index}`} className="bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-gray-300">
                        {name}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No inventors found.</p>
                )}
              </Section>
            </div>

            {/* Citations + designation */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Section title="Citations">
                {citations.length > 0 ? (
                  <div className="space-y-3">
                    {citations.map((item, index) => (
                      <div key={index} className="bg-black/40 border border-white/10 rounded-2xl p-4">
                        <p className="text-sm text-white">
                          {item?.patcit?.['@dnum'] ||
                            item?.patcit?.['@num'] ||
                            `Citation ${index + 1}`}
                        </p>

                        <p className="text-xs text-gray-500 mt-2">
                          Phase: {item?.['@cited-phase'] || '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No citations found.</p>
                )}
              </Section>

              <Section title="Designation states">
                {patent.designation_states ? (
                  <JsonBlock value={patent.designation_states} />
                ) : (
                  <p className="text-sm text-gray-500">No designation states found.</p>
                )}
              </Section>
            </div>
            </>
)}

            {/* Raw complete data */}
            <Section title="Complete raw patent record">
              <details>
                <summary className="cursor-pointer text-[#ff20d8] text-sm font-medium mb-4">
                  View complete JSON data
                </summary>

                <JsonBlock value={patent} />
              </details>
            </Section>
          </div>
        )}
      </main>
      <PlanPopup
  open={planPopupOpen}
  plans={plans}
  currentPlan={currentPlan}
  loading={plansLoading}
  selectingPlanCode={selectingPlanCode}
  error={planError}
  onClose={() => setPlanPopupOpen(false)}
  onSelectPlan={handleSelectPlan}
  onGoDashboard={() => navigate('/dashboard')}
/>
    </div>
  );
};

export default Documents;