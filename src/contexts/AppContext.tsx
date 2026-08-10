import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { db, handleQuotaExceeded } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import BACKUP_PORTFOLIO_DATA from './backup_portfolio.json';

export { BACKUP_PORTFOLIO_DATA };

export const INITIAL_DATA = {
  hero: {
    desc: "Architecting high-scale logistics networks and automated control towers. I bridge the gap between heavy physical operations and intelligent digital layers.",
    terminal1: "> Building the systems that move India's largest logistics parcels.",
    role: "VP OF PRODUCT // OPERATIONS",
    name: "ANSHUL MAHESHWARI",
    terminal2: "> 10+ years scaling PTL supply chains, Fintech ledgers, and AI-driven ops."
  },
  headlines: [
    { id: "h1", v: "1.5L+", k: "daily orders managed" },
    { id: "h2", v: "₹10Cr+", k: "annual revenue growth" },
    { id: "h3", v: "94%", k: "on-time delivery rate" },
    { id: "h4", v: "-35%", k: "last-mile cost reduction" }
  ],
  methodHeading: "Anyone can solve an assigned problem.\nThe skill is finding the expensive one first.",
  methodCadence: "One real problem framed and solved every week.",
  method: [
    { id: "m1", n: "01", t: "Watch the signals", d: "Anomalies, repeat complaints, the spreadsheet everyone secretly relies on. Problems announce themselves before they hit a dashboard." },
    { id: "m2", n: "02", t: "Quantify the bleed", d: "Turn the symptom into a number — rupees, percentage points, hours. If it can't be sized, it can't be prioritized." },
    { id: "m3", n: "03", t: "Frame the real problem", d: "Separate the symptom from the root cause. The obvious problem is rarely the expensive one underneath it." },
    { id: "m4", n: "04", t: "Ship the smallest fix", d: "Design the minimal change that stops the bleed and proves the thesis — then scale what works." },
  ],
  casebookTitle: "Problems found, sized, and solved.",
  casebookSub: "Each one starts with a signal most teams miss — and ends with a number on the board.",
  nodes: [
    {
      id: "marut-ai",
      date: "2024.Q2",
      title: "Payment manual decision leads to logistics decision bottleneck",
      description: "Enterprise supply chains suffer from fragmented, manual decision-making across transport indents and payment disbursements, leading to high operational latency.",
      assets: {
        videoDuration: "04:15",
        deckSize: "12.4MB",
        bgImageUrl: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0568439716.firebasestorage.app/o/uploads%2F1777711766215_Screenshot%202026-05-01%20at%205.36.56%E2%80%AFPM.png?alt=media&token=040a5db9-ef6c-41f7-8487-1e2d8a7056d0",
        videoUrl: "",
        deckUrl: "",
        systemFlowUrl: ""
      },
      content: {
          railMetricVal: "70%", railMetricLbl: "AUTONOMOUS APPROVAL RATE",
          stat1Val: "", stat1Lbl: "THE SIGNAL", stat1Desc: "Enterprise supply chains suffer from fragmented, manual decision-making across transport indents and payment disbursements, leading to high operational latency.",
          stat2Val: "", stat2Lbl: "THE COST", stat2Desc: "Transport indents, vendor checks, invoices and payment approvals still move through calls, Excel and manual final review. This creates payment delay, fraud risk, duplicate claims and weak audit visibility.",
          stat3Val: "", stat3Lbl: "THE FIX", stat3Desc: "AI agents validate trip evidence, apply finance guardrails and decide whether to auto-approve, hold, partially approve or escalate payment.",
          stat4Val: "", stat4Lbl: "THE RETURN", stat4Desc: "Eliminated ₹4.5Cr daily credit exposure and automated reconciliation cycles, securing 100% audit transparency across the carrier network.",
          role: "Product Strategy + AI Ops",
          scope: "Decision Intelligence, Payments, TMS",
          status: "Active Case Study",
          headerId: "OPS_CORE_V2.1",
          figName: "FIG_01: HUB_INTELLIGENCE",
          productBucket: "AI-NATIVE LOGISTICS // DECISION INTELLIGENCE & AGENTIC TMS",
          solutionTitle: "The Predictive Core",
          solutionCode: "const agent = new MarutAI({\n  mode: 'PREDICTIVE',\n  latency: 'SUB_MS'\n});",
          solutionFlow: [{ id: "1", n: "1", t: "Ingest Hub Load", d: "System reads active barcodes at 09:00" }]
      }
    },
    {
      id: "fintech-ledger-2",
      date: "2024.Q1",
      title: "Trip-End Reconciliation",
      description: "Carrier settlements were fragmented across 4 gateways, causing massive reconciliation delays and credit exposure.",
      assets: {
        videoUrl: "",
        videoDuration: "02:45",
        deckUrl: "",
        deckSize: "8.2MB",
        systemFlowUrl: ""
      },
      content: {
          railMetricVal: "100%", railMetricLbl: "AUTO_RECON",
          stat1Val: "100%", stat1Lbl: "AUTO_RECON", stat1Desc: "Manual ledger entry eliminated through zero-latency bank nodes.",
          stat2Val: "<0.1%", stat2Lbl: "LEAKAGE_RATE", stat2Desc: "Revenue leakage reduced to near-zero via instant geofence sync.",
          stat3Val: "30s", stat3Lbl: "SYNC_LATENCY", stat3Desc: "Time taken to reconcile trip settlements vs 72 hours previously.",
          stat4Val: "₹4.5Cr", stat4Lbl: "CREDIT_EXPOSURE", stat4Desc: "Reduced daily credit risk by automating settlement verification.",
          role: "Fintech Ops Lead",
          scope: "Ledger architecture, bank APIs, and geofence mapping",
          status: "Deployed",
          headerId: "FIN_SYNC_V1.0",
          figName: "FIG_02: LEDGER_CORE",
          productBucket: "Fintech Operations",
          solutionTitle: "Zero-Latency Ledger",
          solutionCode: "const sync = new LedgerSync({\n  nodes: ['ICICI', 'HDFC'],\n  auth_level: 4\n});",
          solutionFlow: [{ id: "1", n: "1", t: "POD Upload", d: "Driver uploads delivery proof at 14:00" }]
      }
    },
    {
      id: "hyperlocal-pinified",
      date: "2023.Q4",
      title: "Pinified Delivery Network",
      description: "SME and D2C brands lacked reliable last-mile fulfilment for ultra-fast, intra-city deliveries at scale.",
      assets: {
        videoUrl: "",
        videoDuration: "08:20",
        deckUrl: "",
        deckSize: "18.5MB",
        systemFlowUrl: ""
      },
      content: {
          railMetricVal: "94%", railMetricLbl: "OTD_ACCURACY",
          stat1Val: "94%", stat1Lbl: "OTD_ACCURACY", stat1Desc: "Consistent delivery windows maintained through partner density mapping.",
          stat2Val: "-35%", stat2Lbl: "OPEX_REDUCTION", stat2Desc: "Last-mile operational overhead reduced via automated assignment.",
          stat3Val: "15min", stat3Lbl: "PICKUP_LATENCY", stat3Desc: "Average time from order entry to driver arrival at SME warehouse.",
          stat4Val: "4.8/5", stat4Lbl: "PARTNER_CSAT", stat4Desc: "Driver satisfaction score driven by fair, automated load distribution.",
          role: "Product Lead",
          scope: "Partner apps, density mapping, and SME dashboards",
          status: "Active",
          headerId: "PIN_CORE_V1.5",
          figName: "FIG_03: HYPERLOCAL_OPS",
          productBucket: "Hyperlocal Logistics",
          solutionTitle: "The Hyperlocal Node",
          solutionCode: "const city = new HyperlocalNode({\n  partners: rider_pool,\n  geo_sync: true\n});",
          solutionFlow: [{ id: "1", n: "1", t: "Order Entry", d: "SME pushes order to portal at 10:30" }]
      }
    }
  ],
  specs: [
    { label: "Network Intelligence", value: 94, id: "s1" },
    { id: "s2", value: 90, label: "TMS Architecture" },
    { id: "s3", value: 86, label: "Fintech Ops" },
    { label: "AI Decision Systems", id: "s4", value: 82 },
    { label: "Partner Strategy", value: 80, id: "s5" }
  ],
  experiences: [
    {
      title: "VP OF PRODUCT // OPERATIONS",
      isPrimary: true,
      points: [
        "Leading digital transformation for ₹1000Cr+ logistics group, overseeing PTL, SaaS, and AI-led operations.",
        "Launched Marut AI and Pinified platform, improving team productivity by 2.8x and CSAT by 48%.",
        "Architected enterprise Control Tower to digitize legacy hub operations and improve decision speed by 58%.",
        "Scaled B2B logistics SaaS to ₹10Cr+ annual growth within the first 12 months.",
        "Managing ₹7Cr annual tech budget and a 15+ member interdisciplinary product and data team."
      ],
      id: "e1",
      date: "2024—PRESENT",
      company: "SHREE MARUTI",
      subSections: []
    },
    {
      company: "Freight Tiger",
      date: "2018—2021",
      points: [
        "Led fleet strategy for enterprise shipment visibility, route clustering, and automated geofence escalations.",
        "Improved fleet utilization by 22% and reduced enterprise OPEX by 18% through route optimization.",
        "Automated driver KYC and onboarding, reducing platform fraud by 40% and accelerating setup by 65%."
      ],
      id: "e2",
      isPrimary: false,
      title: "SENIOR PRODUCT MANAGER",
      subSections: []
    },
    {
      company: "HDFC Bank",
      title: "AVP — CONSUMER LENDING",
      isPrimary: false,
      id: "e3",
      points: [
        "Modernized NBFC API gateway for high-scale digital lending nodes.",
        "Reduced disbursal cycle from 72 hours to 30 seconds, achieving a 75% approval rate improvement.",
        "Implemented ML fraud classifiers, reducing compliance overheads by 25%."
      ],
      date: "2023",
      subSections: []
    }
  ],
  capabilities: [
    { label: "SYSTEMS_DESIGN", id: "c1", value: 94 },
    { value: 88, id: "c2", label: "PRODUCT_STRATEGY" },
    { label: "OPS_AUTOMATION", id: "c3", value: 90 },
    { id: "c4", value: 82, label: "AI_IMPLEMENTATION" }
  ],
  resumeUrl: "",
  resumeText: "",
  navLabels: {
    dash: "DASH",
    log: "RESUME / WORK EXP",
    ping: "PING",
    admin: "ADMIN"
  },
  dashboardLabels: {
    active_node: "ACTIVE_NODES"
  },
  unansweredQuestions: [],
  logs: [
    { id: "l1", date: "2024-06-01T10:00:00Z", category: "SYSTEM", event: "Dashboard initialized", detail: "Initial load of portfolio data completed." },
    { id: "l2", date: "2024-06-02T14:30:00Z", category: "UPDATE", event: "Hero section modified", detail: "Updated role and description for better clarity." }
  ],
  apiKeys: {
    gemini: ""
  },
  lastUpdated: new Date().toISOString()
};

