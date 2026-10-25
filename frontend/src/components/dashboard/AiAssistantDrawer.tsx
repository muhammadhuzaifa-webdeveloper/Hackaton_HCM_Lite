"use client";

import { useState } from "react";
import { hcmApi } from "@/api/hcm";
import { Sparkles, Send, Bot, User as UserIcon, X, AlertCircle } from "lucide-react";

interface AiAssistantProps {
  userRole: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AiAssistantDrawer({ userRole, isOpen, onClose }: AiAssistantProps) {
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string; toolUsed?: string }>>([
    {
      sender: "ai",
      text: `Hello! I am your HCM Lite AI Assistant. I have live access to the database scoped to your role (${userRole}). You can ask me questions in English or Roman Urdu!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sampleQuestions =
    userRole === "Employee"
      ? [
          "How many sick leaves do I have left this year?",
          "What is my colleague's salary?",
          "Office timing and grace time policy kya hai?",
          "Mera attendance status kya hai?",
        ]
      : [
          "How many active employees are in Engineering?",
          "Who came late most often this month?",
          "What is this month's attendance rate?",
          "Who is on leave this month?",
          "Latest payroll cost summary",
        ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = text.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await hcmApi.chatAI(userMsg);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res.response || "No response received.",
          toolUsed: res.toolUsed,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: err.response?.data?.message || "Sorry, I could not complete your request at this time.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col">
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              HCM Lite AI Assistant
            </h3>
            <span className="text-[10px] text-blue-600 font-semibold uppercase">
              Role Scoped: {userRole}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Suggested Quick Chips */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 overflow-x-auto whitespace-nowrap">
        <p className="text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
          Suggested Questions:
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {sampleQuestions.slice(0, 3).map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 transition"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.sender === "ai" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                m.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <p className="whitespace-pre-line">{m.text}</p>
              {m.sender === "ai" && (
                <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 border-t border-slate-200/50 dark:border-slate-700 pt-1">
                  <span>AI-generated</span>
                  {m.toolUsed && <span className="font-mono text-blue-500">Tool: {m.toolUsed}</span>}
                </div>
              )}
            </div>

            {m.sender === "user" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <UserIcon className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Bot className="h-4 w-4 animate-bounce text-blue-600" />
            <span>Assistant is retrieving live data...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask anything in English or Roman Urdu..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs outline-none focus:border-blue-600 dark:bg-slate-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
