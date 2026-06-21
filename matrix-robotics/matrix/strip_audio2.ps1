$ProgressPreference = 'SilentlyContinue'
Write-Host "Downloading ffmpeg portable silently to ffmpeg2.zip..."
Invoke-WebRequest -Uri "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" -OutFile "ffmpeg2.zip"
Write-Host "Extracting..."
Expand-Archive -Path "ffmpeg2.zip" -DestinationPath ".\ffmpeg2_unzipped" -Force
$ffmpegExe = (Get-ChildItem -Path ".\ffmpeg2_unzipped" -Filter "ffmpeg.exe" -Recurse).FullName
Write-Host "ffmpeg.exe located at $ffmpegExe"

$videos = Get-ChildItem -Filter "*.mp4" -Recurse
foreach ($vid in $videos) {
    if ($vid.Name -match "_noaudio.mp4$") { continue }
    $outPath = $vid.FullName -replace '\.mp4$', '_noaudio.mp4'
    & $ffmpegExe -i $vid.FullName -vcodec copy -an $outPath -y 2>&1 | Out-Null
    if (Test-Path $outPath) {
        Remove-Item $vid.FullName -Force
        Rename-Item -Path $outPath -NewName $vid.Name
        Write-Host "Stripped audio for $($vid.Name)"
    }
}
Write-Host "Cleaning up..."
Remove-Item "ffmpeg2.zip" -Force
Remove-Item ".\ffmpeg2_unzipped" -Recurse -Force
Write-Host "Done!"
