"use client";

import { WellnessReport } from "@/lib/reports/wellnessReport";
import { useState } from "react";

interface WellnessReportActionsProps {
  report: WellnessReport;
}

export function WellnessReportActions({ report }: WellnessReportActionsProps) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyJSON = async () => {
    try {
      const json = JSON.stringify(report, null, 2);
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to copy to clipboard");
    }
  };

  return (
    <div className="flex gap-4 justify-center flex-wrap">
      <button
        onClick={handlePrint}
        className="px-4 py-2 border border-black rounded-md hover:bg-black/5 text-sm font-medium transition-colors"
      >
        Print Report
      </button>
      <button
        onClick={handleCopyJSON}
        className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
          copied
            ? "border-green-600 bg-green-50 text-green-700"
            : "border-black hover:bg-black/5"
        }`}
      >
        {copied ? "Copied!" : "Copy as JSON"}
      </button>
    </div>
  );
}
