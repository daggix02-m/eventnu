Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path (Get-Location) "web\public\logo.png"
$publicDir = Join-Path (Get-Location) "web\public"
$iconsDir = Join-Path $publicDir "icons"

if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir | Out-Null
}

$img = [System.Drawing.Image]::FromFile($srcPath)

function Resize-Image($source, $targetPath, $width, $height, $bgHex) {
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    if ($bgHex) {
        $color = [System.Drawing.ColorTranslator]::FromHtml($bgHex)
        $brush = New-Object System.Drawing.SolidBrush $color
        $g.FillRectangle($brush, 0, 0, $width, $height)
        $brush.Dispose()
        
        # Draw image centered with padding for maskable icon safe zone (20% padding)
        $padX = [int]($width * 0.1)
        $padY = [int]($height * 0.1)
        $destW = $width - (2 * $padX)
        $destH = $height - (2 * $padY)
        $g.DrawImage($source, $padX, $padY, $destW, $destH)
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.DrawImage($source, 0, 0, $width, $height)
    }
    
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Saved $targetPath"
}

# Standard PWA icons
Resize-Image $img (Join-Path $iconsDir "icon-192x192.png") 192 192 $null
Resize-Image $img (Join-Path $iconsDir "icon-512x512.png") 512 512 $null
Resize-Image $img (Join-Path $iconsDir "maskable-icon-512x512.png") 512 512 "#151318"
Resize-Image $img (Join-Path $iconsDir "favicon-32x32.png") 32 32 $null
Resize-Image $img (Join-Path $iconsDir "favicon-16x16.png") 16 16 $null

$img.Dispose()
Write-Output "All icons generated successfully"
