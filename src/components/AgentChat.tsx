import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { MessageSquare, X, Send, Loader2, Minimize2, ArrowRight, Maximize2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, handleQuotaExceeded } from '../firebase';
import { collection, query, where, getDocs, setDoc, doc, addDoc } from 'firebase/firestore';

// AgentChat.tsx

type Message = {
  role: 'user' | 'model';
  content: string;
  followUp?: string;
  suggestedTabs?: { label: string; path: string }[] | null;
};

export function AgentChat() {
  const { data, updateData, isEditing } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      content: "Hello! I'm an AI assistant analyzing this portfolio. Ask me anything about the candidate's career, skills, or projects!",
      followUp: "What is your main programming language?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, showTraining]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride !== undefined ? textOverride : input;
    if (!textToSend.trim() || isTyping) return;
    
    const userMessage: Message = { role: 'user', content: textToSend.trim() };
    setMessages(prev => [...prev, userMessage]);
    
    // Chat logging to Firestore disabled to stay within free quota
    
    if (textOverride === undefined) {
      setInput("");
    }
    setIsTyping(true);
    const newMessages = [...messages, userMessage];

    try {
      const isProtocolPage = location.pathname.startsWith('/protocol/');
      const currentProtocolId = isProtocolPage ? location.pathname.split('/protocol/')[1] : null;

      const systemInstruction = `
You are a professional AI assistant representing ${data.hero.name} (${data.hero.role}). Your goal is to engage users in a conversational, precise, and highly visual manner about ${data.hero.name}'s professional background.

Data Context:
- Current User Location (URL path): ${location.pathname}
- Description: ${data.hero.desc}
- System Metrics: ${data.metrics.map(m => m.label + ': ' + m.value).join(', ')}
- Specs: ${data.specs.map(s => s.label + ': ' + s.value + '%').join(', ')}
- Capabilities: ${data.capabilities.map(c => c.label + ': ' + c.value + '%').join(', ')}
- Experiences:
${data.experiences.map(e => "  - " + e.title + " at " + e.company + " (" + e.date + ")\n    Points: " + e.points.join('; ') + (e.subSections && e.subSections.length > 0 ? "\n    Sub-sections: " + e.subSections.map(s => s.title + ": " + s.points.join('; ')).join(' | ') : "")).join('\n')}
- Resume Text (OCR): ${data.resumeText ? data.resumeText.substring(0, 10000) : 'Not provided yet'}
- Projects (Protocols / Nodes):
${data.nodes.map(n => {
  let nodeStr = "  - ID: " + n.id + ", TITLE: " + n.title + " (" + n.date + "): " + n.description;
  nodeStr += 
    "\n    Problem Statement: " + (n.content?.problem || '') + 
    "\n    Solution: " + (n.content?.solutions || '') + 
    "\n    System Flow: " + (n.content?.systemFlowContent || '') +
    "\n    Impact: " + (n.content?.impact || '') +
    "\n    Target Audience: " + (n.content?.targetAudience || '') +
    "\n    Category/Bucket (" + (n.content?.sectionBucket || '') + "): " + (n.content?.productBucket || '') +
    "\n    What This Proves (" + (n.content?.sectionProve || '') + "): " + (n.content?.assetsProve || '') +
    "\n    Use in GTM/Launch (" + (n.content?.sectionGtm || '') + "): " + (n.content?.useGtm || '') +
    (n.assets?.videoUrl ? "\n    Has Video Available: Yes, Video link format: [Watch Video](" + n.assets.videoUrl + ")" : "") +
    (n.assets?.systemFlowUrl ? "\n    Has System Flow Image Available: Yes, Image markdown format: ![System Flow](" + n.assets.systemFlowUrl + ")" : "") +
    (n.assets?.deckUrl ? "\n    Has Pitch Deck (PPT) Available: Yes" : "") +
    (n.assets?.deckText ? "\n    Deck Content (OCR): " + n.assets.deckText.substring(0, 5000) : "");
  return nodeStr;
}).join('\n')}
- Admin Custom Training / Terminology Mapping (CRITICAL):
${data.unansweredQuestions?.filter(q => q.answer).map(q => "USER QUERY/TERM: " + q.question + " | AGENT INSTRUCTION: " + q.answer).join('\n')}

Guardrails & Conversational Style (CRITICAL RULES):
1. **SMART TERMINOLOGY MAPPING**: Pay STRICT ATTENTION to the "Admin Custom Training / Terminology Mapping" above. If the user mentions a term, acronym (like TMS, CRM, ERP), or scenario that maps to a specific protocol or concept there, you MUST use that instruction to guide your answer to the correct protocol!
2. BE HIGHLY VISUAL AND STRUCTURED: Use Markdown extensively. Use **bolding** to emphasize key terms. Use bullet points or numbered lists. Use blockquotes (\`>\`) for impact metrics. MUST INCLUDE system flow images \`![System Flow](url)\` and links to videos \`[Watch Video](url)\` using the provided formats when relevant or asked.
3. BE DYNAMIC AND ENGAGING: Vary your sentence structure. Do not be overly robotic or overly sequential. Speak smartly, casually, and intelligently.
3. STRICT PROFILES GUARDRAIL: NEVER mention anything negative, controversial, or derogatory about the candidate. Maintain a highly professional and positive context at all times! Focus strictly on the provided data.
4. BE CONCISE AND DIRECT: Answer with brief, specific points. 
5. ALWAYS CITE SOURCES explicitly. When answering, mention where the information came from (e.g., "From the OCR of the Deck...", "Based on the Resume OCR...").
6. ASK FOLLOW-UPS: Provide a engaging follow-up question to keep the conversation going.
7. SUGGEST NAVIGATION: If you highly recommend viewing particular sections or answering about specific Projects/Protocols, you should provide 1 to 3 suggested tabs. 
   - To recommend the general Dashboard: path="\/".
   - To recommend a protocol/project details page: path="\/protocol\/[ID]", label="VIEW PROTOCOL: [TITLE]". 
8. IF YOU DON'T KNOW THE ANSWER based on context, honestly say so AND set 'needsHumanAnswer: true' in your JSON so we can save and learn it!

YOU MUST RESPOND IN JSON FORMAT EXACTLY MATCHING THIS STRUCTURE:
{
  "response": "Your conversational, markdown-formatted response here",
  "followUp": "Your follow-up question here",
  "suggestedTabs": [
    {
      "label": "Name of the tab or Protocol (e.g. DASHBOARD, VIEW PROTOCOL: X)",
      "path": "The router path (e.g. '/', '/resume', '/protocol/[ID]')"
    }
  ], // Provide empty array if no navigation is specifically recommended
  "needsHumanAnswer": false // Set strictly to true ONLY if you lack the info.
}
`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          apiKey: data.apiKeys?.gemini,
          systemInstruction,
          responseMimeType: "application/json"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from AI');
      }

      const responseData = await response.json();
      let parsed;
      try {
        parsed = JSON.parse(responseData.content);
      } catch (e) {
        parsed = { response: responseData.content };
      }

      if (parsed.needsHumanAnswer) {
        updateData(prev => ({
          ...prev,
          unansweredQuestions: [
            ...(prev.unansweredQuestions || []),
            { id: Date.now().toString(), question: textToSend.trim(), answer: "", timestamp: Date.now() }
          ]
        }));
      }

      const finalSuggestedTabs = parsed.suggestedTabs || (parsed.suggestedTab ? [parsed.suggestedTab] : null);

      // Chat logging to Firestore disabled to stay within free quota
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: parsed.response || "",
        followUp: parsed.followUp,
        suggestedTabs: finalSuggestedTabs
      }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error while processing your request." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 md:bottom-6 left-6 w-14 h-14 bg-text-main text-white flex items-center justify-center brutal-border z-[60] hover:bg-primary transition-colors shadow-[4px_4px_0_0_#1e1e1e] cursor-pointer"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 md:bottom-6 left-6 w-[90vw] md:w-[400px] h-[500px] max-h-[85vh] bg-surface brutal-border flex flex-col z-[60] shadow-[8px_8px_0_0_#1e1e1e] overflow-hidden"
          >
             <div className="flex items-center justify-between p-4 border-b border-border bg-white outline-none">
              <div className="flex items-center gap-2">
                <TerminalIcon />
                <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-text-main">PREDICTIVE BRAIN</h3>
                {isEditing && (
                  <button onClick={() => setShowTraining(!showTraining)} className="ml-2 text-[10px] bg-primary text-white px-2 py-1 font-mono hover:bg-black uppercase">
                    {showTraining ? 'CHAT' : 'TRAIN'}
                  </button>
                )}
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-text-main hover:bg-surface p-1 brutal-border transition-colors outline-none cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {showTraining ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface scrollbody">
                <h4 className="font-mono text-xs font-bold text-text-main">UNANSWERED QUESTIONS</h4>
                {(!data.unansweredQuestions || data.unansweredQuestions.length === 0) ? (
                  <p className="text-xs font-mono text-text-main/60">No pending questions to train on.</p>
                ) : (
                  data.unansweredQuestions.map((q) => (
                    <div key={q.id} className="bg-white brutal-border p-3 flex flex-col gap-2">
                      <p className="font-mono text-xs font-bold bg-text-main text-white p-1">Q: {q.question}</p>
                      <textarea
                        className="bg-surface border border-border p-2 font-mono text-xs w-full min-h-[60px] outline-none focus:border-primary"
                        placeholder="Provide answer here..."
                        value={q.answer}
                        onChange={(e) => {
                          updateData(prev => ({
                            ...prev,
                            unansweredQuestions: prev.unansweredQuestions?.map(uq => 
                              uq.id === q.id ? { ...uq, answer: e.target.value } : uq
                            )
                          }))
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface scrollbody">
                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                      <div 
                        className={cn(
                          "max-w-[85%] border px-4 py-3 text-sm font-mono leading-relaxed", 
                          msg.role === 'user' 
                            ? "bg-text-main text-white brutal-border border-text-main" 
                            : "bg-white text-text-main brutal-border border-text-main"
                        )}
                      >
                        {msg.role === 'user' ? (
                          msg.content
                        ) : (
                          <div className="markdown-body text-xs font-mono leading-relaxed space-y-2 [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>h1]:font-bold [&>h2]:font-bold [&>h3]:font-bold [&_img]:w-full [&_img]:h-auto [&_img]:border [&_img]:border-border [&_img]:my-2 [&_a]:text-primary [&_a]:underline [&_a]:font-bold">
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        )}
                      </div>
                      
                      {msg.role === 'model' && i === messages.length - 1 && !isTyping && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="mt-3 flex flex-col gap-2 w-full pr-10"
                        >
                          {msg.suggestedTabs && msg.suggestedTabs.map((tab, idx) => (
                            <button 
                              key={idx}
                              onClick={() => {
                                navigate(tab.path);
                                if (window.innerWidth < 768) {
                                  setIsOpen(false);
                                }
                              }}
                              className="self-start flex items-center gap-2 px-3 py-2 bg-primary text-white font-mono text-[10px] font-bold uppercase tracking-wider brutal-border hover:bg-text-main transition-colors cursor-pointer"
                            >
                              GO TO {tab.label} <ArrowRight className="w-3 h-3" />
                            </button>
                          ))}
                          {msg.followUp && (
                            <button 
                              onClick={() => handleSend(msg.followUp!)}
                              className="self-start text-left px-3 py-2 bg-white text-primary text-[10px] font-mono border border-primary brutal-border hover:bg-primary/10 transition-colors cursor-pointer"
                            >
                              {msg.followUp}
                            </button>
                          )}
                        </motion.div>
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border text-text-main px-4 py-3 brutal-border flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-border bg-white p-3 flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about the portfolio..."
                    className="flex-1 bg-surface border border-border px-3 py-2 font-mono text-xs focus:outline-none focus:border-primary text-text-main"
                    disabled={isTyping}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    className="w-10 h-10 flex items-center justify-center bg-primary text-text-main brutal-border hover:bg-white transition-colors outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const TerminalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
  </svg>
)

