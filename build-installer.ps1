$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

if (Test-Path "D:\eb-cache") {
    $env:ELECTRON_BUILDER_CACHE = "D:\eb-cache"
}
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
$env:PATH = "C:\Program Files\nodejs;C:\Users\peter\nodejs;" + $env:PATH

Write-Host "Directorio de trabajo: $ProjectRoot"
Write-Host "Ejecutando npm run build..."
& npm run build

Write-Host "Ejecutando electron-builder..."
& npx electron-builder --win nsis --publish=never 2>&1
Write-Host "Codigo de salida: $LASTEXITCODE"
