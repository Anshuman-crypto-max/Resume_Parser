import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Download,
  FileText,
  Filter,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  UploadCloud,
  Users
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, downloadExport } from "./api";
import type { AnalyticsSummary, Candidate, Match, User } from "./types";

type View = "dashboard" | "candidates" | "match";

const scoreColor = (score: number) => {
  if (score >= 80) return "bg-emerald-600";
  if (score >= 60) return "bg-lime-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-rose-500";
};

export function App() {
  const [token, setToken] = useState(localStorage.getItem("token") ?? "");
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [view, setView] = useState<View>("dashboard");

  if (!token || !user) {
    return <Login onLogin={(nextToken, nextUser) => {
      localStorage.setItem("token", nextToken);
      localStorage.setItem("user", JSON.stringify(nextUser));
      setToken(nextToken);
      setUser(nextUser);
    }} />;
  }

  return (
    <div className="min-h-screen bg-[#f6faf8]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-emerald-100 bg-white px-4 py-5 lg:block">
        <div className="flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-600 text-white">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-950">HireSignal</p>
            <p className="text-xs text-slate-500">AI Resume Parser</p>
          </div>
        </div>
        <nav className="mt-8 space-y-1">
          <NavButton icon={<LayoutDashboard size={18} />} active={view === "dashboard"} onClick={() => setView("dashboard")}>Analytics</NavButton>
          <NavButton icon={<Users size={18} />} active={view === "candidates"} onClick={() => setView("candidates")}>Candidates</NavButton>
          <NavButton icon={<BriefcaseBusiness size={18} />} active={view === "match"} onClick={() => setView("match")}>JD Matching</NavButton>
        </nav>
      </aside>

      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-emerald-100 bg-white/95 px-4 py-3 backdrop-blur md:px-8">
          <div>
            <h1 className="text-xl font-semibold text-emerald-950">Talent Intelligence</h1>
            <p className="text-sm text-slate-500">{user.full_name} · {user.role}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-md border border-emerald-200 p-2 text-emerald-700 lg:hidden" onClick={() => setView("dashboard")} title="Analytics"><BarChart3 size={18} /></button>
            <button className="rounded-md border border-emerald-200 p-2 text-emerald-700 lg:hidden" onClick={() => setView("candidates")} title="Candidates"><Users size={18} /></button>
            <button className="rounded-md border border-emerald-200 p-2 text-emerald-700 lg:hidden" onClick={() => setView("match")} title="JD Matching"><BriefcaseBusiness size={18} /></button>
            <button
              className="rounded-md border border-slate-200 p-2 text-slate-600"
              title="Sign out"
              onClick={() => {
                localStorage.clear();
                setToken("");
                setUser(null);
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <div className="p-4 md:p-8">
          {view === "dashboard" && <Analytics />}
          {view === "candidates" && <Candidates user={user} />}
          {view === "match" && <JobMatcher />}
        </div>
      </main>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (token: string, user: User) => void }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      onLogin(data.access_token, data.user);
    } catch {
      setError("Invalid email or password");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#f6faf8] px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand-600 text-white"><ShieldCheck /></div>
          <div>
            <h1 className="text-lg font-semibold text-emerald-950">HireSignal</h1>
            <p className="text-sm text-slate-500">Recruiting command center</p>
          </div>
        </div>
        <label className="text-sm font-medium text-slate-700">Email</label>
        <input className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-brand-500" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="mt-4 block text-sm font-medium text-slate-700">Password</label>
        <input className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-brand-500" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        <button className="mt-5 w-full rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700">Sign in</button>
      </form>
    </div>
  );
}

function NavButton({ children, icon, active, onClick }: { children: ReactNode; icon: ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"}`}>
      {icon}{children}
    </button>
  );
}

function Analytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    api.get("/analytics/summary").then(({ data }) => setSummary(data));
  }, []);

  if (!summary) return <Panel>Loading analytics...</Panel>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Candidates" value={summary.total_candidates} icon={<Users />} />
        <Metric title="Average score" value={summary.average_score} icon={<BarChart3 />} />
        <Metric title="Top skills tracked" value={summary.top_skills.length} icon={<Filter />} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <h2 className="mb-4 font-semibold text-emerald-950">Score Distribution</h2>
          <Chart data={summary.score_buckets} color="#1fa463" />
        </Panel>
        <Panel>
          <h2 className="mb-4 font-semibold text-emerald-950">Top Skills</h2>
          <Chart data={summary.top_skills} color="#168854" />
        </Panel>
      </div>
      <Panel>
        <h2 className="mb-4 font-semibold text-emerald-950">Recent Candidates</h2>
        <CandidateTable candidates={summary.recent_candidates} />
      </Panel>
    </div>
  );
}