export const ALLOWED_CATEGORIES = [
  "Decision Intelligence & Agentic TMS",
  "AI Finance Ops & Audits",
  "Credit & Risk Engines",
  "Retail & Inventory Intelligence",
  "Pre-Sales Serviceability Engines",
  "Geofence & Fleet Operations",
  "AI Sales & Pricing Copilots",
  "Predictive Delay & SLA Intelligence",
  "Logistics Pricing Decision Engines",
  "Control Tower & Fleet Telematics"
];

export function getNormalizedCategory(pb: string | undefined, title: string | undefined): string {
  const t = (title || "").toLowerCase();
  const cat = (pb || "").toLowerCase();

  // 1. Decision Intelligence & Agentic TMS
  if (t.includes("manual decision") || t.includes("manual indent") || cat.includes("tms automation") || cat.includes("agentic tms")) {
    return "Decision Intelligence & Agentic TMS";
  }
  // 2. AI Finance Ops & Audits
  if (t.includes("invoice-payment") || t.includes("leakage and mismatch") || cat.includes("finance ops") || cat.includes("payment audit")) {
    return "AI Finance Ops & Audits";
  }
  // 3. Credit & Risk Engines
  if (t.includes("credit bottleneck") || cat.includes("credit engine")) {
    return "Credit & Risk Engines";
  }
  // 4. Retail & Inventory Intelligence
  if (t.includes("fresh waste") || t.includes("store-level fresh") || cat.includes("retail inventory") || cat.includes("fresh waste")) {
    return "Retail & Inventory Intelligence";
  }
  // 5. Pre-Sales Serviceability Engines
  if (t.includes("darkstore sales") || t.includes("serviceability") || cat.includes("serviceability")) {
    return "Pre-Sales Serviceability Engines";
  }
  // 6. Geofence & Fleet Operations
  if (t.includes("fleet allocation") || cat.includes("geofence fleet")) {
    return "Geofence & Fleet Operations";
  }
  // 7. AI Sales & Pricing Copilots
  if (t.includes("weak negotiation") || cat.includes("sales pricing copilot")) {
    return "AI Sales & Pricing Copilots";
  }
  // 8. Predictive Delay & SLA Intelligence
  if (t.includes("reactive tracking") || t.includes("delay") || cat.includes("predictive delay") || cat.includes("sla intelligence")) {
    return "Predictive Delay & SLA Intelligence";
  }
  // 9. Logistics Pricing Decision Engines
  if (t.includes("fragmented pricing") || cat.includes("pricing decision engine")) {
    return "Logistics Pricing Decision Engines";
  }
  // 10. Control Tower & Fleet Telematics
  if (t.includes("farm supply") || t.includes("ev downtime") || cat.includes("control tower") || cat.includes("telematics")) {
    return "Control Tower & Fleet Telematics";
  }

  // Fallback to closest or default
  return "Decision Intelligence & Agentic TMS";
}

