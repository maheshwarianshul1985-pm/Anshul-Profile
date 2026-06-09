import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { Terminal, LayoutDashboard, ScrollText, Image as ImageIcon, Radio, Settings } from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "../contexts/AppContext";
import { Editable } from "../components/Editable";

export function DesktopSidebar() {
  const location = useLocation();
  const { data, updateData } = useApp();

  const navItems = [
    { key: "dash", label: data.navLabels?.dash || "DASH", icon: LayoutDashboard, path: "/" },
    { key: "log", label: data.navLabels?.log || "LOG", icon: ScrollText, path: "/resume" },
    { key: "media", label: data.navLabels?.media || "MEDIA", icon: ImageIcon, path: "#" },
    { key: "ping", label: data.navLabels?.ping || "PING", icon: Radio, path: "/contact" },
    { key: "admin", label: data.navLabels?.admin || "ADMIN", icon: Settings, path: "/admin" },
  ] as const;

  return (
    <motion.aside 
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="hidden md:flex w-64 border-r border-border bg-white flex-col justify-between shrink-0 h-screen sticky top-0 font-mono"
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="bg-surface relative w-12 h-12 border border-border bg-cover bg-center grayscale"
            style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuABmU3C_Zl9W4oHNFkb_cWdtPDliaAXjVGDidzRSQUBuIy863Y1A8BlMdrvaLU5VymOzYhFqNgYrwIxdzjpGmf1M5a4enmDQJEV5Tv3Q6_CcgMMTpIxJ01zNMsANWuAqR9Ult8QGtdr0E-sXLSpfKBOXqa3KGa6hfGtzktZs2_z_-pGnhK6SFOkuoOzSvwOAFggR5TkUzvRiMF4SGY4E3ETJnl7DVKIExUAKSnxzp436_NCzuCEryGYO1Aqz-qxOQuLbhqIfztqthN_')` }}
          />
          <div className="flex flex-col">
            <h1 className="text-text-main text-sm font-bold leading-tight uppercase font-display">AM</h1>
            <p className="text-primary text-xs font-medium leading-tight">Product & Ops</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.key}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 border-l-4 group transition-colors",
                  isActive 
                    ? "bg-surface border-primary text-text-main" 
                    : "border-transparent text-muted hover:bg-surface hover:text-text-main"
                )}
                onClick={(e) => {
                  // Prevent navigation if we are actively clicking in the input
                  if ((e.target as HTMLElement).tagName === 'INPUT') {
                    e.preventDefault();
                  }
                }}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "group-hover:text-primary")} />
                <span className={cn("text-xs font-bold tracking-wider uppercase", isActive ? "text-primary" : "group-hover:text-primary")}>
                  <Editable 
                    value={item.label} 
                    onChange={(v) => updateData(prev => ({ 
                      ...prev, 
                      navLabels: { ...(prev.navLabels || {dash:'DASH',log:'LOG',media:'MEDIA',ping:'PING',admin:'ADMIN'}), [item.key]: v } 
                    }))} 
                  />
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-border text-xs text-muted">
        V_2.0.4 // STABLE
      </div>
    </motion.aside>
  );
}
