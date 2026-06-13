import {
  Activity,
  BarChart3,
  Crosshair,
  Database,
  Dumbbell,
  FileUp,
  Flame,
  ListTree,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { ComparePage } from "./pages/ComparePage";
import { CsvImportPage } from "./pages/CsvImportPage";
import { DataManagementPage } from "./pages/DataManagementPage";
import { DataQualityPage } from "./pages/DataQualityPage";
import { HeatmapPage } from "./pages/HeatmapPage";
import { PerformanceAnalyzer } from "./pages/PerformanceAnalyzer";
import { PracticeAnalysisPage } from "./pages/PracticeAnalysisPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TimelineViewerPage } from "./pages/TimelineViewerPage";

type Page =
  | "analyzer"
  | "compare"
  | "practice"
  | "import"
  | "dataManagement"
  | "dataQuality"
  | "timeline"
  | "heatmap"
  | "settings"
  | "reviewNotes"
  | "privacy"
  | "terms"
  | "disclaimer";

const pageItems: Array<{ id: Page; label: string; icon: typeof Activity }> = [
  { id: "analyzer", label: "Performance", icon: Activity },
  { id: "compare", label: "Compare", icon: BarChart3 },
  { id: "practice", label: "Practice", icon: Dumbbell },
  { id: "import", label: "Import", icon: FileUp },
  { id: "dataManagement", label: "Data Management", icon: Database },
  { id: "dataQuality", label: "Data Quality", icon: ShieldCheck },
  { id: "timeline", label: "Timeline Viewer", icon: ListTree },
  { id: "heatmap", label: "Heatmap", icon: Crosshair },
  { id: "settings", label: "Settings", icon: Settings },
];

const getPageTitle = (page: Page) => {
  if (page === "analyzer") return "Performance Analyzer";
  if (page === "compare") return "Compare";
  if (page === "practice") return "Practice Analysis";
  if (page === "import") return "CSV Import";
  if (page === "dataManagement") return "Data Management";
  if (page === "dataQuality") return "Data Quality";
  if (page === "timeline") return "Timeline Viewer";
  if (page === "heatmap") return "Heatmap";
  if (page === "reviewNotes") return "Riot Review Notes";
  if (page === "privacy") return "Privacy Policy";
  if (page === "terms") return "Terms of Service";
  if (page === "disclaimer") return "Disclaimer";
  return "Settings";
};

const reviewNotesPage: { id: Page; label: string } = { id: "reviewNotes", label: "Riot Review Notes" };

const legalPages: Array<{ id: Page; label: string }> = [
  { id: "privacy", label: "Privacy" },
  { id: "terms", label: "Terms" },
  { id: "disclaimer", label: "Disclaimer" },
];

function RiotReviewNotesPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const reviewNotes = [
    "This is a public review prototype.",
    "The demo uses mock/local placeholder data only.",
    "No production Riot API key is collected, entered, displayed, or stored in local demo storage.",
    "Real player data will require Riot Sign On / user consent in a future approved flow.",
    "The app does not provide live overlays.",
    "The app does not provide in-match assistance.",
    "The app does not provide opponent scouting.",
    "The app does not estimate MMR, ELO, Hidden Rating, True Rank, Matchmaking Rating, or rank prediction.",
    "Lens Score is a post-match self-analysis summary only, not a skill rating or rank replacement.",
    "VALORANT Lens is not endorsed by Riot Games.",
  ];

  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-6 shadow-2xl shadow-black/20">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-valorant-red">Public Demo QA</p>
      <h2 className="mt-2 text-2xl font-black text-white">Riot Review Notes</h2>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/65">
        This page summarizes the public mock-only demo boundaries for Riot review.
      </p>

      <ul className="mt-6 space-y-3 text-sm font-semibold leading-6 text-white/70">
        {reviewNotes.map((note) => (
          <li key={note} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-valorant-red" aria-hidden="true" />
            <span>{note}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">
        {legalPages.map((item) => (
          <button
            key={item.id}
            className="inline-flex h-10 items-center rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:border-valorant-red/50 hover:bg-valorant-red/10"
            type="button"
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function LegalPage({ page }: { page: Extract<Page, "privacy" | "terms" | "disclaimer"> }) {
  const content = {
    disclaimer: {
      body: [
        "VALORANT Lens is an independent post-match analysis prototype and is not endorsed by Riot Games.",
        "The public demo uses mock/local data only. It does not provide live overlays, in-match assistance, real-time recommendations, MMR/ELO calculations, hidden rating estimates, true rank estimates, or rank prediction.",
        "Lens Score is a post-match review aid for the user's own gameplay data and is not a Riot ranking or matchmaking value.",
      ],
      title: "Disclaimer",
    },
    privacy: {
      body: [
        "This public demo is mock-first and stores app settings, imported CSV data, sync mock state, and local preview data in browser demo storage only.",
        "No Riot credentials are collected, displayed, or stored by the app UI.",
        "No backend service, account authentication, analytics tracker, or external data upload is used in this phase.",
      ],
      title: "Privacy Policy",
    },
    terms: {
      body: [
        "Use this prototype only for post-match review and product evaluation.",
        "Do not use it for live match overlays, in-match assistance, automated gameplay decisions, or rank/MMR prediction.",
        "Riot account connection is planned for a future Riot Sign On flow and is disabled in this public demo.",
      ],
      title: "Terms of Service",
    },
  }[page];

  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-6 shadow-2xl shadow-black/20">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-valorant-red">Public Demo</p>
      <h2 className="mt-2 text-2xl font-black text-white">{content.title}</h2>
      <div className="mt-5 space-y-4 text-sm font-semibold leading-6 text-white/65">
        {content.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

function App() {
  const [page, setPage] = useState<Page>("analyzer");

  return (
    <div className="min-h-screen bg-valorant-deep text-valorant-text">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-white/10 bg-[#0b0d13] px-5 py-6 lg:block">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md border border-white/15 bg-white/[0.04] text-sm font-black tracking-normal text-white/75">
              L
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-white">Valorant</p>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Lens</p>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {pageItems.map((item) => {
              const Icon = item.icon;
              const active = page === item.id;

              return (
                <button
                  key={item.id}
                  className={`flex h-12 w-full items-center gap-3 rounded-md border px-3 text-left text-sm font-semibold transition ${
                    active
                      ? "border-valorant-red/70 bg-valorant-red/10 text-white shadow-glow"
                      : "border-transparent text-white/60 hover:border-white/10 hover:bg-white/5 hover:text-white"
                  }`}
                  type="button"
                  onClick={() => setPage(item.id)}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-6 left-5 right-5 border-t border-white/10 pt-5">
            <div className="flex items-center gap-3 text-sm text-white/60">
              <Flame className="h-4 w-4 text-valorant-red" aria-hidden="true" />
              <span>Public Demo / Mock Data</span>
            </div>
            <button
              className="mt-4 text-left text-xs font-black uppercase tracking-[0.12em] text-white/65 transition hover:text-white"
              type="button"
              onClick={() => setPage(reviewNotesPage.id)}
            >
              {reviewNotesPage.label}
            </button>
            <div className="mt-4 flex flex-wrap gap-2">
              {legalPages.map((item) => (
                <button
                  key={item.id}
                  className="text-xs font-bold text-white/45 transition hover:text-white"
                  type="button"
                  onClick={() => setPage(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 lg:pl-72">
          <div className="mx-auto max-w-[1500px] px-5 py-5 sm:px-7 lg:px-9 lg:py-8">
            <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-valorant-red">
                  Post-match Analytics
                </p>
                <h1 className="mt-2 text-2xl font-black tracking-normal text-white sm:text-3xl">
                  {getPageTitle(page)}
                </h1>
              </div>

              <div className="grid grid-cols-9 gap-2 rounded-md border border-white/10 bg-white/[0.03] p-1 lg:hidden">
                {pageItems.map((item) => {
                  const Icon = item.icon;
                  const active = page === item.id;

                  return (
                    <button
                      key={item.id}
                      className={`grid h-10 place-items-center rounded text-xs transition ${
                        active ? "bg-valorant-red text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                      type="button"
                      onClick={() => setPage(item.id)}
                      title={item.label}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </header>

            <section className="mb-6 rounded-lg border border-valorant-red/30 bg-valorant-red/10 p-4 text-sm font-semibold text-white/75">
              <p className="font-black text-white">Public Demo Mode: mock/local data only.</p>
              <p className="mt-1">
                No live overlays, in-match assistance, real-time recommendations, MMR/ELO calculations, hidden rating
                estimates, true rank estimates, or rank prediction. Lens Score is for post-match self review only.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  className="text-xs font-black uppercase tracking-[0.14em] text-white transition hover:text-valorant-red"
                  type="button"
                  onClick={() => setPage(reviewNotesPage.id)}
                >
                  {reviewNotesPage.label}
                </button>
                {legalPages.map((item) => (
                  <button
                    key={item.id}
                    className="text-xs font-black uppercase tracking-[0.14em] text-white transition hover:text-valorant-red"
                    type="button"
                    onClick={() => setPage(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            {page === "analyzer" && <PerformanceAnalyzer />}
            {page === "compare" && <ComparePage />}
            {page === "practice" && <PracticeAnalysisPage />}
            {page === "import" && <CsvImportPage />}
            {page === "dataManagement" && <DataManagementPage />}
            {page === "dataQuality" && <DataQualityPage />}
            {page === "timeline" && <TimelineViewerPage />}
            {page === "heatmap" && <HeatmapPage />}
            {page === "settings" && <SettingsPage />}
            {page === "reviewNotes" && <RiotReviewNotesPage onNavigate={setPage} />}
            {page === "privacy" && <LegalPage page="privacy" />}
            {page === "terms" && <LegalPage page="terms" />}
            {page === "disclaimer" && <LegalPage page="disclaimer" />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
