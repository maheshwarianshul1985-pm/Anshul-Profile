import React, { useState, useEffect, Fragment } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Download, Share2, X, ArrowLeft, ArrowRight, LayoutDashboard, ExternalLink, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp, INITIAL_DATA, BACKUP_PORTFOLIO_DATA } from "../contexts/AppContext";
import { Editable } from "../components/Editable";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { FileUploader } from '../components/FileUploader';
import { PdfCanvasViewer } from '../components/PdfCanvasViewer';
import { getRecencyMap } from "../utils/recency";

const safeConfirm = (msg: string): boolean => {
  try {
    return window.confirm(msg);
  } catch (e) {
    console.warn("[Protocol] window.confirm was blocked by sandbox/iframe, default to true.", e);
    return true;
  }
};

const themeStyle: React.CSSProperties = {
  '--color-primary': '#11a877',
  '--color-surface': '#ffffff',
  '--color-border': '#ece5d6',
  '--color-text-main': '#1f1b16',
  '--color-muted': '#8a8278',
  backgroundColor: '#faf7f2',
} as React.CSSProperties;

const Section = ({ tag, title, subTitle, isEditing, onDelete, children }: any) => (
  <div className="mb-7 page-break-inside-avoid">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
      <div className="inline-flex items-center gap-2 text-[10.5px] font-bold tracking-[0.14em] uppercase text-muted">
        <span className="font-mono bg-text-main text-[#fdf6e8] px-1.5 py-0.5 rounded-[5px] text-[10px] tracking-[0.04em]">{tag}</span>
        {title}
      </div>
      {isEditing && onDelete && (
        <button 
          onClick={onDelete} 
          className="text-red-500 hover:text-red-700 font-mono text-[9px] font-bold uppercase cursor-pointer border border-red-200 hover:border-red-500 bg-red-50/50 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors self-start sm:self-auto"
          title="Delete Section"
        >
          ✕ Delete Section
        </button>
      )}
    </div>
    {subTitle && (
      <div className="text-[18px] md:text-[22px] font-bold tracking-tight text-text-main mb-2 leading-snug">
        {subTitle}
      </div>
    )}
    <div className="mt-2.5">
      {children}
    </div>
  </div>
);

const ImpactTile = ({ value, onValChange, label, onLblChange, isEditing }: any) => {
  const isCost = (label || "").toUpperCase().includes("COST");
  return (
    <div className="p-3.5 md:p-4 rounded-xl text-[#fdf6e8] relative overflow-hidden bg-gradient-to-br from-[#221d17] to-[#2c2520]">
      <div className="absolute top-[-40%] right-[-10%] w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(217,122,44,0.3),transparent_60%)]"></div>
      <div className="font-mono text-[20px] md:text-[24px] font-bold tracking-tight relative z-10" style={{ color: isCost ? "#fca5a5" : "inherit" }}>
        {isEditing ? <Editable value={value} onChange={onValChange} /> : <AnimatedNumber value={value} />}
      </div>
      <div className="text-[10.5px] font-bold tracking-wide uppercase mt-1 relative z-10" style={{ color: isCost ? "#fca5a5" : "rgba(253,246,232,0.65)" }}>
        <Editable value={label} onChange={onLblChange} />
      </div>
    </div>
  );
};

function scopeCss(css: string, prefix: string): string {
  // Strip CSS comments first to avoid nested comments or brace-clashing in parsing
  const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '');
  
  let result = '';
  let i = 0;
  
  const prefixSelector = (sel: string) => {
    return sel.split(',')
      .map(part => {
        const trimmed = part.trim();
        if (!trimmed) return '';
        const lower = trimmed.toLowerCase();
        if (lower === 'body' || lower === 'html') {
          return prefix;
        }
        if (trimmed.startsWith(':root')) {
          return trimmed.replace(/:root/g, prefix);
        }
        // Skip keyframe progression marks
        if (/^(from|to|\d+%)/i.test(trimmed)) {
          return trimmed;
        }
        return `${prefix} ${trimmed}`;
      })
      .filter(Boolean)
      .join(', ');
  };

  let currentSelector = '';
  let depth = 0;
  let mediaDepth = 0;

  while (i < cleanCss.length) {
    const char = cleanCss[i];

    if (char === '{') {
      depth++;
      const trimmedSelector = currentSelector.trim();
      
      if (trimmedSelector.startsWith('@')) {
        result += trimmedSelector + ' {';
        if (trimmedSelector.toLowerCase().startsWith('@media')) {
          mediaDepth = depth;
        }
      } else {
        if (mediaDepth > 0 && depth === mediaDepth + 1) {
          result += prefixSelector(trimmedSelector) + ' {';
        } else if (depth === 1) {
          result += prefixSelector(trimmedSelector) + ' {';
        } else {
          result += trimmedSelector + ' {';
        }
      }
      currentSelector = '';
    } else if (char === '}') {
      if (depth === mediaDepth) {
        mediaDepth = 0;
      }
      depth--;
      result += '}';
      currentSelector = '';
    } else {
      if (depth === 0 || (mediaDepth > 0 && depth === mediaDepth)) {
        currentSelector += char;
      } else {
        result += char;
      }
    }
    i++;
  }
  return result;
}

const sanitizeCustomHtml = (html: string) => {
  if (!html) return "";
  
  // Strip meta viewports completely to prevent overriding parent window responsive viewport on mobile webviews!
  let clean = html
    .replace(/<meta\s+name=["']viewport["'][^>]*>/gi, '')
    // Also strip duplicates like full html/head/body wrapping structures if pasted
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<\/?html[^>]*>/gi, '')
    .replace(/<\/?head[^>]*>/gi, '')
    .replace(/<\/?body[^>]*>/gi, '')
    .replace(/<title>[^<]*<\/title>/gi, '');

  // Scope all style blocks inside the HTML to target ONLY the container element itself!
  clean = clean.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (match, attrs, cssContent) => {
    const scoped = scopeCss(cssContent, '.custom-html-rendered-layout');
    return `<style${attrs}>${scoped}</style>`;
  });

  return clean;
};

