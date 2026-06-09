import { useNavigate } from "react-router-dom";
import { ArrowLeft, Terminal, Download, Cpu } from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "../contexts/AppContext";
import { Editable } from "../components/Editable";
import { FileUploader } from '../components/FileUploader';

export default function Resume() {
  const navigate = useNavigate();
  const { data, updateData, isEditing } = useApp();
  const experiences = data.experiences as any[];
  const capabilities = data.capabilities;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex flex-col flex-1 h-screen overflow-hidden bg-white"
    >
      {/* Mobile Header */}
      <header className="md:hidden flex items-center bg-surface p-4 pb-2 justify-between border-b border-border sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="text-text-main flex size-8 shrink-0 items-center justify-center p-0 outline-none">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-text-main text-sm font-bold leading-tight uppercase font-mono tracking-widest">[RESUME]</h2>
        <div className="w-8"></div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between border-b border-border px-8 py-4 bg-text-main sticky top-0 z-10 text-white">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-none bg-primary cursor-blink"></span>
            <p className="text-primary font-mono text-sm tracking-widest uppercase font-bold">System_Initialization: Profile_Load</p>
          </div>
          <h2 className="text-white text-5xl font-black font-display tracking-tight uppercase">Executive_Terminal_v1.0</h2>
        </div>
        {isEditing ? (
          <div className="w-64">
            <FileUploader accept=".pdf" label="UPLOAD RESUME" onUploadComplete={(url) => updateData(prev => ({...prev, resumeUrl: url}))} onParsedText={(text) => updateData(prev => ({...prev, resumeText: text}))} />
          </div>
        ) : data.resumeUrl ? (
          <button onClick={() => window.open(data.resumeUrl, '_blank')} className="brutal-border bg-white text-text-main font-mono text-[10px] font-bold py-3 px-6 flex items-center gap-2 hover:bg-primary hover:text-white hover:border-primary transition-all uppercase tracking-wider cursor-pointer">
            <Download className="w-4 h-4" /> DOWNLOAD_RESUME
          </button>
        ) : (
          <button disabled className="brutal-border bg-white/50 text-text-main/50 font-mono text-[10px] font-bold py-3 px-6 flex items-center gap-2 uppercase tracking-wider cursor-not-allowed">
            <Download className="w-4 h-4" /> NO_RESUME_FOUND
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
        {/* Mobile Hero overlay */}
        <section data-section="hero" className="md:hidden border-b border-border bg-text-main relative min-h-[200px] flex flex-col justify-end overflow-hidden p-6">
          <div className="absolute inset-0 flex flex-col z-10 font-mono top-6 p-6">
            <p className="text-primary text-[10px] font-bold uppercase tracking-widest mb-2 opacity-80">System.Initialize()</p>
            <h1 className="text-white text-lg md:text-xl font-bold mb-4 tracking-tight uppercase">EXECUTING_PROFILE_LOAD</h1>
            <div className="text-primary text-xs leading-relaxed border-l-2 border-primary pl-3 opacity-90 space-y-1 w-full overflow-hidden">
              <p className="truncate">&gt; User: {data.hero?.role || "Product & Operations Leader"}</p>
              <p className="truncate">&gt; Core: System Architecture</p>
              <p className="truncate">&gt; Status: ONLINE. READY FOR DEPLOYMENT.</p>
            </div>
          </div>
          <div className="absolute inset-0 bg-cover bg-center opacity-20 z-0 bg-[url('https://placeholder.pics/svg/400x300/102220-102220/102220')]"></div>
          <div className="relative z-10 mt-auto pt-6"><p className="text-white/50 tracking-wider text-[10px] font-bold font-mono">v2.4.1_BUILD_STABLE</p></div>
        </section>

        {/* Mobile section title */}
        <div className="md:hidden">
          <h3 className="text-text-main text-sm font-bold leading-tight px-4 py-3 border-b border-border bg-white uppercase font-display tracking-wide">CAREER_CHANGELOG</h3>
          <div className="h-4 bg-surface"></div>
        </div>

        {/* Desktop Split & Mobile Stack Content */}
        <div className="flex flex-col md:flex-row px-4 md:px-0 lg:max-w-7xl lg:mx-auto w-full md:h-full">
          
          {/* Timeline (Left relative to Desktop) */}
          <div className="flex-1 md:p-8 md:border-r border-border md:overflow-y-auto">
            <div className="hidden md:flex mb-10 items-center justify-between">
              <h3 className="font-display text-xl md:text-2xl font-bold tracking-tight uppercase">CAREER_CHANGELOG</h3>
              <span className="text-muted font-mono text-xs uppercase font-bold">Filter: All_Entries</span>
            </div>

            <motion.section data-section="career-changelog" variants={containerVariants} initial="hidden" animate="show" className="relative pl-6 md:pl-8 py-4">
              <div className="absolute top-4 bottom-0 left-[11px] md:left-[15px] w-[1px] bg-border z-0"></div>
              
              {experiences.map((exp, i) => (
                <motion.div variants={itemVariants} key={i} className={`relative z-10 mb-8 pt-2 ${!exp.isPrimary ? 'opacity-90' : ''}`}>
                  <div className={`absolute left-[-24px] md:left-[-29px] top-[14px] w-2.5 h-2.5 md:w-3 md:h-3 rounded-none shadow-[0_0_0_4px_#ffffff] ${exp.isPrimary ? 'bg-primary' : 'bg-white border-2 border-border'}`}></div>
                  <div className="bg-white brutal-border p-4 md:p-6 shadow-sm hover:border-primary transition-colors hover:shadow-none">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                      <div className="w-full">
                        <h4 className="font-bold font-display text-text-main text-base md:text-xl leading-tight uppercase w-full">
                           <Editable value={exp.title} onChange={(v) => updateData(prev => ({...prev, experiences: prev.experiences.map((e) => e.id === exp.id ? {...e, title: v} : e)}))} />
                        </h4>
                        <p className={`font-mono text-xs md:text-sm font-bold uppercase tracking-wider mt-1 ${exp.isPrimary ? 'text-primary' : 'text-muted'}`}>
                           <Editable value={exp.company} onChange={(v) => updateData(prev => ({...prev, experiences: prev.experiences.map((e) => e.id === exp.id ? {...e, company: v} : e)}))} />
                        </p>
                      </div>
                      <span className={`font-mono text-[10px] md:text-xs font-bold px-2 py-1 uppercase tracking-wider whitespace-nowrap ${exp.isPrimary ? 'text-primary bg-primary/10' : 'text-muted brutal-border'}`}>
                        <Editable value={exp.date} onChange={(v) => updateData(prev => ({...prev, experiences: prev.experiences.map((e) => e.id === exp.id ? {...e, date: v} : e)}))} />
                      </span>
                    </div>
                    {exp.points.length > 0 && (
                      <ul className="text-sm font-display text-text-main space-y-3 mt-4 list-none pl-0">
                        {exp.points.map((pt, j) => (
                          <li key={j} className="relative pl-4 leading-relaxed">
                            <span className="absolute left-0 top-2 w-1.5 h-1.5 bg-border rounded-none"></span>
                            <Editable multiline value={pt} onChange={(v) => updateData(prev => ({...prev, experiences: prev.experiences.map((e) => e.id === exp.id ? {...e, points: e.points.map((p, pIdx) => pIdx === j ? v : p)} : e)}))} />
                            {isEditing && (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  updateData(prev => ({...prev, experiences: prev.experiences.map((e) => e.id === exp.id ? {...e, points: e.points.filter((_, pIdx) => pIdx !== j)} : e)}));
                                }}
                                className="absolute -left-6 top-1 text-red-500 hover:text-red-700 p-1"
                              >
                                ✕
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {exp.subSections && exp.subSections.length > 0 && (
                      <div className="mt-6 space-y-6">
                        {exp.subSections.map((sub, sIdx) => (
                          <div key={sub.id || sIdx} className="relative pl-2 md:pl-4 border-l-2 border-border/30">
                            <h5 className="font-mono text-xs font-bold uppercase tracking-widest text-text-main mb-3 flex items-center gap-2">
                                <Editable value={sub.title} onChange={(v) => updateData(prev => ({...prev, experiences: prev.experiences.map((e) => e.id === exp.id ? {...e, subSections: (e.subSections || []).map((s, idx) => idx === sIdx ? {...s, title: v} : s)} : e)}))} />
                                {isEditing && (
                                  <button onClick={() => updateData(prev => ({...prev, experiences: prev.experiences.map((e) => e.id === exp.id ? {...e, subSections: (e.subSections || []).filter((_, idx) => idx !== sIdx)} : e)}))} className="ml-2 px-1.5 py-0.5 bg-red-50 brutal-border border-red-500 text-[10px] text-red-500 hover:bg-red-500 hover:text-white transition-colors">REMOVE SECTION</button>
                                )}
                            </h5>
                            <ul className="text-sm font-display text-text-main space-y-3 list-none pl-0">
                               {sub.points.map((pt, pIdx) => (
                                 <li key={pIdx} className="relative pl-4 leading-relaxed">
                                   <span className="absolute left-0 top-2 w-1 h-1 bg-text-main/50 rounded-none"></span>
                                   <Editable multiline value={pt} onChange={(v) => updateData(prev => ({...prev, experiences: prev.experiences.map((e) => e.id === exp.id ? {...e, subSections: (e.subSections || []).map((s, idx) => idx === sIdx ? {...s, points: s.points.map((p, j) => j === pIdx ? v : p)} : s)} : e)}))} />
                                   {isEditing && (
                                     <button onClick={() => updateData(prev => ({...prev, experiences: prev.experiences.map((e) => e.id === exp.id ? {...e, subSections: (e.subSections || []).map((s, idx) => idx === sIdx ? {...s, points: s.points.filter((_, j) => j !== pIdx)} : s)} : e)}))} className="absolute -left-6 top-1 text-red-500 hover:text-red-700 p-1">✕</button>
                                   )}
                                 </li>
                               ))}
                            </ul>
                            {isEditing && (
                              <div className="mt-3 flex gap-2">
                                <button onClick={() => updateData(prev => ({...prev, experiences: prev.experiences.map((e) => e.id === exp.id ? {...e, subSections: (e.subSections || []).map((s, idx) => idx === sIdx ? {...s, points: [...s.points, "New point"]} : s)} : e)}))} className="font-mono text-[10px] uppercase font-bold text-primary hover:bg-primary/5 transition-colors border border-primary/30 px-2 py-1 bg-surface">+ ADD SUB-POINT</button>
                                <button
                                  onClick={() => {
                                    const text = window.prompt("Paste bullet points here (each line becomes a new point):");
                                    if (!text) return;
                                    const newPoints = text.split('\n')
                                      .map(t => t.replace(/^[•\-\*]\s*/, '').trim())
                                      .filter(t => t.length > 0);
                                    if (newPoints.length > 0) {
                                      updateData(prev => ({
                                        ...prev,
                                        experiences: prev.experiences.map((e) => e.id === exp.id ? {...e, subSections: (e.subSections || []).map((s, idx) => idx === sIdx ? {...s, points: [...s.points, ...newPoints]} : s)} : e)
                                      }));
                                    }
                                  }}
                                  className="font-mono text-[10px] uppercase font-bold text-text-main hover:bg-surface transition-colors border border-text-main px-2 py-1 bg-white"
                                >
                                  + PASTE BULLETS
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {isEditing && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => updateData(prev => ({...prev, experiences: prev.experiences.map((e) => e.id === exp.id ? {...e, points: [...e.points, "New point"]} : e)}))}
                          className="font-mono text-[10px] uppercase font-bold text-primary hover:bg-primary/10 transition-colors border border-primary px-2 py-1 bg-surface"
                        >
                          + ADD POINT
                        </button>
                        <button
                          onClick={() => updateData(prev => ({...prev, experiences: prev.experiences.map((e) => e.id === exp.id ? {...e, subSections: [...(e.subSections || []), { id: Date.now().toString(), title: "NEW CATEGORY", points: ["New point"] }]} : e)}))}
                          className="font-mono text-[10px] uppercase font-bold text-primary hover:bg-primary/10 transition-colors border border-primary px-2 py-1 bg-surface"
                        >
                          + ADD SUB-SECTION
                        </button>
                        <button
                          onClick={() => {
                            const text = window.prompt("Paste bullet points here (each line becomes a new point):");
                            if (!text) return;
                            const newPoints = text.split('\n')
                              .map(t => t.replace(/^[•\-\*]\s*/, '').trim())
                              .filter(t => t.length > 0);
                            if (newPoints.length > 0) {
                              updateData(prev => ({
                                ...prev,
                                experiences: prev.experiences.map((e) => e.id === exp.id ? {...e, points: [...e.points, ...newPoints]} : e)
                              }));
                            }
                          }}
                          className="font-mono text-[10px] uppercase font-bold text-text-main hover:bg-surface transition-colors border border-text-main px-2 py-1 bg-white"
                        >
                          + PASTE BULLETS
                        </button>
                        <button
                          onClick={() => updateData(prev => ({...prev, experiences: prev.experiences.filter((e) => e.id !== exp.id)}))}
                          className="font-mono text-[10px] uppercase font-bold text-red-500 hover:bg-red-50 transition-colors border border-red-500 px-2 py-1 bg-surface md:ml-auto"
                        >
                          - REMOVE ROLE
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isEditing && (
                <motion.div variants={itemVariants} className="relative z-10 mb-8 pt-2 opacity-90">
                  <div className="absolute left-[-24px] md:left-[-29px] top-[14px] w-2.5 h-2.5 md:w-3 md:h-3 rounded-none bg-white border-2 border-border border-dashed"></div>
                  <button 
                    onClick={() => updateData(prev => ({
                      ...prev, 
                      experiences: [...prev.experiences, { 
                        id: `exp-${Date.now()}`,
                        title: "NEW ROLE",
                        company: "NEW COMPANY",
                        date: "DATE",
                        points: ["Description of role."],
                        subSections: [],
                        isPrimary: false
                      }]
                    }))}
                    className="w-full bg-surface text-text-main font-mono text-xs font-bold uppercase hover:bg-white transition-colors brutal-border p-4 md:p-6 shadow-sm border-dashed flex items-center justify-center gap-2"
                  >
                    + ADD_EXPERIENCE
                  </button>
                </motion.div>
              )}
            </motion.section>
          </div>

          {/* Capabilities (Right Desktop, Bottom Mobile) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="md:w-80 lg:w-96 md:bg-surface md:p-8 shrink-0 md:overflow-y-auto"
          >
            <section data-section="system-capabilities" className="mt-8 md:mt-0 border-t border-border md:border-none pt-6 md:pt-0">
              <h3 className="text-text-main text-lg md:text-xl font-bold leading-tight mb-6 uppercase flex items-center font-display tracking-tight">
                <Cpu className="text-primary mr-2 w-5 h-5 md:w-6 md:h-6" />
                SYSTEM_CAPABILITIES
              </h3>
              
              <div className="bg-white md:bg-transparent brutal-border md:border-none p-4 md:p-0 space-y-5 md:space-y-6">
                {capabilities.map((cap, i) => (
                  <div key={cap.id} className="relative group/cap">
                    <div className="flex justify-between items-center mb-2 font-mono text-[10px] md:text-xs font-bold uppercase tracking-wider">
                      <span className="text-text-main">
                        <Editable value={cap.label} onChange={(v) => updateData(prev => ({...prev, capabilities: prev.capabilities.map((c) => c.id === cap.id ? {...c, label: v} : c)}))} />
                      </span>
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + (i * 0.1) }}>
                        <Editable value={cap.value} onChange={(v) => updateData(prev => ({...prev, capabilities: prev.capabilities.map((c) => c.id === cap.id ? {...c, value: Number(v)} : c)}))} />%
                      </motion.span>
                    </div>
                    {isEditing && (
                      <button onClick={() => updateData(prev => ({...prev, capabilities: prev.capabilities.filter((c) => c.id !== cap.id)}))} className="absolute -left-6 top-0 text-red-500 font-bold hover:bg-red-50 p-1">✕</button>
                    )}
                    <div className="w-full bg-surface md:bg-white h-2 rounded-none brutal-border overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${cap.value}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.5 + (i * 0.1) }}
                        className={`h-full rounded-none border-r border-surface md:border-white ${i % 2 === 0 ? 'bg-primary' : 'bg-text-main opacity-80'}`} 
                      ></motion.div>
                    </div>
                  </div>
                ))}
                
                {isEditing && (
                  <button 
                    onClick={() => updateData(prev => ({
                      ...prev, 
                      capabilities: [...prev.capabilities, { 
                        id: `cap-${Date.now()}`,
                        label: "NEW CAPABILITY",
                        value: 50
                      }]
                    }))}
                    className="w-full h-10 bg-surface text-text-main font-mono text-[10px] font-bold uppercase hover:bg-white transition-colors brutal-border flex items-center justify-center gap-2 border-dashed border-2 mt-4"
                  >
                    + ADD_CAPABILITY
                  </button>
                )}
              </div>

              {/* Download Action Mobile */}
              <div className="mt-8 flex justify-center md:hidden pb-8">
                {isEditing ? (
                  <FileUploader accept=".pdf" label="UPLOAD RESUME" onUploadComplete={(url) => updateData(prev => ({...prev, resumeUrl: url}))} onParsedText={(text) => updateData(prev => ({...prev, resumeText: text}))} />
                ) : data.resumeUrl ? (
                  <button onClick={() => window.open(data.resumeUrl, '_blank')} className="flex items-center justify-center w-full bg-text-main text-white font-mono font-bold text-[10px] uppercase py-4 px-6 rounded-none hover:bg-primary transition-colors brutal-border tracking-wider cursor-pointer">
                    <Download className="w-4 h-4 mr-2" /> DOWNLOAD_RESUME
                  </button>
                ) : (
                  <button disabled className="flex items-center justify-center w-full bg-text-main/50 text-white/50 font-mono font-bold text-[10px] uppercase py-4 px-6 rounded-none brutal-border tracking-wider cursor-not-allowed">
                    <Download className="w-4 h-4 mr-2" /> NO_RESUME_FOUND
                  </button>
                )}
              </div>
            </section>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
