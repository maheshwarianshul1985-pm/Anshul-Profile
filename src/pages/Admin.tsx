import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { Lock, ArrowRight, LogOut, MessageSquarePlus, Trash2, Download, Upload, Database, HardDriveDownload, Key, CheckCircle, XCircle, Loader2, ArrowUp, ArrowDown, AlignJustify, RotateCcw, ShieldAlert, Activity, FileText, Video, Eye, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import Papa from "papaparse";
import { testGemini } from "../utils/apiTests";
import { FileUploader } from "../components/FileUploader";

function flattenNode(node: any) {
  return {
    id: node.id || "",
    date: node.date || "",
    title: node.title || "",
    description: node.description || "",
    "assets.videoUrl": node.assets?.videoUrl || "",
    "assets.videoDuration": node.assets?.videoDuration || "",
    "assets.deckUrl": node.assets?.deckUrl || "",
    "assets.deckSize": node.assets?.deckSize || "",
    "assets.deckText": node.assets?.deckText || "",
    "assets.bgImageUrl": node.assets?.bgImageUrl || "",
    "assets.systemFlowUrl": node.assets?.systemFlowUrl || "",
    "content.problem": node.content?.problem || "",
    "content.solutions": node.content?.solutions || "",
    "content.impact": node.content?.impact || "",
    "content.railMetricVal": node.content?.railMetricVal || "",
    "content.railMetricLbl": node.content?.railMetricLbl || "",
    "content.stat1Val": node.content?.stat1Val || "",
    "content.stat1Lbl": node.content?.stat1Lbl || "",
    "content.stat1Desc": node.content?.stat1Desc || "",
    "content.stat2Val": node.content?.stat2Val || "",
    "content.stat2Lbl": node.content?.stat2Lbl || "",
    "content.stat2Desc": node.content?.stat2Desc || "",
    "content.stat3Val": node.content?.stat3Val || "",
    "content.stat3Lbl": node.content?.stat3Lbl || "",
    "content.stat3Desc": node.content?.stat3Desc || "",
    "content.stat4Val": node.content?.stat4Val || "",
    "content.stat4Lbl": node.content?.stat4Lbl || "",
    "content.stat4Desc": node.content?.stat4Desc || "",
    "content.role": node.content?.role || "",
    "content.scope": node.content?.scope || "",
    "content.status": node.content?.status || "",
    "content.headerId": node.content?.headerId || "",
    "content.figName": node.content?.figName || "",
    "content.section1": node.content?.section1 || "",
    "content.section2": node.content?.section2 || "",
    "content.sectionSystemFlow": node.content?.sectionSystemFlow || "",
    "content.systemFlowContent": node.content?.systemFlowContent || "",
    "content.section3": node.content?.section3 || "",
    "content.section4": node.content?.section4 || "",
    "content.targetAudience": node.content?.targetAudience || "",
    "content.sectionBucket": node.content?.sectionBucket || "",
    "content.productBucket": node.content?.productBucket || "",
    "content.sectionProve": node.content?.sectionProve || "",
    "content.assetsProve": node.content?.assetsProve || "",
    "content.sectionGtm": node.content?.sectionGtm || "",
    "content.useGtm": node.content?.useGtm || "",
    "content.sectionKpi": node.content?.sectionKpi || "",
    "content.solutionTitle": node.content?.solutionTitle || "",
    "content.solutionCode": node.content?.solutionCode || "",
    // Serialize complex nested arrays to JSON strings so they aren't lost in backups
    "content.solutionFlow": node.content?.solutionFlow ? JSON.stringify(node.content.solutionFlow) : "",
    "content.systemFlow": node.content?.systemFlow ? JSON.stringify(node.content.systemFlow) : "",
    "content.impactTiles": node.content?.impactTiles ? JSON.stringify(node.content.impactTiles) : "",
    "content.audiences": node.content?.audiences ? JSON.stringify(node.content.audiences) : "",
    "content.buckets": node.content?.buckets ? JSON.stringify(node.content.buckets) : "",
    "content.proofs": node.content?.proofs ? JSON.stringify(node.content.proofs) : "",
    "content.gtms": node.content?.gtms ? JSON.stringify(node.content.gtms) : "",
    "content.deletedSections": node.content?.deletedSections ? JSON.stringify(node.content.deletedSections) : "",
    "content.sectionSolutionFlow": node.content?.sectionSolutionFlow || "",
    "content.solutionFlowSubtitle": node.content?.solutionFlowSubtitle || "",
    "content.systemFlowSubtitle": node.content?.systemFlowSubtitle || "",
    "content.impactSubtitle": node.content?.impactSubtitle || "",
    "content.audienceSubtitle": node.content?.audienceSubtitle || "",
    "content.bucketSubtitle": node.content?.bucketSubtitle || "",
    "content.proveSubtitle": node.content?.proveSubtitle || "",
    "content.gtmSubtitle": node.content?.gtmSubtitle || "",
    "content.customHtml": node.content?.customHtml || ""
  };
}

function parseJSONSafe(str: string, fallback: any) {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch (e) {
    return fallback;
  }
}

function unflattenNode(flat: any) {
  return {
    id: flat.id || "",
    date: flat.date || "",
    title: flat.title || "",
    description: flat.description || "",
    assets: {
      videoUrl: flat["assets.videoUrl"] || "",
      videoDuration: flat["assets.videoDuration"] || "",
      deckUrl: flat["assets.deckUrl"] || "",
      deckSize: flat["assets.deckSize"] || "",
      deckText: flat["assets.deckText"] || "",
      bgImageUrl: flat["assets.bgImageUrl"] || "",
      systemFlowUrl: flat["assets.systemFlowUrl"] || ""
    },
    content: {
      problem: flat["content.problem"] || "",
      solutions: flat["content.solutions"] || "",
      impact: flat["content.impact"] || "",
      railMetricVal: flat["content.railMetricVal"] || "",
      railMetricLbl: flat["content.railMetricLbl"] || "",
      stat1Val: flat["content.stat1Val"] || "",
      stat1Lbl: flat["content.stat1Lbl"] || "",
      stat1Desc: flat["content.stat1Desc"] || "",
      stat2Val: flat["content.stat2Val"] || "",
      stat2Lbl: flat["content.stat2Lbl"] || "",
      stat2Desc: flat["content.stat2Desc"] || "",
      stat3Val: flat["content.stat3Val"] || "",
      stat3Lbl: flat["content.stat3Lbl"] || "",
      stat3Desc: flat["content.stat3Desc"] || "",
      stat4Val: flat["content.stat4Val"] || "",
      stat4Lbl: flat["content.stat4Lbl"] || "",
      stat4Desc: flat["content.stat4Desc"] || "",
      role: flat["content.role"] || "",
      scope: flat["content.scope"] || "",
      status: flat["content.status"] || "",
      headerId: flat["content.headerId"] || "",
      figName: flat["content.figName"] || "",
      section1: flat["content.section1"] || "",
      section2: flat["content.section2"] || "",
      sectionSystemFlow: flat["content.sectionSystemFlow"] || "",
      systemFlowContent: flat["content.systemFlowContent"] || "",
      section3: flat["content.section3"] || "",
      section4: flat["content.section4"] || "",
      targetAudience: flat["content.targetAudience"] || "",
      sectionBucket: flat["content.sectionBucket"] || "",
      productBucket: flat["content.productBucket"] || "",
      sectionProve: flat["content.sectionProve"] || "",
      assetsProve: flat["content.assetsProve"] || "",
      sectionGtm: flat["content.sectionGtm"] || "",
      useGtm: flat["content.useGtm"] || "",
      sectionKpi: flat["content.sectionKpi"] || "",
      solutionTitle: flat["content.solutionTitle"] || "",
      solutionCode: flat["content.solutionCode"] || "",
      // Deserialize complex arrays back from JSON strings safely
      solutionFlow: parseJSONSafe(flat["content.solutionFlow"], []),
      systemFlow: parseJSONSafe(flat["content.systemFlow"], []),
      impactTiles: parseJSONSafe(flat["content.impactTiles"], []),
      audiences: parseJSONSafe(flat["content.audiences"], []),
      buckets: parseJSONSafe(flat["content.buckets"], []),
      proofs: parseJSONSafe(flat["content.proofs"], []),
      gtms: parseJSONSafe(flat["content.gtms"], []),
      deletedSections: parseJSONSafe(flat["content.deletedSections"], []),
      sectionSolutionFlow: flat["content.sectionSolutionFlow"] || "",
      solutionFlowSubtitle: flat["content.solutionFlowSubtitle"] || "",
      systemFlowSubtitle: flat["content.systemFlowSubtitle"] || "",
      impactSubtitle: flat["content.impactSubtitle"] || "",
      audienceSubtitle: flat["content.audienceSubtitle"] || "",
      bucketSubtitle: flat["content.bucketSubtitle"] || "",
      proveSubtitle: flat["content.proveSubtitle"] || "",
      gtmSubtitle: flat["content.gtmSubtitle"] || "",
      customHtml: flat["content.customHtml"] || ""
    }
  };
}

export default function Admin() {
  const { isAdmin, login, logout, setIsEditing, data, updateData, restoreFullBackup, syncToCloud, resetQuotaFlag, hasUnsavedChanges, lastCloudSync } = useApp();
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [isRestoringLocal, setIsRestoringLocal] = useState(false);
  const [localRestoreSuccess, setLocalRestoreSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const navigate = useNavigate();

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      await syncToCloud();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      setSyncStatus('error');
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(id, pass)) {
      setIsEditing(true);
      navigate("/");
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleResumeUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateData(prev => ({ ...prev, resumeUrl: e.target.value }));
  };

  const handleAddQA = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    
    const newItem = {
      id: Date.now().toString(),
      question: newQuestion,
      answer: newAnswer,
      timestamp: Date.now()
    };
    
    updateData(prev => ({
      ...prev,
      unansweredQuestions: [...(prev.unansweredQuestions || []), newItem]
    }));
    
    setNewQuestion("");
    setNewAnswer("");
  };

  const handleDeleteQA = (qaId: string) => {
    updateData(prev => ({
      ...prev,
      unansweredQuestions: (prev.unansweredQuestions || []).filter(q => q.id !== qaId)
    }));
  };

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[] | null>(null);
  const [importError, setImportError] = useState("");

  const [testingStatus, setTestingStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({
    gemini: 'idle'
  });

  const handleTestAPI = async (service: 'gemini') => {
    setTestingStatus(prev => ({ ...prev, [service]: 'testing' }));
    let success = false;
    const apiKey = data.apiKeys?.[service] || "";
    
    if (service === 'gemini') {
      success = await testGemini(apiKey);
    }
    
    setTestingStatus(prev => ({ ...prev, [service]: success ? 'success' : 'error' }));
  };

  const updateApiKey = (service: 'gemini', value: string) => {
    updateData(prev => ({
      ...prev,
      apiKeys: {
        ...(prev.apiKeys || { gemini: "" }),
        [service]: value
      }
    }));
    setTestingStatus(prev => ({ ...prev, [service]: 'idle' }));
  };

  const handleExportNodes = () => {
    const flatNodes = data.nodes.map(flattenNode);
    const csv = Papa.unparse(flatNodes);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `protocols_backup_${data.lastUpdated ? data.lastUpdated.replace(/[:.]/g, '-') : new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDashboard = () => {
    const rows: { section: string, key: string, value: string }[] = [];
    
    // Hero
    Object.entries(data.hero || {}).forEach(([k, v]) => {
      rows.push({ section: 'hero', key: k, value: String(v) });
    });

    // Headlines
    (data.headlines || []).forEach((h: any, i: number) => {
      rows.push({ section: `headlines[${i}]`, key: 'v', value: h.v });
      rows.push({ section: `headlines[${i}]`, key: 'k', value: h.k });
      rows.push({ section: `headlines[${i}]`, key: 'id', value: h.id });
    });

    // Method
    rows.push({ section: 'dashboard', key: 'methodHeading', value: data.methodHeading || '' });
    rows.push({ section: 'dashboard', key: 'methodCadence', value: data.methodCadence || '' });
    (data.method || []).forEach((m: any, i: number) => {
      rows.push({ section: `method[${i}]`, key: 'n', value: m.n });
      rows.push({ section: `method[${i}]`, key: 't', value: m.t });
      rows.push({ section: `method[${i}]`, key: 'd', value: m.d });
      rows.push({ section: `method[${i}]`, key: 'id', value: m.id });
    });

    // Specs
    (data.specs || []).forEach((s: any, i: number) => {
      rows.push({ section: `specs[${i}]`, key: 'label', value: s.label });
      rows.push({ section: `specs[${i}]`, key: 'value', value: String(s.value) });
      rows.push({ section: `specs[${i}]`, key: 'id', value: s.id });
    });

    // Labels
    Object.entries(data.navLabels || {}).forEach(([k, v]) => {
      rows.push({ section: 'navLabels', key: k, value: String(v) });
    });

    // Protocols (Nodes)
    (data.nodes || []).forEach((node: any, i: number) => {
      const flat = flattenNode(node);
      Object.entries(flat).forEach(([k, v]) => {
        rows.push({ section: `nodes[${i}]`, key: k, value: String(v) });
      });
    });

    rows.push({ section: 'dashboard', key: 'casebookTitle', value: data.casebookTitle || '' });
    rows.push({ section: 'dashboard', key: 'casebookSub', value: data.casebookSub || '' });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard_config_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [dashboardFile, setDashboardFile] = useState<File | null>(null);
  const [dashboardImportData, setDashboardImportData] = useState<any[] | null>(null);

  const [experiencesFile, setExperiencesFile] = useState<File | null>(null);
  const [experiencesImportData, setExperiencesImportData] = useState<any[] | null>(null);

  const handleExportExperiences = () => {
    const rows = (data.experiences || []).map((exp: any) => ({
      id: exp.id || "",
      company: exp.company || "",
      title: exp.title || "",
      date: exp.date || "",
      points: (exp.points || []).join('|'),
      isPrimary: exp.isPrimary ? "true" : "false"
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `career_changelog_backup_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExperiencesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExperiencesFile(file);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setExperiencesImportData(results.data);
        }
      });
    }
  };

  const applyExperiencesImport = () => {
    if (!experiencesImportData) return;
    
    updateData(prev => {
      const newExperiences = experiencesImportData.map((row: any) => ({
        id: row.id || Date.now().toString() + Math.random(),
        company: row.company || "",
        title: row.title || "",
        date: row.date || "",
        points: (row.points || "").split('|').filter((p: string) => p.trim() !== ""),
        isPrimary: row.isPrimary === "true",
        subSections: []
      }));
      return { ...prev, experiences: newExperiences };
    });

    setExperiencesFile(null);
    setExperiencesImportData(null);
    alert("Career changelog (Resume) updated successfully!");
  };

  const handleDashboardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDashboardFile(file);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setDashboardImportData(results.data);
        }
      });
    }
  };

  const applyDashboardImport = () => {
    if (!dashboardImportData) return;
    
    updateData(prev => {
      const newData = { ...prev };
      const nodesBuffer: Record<number, any> = {};

      dashboardImportData.forEach((row: any) => {
        const { section, key, value } = row;
        if (!section || !key) return;

        if (section === 'hero') {
          if (!newData.hero) newData.hero = {};
          newData.hero[key] = value;
        } else if (section === 'dashboard') {
          newData[key] = value;
        } else if (section === 'navLabels') {
          if (!newData.navLabels) newData.navLabels = {};
          newData.navLabels[key] = value;
        } else if (section.startsWith('headlines[')) {
          const idx = parseInt(section.match(/\[(\d+)\]/)?.[1] || "0");
          if (!newData.headlines) newData.headlines = [];
          if (!newData.headlines[idx]) newData.headlines[idx] = {};
          newData.headlines[idx][key] = value;
        } else if (section.startsWith('method[')) {
          const idx = parseInt(section.match(/\[(\d+)\]/)?.[1] || "0");
          if (!newData.method) newData.method = [];
          if (!newData.method[idx]) newData.method[idx] = {};
          newData.method[idx][key] = value;
        } else if (section.startsWith('specs[')) {
          const idx = parseInt(section.match(/\[(\d+)\]/)?.[1] || "0");
          if (!newData.specs) newData.specs = [];
          if (!newData.specs[idx]) newData.specs[idx] = {};
          if (key === 'value') newData.specs[idx][key] = parseFloat(value);
          else newData.specs[idx][key] = value;
        } else if (section.startsWith('nodes[')) {
          const idx = parseInt(section.match(/\[(\d+)\]/)?.[1] || "0");
          if (!nodesBuffer[idx]) nodesBuffer[idx] = {};
          nodesBuffer[idx][key] = value;
        }
      });

      // Process Nodes Buffer
      const sortedNodeIndices = Object.keys(nodesBuffer).map(Number).sort((a, b) => a - b);
      if (sortedNodeIndices.length > 0) {
        newData.nodes = sortedNodeIndices.map(idx => unflattenNode(nodesBuffer[idx]));
      }

      return newData;
    });

    setDashboardFile(null);
    setDashboardImportData(null);
    alert("Full Dashboard configuration (including Protocols) updated successfully!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportError("");
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setImportError("Error parsing CSV: " + results.errors[0].message);
            return;
          }
          const parsedNodes = results.data.map(unflattenNode);
          if (parsedNodes.length > 0) {
            setImportData(parsedNodes);
          } else {
            setImportError("No valid rows found in CSV.");
          }
        },
        error: (err) => {
          setImportError("Error reading CSV file.");
        }
      });
    }
  };

  const handleImport = (mode: 'overwrite' | 'merge') => {
    if (!importData) return;
    updateData(prev => {
      if (mode === 'overwrite') {
        return { ...prev, nodes: importData };
      } else {
        const existingNodes = [...prev.nodes];
        importData.forEach(importedNode => {
          if (!importedNode.id) return;
          const index = existingNodes.findIndex(n => n.id === importedNode.id);
          if (index >= 0) {
            existingNodes[index] = { ...existingNodes[index], ...importedNode };
          } else {
            existingNodes.push(importedNode);
          }
        });
        return { ...prev, nodes: existingNodes };
      }
    });

    setImportFile(null);
    setImportData(null);
    alert(`Successfully ${mode === 'overwrite' ? 'overwritten' : 'merged'} protocols!`);
  };

  const moveNodeUp = (index: number) => {
    if (index === 0) return;
    updateData(prev => {
      const newNodes = [...prev.nodes];
      [newNodes[index-1], newNodes[index]] = [newNodes[index], newNodes[index-1]];
      return { ...prev, nodes: newNodes };
    });
  };

  const moveNodeDown = (index: number) => {
    if (index === data.nodes.length - 1) return;
    updateData(prev => {
      const newNodes = [...prev.nodes];
      [newNodes[index+1], newNodes[index]] = [newNodes[index], newNodes[index+1]];
      return { ...prev, nodes: newNodes };
    });
  };

  if (isAdmin) {
    return (
      <div className="flex flex-col flex-1 min-h-screen bg-surface p-6 pb-24 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="brutal-border bg-white p-8 max-w-sm w-full text-center space-y-6">
            <Lock className="w-12 h-12 text-primary mx-auto" />
            <h1 className="font-display text-2xl font-bold uppercase tracking-tight">System Access: Verified</h1>
            
            <div className="text-left space-y-2 mt-4 pt-4 border-t border-border">
              <label className="font-mono text-[10px] text-muted font-bold tracking-widest uppercase">Manage Resume URL</label>
              <input 
                type="text" 
                value={data.resumeUrl || ''}
                onChange={handleResumeUpdate}
                className="w-full h-10 px-3 bg-surface brutal-border font-mono text-xs focus:outline-none focus:border-primary rounded-none"
                placeholder="https://... (Link to PDF)"
              />
              <p className="text-[10px] text-muted font-mono">This URL will be used in the "Download Resume" buttons.</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <button 
                onClick={() => { setIsEditing(true); navigate("/"); }}
                className="w-full h-12 bg-text-main text-white font-mono text-xs font-bold uppercase hover:bg-primary transition-colors brutal-border flex items-center justify-center gap-2"
              >
                Return to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => { logout(); navigate("/"); }}
                className="w-full h-12 bg-surface text-text-main font-mono text-xs font-bold uppercase hover:bg-white transition-colors brutal-border flex items-center justify-center gap-2"
              >
                Terminate Session
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          <div className="brutal-border bg-white p-8 max-w-4xl w-full mt-8 space-y-6">
            <h2 className="font-display text-xl font-bold uppercase tracking-tight flex items-center gap-2">
              <Key className="w-6 h-6 text-primary" />
              API Key Management
            </h2>
            <p className="font-mono text-xs text-muted">Configure external provider keys. These are stored securely in your Firebase instance and are not exposed to unauthenticated users. Enter the key and click test to verify it works.</p>
            
            <div className="space-y-4">
              {['gemini'].map((service) => (
                <div key={service} className="flex flex-col gap-2 bg-surface p-4 brutal-border">
                  <div className="flex justify-between items-center">
                    <label className="font-mono text-[10px] text-muted font-bold tracking-widest uppercase">{service} API Key</label>
                    <span className="font-mono text-[10px] lowercase flex items-center gap-1">
                      {testingStatus[service] === 'success' && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> valid</span>}
                      {testingStatus[service] === 'error' && <span className="text-red-600 flex items-center gap-1"><XCircle className="w-3 h-3"/> invalid or error</span>}
                      {testingStatus[service] === 'testing' && <span className="text-primary flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> testing...</span>}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="password"
                      value={(data.apiKeys as any)?.[service] || ""}
                      onChange={e => updateApiKey(service as any, e.target.value)}
                      placeholder={service === 'gemini' && process.env.GEMINI_API_KEY ? "Using system environment key (override here)..." : `Enter ${service} API key...`}
                      className="flex-1 h-10 px-3 bg-white brutal-border font-mono text-xs focus:outline-none focus:border-primary rounded-none"
                    />
                    <button 
                      onClick={() => handleTestAPI(service as any)}
                      disabled={testingStatus[service] === 'testing' || !(data.apiKeys as any)?.[service]}
                      className="h-10 px-4 bg-text-main text-white font-mono text-[10px] font-bold uppercase hover:bg-primary transition-colors brutal-border disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                    >
                      Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="brutal-border bg-white p-8 max-w-4xl w-full mt-8 space-y-6">
            <h2 className="font-display text-xl font-bold uppercase tracking-tight flex items-center gap-2">
              <MessageSquarePlus className="w-6 h-6 text-primary" />
              Agent Training / Custom Q&A
            </h2>
            <p className="font-mono text-xs text-muted">Provide explicit answers for complex questions or corrections on terminology (e.g. mapping "TMS" to a specific protocol).</p>
            
            <div className="flex flex-col gap-3 bg-surface p-4 brutal-border">
              <input 
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                placeholder="E.g., Which protocol handles TMS?"
                className="w-full h-10 px-3 bg-white brutal-border font-mono text-xs focus:outline-none focus:border-primary rounded-none"
              />
              <textarea 
                value={newAnswer}
                onChange={e => setNewAnswer(e.target.value)}
                placeholder="E.g., The 'Zone-Based Fleet Control' protocol is the equivalent of a Transport Management System (TMS)."
                rows={3}
                className="w-full p-3 bg-white brutal-border font-mono text-xs focus:outline-none focus:border-primary rounded-none resize-y"
              />
              <button 
                onClick={handleAddQA}
                disabled={!newQuestion.trim() || !newAnswer.trim()}
                className="h-10 bg-primary text-white font-mono text-xs font-bold uppercase hover:bg-text-main transition-colors brutal-border flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + ADD_TRAINING_DATA
              </button>
            </div>

            <div className="space-y-4">
              {(data.unansweredQuestions || []).filter(q => q.answer).map(qa => (
                <div key={qa.id} className="p-4 border-l-4 border-primary bg-surface flex justify-between gap-4">
                  <div className="flex-1 space-y-2 font-mono text-xs">
                    <div><span className="font-bold">Q:</span> {qa.question}</div>
                    <div><span className="font-bold text-primary">A:</span> {qa.answer}</div>
                  </div>
                  <button onClick={() => handleDeleteQA(qa.id)} className="text-muted hover:text-primary transition-colors h-fit p-1">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {(!data.unansweredQuestions || data.unansweredQuestions.length === 0) && (
                <div className="p-4 text-center font-mono text-xs text-muted border border-dashed border-border">
                  No training data added yet.
                </div>
              )}
            </div>
          </div>

          <div className="brutal-border bg-white p-8 max-w-4xl w-full mt-8 space-y-6">
            <h2 className="font-display text-xl font-bold uppercase tracking-tight flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              Firestore Configuration Verification
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-surface p-4 brutal-border">
                  <div className="text-[10px] font-mono text-muted uppercase font-bold tracking-widest mb-1">Target Database ID</div>
                  <div className="font-mono text-sm font-bold text-primary break-all">
                    {import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-15655e8c-18ff-4359-b057-60febe5dddfc"}
                  </div>
               </div>
               <div className="bg-surface p-4 brutal-border">
                  <div className="text-[10px] font-mono text-muted uppercase font-bold tracking-widest mb-1">Project ID</div>
                  <div className="font-mono text-sm font-bold text-text-main break-all">
                    {import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0568439716"}
                  </div>
               </div>
            </div>
            <p className="font-mono text-[10px] text-muted leading-relaxed">
              * Note: If the Database ID above does not match your AI Studio "Firestore Database ID" precisely, 
              writes will fail and data will appear lost on refresh.
            </p>
          </div>

          <div className="brutal-border bg-white p-8 max-w-4xl w-full mt-8 space-y-6">
            {(() => { try { return localStorage.getItem("firestore_quota_exceeded") === "true"; } catch (e) { return false; } })() && (
              <div className="brutal-border bg-red-50 p-6 border-red-500 max-w-4xl w-full mb-4 space-y-4">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-8 h-8 text-red-600" />
                  <div className="flex-1">
                    <h3 className="font-mono font-bold text-base text-red-600 uppercase">Firestore Quota Exceeded (Cloud Lockout)</h3>
                    <p className="font-mono text-[11px] text-red-500 mt-1 leading-relaxed">
                      The free daily write limit (20,000 units) has been reached. System is running in <strong>Local Storage Mode</strong>. 
                      Changes are saved in this browser but cannot be seen globally until the daily quota resets (Midnight PST).
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-red-200">
                  <div>
                    <h4 className="font-mono text-[10px] font-bold text-red-600 uppercase mb-2">Impact Factors</h4>
                    <ul className="text-[9px] font-mono text-red-500 space-y-1 ml-4 underline-offset-2">
                       <li>• Manual Cloud Syncs (Overwrites whole doc)</li>
                       <li>• Document Size (&gt;64KB per write)</li>
                       <li>• Legacy background tab auto-syncing</li>
                    </ul>
                  </div>
                  <div className="flex flex-col justify-end">
                    <button 
                      onClick={resetQuotaFlag}
                      className="w-full bg-red-600 text-white font-mono text-[10px] font-bold uppercase py-2 hover:bg-black transition-all brutal-border"
                    >
                      Retry Cloud Connection & Clear Error
                    </button>
                    <p className="text-[8px] font-mono text-center mt-1 text-red-400">Only click after daily reset or billing upgrade</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <Database className="w-6 h-6 text-primary" />
                  Protocol Data Backup & Restore
                </h2>
                <p className="font-mono text-xs text-muted mt-2">Download all protocol data (including category metadata and image/video URLs) as CSV. You can re-upload this file for backup merging or complete overwrite.</p>
              </div>
              <div className="flex flex-col items-start md:items-end bg-surface brutal-border p-3 gap-2">
                <div className="flex flex-col items-end">
                  <span className="font-mono text-[10px] text-muted tracking-widest uppercase mb-1 flex items-center gap-1">
                    <span className={`px-2 py-0.5 rounded-none text-[8px] font-bold ${hasUnsavedChanges ? 'bg-amber-100 text-amber-700 animate-pulse border border-amber-300' : 'bg-green-100 text-green-700 border border-green-300'}`}>
                      {hasUnsavedChanges ? 'PENDING_MODIFICATIONS' : 'CLOUD_REPLICA_STABLE'}
                    </span>
                  </span>
                  <span className="font-mono text-xs font-bold text-text-main">
                    Version: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'UNKNOWN'}
                  </span>
                  {lastCloudSync && (
                    <span className="font-mono text-[9px] text-muted tracking-tight mt-1">
                      Last Cloud Handshake: {new Date(lastCloudSync).toLocaleString()}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`px-4 py-1.5 font-mono text-[10px] font-bold uppercase transition-all flex items-center gap-2 brutal-border
                    ${syncStatus === 'success' ? 'bg-green-500 text-white' : 
                      syncStatus === 'error' ? 'bg-red-500 text-white' : 
                      'bg-primary text-white hover:bg-text-main'} disabled:opacity-50`}
                >
                  {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {syncStatus === 'success' ? 'SYNCED TO CLOUD ✓' : 
                   syncStatus === 'error' ? 'SYNC FAILED (QUOTA?)' : 
                   isSyncing ? 'SYNCING...' : 'SYNC TO CLOUD'}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* EXPORT SECTION */}
              <div className="flex-1 brutal-border bg-surface p-4 flex flex-col gap-4 justify-between">
                <div>
                  <h3 className="font-mono font-bold text-sm uppercase flex items-center gap-2 mb-2">
                    <Download className="w-4 h-4 text-primary" /> Export Data
                  </h3>
                  <p className="text-[10px] font-mono text-muted">
                    Downloads a full CSV spreadsheet of all protocols, assets, categories, and statistics.
                  </p>
                </div>
                <button 
                  onClick={handleExportNodes}
                  className="w-full h-10 bg-text-main text-white font-mono text-xs font-bold uppercase hover:bg-primary transition-colors brutal-border flex items-center justify-center gap-2"
                >
                  <HardDriveDownload className="w-4 h-4" /> Download Backup (CSV)
                </button>
              </div>

              {/* SAFE LOCAL RESTORE SECTION */}
              <div className="flex-1 brutal-border bg-surface p-4 flex flex-col gap-4 justify-between">
                <div>
                  <h3 className="font-mono font-bold text-sm uppercase flex items-center gap-2 mb-2">
                    <RotateCcw className="w-4 h-4 text-green-500" /> Local System Backup
                  </h3>
                  <p className="text-[10px] font-mono text-muted">
                    Restores the complete, pristine suite of 8 customized protocol nodes, metrics, and profiles from the secure local system backup (15m ago) and overwrites the online database state.
                  </p>
                </div>
                <div>
                  {localRestoreSuccess ? (
                    <div className="text-[10px] text-green-600 font-mono font-bold p-2 text-center border border-dashed border-green-500 bg-green-50 uppercase mb-2">
                      ✔ Database Overwritten & Restored!
                    </div>
                  ) : null}
                  <button 
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to restore the safe snapshot backup? This will overwrite the database.")) {
                        setIsRestoringLocal(true);
                        try {
                          await restoreFullBackup();
                          setLocalRestoreSuccess(true);
                          setTimeout(() => setLocalRestoreSuccess(false), 5000);
                        } catch (err: any) {
                          alert("Restore failed: " + err.message);
                        } finally {
                          setIsRestoringLocal(false);
                        }
                      }
                    }}
                    disabled={isRestoringLocal}
                    className="w-full h-10 bg-primary text-white font-mono text-xs font-bold uppercase hover:bg-text-main transition-colors brutal-border flex items-center justify-center gap-2 disabled:opacity-55"
                  >
                    {isRestoringLocal ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    Restore Safe Snapshot
                  </button>
                </div>
              </div>

              {/* IMPORT SECTION */}
              <div className="flex-1 brutal-border bg-surface p-4 flex flex-col gap-4 justify-between text-left">
                <div>
                  <h3 className="font-mono font-bold text-sm uppercase flex items-center gap-2 mb-2">
                    <Upload className="w-4 h-4 text-primary" /> Import Data
                  </h3>
                  <p className="text-[10px] font-mono text-muted mb-2">
                    Upload a CSV file to restore protocols. Choose to either overwrite all existing items or merge as a backup.
                  </p>
                  
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-xs font-mono text-text-main file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-xs file:font-mono file:font-bold file:bg-text-main file:text-white hover:file:bg-primary file:cursor-pointer p-2 brutal-border bg-white cursor-pointer"
                  />
                  {importError && (
                    <p className="text-[10px] text-red-500 font-mono mt-2">{importError}</p>
                  )}
                  {importData && (
                    <p className="text-[10px] text-primary font-mono mt-2 font-bold">
                      Parsed {importData.length} items. Ready.
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => handleImport('merge')}
                    disabled={!importData}
                    className="flex-1 h-10 bg-white text-text-main font-mono text-xs font-bold uppercase hover:border-primary hover:text-primary transition-colors brutal-border disabled:opacity-50 disabled:cursor-not-allowed text-center"
                  >
                    Merge
                  </button>
                  <button 
                    onClick={() => handleImport('overwrite')}
                    disabled={!importData}
                    className="flex-1 h-10 bg-white text-red-600 border-red-600 border font-mono text-xs font-bold uppercase hover:bg-red-55 transition-colors brutal-border disabled:opacity-50 disabled:cursor-not-allowed text-center"
                  >
                    Overwrite
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="brutal-border bg-white p-8 max-w-4xl w-full mt-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <Activity className="w-6 h-6 text-primary" />
                  Career Changelog (Resume) Backup
                </h2>
                <p className="font-mono text-xs text-muted mt-2">Download/Upload all career history items. Points are concatenated with '|'.</p>
              </div>
              <button 
                onClick={handleExportExperiences}
                className="h-10 px-4 bg-text-main text-white font-mono text-[10px] font-bold uppercase hover:bg-primary transition-colors brutal-border flex items-center justify-center gap-2"
              >
                <Download className="w-3 h-3" /> Export Career CSV
              </button>
            </div>

            <div className="bg-surface p-6 brutal-border flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1 w-full">
                <label className="font-mono text-[10px] text-muted font-bold tracking-widest uppercase mb-3 block">Upload Updated Career CSV</label>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleExperiencesFileChange}
                  className="block w-full text-xs font-mono text-text-main file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-xs file:font-mono file:font-bold file:bg-text-main file:text-white hover:file:bg-primary file:cursor-pointer p-2 brutal-border bg-white cursor-pointer"
                />
              </div>
              <button 
                onClick={applyExperiencesImport}
                disabled={!experiencesImportData}
                className="h-12 px-8 bg-primary text-white font-mono text-xs font-bold uppercase hover:bg-text-main transition-colors brutal-border disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                <Upload className="w-4 h-4" /> Apply Career Config
              </button>
            </div>
          </div>

          <div className="brutal-border bg-white p-8 max-w-4xl w-full mt-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <Activity className="w-6 h-6 text-primary" />
                  Main Dashboard Content Backup
                </h2>
                <p className="font-mono text-xs text-muted mt-2">Download/Upload all text content from the home page (Hero, Headlines, Methods, Specs) in a single Section-Key-Value CSV.</p>
              </div>
              <button 
                onClick={handleExportDashboard}
                className="h-10 px-4 bg-text-main text-white font-mono text-[10px] font-bold uppercase hover:bg-primary transition-colors brutal-border flex items-center justify-center gap-2"
              >
                <Download className="w-3 h-3" /> Export Dashboard CSV
              </button>
            </div>

            <div className="bg-surface p-6 brutal-border flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1 w-full">
                <label className="font-mono text-[10px] text-muted font-bold tracking-widest uppercase mb-3 block">Upload Updated Dashboard CSV</label>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleDashboardFileChange}
                  className="block w-full text-xs font-mono text-text-main file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-xs file:font-mono file:font-bold file:bg-text-main file:text-white hover:file:bg-primary file:cursor-pointer p-2 brutal-border bg-white cursor-pointer"
                />
              </div>
              <button 
                onClick={applyDashboardImport}
                disabled={!dashboardImportData}
                className="h-12 px-8 bg-primary text-white font-mono text-xs font-bold uppercase hover:bg-text-main transition-colors brutal-border disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                <Upload className="w-4 h-4" /> Apply Dashboard Config
              </button>
            </div>
          </div>

          <div className="brutal-border bg-white p-8 max-w-4xl w-full mt-8 space-y-6">
            <h2 className="font-display text-xl font-bold uppercase tracking-tight flex items-center gap-2">
              <AlignJustify className="w-6 h-6 text-primary" />
              Manage Protocols Order
            </h2>
            <p className="font-mono text-xs text-muted">Reorder protocols manually. The order below is accurately reflected throughout the App.</p>
            <div className="space-y-2">
              {data.nodes.map((node, index) => (
                <div key={node.id} className="flex items-center justify-between p-3 brutal-border bg-surface">
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-sm tracking-tight">{node.title}</span>
                    <span className="font-mono text-[10px] text-muted">{node.id}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={index === 0}
                      onClick={() => moveNodeUp(index)}
                      className="p-2 brutal-border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary hover:text-white transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      disabled={index === data.nodes.length - 1}
                      onClick={() => moveNodeDown(index)}
                      className="p-2 brutal-border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary hover:text-white transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FIREBASE STORAGE ASSET AUDIT & UPLOAD CENTER */}
          <div className="brutal-border bg-white p-8 max-w-4xl w-full mt-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
              <div>
                <h2 className="font-display text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  Firebase Cloud Storage Asset Audit & Upload Center
                </h2>
                <p className="font-mono text-xs text-muted mt-2">
                  Audit attached Cover Images, PDFs (Decks), and Videos for all nodes. Uploading a file directly attaches it to Firebase Storage and updates local cache instantly.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-300 p-3 text-[10px] font-mono text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Uploaded files save directly to Firebase Storage bucket and sync via Firestore.</span>
              </div>
            </div>

            <div className="space-y-4">
              {data.nodes.map((node, index) => {
                const hasCover = Boolean(node.assets?.bgImageUrl);
                const hasDeck = Boolean(node.assets?.deckUrl);
                const hasVideo = Boolean(node.assets?.videoUrl);
                const isTargetNode = [11, 12].includes(index + 1);

                return (
                  <div 
                    key={node.id} 
                    className={`p-4 brutal-border bg-surface flex flex-col gap-3 transition-colors ${
                      isTargetNode && (!hasDeck || !hasVideo || !hasCover) ? 'border-amber-400 bg-amber-50/40' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-text-main text-white">
                          #{index + 1}
                        </span>
                        <span className="font-mono font-bold text-sm tracking-tight">{node.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono flex-wrap">
                        <span className={`px-2 py-0.5 font-bold ${hasCover ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                          {hasCover ? '✓ COVER' : '❌ NO COVER'}
                        </span>
                        <span className={`px-2 py-0.5 font-bold ${hasDeck ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                          {hasDeck ? '✓ DECK (PDF)' : '❌ NO DECK'}
                        </span>
                        <span className={`px-2 py-0.5 font-bold ${hasVideo ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                          {hasVideo ? '✓ VIDEO' : '❌ NO VIDEO'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      {/* COVER IMAGE UPLOADER */}
                      <div className="bg-white p-3 brutal-border flex flex-col justify-between gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-muted uppercase flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-primary" /> Cover Image
                          </span>
                          {hasCover && (
                            <a 
                              href={node.assets.bgImageUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[9px] font-mono text-primary font-bold hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> View Image
                            </a>
                          )}
                        </div>
                        <FileUploader 
                          accept="image/*"
                          label={hasCover ? "RE-UPLOAD COVER" : "UPLOAD COVER IMAGE"}
                          onUploadComplete={(newUrl) => {
                            updateData(prev => ({
                              ...prev,
                              nodes: prev.nodes.map(n => n.id === node.id ? {
                                ...n,
                                assets: { ...(n.assets || {}), bgImageUrl: newUrl }
                              } : n)
                            }));
                          }}
                        />
                      </div>

                      {/* PDF / DECK UPLOADER */}
                      <div className="bg-white p-3 brutal-border flex flex-col justify-between gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-muted uppercase flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-primary" /> PDF / Presentation
                          </span>
                          {hasDeck && (
                            <a 
                              href={node.assets.deckUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[9px] font-mono text-primary font-bold hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> View Deck
                            </a>
                          )}
                        </div>
                        <FileUploader 
                          accept="application/pdf"
                          label={hasDeck ? "RE-UPLOAD PDF" : "UPLOAD PDF PRESENTATION"}
                          onUploadComplete={(newUrl) => {
                            updateData(prev => ({
                              ...prev,
                              nodes: prev.nodes.map(n => n.id === node.id ? {
                                ...n,
                                assets: { ...(n.assets || {}), deckUrl: newUrl }
                              } : n)
                            }));
                          }}
                        />
                      </div>

                      {/* VIDEO UPLOADER */}
                      <div className="bg-white p-3 brutal-border flex flex-col justify-between gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-muted uppercase flex items-center gap-1">
                            <Video className="w-3.5 h-3.5 text-primary" /> MP4 Video
                          </span>
                          {hasVideo && (
                            <a 
                              href={node.assets.videoUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[9px] font-mono text-primary font-bold hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> View Video
                            </a>
                          )}
                        </div>
                        <FileUploader 
                          accept="video/mp4"
                          label={hasVideo ? "RE-UPLOAD VIDEO" : "UPLOAD MP4 VIDEO"}
                          onUploadComplete={(newUrl) => {
                            updateData(prev => ({
                              ...prev,
                              nodes: prev.nodes.map(n => n.id === node.id ? {
                                ...n,
                                assets: { ...(n.assets || {}), videoUrl: newUrl }
                              } : n)
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 h-screen bg-surface p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="brutal-border bg-white p-6 md:p-8 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-6 h-6 text-primary" />
          <h1 className="font-display text-xl font-bold uppercase tracking-tight">Admin Override</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-primary/10 text-primary p-3 font-mono text-xs font-bold w-full text-center brutal-border uppercase">
              Access Denied
            </motion.div>
          )}
          <div className="space-y-2">
            <label className="font-mono text-[10px] text-muted font-bold tracking-widest uppercase">Operator ID</label>
            <input 
              type="text" 
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full h-12 px-4 bg-surface brutal-border font-mono text-sm focus:outline-none focus:border-primary rounded-none"
              placeholder="Enter ID..."
            />
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] text-muted font-bold tracking-widest uppercase">Passcode</label>
            <input 
              type="password" 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full h-12 px-4 bg-surface brutal-border font-mono text-sm focus:outline-none focus:border-primary rounded-none"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            className="w-full h-12 mt-4 bg-text-main text-white font-mono text-xs font-bold uppercase hover:bg-primary active:bg-primary transition-colors brutal-border flex items-center justify-center gap-2"
          >
            Authenticate
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

