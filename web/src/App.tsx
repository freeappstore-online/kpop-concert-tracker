import { useState, useEffect, useCallback } from "react";
import { Shell } from "./components/Shell";
import { initApp } from "@freeappstore/sdk";
import { useAuth } from "@freeappstore/sdk/hooks";

const fas = initApp({ appId: "kpop-concert-tracker" });

// ─── Types ────────────────────────────────────────────────────────────────────
interface Concert {
  id: string;
  name: string;
  date: string;
  time?: string;
  venue: string;
  city: string;
  country: string;
  countryCode: string;
  imageUrl?: string;
  ticketUrl?: string;
  artists: string[];
  status: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
}

interface Filters {
  country: string;
  month: string;
  artist: string;
}

type Tab = "All Concerts" | "Upcoming" | "Saved";

// ─── Countries list ───────────────────────────────────────────────────────────
const COUNTRIES = [
  { code: "", label: "🌍 All Countries" },
  { code: "US", label: "🇺🇸 United States" },
  { code: "KR", label: "🇰🇷 South Korea" },
  { code: "JP", label: "🇯🇵 Japan" },
  { code: "GB", label: "🇬🇧 United Kingdom" },
  { code: "DE", label: "🇩🇪 Germany" },
  { code: "FR", label: "🇫🇷 France" },
  { code: "AU", label: "🇦🇺 Australia" },
  { code: "CA", label: "🇨🇦 Canada" },
  { code: "MX", label: "🇲🇽 Mexico" },
  { code: "SG", label: "🇸🇬 Singapore" },
  { code: "TH", label: "🇹🇭 Thailand" },
  { code: "PH", label: "🇵🇭 Philippines" },
  { code: "ID", label: "🇮🇩 Indonesia" },
  { code: "MY", label: "🇲🇾 Malaysia" },
  { code: "BR", label: "🇧🇷 Brazil" },
  { code: "NL", label: "🇳🇱 Netherlands" },
  { code: "ES", label: "🇪🇸 Spain" },
  { code: "IT", label: "🇮🇹 Italy" },
  { code: "PL", label: "🇵🇱 Poland" },
];

const MONTHS = [
  { value: "", label: "All Months" },
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function formatDate(dateStr: string, timeStr?: string): string {
  const d = new Date(dateStr + (timeStr ? `T${timeStr}` : ""));
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(timeStr ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const concert = new Date(dateStr);
  return Math.ceil((concert.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ days }: { days: number }) {
  if (days < 0) return <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--line)", color: "var(--muted)" }}>Past</span>;
  if (days === 0) return <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "var(--error)", color: "#fff" }}>TODAY!</span>;
  if (days <= 7) return <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "var(--warning)", color: "#fff" }}>In {days}d</span>;
  if (days <= 30) return <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--success)", color: "#fff" }}>In {days}d</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--line)", color: "var(--muted)" }}>{days}d away</span>;
}

