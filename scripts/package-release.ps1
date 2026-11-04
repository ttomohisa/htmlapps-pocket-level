# Package exactly the tested standalone build for a GitHub Release.
# Run scripts/check-repository.ps1 first; this script does not edit source artifacts.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$config = Get-Content -Raw -Encoding UTF8 (Join-Path $Root 'app.config.json') | ConvertFrom-Json
$version = [string]$config.version
if ($version -notmatch '^\d+\.\d+\.\d+$') { throw "Unexpected release version: $version" }
$tag = 'v' + $version
$base = 'htmlapps-pocket-level-' + $tag
$notesFile = Join-Path $Root "docs/releases/$tag.md"
if (-not (Test-Path -LiteralPath $notesFile -PathType Leaf)) { throw "Missing release notes: $notesFile" }

$releaseDir = Join-Path $Root 'release-dist'
$stage = Join-Path ([IO.Path]::GetTempPath()) ('pocket-level-release-' + [guid]::NewGuid().ToString('N'))
if (Test-Path -LiteralPath $releaseDir) { Remove-Item -LiteralPath $releaseDir -Recurse -Force }
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
New-Item -ItemType Directory -Path $stage -Force | Out-Null

function Copy-Required([string]$relative, [string]$target) {
    $source = Join-Path $Root $relative
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
        throw "Required distribution input is missing: $relative"
    }
    $parent = Split-Path -Parent $target
    if (-not (Test-Path -LiteralPath $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    Copy-Item -LiteralPath $source -Destination $target -Force
}

try {
    $htmlName = "$base.html"
    $selfName = "$base.self-extract.html"
    $zipName = "$base.zip"
    $htmlPath = Join-Path $releaseDir $htmlName
    $selfPath = Join-Path $releaseDir $selfName
    $zipPath = Join-Path $releaseDir $zipName

    Copy-Required 'dist/index.html' $htmlPath
    Copy-Required 'dist/index.self-extract.html' $selfPath
    $canonical = (Get-FileHash -Algorithm SHA256 -LiteralPath $htmlPath).Hash
    $rootDownload = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $Root 'pocket-level.html')).Hash
    if ($canonical -ne $rootDownload) { throw 'Readable release HTML differs from the canonical root download.' }

    # Keep the full ZIP independently usable, with relative paths and both HTML variants.
    $zipInputs = @(
        'app.config.json',
        'README.md',
        'README.ja.md',
        'CHANGELOG.md',
        'LICENSE',
        'THIRD_PARTY_NOTICES.md',
        'VERIFY_OFFLINE.md',
        'dependencies.json',
        "docs/releases/$tag.md",
        'assets/favicon.svg',
        'pocket-level.html',
        'dist/index.html',
        'dist/index.self-extract.html',
        'dist/build-manifest.json',
        'dist/dependency-manifest.json'
    )
    foreach ($relative in $zipInputs) {
        Copy-Required $relative (Join-Path $stage $relative)
    }
    Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zipPath -CompressionLevel Optimal -Force

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($zipPath)
    try {
        $entries = @($archive.Entries | ForEach-Object { $_.FullName.Replace('\', '/') })
        foreach ($needed in $zipInputs) {
            if ($entries -cnotcontains $needed) { throw "ZIP member missing: $needed" }
        }
    } finally {
        $archive.Dispose()
    }

    # SHA256SUMS.txt intentionally lists only the other three downloads.
    $checksums = @()
    foreach ($name in @($htmlName, $selfName, $zipName)) {
        $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $releaseDir $name)).Hash.ToLowerInvariant()
        $checksums += "$hash  $name"
    }
    [IO.File]::WriteAllLines((Join-Path $releaseDir 'SHA256SUMS.txt'), $checksums, [Text.Encoding]::ASCII)
    if ((Get-ChildItem -LiteralPath $releaseDir -File).Count -ne 4) {
        throw 'Release directory must contain exactly three downloads and SHA256SUMS.txt.'
    }
    Write-Host "Release package ready: $tag"
    foreach ($line in $checksums) { Write-Host $line }
} finally {
    if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
}
