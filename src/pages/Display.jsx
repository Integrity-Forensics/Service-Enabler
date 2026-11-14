/* ==============================================
 * IMPORTS
 * ============================================== */

import { useMemo, useState } from "react";
import { motion } from "motion/react";

import ServiceHeader from "../components/ui/ServiceHeader.jsx";
import ServiceStats from "../components/ui/ServiceStats.jsx";
import ServiceTable from "../components/ui/ServiceTable.jsx";
import ServiceToolbar from "../components/ui/ServiceToolbar.jsx";
import useServices from "../hooks/useServices.js";
import { ease } from "../utils/motion.js";
import { countServices, filterServices } from "../utils/serviceStatus.js";

import "../components/CSS/pages/Display.css";

/* ==============================================
 * DISPLAY
 * ============================================== */

/**
 * Main services page.
 *
 * @returns {import("react").JSX.Element}
 */
export default function Display() {
  const [query, setQuery] = useState("");
  const services = useServices();

  const visibleServices = useMemo(
    () => filterServices(services.services, query),
    [services.services, query],
  );

  const counts = useMemo(
    () => countServices(services.services),
    [services.services],
  );

  return (
    <motion.section
      className="services"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease }}
    >
      <div className="services-panel">
        {/* Header */}
        <ServiceHeader />

        {/* Overview */}
        <ServiceStats counts={counts} loading={services.loading} />

        {/* Toolbar */}
        <ServiceToolbar
          query={query}
          busyKey={services.busyKey}
          locked={services.isBusy || services.loading}
          onQueryChange={setQuery}
          onRefresh={services.refresh}
          onEnableAll={services.enableAll}
          onDisableAll={services.disableAll}
        />

        {/* Service list */}
        <ServiceTable
          services={visibleServices}
          loading={services.loading}
          busyKey={services.busyKey}
          locked={services.isBusy}
          onToggle={services.toggle}
        />
      </div>
    </motion.section>
  );
}
