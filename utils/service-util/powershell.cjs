const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

/* ==============================================
 * SETUP
 * ============================================== */

const SCRIPTS_DIR = path.join(__dirname, "scripts");
const ELEVATE_SCRIPT = path.join(SCRIPTS_DIR, "Start-Elevated.ps1");

const DEFAULT_TIMEOUT_MS = 20_000;
const ELEVATED_TIMEOUT_MS = 60_000;
const MAX_BUFFER = 1024 * 512;

const POWERSHELL_FLAGS = [
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
];

/* ==============================================
 * HELPERS
 * ============================================== */

/**
 * Picks the timeout from options, or the fallback.
 *
 * @param {{ timeoutMs?: number }} options
 * @param {number} fallback
 * @returns {number}
 */
function resolveTimeout(options, fallback) {
    const timeoutMs = Number(options.timeoutMs);

    if (timeoutMs > 0) return timeoutMs;

    return fallback;
}

/**
 * Parses JSON stdout from a script.
 *
 * @param {string} raw
 * @returns {any[]}
 */
function parseJsonOutput(raw) {
    const text = String(raw || "").trim();

    if (!text) return [];

    const parsed = JSON.parse(text);

    return Array.isArray(parsed) ? parsed : [parsed];
}

/**
 * Base64-encode args so powershell doesnt eat JSON brackets.
 *
 * @param {string} value
 * @returns {string}
 */
function encodeParam(value) {
    return Buffer.from(String(value), "utf8").toString("base64");
}

/**
 * Turns named params into a flat list of script args.
 * Params ending in "Json" are base64 encoded.
 *
 * @param {Record<string, string>} params
 * @returns {string[]}
 */
function buildParamArgs(params) {
    const args = [];

    for (const [key, value] of Object.entries(params)) {
        args.push(`-${key}`);

        if (/Json$/i.test(key)) {
            args.push(encodeParam(value));
            continue;
        }

        args.push(String(value));
    }

    return args;
}

/**
 * Builds the full powershell.exe args for a -File script.
 *
 * @param {string} scriptPath
 * @param {string[]} scriptArgs
 * @returns {string[]}
 */
function buildFileArgs(scriptPath, scriptArgs) {
    return [...POWERSHELL_FLAGS, "-File", scriptPath, ...scriptArgs];
}

/**
 * Runs powershell.exe and returns its output.
 *
 * @param {string[]} args
 * @param {number} timeoutMs
 * @returns {Promise<{ stdout: string, stderr: string }>}
 */
function runPowerShell(args, timeoutMs) {
    return execFileAsync("powershell.exe", args, {
        windowsHide: true,
        timeout: timeoutMs,
        maxBuffer: MAX_BUFFER,
    });
}

/* ==============================================
 * NORMAL RUN
 * ============================================== */

/**
 * Runs a service-util PowerShell script with named args.
 *
 * @param {string} scriptName
 * @param {Record<string, string>} [params]
 * @param {{ timeoutMs?: number, elevated?: boolean }} [options]
 * @returns {Promise<any[]>}
 */
async function runScript(scriptName, params = {}, options = {}) {
    const scriptPath = path.join(SCRIPTS_DIR, scriptName);

    if (options.elevated) {
        return runElevatedScript(scriptPath, params, options);
    }

    const args = buildFileArgs(scriptPath, buildParamArgs(params));
    const timeoutMs = resolveTimeout(options, DEFAULT_TIMEOUT_MS);

    const { stdout, stderr } = await runPowerShell(args, timeoutMs);

    if (!String(stdout || "").trim() && String(stderr || "").trim()) {
        throw new Error(String(stderr).trim());
    }

    return parseJsonOutput(stdout);
}

/* ==============================================
 * ELEVATED RUN
 * ============================================== */

/**
 * Reads the output file written by the elevated script.
 *
 * @param {string} outFile
 * @returns {any[]}
 */
function readElevatedOutput(outFile) {
    if (!fs.existsSync(outFile)) {
        throw new Error(
            "Elevated PowerShell did not return any output. The UAC prompt may have been denied."
        );
    }

    const raw = fs.readFileSync(outFile, "utf8");

    try {
        return parseJsonOutput(raw);
    } catch {
        throw new Error(
            String(raw || "").trim() ||
                "Elevated PowerShell failed without a message."
        );
    }
}

/**
 * Runs a script elevated. Windows will show a UAC prompt.
 * Output is written to a temp file so we can read it back.
 *
 * @param {string} scriptPath
 * @param {Record<string, string>} params
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<any[]>}
 */
async function runElevatedScript(scriptPath, params = {}, options = {}) {
    const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const outFile = path.join(os.tmpdir(), `if-service-out-${stamp}.json`);

    const scriptArgs = encodeParam(JSON.stringify(buildParamArgs(params)));

    const args = buildFileArgs(ELEVATE_SCRIPT, [
        "-ScriptPath",
        scriptPath,
        "-OutFile",
        outFile,
        "-ScriptArgs",
        scriptArgs,
    ]);

    try {
        await runPowerShell(args, resolveTimeout(options, ELEVATED_TIMEOUT_MS));

        return readElevatedOutput(outFile);
    } finally {
        fs.rmSync(outFile, { force: true });
    }
}

module.exports = {
    runScript,
    parseJsonOutput,
};
