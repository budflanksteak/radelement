import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Database, Layers, BookOpen, ArrowRight, TrendingUp, Shield, Zap, Globe } from 'lucide-react';
import { fetchSets } from '../api/radelement';
import { CDESetSummary, getStatusName } from '../types/cde';
import { SetCard } from '../components/cde/SetCard';
import { Button } from '../components/ui/Button';
import { SPECIALTIES } from '../data/mockData';

const SPECIALTY_ICONS: Record<string, string> = {
  NR: '🧠', CH: '🫁', AB: '🫀', GI: '🔬', MK: '🦴',
  OI: '💗', ER: '🚨', GU: '⚕️', PD: '👶', HN: '👁️',
};

export function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sets, setSets] = useState<CDESetSummary[]>([]);
  const [stats, setStats] = useState({ total: 0, published: 0, elements: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSets({ limit: 100 })
      .then(data => {
        const list = (data as CDESetSummary[]);
        setSets(list);
        const published = list.filter(s => getStatusName(s.status as any) === 'Published');
        const totalEls = list.reduce((sum, s) => sum + ((s as any).elementCount || 0), 0);
        setStats({ total: list.length, published: published.length, elements: totalEls });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/sets?q=${encodeURIComponent(search.trim())}`);
  };

  const featured = sets
    .filter(s => getStatusName(s.status as any) === 'Published')
    .slice(0, 6);

  // Get specialty distribution from sets
  const specialtyMap: Record<string, number> = {};
  sets.forEach(s => {
    s.specialties?.forEach(sp => {
      specialtyMap[sp.code] = (specialtyMap[sp.code] || 0) + 1;
    });
  });
  const topSpecialties = SPECIALTIES
    .filter(sp => specialtyMap[sp.abbreviation] > 0)
    .sort((a, b) => (specialtyMap[b.abbreviation] || 0) - (specialtyMap[a.abbreviation] || 0))
    .slice(0, 12);

  return (
    <div className="space-y-12 pb-12">
      {/* Hero */}
      <section className="relative -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 overflow-hidden rounded-b-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-teal-600 px-6 py-16 sm:py-20 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_40%,white,transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur mb-6">
            <Shield size={14} />
            ACR–RSNA Common Data Elements
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Standardized Radiology<br />
            <span className="text-teal-300">Data Elements</span>
          </h1>
          <p className="mt-4 text-lg text-blue-100 leading-relaxed max-w-xl mx-auto">
            Browse, author, and review standardized sets of radiology observations for consistent structured reporting.
          </p>

          <form onSubmit={handleSearch} className="mt-8 flex gap-2 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search CDE sets by name or specialty…"
                className="w-full rounded-xl border-0 bg-white py-3 pl-12 pr-4 text-slate-900 shadow-lg outline-none focus:ring-2 focus:ring-white/50 text-sm"
              />
            </div>
            <Button type="submit" variant="secondary" className="rounded-xl px-6 bg-teal-500 text-white hover:bg-teal-400 border-0">
              Search
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-blue-200">
            <button onClick={() => navigate('/sets?status=Published')} className="hover:text-white transition-colors">
              Browse published sets →
            </button>
            <span className="text-blue-400">·</span>
            <button onClick={() => navigate('/elements')} className="hover:text-white transition-colors">
              Browse elements →
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total CDE Sets', value: loading ? '…' : stats.total.toLocaleString(), icon: <Database size={20} />, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:text-brand-400' },
          { label: 'Published Sets', value: loading ? '…' : stats.published.toLocaleString(), icon: <Shield size={20} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
          { label: 'Specialties', value: topSpecialties.length.toString(), icon: <Globe size={20} />, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400' },
          { label: 'Growing', value: 'Since 2016', icon: <TrendingUp size={20} />, color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Featured sets */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Published CDE Sets</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Peer-reviewed and ready for clinical use</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/sets?status=Published')}>
            View all <ArrowRight size={14} />
          </Button>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 rounded-xl border border-slate-200 bg-slate-100 animate-pulse dark:border-slate-700 dark:bg-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map(set => (
              <SetCard key={set.id} set={set} />
            ))}
          </div>
        )}
      </section>

      {/* Browse by specialty */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Browse by Specialty</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Find data elements for your subspecialty</p>
          </div>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {topSpecialties.map(sp => (
            <button
              key={sp.abbreviation}
              onClick={() => navigate(`/sets?specialty=${sp.abbreviation}`)}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition-all hover:border-brand-300 hover:shadow-sm hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-600"
            >
              <span className="text-2xl">{SPECIALTY_ICONS[sp.abbreviation] || '🔬'}</span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">{sp.name}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{specialtyMap[sp.abbreviation]} sets</span>
            </button>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-8 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Platform Features</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <Database size={20} />,
              title: 'Browse & Search',
              desc: 'Search the complete RadElement repository by name, specialty, modality, or ontology code.',
              color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
            },
            {
              icon: <Zap size={20} />,
              title: 'Author CDE Sets',
              desc: 'Create new CDE sets with the full schema editor — elements, value sets, ontology codes, and references.',
              color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
            },
            {
              icon: <BookOpen size={20} />,
              title: 'Peer Review',
              desc: 'Submit drafts for community review. Leave inline comments on specific elements and resolve feedback.',
              color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
            },
          ].map(f => (
            <div key={f.title} className="flex gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${f.color}`}>
                {f.icon}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-4">
          <Button onClick={() => navigate('/sets')}>
            Browse Sets <ArrowRight size={14} />
          </Button>
          <Button variant="outline" onClick={() => navigate('/about')}>
            Learn about CDEs
          </Button>
        </div>
      </section>
    </div>
  );
}
