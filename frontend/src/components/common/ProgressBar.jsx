import React from "react";

export const ProgressBar = ({ percentage = 0, size = "md", showLabel = true }) => {
  const cleanPct = Math.min(Math.max(Math.round(percentage || 0), 0), 100);

  const heightClass = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs font-medium text-slate-600">
          <span>Course Progress</span>
          <span className={cleanPct === 100 ? "text-emerald-600 font-bold" : "text-blue-600 font-bold"}>
            {cleanPct}%
          </span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            cleanPct === 100 ? "bg-emerald-500" : "bg-blue-600"
          }`}
          style={{ width: `${cleanPct}%` }}
        />
      </div>
    </div>
  );
};
