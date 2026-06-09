import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ScrollText, Radio, Settings } from "lucide-react";
import { useApp } from "../contexts/AppContext";

export function MobileNav() {
  const location = useLocation();
  const { data } = useApp();

  const navItems = [
    { key: "dash", label: data.navLabels?.dash || "DASH", icon: LayoutDashboard, path: "/" },
    { key: "log", label: data.navLabels?.log || "LOG", icon: ScrollText, path: "/resume" },
    { key: "ping", label: data.navLabels?.ping || "PING", icon: Radio, path: "/contact" },
    { key: "admin", label: data.navLabels?.admin || "ADMIN", icon: Settings, path: "/admin" },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-t border-border z-50 flex items-center justify-around px-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
        const Icon = item.icon;
        
        return (
          <Link
            key={item.key}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive ? "text-primary" : "text-muted hover:text-text-main"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  );
}
