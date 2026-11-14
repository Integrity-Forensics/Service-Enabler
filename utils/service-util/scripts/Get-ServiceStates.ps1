# ==============================================
# PARAMS
# ==============================================

param(
    [Parameter(Mandatory = $true)]
    [string]$TargetsJson
)

# ==============================================
# SETUP
# ==============================================

$ErrorActionPreference = "SilentlyContinue"
$ProgressPreference = "SilentlyContinue"

# ==============================================
# HELPERS
# ==============================================

function ConvertFrom-EncodedJson {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    $json = [System.Text.Encoding]::UTF8.GetString(
        [System.Convert]::FromBase64String($Value)
    )

    $parsed = ConvertFrom-Json -InputObject $json

    if ($parsed -isnot [System.Array]) {
        return $parsed
    }

    # emit each item so we never wrap the whole array as one object
    foreach ($item in $parsed) {
        $item
    }
}

function New-EmptyHistory {
    return [PSCustomObject]@{
        lastStartedAt      = $null
        lastStoppedAt      = $null
        lastConfigChangeAt = $null
        lastConfigFrom     = $null
        lastConfigTo       = $null
    }
}

function ConvertTo-IsoTime {
    param(
        [Parameter(Mandatory = $true)]
        [datetime]$Value
    )

    return $Value.ToUniversalTime().ToString("o")
}

# match an SCM event to one of our known service names
function Find-HistoryKey {
    param(
        [Parameter(Mandatory = $true)]
        $Event,

        [Parameter(Mandatory = $true)]
        $Map
    )

    if ($null -eq $Event.Properties) {
        return $null
    }

    foreach ($property in $Event.Properties) {
        $value = [string]$property.Value
        $key = $value.ToLowerInvariant()

        if (-not $Map.ContainsKey($key)) {
            continue
        }

        return $key
    }

    return $null
}

function Find-ServiceStateValue {
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [string[]]$Values
    )

    foreach ($value in $Values) {
        $lower = $value.ToLowerInvariant()

        if ($lower -eq "running") {
            return "running"
        }

        if ($lower -eq "stopped") {
            return "stopped"
        }
    }

    return ""
}

function Update-HistoryFromStateEvent {
    param(
        [Parameter(Mandatory = $true)]
        $Entry,

        [Parameter(Mandatory = $true)]
        [string]$Stamp,

        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [string[]]$Values
    )

    $state = Find-ServiceStateValue -Values $Values

    if ($state -eq "running" -and [string]::IsNullOrWhiteSpace($Entry.lastStartedAt)) {
        $Entry.lastStartedAt = $Stamp
    }

    if ($state -eq "stopped" -and [string]::IsNullOrWhiteSpace($Entry.lastStoppedAt)) {
        $Entry.lastStoppedAt = $Stamp
    }

    return $Entry
}

function Update-HistoryFromConfigEvent {
    param(
        [Parameter(Mandatory = $true)]
        $Entry,

        [Parameter(Mandatory = $true)]
        [string]$Stamp,

        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [string[]]$Values
    )

    if (-not [string]::IsNullOrWhiteSpace($Entry.lastConfigChangeAt)) {
        return $Entry
    }

    $Entry.lastConfigChangeAt = $Stamp

    if ($Values.Count -lt 3) {
        return $Entry
    }

    # common layout: display name, from, to, service name
    $Entry.lastConfigFrom = $Values[1]
    $Entry.lastConfigTo = $Values[2]

    return $Entry
}

# pulls recent SCM events once, then maps start/stop/config
# timestamps onto the service names we care about
function Get-ServiceHistoryMap {
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [string[]]$Names
    )

    $map = @{}

    foreach ($name in $Names) {
        if ([string]::IsNullOrWhiteSpace($name)) {
            continue
        }

        $key = $name.ToLowerInvariant()

        if ($map.ContainsKey($key)) {
            continue
        }

        $map[$key] = New-EmptyHistory
    }

    if ($map.Count -eq 0) {
        return $map
    }

    # 7036 = entered running/stopped (not always present)
    # 7040 = start type changed (enable/disable style config)
    $events = @(
        Get-WinEvent -FilterHashtable @{
            LogName      = "System"
            ProviderName = "Service Control Manager"
            Id           = 7036, 7040
        } -MaxEvents 800 -ErrorAction SilentlyContinue
    )

    foreach ($event in $events) {
        if ($null -eq $event) {
            continue
        }

        if ($null -eq $event.Properties) {
            continue
        }

        if ($event.Properties.Count -lt 2) {
            continue
        }

        $key = Find-HistoryKey -Event $event -Map $map

        if ([string]::IsNullOrWhiteSpace($key)) {
            continue
        }

        $entry = $map[$key]
        $stamp = ConvertTo-IsoTime -Value $event.TimeCreated
        $values = @(
            $event.Properties | ForEach-Object { [string]$_.Value }
        )

        if ($event.Id -eq 7036) {
            $entry = Update-HistoryFromStateEvent -Entry $entry -Stamp $stamp -Values $values
            $map[$key] = $entry
            continue
        }

        if ($event.Id -ne 7040) {
            continue
        }

        $entry = Update-HistoryFromConfigEvent -Entry $entry -Stamp $stamp -Values $values
        $map[$key] = $entry
    }

    return $map
}

function Get-TargetState {
    param(
        [Parameter(Mandatory = $true)]
        $Target,

        [Parameter(Mandatory = $true)]
        $HistoryMap
    )

    $id = [string]$Target.id
    $query = [string]$Target.query
    $match = [string]$Target.match

    if ([string]::IsNullOrWhiteSpace($query)) {
        return [PSCustomObject]@{
            id       = $id
            match    = $match
            query    = $query
            services = @()
        }
    }

    $services = @(
        Get-Service -Name $query |
            Select-Object Name, DisplayName, Status, StartType
    )

    return [PSCustomObject]@{
        id       = $id
        match    = $match
        query    = $query
        services = @(
            $services | ForEach-Object {
                $key = $_.Name.ToLowerInvariant()
                $history = New-EmptyHistory

                if ($HistoryMap.ContainsKey($key)) {
                    $history = $HistoryMap[$key]
                }

                [PSCustomObject]@{
                    Name        = $_.Name
                    DisplayName = $_.DisplayName
                    Status      = $_.Status.ToString()
                    StartType   = $_.StartType.ToString()
                    History     = $history
                }
            }
        )
    }
}

# ==============================================
# MAIN
# ==============================================

$targets = @(ConvertFrom-EncodedJson -Value $TargetsJson)

# expand mashed targets first so history covers every real name
$expandedTargets = foreach ($target in $targets) {
    if ($target.id -isnot [System.Array]) {
        $target
        continue
    }

    for ($i = 0; $i -lt $target.id.Count; $i++) {
        [PSCustomObject]@{
            id    = [string]$target.id[$i]
            query = [string]$target.query[$i]
            match = [string]$target.match[$i]
        }
    }
}

$resolvedNames = foreach ($target in $expandedTargets) {
    if ([string]::IsNullOrWhiteSpace([string]$target.query)) {
        continue
    }

    Get-Service -Name ([string]$target.query) |
        ForEach-Object { $_.Name }
}

$historyMap = Get-ServiceHistoryMap -Names @($resolvedNames | Select-Object -Unique)

$result = foreach ($target in $expandedTargets) {
    Get-TargetState -Target $target -HistoryMap $historyMap
}

# ==============================================
# OUTPUT
# ==============================================

ConvertTo-Json -InputObject @($result) -Depth 6 -Compress
