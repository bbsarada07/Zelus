import React from 'react';
import type { Bounty } from '../types';
import { Award, Heart, CheckCircle2, Coins, Users } from 'lucide-react';

interface BountyMarketProps {
  bounties: Bounty[];
  onCastVote: (id: string) => void;
  onVerify: (id: string) => void;
}

export const BountyMarket: React.FC<BountyMarketProps> = ({ bounties, onCastVote, onVerify }) => {
  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="glass-panel border border-zinc-800/80 rounded-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-brand-emerald/5 rounded-full blur-[60px] pointer-events-none" />
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Coins className="w-5 h-5 text-brand-emerald" />
          Civic Bounty Marketplace
        </h2>
        <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
          Local businesses sponsor public works. Complete tasks, earn verified badges, and unlock funding. Cast community verification votes to validate peer accomplishments.
        </p>
      </div>

      {/* Grid of Bounties */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {bounties.map((bounty) => {
          const isFunded = bounty.currentFunding >= bounty.targetBounty;
          const progressPercent = Math.min(
            100,
            Math.round((bounty.currentFunding / bounty.targetBounty) * 100)
          );

          return (
            <div 
              key={bounty.id} 
              className={`glass-panel border rounded-lg p-5 flex flex-col justify-between transition-all duration-300 relative group ${
                bounty.isVerified 
                  ? 'border-brand-emerald/40 bg-brand-emerald/[0.01]' 
                  : 'border-zinc-850 hover:border-zinc-800 bg-zinc-950/20'
              }`}
            >
              {/* Top Row with ID & Sponsor Badge */}
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded">
                  {bounty.id}
                </span>
                
                <span className="text-[10px] font-mono text-brand-emerald bg-brand-emerald/5 border border-brand-emerald/20 px-2 py-0.5 rounded flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  {bounty.sponsor}
                </span>
              </div>

              {/* Title & Description */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                  {bounty.title}
                </h3>
                <p className="text-xs text-zinc-450 mt-1.5 leading-relaxed line-clamp-3">
                  {bounty.description}
                </p>
              </div>

              {/* Funding Bar */}
              <div className="space-y-1.5 mb-5">
                <div className="flex justify-between items-end text-[10px] font-mono">
                  <span className="text-zinc-500">Fund Pool Status</span>
                  <span className="text-zinc-300 font-semibold">
                    ${bounty.currentFunding} / ${bounty.targetBounty} ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-950">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFunded ? 'bg-brand-emerald' : 'bg-brand-cyan'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="pt-4 border-t border-zinc-900/60 flex items-center justify-between gap-3 mt-auto">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                  <Users className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{bounty.votes} Verifications</span>
                </div>

                {bounty.isVerified ? (
                  <div className="text-[10px] font-mono text-brand-emerald bg-brand-emerald/5 border border-brand-emerald/20 px-2.5 py-1 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Bounty Paid Out
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onCastVote(bounty.id)}
                      className="px-2.5 py-1 text-[10px] font-mono text-brand-cyan border border-brand-cyan/25 bg-brand-cyan/[0.02] hover:bg-brand-cyan/10 hover:border-brand-cyan/60 rounded transition-all duration-200 cursor-pointer flex items-center gap-1"
                    >
                      <Heart className="w-3 h-3 fill-current" />
                      Verify Work
                    </button>
                    {bounty.votes >= 20 && (
                      <button
                        onClick={() => onVerify(bounty.id)}
                        className="px-2 py-1 text-[10px] font-mono text-zinc-900 bg-brand-emerald border border-brand-emerald hover:bg-emerald-400 rounded font-semibold transition-all duration-200 cursor-pointer"
                      >
                        Disburse
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
