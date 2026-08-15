"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { validateYoutubeUrl } from "@/app/lib/recording-types";

interface YoutubeUrlValidatorProps {
  onValidUrl: (videoId: string, type: "video" | "playlist") => void;
  onError?: (error: string) => void;
}

export default function YoutubeUrlValidator({
  onValidUrl,
  onError,
}: YoutubeUrlValidatorProps) {
  const [input, setInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<ReturnType<typeof validateYoutubeUrl> | null>(null);

  const handleValidate = () => {
    if (!input.trim()) {
      setValidation(null);
      return;
    }

    setIsValidating(true);
    // Simulate API check
    setTimeout(() => {
      const result = validateYoutubeUrl(input.trim());
      setValidation(result);
      setIsValidating(false);

      if (result.isValid && result.id) {
        onValidUrl(result.id, result.type as "video" | "playlist");
        setInput("");
        setValidation(null);
      } else if (result.error) {
        onError?.(result.error);
      }
    }, 300);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (error) {
      onError?.("Unable to access clipboard");
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Input field */}
      <div
        className="relative flex items-center rounded-lg overflow-hidden border transition-all"
        style={{
          borderColor: validation?.isValid ? "#4CAF50" : validation?.isValid === false ? "#C4503A" : "#E8E5DF",
          background: "#FFFFFF",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (validation) setValidation(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleValidate();
          }}
          placeholder="Paste YouTube URL or video ID..."
          className="flex-1 px-4 py-3 text-sm outline-none bg-transparent"
          style={{ color: "#1D1D1F" }}
        />

        {/* Paste button */}
        <motion.button
          onClick={handlePaste}
          className="px-3 py-3 hover:opacity-60 transition-opacity"
          style={{ color: "#D4882A" }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          📋
        </motion.button>

        {/* Clear button */}
        {input && (
          <motion.button
            onClick={() => {
              setInput("");
              setValidation(null);
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 py-3 hover:opacity-60 transition-opacity text-gray-500"
          >
            ✕
          </motion.button>
        )}

        {/* Validate button */}
        <motion.button
          onClick={handleValidate}
          disabled={!input.trim() || isValidating}
          className="px-4 py-3 font-semibold rounded-r-lg text-white disabled:opacity-50 transition-all"
          style={{
            background: "#D4882A",
            minHeight: "44px",
            display: "flex",
            alignItems: "center",
          }}
          whileHover={{ opacity: 0.9 }}
          whileTap={{ scale: 0.95 }}
        >
          {isValidating ? "⏳" : "→"}
        </motion.button>
      </div>

      {/* Validation feedback */}
      <AnimatePresence>
        {validation && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 rounded-lg text-sm"
            style={{
              background: validation.isValid
                ? "rgba(76, 175, 80, 0.1)"
                : "rgba(196, 80, 58, 0.1)",
              border: `1px solid ${validation.isValid ? "#4CAF50" : "#C4503A"}`,
            }}
          >
            <div className="flex items-start gap-2">
              <span style={{ fontSize: "16px" }}>
                {validation.isValid ? "✓" : "✕"}
              </span>
              <div>
                <p
                  style={{
                    color: validation.isValid ? "#4CAF50" : "#C4503A",
                    fontWeight: 600,
                    marginBottom: "2px",
                  }}
                >
                  {validation.isValid ? "Valid URL" : "Invalid URL"}
                </p>
                {validation.isValid ? (
                  <p style={{ color: "#666", fontSize: "12px" }}>
                    {validation.type === "video" ? "🎵 Video" : "📚 Playlist"} detected
                    • ID: {validation.id?.substring(0, 6)}...
                  </p>
                ) : (
                  <p style={{ color: "#C4503A", fontSize: "12px" }}>
                    {validation.error}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Examples */}
      <details className="text-xs" style={{ color: "#8E8E93" }}>
        <summary className="cursor-pointer hover:opacity-70">Need help? See examples</summary>
        <div className="mt-2 p-2 rounded" style={{ background: "#F3EFE7" }}>
          <p className="font-mono text-[11px]" style={{ color: "#666", lineHeight: "1.6" }}>
            ✓ youtu.be/dQw4w9WgXcQ<br/>
            ✓ youtube.com/watch?v=dQw4w9WgXcQ<br/>
            ✓ dQw4w9WgXcQ<br/>
            ✓ youtube.com/playlist?list=...
          </p>
        </div>
      </details>
    </div>
  );
}
