# ==============================================
# PARAMS
# ==============================================

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("enable", "disable")]
    [string]$Action,

    [Parameter(Mandatory = $true)]
    [string]$NamesJson,

    [Parameter(Mandatory = $false)]
    [string]$ProtectedJson = ""
)

# ==============================================
# SETUP
# ==============================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ==============================================
# HELPERS
# ==============================================

function ConvertFrom-EncodedJson {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return
    }

    $json = [System.Text.Encoding]::UTF8.GetString(
        [System.Convert]::FromBase64String($Value)
    )

    $parsed = ConvertFrom-Json -InputObject $json

    # emit each item so a string[] never becomes one space-joined name
    if ($parsed -is [System.Array]) {
        foreach ($item in $parsed) {
            $item
        }

        return
    }

    $parsed
}

function Get-StringList {
    param(
        [Parameter(Mandatory = $false)]
        [AllowNull()]
        $Values
    )

    $list = foreach ($item in @($Values)) {
        if ($null -eq $item) {
            continue
        }

        # nested array leftover from bad unwrap
        if ($item -is [System.Array]) {
            foreach ($inner in $item) {
                $text = [string]$inner
                if (-not [string]::IsNullOrWhiteSpace($text)) {
                    $text.Trim()
                }
            }

            continue
        }

        $text = [string]$item
        if (-not [string]::IsNullOrWhiteSpace($text)) {
            $text.Trim()
        }
    }

    return @($list | Select-Object -Unique)
}

# ==============================================
# RESULT HELPERS
# ==============================================

function New-ServiceResult {
    param(
        [string]$Name,
        [bool]$Ok,
        [bool]$Skipped,
        [string]$Status,
        [string]$StartType,
        [string]$ErrorMessage = $null
    )

    return [PSCustomObject]@{
        name      = $Name
        ok        = $Ok
        skipped   = $Skipped
        status    = $Status
        startType = $StartType
        error     = $ErrorMessage
    }
}

# ==============================================
# SERVICE ACTIONS
# ==============================================

function Invoke-ServiceAction {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,

        [Parameter(Mandatory = $true)]
        [ValidateSet("enable", "disable")]
        [string]$Action,

        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [string[]]$Protected
    )

    try {
        # ==============================================
        # LOAD SERVICE
        # ==============================================

        $service = Get-Service -Name $Name -ErrorAction Stop
        $startType = $service.StartType.ToString()
        $isProtected = $Protected -contains $service.Name.ToLowerInvariant()
        $isKernelStart = $startType -in @("Boot", "System")

        # ==============================================
        # SAFETY CHECKS
        # ==============================================

        # dont touch protected services on disable
        if ($Action -eq "disable" -and $isProtected) {
            return New-ServiceResult `
                -Name $service.Name `
                -Ok:$false `
                -Skipped:$true `
                -Status $service.Status.ToString() `
                -StartType $startType `
                -ErrorMessage "Protected service cannot be disabled."
        }

        # leave boot/system drivers alone
        if ($Action -eq "disable" -and $isKernelStart) {
            return New-ServiceResult `
                -Name $service.Name `
                -Ok:$false `
                -Skipped:$true `
                -Status $service.Status.ToString() `
                -StartType $startType `
                -ErrorMessage "Boot/System drivers are left untouched."
        }

        # ==============================================
        # ENABLE
        # ==============================================

        if ($Action -eq "enable") {
            # kernel stuff already starts its own way
            if (-not $isKernelStart) {
                Set-Service -Name $Name -StartupType Automatic
            }

            if ($service.Status -ne "Running") {
                Start-Service -Name $Name -ErrorAction Stop
            }

            $service = Get-Service -Name $Name

            return New-ServiceResult `
                -Name $service.Name `
                -Ok:$true `
                -Skipped:$false `
                -Status $service.Status.ToString() `
                -StartType $service.StartType.ToString()
        }

        # ==============================================
        # DISABLE
        # ==============================================

        if ($service.Status -ne "Stopped") {
            Stop-Service -Name $Name -ErrorAction SilentlyContinue
        }

        Set-Service -Name $Name -StartupType Disabled
        $service = Get-Service -Name $Name

        return New-ServiceResult `
            -Name $service.Name `
            -Ok:$true `
            -Skipped:$false `
            -Status $service.Status.ToString() `
            -StartType $service.StartType.ToString()
    }
    catch {
        # ==============================================
        # ERROR
        # ==============================================

        $service = Get-Service -Name $Name -ErrorAction SilentlyContinue

        return New-ServiceResult `
            -Name $Name `
            -Ok:$false `
            -Skipped:$false `
            -Status $(if ($service) { $service.Status.ToString() } else { "Unknown" }) `
            -StartType $(if ($service) { $service.StartType.ToString() } else { "Unknown" }) `
            -ErrorMessage $_.Exception.Message
    }
}

# ==============================================
# MAIN
# ==============================================

$names = Get-StringList -Values @(ConvertFrom-EncodedJson -Value $NamesJson)
$protected = [string[]]@(
    Get-StringList -Values @(ConvertFrom-EncodedJson -Value $ProtectedJson) |
        ForEach-Object { $_.ToLowerInvariant() }
)

if ($names.Count -eq 0) {
    ConvertTo-Json -InputObject @(
        New-ServiceResult `
            -Name "" `
            -Ok:$false `
            -Skipped:$false `
            -Status "Unknown" `
            -StartType "Unknown" `
            -ErrorMessage "No service names were provided."
    ) -Depth 4 -Compress

    return
}

$result = foreach ($name in $names) {
    Invoke-ServiceAction -Name $name -Action $Action -Protected $protected
}

# ==============================================
# OUTPUT
# ==============================================

ConvertTo-Json -InputObject @($result) -Depth 4 -Compress
