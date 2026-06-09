import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileNav } from "./MobileNav";
import { AnimatePresence } from "motion/react";
import { useApp } from "../contexts/AppContext";
import { Save, Edit2, ShieldAlert } from "lucide-react";
import { AgentChat } from "./AgentChat";
import { CommandPalette } from "./CommandPalette";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isEditing, setIsEditing, isAdmin, hasUnsavedChanges } = useApp();

  return (
    <div className="flex min-h-screen bg-white">
      <DesktopSidebar />
      <main className="flex-1 flex flex-col w-full relative pb-16 md:pb-0">
        <AnimatePresence mode="wait">
          <div key={location.pathname} className="flex-1 flex flex-col w-full h-full">
            <Outlet />
          </div>
        </AnimatePresence>

        <MobileNav />
        <AgentChat />
        <CommandPalette />

        {isAdmin ? (
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`fixed right-6 z-50 p-4 shadow-[4px_4px_0_0_rgba(15,23,42,1)] border-2 border-text-main transition-all duration-200 outline-none bottom-40 md:bottom-8
              ${isEditing ? 'bg-primary text-white' : 'bg-surface text-text-main hover:bg-white'}
            `}
          >
            {hasUnsavedChanges && (
              <span className="absolute -top-1 -left-1 bg-amber-500 text-white text-[8px] font-bold px-1 py-0.5 brutal-border shadow-none">PENDING</span>
            )}
            {isEditing ? <Save className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
          </button>
        ) : (
          <button 
            onClick={() => navigate("/admin")}
            className="fixed right-6 z-50 p-3 rounded-full border-2 border-transparent transition-all duration-200 outline-none bottom-40 md:bottom-8 text-border hover:text-text-main"
            title="Admin Login"
          >
            <ShieldAlert className="w-5 h-5 opacity-30 hover:opacity-100" />
          </button>
        )}
      </main>
    </div>
  );
}