export function sanitizePortfolioData(d: any): any {
  if (!d) return d;
  const cleaned = { ...d };
  if (cleaned.navLabels) {
    cleaned.navLabels = { ...cleaned.navLabels };
    if (cleaned.navLabels.log === "LOG" || cleaned.navLabels.log === "RESUME") {
      cleaned.navLabels.log = "RESUME / WORK EXP";
    }
    if (cleaned.navLabels.media) {
      delete cleaned.navLabels.media;
    }
  }

  // Ensure nodes have normalized categories, complete 4-pillar fields, and updatedAt timestamps
  if (cleaned.nodes && Array.isArray(cleaned.nodes)) {
    cleaned.nodes = cleaned.nodes.map((node: any, idx: number) => {
      const backupNode = (BACKUP_PORTFOLIO_DATA.nodes || [])[idx] || (BACKUP_PORTFOLIO_DATA.nodes || []).find((b: any) => b.id === node.id);

      const title = node.title || backupNode?.title || "";
      const currentPb = node.content?.productBucket || backupNode?.content?.productBucket || "";
      const normalizedPb = getNormalizedCategory(currentPb, title);

      const nodeWithCategory = {
        ...backupNode,
        ...node,
        title,
        content: {
          ...(backupNode?.content || {}),
          ...(node.content || {}),
          productBucket: normalizedPb,
          subtitle: node.content?.subtitle || backupNode?.content?.subtitle || "",
          stat1Lbl: node.content?.stat1Lbl || backupNode?.content?.stat1Lbl || "SIGNAL",
          stat1Val: node.content?.stat1Val || backupNode?.content?.stat1Val || "",
          stat1Desc: node.content?.stat1Desc || backupNode?.content?.stat1Desc || "",
          stat2Lbl: node.content?.stat2Lbl || backupNode?.content?.stat2Lbl || "COST",
          stat2Val: node.content?.stat2Val || backupNode?.content?.stat2Val || "",
          stat2Desc: node.content?.stat2Desc || backupNode?.content?.stat2Desc || "",
          stat3Lbl: node.content?.stat3Lbl || backupNode?.content?.stat3Lbl || "FIX",
          stat3Val: node.content?.stat3Val || backupNode?.content?.stat3Val || "",
          stat3Desc: node.content?.stat3Desc || backupNode?.content?.stat3Desc || "",
          stat4Lbl: node.content?.stat4Lbl || backupNode?.content?.stat4Lbl || "RETURN",
          stat4Val: node.content?.stat4Val || backupNode?.content?.stat4Val || "",
          stat4Desc: node.content?.stat4Desc || backupNode?.content?.stat4Desc || "",
          railMetricVal: node.content?.railMetricVal || backupNode?.content?.railMetricVal || "",
          railMetricLbl: node.content?.railMetricLbl || backupNode?.content?.railMetricLbl || "",
        }
      };

      if (!nodeWithCategory.updatedAt) {
        // Use explicitly scrambled (non-sequential) baseline timestamps
        // index 0 (marut-ai) -> 4 days ago
        // index 1 (fintech-ledger-2) -> 3 hours ago (Rank 1)
        // index 2 (hyperlocal-pinified) -> 1.5 days ago (Rank 2)
        let timeOffset = 1000 * 60 * 60 * 24 * 7; // Default 7 days ago
        if (nodeWithCategory.id === "fintech-ledger-2") {
          timeOffset = 1000 * 60 * 60 * 3; // 3 hours ago
        } else if (nodeWithCategory.id === "hyperlocal-pinified") {
          timeOffset = 1000 * 60 * 60 * 36; // 36 hours (1.5 days) ago
        } else if (nodeWithCategory.id === "marut-ai") {
          timeOffset = 1000 * 60 * 60 * 24 * 4; // 4 days ago
        } else {
          // Scramble for other nodes as well
          timeOffset = 1000 * 60 * 60 * (12 + (idx * 17) % 120);
        }
        const defaultTime = new Date(Date.now() - timeOffset).toISOString();
        return { ...nodeWithCategory, updatedAt: defaultTime };
      }
      return nodeWithCategory;
    });
  }
  return cleaned;
}

