import { Link, useLocation, useNavigate } from "react-router-dom";
import { Plus, ChevronDown, Download, FileSpreadsheet, Share2, X, Copy, Search, Filter, SlidersHorizontal, ChevronRight, RotateCcw, LayoutList, LayoutGrid, TrendingUp, TrendingDown, Zap, Activity, CheckCircle2, Target } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useRef, useEffect } from "react";
import { useApp, ALLOWED_CATEGORIES } from "../contexts/AppContext";
import { Editable } from "../components/Editable";
import Papa from "papaparse";
import { getRecencyMap, getRelativeTime } from "../utils/recency";

/* ── EXACT colours from standalone HTML :root ──────────────────── */
const INK        = "#0c0d0e";
const INK_SOFT   = "#494d52";
const INK_FAINT  = "#737a82";
const ACCENT     = "#1c3f63";
const LINE       = "#e5e7ea";
const LINE_STRONG= "#d3d7db";
const COST       = "#a32c1c";
const PANEL      = "#f5f6f7";
const SURFACE    = "#ffffff";

/* ── EXACT fonts from :root ─────────────────────────────────────── */
const FONT_DISPLAY = "'Archivo', system-ui, sans-serif";
const FONT_MONO    = "'IBM Plex Mono', monospace";

/* ── Shared horizontal padding (responsive) ─────────────────────── */
const PX = "px-4 sm:px-6 md:px-[5vw] lg:px-[5vw]";

