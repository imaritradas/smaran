"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PhotoUploader from "@/components/PhotoUploader";
import {
  saveFamilyMemberLocally,
  getLocalFamilyMembers,
} from "@/lib/offlineStore";

interface FamilyPhotoItem {
  id: string;
  patientId: string;
  name: string;
  relation: string;
  photoBase64: string;
  createdAt: string;
}

export default function FamilySetupPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [members, setMembers] = useState<FamilyPhotoItem[]>([]);
  const [saving, setSaving] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      // 1. Try server API
      const res = await fetch(`/api/family?patientId=${encodeURIComponent(patientId)}`);
      let serverList: FamilyPhotoItem[] = [];
      if (res.ok) {
        const data = await res.json();
        if (data.members && Array.isArray(data.members)) {
          serverList = data.members;
        }
      }

      // 2. Fallback / merge with local store
      const local = await getLocalFamilyMembers();
      const localFiltered = (local || []).filter(
        (m) => m.patientId === patientId || m.patientId === "local"
      );

      // Merge avoiding duplicates by id
      const map = new Map<string, FamilyPhotoItem>();
      for (const m of serverList) map.set(m.id, m);
      for (const m of localFiltered) {
        if (!map.has(m.id)) map.set(m.id, m);
      }

      setMembers(Array.from(map.values()));
    } catch (err) {
      console.warn("Could not fetch server family members, using local:", err);
      try {
        const local = await getLocalFamilyMembers();
        if (local) {
          setMembers(local.filter((m) => m.patientId === patientId || m.patientId === "local"));
        }
      } catch {}
    }
  }, [patientId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handlePhotoReady = async (
    base64: string,
    memberName: string,
    memberRelation: string
  ) => {
    setSaving(true);
    const newMember: FamilyPhotoItem = {
      id: `fam_${Date.now()}`,
      patientId: patientId,
      name: memberName.trim(),
      relation: memberRelation.trim(),
      photoBase64: base64,
      createdAt: new Date().toISOString(),
    };

    try {
      // Post to Server API
      await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });
    } catch (err) {
      console.warn("Failed to sync to server, saving locally:", err);
    }

    // Always cache locally in IndexedDB as well
    try {
      await saveFamilyMemberLocally(newMember);
    } catch {}

    setMembers((prev) => [newMember, ...prev]);
    setSaving(false);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this family member?")) return;
    try {
      await fetch(`/api/family?id=${encodeURIComponent(memberId)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Server delete failed:", err);
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-sand-200 shadow-sm">
        <div>
          <Link
            href={`/dashboard/patients/${patientId}`}
            className="text-xs font-bold text-coral-600 hover:underline"
          >
            ← Back to Patient Trends
          </Link>
          <h2 className="text-2xl sm:text-3xl font-black text-navy-900 mt-1">
            Family Faces Memory Album
          </h2>
          <p className="text-navy-600 text-xs sm:text-sm">
            Upload compressed photos (&lt;500KB) of beloved family members to
            provide emotional comfort and recognition practice.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Photo Uploader Component */}
        <div className="bg-white rounded-3xl p-6 border border-sand-200 shadow-card space-y-4">
          <h3 className="text-lg font-bold text-navy-900">
            Add New Family Member
          </h3>
          <PhotoUploader onPhotoReady={handlePhotoReady} disabled={saving} />
        </div>

        {/* Existing Family Members List */}
        <div className="bg-white rounded-3xl p-6 border border-sand-200 shadow-card space-y-4">
          <h3 className="text-lg font-bold text-navy-900">
            Family Album ({members.length})
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {members.map((mem) => (
              <div
                key={mem.id}
                className="p-3 bg-sand-50 rounded-2xl border border-sand-200 flex items-center gap-3"
              >
                <div className="w-14 h-14 rounded-xl bg-white border border-sand-300 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                  {mem.photoBase64 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`data:image/jpeg;base64,${mem.photoBase64}`}
                      alt={mem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-navy-900 truncate">
                    {mem.name}
                  </h4>
                  <p className="text-xs text-coral-600 font-semibold truncate">
                    {mem.relation}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteMember(mem.id)}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                  title="Remove family member"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            ))}

            {members.length === 0 && (
              <p className="text-xs text-navy-500 text-center py-8">
                No family photos added yet. Upload a photo on the left to show in
                the patient&apos;s Family Faces activity!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
