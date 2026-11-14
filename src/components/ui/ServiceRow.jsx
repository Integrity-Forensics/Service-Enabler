/* ==============================================
 * IMPORTS
 * ============================================== */

import { motion } from "motion/react";
import { Power, PowerOff, TriangleAlert } from "lucide-react";

import HistoryTag from "./HistoryTag.jsx";
import IconButton from "./IconButton.jsx";
import StatusBadge from "./StatusBadge.jsx";
import { getHistoryTags } from "../../utils/formatServiceHistory.js";
import { ease } from "../../utils/motion.js";
import { getStatusTone, isActionDisabled } from "../../utils/serviceStatus.js";

import "../CSS/ui/ServiceRow.css";

/* ==============================================
 * SERVICE ROW
 * ============================================== */

const PROTECTED_REASON =
  "Critical system service. Disabling it can disrupt COM and dependant Windows components.";

/**
 * Enable or disable button for one row.
 *
 * @param {{ service: object, busy: boolean, disabled: boolean, onToggle: function }} props
 * @returns {import("react").JSX.Element}
 */
function RowAction({ service, busy, disabled, onToggle }) {
  if (service.running) {
    return (
      <IconButton
        icon={PowerOff}
        label={service.protected ? "Protected" : "Disable"}
        tone="disable"
        placement="left"
        className="service-row-action"
        busy={busy}
        disabled={disabled}
        onClick={onToggle}
      />
    );
  }

  return (
    <IconButton
      icon={Power}
      label="Enable"
      tone="enable"
      placement="left"
      className="service-row-action"
      busy={busy}
      disabled={disabled}
      onClick={onToggle}
    />
  );
}

/**
 * One service in the table.
 *
 * @param {{ service: object, index: number, busy: boolean, locked: boolean, onToggle: function }} props
 * @returns {import("react").JSX.Element}
 */
export default function ServiceRow({ service, index, busy, locked, onToggle }) {
  const tone = getStatusTone(service);
  const historyTags = getHistoryTags(service.history, {
    running: Boolean(service.running),
  });
  const activityTags = historyTags.filter((tag) => tag.tone !== "config");
  const startupTag = historyTags.find((tag) => tag.tone === "config");

  return (
    <motion.article
      className={`service-row service-row-${tone}${
        busy ? " service-row-busy" : ""
      }`}
      role="listitem"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 + index * 0.03, ease }}
    >
      {/* Service info */}
      <div className="service-row-meta">
        <p className="service-row-id">{service.id}</p>

        {service.description ? (
          <p className="service-row-description" title={service.description}>
            {service.description}
          </p>
        ) : null}

        {activityTags.length > 0 ? (
          <div className="service-row-tags">
            {activityTags.map((tag) => (
              <HistoryTag key={`${tag.tone}-${tag.time}`} tag={tag} />
            ))}
          </div>
        ) : null}

        {service.protected ? (
          <p className="service-row-note">
            <TriangleAlert aria-hidden="true" strokeWidth={2} />
            <span>{PROTECTED_REASON}</span>
          </p>
        ) : null}
      </div>

      {/* Startup */}
      <div className="service-row-startup">
        {startupTag ? (
          <HistoryTag tag={startupTag} showLabel={false} />
        ) : (
          <span className="service-row-startup-empty">Not found.</span>
        )}
      </div>

      {/* Status */}
      <StatusBadge service={service} />

      {/* Action */}
      <RowAction
        service={service}
        busy={busy}
        disabled={isActionDisabled(service, locked)}
        onToggle={onToggle}
      />
    </motion.article>
  );
}
