"use client";

import { useState, useRef } from "react";
import { resizeAndCompressPhoto, base64ToDataUrl } from "@/lib/photoUtils";

interface PhotoUploaderProps {
  onPhotoReady: (base64: string, name: string, relation: string) => void;
  disabled?: boolean;
}

export default function PhotoUploader({ onPhotoReady, disabled }: PhotoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setProcessing(true);

    try {
      const compressed = await resizeAndCompressPhoto(file);
      setBase64Data(compressed);
      setPreview(base64ToDataUrl(compressed));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process photo");
      setPreview(null);
      setBase64Data(null);
    } finally {
      setProcessing(false);
    }
  }

  function handleSubmit() {
    if (!base64Data || !name.trim() || !relation.trim()) return;
    onPhotoReady(base64Data, name.trim(), relation.trim());
    setPreview(null);
    setBase64Data(null);
    setName("");
    setRelation("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="glass-card p-6 space-y-4">
      {/* File input zone */}
      <label className="photo-upload-zone block p-8 rounded-xl cursor-pointer text-center">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          disabled={disabled || processing}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Family member preview"
            className="w-32 h-32 object-cover rounded-xl mx-auto"
          />
        ) : (
          <div className="text-[var(--text-muted)]">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span className="text-sm">
              {processing ? "Processing..." : "Tap to select a photo"}
            </span>
          </div>
        )}
      </label>

      {error && (
        <p className="text-terracotta text-sm bg-terracotta/10 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Name and relation inputs */}
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-sage/50"
          disabled={disabled}
        />
        <input
          type="text"
          placeholder="Relation (e.g. Daughter)"
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          className="px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-sage/50"
          disabled={disabled}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!base64Data || !name.trim() || !relation.trim() || disabled}
        className="w-full tap-target bg-amber text-white rounded-xl py-3 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-600 transition-colors"
      >
        Add Family Member
      </button>
    </div>
  );
}
