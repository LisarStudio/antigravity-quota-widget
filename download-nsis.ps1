# Download NSIS portable for building installer
$nsisUrl = "https://sourceforge.net/projects/nsis/files/NSIS%203/3.10/nsis-3.10.zip/download"
$nsisZip = Join-Path $PSScriptRoot "nsis-portable.zip"
$nsisDir = Join-Path $PSScriptRoot "nsis"

Write-Host "[1/3] Descargando NSIS 3.10..."
try {
    $wc = New-Object System.Net.WebClient
    $wc.Headers.Add("User-Agent", "Mozilla/5.0")
    $wc.DownloadFile($nsisUrl, $nsisZip)
    Write-Host "  OK: $nsisZip ($([math]::Round((Get-Item $nsisZip).Length/1MB, 1)) MB)"
} catch {
    Write-Host "  Error descargando desde sourceforge, intentando mirror..."
    try {
        Invoke-WebRequest -Uri "https://github.com/nicehash/nsis/releases/download/v3.08/nsis-3.08.zip" -OutFile $nsisZip -UseBasicParsing
    } catch {
        Write-Host "  ERROR: No se pudo descargar NSIS"
        exit 1
    }
}

Write-Host "[2/3] Extrayendo NSIS..."
Expand-Archive -Path $nsisZip -DestinationPath $nsisDir -Force
Write-Host "  OK: $nsisDir"

Write-Host "[3/3] Buscando makensis.exe..."
$makensis = Get-ChildItem -Path $nsisDir -Filter "makensis.exe" -Recurse | Select-Object -First 1
if ($makensis) {
    Write-Host "  Encontrado: $($makensis.FullName)"
    Write-Host $makensis.FullName
} else {
    Write-Host "  ERROR: makensis.exe no encontrado"
    Get-ChildItem $nsisDir -Recurse | Select-Object Name | Format-Table
    exit 1
}
