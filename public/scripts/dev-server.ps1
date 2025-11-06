param(
    [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'

$root = (Get-Location).Path
$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Serving on $prefix from $root"

function Get-ContentType($path) {
    switch (([System.IO.Path]::GetExtension($path)).ToLower()) {
        '.html' { 'text/html' }
        '.css' { 'text/css' }
        '.js' { 'application/javascript' }
        '.json' { 'application/json' }
        '.png' { 'image/png' }
        '.jpg' { 'image/jpeg' }
        '.jpeg' { 'image/jpeg' }
        '.svg' { 'image/svg+xml' }
        default { 'application/octet-stream' }
    }
}

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response
        $local = $req.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($local)) { $local = 'index.html' }
        $path = Join-Path $root $local
        if (Test-Path $path) {
            $bytes = [System.IO.File]::ReadAllBytes($path)
            $res.ContentType = Get-ContentType $path
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            $res.Close()
        }
        else {
            $res.StatusCode = 404
            $writer = New-Object System.IO.StreamWriter($res.OutputStream)
            $writer.Write('Not Found')
            $writer.Flush()
            $res.Close()
        }
    }
    catch {
        Write-Host $_.Exception.Message
    }
}