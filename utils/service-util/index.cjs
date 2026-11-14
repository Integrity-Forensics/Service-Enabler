/* ==============================================
 * SERVICE UTIL
 * ============================================== */

const config = require("./config.cjs");
const history = require("./history.cjs");
const services = require("./services.cjs");

module.exports = {
    ...config,
    ...history,
    ...services,
};
