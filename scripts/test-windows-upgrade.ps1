$ErrorActionPreference = 'Stop'
$builds = @(Get-ChildItem installer-artifacts -Filter INSTALLER_BUILD.json -Recurse | ForEach-Object {
  $meta = Get-Content $_.FullName -Raw | ConvertFrom-Json
  [PSCustomObject]@{ Version = [version]$meta.game_version; Pre = $meta.prerelease; Folder = $_.DirectoryName }
})
$stable = @($builds | Where-Object { !$_.Pre } | Sort-Object Version)
if ($stable.Count -lt 2) { throw 'Two stable installers are required for this upgrade check' }
$old = $stable[0]
$new = $stable[-1]
$oldInstaller = (Get-ChildItem $old.Folder -Filter *.exe | Select-Object -First 1).FullName
$newInstaller = (Get-ChildItem $new.Folder -Filter *.exe | Select-Object -First 1).FullName
# Confirm GitHub's real latest-release endpoint still selects a stable release.
node -e "const cp=require('node:child_process'),u=require('./desktop/updater-core.cjs');const r=JSON.parse(cp.execFileSync('gh',['api','repos/'+process.env.GH_REPO+'/releases/latest'],{encoding:'utf8'}));if(r.prerelease||r.draft||u.compareVersions(r.tag_name,process.argv[1])<0)throw Error('Stable GitHub feed failed');console.log('Verified stable feed: '+r.tag_name)" $old.Version.ToString()
if ($LASTEXITCODE -ne 0) { throw 'GitHub update feed failed verification' }
$installDir = Join-Path $env:RUNNER_TEMP 'spare-room-upgrade'
$p = Start-Process -FilePath $oldInstaller -ArgumentList @('/S', "/D=$installDir") -PassThru -Wait
if ($p.ExitCode -ne 0) { throw 'Old installer failed' }
$exe = Join-Path $installDir 'The Spare Room.exe'
# Use the normal per-user profile so NSIS's automatic relaunch finds the same save.
$env:SPARE_ROOM_SMOKE_PROFILE = Join-Path $env:APPDATA 'The Spare Room'
$env:SPARE_ROOM_SMOKE_INSTALLER = $newInstaller
$env:SPARE_ROOM_SMOKE_TARGET_VERSION = $new.Version.ToString()
$env:SPARE_ROOM_SMOKE_REPORT = Join-Path $env:RUNNER_TEMP 'upgrade-initial.json'
$game = Start-Process -FilePath $exe -ArgumentList '--smoke-upgrade' -PassThru
if (!$game.WaitForExit(180000)) { $game.Kill(); throw 'Old app did not hand off to its installer' }
if ($game.ExitCode -ne 0) { if(Test-Path $env:SPARE_ROOM_SMOKE_REPORT){Get-Content $env:SPARE_ROOM_SMOKE_REPORT}; throw 'Updater handoff failed' }
$stateFile = Join-Path $env:SPARE_ROOM_SMOKE_PROFILE 'updater-state.json'
$deadline = (Get-Date).AddSeconds(180)
$reopened = $false
while ((Get-Date) -lt $deadline) {
  if (Test-Path $stateFile) {
    try {
      $state = Get-Content $stateFile -Raw | ConvertFrom-Json
      if ($state.lastLaunchVersion -eq $new.Version.ToString() -and $state.notesShownVersion -eq $new.Version.ToString()) {
        if ($state.releaseNotes.body -ne 'Upgrade integration test: release notes after automatic restart.') { throw 'Wrong release notes after update' }
        $reopened = $true
        break
      }
    } catch { }
  }
  Start-Sleep -Seconds 1
}
if (!$reopened) { if(Test-Path $stateFile){Get-Content $stateFile};throw 'Updated app did not reopen with its release notes popup' }
Get-Process 'The Spare Room' -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $exe } | Stop-Process -Force
Start-Sleep -Seconds 2
$env:SPARE_ROOM_SMOKE_REPORT = Join-Path $env:RUNNER_TEMP 'upgrade-final.json'
$game = Start-Process -FilePath $exe -ArgumentList @('--smoke-test','--smoke-verify-upgrade') -PassThru
if (!$game.WaitForExit(180000)) { $game.Kill(); throw 'Updated app verification timed out' }
$report = Get-Content $env:SPARE_ROOM_SMOKE_REPORT -Raw | ConvertFrom-Json
$report | ConvertTo-Json
if ($game.ExitCode -ne 0 -or !$report.ok -or !$report.upgradeSaveVerified -or !$report.updatePanel) { throw 'Updated app lost progress or its update controls' }
Write-Output "PASS: $($old.Version) to $($new.Version), verified installer, automatic relaunch, release notes popup and preserved save."
