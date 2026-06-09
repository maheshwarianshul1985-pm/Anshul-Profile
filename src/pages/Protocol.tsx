import React, { useState, Fragment } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Download, Share2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../contexts/AppContext";
import { Editable } from "../components/Editable";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { FileUploader } from '../components/FileUploader';

const themeStyle: React.CSSProperties = {
  '--color-primary': '#11a877',
  '--color-surface': '#ffffff',
  '--color-border': '#ece5d6',
  '--color-text-main': '#1f1b16',
  '--color-muted': '#8a8278',
  backgroundColor: '#faf7f2',
} as React.CSSProperties;

const Section = ({ tag, title, subTitle, children }: any) => (
  <div className="mb-7 page-break-inside-avoid">
    <div className="inline-flex items-center gap-2 text-[10.5px] font-bold tracking-[0.14em] uppercase text-muted mb-1">
      <span className="font-mono bg-text-main text-[#fdf6e8] px-1.5 py-0.5 rounded-[5px] text-[10px] tracking-[0.04em]">{tag}</span>
      {title}
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

export default function Protocol() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, updateData, isEditing, loading } = useApp();
  const [showDocument, setShowDocument] = useState<'deck' | 'video' | null>(null);
  const [showFlowLightbox, setShowFlowLightbox] = useState(false);
  const [flowZoomLevel, setFlowZoomLevel] = useState<number>(0);
  const [pastedCode, setPastedCode] = useState("");
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null, text: string }>({ type: null, text: "" });
  const [showBackupRecallSection, setShowBackupRecallSection] = useState(true);
  
  const ZOOM_LEVELS = [0, 10, 20, 30, 50, 75, 100, 125, 150, 200];
  
  const node = data.nodes.find(n => n.id === id) as any;

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

      // Protect media: preserve original unless user provides a valid, real external url
      const isValidUrl = (url?: string) => {
        return url && url.startsWith("http") && !url.includes("placeholder");
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
        nodes: prev.nodes.map(n => n.id === id ? {
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
      nodes: prev.nodes.map(n => n.id === id ? {
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
      nodes: prev.nodes.map(n => n.id === id ? {
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
    updateData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === id ? {
        ...n,
        history: (n.history || []).filter((h: any) => h.timestamp !== timestamp)
      } : n)
    }));
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
  
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-white">
        <div className="font-mono text-xs uppercase tracking-widest text-[#11a877] animate-pulse">
           [LOADING_PROTOCOL...]
        </div>
      </div>
    );
  }
  
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
      Object.entries(node.content).forEach(([key, val]) => {
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

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `Check out this protocol: ${node.title}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: node.title, text: shareText, url: shareUrl });
        return;
      } catch (err) { console.log("Share failed:", err); }
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
  };

  const updateNodeContent = (key: string, value: string) => {
    updateData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === id ? { ...n, content: { ...n.content, [key]: value } } : n)
    }));
  };

  const updateNodeArray = (key: string, arr: any[]) => {
    updateData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === id ? { ...n, content: { ...n.content, [key]: arr } } : n)
    }));
  };

  const updateNodeAsset = (key: string, value: string) => {
    updateData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === id ? { 
        ...n, 
        assets: { ...(n.assets || { videoUrl: "", videoDuration: "", deckUrl: "", deckSize: "", deckText: "", bgImageUrl: "", systemFlowUrl: "" }), [key]: value } 
      } : n)
    }));
  };

  const updateNodeBase = (key: string, value: string) => {
    updateData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === id ? { ...n, [key]: value } : n)
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col flex-1 w-full min-h-screen text-[14px] leading-relaxed relative"
      style={{...themeStyle, fontFamily: 'var(--font-display)', color: 'var(--color-text-main)'}}
    >
      <header className="bg-surface border-b border-border font-mono relative z-10 w-full mb-0 md:mb-6">
        <div className="flex flex-col md:grid md:grid-cols-[auto_1fr_auto] items-start md:items-center gap-3 md:gap-6 px-4 md:px-10 py-4 relative">
          <div className="text-[13px] md:text-[17px] font-bold text-primary tracking-wider max-w-[85vw] md:max-w-none truncate hover:overflow-visible hover:whitespace-normal hover:break-all transition-all z-20">
            <Editable value={node.content.headerId || 'PROJECT_URL'} onChange={(v) => updateNodeContent('headerId', v)} />
          </div>
          <div className="flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-3 text-[10px] md:text-[11.5px] uppercase font-bold text-muted min-w-0">
            <Link to="/" className="hover:text-primary transition-colors whitespace-nowrap">DASH</Link>
            <span className="text-[#c4cad1]">/</span>
            <Link to="/resume" className="hover:text-primary transition-colors whitespace-nowrap">RESUME</Link>
            <span className="text-[#c4cad1] hidden xs:inline">/</span>
            <span className="text-primary max-w-[70vw] md:max-w-none truncate hover:overflow-visible hover:whitespace-normal hover:break-words transition-all z-20 hover:bg-surface hover:shadow-sm hidden xs:inline">
              <Editable value={node.title} onChange={(v) => updateNodeBase('title', v)} />
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-2 border border-[#e0e3e6] rounded text-[11.5px] text-muted tracking-wider cursor-pointer hover:border-primary transition-colors" onClick={handleShare}>
            <span>📤</span> SHARE
          </div>
          <button onClick={() => navigate(-1)} className="md:hidden absolute top-3 right-4 p-2 bg-surface text-muted border border-border hover:text-text-main rounded shadow-sm z-10 w-[32px] h-[32px] flex items-center justify-center">✕</button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] border-t border-border">
          <div className="p-4 md:px-10 md:py-3.5 border-r border-b md:border-b-0 border-border flex flex-col gap-1 min-w-0">
            <div className="text-[9.5px] md:text-[10.5px] font-bold tracking-[0.1em] text-muted uppercase">Role</div>
            <div className="text-[13px] md:text-[17px] font-bold text-text-main tracking-wide break-words">
               <Editable value={node.content.role} onChange={(v) => updateNodeContent('role', v)} />
            </div>
          </div>
          <div className="p-4 md:px-10 md:py-3.5 border-r border-b md:border-b-0 border-border flex flex-col gap-1 min-w-0">
            <div className="text-[9.5px] md:text-[10.5px] font-bold tracking-[0.1em] text-muted uppercase">Duration</div>
            <div className="text-[13px] md:text-[17px] font-bold text-text-main tracking-wide break-words">
               <Editable value={node.date} onChange={(v) => updateNodeBase('date', v)} />
            </div>
          </div>
          <div className="p-4 md:px-10 md:py-3.5 border-r border-b lg:border-b-0 border-border flex flex-col gap-1 min-w-0">
            <div className="text-[9.5px] md:text-[10.5px] font-bold tracking-[0.1em] text-muted uppercase">Scope</div>
            <div className="text-[13px] md:text-[17px] font-bold text-text-main tracking-wide break-words">
               <Editable value={node.content.scope} onChange={(v) => updateNodeContent('scope', v)} />
            </div>
          </div>
          <div className="p-4 md:px-10 md:py-3.5 flex flex-col gap-1 border-b lg:border-b-0 lg:border-r border-border min-w-0">
            <div className="text-[9.5px] md:text-[10.5px] font-bold tracking-[0.1em] text-muted uppercase">Status</div>
            <div className="text-[13px] md:text-[17px] font-bold text-primary tracking-wide break-words">
               <Editable value={node.content.status} onChange={(v) => updateNodeContent('status', v)} />
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center p-4 min-w-[60px] cursor-pointer hover:bg-[#faf7f2] transition-colors" onClick={() => navigate(-1)}>
             <X className="w-6 h-6 text-muted hover:text-text-main" />
          </div>
        </div>
      </header>

      <section className="max-w-[940px] w-full mx-auto px-4 md:px-12 pt-6 md:pt-9 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-stretch mb-8 md:mb-12">
        <div className="relative rounded-2xl bg-gradient-to-br from-[#fbf6ec] to-[#f3eee5] border border-border overflow-hidden min-h-[240px] flex items-center justify-center shadow-[0_4px_14px_rgba(54,38,12,0.06)] group">
          <div className="absolute top-3.5 left-3.5 bg-text-main text-[#fdf6e8] font-mono text-[10px] font-bold px-2.5 py-1 rounded tracking-widest uppercase z-10 opacity-70 group-hover:opacity-100 transition-opacity">
             <Editable value={node.content.figName || 'Cover Image'} onChange={(v) => updateNodeContent('figName', v)} />
          </div>
          {node.assets?.bgImageUrl ? (
            <>
              <img src={node.assets.bgImageUrl} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
              {isEditing && (
                 <div className="absolute bottom-3.5 right-3.5 z-10 bg-white/90 p-1 rounded-sm"><button onClick={() => updateNodeAsset('bgImageUrl', '')} className="text-[9px] text-red-500 font-bold uppercase tracking-widest">Delete</button></div>
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
          {node.assets?.systemFlowUrl ? (
             <div className="grid grid-cols-[44px_1fr_auto] gap-3.5 items-center p-3.5 bg-surface border border-border rounded-xl hover:border-text-main transition-all duration-150 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(31,27,22,0.12)] cursor-pointer relative" onClick={() => setShowFlowLightbox(true)}>
               <div className="w-10 h-10 rounded-[10px] bg-text-main text-white grid place-items-center font-mono text-[11px] font-black tracking-wide">FLO</div>
               <div>
                 <div className="font-bold text-[13.5px] text-text-main">System flow diagram</div>
                 <div className="text-[11px] text-muted font-mono tracking-wide mt-0.5">Interactive · Overview</div>
               </div>
               <div className="text-muted font-mono font-bold">→</div>
               {isEditing && <button onClick={(e) => { e.stopPropagation(); updateNodeAsset('systemFlowUrl', ''); }} className="absolute right-1 top-1 text-[9px] text-red-500 font-bold">X</button>}
             </div>
          ) : (
            isEditing && (
              <div className="p-3 bg-surface border border-dashed border-border rounded-xl">
                 <FileUploader accept="image/*" label="UPLOAD SYSTEM FLOW" onUploadComplete={(url) => updateNodeAsset('systemFlowUrl', url)} />
              </div>
            )
          )}

          {node.assets?.videoUrl ? (
            <div className="grid grid-cols-[44px_1fr_auto] gap-3.5 items-center p-3.5 bg-surface border border-border rounded-xl hover:border-[#2f6f9f] transition-all duration-150 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(47,111,159,0.12)] cursor-pointer relative" onClick={() => setShowDocument('video')}>
               <div className="w-10 h-10 rounded-[10px] bg-[#2f6f9f] text-white grid place-items-center font-mono text-[11px] font-black tracking-wide pl-0.5">▶</div>
               <div>
                 <div className="font-bold text-[13.5px] text-text-main">Walkthrough video</div>
                 <div className="text-[11px] text-muted font-mono tracking-wide mt-0.5 whitespace-nowrap hover:text-text-main" onClick={(e) => { if(isEditing) e.stopPropagation(); }}><Editable value={node.assets.videoDuration || '2 min'} onChange={(v) => updateNodeAsset('videoDuration', v)} /> · MP4</div>
               </div>
               <div className="text-muted font-mono font-bold">→</div>
             {isEditing && <button onClick={(e) => { e.stopPropagation(); updateNodeAsset('videoUrl', ''); }} className="absolute right-1 top-1 text-[9px] text-red-500 font-bold">X</button>}
            </div>
          ) : (
            isEditing && (
              <div className="p-3 bg-surface border border-dashed border-border rounded-xl">
                 <FileUploader accept="video/*" label="UPLOAD VIDEO" onUploadComplete={(url) => updateNodeAsset('videoUrl', url)} />
              </div>
            )
          )}

          {node.assets?.deckUrl ? (
            <div className="grid grid-cols-[44px_1fr_auto] gap-3.5 items-center p-3.5 bg-surface border border-border rounded-xl hover:border-[#c0492a] transition-all duration-150 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(192,73,42,0.12)] cursor-pointer relative" onClick={() => setShowDocument('deck')}>
               <div className="w-10 h-10 rounded-[10px] bg-[#c0492a] text-white grid place-items-center font-mono text-[10px] font-black tracking-wide">PDF</div>
               <div>
                 <div className="font-bold text-[13.5px] text-text-main">View / save as PDF</div>
                 <div className="text-[11px] text-muted font-mono tracking-wide mt-0.5 whitespace-nowrap hover:text-text-main" onClick={(e) => { if (isEditing) e.stopPropagation(); }}><Editable value={node.assets.deckSize || 'All pages'} onChange={(v) => updateNodeAsset('deckSize', v)} /> · Deck</div>
               </div>
               <div className="text-muted font-mono font-bold">→</div>
            {isEditing && <button onClick={(e) => { e.stopPropagation(); updateNodeAsset('deckUrl', ''); }} className="absolute right-1 top-1 text-[9px] text-red-500 font-bold">X</button>}
            </div>
          ) : (
            isEditing && (
              <div className="p-3 bg-surface border border-dashed border-border rounded-xl">
                 <FileUploader accept=".pdf,.ppt,.pptx" label="UPLOAD DECK" onUploadComplete={(url) => updateNodeAsset('deckUrl', url)} />
              </div>
            )
          )}
        </div>
      </section>

      <div className="max-w-[940px] w-full mx-auto px-4 md:px-12 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-5 md:p-6 rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(54,38,12,0.04)] border-l-[5px] border-l-[#c0492a] relative overflow-hidden">
            <div className="text-[10.5px] font-bold tracking-[0.16em] uppercase text-[#c0492a] mb-2"><Editable value={node.content.section1 || '01 · Problem statement'} onChange={(v) => updateNodeContent('section1', v)} /></div>
            <div className="text-[20px] font-bold tracking-tight text-text-main mb-3 leading-snug"><Editable value={node.content.problemTitle || 'What is the problem?'} onChange={(v) => updateNodeContent('problemTitle', v)} /></div>
            <div className="text-[13.5px] leading-relaxed text-[#4a443c] whitespace-pre-wrap">
               <Editable multiline value={node.content.problem} onChange={(v) => updateNodeContent('problem', v)} />
            </div>
          </div>
          
          <div className="p-5 md:p-6 rounded-xl border border-border bg-surface shadow-[0_1px_2px_rgba(54,38,12,0.04)] border-l-[5px] border-l-[#4f8a5b] relative overflow-hidden">
            <div className="text-[10.5px] font-bold tracking-[0.16em] uppercase text-[#2d5e36] mb-2"><Editable value={node.content.section2 || '02 · Solution'} onChange={(v) => updateNodeContent('section2', v)} /></div>
            <div className="text-[20px] font-bold tracking-tight text-text-main mb-3 leading-snug">
               <Editable value={node.content.solutionTitle || 'Our Solution'} onChange={(v) => updateNodeContent('solutionTitle', v)} />
            </div>
            <div className="text-[13.5px] leading-relaxed text-[#4a443c] whitespace-pre-wrap">
               <Editable multiline value={node.content.solutions} onChange={(v) => updateNodeContent('solutions', v)} />
            </div>
          </div>
        </div>

        <Section 
          tag="03" 
          title={<Editable value={node.content.sectionSolutionFlow || 'Solution flow · how a brand uses it'} onChange={(v) => updateNodeContent('sectionSolutionFlow', v)} />}
          subTitle={<Editable value={node.content.solutionFlowSubtitle || 'From morning glance to month-end invoice — one surface.'} onChange={(v) => updateNodeContent('solutionFlowSubtitle', v)} />}
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
                     <button onClick={() => updateNodeArray('solutionFlow', node.content.solutionFlow.filter((s: any) => s.id !== step.id))} className="absolute top-2 right-2 text-red-500 font-bold p-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
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

        <Section 
          tag="04" 
          title={<Editable value={node.content.sectionSystemFlow || 'System flow · how the data moves'} onChange={(v) => updateNodeContent('sectionSystemFlow', v)} />}
          subTitle={<Editable value={node.content.systemFlowSubtitle || '3PL telemetry → brand portal → write-back actions.'} onChange={(v) => updateNodeContent('systemFlowSubtitle', v)} />}
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
                     <button onClick={() => updateNodeArray('systemFlow', (node.content.systemFlow || []).filter((b: any) => b.id !== box.id))} className="absolute top-1 right-1 text-red-500 font-bold p-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
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
             <div className="p-4 bg-surface border border-border rounded-xl font-mono text-[12px] overflow-x-auto whitespace-pre-wrap text-text-main mt-4">
               <Editable multiline value={node.content.solutionCode} onChange={(v) => updateNodeContent('solutionCode', v)} />
             </div>
           )}
           {isEditing && !node.content.solutionCode && (
             <button onClick={() => updateNodeContent('solutionCode', '// enter code here')} className="text-xs font-mono font-bold bg-surface px-3 py-1 border border-border mt-2">+ ADD CODE BLOCK</button>
           )}
        </Section>

        <Section 
          tag="05" 
          title={<Editable value={node.content.section3 || 'Impact · why it pays for itself'} onChange={(v) => updateNodeContent('section3', v)} />}
          subTitle={<Editable value={node.content.impactSubtitle || 'Faster decisions, cleaner invoices, stickier contracts.'} onChange={(v) => updateNodeContent('impactSubtitle', v)} />}
        >
          {isEditing && (
            <div className="text-[#4a443c] max-w-[720px] mb-4 whitespace-pre-wrap">
                <Editable multiline value={node.content.impact} onChange={(v) => updateNodeContent('impact', v)} />
            </div>
          )}
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2.5">
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
                   <button onClick={() => updateNodeArray('impactTiles', node.content.impactTiles.filter((t: any) => t.id !== tile.id))} className="absolute top-1 right-1 text-red-400 p-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity z-20">✕</button>
                )}
              </div>
            ))}

            {/* Legacy static tiles for backwards compatibility if impactTiles array is missing */}
            {(!node.content.impactTiles || node.content.impactTiles.length === 0) && node.content.stat1Lbl && (
              <ImpactTile 
                value={node.content.stat1Val} onValChange={(v: string) => updateNodeContent('stat1Val', v)}
                label={node.content.stat1Lbl} onLblChange={(v: string) => updateNodeContent('stat1Lbl', v)}
                isEditing={isEditing}
              />
            )}
            {(!node.content.impactTiles || node.content.impactTiles.length === 0) && node.content.stat2Lbl && (
              <ImpactTile 
                value={node.content.stat2Val} onValChange={(v: string) => updateNodeContent('stat2Val', v)}
                label={node.content.stat2Lbl} onLblChange={(v: string) => updateNodeContent('stat2Lbl', v)}
                isEditing={isEditing}
              />
            )}
            
            {isEditing && (
              <div className="border border-dashed border-border rounded-xl flex items-center justify-center p-4 bg-surface/50 hover:bg-surface cursor-pointer min-h-[140px]" onClick={() => updateNodeArray('impactTiles', [...(node.content.impactTiles || []), { id: Date.now().toString(), value: "+0%", k: "NEW METRIC", s: "Describe impact" }])}>
                 <span className="text-[10px] text-muted font-mono font-bold uppercase tracking-widest hover:text-text-main">+ ADD METRIC TILE</span>
              </div>
            )}
          </div>
        </Section>
        
        <Section 
          tag="06" 
          title={<Editable value={node.content.section4 || 'Target audience'} onChange={(v) => updateNodeContent('section4', v)} />}
          subTitle={<Editable value={node.content.audienceSubtitle || ''} onChange={(v) => updateNodeContent('audienceSubtitle', v)} />}
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
                   <button onClick={() => updateNodeArray('audiences', node.content.audiences.filter((aud: any) => aud.id !== a.id))} className="absolute top-1 right-1 text-red-500 font-bold p-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
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

        <Section 
          tag="07" 
          title={<Editable value={node.content.sectionBucket || 'Category / product bucket'} onChange={(v) => updateNodeContent('sectionBucket', v)} />}
          subTitle={<Editable value={node.content.bucketSubtitle || ''} onChange={(v) => updateNodeContent('bucketSubtitle', v)} />}
        >
           <div className="flex flex-wrap gap-2 mt-2.5">
             {(node.content.buckets || []).map((b: any) => (
                <div key={b.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-semibold relative group ${b.primary ? 'bg-text-main text-[#fdf6e8] border-text-main' : 'bg-surface border-border text-[#4a443c]'}`}>
                   {b.primary && <span className="w-2 h-2 rounded-full bg-[#d97a2c]"></span>}
                   <Editable value={b.label} onChange={(v) => updateNodeArray('buckets', node.content.buckets.map((bucket: any) => bucket.id === b.id ? {...bucket, label: v} : bucket))} />
                   {isEditing && (
                     <div className="absolute -top-2 -right-2 bg-white rounded-full shadow hidden group-hover:flex overflow-hidden border border-border">
                        <button onClick={() => updateNodeArray('buckets', node.content.buckets.map((bucket: any) => bucket.id === b.id ? {...bucket, primary: !bucket.primary} : bucket))} className="text-[8px] font-bold px-1 py-0.5 hover:bg-gray-100">★</button>
                        <button onClick={() => updateNodeArray('buckets', node.content.buckets.filter((bucket: any) => bucket.id !== b.id))} className="text-[8px] font-bold px-1 py-0.5 hover:bg-red-50 text-red-500">✕</button>
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

        <Section 
          tag="08" 
          title={<Editable value={node.content.sectionProve || 'What this asset proves'} onChange={(v) => updateNodeContent('sectionProve', v)} />}
          subTitle={<Editable value={node.content.proveSubtitle || ''} onChange={(v) => updateNodeContent('proveSubtitle', v)} />}
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
                     <button onClick={() => updateNodeArray('proofs', node.content.proofs.filter((proof: any) => proof.id !== p.id))} className="absolute top-1 right-1 text-red-500 font-bold p-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                   )}
                </div>
             ))}
             {isEditing && (
               <button onClick={() => updateNodeArray('proofs', [...(node.content.proofs || []), { id: Date.now().toString(), nm: "New proof point", ds: "Describe what this capability demonstrates." }])} className="p-3 border border-dashed border-border rounded-[10px] text-[10px] font-mono uppercase font-bold text-muted hover:border-primary hover:text-primary transition-colors flex items-center justify-center min-h-[66px]">
                 + ADD POINT
               </button>
             )}
           </div>
        </Section>

        <Section 
          tag="09" 
          title={<Editable value={node.content.sectionGtm || 'Use in GTM / launch'} onChange={(v) => updateNodeContent('sectionGtm', v)} />}
          subTitle={<Editable value={node.content.gtmSubtitle || ''} onChange={(v) => updateNodeContent('gtmSubtitle', v)} />}
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
                     <button onClick={() => updateNodeArray('gtms', node.content.gtms.filter((gtm: any) => gtm.id !== g.id))} className="absolute top-1 right-1 text-red-500 font-bold p-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                   )}
                </div>
             ))}
             {isEditing && (
               <button onClick={() => updateNodeArray('gtms', [...(node.content.gtms || []), { id: Date.now().toString(), nm: "New GTM strategy", ds: "Describe how this is used in launch." }])} className="p-3 border border-dashed border-border rounded-[10px] text-[10px] font-mono uppercase font-bold text-muted hover:border-primary hover:text-primary transition-colors flex items-center justify-center min-h-[66px]">
                 + ADD GTM USE
               </button>
             )}
           </div>
        </Section>

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
                    <button 
                      onClick={handleCopyCurrentConfig}
                      className="text-[10px] text-[#11a877] font-mono font-bold hover:underline"
                    >
                      [ Copy Live Config ]
                    </button>
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

      <AnimatePresence>
        {showFlowLightbox && !isEditing && (
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
              className={`flex-1 border-2 border-white/20 relative w-full flex p-4 bg-surface rounded-xl ${flowZoomLevel > 0 ? 'overflow-auto items-start justify-start' : 'items-center justify-center overflow-hidden max-w-7xl mx-auto'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={node.assets?.systemFlowUrl} 
                alt="Fullscreen System Flow" 
                style={flowZoomLevel > 0 ? { width: `${ZOOM_LEVELS[flowZoomLevel]}%`, maxWidth: 'none' } : {}}
                className={`${flowZoomLevel > 0 ? 'cursor-zoom-in' : 'max-w-full max-h-full object-contain drop-shadow-2xl cursor-zoom-in'} origin-top-left transition-all duration-300`}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setFlowZoomLevel(prev => (prev + 1) % ZOOM_LEVELS.length); 
                }}
              />
            </div>
            <div className="mt-4 text-center flex-shrink-0">
              <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest">
                {flowZoomLevel > 0 ? "CLICK_IMAGE_TO_INCREASE_ZOOM_OR_DRAG_TO_PAN" : "CLICK_IMAGE_TO_ZOOM_IN"} / CLICK_OUTSIDE_TO_EXIT
              </p>
            </div>
          </motion.div>
        )}

        {showDocument && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-text-main/90 p-4 md:p-12 flex flex-col backdrop-blur-sm"
          >
            <div className="flex justify-between items-center mb-4 max-w-6xl mx-auto w-full">
              <div className="font-mono text-white font-bold text-sm tracking-widest bg-text-main py-2 border-white/20">
                {showDocument === 'deck' ? '[DOCUMENT_VIEWER]' : '[MEDIA_PLAYER]'}
              </div>
              <button onClick={() => setShowDocument(null)} className="bg-white text-text-main px-4 py-2 hover:bg-primary hover:text-white transition-colors outline-none cursor-pointer flex items-center gap-2 font-mono text-xs font-bold uppercase rounded">
                <X className="w-4 h-4" /> <span className="hidden md:inline">CLOSE</span>
              </button>
            </div>
            <div className="flex-1 border-2 border-white/10 bg-text-main/50 relative overflow-hidden max-w-6xl mx-auto w-full flex items-center justify-center bg-black rounded-xl">
              {showDocument === 'deck' ? (
                  <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(node.assets?.deckUrl || '')}&embedded=true`} className="w-full h-full border-none bg-white" title="Deck Viewer" />
              ) : (
                  node.assets?.videoUrl?.includes("loom.com") ? (
                    <iframe src={node.assets.videoUrl.replace("/share/", "/embed/")} className="w-full h-full border-none" allowFullScreen title="Loom Video" />
                  ) : (
                    <video src={node.assets?.videoUrl} className="w-full h-full outline-none" controls autoPlay playsInline controlsList="nodownload" />
                  )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