export default function Protocol() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, updateData, isEditing, loading, cloudError } = useApp();
  const recencyMap = getRecencyMap(data.nodes);
  const [showDocument, setShowDocument] = useState<'deck' | 'video' | 'website' | null>(null);
  const [showFlowLightbox, setShowFlowLightbox] = useState(false);
  const [flowZoomLevel, setFlowZoomLevel] = useState<number>(0);
  const [pastedCode, setPastedCode] = useState("");
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null, text: string }>({ type: null, text: "" });
  const [showBackupRecallSection, setShowBackupRecallSection] = useState(true);
  const [recentlyUploaded, setRecentlyUploaded] = useState<Record<string, boolean>>({});
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Scroll to header immediately whenever a protocol opens or changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    const topHeader = document.getElementById("protocol-top-header");
    if (topHeader) {
      topHeader.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, [id]);

  const isMobileOrWebView = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    
    // Check width / touch capabilities
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth < 1024;
    
    // Common mobile user agent patterns
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    // Check if running inside an in-app webview
    const isWebView = /wv|WebView|FBAN|FBAV|Instagram|LinkedInApp|Slack|Twitter|Gmail|AppWebview/i.test(ua) ||
      (ua.includes('Safari') && ua.includes('GSA')) ||
      (navigator.userAgent.includes('Mobile') && !navigator.userAgent.includes('Safari'));
      
    return isMobileUA || isSmallScreen || hasTouch || isWebView;
  };

  const handleOpenDocument = (type: 'deck' | 'video' | 'website', url: string) => {
    if (!url) return;
    // Always open using our high-fidelity, custom-styled inside-app overlay.
    // This allows seamless video and document viewing on mobile/webviews
    // with beautiful Close/Open-in-New-Tab buttons natively placed inside!
    setShowDocument(type);
  };
  
  const ZOOM_LEVELS = [0, 10, 20, 30, 50, 75, 100, 125, 150, 200];
  
  const parseSafeArray = (val: any): any[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn("[Protocol] Failed to parse array string:", val, e);
      }
    }
    return [];
  };

  const findNodeInList = (nodesList: any[], searchId: string | undefined) => {
    if (!nodesList || !Array.isArray(nodesList) || !searchId) return null;
    const cleanParam = decodeURIComponent(searchId || '').trim().toLowerCase();
    
    return nodesList.find((n: any, idx: number) => {
      if (!n) return false;
      const cleanId = String(n.id || '').trim().toLowerCase();
      
      // Exact or node- prefixed match
      if (cleanId === cleanParam) return true;
      if (`node-${cleanId}` === cleanParam) return true;
      if (cleanId === `node-${cleanParam}`) return true;

      // Header ID match (e.g. OPS_CORE_V2.1 or ops-core)
      const cleanHeaderId = String(n.content?.headerId || '').trim().toLowerCase();
      if (cleanHeaderId && cleanHeaderId === cleanParam) return true;

      // Title slug match
      const titleSlug = String(n.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (titleSlug && titleSlug === cleanParam) return true;

      // Number index match (1-indexed or 0-indexed)
      const numId = parseInt(searchId || '', 10);
      if (!isNaN(numId) && (numId === idx + 1 || numId === idx)) return true;

      return false;
    });
  };

  const rawNode = findNodeInList(data?.nodes, id) 
               || findNodeInList(BACKUP_PORTFOLIO_DATA?.nodes, id) 
               || findNodeInList(INITIAL_DATA?.nodes, id);
  const node = rawNode ? {
    ...rawNode,
    history: parseSafeArray(rawNode.history),
    content: {
      ...(rawNode.content || {}),
      solutionFlow: parseSafeArray(rawNode.content?.solutionFlow),
      systemFlow: parseSafeArray(rawNode.content?.systemFlow),
      impactTiles: parseSafeArray(rawNode.content?.impactTiles),
      audiences: parseSafeArray(rawNode.content?.audiences),
      buckets: parseSafeArray(rawNode.content?.buckets),
      proofs: parseSafeArray(rawNode.content?.proofs),
      gtms: parseSafeArray(rawNode.content?.gtms),
      deletedSections: parseSafeArray(rawNode.content?.deletedSections),
    }
  } : null;

  const deletedSections = node?.content?.deletedSections || [];

  // If the node isn't in our current data (backup or cache)
  if (!node) {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf7f2] font-mono text-muted text-center p-8">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
          <div className="text-[10px] opacity-60 uppercase tracking-widest">Locating Protocol...</div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf7f2] font-mono text-muted p-10 text-center">
        <div className="text-[48px] mb-4">🤷‍♂️</div>
        <div className="text-[13px] font-bold text-text-main tracking-widest uppercase mb-2">Protocol Not Found</div>
        <div className="text-[11px] max-w-xs mb-8 opacity-70">The requested case study could not be located in the current database. It may have been deleted or moved.</div>
        <button onClick={() => navigate("/")} className="px-6 py-2 bg-text-main text-white rounded text-[11px] font-bold tracking-widest uppercase hover:bg-primary transition-colors">Return to Dashboard</button>
      </div>
    );
  }

  const handleImportCode = () => {
    if (!pastedCode.trim()) {
      setImportStatus({ type: 'error', text: "Please paste your protocol data (JSON or HTML) code to import." });
      return;
    }
    try {
      const trimmed = pastedCode.trim();
      const isHtml = trimmed.startsWith("<") || trimmed.includes("<html") || trimmed.includes("<!DOCTYPE") || trimmed.includes("<div") || trimmed.includes("<Section") || trimmed.includes("<fragment");
      
      let parsed: any = {};
      let parseMethod = "JSON";

      const protectedAssets = {
        videoUrl: node.assets?.videoUrl || "",
        videoDuration: node.assets?.videoDuration || "",
        deckUrl: node.assets?.deckUrl || "",
        deckSize: node.assets?.deckSize || "",
        deckText: node.assets?.deckText || "",
        bgImageUrl: node.assets?.bgImageUrl || "",
        systemFlowUrl: node.assets?.systemFlowUrl || "",
        pptUrl: node.assets?.pptUrl || "", 
        presentationUrl: node.assets?.presentationUrl || "",
      };

      if (isHtml) {
        parseMethod = "HTML Structure Extractor";
        const parser = new DOMParser();
        const doc = parser.parseFromString(trimmed, "text/html");
        
        let foundJson = false;

        // Try extracting JSON from <script> tags or embedded blocks
        const scripts = doc.querySelectorAll("script");
        for (const s of Array.from(scripts)) {
          const text = s.textContent || "";
          try {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
              const testParsed = JSON.parse(match[0]);
              if (testParsed.title || testParsed.content || testParsed.nodes) {
                parsed = testParsed;
                foundJson = true;
                break;
              }
            }
          } catch (e) {}
        }

        if (!foundJson) {
          try {
            const rawJsonMatch = trimmed.match(/(\{[\s\S]*"title"[\s\S]*"content"[\s\S]*\})/gi) || trimmed.match(/(\{[\s\S]*"solutions"[\s\S]*\})/gi);
            if (rawJsonMatch) {
              const testParsed = JSON.parse(rawJsonMatch[0]);
              if (testParsed.title || testParsed.content || testParsed.solutions) {
                parsed = testParsed;
                foundJson = true;
              }
            }
          } catch (e) {}
        }

        if (!foundJson) {
          // Precise Page / Protocol Title parser
          let titleText = "";
          const problemTitleEl = doc.querySelector(".pcard.problem .title, .pcard .title");
          if (problemTitleEl) {
            titleText = problemTitleEl.textContent?.trim() || "";
          }
          if (!titleText) {
            const hereEl = doc.querySelector(".breadcrumb .here, .here");
            if (hereEl) titleText = hereEl.textContent?.trim() || "";
          }
          if (!titleText) {
            const docTitleHeader = doc.querySelector(".doc-title, .editable-title");
            if (docTitleHeader) titleText = docTitleHeader.textContent?.trim() || "";
          }
          if (!titleText) {
            const docTitleEl = doc.querySelector("title");
            if (docTitleEl && docTitleEl.textContent) {
              const parts = docTitleEl.textContent.split("·");
              titleText = parts.length > 1 ? parts[1].trim() : docTitleEl.textContent.trim();
            }
          }

          // Meta-cell scraping
          let scrapedRole = "";
          let scrapedScope = "";
          let scrapedStatus = "";
          let scrapedDate = "";

          doc.querySelectorAll(".meta-cell").forEach(cell => {
            const k = cell.querySelector(".k")?.textContent?.trim().toLowerCase();
            const v = cell.querySelector(".v")?.textContent?.trim();
            if (k && v) {
              if (k.includes("role")) scrapedRole = v;
              if (k.includes("scope")) scrapedScope = v;
              if (k.includes("status")) scrapedStatus = v;
              if (k.includes("duration") || k.includes("date") || k.includes("timeframe")) scrapedDate = v;
            }
          });

          // Text blocks
          let scrapedProblem = "";
          let scrapedSolutions = "";
          let scrapedImpact = "";

          const problemCardEl = doc.querySelector(".pcard.problem, [id*='problem'], [class*='problem']");
          if (problemCardEl) {
            const descEl = problemCardEl.querySelector(".desc, .description, p, div");
            if (descEl && descEl.className && (descEl.className.includes("desc") || descEl.className.includes("p"))) {
              scrapedProblem = descEl.textContent?.trim() || "";
            } else {
              const lines = Array.from(problemCardEl.querySelectorAll(".desc, p, div"))
                .map(el => el.textContent?.trim() || "")
                .filter(txt => txt && !txt.toLowerCase().includes("problem statement") && !txt.toLowerCase().includes("problem 12"));
              scrapedProblem = lines[0] || problemCardEl.textContent?.trim() || "";
            }
          }

          const solutionCardEl = doc.querySelector(".pcard.solution, [id*='solution'], [class*='solution']");
          if (solutionCardEl) {
            const descEl = solutionCardEl.querySelector(".desc, .description, p, div");
            if (descEl && descEl.className && (descEl.className.includes("desc") || descEl.className.includes("p"))) {
              scrapedSolutions = descEl.textContent?.trim() || "";
            } else {
              const lines = Array.from(solutionCardEl.querySelectorAll(".desc, p, div"))
                .map(el => el.textContent?.trim() || "")
                .filter(txt => txt && !txt.toLowerCase().includes("solution") && !txt.toLowerCase().includes("tracker"));
              scrapedSolutions = lines[0] || solutionCardEl.textContent?.trim() || "";
            }
          }

          const impactContainer = doc.querySelector(".impact, [id*='impact'], [class*='impact']");
          if (impactContainer) {
            const ipElements = Array.from(impactContainer.querySelectorAll(".ip"));
            if (ipElements.length > 0) {
              scrapedImpact = ipElements.map(el => {
                const val = el.querySelector(".v")?.textContent?.trim() || "";
                const lbl = el.querySelector(".k")?.textContent?.trim() || "";
                const sm = el.querySelector(".s")?.textContent?.trim() || "";
                return `${lbl} (${val}): ${sm}`;
              }).join(" | ");
            } else {
              scrapedImpact = impactContainer.textContent?.trim() || "";
            }
          }

          // Fallbacks for main descriptors if empty
          const allParagraphs = doc.querySelectorAll("p, div.text-muted, div.text-text-main");
          if (!scrapedProblem && allParagraphs[0]) scrapedProblem = allParagraphs[0].textContent?.trim() || "";
          if (!scrapedSolutions && allParagraphs[1]) scrapedSolutions = allParagraphs[1].textContent?.trim() || "";
          if (!scrapedImpact && allParagraphs[2]) scrapedImpact = allParagraphs[2].textContent?.trim() || "";

          // Code
          const codeBox = doc.querySelector("pre, code, pre code, .font-mono");
          const scrapedCode = codeBox ? codeBox.textContent?.trim() : "";

          // Extract standard Lists & Structures
          const solutionFlow: any[] = [];
          doc.querySelectorAll(".flow .step, .step").forEach((step, i) => {
            const n = step.querySelector(".n")?.textContent?.trim() || `${i + 1}`;
            const t = step.querySelector(".t, .body .t, .title")?.textContent?.trim() || "";
            const d = step.querySelector(".d, .body .d, .desc, .description")?.textContent?.trim() || "";
            if (t) {
              solutionFlow.push({
                id: `solf-scraped-${Date.now()}-${i}`,
                n: n,
                t: t,
                d: d
              });
            }
          });

          const systemFlow: any[] = [];
          doc.querySelectorAll(".pipe .node, .node").forEach((nodeEl, i) => {
            const layer = nodeEl.querySelector(".layer")?.textContent?.trim().toUpperCase() || "LAYER";
            const name = nodeEl.querySelector(".name")?.textContent?.trim() || "";
            const what = nodeEl.querySelector(".what")?.textContent?.trim() || "";
            if (name) {
              systemFlow.push({
                id: `sysf-scraped-${Date.now()}-${i}`,
                layer: layer,
                name: name,
                what: what
              });
            }
          });

          const impactTiles: any[] = [];
          doc.querySelectorAll(".impact .ip, .ip").forEach((ip, i) => {
            const value = ip.querySelector(".v")?.textContent?.trim() || "0%";
            const k = ip.querySelector(".k")?.textContent?.trim().toUpperCase() || "METRIC";
            const s = ip.querySelector(".s")?.textContent?.trim() || "";
            if (k) {
              impactTiles.push({
                id: `imp-scraped-${Date.now()}-${i}`,
                value: value,
                k: k,
                s: s
              });
            }
          });

          const audiences: any[] = [];
          doc.querySelectorAll(".aud-grid .aud, .aud").forEach((aud, i) => {
            const pri = aud.querySelector(".pri")?.textContent?.trim() || "Primary";
            const who = aud.querySelector(".who")?.textContent?.trim() || "";
            const need = aud.querySelector(".need")?.textContent?.trim() || "";
            if (who) {
              audiences.push({
                id: `aud-scraped-${Date.now()}-${i}`,
                pri: pri,
                who: who,
                need: need
              });
            }
          });

          const buckets: any[] = [];
          doc.querySelectorAll(".bucket-chips .chip, .chip").forEach((chip, i) => {
            let label = chip.textContent?.trim() || "";
            label = label.replace(/[●•○✓→]/gi, "").trim();
            if (label) {
              buckets.push({
                id: `b-scraped-${Date.now()}-${i}`,
                label: label,
                primary: chip.classList.contains("primary")
              });
            }
          });

          const proofs: any[] = [];
          doc.querySelectorAll(".proof-list .proof, .proof").forEach((proof, i) => {
            const nm = proof.querySelector(".nm")?.textContent?.trim() || "";
            const ds = proof.querySelector(".ds")?.textContent?.trim() || "";
            if (nm) {
              proofs.push({
                id: `pr-scraped-${Date.now()}-${i}`,
                nm: nm,
                ds: ds
              });
            }
          });

          const gtms: any[] = [];
          doc.querySelectorAll(".gtm-list .gtm, .gtm").forEach((gtm, i) => {
            const nm = gtm.querySelector(".nm")?.textContent?.trim() || "";
            const ds = gtm.querySelector(".ds")?.textContent?.trim() || "";
            if (nm) {
              gtms.push({
                id: `gtm-scraped-${Date.now()}-${i}`,
                nm: nm,
                ds: ds
              });
            }
          });

          // Scan for actual media URLs inside the HTML. If they are placeholder links (using # hashes or empty)
          // we discard them so they don't overwrite current session records.
          let docVideoUrl = "";
          let docFlowUrl = "";
          let docHeroUrl = "";
          let docDeckUrl = "";

          doc.querySelectorAll("a, video, source").forEach(el => {
            const href = el.getAttribute("href") || el.getAttribute("src") || "";
            if (href && !href.startsWith("#") && href !== "javascript:void(0)") {
              if (href.toLowerCase().includes(".mp4") || href.toLowerCase().includes("video") || (href.includes("uploads%") && href.toLowerCase().includes(".mp4"))) {
                docVideoUrl = href;
              }
              if (href.toLowerCase().includes(".pdf") || href.toLowerCase().includes(".ppt") || href.toLowerCase().includes(".pptx") || href.toLowerCase().includes("deck") || el.className.includes("pdf") || el.className.includes("ppt")) {
                docDeckUrl = href;
              }
            }
          });

          doc.querySelectorAll("img, a").forEach(el => {
            const src = el.getAttribute("src") || el.getAttribute("href") || "";
            if (src && !src.startsWith("#") && src !== "javascript:void(0)") {
              const isFlow = el.id === "system-flow-link" || 
                             el.className.includes("flow") || 
                             src.toLowerCase().includes("flow") || 
                             (src.includes("uploads%") && (src.toLowerCase().includes(".png") || src.toLowerCase().includes(".jpg") || src.toLowerCase().includes(".jpeg")));
              if (isFlow && !src.toLowerCase().includes(".mp4")) {
                docFlowUrl = src;
              }
            }
          });

          doc.querySelectorAll("img").forEach(el => {
            const src = el.getAttribute("src") || "";
            if (src && !src.startsWith("#") && src !== "javascript:void(0)") {
              if (el.className.includes("hero-img") || src.toLowerCase().includes("hero") || src.includes("uploads%")) {
                if (!src.toLowerCase().includes("flow") && !src.toLowerCase().includes("diagram")) {
                  docHeroUrl = src;
                }
              }
            }
          });

          const scrapedDateText = scrapedDate;

          parsed = {
            title: titleText || node.title,
            date: scrapedDateText || node.date,
            assets: {
              videoUrl: docVideoUrl,
              deckUrl: docDeckUrl,
              systemFlowUrl: docFlowUrl,
              bgImageUrl: docHeroUrl,
            },
            content: {
              role: scrapedRole || node.content.role,
              scope: scrapedScope || node.content.scope,
              status: scrapedStatus || node.content.status,
              problem: scrapedProblem || node.content.problem,
              solutions: scrapedSolutions || node.content.solutions,
              impact: scrapedImpact || node.content.impact,
              solutionCode: scrapedCode || node.content.solutionCode,
              solutionFlow: solutionFlow.length > 0 ? solutionFlow : node.content.solutionFlow,
              systemFlow: systemFlow.length > 0 ? systemFlow : node.content.systemFlow,
              impactTiles: impactTiles.length > 0 ? impactTiles : node.content.impactTiles,
              audiences: audiences.length > 0 ? audiences : node.content.audiences,
              buckets: buckets.length > 0 ? buckets : node.content.buckets,
              proofs: proofs.length > 0 ? proofs : node.content.proofs,
              gtms: gtms.length > 0 ? gtms : node.content.gtms,
            }
          };
        }
        
        parsed.content = {
          ...(parsed.content || {}),
          customHtml: trimmed
        };
      } else {
        parsed = JSON.parse(trimmed);
      }

      const currentHistory = node.history || [];
      const newBackup = {
        timestamp: new Date().toISOString(),
        label: `Auto-Backup before Import (${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`,
        snapshot: {
          title: node.title || "",
          date: node.date || "",
          assets: { ...(node.assets || {}) },
          content: { ...(node.content || {}) }
        }
      };

      const importedTitle = parsed.title || parsed.name || node.title;
      const importedDate = parsed.date || node.date;
      const importedAssets = parsed.assets || {};
      const importedContent = parsed.content || (parsed.role || parsed.scope ? parsed : node.content);

      // Protect media: preserve original unless user provides a valid, real external url or uploaded file
      const isValidUrl = (url?: string) => {
        return url && (url.startsWith("http") || url.startsWith("/uploads/") || url.startsWith("uploads/")) && !url.includes("placeholder");
      };

      const mergedAssets = {
        ...node.assets,
        ...importedAssets,
        videoUrl: isValidUrl(importedAssets.videoUrl) ? importedAssets.videoUrl : (protectedAssets.videoUrl || ""),
        videoDuration: importedAssets.videoDuration || protectedAssets.videoDuration || "",
        deckUrl: isValidUrl(importedAssets.deckUrl) ? importedAssets.deckUrl : (protectedAssets.deckUrl || ""),
        deckSize: importedAssets.deckSize || protectedAssets.deckSize || "",
        deckText: importedAssets.deckText || protectedAssets.deckText || "",
        bgImageUrl: isValidUrl(importedAssets.bgImageUrl) ? importedAssets.bgImageUrl : (protectedAssets.bgImageUrl || ""),
        systemFlowUrl: isValidUrl(importedAssets.systemFlowUrl) ? importedAssets.systemFlowUrl : (protectedAssets.systemFlowUrl || ""),
        pptUrl: isValidUrl(importedAssets.pptUrl) ? importedAssets.pptUrl : (protectedAssets.pptUrl || ""),
        presentationUrl: isValidUrl(importedAssets.presentationUrl) ? importedAssets.presentationUrl : (protectedAssets.presentationUrl || ""),
      };

      const mergedContent = {
        ...node.content,
        ...Object.fromEntries(
          Object.entries(importedContent).filter(([_, v]) => {
            if (Array.isArray(v)) return v.length > 0;
            return v !== undefined && v !== null && v !== "";
          })
        )
      };

      updateData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === node.id ? {
          ...n,
          title: importedTitle,
          date: importedDate,
          assets: mergedAssets,
          content: mergedContent,
          history: [newBackup, ...currentHistory]
        } : n)
      }));

      setPastedCode("");
      setImportStatus({
        type: 'success',
        text: `Code parsed successfully using ${parseMethod}! All content variables and custom structures have been updated. Your videos, PDF decks, presentations, and flow diagram assets were strictly identified and preserved.`
      });

    } catch (err: any) {
      console.error(err);
      setImportStatus({
        type: 'error',
        text: "Error importing code. If pasting HTML/JSX or JSON, ensure it contains standard descriptors or structure strings. Detail: " + err.message
      });
    }
  };

  const handleCreateManualBackup = () => {
    const currentHistory = node.history || [];
    const newBackup = {
      timestamp: new Date().toISOString(),
      label: `Manual Save Point (${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})`,
      snapshot: {
        title: node.title || "",
        date: node.date || "",
        assets: { ...(node.assets || {}) },
        content: { ...(node.content || {}) }
      }
    };
    
    updateData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === node.id ? {
        ...n,
        history: [newBackup, ...(n.history || [])]
      } : n)
    }));

    setImportStatus({
      type: 'success',
      text: "Manual layout backup point captured successfully!"
    });
  };

  const handleRecallVersion = (backup: any) => {
    const protectedAssets = {
      videoUrl: node.assets?.videoUrl || "",
      videoDuration: node.assets?.videoDuration || "",
      deckUrl: node.assets?.deckUrl || "",
      deckSize: node.assets?.deckSize || "",
      deckText: node.assets?.deckText || "",
      systemFlowUrl: node.assets?.systemFlowUrl || "",
      pptUrl: node.assets?.pptUrl || "", 
      presentationUrl: node.assets?.presentationUrl || "",
    };

    const snapshot = backup.snapshot;
    
    const restoredAssets = {
      ...snapshot.assets,
      videoUrl: protectedAssets.videoUrl,
      videoDuration: protectedAssets.videoDuration,
      deckUrl: protectedAssets.deckUrl,
      deckSize: protectedAssets.deckSize,
      deckText: protectedAssets.deckText,
      systemFlowUrl: protectedAssets.systemFlowUrl,
    };
    if (protectedAssets.pptUrl) restoredAssets.pptUrl = protectedAssets.pptUrl;
    if (protectedAssets.presentationUrl) restoredAssets.presentationUrl = protectedAssets.presentationUrl;

    updateData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === node.id ? {
        ...n,
        title: snapshot.title,
        date: snapshot.date,
        assets: restoredAssets,
        content: {
          ...n.content,
          ...snapshot.content
        }
      } : n)
    }));
    
    setImportStatus({
      type: 'success',
      text: `Successfully recalled design snapshot from ${new Date(backup.timestamp).toLocaleTimeString()}!`
    });
  };

  const handleDeleteHistoryItem = (timestamp: string) => {
    if (safeConfirm("Are you sure you want to permanently delete this saved design snapshot?")) {
      updateData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === node.id ? {
          ...n,
          history: (n.history || []).filter((h: any) => h.timestamp !== timestamp)
        } : n)
      }));
    }
  };

  const handleCopyCurrentConfig = () => {
    const exportNode = {
      title: node.title,
      date: node.date,
      assets: node.assets || {},
      content: node.content || {}
    };
    navigator.clipboard.writeText(JSON.stringify(exportNode, null, 2))
      .then(() => {
        setImportStatus({ type: 'success', text: "Current layout code copied to clipboard! You can save this anywhere." });
      })
      .catch(() => {
        setImportStatus({ type: 'error', text: "Failed to copy code to clipboard." });
      });
  };
  
  if (!node) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white min-h-[50vh]">
        <h1 className="font-display font-bold text-2xl text-red-600 mb-2">PROTOCOL NOT FOUND</h1>
        <p className="font-mono text-muted text-sm mb-6">Could not locate requested protocol ID: {id}</p>
        <button onClick={() => navigate("/")} className="bg-primary text-white font-mono px-6 py-2 uppercase font-bold text-xs tracking-widest hover:bg-text-main transition-colors brutal-border">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleExportData = () => {
    const dataStr = JSON.stringify(node, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${node.title || "protocol"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    // Generate CSV content from node data
    const rows: string[][] = [];
    
    // Helper to add rows
    const addRow = (key: string, value: string) => {
      rows.push([`"${key.replace(/"/g, '""')}"`, `"${String(value).replace(/"/g, '""')}"`]);
    };

    addRow('id', node.id);
    addRow('title', node.title);
    addRow('date', node.date || '');
    
    if (node.assets) {
      Object.entries(node.assets).forEach(([key, val]) => {
        if (typeof val === 'string' || typeof val === 'number') {
          addRow(`asset_${key}`, String(val));
        }
      });
    }
    
    if (node.content) {
      // Ensure default stats labels are included for the user's dashboard export visibility
      const finalContent = { ...node.content };
      if (!finalContent.stat1Lbl) finalContent.stat1Lbl = 'THE SIGNAL';
      if (!finalContent.stat2Lbl) finalContent.stat2Lbl = 'THE COST';
      if (!finalContent.stat3Lbl) finalContent.stat3Lbl = 'THE FIX';
      if (!finalContent.stat4Lbl) finalContent.stat4Lbl = 'THE RETURN';

      Object.entries(finalContent).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          addRow(key, JSON.stringify(val));
        } else if (typeof val === 'string' || typeof val === 'number') {
          addRow(key, String(val));
        }
      });
    }

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${node.title || "protocol"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getProtocolShareUrl = () => {
    if (!node) return window.location.href;
    return `${window.location.origin}/protocol/${encodeURIComponent(node.id)}`;
  };

  const getProtocolShareText = () => {
    if (!node) return "Check out this logistics case study & protocol";
    const headerId = node.content?.headerId ? `[${node.content.headerId}] ` : '';
    return `Check out this protocol: ${headerId}${node.title}`;
  };

  const handleShareWhatsApp = () => {
    const url = getProtocolShareUrl();
    const text = getProtocolShareText();
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${url}`)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareLinkedIn = () => {
    const url = getProtocolShareUrl();
    const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(liUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    const url = getProtocolShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setShareToast("Deep link copied! Share anywhere on WhatsApp / LinkedIn.");
      setTimeout(() => setShareToast(null), 3500);
    } catch (err) {
      console.error("[Protocol] Failed to copy link:", err);
    }
  };

  const handleNativeShare = async () => {
    const url = getProtocolShareUrl();
    const text = getProtocolShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: node?.title || 'Protocol',
          text: text,
          url: url,
        });
      } catch (err) {
        console.log("[Protocol] Native share cancelled or failed:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  const updateNodeContent = (key: string, value: string) => {
    updateData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === node.id ? { ...n, content: { ...n.content, [key]: value } } : n)
    }));
  };

  const updateNodeBase = (key: string, value: string) => {
    updateData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === node.id ? { ...n, [key]: value } : n)
    }));
  };

  const updateNodeArray = (key: string, arr: any[]) => {
    updateData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === node.id ? { ...n, content: { ...n.content, [key]: arr } } : n)
    }));
  };

  const updateNodeAsset = (key: string, value: string) => {
    updateData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === node.id ? { 
        ...n, 
        assets: { ...(n.assets || { videoUrl: "", videoDuration: "", deckUrl: "", deckSize: "", deckText: "", bgImageUrl: "", systemFlowUrl: "" }), [key]: value } 
      } : n)
    }));
  };

  const handleUploadComplete = (key: string, url: string) => {
    updateNodeAsset(key, url);
    setRecentlyUploaded(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setRecentlyUploaded(prev => ({ ...prev, [key]: false }));
    }, 12000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col flex-1 w-full min-h-screen text-[14px] leading-relaxed relative"
      style={{...themeStyle, fontFamily: 'var(--font-display)', color: 'var(--color-text-main)'}}
    >
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-text-main text-[#fdf6e8] px-4 py-2.5 rounded-lg shadow-2xl font-mono text-[12px] font-bold border border-primary flex items-center gap-2 animate-bounce">
          <span className="text-primary font-bold">✓</span>
          <span>{shareToast}</span>
        </div>
      )}

      {/* Floating Mobile Sticky Share Button */}
      <div className="md:hidden fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-full shadow-2xl font-mono text-[12px] font-bold border border-primary/20 hover:bg-primary-dark active:scale-95 transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>SHARE</span>
        </button>
      </div>

      {/* Social Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-mono"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border relative text-text-main"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 p-1.5 text-muted hover:text-text-main rounded-full hover:bg-surface transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <span className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <Share2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-[15px] tracking-wide text-text-main">Share Case Study</h3>
                  <p className="text-[11px] text-muted">Deep link directly to this protocol page</p>
                </div>
              </div>

              {node && (
                <div className="my-4 p-3 bg-[#faf7f2] rounded-xl border border-border">
                  <div className="text-[10px] font-bold text-primary tracking-widest uppercase mb-1">
                    {node.content?.headerId || 'PROTOCOL_ID'}
                  </div>
                  <div className="font-bold text-[13px] text-text-main line-clamp-2">
                    {node.title}
                  </div>
                </div>
              )}

              {/* Direct Social Share Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-[12px] shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12.031 2c-5.516 0-9.99 4.474-9.99 9.99 0 1.763.459 3.479 1.332 4.992l-1.416 5.171 5.293-1.388c1.458.796 3.102 1.215 4.781 1.216h.004c5.515 0 9.989-4.474 9.989-9.99 0-2.668-1.039-5.176-2.924-7.061s-4.392-2.93-7.069-2.93zm0 1.662c2.222 0 4.311.866 5.88 2.435 1.569 1.569 2.433 3.658 2.433 5.88 0 4.595-3.738 8.333-8.333 8.333-1.468 0-2.903-.388-4.162-1.125l-.298-.175-3.097.812.826-3.018-.192-.306c-.808-1.288-1.236-2.776-1.236-4.296 0-4.595 3.738-8.333 8.333-8.333zm-3.666 4.331c-.227 0-.593.085-.903.424-.31.338-1.185 1.157-1.185 2.82 0 1.663 1.213 3.268 1.383 3.494.169.225 2.385 3.642 5.78 5.107.807.348 1.437.556 1.928.712.81.258 1.548.222 2.13.135.651-.097 2.003-.818 2.285-1.607.282-.789.282-1.466.197-1.607-.085-.141-.31-.225-.649-.395s-2.003-.987-2.313-1.1-.536-.169-.762.169c-.226.338-.875 1.1-.1.733-1.353-.169-.225-.451-.366-.789-.141-.338-.028-.684.085-.902.225l.423-.423c.141-.141.188-.239.282-.395.094-.155.047-.296-.019-.423s-.762-1.833-1.044-2.51c-.274-.66-.554-.57-.762-.581h-.651z"/>
                  </svg>
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleShareLinkedIn}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-[#0A66C2] hover:bg-[#0855a3] text-white rounded-xl font-bold text-[12px] shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                  <span>LinkedIn</span>
                </button>
              </div>

              {/* Copy URL Link Section */}
              <div className="p-2.5 bg-[#faf7f2] rounded-xl border border-border flex items-center justify-between gap-2 mb-3">
                <div className="text-[11px] font-mono text-muted truncate select-all pl-1">
                  {getProtocolShareUrl()}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>
              </div>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="w-full py-2.5 px-4 bg-[#faf7f2] hover:bg-border/40 border border-border rounded-xl text-[11px] font-bold text-text-main flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-primary" />
                  <span>More Options (Mobile Native Sheet)</span>
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!deletedSections.includes("header") && (
        <header id="protocol-top-header" className="bg-surface border-b border-border font-mono relative z-10 w-full mb-0 md:mb-6">
          {isEditing && (
            <div className="absolute top-2 right-4 z-50 flex gap-2">
              <button 
                onClick={() => {
                  if (safeConfirm("Are you sure you want to delete the top header bar? You can restore it anytime using the Section Manager below.")) {
                    updateNodeArray('deletedSections', [...deletedSections, "header"]);
                  }
                }}
                className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-[10px] text-white font-mono font-bold rounded shadow-md cursor-pointer transition-colors"
                title="Delete Header Box"
              >
                ✕ Delete Header Box
              </button>
            </div>
          )}
        <div className="flex flex-col md:grid md:grid-cols-[auto_1fr_auto] items-start md:items-center gap-3 md:gap-6 px-4 md:px-10 py-4 relative">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="text-[12px] md:text-[17px] font-bold text-primary tracking-wider max-w-[55vw] md:max-w-none truncate hover:overflow-visible hover:whitespace-normal hover:break-all transition-all z-20">
              <Editable value={node.content.headerId || 'PROJECT_URL'} onChange={(v) => updateNodeContent('headerId', v)} />
            </div>
            {/* Mobile Nav Actions */}
            <div className="md:hidden flex items-center gap-2 shrink-0">
               <div className="flex items-center gap-1 border border-[#e0e3e6] bg-white rounded px-2 py-1 shadow-sm">
                  {(() => {
                    const idx = data.nodes.findIndex(n => n.id === node.id);
                    const prev = data.nodes[idx - 1];
                    const next = data.nodes[idx + 1];
                    return (
                      <>
                        <button disabled={!prev} onClick={() => navigate(`/protocol/${prev.id}`)} className={`flex items-center justify-center font-bold text-[14px] px-1 ${prev ? 'text-text-main' : 'text-muted opacity-30'}`}>←</button>
                        <div className="w-[1px] h-3 bg-[#e0e3e6] mx-1"></div>
                        <button disabled={!next} onClick={() => navigate(`/protocol/${next.id}`)} className={`flex items-center justify-center font-bold text-[14px] px-1 ${next ? 'text-text-main' : 'text-muted opacity-30'}`}>→</button>
                      </>
                    );
                  })()}
               </div>
               <button 
                 onClick={() => setShowShareModal(true)} 
                 className="px-2.5 py-1 bg-white text-text-main border border-[#e0e3e6] hover:border-primary rounded text-[11px] font-mono font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                 title="Share Protocol"
               >
                 <Share2 className="w-3.5 h-3.5 text-primary" />
                 <span>SHARE</span>
               </button>
               <button onClick={() => navigate(-1)} className="p-1.5 bg-surface text-muted border border-border hover:text-text-main rounded shadow-sm z-10 w-[28px] h-[28px] flex items-center justify-center transition-colors">✕</button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[9px] md:text-[11px] uppercase font-bold text-muted min-w-0 w-full md:w-auto">
            <Link to="/" className="hover:text-primary transition-colors whitespace-nowrap">DASH</Link>
            <span className="text-[#c4cad1]">/</span>
            <Link to="/resume" className="hover:text-primary transition-colors whitespace-nowrap uppercase">RESUME</Link>
            <span className="text-[#c4cad1] hidden xs:inline">/</span>
            <span className="text-primary max-w-[50vw] md:max-w-none truncate hover:overflow-visible hover:whitespace-normal hover:break-words transition-all z-20 hover:bg-surface hover:shadow-sm hidden xs:inline">
              <Editable value={node.title} onChange={(v) => updateNodeBase('title', v)} />
            </span>
            {(() => {
              const info = recencyMap[node.id];
              if (!info) return null;
              return (
                <div className="flex items-center gap-1.5 shrink-0 bg-surface pl-2 border-l border-border md:border-none md:pl-0">
                  <span 
                    className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider uppercase border"
                    style={{
                      background: info.intensity === 'highest' ? '#f59e0b15' : 
                                  info.intensity === 'high' ? '#14b8a615' : 
                                  info.intensity === 'medium' ? '#3b82f615' : '#6b728015',
                      borderColor: info.intensity === 'highest' ? '#f59e0b40' : 
                                   info.intensity === 'high' ? '#14b8a640' : 
                                   info.intensity === 'medium' ? '#3b82f640' : '#6b728020',
                      color: info.intensity === 'highest' ? '#d97706' : 
                             info.intensity === 'high' ? '#0d9488' : 
                             info.intensity === 'medium' ? '#2563eb' : '#4b5563',
                    }}
                  >
                    ● {info.badgeLabel}
                  </span>
                  <span className="text-[9.5px] font-mono text-muted whitespace-nowrap lowercase">
                    ({info.timeAgo})
                  </span>
                </div>
              );
            })()}
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 border border-[#e0e3e6] rounded py-1 px-3">
               {(() => {
                 const idx = data.nodes.findIndex(n => n.id === node.id);
                 const prev = data.nodes[idx - 1];
                 const next = data.nodes[idx + 1];
                 return (
                   <>
                     <button 
                       disabled={!prev} 
                       onClick={() => navigate(`/protocol/${prev.id}`)}
                       className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${prev ? 'text-text-main hover:text-primary' : 'text-muted opacity-30 cursor-not-allowed'}`}
                     >
                       <span>←</span> PREV
                     </button>
                     <div className="w-[1px] h-4 bg-[#e0e3e6] mx-1"></div>
                     <span className="text-[10px] font-mono font-bold text-muted px-1">{idx + 1}/{data.nodes.length}</span>
                     <div className="w-[1px] h-4 bg-[#e0e3e6] mx-1"></div>
                     <button 
                       disabled={!next} 
                       onClick={() => navigate(`/protocol/${next.id}`)}
                       className={`flex items-colors gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${next ? 'text-text-main hover:text-primary' : 'text-muted opacity-30 cursor-not-allowed'}`}
                     >
                       NEXT <span>→</span>
                     </button>
                   </>
                 );
               })()}
            </div>
            <button 
              className="flex items-center gap-2 px-3 py-2 border border-[#e0e3e6] rounded text-[11.5px] text-muted tracking-wider cursor-pointer hover:border-primary transition-colors bg-white shadow-sm font-mono font-bold"
              onClick={() => setShowShareModal(true)}
            >
              <Share2 className="w-3.5 h-3.5 text-primary" />
              <span>SHARE</span>
            </button>
          </div>
        </div>

        {/* Floating Side Nav */}
        <div className="hidden lg:block">
           {(() => {
              const idx = data.nodes.findIndex(n => n.id === node.id);
              const prev = data.nodes[idx - 1];
              const next = data.nodes[idx + 1];
              return (
                <>
                  {prev && (
                    <button 
                      onClick={() => navigate(`/protocol/${prev.id}`)}
                      className="fixed left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-surface/80 backdrop-blur border border-border rounded-full flex items-center justify-center text-text-main hover:bg-primary hover:text-white hover:border-primary transition-all z-40 shadow-sm"
                      title="Previous Case"
                    >
                      ←
                    </button>
                  )}
                  {next && (
                    <button 
                      onClick={() => navigate(`/protocol/${next.id}`)}
                      className="fixed right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-surface/80 backdrop-blur border border-border rounded-full flex items-center justify-center text-text-main hover:bg-primary hover:text-white hover:border-primary transition-all z-40 shadow-sm"
                      title="Next Case"
                    >
                      →
                    </button>
                  )}
                </>
              );
           })()}
        </div>

        {/* Mobile Floating Nav Overlay */}
        <div className="lg:hidden fixed bottom-6 left-0 right-0 px-6 flex justify-between items-center pointer-events-none z-50">
           {(() => {
              const idx = data.nodes.findIndex(n => n.id === node.id);
              const prev = data.nodes[idx - 1];
              const next = data.nodes[idx + 1];
              return (
                <>
                  <div className="pointer-events-auto">
                    {prev && (
                      <button 
                        onClick={() => navigate(`/protocol/${prev.id}`)}
                        className="w-8 h-8 bg-surface/90 backdrop-blur border border-border rounded-full flex items-center justify-center text-text-main shadow-lg"
                      >
                        ←
                      </button>
                    )}
                  </div>
                  <div className="pointer-events-auto">
                    {next && (
                      <button 
                        onClick={() => navigate(`/protocol/${next.id}`)}
                        className="w-8 h-8 bg-primary backdrop-blur border border-primary rounded-full flex items-center justify-center text-white shadow-lg"
                      >
                        →
                      </button>
                    )}
                  </div>
                </>
              );
           })()}
        </div>
        
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] border-t border-border">
          <div className="p-3 md:px-10 md:py-3.5 border-r border-b md:border-b-0 border-border flex flex-col gap-0.5 min-w-0">
            <div className="text-[8px] md:text-[10.5px] font-bold tracking-[0.1em] text-muted uppercase">Role</div>
            <div className="text-[11px] md:text-[17px] font-bold text-text-main tracking-wide break-words leading-none">
               <Editable value={node.content.role} onChange={(v) => updateNodeContent('role', v)} />
            </div>
          </div>
          <div className="p-3 md:px-10 md:py-3.5 border-r border-b md:border-b-0 border-border flex flex-col gap-0.5 min-w-0">
            <div className="text-[8px] md:text-[10.5px] font-bold tracking-[0.1em] text-muted uppercase">Duration</div>
            <div className="text-[11px] md:text-[17px] font-bold text-text-main tracking-wide break-words leading-none">
               <Editable value={node.date} onChange={(v) => updateNodeBase('date', v)} />
            </div>
          </div>
          <div className="p-3 md:px-10 md:py-3.5 border-r border-b lg:border-b-0 border-border flex flex-col gap-0.5 min-w-0">
            <div className="text-[8px] md:text-[10.5px] font-bold tracking-[0.1em] text-muted uppercase">Scope</div>
            <div className="text-[11px] md:text-[17px] font-bold text-text-main tracking-wide break-words leading-none">
               <Editable value={node.content.scope} onChange={(v) => updateNodeContent('scope', v)} />
            </div>
          </div>
          <div className="p-3 md:px-10 md:py-3.5 flex flex-col gap-0.5 border-b lg:border-b-0 lg:border-r border-border min-w-0">
            <div className="text-[8px] md:text-[10.5px] font-bold tracking-[0.1em] text-muted uppercase">Status</div>
            <div className="text-[11px] md:text-[17px] font-bold text-primary tracking-wide break-words leading-none">
               <Editable value={node.content.status} onChange={(v) => updateNodeContent('status', v)} />
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center p-4 min-w-[60px] cursor-pointer hover:bg-[#faf7f2] transition-colors" onClick={() => navigate(-1)}>
             <X className="w-6 h-6 text-muted hover:text-text-main" />
          </div>
        </div>
        </header>
      )}

      <section className="max-w-[700px] w-full mx-auto px-4 md:px-12 pt-8 md:pt-14 flex flex-col items-start gap-4 md:gap-5">
          {/* Title */}
          <h1 
            className="font-black leading-[1.05] tracking-tight text-text-main mb-2 break-words"
            style={{ 
              fontSize: (node.title?.length || 0) > 40 
                ? "clamp(26px, 7vw, 38px)" 
                : "clamp(32px, 8vw, 52px)" 
            }}
          >
            <Editable value={node.title} onChange={(v) => updateNodeBase('title', v)} />
          </h1>
          
          {/* Description */}
          <div className="text-[14px] md:text-[17px] text-muted leading-relaxed max-w-[600px]">
            <Editable multiline value={node.description} onChange={(v) => updateNodeBase('description', v)} />
          </div>
      </section>

      <section className="max-w-[940px] w-full mx-auto px-4 md:px-12 pt-6 md:pt-9 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-stretch mb-8 md:mb-12">
        <div className="relative rounded-2xl bg-gradient-to-br from-[#fbf6ec] to-[#f3eee5] border border-border overflow-hidden min-h-[240px] flex items-center justify-center shadow-[0_4px_14px_rgba(54,38,12,0.06)] group">
          <div className="absolute top-3.5 left-3.5 bg-text-main text-[#fdf6e8] font-mono text-[10px] font-bold px-2.5 py-1 rounded tracking-widest uppercase z-10 opacity-70 group-hover:opacity-100 transition-opacity">
             <Editable value={node.content.figName || 'Cover Image'} onChange={(v) => updateNodeContent('figName', v)} />
          </div>
          {node.assets?.bgImageUrl ? (
            <>
              <img 
                src={node.assets.bgImageUrl} 
                alt="Hero" 
                className="absolute inset-0 w-full h-full object-cover animate-fade-in" 
                referrerPolicy="no-referrer"
              />
              {isEditing && (
                <div className="absolute inset-0 bg-[#1f1b16]/75 backdrop-blur-[2px] opacity-0 hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-3.5 z-10 p-4">
                  <span className="text-white font-mono text-[10px] tracking-widest uppercase font-black bg-[#11a877] px-2 py-0.5 rounded shadow">
                    Active Cover Image
                  </span>
                  
                  <div className="w-[180px]">
                    <FileUploader 
                      accept="image/*" 
                      label="REPLACE COVER IMAGE" 
                      onUploadComplete={(url) => updateNodeAsset('bgImageUrl', url)} 
                    />
                  </div>

                  <button 
                    onClick={() => {
                      if (safeConfirm("Are you sure you want to permanently clear this cover image?")) {
                        updateNodeAsset('bgImageUrl', '');
                      }
                    }} 
                    className="text-[10px] font-mono font-bold text-red-200 hover:text-white transition-colors cursor-pointer uppercase bg-red-950/60 hover:bg-red-900 border border-red-500/30 hover:border-red-500 px-3 py-1.5 rounded"
                  >
                    ✕ Clear Image
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center font-mono text-[11px] text-muted uppercase tracking-widest z-10 relative pointer-events-auto">
              <div className="w-14 h-14 rounded-xl bg-surface border-[1.5px] border-dashed border-[#e2d9c5] flex items-center justify-center mx-auto mb-2 text-[#d97a2c]">
              </div>
              <div className="font-bold text-[#4a443c] mb-2 pointer-events-none">Dashboard cover image</div>
              <div className="font-display tracking-normal normal-case mt-1.5 z-20 relative">
                {isEditing ? <FileUploader accept="image/*" label="UPLOAD IMAGE" onUploadComplete={(url) => updateNodeAsset('bgImageUrl', url)} /> : 'No image uploaded'}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          {recentlyUploaded.systemFlowUrl && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 p-3 rounded-xl flex items-center gap-2 mb-2 font-mono text-[11px]">
              <span className="text-emerald-600 font-bold">✓</span> Flow diagram uploaded successfully!
            </div>
          )}
          {node.assets?.systemFlowUrl ? (
             <div className="grid grid-cols-[44px_1fr_auto] gap-3.5 items-center p-3.5 bg-surface border border-border rounded-xl hover:border-text-main transition-all duration-150 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(31,27,22,0.12)] cursor-pointer relative" onClick={() => setShowFlowLightbox(true)}>
               <div className="w-10 h-10 rounded-[10px] bg-text-main text-white grid place-items-center font-mono text-[11px] font-black tracking-wide">FLO</div>
               <div>
                 <div className="flex items-center gap-2">
                   <div className="font-bold text-[13.5px] text-text-main">System flow diagram</div>
                   {recentlyUploaded.systemFlowUrl && (
                     <span className="bg-emerald-500 text-white font-mono text-[8px] font-bold px-1 py-0.5 rounded uppercase tracking-wider animate-bounce">SUCCESS</span>
                   )}
                 </div>
                 <div className="text-[11px] text-muted font-mono tracking-wide mt-0.5">Interactive · Overview</div>
               </div>
               <div className="text-muted font-mono font-bold">→</div>
               {isEditing && <button onClick={(e) => { e.stopPropagation(); updateNodeAsset('systemFlowUrl', ''); }} className="absolute right-1 top-1 text-[9px] text-red-500 font-bold">X</button>}
             </div>
          ) : (
            isEditing && (
              <div className="p-3 bg-surface border border-dashed border-border rounded-xl">
                 <FileUploader accept="image/*" label="UPLOAD SYSTEM FLOW" onUploadComplete={(url) => handleUploadComplete('systemFlowUrl', url)} />
              </div>
            )
          )}

          {recentlyUploaded.videoUrl && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 p-3 rounded-xl flex items-center gap-2 mb-2 font-mono text-[11px]">
              <span className="text-emerald-600 font-bold">✓</span> Walkthrough video uploaded successfully! Ready to play.
            </div>
          )}
          {node.assets?.videoUrl ? (
            <div className="grid grid-cols-[44px_1fr_auto] gap-3.5 items-center p-3.5 bg-surface border border-border rounded-xl hover:border-[#2f6f9f] transition-all duration-150 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(47,111,159,0.12)] cursor-pointer relative" onClick={() => handleOpenDocument('video', node.assets?.videoUrl || '')}>
               <div className="w-10 h-10 rounded-[10px] bg-[#2f6f9f] text-white grid place-items-center font-mono text-[11px] font-black tracking-wide pl-0.5">▶</div>
               <div>
                 <div className="flex items-center gap-2">
                   <div className="font-bold text-[13.5px] text-text-main">Walkthrough video</div>
                   {recentlyUploaded.videoUrl && (
                     <span className="bg-emerald-500 text-white font-mono text-[8px] font-bold px-1 py-0.5 rounded uppercase tracking-wider animate-bounce">SUCCESS</span>
                   )}
                 </div>
                 <div className="text-[11px] text-muted font-mono tracking-wide mt-0.5 whitespace-nowrap hover:text-text-main" onClick={(e) => { if(isEditing) e.stopPropagation(); }}><Editable value={node.assets.videoDuration || '2 min'} onChange={(v) => updateNodeAsset('videoDuration', v)} /> · MP4</div>
               </div>
               <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                 <a 
                   href={`/api/download?url=${encodeURIComponent(node.assets?.videoUrl || '')}`}
                   download
                   className="p-1.5 hover:bg-black/5 rounded-md transition-all text-muted hover:text-primary flex items-center justify-center"
                   title="Download video"
                 >
                   <Download className="w-4 h-4" />
                 </a>
                 <div className="text-muted font-mono font-bold">→</div>
               </div>
             {isEditing && <button onClick={(e) => { e.stopPropagation(); updateNodeAsset('videoUrl', ''); }} className="absolute right-1 top-1 text-[9px] text-red-500 font-bold">X</button>}
            </div>
          ) : (
            isEditing && (
              <div className="p-3 bg-surface border border-dashed border-border rounded-xl">
                 <FileUploader accept="video/*" label="UPLOAD VIDEO" onUploadComplete={(url) => handleUploadComplete('videoUrl', url)} />
              </div>
            )
          )}

          {recentlyUploaded.deckUrl && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 p-3 rounded-xl flex items-center gap-2 mb-2 font-mono text-[11px]">
              <span className="text-emerald-600 font-bold">✓</span> PDF Deck uploaded successfully! Ready to view page by page.
            </div>
          )}
          {node.assets?.deckUrl ? (
            <div className="grid grid-cols-[44px_1fr_auto] gap-3.5 items-center p-3.5 bg-surface border border-border rounded-xl hover:border-[#c0492a] transition-all duration-150 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(192,73,42,0.12)] cursor-pointer relative" onClick={() => handleOpenDocument('deck', node.assets?.deckUrl || '')}>
               <div className="w-10 h-10 rounded-[10px] bg-[#c0492a] text-white grid place-items-center font-mono text-[10px] font-black tracking-wide">PDF</div>
               <div>
                 <div className="flex items-center gap-2">
                   <div className="font-bold text-[13.5px] text-text-main">View / save as PDF</div>
                   {recentlyUploaded.deckUrl && (
                     <span className="bg-emerald-500 text-white font-mono text-[8px] font-bold px-1 py-0.5 rounded uppercase tracking-wider animate-bounce">SUCCESS</span>
                   )}
                 </div>
                 <div className="text-[11px] text-muted font-mono tracking-wide mt-0.5 whitespace-nowrap hover:text-text-main" onClick={(e) => { if (isEditing) e.stopPropagation(); }}><Editable value={node.assets.deckSize || 'All pages'} onChange={(v) => updateNodeAsset('deckSize', v)} /> · Deck</div>
               </div>
               <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                 <a 
                   href={`/api/download?url=${encodeURIComponent(node.assets?.deckUrl || '')}`}
                   download
                   className="p-1.5 hover:bg-black/5 rounded-md transition-all text-muted hover:text-[#c0492a] flex items-center justify-center"
                   title="Download PDF"
                 >
                   <Download className="w-4 h-4" />
                 </a>
                 <div className="text-muted font-mono font-bold">→</div>
               </div>
            {isEditing && <button onClick={(e) => { e.stopPropagation(); updateNodeAsset('deckUrl', ''); }} className="absolute right-1 top-1 text-[9px] text-red-500 font-bold">X</button>}
            </div>
          ) : (
            isEditing && (
              <div className="p-3 bg-surface border border-dashed border-border rounded-xl">
                 <FileUploader accept=".pdf,.ppt,.pptx" label="UPLOAD DECK" onUploadComplete={(url) => handleUploadComplete('deckUrl', url)} />
              </div>
            )
          )}

          {recentlyUploaded.workingViewUrl && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 p-3 rounded-xl flex items-center gap-2 mb-2 font-mono text-[11px]">
              <span className="text-emerald-600 font-bold">✓</span> Connected Website / Working View URL configured!
            </div>
          )}
          {node.assets?.workingViewUrl ? (
            <div className="grid grid-cols-[44px_1fr_auto] gap-3.5 items-center p-3.5 bg-surface border border-border rounded-xl hover:border-primary transition-all duration-150 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(11,195,178,0.12)] cursor-pointer relative" onClick={() => handleOpenDocument('website', node.assets?.workingViewUrl || '')}>
               <div className="w-10 h-10 rounded-[10px] bg-primary text-white grid place-items-center font-mono text-[10px] font-black tracking-wide">WEB</div>
               <div className="overflow-hidden">
                 <div className="flex items-center gap-2">
                   <div className="font-bold text-[13.5px] text-text-main truncate">Connected Website</div>
                   {recentlyUploaded.workingViewUrl && (
                     <span className="bg-emerald-500 text-white font-mono text-[8px] font-bold px-1 py-0.5 rounded uppercase tracking-wider animate-bounce">SUCCESS</span>
                   )}
                 </div>
                 <div className="text-[11px] text-muted font-mono tracking-wide mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1.5" onClick={(e) => { if (isEditing) e.stopPropagation(); }}>
                   {isEditing ? (
                     <div className="w-full flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                       <span className="text-[9px] text-primary font-bold">URL:</span>
                       <Editable value={node.assets.workingViewUrl || ''} onChange={(v) => updateNodeAsset('workingViewUrl', v)} placeholder="https://example.com" />
                     </div>
                   ) : (
                     <span className="truncate max-w-[160px] inline-block">{node.assets.workingViewUrl}</span>
                   )}
                   {!isEditing && <span className="text-muted/50">· Live View</span>}
                 </div>
               </div>
               <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                 <a 
                   href={node.assets?.workingViewUrl?.startsWith('http') ? node.assets?.workingViewUrl : 'https://' + node.assets?.workingViewUrl}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="p-1.5 hover:bg-black/5 rounded-md transition-all text-muted hover:text-primary flex items-center justify-center"
                   title="Open website in new tab"
                 >
                   <ExternalLink className="w-4 h-4" />
                 </a>
                 <div className="text-muted font-mono font-bold">→</div>
               </div>
            {isEditing && <button onClick={(e) => { e.stopPropagation(); updateNodeAsset('workingViewUrl', ''); }} className="absolute right-1 top-1 text-[9px] text-red-500 font-bold hover:text-red-700">X</button>}
            </div>
          ) : (
            isEditing && (
              <div className="p-3 bg-surface border border-dashed border-border rounded-xl">
                 <div className="text-[10px] font-mono font-bold text-muted uppercase tracking-wider mb-1.5">Add Connected Website / Working View URL</div>
                 <div className="flex gap-2">
                   <input 
                     type="text"
                     placeholder="e.g. https://example.com"
                     className="flex-1 bg-surface border border-border px-2.5 py-1.5 rounded text-xs outline-none focus:border-primary font-mono text-text-main"
                     id="working-view-url-input"
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         const val = (e.currentTarget as HTMLInputElement).value.trim();
                         if (val) {
                           updateNodeAsset('workingViewUrl', val);
                           handleUploadComplete('workingViewUrl', val);
                         }
                       }
                     }}
                   />
                   <button 
                     onClick={() => {
                       const input = document.getElementById('working-view-url-input') as HTMLInputElement;
                       const val = input?.value.trim();
                       if (val) {
                         updateNodeAsset('workingViewUrl', val);
                         handleUploadComplete('workingViewUrl', val);
                       }
                     }}
                     className="bg-primary hover:bg-[#0bc3b2] text-white px-3 py-1.5 text-[10px] font-mono font-bold rounded uppercase cursor-pointer transition-colors"
                   >
                     Add
                   </button>
                 </div>
              </div>
            )
          )}
        </div>
      </section>

      <div className="max-w-[940px] w-full mx-auto px-4 md:px-12 pb-24">
        {/* Case Navigation Footer */}
        <div className="border-t border-border pt-12 pb-8 flex flex-col md:flex-row justify-between items-center gap-6">
          {(() => {
            const idx = data.nodes.findIndex(n => n.id === node.id);
            const prev = data.nodes[idx - 1];
            const next = data.nodes[idx + 1];
            return (
              <>
                {prev ? (
                  <button 
                    onClick={() => navigate(`/protocol/${prev.id}`)}
                    className="flex-1 w-full flex flex-col items-start gap-1 p-5 rounded-xl border border-border bg-surface hover:border-primary transition-all group"
                  >
                    <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">Previous Case</span>
                    <span className="text-[15px] font-bold text-text-main group-hover:text-primary transition-colors truncate w-full text-left">← {prev.title}</span>
                  </button>
                ) : <div className="flex-1 hidden md:block"></div>}
                
                <div className="hidden md:flex flex-col items-center gap-1 min-w-[120px]">
                  <span className="text-[10px] font-mono text-muted uppercase font-bold">Progress</span>
                  <span className="text-[13px] font-bold text-text-main">{idx + 1} of {data.nodes.length}</span>
                </div>

                {next ? (
                  <button 
                    onClick={() => navigate(`/protocol/${next.id}`)}
                    className="flex-1 w-full flex flex-col items-end gap-1 p-5 rounded-xl border border-border bg-surface hover:border-primary transition-all group"
                  >
                    <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">Next Case</span>
                    <span className="text-[15px] font-bold text-text-main group-hover:text-primary transition-colors truncate w-full text-right">{next.title} →</span>
                  </button>
                ) : <div className="flex-1 hidden md:block"></div>}
              </>
            );
          })()}
        </div>
        
        {node.content?.customHtml ? (
          <div className="w-full relative mt-4">
            {isEditing && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-yellow-50 border border-yellow-200/60 p-3.5 rounded-xl mb-6 text-xs font-mono text-[#d97a2c] gap-3">
                <span className="leading-relaxed">
                  ⚡ <strong>Custom HTML Design Active</strong> (Renders the pasted HTML/Tailwind layout precisely as-is).<br />
                  💡 <strong>In-Place Editing Enabled:</strong> You can click directly on any text or element below to edit or delete it securely. All changes are saved on-the-fly when you click outside!
                </span>
                <button 
                  onClick={() => {
                    if (safeConfirm("Are you sure you want to dismiss the custom HTML design? This will restore the editable standard layout content.")) {
                      updateNodeContent('customHtml', '');
                    }
                  }}
                  className="underline font-black hover:text-red-600 transition-colors cursor-pointer block text-left shrink-0"
                >
                  [ Clear Custom HTML & Show Standard Layout ]
                </button>
              </div>
            )}
            {isEditing && deletedSections.length > 0 && (
              <div className="mb-6 p-4 bg-[#faf7f2] border border-[#ece5d6] rounded-xl text-xs font-mono">
                <div className="flex items-center gap-2 mb-2 font-bold text-text-main">
                  <span>🔄</span> RESTORE HIDDEN OR DELETED SECTIONS:
                </div>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const hLabels: any = {
                      "header": "00 · Top header bar (ID, Nav, Status)",
                      "01": "01 · Problem statement",
                      "02": "02 · Solution",
                      "03": "03 · Solution flow",
                      "04": "04 · System flow",
                      "05": "05 · Impact metrics",
                      "06": "06 · Target audience",
                      "07": "07 · Category / product bucket",
                      "08": "08 · What this asset proves",
                      "09": "09 · Use in GTM / launch",
                      "10": "10 · Next-phase scaling / blueprint",
                      "11": "11 · Carrier / node specs",
                      "12": "12 · Tech stack and components",
                      "13": "13 · Operational governance",
                      "14": "14 · Performance & SLO targets",
                      "15": "15 · Financial verification logic",
                      "16": "16 · System telemetry rules",
                      "17": "17 · Risk & mitigations matrix",
                      "18": "18 · Appendix / additional documentation"
                    };
                    return deletedSections.map((secTag: string) => (
                      <button
                        key={secTag}
                        onClick={() => {
                          updateNodeArray('deletedSections', deletedSections.filter((t: string) => t !== secTag));
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#ece5d6] hover:border-primary text-text-main rounded text-[11px] font-bold hover:text-primary transition-all cursor-pointer shadow-sm"
                      >
                        ＋ Restore {hLabels[secTag] || `${secTag} · Custom Section`}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}
            <div 
              className={`custom-html-rendered-layout w-full max-w-full overflow-x-auto break-words transition-all ${isEditing ? 'border border-dashed border-primary/40 p-3 rounded-2xl bg-[#faf7f2]/40 focus:outline-none focus:ring-1 focus:ring-primary/20 min-h-[300px]' : ''}`} 
              contentEditable={isEditing}
              suppressContentEditableWarning
              onClick={(e) => {
                if (isEditing) return; // Don't intercept clicks when editing text

                // Dynamic click delegation to intercept copied static container clicks
                const target = e.target as HTMLElement;
                const closestLink = target.closest('div, button, a');
                if (!closestLink) return;

                const text = closestLink.textContent || "";
                
                if (text.includes("System flow diagram") || text.includes("FLO")) {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFlowLightbox(true);
                } else if (text.includes("Walkthrough video") || text.includes("Walkthrough") || text.includes("videoDuration")) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenDocument('video', node.assets?.videoUrl || '');
                } else if (text.includes("View / save as PDF") || text.includes("PDF") || text.includes("deckSize")) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenDocument('deck', node.assets?.deckUrl || '');
                }
              }}
              onBlur={(e) => {
                const newHtml = e.currentTarget.innerHTML;
                updateNodeContent('customHtml', newHtml);
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeCustomHtml(node.content.customHtml) }} 
            />
          </div>
        ) : (
          <>
            {isEditing && deletedSections.length > 0 && (
              <div className="mb-8 p-5 bg-[#faf7f2] border border-[#ece5d6] rounded-xl border-l-[6px] border-l-[#d97a2c]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🔄</span>
                  <span className="font-mono text-xs font-bold tracking-wider text-text-main uppercase">
                    Restore Hidden or Deleted Sections
                  </span>
                </div>
                <p className="text-[12.5px] text-muted mb-3 leading-relaxed">
                  The following sections were hidden or deleted. You can restore them back to the active page layout:
                </p>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const sectionLabels: any = {
                      "header": "00 · Top header bar (ID, Nav, Status)",
                      "01": "01 · Problem statement",
                      "02": "02 · Solution",
                      "03": "03 · Solution flow",
                      "04": "04 · System flow",
                      "05": "05 · Impact metrics",
                      "06": "06 · Target audience",
                      "07": "07 · Category / product bucket",
                      "08": "08 · What this asset proves",
                      "09": "09 · Use in GTM / launch",
                      "10": "10 · Next-phase scaling / blueprint",
                      "11": "11 · Carrier / node specs",
                      "12": "12 · Tech stack and components",
                      "13": "13 · Operational governance",
                      "14": "14 · Performance & SLO targets",
                      "15": "15 · Financial verification logic",
                      "16": "16 · System telemetry rules",
                      "17": "17 · Risk & mitigations matrix",
                      "18": "18 · Appendix / additional documentation"
                    };
                    return deletedSections.map((secTag: string) => (
                      <button
                        key={secTag}
                        onClick={() => {
                          updateNodeArray('deletedSections', deletedSections.filter((t: string) => t !== secTag));
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#ece5d6] text-[#1f1b16] rounded-lg text-[12px] font-semibold hover:border-primary hover:text-primary transition-all shadow-sm cursor-pointer"
                      >
                        <span className="text-primary font-bold font-mono">＋</span> Restore {sectionLabels[secTag] || `${secTag} · Custom Section`}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}

            {(() => {
              const showSection1 = !deletedSections.includes("01");
              const showSection2 = !deletedSections.includes("02");
              if (!showSection1 && !showSection2) return null;
              return (
                <div className={`grid grid-cols-1 ${showSection1 && showSection2 ? 'md:grid-cols-2' : ''} gap-4 mb-8`}>
                  {showSection1 && (
                    <div className="p-5 md:p-6 rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(54,38,12,0.04)] border-l-[5px] border-l-[#c0492a] relative overflow-hidden group">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-[10.5px] font-bold tracking-[0.16em] uppercase text-[#c0492a]">
                          <Editable value={node.content.section1 || '01 · Problem statement'} onChange={(v) => updateNodeContent('section1', v)} />
                        </div>
                        {isEditing && (
                          <button 
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete Section 01 (Problem Statement)?")) {
                                updateNodeArray('deletedSections', [...deletedSections, "01"]);
                              }
                            }} 
                            className="text-red-500 text-[9px] font-mono font-bold opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap cursor-pointer border border-red-200 bg-red-50/50 px-1.5 py-0.5 rounded hover:bg-red-100"
                          >
                            ✕ Delete Section
                          </button>
                        )}
                      </div>
                      <div className="text-[20px] font-bold tracking-tight text-text-main mb-3 leading-snug"><Editable value={node.content.problemTitle || 'What is the problem?'} onChange={(v) => updateNodeContent('problemTitle', v)} /></div>
                      <div className="text-[13.5px] leading-relaxed text-[#4a443c] whitespace-pre-wrap">
                         <Editable multiline value={node.content.problem} onChange={(v) => updateNodeContent('problem', v)} />
                      </div>
                    </div>
                  )}
                  
                  {showSection2 && (
                    <div className="p-5 md:p-6 rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(54,38,12,0.04)] border-l-[5px] border-l-[#4f8a5b] relative overflow-hidden group">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-[10.5px] font-bold tracking-[0.16em] uppercase text-[#2d5e36]">
                          <Editable value={node.content.section2 || '02 · Solution'} onChange={(v) => updateNodeContent('section2', v)} />
                        </div>
                        {isEditing && (
                          <button 
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete Section 02 (Solution)?")) {
                                updateNodeArray('deletedSections', [...deletedSections, "02"]);
                              }
                            }} 
                            className="text-red-500 text-[9px] font-mono font-bold opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap cursor-pointer border border-red-200 bg-red-50/50 px-1.5 py-0.5 rounded hover:bg-red-100"
                          >
                            ✕ Delete Section
                          </button>
                        )}
                      </div>
                      <div className="text-[20px] font-bold tracking-tight text-text-main mb-3 leading-snug">
                         <Editable value={node.content.solutionTitle || 'Our Solution'} onChange={(v) => updateNodeContent('solutionTitle', v)} />
                      </div>
                      <div className="text-[13.5px] leading-relaxed text-[#4a443c] whitespace-pre-wrap">
                         <Editable multiline value={node.content.solutions} onChange={(v) => updateNodeContent('solutions', v)} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {!deletedSections.includes("03") && (
              <Section 
                tag="03" 
                title={<Editable value={node.content.sectionSolutionFlow || 'Solution flow · how a brand uses it'} onChange={(v) => updateNodeContent('sectionSolutionFlow', v)} />}
                subTitle={<Editable value={node.content.solutionFlowSubtitle || 'From morning glance to month-end invoice — one surface.'} onChange={(v) => updateNodeContent('solutionFlowSubtitle', v)} />}
                isEditing={isEditing}
                onDelete={() => {
                  if (window.confirm("Are you sure you want to delete Section 03 (Solution Flow)?")) {
                    updateNodeArray('deletedSections', [...deletedSections, "03"]);
                  }
                }}
              >
               <div className="flex flex-col gap-2 mt-2.5">
                 {(node.content.solutionFlow || []).map((step: any, i: number) => (
                    <div key={step.id} className="grid grid-cols-[28px_1fr] gap-3.5 p-3 md:p-3.5 bg-surface border border-border rounded-[10px] items-start relative group">
                       <div className="w-[26px] h-[26px] rounded-full bg-text-main text-[#fdf6e8] grid place-items-center font-mono font-bold text-[11.5px] mt-px">
                          <Editable value={step.n} onChange={(v) => updateNodeArray('solutionFlow', node.content.solutionFlow.map((s: any) => s.id === step.id ? {...s, n: v} : s))} />
                       </div>
                       <div className="pt-px">
                          <div className="font-bold text-[13.5px] text-text-main">
                             <Editable value={step.t} onChange={(v) => updateNodeArray('solutionFlow', node.content.solutionFlow.map((s: any) => s.id === step.id ? {...s, t: v} : s))} />
                          </div>
                          <div className="text-[12.5px] text-muted mt-0.5 leading-relaxed">
                             <Editable multiline value={step.d} onChange={(v) => updateNodeArray('solutionFlow', node.content.solutionFlow.map((s: any) => s.id === step.id ? {...s, d: v} : s))} />
                          </div>
                       </div>
                       {isEditing && (
                         <button onClick={() => { if (window.confirm("Are you sure you want to delete this flow step?")) { updateNodeArray('solutionFlow', node.content.solutionFlow.filter((s: any) => s.id !== step.id)); } }} className="absolute top-2 right-2 text-red-500 font-bold p-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                       )}
                    </div>
                 ))}
                 {isEditing && (
                   <button onClick={() => updateNodeArray('solutionFlow', [...(node.content.solutionFlow || []), { id: Date.now().toString(), n: String((node.content.solutionFlow?.length || 0) + 1), t: "New Step", d: "Describe user action" }])} className="p-3 border border-dashed border-border rounded-[10px] text-[10px] font-mono font-bold text-muted hover:border-primary hover:text-primary transition-colors flex items-center justify-center min-h-[50px]">
                     + ADD STEP
                   </button>
                 )}
               </div>
            </Section>
          )}

          {!deletedSections.includes("04") && (
              <Section 
                tag="04" 
                title={<Editable value={node.content.sectionSystemFlow || 'System flow · how the data moves'} onChange={(v) => updateNodeContent('sectionSystemFlow', v)} />}
                subTitle={<Editable value={node.content.systemFlowSubtitle || '3PL telemetry → brand portal → write-back actions.'} onChange={(v) => updateNodeContent('systemFlowSubtitle', v)} />}
                isEditing={isEditing}
                onDelete={() => {
                  if (window.confirm("Are you sure you want to delete Section 04 (System Flow)?")) {
                    updateNodeArray('deletedSections', [...deletedSections, "04"]);
                  }
                }}
              >
               {isEditing && (
                 <div className="text-[#4a443c] max-w-[720px] mb-3 whitespace-pre-wrap">
                    <Editable multiline value={node.content.systemFlowContent} onChange={(v) => updateNodeContent('systemFlowContent', v)} />
                 </div>
               )}
               
               <div className="flex flex-row flex-nowrap overflow-x-auto lg:overflow-x-visible items-stretch gap-2 sm:gap-3 lg:gap-4 mt-3 pb-3 scrollbar-none w-full relative">
                 {(node.content.systemFlow || []).map((box: any, i: number) => (
                   <Fragment key={box.id}>
                     {i > 0 && (
                       <div className="flex items-center justify-center shrink-0 text-[#d97a2c] font-bold text-lg sm:text-xl lg:text-2xl px-1 select-none">
                         →
                       </div>
                     )}
                     <div className="flex-1 min-w-[150px] sm:min-w-[180px] md:min-w-[200px] lg:min-w-0 p-3.5 pb-4 md:p-4 md:pb-5 rounded-xl border border-border bg-white shadow-sm relative group flex flex-col justify-start">
                       <div className="text-[10px] md:text-[10.5px] font-mono font-bold tracking-[0.14em] uppercase text-muted leading-none mb-1">
                          <Editable value={box.layer} onChange={(v) => updateNodeArray('systemFlow', (node.content.systemFlow || []).map((b: any) => b.id === box.id ? {...b, layer: v} : b))} />
                       </div>
                       <div className="font-sans font-bold text-[13px] md:text-[14px] leading-snug mt-1 text-text-main">
                          <Editable value={box.name} onChange={(v) => updateNodeArray('systemFlow', (node.content.systemFlow || []).map((b: any) => b.id === box.id ? {...b, name: v} : b))} />
                       </div>
                       <div className="text-[11.5px] text-muted mt-1.5 leading-relaxed font-normal">
                          <Editable multiline value={box.what} onChange={(v) => updateNodeArray('systemFlow', (node.content.systemFlow || []).map((b: any) => b.id === box.id ? {...b, what: v} : b))} />
                       </div>
                       {isEditing && (
                         <button onClick={() => { if (window.confirm("Are you sure you want to delete this process node?")) { updateNodeArray('systemFlow', (node.content.systemFlow || []).filter((b: any) => b.id !== box.id)); } }} className="absolute top-1 right-1 text-red-500 font-bold p-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                       )}
                     </div>
                   </Fragment>
                 ))}
                 {isEditing && (
                   <button onClick={() => updateNodeArray('systemFlow', [...(node.content.systemFlow || []), { id: Date.now().toString(), layer: 'LAYER', name: 'PROCESS_NODE', what: 'Describe process step' }])} className="p-4 border border-dashed border-border rounded-xl text-[11px] font-mono font-bold text-muted hover:border-primary hover:text-primary transition-colors flex items-center justify-center min-w-[120px] shrink-0">
                     + ADD NODE
                   </button>
                 )}
               </div>

               {node.content.solutionCode && (
                 <div className="p-4 bg-surface border border-border rounded-xl font-mono text-[12px] overflow-x-auto whitespace-pre-wrap text-text-main mt-4 relative">
                   <Editable multiline value={node.content.solutionCode} onChange={(v) => updateNodeContent('solutionCode', v)} />
                   {isEditing && (
                     <button 
                       onClick={() => {
                         if (window.confirm("Are you sure you want to delete the code block?")) {
                           updateNodeContent('solutionCode', '');
                         }
                       }} 
                       className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-white/95 border border-border shadow-sm rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase cursor-pointer z-10"
                     >
                       ✕ Delete Code Block
                     </button>
                   )}
                 </div>
               )}
               {isEditing && !node.content.solutionCode && (
                 <button onClick={() => updateNodeContent('solutionCode', '// enter code here')} className="text-xs font-mono font-bold bg-surface px-3 py-1 border border-border mt-2">+ ADD CODE BLOCK</button>
               )}
            </Section>
          )}

          {!deletedSections.includes("05") && (
            <Section 
              tag="05" 
              title={<Editable value={node.content.section3 || 'Impact · why it pays for itself'} onChange={(v) => updateNodeContent('section3', v)} />}
              subTitle={<Editable value={node.content.impactSubtitle || 'Faster decisions, cleaner invoices, stickier contracts.'} onChange={(v) => updateNodeContent('impactSubtitle', v)} />}
              isEditing={isEditing}
              onDelete={() => {
                if (window.confirm("Are you sure you want to delete Section 05 (Impact Metrics)?")) {
                  updateNodeArray('deletedSections', [...deletedSections, "05"]);
                }
              }}
            >
              {isEditing && (
                <div className="text-[#4a443c] max-w-[720px] mb-4 whitespace-pre-wrap">
                    <Editable multiline value={node.content.impact} onChange={(v) => updateNodeContent('impact', v)} />
                </div>
              )}
              
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 mt-2.5">
                {(node.content.impactTiles || []).map((tile: any) => (
                  <div key={tile.id} className="p-3.5 md:p-4 rounded-xl text-[#fdf6e8] relative overflow-hidden bg-gradient-to-br from-[#221d17] to-[#2c2520] group">
                    <div className="absolute top-[-40%] right-[-10%] w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(217,122,44,0.3),transparent_60%)] pointer-events-none"></div>
                    <div className="font-mono text-[20px] md:text-[24px] font-bold tracking-tight relative z-10 w-full inline-block">
                      {isEditing ? <Editable value={tile.value} onChange={(v) => updateNodeArray('impactTiles', node.content.impactTiles.map((t: any) => t.id === tile.id ? {...t, value: v} : t))} /> : <AnimatedNumber value={tile.value} />}
                    </div>
                    <div className="text-[10.5px] font-bold tracking-wide uppercase mt-1 relative z-10 w-full inline-block" style={{ color: (tile.k || "").toUpperCase().includes("COST") ? "#fca5a5" : "rgba(253,246,232,0.65)" }}>
                      <Editable value={tile.k} onChange={(v) => updateNodeArray('impactTiles', node.content.impactTiles.map((t: any) => t.id === tile.id ? {...t, k: v} : t))} />
                    </div>
                    <div className="text-[11.5px] text-[#fdf6e8]/55 mt-1 leading-snug relative z-10 w-full inline-block">
                      <Editable multiline value={tile.s} onChange={(v) => updateNodeArray('impactTiles', node.content.impactTiles.map((t: any) => t.id === tile.id ? {...t, s: v} : t))} />
                    </div>
                    {isEditing && (
                       <button onClick={() => { if (window.confirm("Are you sure you want to delete this metric tile?")) { updateNodeArray('impactTiles', node.content.impactTiles.filter((t: any) => t.id !== tile.id)); } }} className="absolute top-1 right-1 text-red-400 p-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity z-20">✕</button>
                    )}
                  </div>
                ))}

                {/* Legacy static tiles for backwards compatibility if impactTiles array is missing */}
                {(!node.content.impactTiles || node.content.impactTiles.length === 0) && node.content.stat1Lbl && (
                  <div className="relative group rounded-xl overflow-hidden w-full">
                    <ImpactTile 
                      value={node.content.stat1Val} onValChange={(v: string) => updateNodeContent('stat1Val', v)}
                      label={node.content.stat1Lbl} onLblChange={(v: string) => updateNodeContent('stat1Lbl', v)}
                      isEditing={isEditing}
                    />
                    {isEditing && (
                      <button 
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this metric?")) {
                            updateNodeContent('stat1Lbl', '');
                            updateNodeContent('stat1Val', '');
                          }
                        }}
                        className="absolute top-1.5 right-1.5 text-red-400 hover:text-red-600 bg-black/40 hover:bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-bold z-20 cursor-pointer"
                      >
                        ✕ Delete
                      </button>
                    )}
                  </div>
                )}
                {(!node.content.impactTiles || node.content.impactTiles.length === 0) && node.content.stat2Lbl && (
                  <div className="relative group rounded-xl overflow-hidden w-full">
                    <ImpactTile 
                      value={node.content.stat2Val} onValChange={(v: string) => updateNodeContent('stat2Val', v)}
                      label={node.content.stat2Lbl} onLblChange={(v: string) => updateNodeContent('stat2Lbl', v)}
                      isEditing={isEditing}
                    />
                    {isEditing && (
                      <button 
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this metric?")) {
                            updateNodeContent('stat2Lbl', '');
                            updateNodeContent('stat2Val', '');
                          }
                        }}
                        className="absolute top-1.5 right-1.5 text-red-400 hover:text-red-600 bg-black/40 hover:bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-bold z-20 cursor-pointer"
                      >
                        ✕ Delete
                      </button>
                    )}
                  </div>
                )}
                
                {isEditing && (
                  <div className="border border-dashed border-border rounded-xl flex items-center justify-center p-4 bg-surface/50 hover:bg-surface cursor-pointer min-h-[140px] w-full" onClick={() => updateNodeArray('impactTiles', [...(node.content.impactTiles || []), { id: Date.now().toString(), value: "+0%", k: "NEW METRIC", s: "Describe impact" }])}>
                     <span className="text-[10px] text-muted font-mono font-bold uppercase tracking-widest hover:text-text-main">+ ADD METRIC TILE</span>
                  </div>
                )}
              </div>
            </Section>
          )}
            
          {!deletedSections.includes("06") && (
            <Section 
              tag="06" 
              title={<Editable value={node.content.section4 || 'Target audience'} onChange={(v) => updateNodeContent('section4', v)} />}
              subTitle={<Editable value={node.content.audienceSubtitle || ''} onChange={(v) => updateNodeContent('audienceSubtitle', v)} />}
              isEditing={isEditing}
              onDelete={() => {
                if (window.confirm("Are you sure you want to delete Section 06 (Target Audience)?")) {
                  updateNodeArray('deletedSections', [...deletedSections, "06"]);
                }
              }}
            >
               {isEditing && (
                 <div className="text-[#4a443c] max-w-[720px] whitespace-pre-wrap mb-2">
                    <Editable multiline value={node.content.targetAudience} onChange={(v) => updateNodeContent('targetAudience', v)} />
                 </div>
               )}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                 {(node.content.audiences || []).map((a: any) => (
                   <div key={a.id} className="p-3.5 md:p-4 rounded-xl bg-surface border border-border relative group">
                     <div className={`inline-block text-[9.5px] font-bold tracking-[0.14em] uppercase px-2.5 py-0.5 rounded-full ${a.pri === 'Primary' ? 'bg-[#fde7d0] text-[#7a3d10]' : a.pri === 'Secondary' ? 'bg-[#e0eddf] text-[#2d5e36]' : 'bg-[#faf7f2] border border-[#ece5d6] text-[#8a8278]'}`}>
                        <Editable value={a.pri} onChange={(v) => updateNodeArray('audiences', node.content.audiences.map((aud: any) => aud.id === a.id ? {...aud, pri: v} : aud))} />
                     </div>
                     <div className="font-bold text-[14px] mt-1.5 text-text-main">
                        <Editable value={a.who} onChange={(v) => updateNodeArray('audiences', node.content.audiences.map((aud: any) => aud.id === a.id ? {...aud, who: v} : aud))} />
                     </div>
                     <div className="text-[12px] text-muted mt-1 leading-relaxed">
                        <Editable multiline value={a.need} onChange={(v) => updateNodeArray('audiences', node.content.audiences.map((aud: any) => aud.id === a.id ? {...aud, need: v} : aud))} />
                     </div>
                     {isEditing && (
                       <button onClick={() => { if (window.confirm("Are you sure you want to delete this target audience?")) { updateNodeArray('audiences', node.content.audiences.filter((aud: any) => aud.id !== a.id)); } }} className="absolute top-1.5 right-1.5 text-red-500 font-bold p-1 text-[9px] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                     )}
                   </div>
                 ))}
                 {isEditing && (
                   <button onClick={() => updateNodeArray('audiences', [...(node.content.audiences || []), { id: Date.now().toString(), pri: "Tertiary", who: "New Audience", need: "Describe audience needs and use cases." }])} className="p-3 border border-dashed border-border rounded-xl text-[10px] font-mono font-bold text-muted hover:border-primary hover:text-primary transition-colors flex items-center justify-center min-h-[100px]">
                     + ADD AUDIENCE
                   </button>
                 )}
               </div>
            </Section>
          )}

          {!deletedSections.includes("07") && (
            <Section 
              tag="07" 
              title={<Editable value={node.content.sectionBucket || 'Category / product bucket'} onChange={(v) => updateNodeContent('sectionBucket', v)} />}
              subTitle={<Editable value={node.content.bucketSubtitle || ''} onChange={(v) => updateNodeContent('bucketSubtitle', v)} />}
              isEditing={isEditing}
              onDelete={() => {
                if (window.confirm("Are you sure you want to delete Section 07 (Category / Product Bucket)?")) {
                  updateNodeArray('deletedSections', [...deletedSections, "07"]);
                }
              }}
            >
               <div className="flex flex-wrap gap-2 mt-2.5">
                 {(node.content.buckets || []).map((b: any) => (
                    <div key={b.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-semibold relative group ${b.primary ? 'bg-text-main text-[#fdf6e8] border-text-main' : 'bg-surface border-border text-[#4a443c]'}`}>
                       {b.primary && <span className="w-2 h-2 rounded-full bg-[#d97a2c]"></span>}
                       <Editable value={b.label} onChange={(v) => updateNodeArray('buckets', node.content.buckets.map((bucket: any) => bucket.id === b.id ? {...bucket, label: v} : bucket))} />
                       {isEditing && (
                         <div className="absolute -top-2 -right-2 bg-white rounded-full shadow hidden group-hover:flex overflow-hidden border border-border">
                            <button onClick={() => updateNodeArray('buckets', node.content.buckets.map((bucket: any) => bucket.id === b.id ? {...bucket, primary: !bucket.primary} : bucket))} className="text-[8px] font-bold px-1 py-0.5 hover:bg-gray-100">★</button>
                            <button onClick={() => { if (window.confirm("Are you sure you want to delete this technology chip?")) { updateNodeArray('buckets', node.content.buckets.filter((bucket: any) => bucket.id !== b.id)); } }} className="text-[8px] font-bold px-1 py-0.5 hover:bg-red-50 text-red-500">✕</button>
                         </div>
                       )}
                    </div>
                 ))}
                 {isEditing && (
                    <button onClick={() => updateNodeArray('buckets', [...(node.content.buckets || []), { id: Date.now().toString(), label: "New Tech", primary: false }])} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-border text-[9px] font-mono uppercase font-bold tracking-widest text-muted hover:text-primary transition-colors">
                      + ADD CHIP
                    </button>
                 )}
               </div>
            </Section>
          )}

          {!deletedSections.includes("08") && (
            <Section 
              tag="08" 
              title={<Editable value={node.content.sectionProve || 'What this asset proves'} onChange={(v) => updateNodeContent('sectionProve', v)} />}
              subTitle={<Editable value={node.content.proveSubtitle || ''} onChange={(v) => updateNodeContent('proveSubtitle', v)} />}
              isEditing={isEditing}
              onDelete={() => {
                if (window.confirm("Are you sure you want to delete Section 08 (What this asset proves)?")) {
                  updateNodeArray('deletedSections', [...deletedSections, "08"]);
                }
              }}
            >
               {isEditing && (
                 <div className="text-[#4a443c] max-w-[720px] whitespace-pre-wrap mb-2">
                    <Editable multiline value={node.content.assetsProve} onChange={(v) => updateNodeContent('assetsProve', v)} />
                 </div>
               )}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2">
                 {(node.content.proofs || []).map((p: any, i: number) => (
                    <div key={p.id} className="p-3 rounded-[10px] bg-surface border border-border grid grid-cols-[24px_1fr] md:grid-cols-[26px_1fr] gap-3 items-start relative group">
                       <div className="w-[22px] h-[22px] rounded-full bg-[#4f8a5b] text-white grid place-items-center font-bold font-mono text-[11px] pt-px">{i + 1}</div>
                       <div>
                          <div className="font-bold text-[13px] text-text-main"><Editable value={p.nm} onChange={(v) => updateNodeArray('proofs', node.content.proofs.map((proof: any) => proof.id === p.id ? {...proof, nm: v} : proof))} /></div>
                          <div className="text-[11.5px] text-muted mt-0.5 leading-snug"><Editable multiline value={p.ds} onChange={(v) => updateNodeArray('proofs', node.content.proofs.map((proof: any) => proof.id === p.id ? {...proof, ds: v} : proof))} /></div>
                       </div>
                       {isEditing && (
                         <button onClick={() => { if (window.confirm("Are you sure you want to delete this capability proof point?")) { updateNodeArray('proofs', node.content.proofs.filter((proof: any) => proof.id !== p.id)); } }} className="absolute top-1 right-1 text-red-500 font-bold p-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                       )}
                    </div>
                 ))}
                 {isEditing && (
                   <button onClick={() => updateNodeArray('proofs', [...(node.content.proofs || []), { id: Date.now().toString(), nm: "New proof point", ds: "Describe what this capability demonstrates." }])} className="p-3 border border-dashed border-border rounded-[10px] text-[10px] font-mono uppercase font-bold text-[#8a8278] hover:border-primary hover:text-primary transition-colors flex items-center justify-center min-h-[66px] w-full">+ ADD POINT</button>
                  )}
               </div>
            </Section>
          )}

          {!deletedSections.includes("09") && (
            <Section 
              tag="09" 
              title={<Editable value={node.content.sectionGtm || 'Use in GTM / launch'} onChange={(v) => updateNodeContent('sectionGtm', v)} />}
              subTitle={<Editable value={node.content.gtmSubtitle || ''} onChange={(v) => updateNodeContent('gtmSubtitle', v)} />}
              isEditing={isEditing}
              onDelete={() => {
                if (window.confirm("Are you sure you want to delete Section 09 (Use in GTM/launch)?")) {
                  updateNodeArray('deletedSections', [...deletedSections, "09"]);
                }
              }}
            >
               {isEditing && (
                 <div className="text-[#4a443c] max-w-[720px] whitespace-pre-wrap mb-2">
                    <Editable multiline value={node.content.useGtm} onChange={(v) => updateNodeContent('useGtm', v)} />
                 </div>
               )}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2">
                 {(node.content.gtms || []).map((g: any, i: number) => (
                    <div key={g.id} className="p-3 rounded-[10px] bg-surface border border-border grid grid-cols-[24px_1fr] md:grid-cols-[26px_1fr] gap-3 items-start relative group">
                       <div className="w-[22px] h-[22px] rounded-[6px] bg-[#d97a2c] text-white grid place-items-center font-bold font-mono text-[11px] pb-[1px] pl-[1px]">{i + 1}</div>
                       <div>
                          <div className="font-bold text-[13px] text-text-main"><Editable value={g.nm} onChange={(v) => updateNodeArray('gtms', node.content.gtms.map((gtm: any) => gtm.id === g.id ? {...gtm, nm: v} : gtm))} /></div>
                          <div className="text-[11.5px] text-muted mt-0.5 leading-snug"><Editable multiline value={g.ds} onChange={(v) => updateNodeArray('gtms', node.content.gtms.map((gtm: any) => gtm.id === g.id ? {...gtm, ds: v} : gtm))} /></div>
                       </div>
                       {isEditing && (
                         <button onClick={() => { if (window.confirm("Are you sure you want to delete this GTM launch point?")) { updateNodeArray('gtms', node.content.gtms.filter((gtm: any) => gtm.id !== g.id)); } }} className="absolute top-1.5 right-1.5 text-red-500 font-bold p-1 text-[9px] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                       )}
                    </div>
                 ))}
                 {isEditing && (
                   <button onClick={() => updateNodeArray('gtms', [...(node.content.gtms || []), { id: Date.now().toString(), nm: "New GTM strategy", ds: "Describe how this is used in launch." }])} className="p-3 border border-dashed border-border rounded-[10px] text-[10px] font-mono uppercase font-bold text-[#8a8278] hover:border-primary hover:text-primary transition-colors flex items-center justify-center min-h-[66px]">
                     + ADD GTM USE
                   </button>
                 )}
               </div>
            </Section>
          )}
          {/* Dynamic Extra Sections (10 to 18) for advanced custom views like Tech Stack & telemetry */}
          {(() => {
            const extraSections = [
              { tag: "10", defaultTitle: "10 · Next-phase scaling / blueprint", key: "section10" },
              { tag: "11", defaultTitle: "11 · Carrier / node specs", key: "section11" },
              { tag: "12", defaultTitle: "12 · Tech stack and components", key: "section12" },
              { tag: "13", defaultTitle: "13 · Operational governance", key: "section13" },
              { tag: "14", defaultTitle: "14 · Performance & SLO targets", key: "section14" },
              { tag: "15", defaultTitle: "15 · Financial verification logic", key: "section15" },
              { tag: "16", defaultTitle: "16 · System telemetry rules", key: "section16" },
              { tag: "17", defaultTitle: "17 · Risk & mitigations matrix", key: "section17" },
              { tag: "18", defaultTitle: "18 · Appendix / additional documentation", key: "section18" }
            ];

            const activeRenderedSections = extraSections.map(({ tag, defaultTitle, key }) => {
              if (deletedSections.includes(tag)) return null;

              const titleValue = node.content[`${key}Title`] || defaultTitle;
              const descValue = node.content[`${key}Content`] || "";
              const subTitleValue = node.content[`${key}Subtitle`] || "";
              const listKey = `${key}Items`;
              const listItems = parseSafeArray(node.content[listKey]);

              const titleCustom = node.content[`${key}Title`] || "";
              const hasContent = !!(descValue.trim() || subTitleValue.trim() || (titleCustom && titleCustom !== defaultTitle) || listItems.length > 0);

              if (!hasContent) return null;

              return (
                <Section
                  key={tag}
                  tag={tag}
                  title={
                    <Editable 
                      value={titleValue} 
                      onChange={(v: string) => updateNodeContent(`${key}Title`, v || defaultTitle)} 
                    />
                  }
                  subTitle={
                    <Editable 
                      value={subTitleValue} 
                      placeholder="Add an optional subtitle..." 
                      onChange={(v: string) => updateNodeContent(`${key}Subtitle`, v)} 
                    />
                  }
                  isEditing={isEditing}
                  onDelete={() => {
                    if (window.confirm(`Are you sure you want to delete Section ${tag}?`)) {
                      updateNodeArray('deletedSections', [...deletedSections, tag]);
                    }
                  }}
                >
                  <div className="space-y-4">
                    {/* Main Section Content Description */}
                    {(isEditing || descValue) && (
                      <div className="text-[13.5px] leading-relaxed text-[#4a443c] whitespace-pre-wrap bg-surface border border-border/40 p-4 rounded-xl relative group">
                        <Editable 
                          multiline 
                          value={descValue || (isEditing ? "Add content detail here..." : "")} 
                          onChange={(v: string) => updateNodeContent(`${key}Content`, v)} 
                        />
                      </div>
                    )}

                    {/* Responsive Grid list items for lists inside the section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      {listItems.map((item: any, i: number) => (
                        <div 
                          key={item.id || i} 
                          className="p-3.5 rounded-[10px] bg-surface border border-border grid grid-cols-[24px_1fr] md:grid-cols-[26px_1fr] gap-3 items-start relative group"
                        >
                          <div className="w-[22px] h-[22px] rounded-full bg-[#0D9488]/10 text-[#0D9488] grid place-items-center font-bold font-mono text-[11px] pt-px">
                            {i + 1}
                          </div>
                          <div>
                            <div className="font-bold text-[13.5px] text-text-main">
                              <Editable 
                                value={item.nm || "New Point"} 
                                onChange={(v: string) => {
                                  const updated = listItems.map((it: any, idx: number) => idx === i ? { ...it, nm: v } : it);
                                  updateNodeArray(listKey, updated);
                                }} 
                              />
                            </div>
                            <div className="text-[12px] text-muted mt-1 leading-snug">
                              <Editable 
                                multiline 
                                value={item.ds || "Describe detail item..."} 
                                onChange={(v: string) => {
                                  const updated = listItems.map((it: any, idx: number) => idx === i ? { ...it, ds: v } : it);
                                  updateNodeArray(listKey, updated);
                                }} 
                              />
                            </div>
                          </div>
                          {isEditing && (
                            <button 
                              onClick={() => { 
                                if (window.confirm("Are you sure you want to delete this point?")) { 
                                  updateNodeArray(listKey, listItems.filter((_: any, idx: number) => idx !== i)); 
                                } 
                              }} 
                              className="absolute top-1.5 right-1.5 text-red-500 font-bold p-1 text-[9px] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}

                      {isEditing && (
                        <button 
                          onClick={() => {
                            const newPoint = { id: Date.now().toString(), nm: "New point", ds: "Describe detail point value." };
                            updateNodeArray(listKey, [...listItems, newPoint]);
                          }} 
                          className="p-4 border border-dashed border-[#ece5d6] rounded-[10px] text-[10px] font-mono uppercase font-bold text-[#8a8278] hover:border-primary hover:text-primary transition-colors flex items-center justify-center min-h-[66px] w-full"
                        >
                          + Add item to Section {tag}
                        </button>
                      )}
                    </div>
                  </div>
                </Section>
              );
            });

            return (
              <>
                {activeRenderedSections}
                {isEditing && (
                  <div className="mt-8 p-6 bg-[#faf7f2] border border-dashed border-border rounded-xl">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8a8278] mb-1.5">
                      Add Optional Content Sections
                    </div>
                    <p className="text-xs text-[#8a8278] mb-4">
                      Expand this case study by activating premium modules. Hidden sections contain no content and are automatically omitted on mobile and web view.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {extraSections.map(({ tag, defaultTitle, key }) => {
                        const titleCustom = node.content[`${key}Title`] || "";
                        const descV = node.content[`${key}Content`] || "";
                        const subTitleV = node.content[`${key}Subtitle`] || "";
                        const listK = `${key}Items`;
                        const listI = node.content[listK] || [];
                        const isSectionActive = !!(descV.trim() || subTitleV.trim() || (titleCustom && titleCustom !== defaultTitle) || listI.length > 0);
                        
                        if (isSectionActive && !deletedSections.includes(tag)) {
                          return null; // Already active & visible
                        }

                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (deletedSections.includes(tag)) {
                                updateNodeArray('deletedSections', deletedSections.filter((t: string) => t !== tag));
                              }
                              updateNodeContent(`${key}Content`, "Add system specifications or execution details here...");
                            }}
                            className="px-3 py-1.5 text-xs bg-surface hover:bg-primary/5 hover:text-primary hover:border-primary/50 text-[#5a544c] border border-border rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="text-[9px] font-mono font-bold bg-[#8a8278]/15 px-1 py-0.5 rounded text-[#8a8278]">{tag}</span>
                            <span>{defaultTitle.substring(5)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
          </>
        )}

        {isEditing && (
          <div className="mt-12 p-5 bg-[#faf7f2] border border-border rounded-xl border-l-[6px] border-l-[#11a877] relative overflow-hidden transition-all duration-200">
            {/* Header with quick close toggle */}
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛠️</span>
                <span className="font-mono text-xs md:text-sm font-bold tracking-wider text-text-main uppercase">
                  Protocol Code Configuration & Recall Center
                </span>
              </div>
              <button 
                onClick={() => setShowBackupRecallSection(!showBackupRecallSection)}
                className="font-mono text-[10px] font-bold text-[#11a877] hover:underline"
              >
                {showBackupRecallSection ? "[ HIDE PANEL ]" : "[ SHOW PANEL ]"}
              </button>
            </div>

            {showBackupRecallSection && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left col: Import textbox */}
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-mono font-bold uppercase text-muted tracking-wide">
                      Paste Source Code Snapshot
                    </span>
                    <div className="flex items-center gap-2">
                      {node.content?.customHtml && (
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(node.content.customHtml)
                              .then(() => setImportStatus({ type: 'success', text: "Raw Custom HTML copied to clipboard!" }))
                              .catch(() => setImportStatus({ type: 'error', text: "Failed to copy Raw HTML." }));
                          }}
                          className="text-[10px] text-[#2d5e36] font-mono font-bold hover:underline mr-1"
                        >
                          [ Copy Raw HTML ]
                        </button>
                      )}
                      <button 
                        onClick={handleCopyCurrentConfig}
                        className="text-[10px] text-[#11a877] font-mono font-bold hover:underline"
                      >
                        [ Copy Live Config ]
                      </button>
                    </div>
                  </div>
                  
                  <textarea
                    rows={6}
                    value={pastedCode}
                    onChange={(e) => setPastedCode(e.target.value)}
                    placeholder='Paste layout JSON code here... e.g. { "title": "New Title", "content": { "role": "EXECUTIVE", "solutions": "..." } }'
                    className="w-full text-xs font-mono p-3 bg-white border border-border rounded-lg outline-none focus:border-text-main resize-y max-h-[300px] leading-relaxed select-text"
                  />
                  
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={handleImportCode}
                      className="flex-1 bg-[#1f1b16] hover:bg-[#11a877] hover:text-white text-[#fdf6e8] font-mono text-[11px] font-bold px-4 py-2 uppercase tracking-wider transition-colors brutal-border cursor-pointer text-center"
                    >
                      Review & Import Code
                    </button>
                    <button
                      onClick={handleCreateManualBackup}
                      className="bg-white hover:border-[#1f1b16] hover:bg-gray-50 text-[#1f1b16] font-mono text-[11px] font-bold px-4 py-2 uppercase tracking-wider border border-border rounded-md transition-colors"
                      title="Saves a snapshot of current design to history"
                    >
                      Backup Current
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-muted italic leading-snug">
                    * Note: Video, PDF/deck, PPT, and system flow diagram assets are strictly protected and will not be overwritten by imported code.
                  </p>
                </div>

                {/* Right col: Recall history list */}
                <div className="flex flex-col gap-3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 max-h-[360px] overflow-y-auto w-full">
                  <span className="text-[11px] font-mono font-bold uppercase text-[#1f1b16] tracking-wide flex items-center justify-between">
                    <span>Recall Previous Designs ({node.history?.length || 0})</span>
                    {node.history?.length > 0 && (
                      <span className="text-[9px] text-[#d97a2c] font-bold tracking-wider">CODE HISTORY ACTIVE</span>
                    )}
                  </span>

                  {(!node.history || node.history.length === 0) ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white border border-dashed border-[#ece5d6] rounded-lg text-center">
                      <span className="text-xl mb-1 flex items-center justify-center">⏱️</span>
                      <span className="text-[11.5px] font-mono text-[#8a8278] uppercase font-bold block mt-1">No saved designs found yet</span>
                      <span className="text-[10px] text-[#8a8278] mt-1 max-w-[200px] mx-auto leading-normal block">
                        Snapshots will be saved automatically when you import external source code, or click 'Backup Current'.
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {(node.history || []).map((h: any, idx: number) => (
                        <div key={h.timestamp || idx} className="p-2.5 bg-white border border-border rounded-lg flex items-center justify-between gap-3 group/hist">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[12px] truncate text-text-main">
                              {h.label || `Saved Snapshot #${idx + 1}`}
                            </div>
                            <div className="text-[10px] text-muted font-mono mt-0.5">
                              {new Date(h.timestamp).toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleRecallVersion(h)}
                              className="bg-primary hover:bg-[#110111]/10 px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded transition-colors text-white"
                            >
                              Recall
                            </button>
                            <button
                              onClick={() => handleDeleteHistoryItem(h.timestamp)}
                              className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors text-[10px] opacity-0 group-hover/hist:opacity-100"
                              title="Delete snapshot"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Display parsed status response messages gracefully */}
            {importStatus.type && (
              <div className={`mt-4 p-3 rounded-lg font-mono text-[11px] leading-relaxed flex items-center justify-between gap-2 border ${importStatus.type === 'success' ? 'bg-[#eefcf5] text-[#11a877] border-[#ccf5df]' : 'bg-[#fff5f5] text-[#cc2d2d] border-[#ffd6d6]'}`}>
                <span>{importStatus.text}</span>
                <button 
                  onClick={() => setImportStatus({ type: null, text: "" })}
                  className="font-bold opacity-80 hover:opacity-100 text-xs px-1"
                >
                  ✕
                </button>
              </div>
            )}
            
          </div>
        )}

        <div className="mt-12 pt-5 border-t border-border flex justify-between text-[11px] text-muted font-mono tracking-wider items-center">
          <div>Protocol Log · {node.title}</div>
          <div className="flex items-center gap-4">
            <button onClick={handleExportCsv} className="hover:text-primary transition-colors flex items-center gap-1.5 uppercase font-bold text-text-main">
              <Download className="w-3.5 h-3.5" /> EXPORT CSV
            </button>
            <button onClick={handleExportData} className="hover:text-primary transition-colors flex items-center gap-1.5 uppercase font-bold text-text-main">
              <Download className="w-3.5 h-3.5" /> EXPORT JSON
            </button>
          </div>
        </div>
      </div>

      {/* Floating Case Navigator */}
      <div className="fixed bottom-6 right-6 z-[90] flex items-center gap-2">
        {(() => {
          const idx = data.nodes.findIndex((n: any) => n.id === node.id);
          const prev = idx > 0 ? data.nodes[idx - 1] : null;
          const next = idx < data.nodes.length - 1 ? data.nodes[idx + 1] : null;

          return (
            <div className="flex items-center gap-1.5 p-1.5 bg-text-main/90 backdrop-blur-md rounded-full border border-white/20 shadow-2xl">
              <button 
                onClick={() => navigate('/')}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all group relative mr-1"
                title="Back to Dashboard"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="absolute bottom-full mb-3 left-0 scale-0 group-hover:scale-100 transition-all origin-bottom-left px-3 py-1.5 bg-black text-white text-[11px] font-mono whitespace-nowrap rounded-lg pointer-events-none border border-white/10">
                  BACK TO DASHBOARD
                </span>
              </button>

              {prev && (
                <button 
                  onClick={() => navigate(`/protocol/${prev.id}`)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all group relative"
                  title={`Previous: ${prev.title}`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="absolute bottom-full mb-3 right-0 scale-0 group-hover:scale-100 transition-all origin-bottom-right px-3 py-1.5 bg-black text-white text-[11px] font-mono whitespace-nowrap rounded-lg pointer-events-none border border-white/10">
                    PREV: {prev.title}
                  </span>
                </button>
              )}
              
              <div className="px-3 h-10 flex flex-col items-center justify-center border-x border-white/10 mx-1">
                <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-tighter leading-none mb-0.5">CASE</span>
                <span className="text-[14px] font-black text-white font-mono leading-none">{idx + 1} / {data.nodes.length}</span>
              </div>

              {next && (
                <button 
                  onClick={() => navigate(`/protocol/${next.id}`)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#11a877] hover:bg-[#15c088] text-white transition-all group relative shadow-[0_0_20px_rgba(17,168,119,0.3)]"
                  title={`Next: ${next.title}`}
                >
                  <ArrowRight className="w-5 h-5" />
                  <span className="absolute bottom-full mb-3 right-0 scale-0 group-hover:scale-100 transition-all origin-bottom-right px-3 py-1.5 bg-black text-white text-[11px] font-mono whitespace-nowrap rounded-lg pointer-events-none border border-white/10">
                    NEXT: {next.title}
                  </span>
                </button>
              )}
            </div>
          );
        })()}
      </div>

      <AnimatePresence>
        {showFlowLightbox && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[110] bg-text-main/95 p-4 md:p-10 lg:p-20 flex flex-col backdrop-blur-md"
            onClick={() => { setShowFlowLightbox(false); setFlowZoomLevel(0); }}
          >
            <div className="flex justify-between items-center mb-4 max-w-7xl mx-auto w-full flex-shrink-0">
              <div className="font-mono text-white font-bold text-sm tracking-widest bg-text-main py-2 border-white/20">
                [SYSTEM_ARCHITECTURE_EXPLORER]
              </div>
              <div className="flex items-center gap-2">
                {flowZoomLevel > 0 && (
                  <div className="text-white font-mono text-xs font-bold mr-4">
                    ZOOM: {ZOOM_LEVELS[flowZoomLevel]}%
                  </div>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowFlowLightbox(false); setFlowZoomLevel(0); }} 
                  className="bg-white text-text-main px-4 py-2 hover:bg-primary hover:text-white transition-colors outline-none cursor-pointer flex items-center gap-2 font-mono text-xs font-bold uppercase rounded"
                >
                  <X className="w-4 h-4" /> <span className="hidden md:inline">EXIT VIEWER</span>
                </button>
              </div>
            </div>
            <div 
              className={`flex-1 border-2 border-white/20 relative w-full flex p-4 bg-surface rounded-xl ${node.assets?.systemFlowUrl && flowZoomLevel > 0 ? 'overflow-auto items-start justify-start' : 'items-center justify-center overflow-hidden max-w-7xl mx-auto'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {node.assets?.systemFlowUrl ? (
                <img 
                  src={node.assets.systemFlowUrl} 
                  alt="Fullscreen System Flow" 
                  style={flowZoomLevel > 0 ? { width: `${ZOOM_LEVELS[flowZoomLevel]}%`, maxWidth: 'none' } : {}}
                  className={`${flowZoomLevel > 0 ? 'cursor-zoom-in' : 'max-w-full max-h-full object-contain drop-shadow-2xl cursor-zoom-in'} origin-top-left transition-all duration-300`}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setFlowZoomLevel(prev => (prev + 1) % ZOOM_LEVELS.length); 
                  }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                /* Dynamic scrollable cards if no static image uploaded */
                <div className="w-full h-full flex flex-col justify-center items-center overflow-y-auto p-2 md:p-6">
                  <div className="w-full max-w-5xl bg-white p-6 md:p-10 rounded-2xl border border-border shadow-2xl relative">
                    <div className="flex items-center gap-2 mb-6">
                      <span className="font-mono bg-text-main text-[#fdf6e8] px-2 py-0.5 rounded-[5px] text-[11px] font-bold">04</span>
                      <h3 className="font-sans font-bold text-lg text-text-main">System flow · Interactive overview</h3>
                    </div>
                    
                    <div className="flex flex-row flex-nowrap overflow-x-auto gap-4 py-4 w-full scrollbar-thin">
                      {(node.content?.systemFlow && node.content.systemFlow.length > 0) ? (
                        node.content.systemFlow.map((box: any, i: number) => (
                          <Fragment key={box.id || i}>
                            {i > 0 && (
                              <div className="flex items-center justify-center shrink-0 text-[#d97a2c] font-bold text-xl px-1 select-none">
                                →
                              </div>
                            )}
                            <div className="min-w-[220px] md:min-w-[280px] shrink-0 p-5 rounded-2xl border border-border bg-[#faf7f2]/50 shadow-sm flex flex-col justify-start">
                              <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-muted leading-none mb-2">{box.layer || "PROCESS_NODE"}</div>
                              <div className="font-sans font-bold text-[14.5px] leading-snug mt-1 text-text-main">{box.name}</div>
                              <div className="text-[12px] text-muted mt-2.5 leading-relaxed font-normal">{box.what}</div>
                            </div>
                          </Fragment>
                        ))
                      ) : (
                        <div className="text-center font-mono py-8 w-full text-muted text-xs uppercase tracking-wider">
                          No flow nodes configured for this case. You can configure them in edit mode!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 text-center flex-shrink-0">
              <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest">
                {node.assets?.systemFlowUrl ? (flowZoomLevel > 0 ? "CLICK_IMAGE_TO_INCREASE_ZOOM_OR_DRAG_TO_PAN" : "CLICK_IMAGE_TO_ZOOM_IN") : "DRAG OR SWIPE TO VIEW FLOW PROCESS STEPS"} / CLICK OUTSIDE TO EXIT
              </p>
            </div>
          </motion.div>
        )}

        {showDocument && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-text-main/90 p-2.5 sm:p-4 md:p-12 flex flex-col backdrop-blur-sm"
          >
            <div className="flex justify-between items-center mb-4 max-w-6xl mx-auto w-full">
              <div className="font-mono text-white font-bold text-xs sm:text-sm tracking-widest bg-text-main py-2 border-white/20">
                {showDocument === 'deck' ? '[DOCUMENT_VIEWER]' : showDocument === 'website' ? '[CONNECTED_WEBSITE_PREVIEW]' : '[MEDIA_PLAYER]'}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                {(showDocument === 'deck' ? node.assets?.deckUrl : showDocument === 'website' ? node.assets?.workingViewUrl : node.assets?.videoUrl) && (
                  <>
                    <a 
                      href={showDocument === 'website' ? (node.assets?.workingViewUrl?.startsWith('http') ? node.assets?.workingViewUrl : 'https://' + node.assets?.workingViewUrl) : `/api/download?url=${encodeURIComponent(showDocument === 'deck' ? node.assets?.deckUrl : node.assets?.videoUrl)}`}
                      download={showDocument !== 'website' ? "" : undefined}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-primary hover:bg-[#0bc3b2] text-white px-2.5 sm:px-3.5 py-2 transition-all outline-none cursor-pointer flex items-center gap-1.5 font-mono text-[10px] sm:text-xs font-bold uppercase rounded shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                      title={showDocument === 'website' ? "Open Live Site" : "Download file"}
                    >
                      {showDocument === 'website' ? <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /> : <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
                      <span>{showDocument === 'website' ? "Open Live Site" : "Open Site"}</span>
                    </a>
                  </>
                )}
                <button 
                  onClick={() => setShowDocument(null)} 
                  className="bg-white text-text-main px-3 sm:px-4 py-2 hover:bg-primary hover:text-white transition-colors outline-none cursor-pointer flex items-center gap-1.5 font-mono text-[10px] sm:text-xs font-bold uppercase rounded"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>CLOSE</span>
                </button>
              </div>
            </div>
            <div className="flex-1 border border-white/10 bg-text-main/50 relative overflow-hidden max-w-6xl mx-auto w-full flex flex-col bg-black rounded-xl p-1">
              {showDocument === 'website' && (
                <div className="bg-[#1a1714] text-[#fdf6e8]/80 text-[11px] font-mono p-2 mb-1.5 rounded-lg border border-border/40 flex justify-between items-center">
                  <span>ℹ️ If the connected website does not load due to iframe security policies, please click the <b>Open Live Site</b> button above.</span>
                </div>
              )}
              <div className="flex-1 relative overflow-hidden w-full h-full flex items-center justify-center">
                {showDocument === 'website' ? (
                  (() => {
                    const url = node.assets?.workingViewUrl || '';
                    const fullUrl = url.startsWith('http') ? url : (url ? 'https://' + url : '');
                    return (
                      <iframe 
                        src={fullUrl} 
                        className="w-full h-full border-none bg-white rounded-lg" 
                        title="Connected Website Viewer" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="no-referrer"
                      />
                    );
                  })()
                ) : showDocument === 'deck' ? (
                  (() => {
                    const url = node.assets?.deckUrl || '';
                    if (!url) {
                      return (
                        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl text-center text-text-main max-w-md mx-auto my-12 shadow-sm border border-border">
                          <div className="w-12 h-12 bg-[#2a2421]/5 text-[#2a2421] rounded-full flex items-center justify-center font-bold text-lg mb-3">📄</div>
                          <h4 className="font-bold text-base">No Deck / PDF Uploaded</h4>
                          <p className="text-xs text-muted mt-2 mb-4 leading-relaxed">
                            No presentation document is attached for this node. You can upload a PDF presentation directly below.
                          </p>
                          <div className="w-full">
                            <FileUploader 
                              accept="application/pdf"
                              label="UPLOAD PDF PRESENTATION"
                              onUploadComplete={(newUrl) => updateNodeAsset('deckUrl', newUrl)}
                            />
                          </div>
                        </div>
                      );
                    }
                    const fullUrl = url.startsWith('http') ? url : (url ? window.location.origin + url : '');
                    const isPdf = url.toLowerCase().includes('.pdf');
                    if (isPdf) {
                      return <PdfCanvasViewer url={fullUrl} onReupload={(newUrl) => updateNodeAsset('deckUrl', newUrl)} />;
                    } else {
                      return (
                        <iframe 
                          src={`https://docs.google.com/gview?url=${encodeURIComponent(fullUrl)}&embedded=true`} 
                          className="w-full h-full border-none bg-white rounded-lg" 
                          title="Deck Viewer" 
                        />
                      );
                    }
                  })()
                ) : (
                  (() => {
                    const videoUrl = node.assets?.videoUrl || '';
                    if (!videoUrl) {
                      return (
                        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl text-center text-text-main max-w-md mx-auto my-12 shadow-sm border border-border">
                          <div className="w-12 h-12 bg-[#2a2421]/5 text-[#2a2421] rounded-full flex items-center justify-center font-bold text-lg mb-3">🎥</div>
                          <h4 className="font-bold text-base">No Video Attached</h4>
                          <p className="text-xs text-muted mt-2 mb-4 leading-relaxed">
                            No video walk-through is attached for this node. You can upload a video file below.
                          </p>
                          <div className="w-full">
                            <FileUploader 
                              accept="video/mp4"
                              label="UPLOAD VIDEO DEMO"
                              onUploadComplete={(newUrl) => updateNodeAsset('videoUrl', newUrl)}
                            />
                          </div>
                        </div>
                      );
                    }
                    if (videoUrl.includes("loom.com")) {
                      return <iframe src={videoUrl.replace("/share/", "/embed/")} className="w-full h-full border-none" allowFullScreen title="Loom Video" />;
                    } else {
                      return (
                        <video 
                          src={videoUrl} 
                          className="max-w-full max-h-full w-auto h-auto object-contain outline-none rounded-lg" 
                          controls 
                          autoPlay 
                          playsInline 
                        />
                      );
                    }
                  })()
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
