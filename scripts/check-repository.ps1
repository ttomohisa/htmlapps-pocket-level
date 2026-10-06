$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
& (Join-Path $Root 'build-standalone.ps1')
$config = Get-Content -Raw -Encoding UTF8 (Join-Path $Root 'app.config.json') | ConvertFrom-Json
$html = Get-Content -Raw -Encoding UTF8 (Join-Path $Root $config.build.output)
$degreeToken = '180' + [char]0x00B0
$required = @('Pocket Level','DeviceMotionEvent','DeviceOrientationEvent',$degreeToken,'APP:BEGIN','APP:END','APP:HELP:BEGIN','APP:HELP:END')
foreach ($item in $required) { if (-not $html.Contains($item)) { throw "Required content missing: $item" } }
$testFiles = @(Get-ChildItem -Path (Join-Path $Root 'tests/*.test.cjs') | ForEach-Object { $_.FullName })
& node --test @testFiles
if ($LASTEXITCODE -ne 0) { throw 'Application or build regression tests failed' }
$previousHtml = $env:POCKET_LEVEL_HTML
try {
    $runtimeTests = @((Join-Path $Root 'tests/sensor-validity.test.cjs'), (Join-Path $Root 'tests/primary-readout.test.cjs'))
    $artifacts = @($config.build.output, 'pocket-level.html')
    if ($config.build.selfExtract.enabled) { $artifacts += $config.build.selfExtract.output }
    foreach ($artifact in $artifacts) {
        $env:POCKET_LEVEL_HTML = Join-Path $Root $artifact
        Write-Host "Testing artifact: $artifact"
        & node --test @runtimeTests
        if ($LASTEXITCODE -ne 0) { throw "Application regression tests failed: $artifact" }
    }
} finally { $env:POCKET_LEVEL_HTML = $previousHtml }
Write-Host 'Repository checks passed' -ForegroundColor Green
