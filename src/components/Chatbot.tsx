import React, { useState, useEffect, useRef } from "react";
import { APP_NAME } from "../config/appConfig";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquareText, 
  X, 
  Send, 
  Sparkles, 
  Calendar, 
  User, 
  Clock, 
  HelpCircle, 
  AlertCircle,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import { useAppointments } from "../hooks/useAppointments";
import { useClinicData } from "../hooks/useClinicData";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  actionPerformed?: {
    type: string;
    details: string;
  };
}

export function Chatbot() {
  const { userProfile } = useAuth();
  const { activeClinic } = useClinic();
  const { createAppointment } = useAppointments();
  const { surgeons } = useClinicData();

  // Floating panel visibility
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-welcome",
      role: "assistant",
      text: `Hello! I am your Care Assistant for ${activeClinic?.name || APP_NAME}. 👋\n\nI can help you:\n• Find locations & branches for ${activeClinic?.name || 'our clinic'}\n• Understand how to perform actions (like billing, checking queue, or diagnostic logs)\n• Advise you where to find key clinical information\n• Book dental appointments instantly right here in the chat!\n\nHow can I help you smile today?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Contextual details gathered in real-time
  const [userAppointments, setUserAppointments] = useState<any[]>([]);
  const [userBills, setUserBills] = useState<any[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load patient appointments and billing details in real-time if logged in
  useEffect(() => {
    if (!userProfile) {
      setUserAppointments([]);
      setUserBills([]);
      return;
    }

    const activeSlug = activeClinic?.slug || 'revon-dental';

    // Subscribe to active appointments
    const appQuery = query(
      collection(db, "appointments"),
      where("patientId", "==", userProfile.uid)
    );
    const unsubApp = onSnapshot(appQuery, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const itemSlug = data.clinicSlug || 'revon-dental';
        if (itemSlug === activeSlug) {
          list.push({ id: doc.id, ...data });
        }
      });
      setUserAppointments(list);
    });

    // Subscribe to bills
    const billsQuery = query(
      collection(db, "bills"),
      where("patientId", "==", userProfile.uid)
    );
    const unsubBills = onSnapshot(billsQuery, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const itemSlug = data.clinicSlug || 'revon-dental';
        if (itemSlug === activeSlug) {
          list.push({ id: doc.id, ...data });
        }
      });
      setUserBills(list);
    });

    return () => {
      unsubApp();
      unsubBills();
    };
  }, [userProfile, activeClinic]);

  // Update welcome message when active clinic changes
  useEffect(() => {
    const clinicName = activeClinic?.name || APP_NAME;
    const clinicSlug = activeClinic?.slug || 'revon-dental';
    setMessages([
      {
        id: "initial-welcome",
        role: "assistant",
        text: `Hello! I am your Care Assistant for ${clinicName} (/${clinicSlug}). 👋\n\nI can help you:\n• Find locations & branches for ${clinicName}\n• Learn about treatments, specialists, and operating hours\n• Understand how to view bills, queue status, or clinical logs\n• Book appointments directly here for ${clinicName}!\n\nHow can I assist you at ${clinicName} today?`,
        timestamp: new Date()
      }
    ]);
  }, [activeClinic?.id]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Handle Quick Suggestions
  const handleSuggestionClick = (text: string) => {
    if (isGenerating) return;
    sendMessage(text);
  };

  // Parse custom action commands out of Gemini responses
  const parseAction = (text: string) => {
    // 1. Try markdown JSON code blocks
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonRegex);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {}
    }

    // 2. Try raw JSON substring matching
    const rawRegex = /(\{[\s\S]*"action"\s*:\s*"book_appointment"[\s\S]*\})/i;
    const rawMatch = text.match(rawRegex);
    if (rawMatch) {
      try {
        return JSON.parse(rawMatch[1]);
      } catch (e) {}
    }
    return null;
  };

  // Map Dentist Names to UID
  const getDentistIdByName = (name: string) => {
    const clean = name.toLowerCase();
    if (clean.includes("tohid") || clean.includes("mohammad")) {
      return "dentist-dr-tohid";
    }
    if (clean.includes("ananya") || clean.includes("rao")) {
      return "dentist-dr-ananya";
    }
    if (clean.includes("rajesh") || clean.includes("kumar")) {
      return "dentist-dr-rajesh";
    }
    // Fallback default
    return "dentist-dr-tohid";
  };

  const getDentistFullName = (id: string) => {
    if (id === "dentist-dr-tohid") return "Dr. Mohammad Tohid Kaginalli";
    if (id === "dentist-dr-ananya") return "Dr. Ananya Rao";
    if (id === "dentist-dr-rajesh") return "Dr. Rajesh Kumar";
    return "Dr. Mohammad Tohid Kaginalli";
  };

  // Perform Appointment booking
  const triggerAutoBooking = async (actionData: any) => {
    if (!userProfile) return { success: false, reason: "User not logged in." };

    try {
      const dentistId = getDentistIdByName(actionData.dentistName);
      const dentistName = getDentistFullName(dentistId);
      const treatment = actionData.treatment;
      const dateTime = actionData.dateTime || new Date(Date.now() + 86400000 * 2).toISOString(); // Default to tomorrow

      const appData = {
        patientId: userProfile.uid,
        patientName: userProfile.displayName || "Patient",
        patientEmail: userProfile.email,
        patientPhone: userProfile.phone || "",
        dentistId,
        dentistName,
        treatment,
        dateTime,
        status: "pending" as const,
        notes: "Automated booking generated via Revon AI Chat Assistant."
      };

      await createAppointment(appData);
      return { 
        success: true, 
        details: `${treatment} with ${dentistName} on ${new Date(dateTime).toLocaleString()}` 
      };
    } catch (err: any) {
      console.error("Auto booking failed:", err);
      return { success: false, reason: err.message };
    }
  };

  // Send message function
  const sendMessage = async (textToSend: string) => {
    const messageText = textToSend.trim();
    if (!messageText) return;

    // Append user message
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text: messageText,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsGenerating(true);

    try {
      // Compile real-time context
      const dynamicContext = {
        clinic: activeClinic ? {
          id: activeClinic.id,
          name: activeClinic.name,
          slug: activeClinic.slug,
          tagline: activeClinic.tagline,
          description: activeClinic.description,
          phone: activeClinic.phone,
          email: activeClinic.email,
          locations: activeClinic.locations,
          features: activeClinic.features
        } : null,
        userRegisteredClinicSlug: userProfile?.clinicSlug || null,
        isLoggedIn: !!userProfile,
        userProfile: userProfile ? {
          displayName: userProfile.displayName,
          email: userProfile.email,
          phone: userProfile.phone,
          role: userProfile.role,
          uid: userProfile.uid,
          clinicSlug: userProfile.clinicSlug
        } : null,
        outstandingBalance: userBills
          .filter(b => b.status === "unpaid")
          .reduce((sum, b) => sum + (b.amount || 0), 0),
        appointmentsCount: userAppointments.length,
        appointmentsList: userAppointments.map(a => ({
          treatment: a.treatment,
          dentistName: a.dentistName,
          dateTime: a.dateTime,
          status: a.status
        })),
        surgeonsList: surgeons ? surgeons.map(s => ({
          name: s.displayName,
          specialty: s.specialty,
          isBoardCertified: s.isBoardCertified
        })) : []
      };

      // Transform messages state into backend history array
      const chatHistory = messages
        .filter(m => m.id !== "initial-welcome")
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      // Call API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: chatHistory,
          context: dynamicContext
        })
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI");
      }

      const data = await response.json();
      let replyText = data.reply;

      // Intercept Action JSON
      const actionData = parseAction(replyText);
      let actionPerformed = undefined;

      if (actionData && actionData.action === "book_appointment") {
        const result = await triggerAutoBooking(actionData);
        if (result.success) {
          actionPerformed = {
            type: "appointment_booked",
            details: result.details || ""
          };
          // Clean up the reply text by removing the structured JSON blocks to make it look clean
          replyText = replyText.replace(/```json[\s\S]*?```/g, "").trim();
        } else {
          replyText = `${replyText.replace(/```json[\s\S]*?```/g, "").trim()}\n\n⚠️ *(AI Note: I tried to book this appointment automatically, but encountered an issue: ${result.reason})*`;
        }
      }

      const botMsg: Message = {
        id: `msg-${Date.now()}-bot`,
        role: "assistant",
        text: replyText,
        timestamp: new Date(),
        actionPerformed
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error("Chatbot response error:", err);
      const errorMsg: Message = {
        id: `msg-${Date.now()}-err`,
        role: "assistant",
        text: "I apologize, but I am experiencing connection issues. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  if (activeClinic?.features?.chatbot === false) {
    return null;
  }

  return (
    <>
      {/* 1. FLOATING LAUNCHER BUTTON */}
      <button
        id="chatbot-floating-launcher"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-[#0E7490] hover:bg-[#0891B2] text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer group"
        title={`${APP_NAME} AI Assistant`}
      >
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
        <MessageSquareText className="h-6 w-6 group-hover:rotate-12 transition-transform" />
      </button>

      {/* 2. SLIDING CHAT WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chatbot-window-panel"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[85vh] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-50 overflow-hidden flex flex-col font-sans"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-800 to-cyan-900 text-white p-5 flex items-center justify-between relative shadow-md">
              <div className="flex items-center space-x-3">
                <div className="bg-cyan-700/60 p-2.5 rounded-2xl border border-cyan-600 relative">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse border border-cyan-800"></span>
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-wide font-display">{activeClinic?.name || APP_NAME} Assistant</h4>
                  <p className="text-[10px] text-cyan-200 font-medium font-mono">/{activeClinic?.slug || 'revon-dental'} • Care Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-cyan-200 hover:text-white p-1.5 rounded-xl hover:bg-cyan-700/40 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat History Viewport */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/70 scrollbar-thin">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} items-start gap-2`}
                >
                  {m.role === "assistant" && (
                    <div className="h-7 w-7 rounded-xl bg-cyan-700/10 flex items-center justify-center text-cyan-800 flex-shrink-0 mt-0.5 border border-cyan-100">
                      <Sparkles className="h-4 w-4 text-cyan-700" />
                    </div>
                  )}
                  <div className="max-w-[80%] flex flex-col space-y-1">
                    <div
                      className={`px-4 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-sm border ${
                        m.role === "user"
                          ? "bg-cyan-800 text-white border-cyan-900 rounded-tr-none"
                          : "bg-white text-slate-700 border-slate-100 rounded-tl-none"
                      }`}
                    >
                      {m.text}

                      {/* Display Auto Action Trigger details */}
                      {m.actionPerformed && (
                        <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl space-y-2">
                          <div className="flex items-center space-x-1.5 font-bold text-[11px] uppercase tracking-wider text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Action Executed</span>
                          </div>
                          <p className="text-[10.5px] font-medium leading-normal">{m.actionPerformed.details}</p>
                          <span className="text-[9px] text-emerald-500 font-mono block">Status: PENDING BOOKING SUCCESS</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono px-1">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isGenerating && (
                <div className="flex justify-start items-start gap-2">
                  <div className="h-7 w-7 rounded-xl bg-cyan-700/10 flex items-center justify-center text-cyan-800 flex-shrink-0 mt-0.5 border border-cyan-100">
                    <Sparkles className="h-4 w-4 text-cyan-700" />
                  </div>
                  <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]">
                    <div className="flex items-center space-x-1.5">
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions Box */}
            <div className="px-4 pt-3 pb-1 border-t border-slate-100/60 bg-white/95 flex flex-wrap gap-1.5">
              <button
                onClick={() => handleSuggestionClick("How do I book an appointment?")}
                className="px-2.5 py-1 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 border border-slate-200 hover:border-cyan-200 rounded-full transition-all cursor-pointer"
              >
                Booking guide?
              </button>
              <button
                onClick={() => handleSuggestionClick("Where can I find my bills and outstanding dues?")}
                className="px-2.5 py-1 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 border border-slate-200 hover:border-cyan-200 rounded-full transition-all cursor-pointer"
              >
                Where are my bills?
              </button>
              <button
                onClick={() => handleSuggestionClick("What dental treatments do you offer and how much are they?")}
                className="px-2.5 py-1 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 border border-slate-200 hover:border-cyan-200 rounded-full transition-all cursor-pointer"
              >
                View Prices & Services
              </button>
              {userProfile ? (
                <button
                  onClick={() => handleSuggestionClick(`I want to book a Root Canal Treatment with Dr. Mohammad Tohid tomorrow`)}
                  className="px-2.5 py-1 text-[10px] font-semibold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-100 rounded-full transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Calendar className="h-3 w-3 text-cyan-700" />
                  <span>Book Root Canal</span>
                </button>
              ) : (
                <button
                  onClick={() => handleSuggestionClick("How do I log in or register?")}
                  className="px-2.5 py-1 text-[10px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-full transition-all cursor-pointer"
                >
                  How to login?
                </button>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(inputMessage);
              }}
              className="p-4 border-t border-slate-100 bg-white flex gap-2 items-center"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={userProfile ? "Ask details or say 'Book Teeth Whitening'..." : "Type your query here..."}
                disabled={isGenerating}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-2xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-cyan-700 text-xs text-slate-800 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isGenerating || !inputMessage.trim()}
                className="bg-cyan-800 hover:bg-cyan-900 disabled:opacity-40 text-white p-2.5 rounded-2xl flex items-center justify-center shadow-md cursor-pointer transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
