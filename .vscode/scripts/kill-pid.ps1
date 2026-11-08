Write-Output ""
Write-Output "DANGER: this has been tested, and it's 101% NOT FIT for restarting the debugger."
Write-Output "recommended to switch back to `"npm: build:ts`" for this one, chief."
Write-Output "(otherwise restart manually by stopping the debugger and starting it again.)"
Write-Output ""


$pidFile = ".pid"

if (Test-Path $pidFile) {
  $appPid = Get-Content $pidFile
  try {
    Stop-Process -Id $appPid -Force
    Remove-Item $pidFile
    Write-Output "killed process with PID $appPid"
  } catch {
    Write-Output "failed to kill PID $appPid (might not exist)"
  }
} else {
  Write-Host "no $pidFile file"
}