# Script para gerar todos os ícones PWA a partir do novo logo
# Usa caminhos curtos (8.3) para evitar problemas com caracteres especiais
Add-Type -AssemblyName System.Drawing

$srcPath  = "c:\Users\poiuj\Desktop\RPIDOE~1\public\images\logo.png"
$iconsDir = "c:\Users\poiuj\Desktop\RPIDOE~1\public\icons"
$publicDir = "c:\Users\poiuj\Desktop\RPIDOE~1\public"

$source = [System.Drawing.Image]::FromFile($srcPath)
Write-Host "✅ Logo carregado: $($source.Width) x $($source.Height) px"

function Resize-Image {
    param (
        [System.Drawing.Image]$img,
        [int]$size,
        [string]$outPath
    )
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($img, 0, 0, $size, $size)
    $g.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "   ✅ $([System.IO.Path]::GetFileName($outPath)) ($size x $size)"
}

Write-Host ""
Write-Host "A gerar ícones PWA..."

Resize-Image $source 192 "$iconsDir\icon-192x192.png"
Resize-Image $source 512 "$iconsDir\icon-512x512.png"
Resize-Image $source 192 "$iconsDir\icon-maskable-192x192.png"
Resize-Image $source 512 "$iconsDir\icon-maskable-512x512.png"
Resize-Image $source 180 "$iconsDir\apple-touch-icon.png"
Resize-Image $source 32  "$publicDir\favicon.png"
Resize-Image $source 32  "$iconsDir\favicon.png"
Resize-Image $source 512 "$publicDir\images\logo.png"

$source.Dispose()

Write-Host ""
Write-Host "🎉 Todos os ícones gerados com sucesso!"
