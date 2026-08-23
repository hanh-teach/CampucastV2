import React from 'react';
import { cn } from '../lib/utils';
import { Sparkles, Clock } from 'lucide-react';
import { Button } from './ui/Button';
import { colors } from '../foundation/tokens/colors';

interface MissionCommandBarProps {
  missionName: string;
  status: 'ready' | 'running' | 'paused' | 'archived';
  missionConfidence: number;
  lastSaved: string;
  resumed?: boolean;
  capacities: { rss: boolean, script: boolean, voice: boolean, publish: boolean };
  operationalStandard: { rss: boolean, voice: boolean, gemini: boolean, storage: boolean };
  assets: { script: number, audio: number, podcast: number, video: number };
}

export function MissionCommandBar({ 
  missionName, status, missionConfidence, lastSaved, resumed, 
  capacities, operationalStandard, assets 
}: MissionCommandBarProps) {
  return (
    <div className="flex flex-col border-b" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
      {/* Top Row: Mission Status & Actions */}
      <div className="flex items-center justify-between px-6 py-3 border-b text-[10px] font-black uppercase tracking-widest" style={{ borderColor: colors.border }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
             <Sparkles className="w-3.5 h-3.5" style={{ color: colors.interactive }} />
             <span className="text-sm" style={{ color: colors.textPrimary }}>{missionName}</span>
          </div>
          <div className="px-2 py-0.5 rounded-full flex items-center gap-1.5 transition-colors" 
               style={{ 
                 backgroundColor: status === 'ready' ? `${colors.success}1a` : status === 'paused' ? `${colors.warning}1a` : `${colors.interactive}1a`, 
                 color: status === 'ready' ? colors.success : status === 'paused' ? colors.warning : colors.interactive 
               }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status === 'ready' ? colors.success : status === 'paused' ? colors.warning : colors.interactive }}></span>
            Mission State: {status}
          </div>
          {resumed && (
             <div className="px-2 py-0.5 rounded flex items-center gap-1.5" style={{ backgroundColor: `${colors.warning}1a`, color: colors.warning }}>
               <Clock className="w-3 h-3" />
               Resumed from Stasis
             </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-[10px]">Resume Mission</Button>
          <Button variant="ghost" size="sm" className="h-7 text-[10px]">Pause</Button>
          <Button variant="ghost" size="sm" className="h-7 text-[10px]">Archive to Stasis</Button>
        </div>
      </div>

      {/* Bottom Row: Capacities, Standards, Assets */}
      <div className="flex items-center justify-between px-6 py-2 text-[9px] font-black uppercase tracking-widest" style={{ color: colors.textMuted }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span>Mission Capacity:</span>
            <div className="flex gap-1">
               <div className="w-2 h-2 rounded-full transition-colors" style={{ backgroundColor: capacities.rss ? colors.success : colors.border }}/>
               <div className="w-2 h-2 rounded-full transition-colors" style={{ backgroundColor: capacities.script ? colors.success : colors.border }}/>
               <div className="w-2 h-2 rounded-full transition-colors" style={{ backgroundColor: capacities.voice ? colors.success : colors.border }}/>
               <div className="w-2 h-2 rounded-full transition-colors" style={{ backgroundColor: capacities.publish ? colors.success : colors.border }}/>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>Operational Standard:</span>
            <div className="flex gap-1">
               <div className="w-2 h-2 rounded-full transition-colors" style={{ backgroundColor: operationalStandard.rss ? colors.success : colors.critical }}/>
               <div className="w-2 h-2 rounded-full transition-colors" style={{ backgroundColor: operationalStandard.voice ? colors.success : colors.critical }}/>
               <div className="w-2 h-2 rounded-full transition-colors" style={{ backgroundColor: operationalStandard.gemini ? colors.success : colors.critical }}/>
               <div className="w-2 h-2 rounded-full transition-colors" style={{ backgroundColor: operationalStandard.storage ? colors.success : colors.critical }}/>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <span>Assets:</span>
           <span style={{ color: colors.textPrimary }}>Script: {assets.script}</span>
           <span style={{ color: colors.textPrimary }}>Audio: {assets.audio}</span>
           <span style={{ color: colors.textPrimary }}>Podcast: {assets.podcast}</span>
           <span style={{ color: colors.textPrimary }}>Video: {assets.video}</span>
        </div>
      </div>
    </div>
  );
}
