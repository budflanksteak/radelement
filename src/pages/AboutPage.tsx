import { BookOpen, Database, Layers, Code, ExternalLink, Hash, ToggleLeft, Ruler, FileJson } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">About Radiology CDEs</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          ACR–RSNA Common Data Elements for standardized radiology reporting
        </p>
      </div>

      {/* What are CDEs */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen size={20} className="text-brand-600 dark:text-brand-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">What are Common Data Elements?</h2>
        </div>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          Common Data Elements (CDEs) are standardized sets of questions and allowable answers used to express observations in radiology reports.
          They provide structured, uniform ways to capture and communicate clinical findings, enabling better data interoperability, clinical decision support, and research.
        </p>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          Developed jointly by the ACR and RSNA, CDEs are organized as <strong className="text-slate-800 dark:text-slate-200">Sets</strong> that
          align with clinical scenarios (e.g., "CT Chest Pulmonary Nodule"), each containing <strong className="text-slate-800 dark:text-slate-200">Elements</strong> that
          capture individual features, and <strong className="text-slate-800 dark:text-slate-200">Values</strong> representing allowed answers.
        </p>
      </section>

      {/* Hierarchy */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers size={20} className="text-brand-600 dark:text-brand-400" />
          Three-Level Structure
        </h2>
        <div className="space-y-4">
          {[
            {
              id: 'RDES195',
              label: 'Set',
              icon: <Database size={18} />,
              color: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
              desc: 'A clinical scenario or finding context. ID format: RDES### (e.g., RDES195 = "CT Chest Pulmonary Nodule")',
            },
            {
              id: 'RDE1302',
              label: 'Element',
              icon: <Layers size={18} />,
              color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
              desc: 'An individual observable feature or measurement. ID format: RDE### (e.g., RDE1302 = "Size")',
            },
            {
              id: 'RDE1302.0',
              label: 'Value',
              icon: <Hash size={18} />,
              color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
              desc: 'An allowed response for a value-set element. Lower case matching RadLex terms.',
            },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                {item.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{item.label}</span>
                  <code className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-700">{item.id}</code>
                </div>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Element types */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Element Value Types</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: <ToggleLeft size={18} />, type: 'Value Set', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', desc: 'Enumerated pick list. Values in lower case. Supports single or multi-select via cardinality.' },
            { icon: <Hash size={18} />, type: 'Integer', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', desc: 'Whole number with optional min/max/step bounds and UCUM unit (e.g., count of ribs).' },
            { icon: <Ruler size={18} />, type: 'Float', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300', desc: 'Decimal measurement with optional bounds, step precision, and UCUM unit (e.g., mm, HU).' },
          ].map(t => (
            <div key={t.type} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium mb-2 ${t.color}`}>
                {t.icon} {t.type}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Schema */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileJson size={20} className="text-brand-600 dark:text-brand-400" />
          JSON Schema
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          CDEs conform to the ACR-RSNA JSON Schema (Draft-07). The canonical schema file is available on GitHub.
        </p>
        <pre className="rounded-xl bg-slate-900 p-4 text-xs text-green-400 overflow-x-auto">{`{
  "id": "RDES3",
  "name": "Adrenal Nodule",
  "schema_version": "1.0.0",
  "status": { "name": "Published", "date": "..." },
  "specialties": [{ "name": "GI Radiology", "abbreviation": "GI" }],
  "elements": [
    {
      "id": "RDE43",
      "name": "Unenhanced attenuation",
      "definition": "Mean HU on unenhanced CT...",
      "integer_value": { "min": -1024, "max": 1024, "unit": "HU" }
    },
    {
      "id": "RDE42",
      "name": "Side",
      "value_set": {
        "min_cardinality": 1,
        "max_cardinality": 1,
        "values": [
          { "value": "0", "name": "left", "code": "RDE42.0" },
          { "value": "1", "name": "right", "code": "RDE42.1" }
        ]
      }
    }
  ]
}`}</pre>
      </section>

      {/* API */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Code size={20} className="text-brand-600 dark:text-brand-400" />
          REST API
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Base URL: <code className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-700">https://api3.rsna.org/radelement/v1</code>
        </p>
        <div className="space-y-2">
          {[
            ['GET', '/sets', 'List all CDE sets'],
            ['GET', '/sets/{id}', 'Get full set detail (schema-compliant)'],
            ['GET', '/elements', 'List all elements'],
            ['GET', '/elements/{id}', 'Get element detail'],
            ['GET', '/codes', 'List coding systems (RADLEX, SNOMED, etc.)'],
          ].map(([method, path, desc]) => (
            <div key={path} className="flex items-center gap-3 text-sm">
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0">
                {method}
              </span>
              <code className="font-mono text-slate-700 dark:text-slate-300">{path}</code>
              <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">— {desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The API is public, read-only for browsing, and CORS-enabled for browser access.
        </p>
      </section>

      {/* Links */}
      <div className="flex flex-wrap gap-3">
        <a href="https://radelement.org" target="_blank" rel="noopener noreferrer">
          <Button variant="outline"><ExternalLink size={14} /> radelement.org</Button>
        </a>
        <a href="https://github.com/RSNA/ACR-RSNA-CDEs" target="_blank" rel="noopener noreferrer">
          <Button variant="outline"><ExternalLink size={14} /> JSON Schema on GitHub</Button>
        </a>
        <a href="https://rsna.github.io/ACR-RSNA-CDEs/" target="_blank" rel="noopener noreferrer">
          <Button variant="outline"><ExternalLink size={14} /> Authoring Guide</Button>
        </a>
        <Button onClick={() => navigate('/sets')}>Browse CDE Sets</Button>
      </div>
    </div>
  );
}
