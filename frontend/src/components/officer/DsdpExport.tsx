"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button, Notice } from "@/components/ui";
import { exportDsdp, saveBlob } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

// One click: fetch the plan from the backend and save it to the officer's computer.
export function DsdpExport() {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setSaved(null);
    setError(null);
    try {
      const { blob, filename } = await exportDsdp();
      saveBlob(blob, filename);
      setSaved(filename);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={run} loading={busy} title="Export the District Skill Development Plan">
        {!busy && <Download size={16} aria-hidden />}
        Export DSDP
      </Button>
      {saved && <Notice kind="success">DSDP exported as {saved}</Notice>}
      {error && <Notice kind="error">{error}</Notice>}
    </div>
  );
}
