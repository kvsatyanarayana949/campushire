param (
    [string]$TargetHost = "campushire-satya-backend.onrender.com",
    [int]$TargetPort = 443
)

Write-Host "Measuring network metrics to $TargetHost on port $TargetPort..." -ForegroundColor Cyan

# 1. DNS Resolution Time
$swDns = [System.Diagnostics.Stopwatch]::StartNew()
$addresses = [System.Net.Dns]::GetHostAddresses($TargetHost)
$swDns.Stop()
$resolvedIp = $addresses[0].ToString()

# 2. TCP Connection Time
$tcpClient = New-Object System.Net.Sockets.TcpClient
$swTcp = [System.Diagnostics.Stopwatch]::StartNew()
$tcpClient.Connect($resolvedIp, $TargetPort)
$swTcp.Stop()

# 3. TLS Handshake Time (if port 443)
$tlsMs = 0
if ($TargetPort -eq 443) {
    $netStream = $tcpClient.GetStream()
    $sslStream = New-Object System.Net.Security.SslStream($netStream, $false, ({ $true }))
    $swTls = [System.Diagnostics.Stopwatch]::StartNew()
    $sslStream.AuthenticateAsClient($TargetHost)
    $swTls.Stop()
    $tlsMs = [math]::Round($swTls.Elapsed.TotalMilliseconds, 2)
    $sslStream.Close()
}
$tcpClient.Close()

[PSCustomObject]@{
    Host = $TargetHost
    Port = $TargetPort
    ResolvedIp = $resolvedIp
    DnsMs = [math]::Round($swDns.Elapsed.TotalMilliseconds, 2)
    TcpMs = [math]::Round($swTcp.Elapsed.TotalMilliseconds, 2)
    TlsMs = $tlsMs
} | Format-List
