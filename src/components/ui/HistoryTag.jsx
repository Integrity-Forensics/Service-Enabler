/* ==============================================
 * IMPORTS
 * ============================================== */

import { Play, PowerOff, Settings2 } from "lucide-react";

import "../CSS/ui/HistoryTag.css";

/* ==============================================
 * HISTORY TAG
 * ============================================== */

const HISTORY_ICONS = {
  started: Play,
  stopped: PowerOff,
  config: Settings2,
};

/**
 * Builds the hover text for a history tag.
 *
 * @param {{ label: string, time: string, detail?: string }} tag
 * @returns {string}
 */
function getTagTitle(tag) {
  if (!tag.detail) return `${tag.label} ${tag.time}`;

  return `${tag.label} ${tag.time} (${tag.detail})`;
}

/**
 * One colored history entry (started, stopped, startup).
 *
 * @param {{ tag: { tone: string, label: string, time: string, detail?: string }, showLabel?: boolean }} props
 * @returns {import("react").JSX.Element}
 */
export default function HistoryTag({ tag, showLabel = true }) {
  const Icon = HISTORY_ICONS[tag.tone] || Settings2;

  return (
    <span
      className={`history-tag history-tag-${tag.tone}`}
      title={getTagTitle(tag)}
    >
      {/* Tag icon */}
      <Icon aria-hidden="true" strokeWidth={2} />

      {/* Tag label */}
      {showLabel ? <span className="history-tag-label">{tag.label}</span> : null}

      {/* Tag time */}
      <span className="history-tag-time">{tag.time}</span>
    </span>
  );
}
