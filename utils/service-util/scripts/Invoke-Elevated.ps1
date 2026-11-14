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
# SETUP
# ==============================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ==============================================
# RUN
# ==============================================

# Runs the target script and saves everything it prints to OutFile,
# so the non-elevated caller can read the result back.
try {
    $json = [System.Text.Encoding]::UTF8.GetString(
        [System.Convert]::FromBase64String($ScriptArgs)
    )

    $forwardedArgs = @($json | ConvertFrom-Json)

    $output = & powershell.exe `
        -NoLogo `
        -NoProfile `
        -NonInteractive `
        -ExecutionPolicy Bypass `
        -File $ScriptPath `
        @forwardedArgs 2>&1 | Out-String

    Set-Content -Path $OutFile -Value $output -Encoding UTF8
}
catch {
    Set-Content -Path $OutFile -Value $_.Exception.Message -Encoding UTF8
    exit 1
}
