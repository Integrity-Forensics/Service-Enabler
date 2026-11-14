# ==============================================
# PARAMS
# ==============================================

param(
    [Parameter(Mandatory = $true)]
    [string]$ScriptPath,

    [Parameter(Mandatory = $true)]
    [string]$OutFile,

    [Parameter(Mandatory = $true)]
    [string]$ScriptArgs
)

# ==============================================
# LAUNCH
# ==============================================

# Opens the UAC prompt and waits for Invoke-Elevated.ps1 to finish.
$wrapperPath = Join-Path $PSScriptRoot "Invoke-Elevated.ps1"

$argumentList = @(
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy", "Bypass",
    "-File", "`"$wrapperPath`"",
    "-ScriptPath", "`"$ScriptPath`"",
    "-OutFile", "`"$OutFile`"",
    "-ScriptArgs", $ScriptArgs
)

Start-Process `
    -FilePath "powershell.exe" `
    -Verb RunAs `
    -Wait `
    -WindowStyle Hidden `
    -ArgumentList $argumentList