// ─── Concert Card ─────────────────────────────────────────────────────────────
function ConcertCard({
  concert,
  saved,
  onToggleSave,
}: {
  concert: Concert;
  saved: boolean;
  onToggleSave: (id: string) => void;
}) {
  const days = getDaysUntil(concert.date);

  return (
    <div
      className="rounded-2xl border overflow-hidden flex flex-col"
      style={{ borderColor: "var(--line)", background: "var(--paper)" }}
    >
      {concert.imageUrl && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={concert.imageUrl}
            alt={concert.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }}
          />
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
            <StatusBadge days={days} />
            <button
              onClick={() => onToggleSave(concert.id)}
              className="text-xl transition-transform hover:scale-110"
              title={saved ? "Remove from saved" : "Save concert"}
            >
              {saved ? "❤️" : "🤍"}
            </button>
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col gap-2 flex-1">
        {!concert.imageUrl && (
          <div className="flex justify-between items-start">
            <StatusBadge days={days} />
            <button
              onClick={() => onToggleSave(concert.id)}
              className="text-xl transition-transform hover:scale-110"
              title={saved ? "Remove from saved" : "Save concert"}
            >
              {saved ? "❤️" : "🤍"}
            </button>
          </div>
        )}

        <h3 className="font-bold text-base leading-tight" style={{ fontFamily: "Fraunces, serif" }}>
          {concert.name}
        </h3>

        {concert.artists.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {concert.artists.slice(0, 4).map((a) => (
              <span
                key={a}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "var(--panel)", color: "var(--accent)" }}
              >
                {a}
              </span>
            ))}
          </div>
        )}

        <div className="text-sm space-y-1" style={{ color: "var(--muted)" }}>
          <div className="flex items-center gap-1.5">
            <span>📅</span>
            <span>{formatDate(concert.date, concert.time)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>📍</span>
            <span>
              {concert.venue}, {concert.city}, {concert.country}
            </span>
          </div>
          {concert.priceMin !== undefined && (
            <div className="flex items-center gap-1.5">
              <span>🎟️</span>
              <span>
                From {concert.currency ?? "USD"} {concert.priceMin}
                {concert.priceMax ? ` – ${concert.priceMax}` : ""}
              </span>
            </div>
          )}
        </div>

        {concert.ticketUrl && (
          <a
            href={concert.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            🎟️ Get Tickets
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { user, loading: authLoading } = useAuth(fas);
  const [tab, setTab] = useState<Tab>("Upcoming");
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ country: "", month: "", artist: "" });
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("kpop_saved") ?? "[]"));
    } catch {
      return new Set();
    }
  });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState("");

  const fetchConcerts = useCallback(
    async (pageNum = 0) => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const startDate = now.toISOString().split(".")[0] + "Z";

        let url = `app.ticketmaster.com/discovery/v2/events.json?classificationName=K-Pop&size=20&page=${pageNum}&sort=date,asc&startDateTime=${encodeURIComponent(startDate)}`;

        if (filters.country) url += `&countryCode=${filters.country}`;
        if (filters.artist) url += `&keyword=${encodeURIComponent(filters.artist)}`;
        if (filters.month) {
          const year = now.getFullYear();
          const m = parseInt(filters.month);
          const start = new Date(year, m - 1, 1).toISOString().split(".")[0] + "Z";
          const end = new Date(year, m, 0, 23, 59, 59).toISOString().split(".")[0] + "Z";
          url += `&startDateTime=${encodeURIComponent(start)}&endDateTime=${encodeURIComponent(end)}`;
        }

        const res = await fas.proxy.fetch(url);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();

        const events: Concert[] = (data._embedded?.events ?? []).map((e: any) => {
          const venue = e._embedded?.venues?.[0];
          const artists: string[] = (e._embedded?.attractions ?? []).map((a: any) => a.name as string);
          const img = e.images?.find((i: any) => i.ratio === "16_9" && i.width > 500) ?? e.images?.[0];
          const price = e.priceRanges?.[0];
          return {
            id: e.id,
            name: e.name,
            date: e.dates?.start?.localDate ?? "",
            time: e.dates?.start?.localTime,
            venue: venue?.name ?? "TBA",
            city: venue?.city?.name ?? "TBA",
            country: venue?.country?.name ?? "TBA",
            countryCode: venue?.country?.countryCode ?? "",
            imageUrl: img?.url,
            ticketUrl: e.url,
            artists,
            status: e.dates?.status?.code ?? "onsale",
            priceMin: price?.min,
            priceMax: price?.max,
            currency: price?.currency,
          };
        });

        setConcerts(events);
        setTotalPages(data.page?.totalPages ?? 1);
        setPage(pageNum);
      } catch (err: any) {
        setError(err.message ?? "Failed to load concerts");
      } finally {
        setLoading(false);
      }
    },
    [user, filters]
  );

  useEffect(() => {
    if (user && tab !== "Saved") {
      fetchConcerts(0);
    }
  }, [user, filters, tab]);

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("kpop_saved", JSON.stringify([...next]));
      return next;
    });
  };

  const savedConcerts = concerts.filter((c) => savedIds.has(c.id));
  const displayedConcerts = tab === "Saved" ? savedConcerts : concerts;

  const navItems = [
    { icon: "🌐", label: "Upcoming" as Tab },
    { icon: "🔍", label: "All Concerts" as Tab },
    { icon: "❤️", label: "Saved" as Tab },
  ].map((item) => ({
    ...item,
    active: tab === item.label,
    onClick: () => setTab(item.label),
  }));

  return (
    <Shell navItems={navItems} activeTab={tab}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            {tab === "Saved" ? "❤️ Saved Concerts" : tab === "Upcoming" ? "🌟 Upcoming K-pop" : "🔍 All Concerts"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {tab === "Saved"
              ? `${savedIds.size} saved event${savedIds.size !== 1 ? "s" : ""}`
              : "Global K-pop concert listings powered by Ticketmaster"}
          </p>
        </div>

        {/* Sign-in gate */}
        {!authLoading && !user && (
          <div
            className="rounded-2xl border p-8 flex flex-col items-center gap-4 text-center"
            style={{ borderColor: "var(--line)", background: "var(--panel)" }}
          >
            <div className="text-5xl">🎤</div>
            <h2 className="text-xl font-bold" style={{ fontFamily: "Fraunces, serif" }}>
              Sign in to explore K-pop concerts
            </h2>
            <p style={{ color: "var(--muted)" }} className="text-sm max-w-sm">
              Access real-time concert listings worldwide. Sign in with GitHub — one tap, no passwords.
            </p>
            <button
              onClick={() => fas.auth.signIn()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-opacity hover:opacity-80"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Sign in with GitHub
            </button>
          </div>
        )}

        {/* Auth loading */}
        {authLoading && (
          <div className="flex justify-center py-20">
            <div className="text-4xl animate-spin">🎵</div>
          </div>
        )}

        {/* Main content */}
        {user && (
          <>
            {/* Filters */}
            {tab !== "Saved" && (
              <div
                className="rounded-2xl border p-4 mb-6 flex flex-col md:flex-row gap-3"
                style={{ borderColor: "var(--line)", background: "var(--panel)" }}
              >
                <input
                  type="text"
                  placeholder="🔍 Search artist (e.g. BTS, BLACKPINK…)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setFilters((f) => ({ ...f, artist: searchInput }));
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none border"
                  style={{
                    borderColor: "var(--line)",
                    background: "var(--paper)",
                    color: "var(--ink)",
                  }}
                />
                <select
                  value={filters.country}
                  onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
                  className="px-4 py-2.5 rounded-xl text-sm outline-none border"
                  style={{
                    borderColor: "var(--line)",
                    background: "var(--paper)",
                    color: "var(--ink)",
                  }}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}
                  className="px-4 py-2.5 rounded-xl text-sm outline-none border"
                  style={{
                    borderColor: "var(--line)",
                    background: "var(--paper)",
                    color: "var(--ink)",
                  }}
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setFilters((f) => ({ ...f, artist: searchInput }))}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  Search
                </button>
                {(filters.country || filters.month || filters.artist) && (
                  <button
                    onClick={() => {
                      setFilters({ country: "", month: "", artist: "" });
                      setSearchInput("");
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ background: "var(--line)", color: "var(--ink)" }}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="text-4xl animate-bounce">🎤</div>
                <p style={{ color: "var(--muted)" }}>Searching concerts worldwide…</p>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div
                className="rounded-2xl border p-6 flex flex-col items-center gap-3 text-center"
                style={{ borderColor: "var(--error)", background: "var(--panel)" }}
              >
                <div className="text-4xl">⚠️</div>
                <p className="font-semibold" style={{ color: "var(--error)" }}>
                  {error}
                </p>
                <button
                  onClick={() => fetchConcerts(0)}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && displayedConcerts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="text-5xl">{tab === "Saved" ? "🤍" : "🎵"}</div>
                <h3 className="text-lg font-bold" style={{ fontFamily: "Fraunces, serif" }}>
                  {tab === "Saved" ? "No saved concerts yet" : "No concerts found"}
                </h3>
                <p className="text-sm max-w-xs" style={{ color: "var(--muted)" }}>
                  {tab === "Saved"
                    ? "Tap the heart icon on any concert to save it here."
                    : "Try adjusting your filters or search for a different artist."}
                </p>
              </div>
            )}

            {/* Concert grid */}
            {!loading && !error && displayedConcerts.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedConcerts.map((concert) => (
                    <ConcertCard
                      key={concert.id}
                      concert={concert}
                      saved={savedIds.has(concert.id)}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {tab !== "Saved" && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8">
                    <button
                      disabled={page === 0}
                      onClick={() => fetchConcerts(page - 1)}
                      className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 transition-opacity hover:opacity-80"
                      style={{ background: "var(--panel)", color: "var(--ink)", border: "1px solid var(--line)" }}
                    >
                      ← Prev
                    </button>
                    <span className="text-sm" style={{ color: "var(--muted)" }}>
                      Page {page + 1} of {Math.min(totalPages, 10)}
                    </span>
                    <button
                      disabled={page >= Math.min(totalPages, 10) - 1}
                      onClick={() => fetchConcerts(page + 1)}
                      className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 transition-opacity hover:opacity-80"
                      style={{ background: "var(--panel)", color: "var(--ink)", border: "1px solid var(--line)" }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
