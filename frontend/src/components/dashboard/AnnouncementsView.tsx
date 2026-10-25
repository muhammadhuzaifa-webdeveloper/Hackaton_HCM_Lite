"use client";

import { useState, useEffect } from "react";
import { hcmApi } from "@/api/hcm";
import { Bell, Plus, Trash2, Megaphone } from "lucide-react";

interface AnnouncementsProps {
  userRole: string;
}

export default function AnnouncementsView({ userRole }: AnnouncementsProps) {
  const isHRorAdmin = userRole === "Admin" || userRole === "HR";
  const isAdmin = userRole === "Admin";

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New announcement form
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [targetRole, setTargetRole] = useState("All");
  const [posting, setPosting] = useState(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await hcmApi.getAnnouncements();
      setAnnouncements(res.announcements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHRorAdmin) return;
    setPosting(true);

    try {
      await hcmApi.createAnnouncement({ title, message, priority, targetRole });
      setTitle("");
      setMessage("");
      loadAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to post announcement.");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this announcement?")) return;
    try {
      await hcmApi.deleteAnnouncement(id);
      loadAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete.");
    }
  };

  // Dynamic Theme Classes
  const cardBg = isAdmin 
    ? "bg-slate-900 border-slate-800 text-white" 
    : "bg-white border-slate-200 text-slate-900";

  const borderDivider = isAdmin ? "border-slate-800" : "border-slate-100";

  const inputBg = isAdmin 
    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500" 
    : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-400";

  const labelText = isAdmin ? "text-slate-300" : "text-slate-700";
  const subText = isAdmin ? "text-slate-400" : "text-slate-500";
  const bodyText = isAdmin ? "text-slate-300" : "text-slate-600";

  const badgeBg = isAdmin 
    ? "bg-slate-800 text-slate-300 border-slate-700" 
    : "bg-slate-100 text-slate-700 border-slate-200";

  const btnBg = isAdmin
    ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
    : "bg-slate-800 hover:bg-slate-900 text-white";

  return (
    <div className="space-y-6">
      {/* Post Form (HR and Admin only) */}
      {isHRorAdmin && (
        <form onSubmit={handlePost} className={`p-5 rounded-2xl border shadow-xs space-y-3 ${cardBg}`}>
          <div className={`flex items-center gap-2 border-b pb-2 ${borderDivider}`}>
            <Megaphone className={`h-4 w-4 ${isAdmin ? "text-slate-400" : "text-slate-600"}`} />
            <h3 className="text-sm font-bold">Post Company Announcement</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className={`block text-xs font-semibold mb-1 ${labelText}`}>Announcement Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Annual Sports Gala / Office Timing Shift"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full rounded-xl border px-3 py-1.5 text-xs focus:outline-none ${inputBg}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1 ${labelText}`}>Audience</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className={`w-full rounded-xl border px-3 py-1.5 text-xs focus:outline-none ${inputBg}`}
              >
                <option value="All">All Roles</option>
                <option value="Employee">Employees Only</option>
                <option value="HR">HR Team Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${labelText}`}>Announcement Body</label>
            <textarea
              required
              rows={3}
              placeholder="Write the full announcement message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`w-full rounded-xl border p-2 text-xs focus:outline-none ${inputBg}`}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={posting}
              className={`rounded-xl border px-5 py-2 text-xs font-semibold disabled:opacity-50 transition-colors ${btnBg}`}
            >
              {posting ? "Publishing..." : "Publish Announcement"}
            </button>
          </div>
        </form>
      )}

      {/* Announcements List */}
      <div className="space-y-3">
        <h3 className={`text-sm font-bold ${isAdmin ? "text-white" : "text-slate-900"}`}>Active Feed</h3>
        {announcements.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl border text-xs ${cardBg}`}>
            No announcements broadcasted yet.
          </div>
        ) : (
          announcements.map((a) => (
            <div key={a._id} className={`p-4 rounded-2xl border shadow-xs flex justify-between items-start gap-4 ${cardBg}`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{a.title}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                    To: {a.targetRole}
                  </span>
                </div>
                <p className={`text-xs whitespace-pre-line ${bodyText}`}>{a.message}</p>
                <span className={`text-[10px] block pt-1 ${subText}`}>
                  Posted by {a.authorName || "Management"} on {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>

              {isHRorAdmin && (
                <button
                  onClick={() => handleDelete(a._id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isAdmin 
                      ? "text-slate-400 hover:text-red-400 hover:bg-red-950/40" 
                      : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                  }`}
                  title="Delete Announcement"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}