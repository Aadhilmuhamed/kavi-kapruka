'use client';

import { motion } from 'framer-motion';
import type { TrackingResult } from '@/lib/mcp-parse';

export default function TrackOrderCard({ tracking }: { tracking: TrackingResult }) {
  const { orderNumber, status, recipient, items, events } = tracking;

  // Nothing useful to show → let the AI's text reply stand alone.
  if (!orderNumber && !events.length && !items.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm rounded-2xl bg-bg-card border border-border overflow-hidden shadow-card"
    >
      {/* Header */}
      <div className="bg-accent/10 px-4 py-3 border-b border-accent/20 flex items-center justify-between">
        <div>
          <p className="text-accent font-medium text-sm">📦 Order Status</p>
          {orderNumber && (
            <p className="text-muted text-xs mt-0.5">#{orderNumber}</p>
          )}
        </div>
        <span className="px-2.5 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium capitalize">
          {status}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {recipient && (
          <div className="flex justify-between text-xs">
            <span className="text-muted">Recipient</span>
            <span className="text-cream">{recipient}</span>
          </div>
        )}

        {items.length > 0 && (
          <div className="text-xs">
            <p className="text-muted mb-1">Items</p>
            <ul className="space-y-0.5">
              {items.map((it, i) => (
                <li key={i} className="text-cream/90 flex justify-between">
                  <span className="truncate pr-2">{it.name}</span>
                  {it.quantity ? <span className="text-muted">×{it.quantity}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        {events.length > 0 && (
          <div className="pt-1">
            <p className="text-muted text-xs mb-2">Progress</p>
            <ol className="relative border-l border-border ml-1.5 space-y-3">
              {events.map((e, i) => (
                <li key={i} className="ml-4">
                  <span
                    className={`absolute -left-[5px] w-2.5 h-2.5 rounded-full ${
                      i === events.length - 1 ? 'bg-accent' : 'bg-muted'
                    }`}
                  />
                  <p className="text-cream text-xs capitalize">{e.label}</p>
                  {e.time && <p className="text-muted text-[10px] mt-0.5">{e.time}</p>}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </motion.div>
  );
}
