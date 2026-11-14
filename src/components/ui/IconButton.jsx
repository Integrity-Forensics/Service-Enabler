/* ==============================================
 * IMPORTS
 * ============================================== */

import { LoaderCircle } from "lucide-react";

import "../CSS/ui/IconButton.css";

/* ==============================================
 * ICON BUTTON
 * ============================================== */

/**
 * Icon-only button with a hover tooltip.
 *
 * @param {{
 *   icon: import("react").ElementType,
 *   label: string,
 *   tone?: "enable" | "disable",
 *   size?: "small" | "large",
 *   placement?: "bottom" | "left",
 *   busy?: boolean,
 *   disabled?: boolean,
 *   className?: string,
 *   onClick: function
 * }} props
 * @returns {import("react").JSX.Element}
 */
export default function IconButton({
  icon: Icon,
  label,
  tone = "",
  size = "small",
  placement = "bottom",
  busy = false,
  disabled = false,
  className = "",
  onClick,
}) {
  return (
    <div className={`icon-button-wrap ${className}`.trim()}>
      {/* Button */}
      <button
        type="button"
        className={["icon-button", `icon-button-${size}`, tone && `icon-button-${tone}`]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled}
        onClick={onClick}
        aria-label={label}
      >
        {busy ? (
          <LoaderCircle className="spin" strokeWidth={2} />
        ) : (
          <Icon aria-hidden="true" strokeWidth={2} />
        )}
      </button>

      {/* Tooltip */}
      <span className={`icon-button-tooltip icon-button-tooltip-${placement}`}>
        {label}
      </span>
    </div>
  );
}