type AppContextType = {
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  data: any;
  updateData: (updater: (prev: any) => any) => void;
  restoreFullBackup: () => Promise<void>;
  isAdmin: boolean;
  login: (id: string, pass: string) => boolean;
  logout: () => void;
  syncToCloud: () => Promise<void>;
  resetQuotaFlag: () => void;
  loading: boolean;
  hasUnsavedChanges: boolean;
  lastCloudSync: string | null;
  cloudError: string | null;
};

export const AppContext = createContext<AppContextType | null>(null);

function getSafeStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function setSafeStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
}

function removeSafeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(() => getSafeStorageItem("firestore_quota_exceeded") === "true");
  const [isAdmin, setIsAdmin] = useState(() => {
    return getSafeStorageItem("is_admin") === "true";
  });
  
  const [data, setData] = useState<any>(() => {
    const cached = getSafeStorageItem("portfolio_data");
    try {
      return cached ? sanitizePortfolioData(JSON.parse(cached)) : sanitizePortfolioData(BACKUP_PORTFOLIO_DATA);
    } catch (e) {
      return sanitizePortfolioData(BACKUP_PORTFOLIO_DATA);
    }
  });

  // Keep refs up to date to prevent stale state closure loops in onSnapshot
  const dataRef = useRef<any>(data);
  const hasUnsavedChangesRef = useRef<boolean>(hasUnsavedChanges);
  const isSyncingRef = useRef<boolean>(false);
  
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Sync with Firestore
  useEffect(() => {
    if (quotaExceeded) {
      console.warn("[AppContext] Firestore quota exhausted. Operating exclusively in reliable offline LocalStorage mode.");
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'portfolio', 'main');
    let active = true;

    // Failsafe timer (3 seconds) to prevent infinite loading state in boxed iframe/WS blocks
    const failsafeTimeout = setTimeout(() => {
      if (active) {
        console.warn("[AppContext] Failsafe timeout reached. Resolving loading spinner anyway.");
        setLoading(false);
      }
    }, 3000);

    const handleSnapshotData = (snapshot: any) => {
      setCloudError(null);
      if (snapshot.exists()) {
        const fbData = snapshot.data();
        
        // CRITICAL: If we have unsaved local changes, we MUST NOT let the cloud snapshot overwrite our state.
        if (hasUnsavedChangesRef.current) {
          console.log("[AppContext] Local changes pending. Ignoring background cloud snapshot to prevent overwrite.");
          setLoading(false);
          return;
        }
        
        const currentLocal = dataRef.current;
        
        // Timestamp validation check: Only ignore cloud if local is STRICTLY newer.
        if (currentLocal && currentLocal.lastUpdated && fbData && fbData.lastUpdated) {
          const currentLocalTime = new Date(currentLocal.lastUpdated).getTime();
          const remoteTime = new Date(fbData.lastUpdated).getTime();
          
          if (currentLocalTime > remoteTime) {
            setLoading(false);
            return;
          }
        }

        const mergedFbData = sanitizePortfolioData({ 
          ...BACKUP_PORTFOLIO_DATA, 
          ...fbData
        });

        try {
          localStorage.setItem("portfolio_data", JSON.stringify(mergedFbData));
        } catch (e) {}

        setData(mergedFbData);
        setLastCloudSync(new Date().toISOString());
      } else {
        console.log("[AppContext] Cloud document not found. Keeping local/cached state.");
      }
      setLoading(false);
    };

    // 1. Fetch instantly via lightweight single-hop HTTPS (great fallback for sandboxed iframe socket blocks!)
    console.log("[AppContext] Issuing initial fast getDoc pull.");
    getDoc(docRef)
      .then((snapshot) => {
        if (active) {
          console.log("[AppContext] Fast getDoc pull completed successfully.");
          handleSnapshotData(snapshot);
        }
      })
      .catch((err) => {
        console.warn("[AppContext] Fast getDoc pull failed (falling back to local cache):", err);
        if (active) {
          setLoading(false);
        }
      });

    // 2. Establish live listener for real-time admin sync
    console.log("[AppContext] Establishing active real-time cloud listener.");
    const unsubscribe = onSnapshot(docRef, 
      (snapshot) => {
        if (active) {
          console.log("[AppContext] Real-time onSnapshot data received.");
          handleSnapshotData(snapshot);
        }
      },
      (error: any) => {
        console.warn("[AppContext] Firestore real-time notice:", error);
        if (active) {
          const errMsg = String(error?.message || error);
          if (error?.code === 'resource-exhausted' || errMsg.includes('resource-exhausted') || errMsg.includes('exhausted')) {
            setQuotaExceeded(true);
            handleQuotaExceeded();
          } else if (errMsg.includes('Failed to fetch') || error?.code === 'unavailable') {
            console.warn("[AppContext] Network/fetch constraint encountered. Operating seamlessly with local cache.");
            setCloudError(null);
          } else {
            setCloudError(errMsg);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      active = false;
      clearTimeout(failsafeTimeout);
      console.log("[AppContext] Successfully unsubscribing from Firestore real-time updates.");
      unsubscribe();
    };
  }, [quotaExceeded]);


  const updateData = (updater: (prev: any) => any) => {
    setData((prev: any) => {
      const nextData = updater(prev);
      nextData.lastUpdated = new Date().toISOString(); 
      
      // Update specific node updatedAt timestamp if any node has been modified
      if (prev && prev.nodes && nextData && nextData.nodes) {
        const now = new Date().toISOString();
        nextData.nodes = nextData.nodes.map((n: any) => {
          const oldNode = prev.nodes.find((o: any) => o.id === n.id);
          if (oldNode) {
            // Ignore updatedAt when comparing contents to avoid matching changes in timestamp
            const oldNoTime = { ...oldNode, updatedAt: undefined };
            const newNoTime = { ...n, updatedAt: undefined };
            if (JSON.stringify(oldNoTime) !== JSON.stringify(newNoTime)) {
              return { ...n, updatedAt: now };
            }
          } else {
            // This is a new node entirely
            return { ...n, updatedAt: now };
          }
          return n;
        });
      }

      try {
        localStorage.setItem("portfolio_data", JSON.stringify(nextData));
      } catch (e) {}
      return nextData;
    });

    setHasUnsavedChanges(true);
  };

  // Debounced auto-save to cloud
  useEffect(() => {
    if (!isAdmin || quotaExceeded || !hasUnsavedChanges) {
      return;
    }

    console.log("[AppContext] Queueing debounced auto-sync (2s after editing stops).");
    const timer = setTimeout(() => {
      if (isSyncingRef.current) {
        console.log("[AppContext] Previous sync still in flight. Skipping queueing.");
        return;
      }

      const docRef = doc(db, 'portfolio', 'main');
      const latestData = dataRef.current;
      
      console.log("[AppContext] Debounced auto-sync writing to cloud database...");
      isSyncingRef.current = true;

      setDoc(docRef, latestData)
        .then(() => {
          setHasUnsavedChanges(false);
          setCloudError(null);
          console.log("[AppContext] Debounced auto-synced changes successfully persisted to cloud.");
        })
        .catch(e => {
          console.error("[AppContext] Debounced auto-sync failed:", e);
          const errMsg = String(e?.message || e);
          if (e?.code === 'resource-exhausted' || errMsg.includes('resource-exhausted') || errMsg.includes('exhausted')) {
            setQuotaExceeded(true);
            handleQuotaExceeded();
          }
          setHasUnsavedChanges(false);
          setCloudError("Auto-sync paused. Saved locally.");
        })
        .finally(() => {
          isSyncingRef.current = false;
        });
    }, 2000); // 2.0 seconds debounce

    return () => clearTimeout(timer);
  }, [data, isAdmin, quotaExceeded, hasUnsavedChanges]);

  const syncToCloud = async () => {
    if (quotaExceeded) throw new Error("Quota exceeded. Sync disabled.");
    if (isSyncingRef.current) throw new Error("A sync operation is already in progress.");
    
    const docRef = doc(db, 'portfolio', 'main');
    try {
      isSyncingRef.current = true;
      // Direct pull from synchronous cache to avoid any React batching stale state
      const cached = getSafeStorageItem("portfolio_data");
      const latestData = cached ? JSON.parse(cached) : data;
      latestData.lastUpdated = new Date().toISOString();
      
      await setDoc(docRef, latestData);
      
      setData(latestData);
      setHasUnsavedChanges(false);
      setCloudError(null);
      console.log("[AppContext] Successfully synced to cloud.");
    } catch (err: any) {
      const errMsg = String(err?.message || err);
      if (err?.code === 'resource-exhausted' || errMsg.includes('resource-exhausted') || errMsg.includes('exhausted')) {
        setQuotaExceeded(true);
        handleQuotaExceeded();
      }
      throw err;
    } finally {
      isSyncingRef.current = false;
    }
  };

  const resetQuotaFlag = () => {
    removeSafeStorageItem("firestore_quota_exceeded");
    setQuotaExceeded(false);
    window.location.reload(); // Refresh to re-initialize SDK connection
  };

  const restoreFullBackup = async () => {
    try {
      if (quotaExceeded) {
        console.warn("[AppContext] Firestore quota exhausted, skipping restore.");
        return;
      }
      const docRef = doc(db, 'portfolio', 'main');
      const sanitized = sanitizePortfolioData(BACKUP_PORTFOLIO_DATA);
      await setDoc(docRef, sanitized);
      setData(sanitized);
      console.log("[AppContext] Successfully restored database back to safe snapshot.");
    } catch (err: any) {
      console.error("[AppContext] Failed to restore safe snapshot:", err);
      throw new Error(err.message || "Could not write snapshot to Firestore");
    }
  };

  const login = (id: string, pass: string) => {
    if (id === 'maheshwarianshul1985' && pass === 'pranali1985') {
      setIsAdmin(true);
      setSafeStorageItem("is_admin", "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    setIsEditing(false);
    removeSafeStorageItem("is_admin");
  };

  return (
    <AppContext.Provider value={{ 
      isEditing, 
      setIsEditing, 
      data, 
      updateData, 
      restoreFullBackup, 
      syncToCloud, 
      resetQuotaFlag, 
      isAdmin, 
      login, 
      logout, 
      loading, 
      hasUnsavedChanges, 
      lastCloudSync,
      cloudError
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
};
