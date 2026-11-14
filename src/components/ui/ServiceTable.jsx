/* ==============================================
 * IMPORTS
 * ============================================== */

import { motion } from "motion/react";
import { LoaderCircle, SearchX } from "lucide-react";

import ServiceRow from "./ServiceRow.jsx";
import { riseIn } from "../../utils/motion.js";

import "../CSS/ui/ServiceTable.css";

/* ==============================================
 * SERVICE TABLE
 * ============================================== */

const COLUMNS = ["Service", "Startup", "Status", "Action"];

/**
 * Centered loading / empty message.
 *
 * @param {{ icon?: import("react").ElementType, message: string, spin?: boolean }} props
 * @returns {import("react").JSX.Element}
 */
function TableState({ icon: Icon = LoaderCircle, message, spin = false }) {
  return (
    <div className="service-table-state">
      <Icon
        className={spin ? "spin" : ""}
        aria-hidden="true"
        strokeWidth={2}
      />
      <span>{message}</span>
    </div>
  );
}

/**
 * Picks what fills the table body.
 *
 * @param {{ services: object[], loading: boolean, busyKey: string | null, locked: boolean, onToggle: function }} props
 * @returns {import("react").JSX.Element | import("react").JSX.Element[]}
 */
function TableBody({ services, loading, busyKey, locked, onToggle }) {
  if (loading) return <TableState message="Loading services" spin />;

  if (services.length === 0) {
    return <TableState icon={SearchX} message="No services found" />;
  }

  return services.map((service, index) => {
    const rowKey = service.name || `${service.id}-${index}`;

    return (
      <ServiceRow
        key={rowKey}
        service={service}
        index={index}
        busy={busyKey === rowKey}
        locked={locked}
        onToggle={() => onToggle(service)}
      />
    );
  });
}

/**
 * Service list with a header row.
 *
 * @param {{ services: object[], loading: boolean, busyKey: string | null, locked: boolean, delay?: number, onToggle: function }} props
 * @returns {import("react").JSX.Element}
 */
export default function ServiceTable({
  services,
  loading,
  busyKey,
  locked,
  delay = 0.3,
  onToggle,
}) {
  return (
    <motion.div className="service-table" {...riseIn(delay)}>
      {/* Column titles */}
      <div className="service-table-head" aria-hidden="true">
        {COLUMNS.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>

      {/* Rows */}
      <div className="service-table-list" role="list">
        <TableBody
          services={services}
          loading={loading}
          busyKey={busyKey}
          locked={locked}
          onToggle={onToggle}
        />
      </div>
    </motion.div>
  );
}
