# CampusHire Automated Cold-Start Timing Benchmark
param (
    [string]$IdleStartUtc = ""
)

$ErrorActionPreference = "Continue"

$benchmarkRunId = "run_" + [Guid]::NewGuid().ToString("N").Substring(0, 8)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  CampusHire Render Free Verified Cold-Start Benchmark    " -ForegroundColor Cyan
Write-Host "  Benchmark Run ID: $benchmarkRunId" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$backendUrl = "https://campushire-satya-backend.onrender.com"

# 1. Capture exact start timestamp immediately before first request
$t0 = [DateTime]::UtcNow
$t0Local = [DateTime]::Now
Write-Host "T0 (First Request Sent): $($t0Local.ToString('yyyy-MM-dd HH:mm:ss.fff')) [UTC: $($t0.ToString('yyyy-MM-dd HH:mm:ss.fff'))]" -ForegroundColor Yellow

# 2. First Request to /api/health (Liveness / Container Wake-up)
$reqId1 = "req_health_" + [Guid]::NewGuid().ToString("N").Substring(0, 6)
Write-Host "--> Sending first request to /api/health ($reqId1)..." -ForegroundColor White
$swHealth = [System.Diagnostics.Stopwatch]::StartNew()
$healthOutput = & curl.exe -s -w "`n__CURL_META__%{http_code}|%{time_total}" -H "X-Benchmark-Run-Id: $benchmarkRunId" -H "X-Request-Id: $reqId1" --max-time 120 "$backendUrl/api/health"
$swHealth.Stop()
$tHealth = [DateTime]::UtcNow
$tHealthLocal = [DateTime]::Now

$healthStatus = 0
$healthTimeTotal = 0
$healthJson = $null
if ($healthOutput -match "__CURL_META__(\d+)\|([\d\.]+)") {
    $healthStatus = [int]$Matches[1]
    $healthTimeTotal = [double]$Matches[2]
    $body = ($healthOutput -split "`n__CURL_META__")[0]
    try { $healthJson = $body | ConvertFrom-Json } catch {}
}

Write-Host "<-- /api/health returned HTTP $healthStatus in $([math]::Round($swHealth.Elapsed.TotalSeconds, 3))s at $($tHealthLocal.ToString('HH:mm:ss.fff'))" -ForegroundColor $(if ($healthStatus -eq 200) { "Green" } else { "Red" })

# 3. Readiness Request to /api/health/ready
$reqId2 = "req_ready_" + [Guid]::NewGuid().ToString("N").Substring(0, 6)
Write-Host "--> Verifying database readiness at /api/health/ready ($reqId2)..." -ForegroundColor White
$swReady = [System.Diagnostics.Stopwatch]::StartNew()
$readyOutput = & curl.exe -s -w "`n__CURL_META__%{http_code}|%{time_total}" -H "X-Benchmark-Run-Id: $benchmarkRunId" -H "X-Request-Id: $reqId2" --max-time 30 "$backendUrl/api/health/ready"
$swReady.Stop()
$tReady = [DateTime]::UtcNow
$tReadyLocal = [DateTime]::Now

$readyStatus = 0
$readyTimeTotal = 0
$readyJson = $null
if ($readyOutput -match "__CURL_META__(\d+)\|([\d\.]+)") {
    $readyStatus = [int]$Matches[1]
    $readyTimeTotal = [double]$Matches[2]
    $body = ($readyOutput -split "`n__CURL_META__")[0]
    try { $readyJson = $body | ConvertFrom-Json } catch {}
}

Write-Host "<-- /api/health/ready returned HTTP $readyStatus in $([math]::Round($swReady.Elapsed.TotalSeconds, 3))s at $($tReadyLocal.ToString('HH:mm:ss.fff'))" -ForegroundColor $(if ($readyStatus -eq 200) { "Green" } else { "Red" })

# 4. Jobs Request to /api/jobs
$reqId3 = "req_jobs_" + [Guid]::NewGuid().ToString("N").Substring(0, 6)
Write-Host "--> Requesting public openings at /api/jobs ($reqId3)..." -ForegroundColor White
$swJobs = [System.Diagnostics.Stopwatch]::StartNew()
$jobsOutput = & curl.exe -s -w "`n__CURL_META__%{http_code}|%{time_total}" -H "X-Benchmark-Run-Id: $benchmarkRunId" -H "X-Request-Id: $reqId3" --max-time 30 "$backendUrl/api/jobs"
$swJobs.Stop()
$tJobs = [DateTime]::UtcNow
$tJobsLocal = [DateTime]::Now