/* ── Default data seeds (from standalone HTML window.* globals) ── */
const DEFAULT_HEADLINES = [
  { id: "h1", v: "12",    k: "problems found & solved" },
  { id: "h2", v: "7",     k: "areas of the business"   },
  { id: "h3", v: "62%",   k: "biggest cycle-time cut"  },
  { id: "h4", v: "3d→2h", k: "fastest turnaround win"  },
];
const DEFAULT_METHOD = [
  { id: "m1", n: "01", t: "Watch the signals",      d: "Anomalies, repeat complaints, the spreadsheet everyone secretly relies on. Problems announce themselves before they hit a dashboard." },
  { id: "m2", n: "02", t: "Quantify the bleed",     d: "Turn the symptom into a number — rupees, percentage points, hours. If it can't be sized, it can't be prioritized." },
  { id: "m3", n: "03", t: "Frame the real problem", d: "Separate the symptom from the root cause. The obvious problem is rarely the expensive one underneath it." },
  { id: "m4", n: "04", t: "Ship the smallest fix",  d: "Design the minimal change that stops the bleed and proves the thesis — then scale what works." },
];

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, updateData, isEditing } = useApp();
  const { hero, nodes, specs } = data;
  const d = data as any;
  const recencyMap = getRecencyMap(nodes);

  const headlines: typeof DEFAULT_HEADLINES = d.headlines ?? DEFAULT_HEADLINES;
  const method: typeof DEFAULT_METHOD       = d.method    ?? DEFAULT_METHOD;

  const [catFilter, setCatFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [shareModalNode, setShareModalNode] = useState<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [cardViewMode, setCardViewMode] = useState<'compact' | 'detailed'>('compact');
  const casebookRef = useRef<HTMLElement>(null);
  const methodRef   = useRef<HTMLElement>(null);

  // Auto-redirect deep links using query params (?node=... or ?protocol=...) or hash (#...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(location.search);
    const targetId = searchParams.get('node') || searchParams.get('protocol') || searchParams.get('id');
    const hashId = location.hash ? location.hash.replace('#', '').replace('node-', '') : null;
    const deepId = targetId || hashId;

    if (deepId) {
      navigate(`/protocol/${encodeURIComponent(deepId)}`, { replace: true });
    }
  }, [location, navigate]);

  const handleShareNode = (e: React.MouseEvent, node: any) => {
    e.preventDefault();
    e.stopPropagation();
    setShareModalNode(node);
  };

  const getShareUrl = (node: any) => {
    if (!node) return window.location.href;
    return `${window.location.origin}/protocol/${encodeURIComponent(node.id)}`;
  };

  const getShareText = (node: any) => {
    if (!node) return "Check out this protocol";
    const headerId = node.content?.headerId ? `[${node.content.headerId}] ` : '';
    return `Check out this protocol: ${headerId}${node.title}`;
  };

  /* unique categories */
  const allCats: string[] = [
    "ALL",
    ...ALLOWED_CATEGORIES
  ];

  const toggleNodeExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredNodes = (nodes || []).filter((n: any) => {
    const matchesCat = catFilter === "ALL" || (n.content?.productBucket || "").trim() === catFilter;
    if (!matchesCat) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase().trim();
    const title = (n.title || "").toLowerCase();
    const desc = (n.description || "").toLowerCase();
    const bucket = (n.content?.productBucket || "").toLowerCase();
    const headerId = (n.content?.headerId || "").toLowerCase();
    const scope = (n.content?.scope || "").toLowerCase();
    const stat1 = (n.content?.stat1Desc || "").toLowerCase();
    const stat2 = (n.content?.stat2Desc || "").toLowerCase();
    const stat3 = (n.content?.stat3Desc || "").toLowerCase();
    const stat4 = (n.content?.stat4Desc || "").toLowerCase();

    return title.includes(q) || desc.includes(q) || bucket.includes(q) || 
           headerId.includes(q) || scope.includes(q) || stat1.includes(q) || 
           stat2.includes(q) || stat3.includes(q) || stat4.includes(q);
  });

  /* animation */
  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
  const fadeUp  = {
    hidden: { opacity: 0, y: 18 },
    show:   { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 26 } },
  };

  /* helpers for nested data updates */
  const updH = (fn: (h: typeof DEFAULT_HEADLINES) => typeof DEFAULT_HEADLINES) =>
    updateData((p: any) => ({ ...p, headlines: fn(p.headlines ?? DEFAULT_HEADLINES) }));
  const updM = (fn: (m: typeof DEFAULT_METHOD) => typeof DEFAULT_METHOD) =>
    updateData((p: any) => ({ ...p, method: fn(p.method ?? DEFAULT_METHOD) }));

  const handleExportDashboard = () => {
    const rows: { section: string, key: string, value: string }[] = [];
    
    // Hero
    Object.entries(data.hero || {}).forEach(([k, v]) => {
      rows.push({ section: 'hero', key: k, value: String(v) });
    });

    // Headlines
    (d.headlines || DEFAULT_HEADLINES).forEach((h: any, i: number) => {
      rows.push({ section: `headlines[${i}]`, key: 'v', value: h.v });
      rows.push({ section: `headlines[${i}]`, key: 'k', value: h.k });
      rows.push({ section: `headlines[${i}]`, key: 'id', value: h.id });
    });

    // Method
    rows.push({ section: 'dashboard', key: 'methodHeading', value: d.methodHeading || '' });
    rows.push({ section: 'dashboard', key: 'methodCadence', value: d.methodCadence || '' });
    (d.method || DEFAULT_METHOD).forEach((m: any, i: number) => {
      rows.push({ section: `method[${i}]`, key: 'n', value: m.n });
      rows.push({ section: `method[${i}]`, key: 't', value: m.t });
      rows.push({ section: `method[${i}]`, key: 'd', value: m.d });
      rows.push({ section: `method[${i}]`, key: 'id', value: m.id });
    });

    // Specs
    (specs || []).forEach((s: any, i: number) => {
      rows.push({ section: `specs[${i}]`, key: 'label', value: s.label });
      rows.push({ section: `specs[${i}]`, key: 'value', value: String(s.value) });
      rows.push({ section: `specs[${i}]`, key: 'id', value: s.id });
    });

    // Labels
    Object.entries(data.navLabels || {}).forEach(([k, v]) => {
      rows.push({ section: 'navLabels', key: k, value: String(v) });
    });

    // Protocols (Nodes)
    (d.nodes || []).forEach((node: any, i: number) => {
      // We need flattenNode here too, or just inline the logic
      rows.push({ section: `nodes[${i}]`, key: 'id', value: node.id || '' });
      rows.push({ section: `nodes[${i}]`, key: 'date', value: node.date || '' });
      rows.push({ section: `nodes[${i}]`, key: 'title', value: node.title || '' });
      rows.push({ section: `nodes[${i}]`, key: 'description', value: node.description || '' });
      rows.push({ section: `nodes[${i}]`, key: 'assets.videoUrl', value: node.assets?.videoUrl || '' });
      rows.push({ section: `nodes[${i}]`, key: 'assets.videoDuration', value: node.assets?.videoDuration || '' });
      rows.push({ section: `nodes[${i}]`, key: 'assets.deckUrl', value: node.assets?.deckUrl || '' });
      rows.push({ section: `nodes[${i}]`, key: 'assets.deckSize', value: node.assets?.deckSize || '' });
      rows.push({ section: `nodes[${i}]`, key: 'assets.deckText', value: node.assets?.deckText || '' });
      rows.push({ section: `nodes[${i}]`, key: 'assets.bgImageUrl', value: node.assets?.bgImageUrl || '' });
      rows.push({ section: `nodes[${i}]`, key: 'assets.systemFlowUrl', value: node.assets?.systemFlowUrl || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.role', value: node.content?.role || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.scope', value: node.content?.scope || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.status', value: node.content?.status || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.headerId', value: node.content?.headerId || '' });
      
      const defaultLbls = ['', 'THE SIGNAL', 'THE COST', 'THE FIX', 'THE RETURN'];
      
      rows.push({ section: `nodes[${i}]`, key: 'content.stat1Val', value: node.content?.stat1Val || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.stat1Lbl', value: node.content?.stat1Lbl || defaultLbls[1] });
      rows.push({ section: `nodes[${i}]`, key: 'content.stat1Desc', value: node.content?.stat1Desc || '' });
      
      rows.push({ section: `nodes[${i}]`, key: 'content.stat2Val', value: node.content?.stat2Val || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.stat2Lbl', value: node.content?.stat2Lbl || defaultLbls[2] });
      rows.push({ section: `nodes[${i}]`, key: 'content.stat2Desc', value: node.content?.stat2Desc || '' });
      
      rows.push({ section: `nodes[${i}]`, key: 'content.stat3Val', value: node.content?.stat3Val || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.stat3Lbl', value: node.content?.stat3Lbl || defaultLbls[3] });
      rows.push({ section: `nodes[${i}]`, key: 'content.stat3Desc', value: node.content?.stat3Desc || '' });
      
      rows.push({ section: `nodes[${i}]`, key: 'content.stat4Val', value: node.content?.stat4Val || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.stat4Lbl', value: node.content?.stat4Lbl || defaultLbls[4] });
      rows.push({ section: `nodes[${i}]`, key: 'content.stat4Desc', value: node.content?.stat4Desc || '' });

      rows.push({ section: `nodes[${i}]`, key: 'content.problem', value: node.content?.problem || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.solutions', value: node.content?.solutions || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.impact', value: node.content?.impact || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.railMetricVal', value: node.content?.railMetricVal || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.railMetricLbl', value: node.content?.railMetricLbl || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.productBucket', value: node.content?.productBucket || '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.scope', value: node.content?.scope || '' });
      // Complex ones
      rows.push({ section: `nodes[${i}]`, key: 'content.solutionFlow', value: node.content?.solutionFlow ? JSON.stringify(node.content.solutionFlow) : '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.systemFlow', value: node.content?.systemFlow ? JSON.stringify(node.content.systemFlow) : '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.impactTiles', value: node.content?.impactTiles ? JSON.stringify(node.content.impactTiles) : '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.audiences', value: node.content?.audiences ? JSON.stringify(node.content.audiences) : '' });
      rows.push({ section: `nodes[${i}]`, key: 'content.buckets', value: node.content?.buckets ? JSON.stringify(node.content.buckets) : '' });
    });

    rows.push({ section: 'dashboard', key: 'casebookTitle', value: d.casebookTitle || '' });
    rows.push({ section: 'dashboard', key: 'casebookSub', value: d.casebookSub || '' });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard_full_backup.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col flex-1 w-full min-w-0 overflow-x-hidden pb-20 md:pb-0"
      style={{ background: SURFACE, color: INK, fontFamily: FONT_DISPLAY }}
    >

      {/* ══ NAV ═══════════════════════════════════════════════════════ */}
      <header
        className={`sticky top-0 z-20 flex items-center justify-between gap-4 ${PX} border-b`}
        style={{ borderColor: LINE_STRONG, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", padding: "10px clamp(15px,4vw,60px)" }}
      >
        <a href="#" className="flex items-center gap-2.5 text-inherit no-underline">
          <div className="w-8 h-8 md:w-9 md:h-9 grid place-items-center flex-none rounded-none"
               style={{ background: INK, color: "#fff", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, letterSpacing: "0.02em" }}>
            AM
          </div>
          <div className="flex flex-col leading-tight">
            <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "-0.01em" }}>Anshul Maheshwari</span>
            <span className="hidden sm:block" style={{ fontFamily: FONT_MONO, fontSize: 10, color: INK_FAINT, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Problem Solver
            </span>
          </div>
        </a>
        <nav className="flex items-center gap-3 md:gap-7">
          <button onClick={() => methodRef.current?.scrollIntoView({ behavior: "smooth" })}
            style={{ fontFamily: FONT_DISPLAY, fontSize: 12, fontWeight: 500, color: INK_SOFT, background: "none", border: "none", cursor: "pointer" }}
            className="hover:text-[#0c0d0e] transition-colors hidden xs:block">Method</button>
          <button onClick={() => casebookRef.current?.scrollIntoView({ behavior: "smooth" })}
            style={{ fontFamily: FONT_DISPLAY, fontSize: 12, fontWeight: 600, color: "#fff", background: INK, padding: "7px 12px md:padding: 8px 14px", border: "none", cursor: "pointer" }}
            className="hover:bg-[#1c3f63] transition-colors text-[11.5px] md:text-[12.5px]">Casebook</button>
        </nav>
      </header>

      {/* ══ TICKER ════════════════════════════════════════════════════ */}
      <div className="overflow-hidden whitespace-nowrap shrink-0" style={{ background: INK }}>
        <div className="py-1.5" style={{ fontFamily: FONT_MONO, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.6)" }}>
          {[0, 1].map(k => (
            <span key={k} className={`inline-block ${k === 1 ? "ml-6" : ""} animate-marquee`}>
              SYSTEM_UPTIME: 99.9% // NODES_ACTIVE: {(nodes || []).length} // LAST_SYNC: {new Date().toLocaleTimeString()} // PROTOCOL_VERSION: 2.1.0 //&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section className="border-b" style={{ borderColor: LINE_STRONG, padding: "clamp(48px,7vw,92px) clamp(20px,5vw,80px) 0" }}>

        {/* Availability status */}
        <div className="flex items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-2.5"
               style={{ fontFamily: FONT_MONO, fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: INK_SOFT }}>
            <span className="relative flex-none w-[7px] h-[7px] rounded-full" style={{ background: ACCENT }}>
              <span className="absolute inset-[-4px] rounded-full border animate-ping" style={{ borderColor: ACCENT, animationDuration: "2.4s" }} />
            </span>
            <Editable value={hero.terminal1 || "Taking on one problem a week"}
              onChange={v => updateData(p => ({ ...p, hero: { ...p.hero, terminal1: v } }))} />
          </div>

          {isEditing && (
            <button 
              onClick={handleExportDashboard}
              className="flex items-center gap-2 px-3 py-1.5 border hover:border-primary transition-all active:scale-95 group"
              style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: INK_FAINT, borderColor: LINE_STRONG, background: SURFACE }}
              title="Download Dashboard Content CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
              <span className="group-hover:text-primary transition-colors">EXPORT_DASH_CSV</span>
            </button>
          )}
        </div>

        <div className="mb-6 md:mb-7 pb-3 md:pb-4 border-b flex-none" style={{ borderColor: LINE, display: "inline-block" }}>
          <span className="font-mono text-[11px] md:text-[12px] uppercase tracking-[0.15em]" style={{ color: INK_FAINT }}>
            <Editable value={hero.terminal2 || "Product & Business Problem Solver"}
              onChange={v => updateData(p => ({ ...p, hero: { ...p.hero, terminal2: v } }))} />
          </span>
        </div>

        {/* Thesis — giant Archivo, name + role stacked */}
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.0 }}>
          <motion.span
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="block break-words" style={{ fontSize: "clamp(18px, 7.5vw, 66px)", color: INK, lineHeight: 1.15 }}
          >
            <Editable value={hero.name} onChange={v => updateData(p => ({ ...p, hero: { ...p.hero, name: v } }))} />
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="block break-words" style={{ fontSize: "clamp(14px, 5.5vw, 54px)", color: ACCENT, lineHeight: 1.15, marginTop: "6px" }}
          >
            <Editable value={hero.role} onChange={v => updateData(p => ({ ...p, hero: { ...p.hero, role: v } }))} />
          </motion.span>
        </h1>

        {/* Pitch */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-7 mb-9"
          style={{ maxWidth: "58ch", fontSize: "clamp(16px,1.6vw,19px)", color: INK_SOFT, lineHeight: 1.55 }}
        >
          <Editable value={hero.desc} onChange={v => updateData(p => ({ ...p, hero: { ...p.hero, desc: v } }))} />
        </motion.p>

        {/* CTA buttons */}
        <motion.div className="flex flex-wrap gap-3 mb-14 md:mb-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <button
            onClick={() => casebookRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-2 transition-colors hover:bg-[#1c3f63]"
            style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, padding: "13px 22px", background: INK, color: "#fff", border: "1px solid transparent", cursor: "pointer" }}
          >
            See the casebook <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => methodRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-2 transition-colors hover:border-[#0c0d0e]"
            style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, padding: "13px 22px", background: "none", color: INK, border: `1px solid ${LINE_STRONG}`, cursor: "pointer" }}
          >
            How I work
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-4 border-t border-l mt-8"
          style={{ borderColor: LINE_STRONG }}
        >
          {headlines.map(h => (
            <div key={h.id} className="relative border-r border-b p-5 md:p-7"
                 style={{ borderColor: LINE }}>
              {isEditing && (
                <button onClick={() => updH(arr => arr.filter(x => x.id !== h.id))}
                  className="absolute top-1.5 right-1.5 text-red-400 hover:text-red-600"
                  style={{ fontFamily: FONT_MONO, fontSize: 10 }}>✕</button>
              )}
              {/* Value */}
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(18px, 4vw, 44px)", letterSpacing: "-0.03em", color: INK, fontVariantNumeric: "tabular-nums" }}>
                <Editable value={h.v} onChange={v => updH(arr => arr.map(x => x.id === h.id ? { ...x, v } : x))} />
              </div>
              {/* Key */}
              <div className="mt-1" style={{ fontFamily: FONT_MONO, fontSize: "clamp(8.5px, 1.2vw, 11px)", textTransform: "uppercase", letterSpacing: "0.06em", color: INK_FAINT, lineHeight: 1.2 }}>
                <Editable value={h.k} onChange={v => updH(arr => arr.map(x => x.id === h.id ? { ...x, k: v } : x))} />
              </div>
            </div>
          ))}
          {isEditing && (
            <button onClick={() => updH(arr => [...arr, { id: `h-${Date.now()}`, v: "—", k: "new stat" }])}
              className="border-r border-b p-6 flex items-center justify-center gap-1.5 border-dashed transition-colors hover:border-[#0c0d0e]"
              style={{ fontFamily: FONT_MONO, fontSize: 11, textTransform: "uppercase", color: INK_FAINT, borderColor: LINE, background: SURFACE }}>
              <Plus className="w-3.5 h-3.5" /> Add stat
            </button>
          )}
        </motion.div>
      </section>

      {/* ══ 01 / METHOD ══════════════════════════════════════════════ */}
      <section ref={methodRef} className="border-b" style={{ borderColor: LINE_STRONG, padding: "clamp(40px,5vw,72px) clamp(20px,5vw,80px)" }}>
        {/* Kicker */}
        <p style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: ACCENT, marginBottom: 14 }}>
          01 / Method
        </p>

        {/* Heading */}
        <h2 style={{ maxWidth: 820, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "clamp(20px,2.5vw,30px)", lineHeight: 1.2, letterSpacing: "-0.02em", color: INK }}>
          <Editable
            multiline
            value={d.methodHeading ?? "Anyone can solve an assigned problem.\nThe skill is finding the expensive one first."}
            onChange={v => updateData((p: any) => ({ ...p, methodHeading: v }))}
          />
        </h2>

        {/* Method cards grid */}
        <div className="mt-6 md:mt-8 border-t-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0"
             style={{ borderColor: INK }}>
          {method.map((m, i) => (
            <div key={m.id} className="relative border-r last:border-r-0 border-b lg:border-b-0 p-3.5 sm:p-4 md:py-5 md:px-4"
                 style={{ borderColor: LINE }}>
              {isEditing && (
                <button onClick={() => updM(arr => arr.filter(x => x.id !== m.id))}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                  style={{ fontFamily: FONT_MONO, fontSize: 10 }}>✕</button>
              )}
              {/* Number — accent coloured */}
              <p style={{ fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", marginBottom: 6 }}>{m.n}</p>
              {/* Title */}
              <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "clamp(14px, 1.8vw, 16.5px)", letterSpacing: "-0.015em", lineHeight: 1.25, marginBottom: 6, color: INK, wordBreak: "break-word" }}>
                <Editable value={m.t} onChange={v => updM(arr => arr.map(x => x.id === m.id ? { ...x, t: v } : x))} />
              </h3>
              {/* Description */}
              <p style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(12px, 1.5vw, 13.5px)", color: INK_SOFT, lineHeight: 1.45, maxWidth: "38ch" }}>
                <Editable multiline value={m.d} onChange={v => updM(arr => arr.map(x => x.id === m.id ? { ...x, d: v } : x))} />
              </p>
            </div>
          ))}
          {isEditing && (
            <button onClick={() => updM(arr => [...arr, { id: `m-${Date.now()}`, n: String(arr.length + 1).padStart(2, "0"), t: "New step", d: "Description." }])}
              className="p-4 flex items-center justify-center gap-1.5 border-dashed border-r last:border-r-0"
              style={{ fontFamily: FONT_MONO, fontSize: 11, color: INK_FAINT, borderColor: LINE }}>
              <Plus className="w-3.5 h-3.5" /> Add Step
            </button>
          )}
        </div>

        {/* Cadence */}
        <p className="mt-8 pt-4 border-t"
           style={{ borderColor: LINE, fontFamily: FONT_MONO, fontSize: 12, letterSpacing: "0.03em", color: INK_FAINT }}>
          <Editable
            value={d.methodCadence ?? "One real problem framed and solved every week."}
            onChange={v => updateData((p: any) => ({ ...p, methodCadence: v }))}
          />
        </p>
      </section>

      {/* ══ 02 / CASEBOOK ════════════════════════════════════════════ */}
      <section ref={casebookRef} style={{ background: PANEL, padding: "clamp(40px,5vw,72px) clamp(20px,5vw,80px)", borderTop: `1px solid ${LINE_STRONG}` }}>
        {/* Kicker */}
        <p style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: ACCENT, marginBottom: 14 }}>
          02 / Casebook
        </p>
        {/* Title */}
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "clamp(22px,2.8vw,32px)", lineHeight: 1.15, letterSpacing: "-0.02em", color: INK }}>
          <Editable
            value={d.casebookTitle ?? "Problems found, sized, and solved."}
            onChange={v => updateData((p: any) => ({ ...p, casebookTitle: v }))}
          />
        </h2>
        {/* Sub */}
        <p className="mt-2.5" style={{ color: INK_SOFT, fontSize: 14.5, maxWidth: "62ch", lineHeight: 1.5 }}>
          <Editable
            value={d.casebookSub ?? "Each one starts with a signal most teams miss — and ends with a number on the board."}
            onChange={v => updateData((p: any) => ({ ...p, casebookSub: v }))}
          />
        </p>

        {/* Recently Updated Shelf (Last 7) */}
        {(() => {
          const recentNodes = (nodes || [])
            .filter((n: any) => recencyMap[n.id])
            .sort((a: any, b: any) => recencyMap[a.id].rank - recencyMap[b.id].rank);
          
          if (recentNodes.length === 0) return null;
          
          return (
            <div className="mt-8 p-4 md:p-6 bg-surface border border-[#d3d7db] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: ACCENT }}>
                    Recently Updated Protocols
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider hidden sm:inline">
                  Read immediately from any category
                </span>
              </div>
              
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible no-scrollbar">
                {recentNodes.map((node: any) => {
                  const info = recencyMap[node.id];
                  return (
                    <Link 
                      key={node.id} 
                      to={`/protocol/${node.id}`}
                      className="group shrink-0 w-[260px] sm:w-auto snap-start block p-3.5 bg-surface border border-border rounded-lg hover:border-accent hover:shadow-md transition-all duration-200"
                      style={{ textDecoration: 'none' }}
                    >
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span 
                          className="px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider"
                          style={{
                            background: info.intensity === 'highest' ? '#f59e0b15' : 
                                        info.intensity === 'high' ? '#14b8a615' : 
                                        info.intensity === 'medium' ? '#3b82f615' : '#6b728015',
                            color: info.intensity === 'highest' ? '#d97706' : 
                                   info.intensity === 'high' ? '#0d9488' : 
                                   info.intensity === 'medium' ? '#2563eb' : '#4b5563',
                          }}
                        >
                          {info.badgeLabel}
                        </span>
                        <span className="text-[9.5px] font-mono text-muted text-right">
                          {info.timeAgo}
                        </span>
                      </div>
                      
                      <h5 
                        className="font-bold text-[13px] line-clamp-2 leading-snug group-hover:text-accent transition-colors mb-2"
                        style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, color: INK, minHeight: '2.4rem' }}
                      >
                        {node.title}
                      </h5>
                      
                      <div className="flex items-center justify-between border-t border-dashed border-[#d3d7db] pt-1.5 mt-1.5">
                        <span className="text-[9px] font-mono text-muted uppercase tracking-wide truncate max-w-[140px]">
                          {node.content?.productBucket || "No Category"}
                        </span>
                        <span className="text-[11px] text-accent font-bold group-hover:translate-x-0.5 transition-transform">
                          →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Sleek, Ultra-Compact Filter & Search Toolbar */}
        <div className="mt-4 mb-5 p-2 sm:p-2.5 bg-white/95 backdrop-blur-md border border-[#e2e8f0] rounded-xl shadow-2xs sticky top-[50px] md:top-[56px] z-20 space-y-2">
          {/* Main Controls Row: Search + Category Selector + View Mode */}
          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[140px] sm:min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search case studies by signal, cost, fix, or metric..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-[#f8fafc] hover:bg-white focus:bg-white border border-[#e2e8f0] focus:border-[#1c3f63] rounded-lg font-sans text-[12px] text-[#1e293b] placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 bg-[#f1f5f9] p-0.5 rounded-lg border border-[#e2e8f0] shrink-0">
              <button
                onClick={() => setCardViewMode('compact')}
                className={`px-2 py-1 text-[10.5px] font-mono font-bold rounded flex items-center gap-1 transition-all cursor-pointer ${
                  cardViewMode === 'compact' ? 'bg-[#1c3f63] text-white shadow-2xs' : 'text-[#475569] hover:text-[#1c3f63]'
                }`}
                title="Compact View (High Density)"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compact</span>
              </button>
              <button
                onClick={() => setCardViewMode('detailed')}
                className={`px-2 py-1 text-[10.5px] font-mono font-bold rounded flex items-center gap-1 transition-all cursor-pointer ${
                  cardViewMode === 'detailed' ? 'bg-[#1c3f63] text-white shadow-2xs' : 'text-[#475569] hover:text-[#1c3f63]'
                }`}
                title="Full Detailed View (4-Pillars)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Detailed</span>
              </button>
            </div>

            {/* Clear All Reset Button (if filtering) */}
            {(catFilter !== "ALL" || searchQuery) && (
              <button
                onClick={() => { setCatFilter("ALL"); setSearchQuery(""); }}
                className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-[10.5px] font-mono font-bold text-red-700 shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden xs:inline">Reset</span>
              </button>
            )}
          </div>

          {/* Category Filter Pills Track (Single-line horizontal scroll) */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5 pb-0.5 border-t border-slate-100">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 hidden sm:inline">
              Domains:
            </span>
            {allCats.map(cat => {
              const count = cat === "ALL" 
                ? (nodes || []).length 
                : (nodes || []).filter((n: any) => (n.content?.productBucket || "").trim() === cat).length;
              const active = catFilter === cat;
              return (
                <button 
                  key={cat} 
                  onClick={() => setCatFilter(cat)}
                  className={`shrink-0 inline-flex items-center gap-1 transition-all font-mono text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer whitespace-nowrap ${
                    active 
                      ? 'bg-[#1c3f63] text-white shadow-2xs' 
                      : 'bg-[#f8fafc] text-slate-600 hover:bg-slate-100 border border-[#e2e8f0]'
                  }`}
                >
                  <span>{cat === "ALL" ? "All Domains" : cat}</span>
                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty state if search/filter has no match */}
        {filteredNodes.length === 0 && (
          <div className="my-12 p-8 text-center bg-surface border border-dashed border-[#d3d7db] rounded-xl">
            <Filter className="w-8 h-8 text-muted mx-auto mb-3 opacity-60" />
            <h4 className="font-bold text-[15px] font-mono text-text-main mb-1">No case studies found</h4>
            <p className="text-[12px] font-mono text-muted max-w-md mx-auto mb-4">
              There are no case studies matching your current category or search query.
            </p>
            <button
              onClick={() => { setCatFilter("ALL"); setSearchQuery(""); }}
              className="px-4 py-2 bg-accent text-white font-mono text-[12px] font-bold rounded-lg hover:bg-accent/90 transition-all cursor-pointer"
            >
              Reset Filters & View All ({nodes?.length || 0})
            </button>
          </div>
        )}

        {/* Case list */}
        <motion.div key={`${catFilter}-${searchQuery}-${cardViewMode}`} variants={stagger} initial="hidden" animate="show"
          className="flex flex-col mt-4 space-y-3">
          {(filteredNodes || []).map((node: any, idx: number) => {
            const isIndividualExpanded = !!expandedNodes[node.id];
            const isExpanded = cardViewMode === 'detailed' || isIndividualExpanded;

            return (
              <motion.article key={node.id} variants={fadeUp}
                className="relative group/case bg-white border border-[#e2e8f0] hover:border-[#1c3f63]/50 rounded-xl p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-all duration-200">

                {isEditing && (
                  <button onClick={() => updateData(p => ({ ...p, nodes: (p.nodes || []).filter((n: any) => n.id !== node.id) }))}
                    className="absolute top-2.5 right-2.5 z-10 border hover:text-red-600 transition-colors rounded px-2 py-0.5"
                    style={{ fontFamily: FONT_MONO, fontSize: 10, color: COST, borderColor: COST, background: SURFACE }}>
                    REMOVE
                  </button>
                )}

                {/* Compact Responsive Card Header Meta Line - FULL CATEGORY & IMPACT METRIC ALWAYS VISIBLE */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-[#f1f5f9] w-full">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {/* Case ID */}
                    <span className="shrink-0 px-1.5 py-0.5 bg-[#f0f4f8] text-[#1c3f63] font-mono text-[9px] font-bold rounded tracking-wider uppercase">
                      CASE {String(idx + 1).padStart(2, "0")}
                    </span>

                    {/* Product Domain / Category Tag - FULL TEXT NO TRUNCATION */}
                    <span 
                      className="inline-flex items-center px-2 py-0.5 bg-[#f8fafc] border border-[#cbd5e1] text-[#334155] font-mono text-[9px] sm:text-[9.5px] font-bold rounded tracking-wider uppercase shadow-2xs whitespace-nowrap"
                      title={node.content?.productBucket || "Strategy Case"}
                    >
                      {isEditing ? (
                        <select
                          value={node.content?.productBucket || ""}
                          onChange={e => updateData(p => ({
                            ...p,
                            nodes: p.nodes.map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, productBucket: e.target.value } } : n)
                          }))}
                          className="bg-transparent outline-none uppercase font-mono cursor-pointer"
                        >
                          {ALLOWED_CATEGORIES.map(cat => (
                            <option key={cat} value={cat} className="bg-white text-black">{cat}</option>
                          ))}
                        </select>
                      ) : (
                        node.content?.productBucket || "Strategy Case"
                      )}
                    </span>

                    {/* Compact Recency Indicator */}
                    {(() => {
                      const info = recencyMap[node.id];
                      if (!info) return null;
                      return (
                        <span 
                          className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider uppercase border"
                          style={{
                            background: info.intensity === 'highest' ? '#f59e0b12' : '#3b82f612',
                            borderColor: info.intensity === 'highest' ? '#f59e0b35' : '#3b82f635',
                            color: info.intensity === 'highest' ? '#d97706' : '#2563eb',
                          }}
                          title={info.badgeLabel}
                        >
                          ⚡ {info.badgeLabel}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Primary Target Impact Badge - FULL LABEL ALWAYS VISIBLE */}
                  {(node.content?.railMetricVal || isEditing) && (() => {
                    const val = node.content?.railMetricVal || "";
                    const lbl = node.content?.railMetricLbl || "";
                    const cleanVal = val.trim();
                    const upperLbl = lbl.toUpperCase();

                    const isSpeed = cleanVal.includes("s") || upperLbl.includes("SPEED") || upperLbl.includes("TAT") || cleanVal.startsWith("<");
                    const isReduction = cleanVal.startsWith("-") || upperLbl.includes("REDUCTION") || upperLbl.includes("BREACH") || upperLbl.includes("DOWNTIME") || upperLbl.includes("PROMISE") || upperLbl.includes("LEAKAGE") || upperLbl.includes("DEFAULT");

                    const Icon = isSpeed ? Zap : isReduction ? TrendingDown : TrendingUp;
                    const badgeStyle = isSpeed
                      ? "bg-amber-50/90 border-amber-200/90 text-amber-900"
                      : isReduction
                      ? "bg-teal-50/90 border-teal-200/90 text-teal-900"
                      : "bg-emerald-50/90 border-emerald-200/90 text-emerald-900";
                    const iconColor = isSpeed ? "text-amber-600" : isReduction ? "text-teal-600" : "text-emerald-600";

                    return (
                      <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md border shadow-2xs ${badgeStyle}`}>
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
                        <span className="font-display font-extrabold text-[12px] sm:text-[13px] tracking-tight">
                          <Editable value={node.content?.railMetricVal || ""}
                            onChange={v => updateData(p => ({ ...p, nodes: (p.nodes || []).map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, railMetricVal: v } } : n) }))} />
                        </span>
                        {(node.content?.railMetricLbl || isEditing) && (
                          <span className="inline-block font-mono text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider opacity-90 whitespace-nowrap">
                            <Editable value={node.content?.railMetricLbl || ""}
                              onChange={v => updateData(p => ({ ...p, nodes: (p.nodes || []).map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, railMetricLbl: v } } : n) }))} />
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Case Headline / Problem Statement */}
                <Link to={`/protocol/${node.id}`} className="block group/title my-1" style={{ textDecoration: 'none' }}>
                  <h3 className="group-hover/title:text-[#1c3f63] transition-colors" 
                      style={{ 
                        fontFamily: FONT_DISPLAY, 
                        fontWeight: 700, 
                        fontSize: "clamp(13.5px, 1.7vw, 16px)",
                        lineHeight: 1.35, 
                        letterSpacing: "-0.012em", 
                        color: INK, 
                        wordBreak: "break-word"
                      }}>
                    <Editable multiline value={node.title}
                      onChange={v => updateData(p => ({ ...p, nodes: p.nodes.map((n: any) => n.id === node.id ? { ...n, title: v } : n) }))} />
                  </h3>
                  
                  {/* Crisp Subject Line / PM Context Subtitle */}
                  {(node.content?.subtitle || isEditing) && (
                    <p className="text-[11.5px] sm:text-[12px] text-[#475569] font-sans font-medium leading-snug mt-0.5 group-hover/title:text-[#1c3f63]/80">
                      <Editable multiline value={node.content?.subtitle || ""}
                        onChange={v => updateData(p => ({ ...p, nodes: p.nodes.map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, subtitle: v } } : n) }))} />
                    </p>
                  )}
                </Link>

                {/* 4-Pillar Breakdown Grid (Expanded View) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="my-2.5 pt-2 border-t border-dashed border-[#e2e8f0] overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map(idx => {
                          const lblText = (node.content?.[`stat${idx}Lbl`] || (idx === 1 ? "SIGNAL" : idx === 2 ? "COST" : idx === 3 ? "FIX" : "RETURN")).toUpperCase();
                          const isSignal = lblText.includes("SIGNAL");
                          const isCost = lblText.includes("COST");
                          const isFix = lblText.includes("FIX");

                          const PillarIcon = isSignal ? Activity : isCost ? TrendingDown : isFix ? CheckCircle2 : Target;
                          const pillarHeaderColor = isCost ? "#dc2626" : isFix ? "#1c3f63" : isSignal ? "#d97706" : "#059669";
                          const pillarCardClass = isCost ? "bg-red-50/40 border-red-100" : isFix ? "bg-slate-50 border-slate-200/80" : isSignal ? "bg-amber-50/30 border-amber-100" : "bg-emerald-50/30 border-emerald-100";

                          return (
                            <div key={idx} className={`flex flex-col p-2 rounded-md border ${pillarCardClass} transition-all`}>
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <div className="flex items-center gap-1">
                                  <PillarIcon className="w-3 h-3 shrink-0" style={{ color: pillarHeaderColor }} />
                                  <span style={{ 
                                    fontFamily: FONT_MONO, 
                                    fontSize: "8.5px", 
                                    fontWeight: 700, 
                                    letterSpacing: "0.08em", 
                                    textTransform: "uppercase", 
                                    color: pillarHeaderColor 
                                  }}>
                                    <Editable value={node.content?.[`stat${idx}Lbl`] || "—"}
                                      onChange={v => updateData(p => ({ ...p, nodes: p.nodes.map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, [`stat${idx}Lbl`]: v } } : n) }))} />
                                  </span>
                                </div>
                                <span style={{ fontFamily: FONT_MONO, fontSize: "9.5px", fontWeight: 700, color: INK }}>
                                  <Editable value={node.content?.[`stat${idx}Val`] || ""}
                                    onChange={v => updateData(p => ({ ...p, nodes: p.nodes.map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, [`stat${idx}Val`]: v } } : n) }))} />
                                </span>
                              </div>
                              <p style={{ fontSize: "11.5px", color: INK_SOFT, lineHeight: 1.35, fontFamily: FONT_DISPLAY }}>
                                <Editable multiline value={node.content?.[`stat${idx}Desc`] || (idx === 1 ? node.description : "—")}
                                  onChange={v => updateData(p => ({ ...p, nodes: p.nodes.map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, [`stat${idx}Desc`]: v } } : n) }))} />
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Row: Inline Tags + Unified Actions */}
                <div className="mt-2 flex items-center justify-between border-t border-[#f1f5f9] pt-2 gap-1.5 flex-nowrap">
                  {/* Skill / Scope Tags */}
                  <div className="flex items-center gap-1 min-w-0 overflow-x-auto no-scrollbar py-0.5">
                    {(() => {
                      const skillsList = (node.content?.scope || "")
                        .split(",")
                        .map((s: string) => s.trim())
                        .filter(Boolean);

                      return (
                        <>
                          {skillsList.map((skill: string, si: number) => (
                            <span key={si} className="relative group/skill shrink-0 inline-flex items-center bg-[#f1f5f9] text-[#1c3f63] font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded">
                              <Editable value={skill}
                                onChange={v => {
                                  const newList = [...skillsList];
                                  if (v.trim()) { newList[si] = v.trim(); } else { newList.splice(si, 1); }
                                  updateData(p => ({ ...p, nodes: p.nodes.map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, scope: newList.join(", ") } } : n) }));
                                }} 
                              />
                              {isEditing && (
                                <button onClick={() => {
                                  const newList = [...skillsList];
                                  newList.splice(si, 1);
                                  updateData(p => ({ ...p, nodes: p.nodes.map((n: any) => n.id === node.id ? { ...n, content: { ...n.content, scope: newList.join(", ") } } : n) }));
                                }} className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white flex items-center justify-center rounded-full text-[8px] opacity-0 group-hover/skill:opacity-100 transition-opacity">✕</button>
                              )}
                            </span>
                          ))}
                        </>
                      );
                    })()}
                  </div>

                  {/* Clean Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0 ml-auto">
                    {/* Compact Breakdown Toggle Button */}
                    <button
                      onClick={e => toggleNodeExpand(node.id, e)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[9.5px] font-mono font-bold text-[#1c3f63] hover:text-[#0f172a] border border-[#cbd5e1] bg-[#f8fafc] hover:bg-white rounded transition-all cursor-pointer shadow-2xs"
                      title="Expand/Collapse 4-step details"
                    >
                      <span className="hidden xs:inline">{isIndividualExpanded ? "Less" : "Details"}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isIndividualExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Primary CTA: Case Study */}
                    <Link to={`/protocol/${node.id}`}
                      className="inline-flex items-center gap-1 group/cta px-2.5 py-1 rounded font-bold text-[11px] transition-all cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs"
                      style={{ 
                        backgroundColor: ACCENT, 
                        color: "#ffffff", 
                        fontFamily: FONT_DISPLAY, 
                        textDecoration: "none" 
                      }}>
                      <span>Case Study</span>
                      <span className="transition-transform duration-150 group-hover/cta:translate-x-0.5 font-mono font-bold">→</span>
                    </Link>

                    {/* Share Button */}
                    <button
                      onClick={(e) => handleShareNode(e, node)}
                      className="inline-flex items-center justify-center p-1 text-[9.5px] font-mono font-bold text-[#475569] hover:text-[#1c3f63] border border-[#e2e8f0] hover:border-[#1c3f63] bg-[#f8fafc] hover:bg-white rounded transition-all cursor-pointer shrink-0"
                      title="Share Case Link"
                    >
                      <Share2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}

          {isEditing && (
            <button className="py-5 w-full flex items-center justify-center gap-2 border-2 border-dashed mt-4 transition-colors hover:border-[#0c0d0e]"
              style={{ fontFamily: FONT_MONO, fontSize: 11, textTransform: "uppercase", color: INK_FAINT, borderColor: LINE_STRONG }}
              onClick={() => updateData(p => ({
                ...p,
                nodes: [...(p.nodes || []), {
                  id: `node-${Date.now()}`, title: "New Protocol", date: "2024.Q1", description: "",
                  assets: { videoUrl: "", videoDuration: "", deckUrl: "", deckSize: "", bgImageUrl: "", systemFlowUrl: "" },
                  content: {
                    stat1Lbl: "", stat1Val: "", stat1Desc: "",
                    stat2Lbl: "", stat2Val: "", stat2Desc: "",
                    stat3Lbl: "", stat3Val: "", stat3Desc: "",
                    stat4Lbl: "", stat4Val: "", stat4Desc: "",
                    productBucket: ALLOWED_CATEGORIES[0], role: "", scope: "", status: "Active Case Study",
                  }
                }]
              }))}>
              <Plus className="w-4 h-4" /> Add Case
            </button>
          )}
        </motion.div>
      </section>

      {/* ══ 03 / RANGE ════════════════════════════════════════════════ */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${LINE_STRONG}`, padding: "clamp(56px,7vw,100px) clamp(20px,5vw,80px)" }}>
        {/* Kicker */}
        <p style={{ fontFamily: FONT_MONO, fontSize: 11.5, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: ACCENT, marginBottom: 20 }}>
          03 / Range
        </p>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-10">
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: "clamp(25px,3.3vw,40px)", lineHeight: 1.1, letterSpacing: "-0.025em", color: INK, maxWidth: 820 }}>
            <Editable
              value={d.rangeTitle ?? "Not one trick. Wherever the value is leaking."}
              onChange={v => updateData((p: any) => ({ ...p, rangeTitle: v }))}
            />
          </h2>
          {isEditing && (
            <button onClick={() => updateData(p => ({ ...p, specs: [...(p.specs || []), { id: `s-${Date.now()}`, label: "New skill", value: 50 }] }))}
              className="shrink-0 flex items-center gap-1 transition-colors hover:bg-[#1c3f63] hover:text-white"
              style={{ fontFamily: FONT_MONO, fontSize: 11, textTransform: "uppercase", color: ACCENT, border: `1px solid ${ACCENT}`, padding: "8px 14px", background: "none", cursor: "pointer" }}>
              <Plus className="w-3 h-3" /> Add
            </button>
          )}
        </div>

        {/* Range rows */}
        <div className="flex flex-col max-w-3xl" style={{ borderTop: `1px solid ${LINE}` }}>
          {(specs || []).map((spec: any, i: number) => (
            <div key={spec.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 py-4"
                 style={{ borderBottom: `1px solid ${LINE}` }}>
              {/* Label */}
              <div className="flex items-center gap-2 sm:w-52 shrink-0">
                {isEditing && (
                  <button onClick={() => updateData(p => ({ ...p, specs: (p.specs || []).filter((s: any) => s.id !== spec.id) }))}
                    className="text-red-400 hover:text-red-600 shrink-0" style={{ fontSize: 11 }}>✕</button>
                )}
                <span style={{ fontSize: 14.5, fontWeight: 500, color: INK }}>
                  <Editable value={spec.label}
                    onChange={v => updateData(p => ({ ...p, specs: (p.specs || []).map((s: any) => s.id === spec.id ? { ...s, label: v } : s) }))} />
                </span>
              </div>
              {/* Bar */}
              <div className="flex-1 h-2 overflow-hidden" style={{ background: PANEL }}>
                <motion.div className="h-full"
                  initial={{ width: 0 }} animate={{ width: `${spec.value}%` }}
                  transition={{ duration: 1, ease: [0.2, 0.7, 0.2, 1], delay: 0.2 + i * 0.07 }}
                  style={{ background: ACCENT }} />
              </div>
              {/* Value */}
              <span className="sm:w-11 sm:text-right" style={{ fontFamily: FONT_MONO, fontSize: 13, color: INK_FAINT }}>
                <Editable value={String(spec.value)}
                  onChange={v => updateData(p => ({ ...p, specs: (p.specs || []).map((s: any) => s.id === spec.id ? { ...s, value: Number(v) } : s) }))} />
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Social Share Modal */}
      <AnimatePresence>
        {shareModalNode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-mono"
            onClick={() => setShareModalNode(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border relative text-[#0c0d0e]"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShareModalNode(null)}
                className="absolute top-4 right-4 p-1.5 text-[#737a82] hover:text-[#0c0d0e] rounded-full hover:bg-[#f5f6f7] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <span className="p-2.5 bg-[#1c3f63]/10 rounded-xl text-[#1c3f63]">
                  <Share2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-[15px] tracking-wide text-[#0c0d0e]">Share Case Study</h3>
                  <p className="text-[11px] text-[#737a82]">Deep link directly to this protocol page</p>
                </div>
              </div>

              <div className="my-4 p-3 bg-[#f5f6f7] rounded-xl border border-[#e5e7ea]">
                <div className="text-[10px] font-bold text-[#1c3f63] tracking-widest uppercase mb-1">
                  {shareModalNode.content?.headerId || 'PROTOCOL_ID'}
                </div>
                <div className="font-bold text-[13px] text-[#0c0d0e] line-clamp-2">
                  {shareModalNode.title}
                </div>
              </div>

              {/* Direct Social Share Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => {
                    const url = getShareUrl(shareModalNode);
                    const text = getShareText(shareModalNode);
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-[12px] shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12.031 2c-5.516 0-9.99 4.474-9.99 9.99 0 1.763.459 3.479 1.332 4.992l-1.416 5.171 5.293-1.388c1.458.796 3.102 1.215 4.781 1.216h.004c5.515 0 9.989-4.474 9.989-9.99 0-2.668-1.039-5.176-2.924-7.061s-4.392-2.93-7.069-2.93zm0 1.662c2.222 0 4.311.866 5.88 2.435 1.569 1.569 2.433 3.658 2.433 5.88 0 4.595-3.738 8.333-8.333 8.333-1.468 0-2.903-.388-4.162-1.125l-.298-.175-3.097.812.826-3.018-.192-.306c-.808-1.288-1.236-2.776-1.236-4.296 0-4.595 3.738-8.333 8.333-8.333zm-3.666 4.331c-.227 0-.593.085-.903.424-.31.338-1.185 1.157-1.185 2.82 0 1.663 1.213 3.268 1.383 3.494.169.225 2.385 3.642 5.78 5.107.807.348 1.437.556 1.928.712.81.258 1.548.222 2.13.135.651-.097 2.003-.818 2.285-1.607.282-.789.282-1.466.197-1.607-.085-.141-.31-.225-.649-.395s-2.003-.987-2.313-1.1-.536-.169-.762.169c-.226.338-.875 1.1-.1.733-1.353-.169-.225-.451-.366-.789-.141-.338-.028-.684.085-.902.225l.423-.423c.141-.141.188-.239.282-.395.094-.155.047-.296-.019-.423s-.762-1.833-1.044-2.51c-.274-.66-.554-.57-.762-.581h-.651z"/>
                  </svg>
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    const url = getShareUrl(shareModalNode);
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-[#0A66C2] hover:bg-[#0855a3] text-white rounded-xl font-bold text-[12px] shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                  <span>LinkedIn</span>
                </button>
              </div>

              {/* Copy Link */}
              <div className="p-2.5 bg-[#f5f6f7] rounded-xl border border-[#e5e7ea] flex items-center justify-between gap-2 mb-3">
                <div className="text-[11px] font-mono text-[#737a82] truncate select-all pl-1">
                  {getShareUrl(shareModalNode)}
                </div>
                <button
                  onClick={async () => {
                    const url = getShareUrl(shareModalNode);
                    await navigator.clipboard.writeText(url);
                    setCopyToast(`Copied link for "${shareModalNode.title}"!`);
                    setTimeout(() => setCopyToast(null), 3000);
                  }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#1c3f63] hover:bg-[#15304b] text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>
              </div>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={async () => {
                    const url = getShareUrl(shareModalNode);
                    const text = getShareText(shareModalNode);
                    try {
                      await navigator.share({ title: shareModalNode.title, text, url });
                    } catch (e) {}
                  }}
                  className="w-full py-2.5 px-4 bg-[#f5f6f7] hover:bg-[#e5e7ea] border border-[#e5e7ea] rounded-xl text-[11px] font-bold text-[#0c0d0e] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#1c3f63]" />
                  <span>More Options (Mobile Native Sheet)</span>
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0c0d0e] text-[#ffffff] px-4 py-2.5 rounded-lg shadow-2xl font-mono text-[12px] font-bold border border-[#1c3f63] flex items-center gap-2 animate-bounce">
          <span className="text-[#1c3f63] font-bold">✓</span>
          <span>{copyToast}</span>
        </div>
      )}
    </motion.div>
  );
}
