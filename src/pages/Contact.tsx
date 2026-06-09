import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { motion } from "motion/react";

export default function Contact() {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col flex-1 h-screen overflow-hidden bg-white"
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-white p-4 shrink-0 px-4 md:px-8">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 text-text-main hover:text-primary transition-colors flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-primary rounded-none bg-surface brutal-border"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase font-display">CONTACT_TERMINAL</h1>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      <div className="flex-1 overflow-y-auto w-full max-w-md mx-auto pt-8 px-4 pb-24">
        {/* Status Indicator */}
        <div className="w-full mb-8 flex justify-center items-center gap-2 bg-surface brutal-border py-2 px-4 shadow-sm">
          <div aria-hidden="true" className="w-2.5 h-2.5 rounded-none bg-primary cursor-blink"></div>
          <p className="font-mono text-primary text-[10px] md:text-xs uppercase font-bold tracking-widest">
              [SYSTEM_ONLINE: ACCEPTING_QUERIES]
          </p>
        </div>

        {/* Contact Form */}
        <main className="w-full">
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, staggerChildren: 0.1 }}
            className="space-y-6" 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const subject = formData.get('subject') as string;
              const message = formData.get('message') as string;
              window.location.href = `mailto:maheshwarianshul1985@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
            }}
          >
            
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col space-y-2">
              <label htmlFor="email" className="font-mono text-[10px] text-text-main font-bold uppercase tracking-wider">EMAIL</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="Enter parameter..." 
                required 
                className="w-full h-12 px-4 bg-surface brutal-border text-text-main text-sm font-mono focus:outline-none focus:border-primary placeholder:text-muted transition-colors rounded-none"
              />
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col space-y-2">
              <label htmlFor="subject" className="font-mono text-[10px] text-text-main font-bold uppercase tracking-wider">SUBJECT</label>
              <input 
                type="text" 
                id="subject" 
                name="subject" 
                placeholder="Enter parameter..." 
                required 
                className="w-full h-12 px-4 bg-surface brutal-border text-text-main text-sm font-mono focus:outline-none focus:border-primary placeholder:text-muted transition-colors rounded-none"
              />
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col space-y-2">
              <label htmlFor="message" className="font-mono text-[10px] text-text-main font-bold uppercase tracking-wider">MESSAGE</label>
              <textarea 
                id="message" 
                name="message" 
                placeholder="Enter parameter..." 
                required 
                rows={6}
                className="w-full px-4 py-3 bg-surface brutal-border text-text-main text-sm font-mono focus:outline-none focus:border-primary placeholder:text-muted transition-colors resize-y min-h-[120px] rounded-none"
              ></textarea>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="pt-4 pb-12">
              <button 
                type="submit" 
                className="w-full h-14 bg-text-main text-white font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-none hover:bg-primary active:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors flex items-center justify-center gap-2 brutal-border"
              >
                INITIALIZE_CONTACT
                <Send className="w-4 h-4 ml-1" />
              </button>
            </motion.div>
          </motion.form>
        </main>
      </div>

      {/* Decorative Bottom Elements */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-border via-primary to-border opacity-50 z-50"></div>
    </motion.div>
  );
}
