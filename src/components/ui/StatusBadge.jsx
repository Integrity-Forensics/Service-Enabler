/* ==============================================
 * IMPORTS
 * ============================================== */

import StatusMark from "./StatusMark.jsx";
import { getStatusLabel, getStatusTone } from "../../utils/serviceStatus.js";

import "../CSS/ui/StatusBadge.css";

/* ==============================================
 * STATUS BADGE
 * ============================================== */

/**
 * Rounded status label for a service.
 *
 * @param {{ service: object }} props
 * @returns {import("react").JSX.Element}
 */
export default function StatusBadge({ service }) {
  const tone = getStatusTone(service);

  return (
    <span className={`status-badge status-badge-${tone}`}>
      <StatusMark tone={tone} />
      {getStatusLabel(service)}
    </span>
  );
}
