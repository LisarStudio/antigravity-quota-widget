$src = Join-Path $PSScriptRoot "release\win-unpacked"
$dst = Join-Path $PSScriptRoot "release\Antigravity-AI-Monitor-1.0.0-portable.zip"

if (-not (Test-Path $src)) {
    Write-Host "ERROR: No existe la carpeta $src. Corre primero build-installer.ps1" -ForegroundColor Red
    exit 1
}

Write-Host "Comprimiendo aplicacion..."
Compress-Archive -Path "$src\*" -DestinationPath $dst -Force

$size = [math]::Round((Get-Item $dst).Length / 1MB, 1)
Write-Host "ZIP portable creado: $size MB"
Write-Host "Ruta: $dst"
