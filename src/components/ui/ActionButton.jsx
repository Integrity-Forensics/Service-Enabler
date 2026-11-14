/* ==============================================
 * IMPORTS
 * ============================================== */

import { LoaderCircle } from "lucide-react";

import "../CSS/ui/ActionButton.css";

/* ==============================================
 * ACTION BUTTON
 * ============================================== */

/**
 * Labeled toolbar button with an icon and a busy spinner.
 *
 * @param {{
 *   icon: import("react").ElementType,
 *   label: string,
 *   tone?: "enable" | "disable",
 *   busy?: boolean,
 *   disabled?: boolean,
 *   onClick: function
 * }} props
 * @returns {import("react").JSX.Element}
 */
export default function ActionButton({
  icon: Icon,
  label,
  tone = "",
  busy = false,
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      className={["action-button", tone && `action-button-${tone}`]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      onClick={onClick}
    >
      {/* Button icon */}
      {busy ? (
        <LoaderCircle className="spin" strokeWidth={2} />
      ) : (
        <Icon aria-hidden="true" strokeWidth={2} />
      )}

      {/* Button label */}
      {label}
    </button>
  );
}
