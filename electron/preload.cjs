const { contextBridge, ipcRenderer } = require("electron");

/* ==============================================
 * WINDOW CONTROLS
 * ============================================== */

contextBridge.exposeInMainWorld("windowControls", {
    /**
     * Minimizes the window.
     *
     * @returns {void}
     */
    minimize() {
        ipcRenderer.send("window:minimize");
    },

    /**
     * Closes the window.
     *
     * @returns {void}
     */
    close() {
        ipcRenderer.send("window:close");
    },

    /**
     * Reads app-name from config.
     *
     * @returns {Promise<string>}
     */
    getAppName() {
        return ipcRenderer.invoke("window:get-app-name");
    },

    /**
     * Reads brand name + logo for the title bar.
     *
     * @returns {Promise<{ name: string, logo: string }>}
     */
    getBrand() {
        return ipcRenderer.invoke("window:get-brand");
    },
});

/* ==============================================
 * SERVICE CONTROLS
 * ============================================== */

contextBridge.exposeInMainWorld("serviceControls", {
    /**
     * Grabs info for every configured service.
     *
     * @returns {Promise<object[]>}
     */
    getAll() {
        return ipcRenderer.invoke("services:get-all");
    },

    /**
     * Enables one service.
     *
     * @param {string} serviceKey
     * @returns {Promise<object>}
     */
    enable(serviceKey) {
        return ipcRenderer.invoke("services:enable", serviceKey);
    },

    /**
     * Disables one service.
     *
     * @param {string} serviceKey
     * @returns {Promise<object>}
     */
    disable(serviceKey) {
        return ipcRenderer.invoke("services:disable", serviceKey);
    },

    /**
     * Enables every configured service.
     *
     * @returns {Promise<object>}
     */
    enableAll() {
        return ipcRenderer.invoke("services:enable-all");
    },

    /**
     * Disables every configured service.
     *
     * @returns {Promise<object>}
     */
    disableAll() {
        return ipcRenderer.invoke("services:disable-all");
    },
});
