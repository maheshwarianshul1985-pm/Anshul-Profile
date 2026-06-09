import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { db, handleQuotaExceeded } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import BACKUP_PORTFOLIO_DATA from './backup_portfolio.json';

export const INITIAL_DATA = {
  hero: {
    desc: "Architecting high-scale logistics networks and automated control towers. I bridge the gap between heavy physical operations and intelligent digital layers.",
    terminal1: "> Building the systems that move India's largest logistics parcels.",
    role: "VP OF PRODUCT // OPERATIONS",
    name: "ANSHUL_MAHESHWARI",
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
    log: "LOG",
    media: "MEDIA",
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
};

export const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(() => localStorage.getItem("firestore_quota_exceeded") === "true");
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("is_admin") === "true";
  });
  
  const [data, setData] = useState<any>(() => {
    const cached = localStorage.getItem("portfolio_data");
    try {
      return cached ? JSON.parse(cached) : BACKUP_PORTFOLIO_DATA;
    } catch (e) {
      return BACKUP_PORTFOLIO_DATA;
    }
  });

  // Keep refs up to date to prevent stale state closure loops in onSnapshot
  const dataRef = useRef<any>(data);
  const hasUnsavedChangesRef = useRef<boolean>(hasUnsavedChanges);
  
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
    console.log("[AppContext] Establishing cloud listener (1 read per app session).");
    
    const unsubscribe = onSnapshot(docRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          const fbData = snapshot.data();
          
          // CRITICAL: If we have unsaved local changes, we MUST NOT let the cloud snapshot overwrite our state.
          // This is often why users see their changes "revert" or feel like they need to refresh twice.
          if (hasUnsavedChangesRef.current) {
            console.log("[AppContext] Local changes pending. Ignoring background cloud snapshot to prevent overwrite.");
            setLoading(false);
            return;
          }
          
          const currentLocal = dataRef.current;
          
          // Timestamp validation check: avoid redundant state updates & re-render spirals
          if (currentLocal && currentLocal.lastUpdated && fbData && fbData.lastUpdated) {
            const currentLocalTime = new Date(currentLocal.lastUpdated).getTime();
            const remoteTime = new Date(fbData.lastUpdated).getTime();
            
            // If the local state is already newer or equal, skip the state update
            if (currentLocalTime >= remoteTime) {
              setLoading(false);
              return;
            }
          }

          const mergedNodes = fbData.nodes ? fbData.nodes.map((n: any) => ({
            ...INITIAL_DATA.nodes[0], // fallback structure
            ...n,
            content: {
              ...INITIAL_DATA.nodes[0].content,
              ...(n.content || {})
            }
          })) : BACKUP_PORTFOLIO_DATA.nodes;

          const mergedFbData = { 
            ...BACKUP_PORTFOLIO_DATA, 
            ...fbData,
            nodes: mergedNodes
          };

          try {
            localStorage.setItem("portfolio_data", JSON.stringify(mergedFbData));
          } catch (e) {}

          setData(mergedFbData);
          setLastCloudSync(new Date().toISOString());
        } else {
          // If Firestore is empty, auto-initializing is skipped. We do NOT run setDoc here to avoid write noise.
          // Fall back to safely using our hardcoded backup portfolio data.
          setData(BACKUP_PORTFOLIO_DATA);
        }
        setLoading(false);
      },
      (error: any) => {
        console.error("[AppContext] Firestore real-time error:", error);
        if (error && (error.code === 'resource-exhausted' || error.message?.includes('resource-exhausted'))) {
          setQuotaExceeded(true);
          handleQuotaExceeded();
        }
        setLoading(false);
      }
    );

    return () => {
      console.log("[AppContext] Successfully unsubscribing from Firestore real-time updates.");
      unsubscribe();
    };
  }, [quotaExceeded]);


  const updateData = (updater: (prev: any) => any) => {
    setData((prev: any) => {
      const newData = updater(prev);
      newData.lastUpdated = new Date().toISOString(); 
      setHasUnsavedChanges(true); // Flag local state as dirty
      try {
        localStorage.setItem("portfolio_data", JSON.stringify(newData));
      } catch (e) {}
      return newData;
    });
  };

  const syncToCloud = async () => {
    if (quotaExceeded) throw new Error("Quota exceeded. Sync disabled.");
    const docRef = doc(db, 'portfolio', 'main');
    try {
      // Explicitly write the current local state to cloud
      await setDoc(docRef, data);
      setHasUnsavedChanges(false); // Reset dirty flag after successful cloud sync
      console.log("[AppContext] Successfully synced to cloud.");
    } catch (err: any) {
      if (err?.code === 'resource-exhausted') {
        setQuotaExceeded(true);
        handleQuotaExceeded();
      }
      throw err;
    }
  };

  const resetQuotaFlag = () => {
    localStorage.removeItem("firestore_quota_exceeded");
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
      await setDoc(docRef, BACKUP_PORTFOLIO_DATA);
      setData(BACKUP_PORTFOLIO_DATA);
      console.log("[AppContext] Successfully restored database back to safe snapshot.");
    } catch (err: any) {
      console.error("[AppContext] Failed to restore safe snapshot:", err);
      throw new Error(err.message || "Could not write snapshot to Firestore");
    }
  };

  const login = (id: string, pass: string) => {
    if (id === 'maheshwarianshul1985' && pass === 'pranali1985') {
      setIsAdmin(true);
      localStorage.setItem("is_admin", "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    setIsEditing(false);
    localStorage.removeItem("is_admin");
  };

  return (
    <AppContext.Provider value={{ isEditing, setIsEditing, data, updateData, restoreFullBackup, syncToCloud, resetQuotaFlag, isAdmin, login, logout, loading, hasUnsavedChanges, lastCloudSync }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
};
