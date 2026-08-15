"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { recordContentReport } from "@/app/actions/tape";

interface ReportTapeButtonProps {
  tapeId: string;
  publicId: string;
}

export default function ReportTapeButton({ tapeId, publicId }: ReportTapeButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reasons = [
    { id: "inappropriate", label: "Inappropriate content", icon: "⚠️" },
    { id: "spam", label: "Spam or promotion", icon: "🚫" },
    { id: "copyright", label: "Copyright infringement", icon: "©️" },
    { id: "harassment", label: "Harassment or abuse", icon: "😤" },
    { id: "other", label: "Other", icon: "❓" },
  ];

  async function handleSubmitReport() {
    if (!selectedReason) return;

    setIsSubmitting(true);
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    try {
      const result = await recordContentReport(
        tapeId,
        sessionId,
        selectedReason as any,
        details || undefined
      );

      if (result.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setShowForm(false);
          setShowMenu(false);
          setSelectedReason(null);
          setDetails("");
          setSubmitted(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu((v) => !v)}
        className="text-xs px-3 py-2 rounded-full transition-all hover:opacity-70"
        style={{
          background: "#F3EFE7",
          border: "1px solid #E8E5DF",
          color: "#8E8E93",
          fontFamily: "monospace",
        }}
        aria-label="Report this tape"
        aria-expanded={showMenu}
      >
        🚩 Report
      </button>

      <AnimatePresence>
        {showMenu && !showForm && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-2 bg-white rounded-lg z-50 overflow-hidden shadow-lg border border-gray-200"
            style={{ minWidth: "240px" }}
          >
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs font-semibold" style={{ color: "#1D1D1F" }}>
                Why are you reporting this?
              </p>
            </div>
            <div className="flex flex-col">
              {reasons.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => {
                    setSelectedReason(reason.id);
                    setShowForm(true);
                  }}
                  className="px-3 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                  style={{ color: "#3D3D3F" }}
                >
                  <span>{reason.icon}</span>
                  <span>{reason.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMenu(false)}
              className="w-full px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
              style={{ color: "#8E8E93" }}
            >
              Cancel
            </button>
          </motion.div>
        )}

        {showForm && selectedReason && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-2 bg-white rounded-lg z-50 overflow-hidden shadow-lg border border-gray-200"
            style={{ minWidth: "280px" }}
          >
            {!submitted ? (
              <>
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold mb-1" style={{ color: "#1D1D1F" }}>
                    Report tape
                  </p>
                  <p className="text-xs" style={{ color: "#8E8E93" }}>
                    {reasons.find((r) => r.id === selectedReason)?.label}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Optional: share more details (max 200 characters)"
                    maxLength={200}
                    className="w-full px-2 py-2 text-xs rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    style={{ fontFamily: "var(--font-inter, Inter, sans-serif)" }}
                    rows={3}
                  />
                  <p className="text-[10px] mt-1" style={{ color: "#AAAAAA" }}>
                    {details.length}/200
                  </p>
                </div>
                <div className="px-4 py-3 flex gap-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setSelectedReason(null);
                      setDetails("");
                    }}
                    className="flex-1 px-3 py-2 text-xs rounded border border-gray-200 hover:bg-gray-50 transition-all"
                    style={{ color: "#8E8E93" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    disabled={isSubmitting}
                    className="flex-1 px-3 py-2 text-xs rounded font-semibold text-white transition-all disabled:opacity-50"
                    style={{ background: "#C4503A" }}
                  >
                    {isSubmitting ? "Sending…" : "Submit Report"}
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm font-semibold mb-1" style={{ color: "#28A858" }}>
                  ✓ Thank you
                </p>
                <p className="text-xs" style={{ color: "#8E8E93" }}>
                  Your report has been received. Our team will review it shortly.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
