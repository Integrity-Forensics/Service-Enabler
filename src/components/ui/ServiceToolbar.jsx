/* ==============================================
 * IMPORTS
 * ============================================== */

import { motion } from "motion/react";
import { Play, PowerOff, RefreshCw } from "lucide-react";

import ActionButton from "./ActionButton.jsx";
import IconButton from "./IconButton.jsx";
import SearchBar from "./SearchBar.jsx";
import { riseIn } from "../../utils/motion.js";

import "../CSS/ui/ServiceToolbar.css";

/* ==============================================
 * SERVICE TOOLBAR
 * ============================================== */

/**
 * Search box plus refresh / bulk actions.
 *
 * @param {{
 *   query: string,
 *   busyKey: string | null,
 *   locked: boolean,
 *   delay?: number,
 *   onQueryChange: function,
 *   onRefresh: function,
 *   onEnableAll: function,
 *   onDisableAll: function
 * }} props
 * @returns {import("react").JSX.Element}
 */
export default function ServiceToolbar({
  query,
  busyKey,
  locked,
  delay = 0.22,
  onQueryChange,
  onRefresh,
  onEnableAll,
  onDisableAll,
}) {
  return (
    <motion.div className="service-toolbar" {...riseIn(delay)}>
      {/* Search */}
      <SearchBar
        value={query}
        placeholder="Filter services"
        onChange={onQueryChange}
      />

      <div className="service-toolbar-actions">
        {/* Refresh */}
        <IconButton
          icon={RefreshCw}
          label="Refresh"
          size="large"
          busy={busyKey === "refresh"}
          disabled={locked}
          onClick={onRefresh}
        />

        {/* Disable all */}
        <ActionButton
          icon={PowerOff}
          label="Disable all"
          tone="disable"
          busy={busyKey === "all-disable"}
          disabled={locked}
          onClick={onDisableAll}
        />

        {/* Enable all */}
        <ActionButton
          icon={Play}
          label="Enable all"
          tone="enable"
          busy={busyKey === "all-enable"}
          disabled={locked}
          onClick={onEnableAll}
        />
      </div>
    </motion.div>
  );
}