$jobsStatus = 0
$jobsTimeTotal = 0
$jobsJson = $null
$jobCount = 0
if ($jobsOutput -match "__CURL_META__(\d+)\|([\d\.]+)") {
    $jobsStatus = [int]$Matches[1]
    $jobsTimeTotal = [double]$Matches[2]
    $body = ($jobsOutput -split "`n__CURL_META__")[0]
    try {
        $jobsJson = $body | ConvertFrom-Json
        if ($jobsJson.data) { $jobCount = $jobsJson.data.Count }
    } catch {}
}

Write-Host "<-- /api/jobs returned HTTP $jobsStatus ($jobCount verified jobs) in $([math]::Round($swJobs.Elapsed.TotalSeconds, 3))s at $($tJobsLocal.ToString('HH:mm:ss.fff'))" -ForegroundColor $(if ($jobsStatus -eq 200 -and $jobCount -eq 6) { "Green" } else { "Yellow" })

# 5. Fetch Container Startup Diagnostics
$reqId4 = "req_diag_" + [Guid]::NewGuid().ToString("N").Substring(0, 6)
Write-Host "--> Retrieving container startup diagnostic telemetry..." -ForegroundColor White
$diagRaw = & curl.exe -s -H "X-Benchmark-Run-Id: $benchmarkRunId" -H "X-Request-Id: $reqId4" --max-time 15 "$backendUrl/api/health/diagnostics"
$diagJson = $null
try { $diagJson = $diagRaw | ConvertFrom-Json } catch {}

$totalElapsedSec = [math]::Round(($tJobs - $t0).TotalSeconds, 3)

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "                   BENCHMARK SUMMARY                      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Benchmark Run ID:                 $benchmarkRunId"
Write-Host "T0 (First Request):               $($t0Local.ToString('yyyy-MM-dd HH:mm:ss.fff')) [UTC: $($t0.ToString('yyyy-MM-dd HH:mm:ss.fff'))]"
Write-Host "T_HTTP (Server Responded):       $($tHealthLocal.ToString('yyyy-MM-dd HH:mm:ss.fff')) [UTC: $($tHealth.ToString('yyyy-MM-dd HH:mm:ss.fff'))] (Elapsed: $([math]::Round(($tHealth - $t0).TotalSeconds, 3))s)"
Write-Host "T_READY (DB Ready Confirmed):     $($tReadyLocal.ToString('yyyy-MM-dd HH:mm:ss.fff')) [UTC: $($tReady.ToString('yyyy-MM-dd HH:mm:ss.fff'))] (Elapsed: $([math]::Round(($tReady - $t0).TotalSeconds, 3))s)"
Write-Host "T_JOBS (First Jobs Response):     $($tJobsLocal.ToString('yyyy-MM-dd HH:mm:ss.fff')) [UTC: $($tJobs.ToString('yyyy-MM-dd HH:mm:ss.fff'))] (Elapsed: $totalElapsedSec s)"
Write-Host "Verified Jobs Count:             $jobCount (Expected: 6)"

if ($healthJson -and $healthJson.instanceId) {
    Write-Host "Container Instance ID:           $($healthJson.instanceId)"
    Write-Host "Container Process PID:           $($healthJson.pid)"
    Write-Host "Container Process Start (UTC):   $($healthJson.processStartTime)"
    Write-Host "Container Process Uptime:        $([math]::Round($healthJson.uptime, 2))s at T_HTTP"

    if ($IdleStartUtc -ne "") {
        $idleStart = [DateTime]::Parse($IdleStartUtc)
        $procStart = [DateTime]::Parse($healthJson.processStartTime)
        if ($procStart -gt $idleStart) {
            Write-Host "Instance Verification:           NEW INSTANCE (Started at $($procStart.ToString('HH:mm:ss.fff')) UTC, AFTER idle start $($idleStart.ToString('HH:mm:ss.fff')) UTC)" -ForegroundColor Green
        } else {
            Write-Host "Instance Verification:           INSTANCE WAS WARM (Started at $($procStart.ToString('HH:mm:ss.fff')) UTC, BEFORE idle start $($idleStart.ToString('HH:mm:ss.fff')) UTC)" -ForegroundColor Yellow
        }
    }
}

Write-Host "Target (60.0s):                  $(if ($totalElapsedSec -le 60.0) { 'PASSED (' + $totalElapsedSec + 's <= 60s)' } else { 'EXCEEDED (' + $totalElapsedSec + 's > 60s)' })" -ForegroundColor $(if ($totalElapsedSec -le 60.0) { "Green" } else { "Yellow" })

Write-Host "`nRaw Container Diagnostics:" -ForegroundColor Gray
Write-Host $diagRaw -ForegroundColor Gray
