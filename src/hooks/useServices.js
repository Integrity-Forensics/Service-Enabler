/* ==============================================
 * IMPORTS
 * ============================================== */

import { useEffect, useState } from "react";

import { reportResult } from "../utils/serviceActions.js";
import { sendStatus } from "../../utils/sendStatus.js";

/* ==============================================
 * HELPERS
 * ============================================== */

/**
 * Reads every service from Electron.
 *
 * @returns {Promise<object[] | null>} null when the bridge is missing
 */
async function fetchServices() {
  const controls = window.serviceControls;

  if (!controls?.getAll) return null;

  const next = await controls.getAll();

  return Array.isArray(next) ? next : [];
}

/* ==============================================
 * USE SERVICES
 * ============================================== */

/**
 * Loads services and exposes every action the page needs.
 *
 * @returns {{
 *   services: object[],
 *   loading: boolean,
 *   busyKey: string | null,
 *   isBusy: boolean,
 *   refresh: function,
 *   toggle: function,
 *   enableAll: function,
 *   disableAll: function
 * }}
 */
export default function useServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState(null);

  /**
   * Load every service once the page is up.
   */
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const next = await fetchServices();

        if (!alive) return;

        setServices(next || []);
      } catch (error) {
        if (!alive) return;

        sendStatus("error", error?.message || "Failed to load services.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  /**
   * Reloads the service list after an action.
   *
   * @returns {Promise<void>}
   */
  async function reload() {
    const next = await fetchServices();

    if (!next) return;

    setServices(next);
  }

  /**
   * Runs one action while the UI is locked.
   *
   * @param {string} key
   * @param {string} fallback
   * @param {function} task
   * @returns {Promise<void>}
   */
  async function runAction(key, fallback, task) {
    setBusyKey(key);

    try {
      await task();
    } catch (error) {
      sendStatus("error", error?.message || fallback);
    } finally {
      setBusyKey(null);
    }
  }

  /**
   * Manually re-scans every service.
   *
   * @returns {Promise<void>}
   */
  async function refresh() {
    if (!window.serviceControls?.getAll || busyKey) return;

    await runAction("refresh", "Couldn't refresh services.", async () => {
      await reload();
      sendStatus("information", "Service states refreshed.");
    });
  }

  /**
   * Enables or disables one service.
   *
   * @param {object} service
   * @returns {Promise<void>}
   */
  async function toggle(service) {
    const controls = window.serviceControls;

    if (!controls || busyKey) return;

    const shouldDisable = Boolean(service.running);

    if (shouldDisable && service.protected) {
      sendStatus("warn", `${service.name} is protected and can't be disabled.`);
      return;
    }

    await runAction(
      service.name || service.id,
      `Couldn't update ${service.name}.`,
      async () => {
        const result = shouldDisable
          ? await controls.disable(service.id)
          : await controls.enable(service.id);

        await reload();

        reportResult(result, {
          success: shouldDisable
            ? `Disabled ${service.name}.`
            : `Enabled ${service.name}.`,
          error: `Couldn't update ${service.name}.`,
        });
      },
    );
  }

  /**
   * Enables every configured service.
   *
   * @returns {Promise<void>}
   */
  async function enableAll() {
    const controls = window.serviceControls;

    if (!controls?.enableAll || busyKey) return;

    await runAction("all-enable", "Couldn't enable all services.", async () => {
      const result = await controls.enableAll();

      await reload();

      reportResult(result, {
        success: "Enabled all available services.",
        error: "Couldn't enable all services.",
      });
    });
  }

  /**
   * Disables every configured service.
   *
   * @returns {Promise<void>}
   */
  async function disableAll() {
    const controls = window.serviceControls;

    if (!controls?.disableAll || busyKey) return;

    await runAction("all-disable", "Couldn't disable all services.", async () => {
      const result = await controls.disableAll();

      await reload();

      reportResult(result, {
        success: "Disabled available services.",
        warn: "Some services were skipped or couldn't be disabled.",
      });
    });
  }

  return {
    services,
    loading,
    busyKey,
    isBusy: Boolean(busyKey),
    refresh,
    toggle,
    enableAll,
    disableAll,
  };
}
