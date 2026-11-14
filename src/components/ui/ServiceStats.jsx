/* ==============================================
 * IMPORTS
 * ============================================== */

import { motion } from "motion/react";

import StatusMark from "./StatusMark.jsx";
import { riseIn } from "../../utils/motion.js";

import "../CSS/ui/ServiceStats.css";

/* ==============================================
 * SERVICE STATS
 * ============================================== */

/**
 * Running and stopped counters.
 *
 * @param {{ counts: { running: number, stopped: number }, loading: boolean, delay?: number }} props
 * @returns {import("react").JSX.Element}
 */
export default function ServiceStats({ counts, loading, delay = 0.1 }) {
  const stats = [
    { key: "running", label: "Running", value: counts.running },
    { key: "stopped", label: "Stopped", value: counts.stopped },
  ];

  return (
    <div className="service-stats">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.key}
          className={`service-stat service-stat-${stat.key}`}
          {...riseIn(delay + index * 0.06)}
        >
          {/* Stat title */}
          <div className="service-stat-head">
            <StatusMark tone={stat.key} />
            <span className="service-stat-label">{stat.label}</span>
          </div>

          {/* Stat value */}
          <span className="service-stat-value">
            {loading ? "-" : stat.value}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
