/* ==============================================
 * IMPORTS
 * ============================================== */

import { useEffect, useState } from "react";
import { motion } from "motion/react";

import { riseIn } from "../../utils/motion.js";

import "../CSS/ui/ServiceHeader.css";

/* ==============================================
 * SERVICE HEADER
 * ============================================== */

const FALLBACK_TITLE = "Service Enabler";

/**
 * Page title, read from the app name in config.
 *
 * @param {{ delay?: number }} props
 * @returns {import("react").JSX.Element}
 */
export default function ServiceHeader({ delay = 0.04 }) {
  const [title, setTitle] = useState("");

  /**
   * Load the app name for the title.
   */
  useEffect(() => {
    const controls = window.windowControls;

    if (!controls?.getAppName) return;

    controls.getAppName().then((appName) => {
      const label = String(appName || "").trim();

      if (!label) return;

      setTitle(label);
    });
  }, []);

  return (
    <motion.header className="service-header" {...riseIn(delay)}>
      {/* Title */}
      <h1>{title || FALLBACK_TITLE}</h1>
    </motion.header>
  );
}
