import React from "react";
import { Card } from "./ui/Card";
import { colors } from "../foundation/tokens/colors";

export function WorkspaceSkeleton() {
  return (
    <div className="w-full flex flex-col animate-pulse" id="workspace-skeleton-root">
      {/* SubTabBar Skeleton */}
      <div className="w-full bg-surface-bg border-b border-border-subtle/60 px-4 sm:px-6 md:px-8 py-3 shrink-0 flex gap-2">
        <div className="h-9 w-36 rounded-full bg-surface-subtle/90" />
        <div className="h-9 w-28 rounded-full bg-surface-subtle/60" />
        <div className="h-9 w-40 rounded-full bg-surface-subtle/60" />
        <div className="h-9 w-32 rounded-full bg-surface-subtle/60" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b" style={{ borderColor: colors.border }}>
          <div className="space-y-2">
            <div className="h-7 w-56 rounded-lg bg-surface-subtle/80" />
            <div className="h-4 w-80 rounded-md bg-surface-subtle/50" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 rounded-xl bg-surface-subtle/80" />
            <div className="h-10 w-36 rounded-xl bg-brand-accent/20" />
          </div>
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 rounded-3xl border border-border-subtle bg-surface-subtle/60 space-y-4">
              <div className="h-5 w-40 rounded bg-surface-bg" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-surface-bg/80 border border-border-subtle" />
                ))}
              </div>
            </Card>

            <Card className="p-6 rounded-3xl border border-border-subtle bg-surface-subtle/60 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 w-36 rounded bg-surface-bg" />
                <div className="h-4 w-20 rounded bg-surface-bg/50" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-surface-bg/70 border border-border-subtle flex items-center p-4 gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-subtle" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-2/3 rounded bg-surface-subtle" />
                      <div className="h-3 w-1/3 rounded bg-surface-subtle/50" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right 1 Col */}
          <div className="space-y-6">
            <Card className="p-6 rounded-3xl border border-border-subtle bg-surface-subtle/60 space-y-4">
              <div className="h-5 w-36 rounded bg-surface-bg" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 rounded-xl bg-surface-bg/70 border border-border-subtle" />
                ))}
              </div>
              <div className="h-10 rounded-xl bg-surface-bg" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
