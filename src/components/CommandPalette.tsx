import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Terminal, ArrowRight, X, Command } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../contexts/AppContext";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data } = useApp();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredNodes = data.nodes.filter((node) =>
    node.title.toLowerCase().includes(query.toLowerCase()) ||
    node.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (id: string) => {
    navigate(`/protocol/${id}`);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <>
      {/* Search Trigger Button (Desktop Only) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="hidden md:flex fixed top-4 right-20 z-[60] bg-white brutal-border items-center gap-3 px-3 py-1.5 hover:bg-surface transition-colors group active:translate-x-1 active:translate-y-1"
      >
        <Search className="w-3.5 h-3.5 text-muted group-hover:text-primary" />
        <span className="font-mono text-[10px] text-muted font-bold uppercase tracking-tighter">Quick Search</span>
        <div className="flex items-center gap-1 bg-surface px-1.5 py-0.5 rounded border border-border">
          <Command className="w-2.5 h-2.5 text-muted" />
          <span className="font-mono text-[9px] text-muted">K</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-text-main/80 backdrop-blur-sm"
            />
            
            {/* Palette */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-xl bg-white brutal-border border-4 overflow-hidden flex flex-col shadow-[12px_12px_0px_0px_rgba(var(--color-primary-rgb),0.3)]"
            >
              <div className="p-4 border-b-2 border-border flex items-center gap-3 bg-white">
                <Search className="w-5 h-5 text-primary" />
                <input 
                  ref={inputRef}
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SEARCH PROTOCOLS, SKILLS, OR RECORDS..."
                  className="w-full font-mono text-xs font-bold uppercase text-text-main outline-none placeholder:text-muted/50"
                />
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-surface brutal-border">
                  <X className="w-4 h-4 text-text-main" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto bg-surface/30">
                <div className="p-2">
                  <p className="px-3 py-2 font-mono text-[10px] text-muted font-bold uppercase tracking-widest">Available Protocols</p>
                  <div className="space-y-1">
                    {filteredNodes.length > 0 ? (
                      filteredNodes.map((node) => (
                        <button
                          key={node.id}
                          onClick={() => handleSelect(node.id)}
                          className="w-full text-left p-3 flex items-center justify-between group hover:bg-primary/10 hover:border-primary border border-transparent transition-all brutal-border bg-white"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-surface brutal-border flex items-center justify-center shrink-0 group-hover:border-primary">
                              <Terminal className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-display font-bold text-sm text-text-main group-hover:text-primary">{node.title}</span>
                              <span className="font-mono text-[10px] text-muted uppercase">{node.date} • {node.content?.headerId || 'ID_PENDING'}</span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all -translate-x-2 group-hover:translate-x-0" />
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted font-mono text-xs uppercase italic">
                        No matches found for "{query}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-border bg-white flex items-center justify-between text-muted font-mono text-[9px] uppercase font-bold">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><span className="bg-surface px-1.5 py-0.5 brutal-border">ESC</span> to close</span>
                    <span className="flex items-center gap-1"><span className="bg-surface px-1.5 py-0.5 brutal-border">ENTER</span> to select</span>
                  </div>
                  <div className="hidden sm:block">SYSTEM v2.5.0</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
