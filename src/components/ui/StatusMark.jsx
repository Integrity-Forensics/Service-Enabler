/* ==============================================
 * IMPORTS
 * ============================================== */

import { Check, TriangleAlert } from "lucide-react";

import "../CSS/ui/StatusMark.css";

/* ==============================================
 * STATUS MARK
 * ============================================== */

const STATUS_ICONS = {
  running: Check,
  protected: TriangleAlert,
};

/**
 * Status icon for a tone, or a small dot when the tone has none.
 *
 * @param {{ tone: string }} props
 * @returns {import("react").JSX.Element}
 */
export default function StatusMark({ tone }) {
  const Icon = STATUS_ICONS[tone];

  if (!Icon) return <span className="status-dot" aria-hidden="true" />;

  return <Icon aria-hidden="true" strokeWidth={2.5} />;
}