function Candidates({ user }: { user: User }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("");
  const [minScore, setMinScore] = useState("0");
  const [uploading, setUploading] = useState(false);

  const params = useMemo(() => ({ search: query, skill, min_score: minScore }), [query, skill, minScore]);

  function load() {
    api.get("/candidates", { params }).then(({ data }) => {
      setCandidates(data.items);
      setTotal(data.total);
    });
  }

  useEffect(load, [params]);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    await api.post("/candidates/upload", form);
    setUploading(false);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-lg font-semibold text-emerald-950">Candidates</h2>
          <p className="text-sm text-slate-500">{total} parsed profiles</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => downloadExport("/export/candidates.csv", "candidates.csv")} className="inline-flex items-center gap-2 rounded-md border border-emerald-200 px-3 py-2 text-sm text-emerald-700"><Download size={16} />CSV</button>
          <button onClick={() => downloadExport("/export/candidates.pdf", "candidates.pdf")} className="inline-flex items-center gap-2 rounded-md border border-emerald-200 px-3 py-2 text-sm text-emerald-700"><Download size={16} />PDF</button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white">
            <UploadCloud size={16} />{uploading ? "Parsing..." : "Upload"}
            <input className="hidden" type="file" accept=".pdf,.docx" onChange={(e) => upload(e.target.files?.[0])} />
          </label>
        </div>
      </div>
      <Panel>
        <div className="grid gap-3 md:grid-cols-[1fr_220px_160px]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input className="w-full rounded-md border border-slate-200 py-2 pl-10 pr-3 outline-none focus:border-brand-500" placeholder="Search by name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <input className="rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-brand-500" placeholder="Skill filter" value={skill} onChange={(e) => setSkill(e.target.value)} />
          <select className="rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-brand-500" value={minScore} onChange={(e) => setMinScore(e.target.value)}>
            <option value="0">All scores</option>
            <option value="60">60+</option>
            <option value="80">80+</option>
          </select>
        </div>
      </Panel>
      <Panel>
        <CandidateTable candidates={candidates} canDelete={user.role === "admin"} onDeleted={load} />
      </Panel>
    </div>
  );
}

function JobMatcher() {
  const [title, setTitle] = useState("Senior React Engineer");
  const [skills, setSkills] = useState("React, TypeScript, REST API, PostgreSQL");
  const [description, setDescription] = useState("Build modern HR workflows, integrate APIs, and own frontend quality.");
  const [matches, setMatches] = useState<Match[]>([]);

  async function rank(event: FormEvent) {
    event.preventDefault();
    const { data: job } = await api.post("/jobs", {
      title,
      description,
      required_skills: skills.split(",").map((item) => item.trim()).filter(Boolean)
    });
    const { data } = await api.get(`/jobs/${job.id}/rankings`);
    setMatches(data);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <Panel>
    <form onSubmit={rank} className="space-y-4">
          <h2 className="font-semibold text-emerald-950">Job Description Matching</h2>
          <input className="w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-brand-500" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-brand-500" value={skills} onChange={(e) => setSkills(e.target.value)} />
          <textarea className="min-h-40 w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-brand-500" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 font-medium text-white"><BriefcaseBusiness size={17} />Rank Candidates</button>
        </form>
      </Panel>
      <Panel>
        <h2 className="mb-4 font-semibold text-emerald-950">Ranked Results</h2>
        <div className="space-y-3">
          {matches.map((match) => (
            <div key={match.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{match.candidate.name}</p>
                  <p className="text-sm text-slate-500">{match.rationale}</p>
                </div>
                <span className="rounded-md bg-brand-50 px-3 py-1 font-semibold text-brand-700">{match.match_score}%</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">Matched: {match.matched_skills.join(", ") || "None"}</p>
            </div>
          ))}
          {!matches.length && <p className="text-sm text-slate-500">Run a match to rank candidates.</p>}
        </div>
      </Panel>
    </div>
  );
}

function CandidateTable({ candidates, canDelete, onDeleted }: { candidates: Candidate[]; canDelete?: boolean; onDeleted?: () => void }) {
  async function remove(id: number) {
    await api.delete(`/candidates/${id}`);
    onDeleted?.();
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
          <tr>
            <th className="py-3">Candidate</th>
            <th>Location</th>
            <th>Skills</th>
            <th>Score</th>
            <th>Source</th>
            {canDelete && <th></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {candidates.map((candidate) => (
            <tr key={candidate.id}>
              <td className="py-3">
                <p className="font-medium text-slate-900">{candidate.name}</p>
                <p className="text-slate-500">{candidate.email || candidate.phone || "No contact"}</p>
              </td>
              <td>{candidate.location || "Unknown"}</td>
              <td>
                <div className="flex max-w-md flex-wrap gap-1">
                  {candidate.skills.slice(0, 5).map((skill) => <span className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700" key={skill}>{skill}</span>)}
                </div>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${scoreColor(candidate.score)}`} />
                  {candidate.score}
                </div>
              </td>
              <td className="text-slate-500"><FileText size={15} className="mr-1 inline" />{candidate.source_filename}</td>
              {canDelete && <td><button onClick={() => remove(candidate.id)} className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600">Delete</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
      {!candidates.length && <p className="py-8 text-center text-sm text-slate-500">No candidates found.</p>}
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <section className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm">{children}</section>;
}

function Metric({ title, value, icon }: { title: string; value: string | number; icon: ReactNode }) {
  return (
    <Panel>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-950">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-50 text-brand-700">{icon}</div>
      </div>
    </Panel>
  );
}

function Chart({ data, color }: { data: { name?: string; label?: string; count: number }[]; color: string }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={(item) => item.name ?? item.label} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => <Cell key={index} fill={color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
