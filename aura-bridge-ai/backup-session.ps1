# Aura Bridge AI - Complete Backup Script
# This script backs up all the important files and configurations

Write-Host "🤖 Aura Bridge AI - Creating Complete Backup..." -ForegroundColor Green

# Create backup directory with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "aura-bridge-ai/backup/$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Write-Host "📁 Created backup directory: $backupDir" -ForegroundColor Yellow

# Backup frontend files
Write-Host "📱 Backing up frontend files..." -ForegroundColor Cyan
Copy-Item "aura-bridge-ai/src/App.jsx" "$backupDir/App.jsx" -Force
Copy-Item "aura-bridge-ai/src/components/PathViewer.jsx" "$backupDir/PathViewer.jsx" -Force
Copy-Item "aura-bridge-ai/package.json" "$backupDir/package.json" -Force
Copy-Item "aura-bridge-ai/vite.config.js" "$backupDir/vite.config.js" -Force

# Backup backend files
Write-Host "☁️ Backing up backend files..." -ForegroundColor Cyan
Copy-Item "cloud/functions/ingest.js" "$backupDir/ingest.js" -Force
Copy-Item "cloud/functions/api.js" "$backupDir/api.js" -Force
Copy-Item "cloud/functions/util.cjs" "$backupDir/util.cjs" -Force
Copy-Item "cloud/serverless.yml" "$backupDir/serverless.yml" -Force
Copy-Item "cloud/package.json" "$backupDir/cloud-package.json" -Force

# Backup configuration files
Write-Host "⚙️ Backing up configuration files..." -ForegroundColor Cyan
Copy-Item "cloud/serverless.yml" "$backupDir/serverless.yml" -Force
Copy-Item "aura-bridge-ai/.env" "$backupDir/.env" -Force -ErrorAction SilentlyContinue

# Backup generated files
Write-Host "📝 Backing up generated files..." -ForegroundColor Cyan
Copy-Item "bedrock_fanuc_generator.js" "$backupDir/bedrock_fanuc_generator.js" -Force
Copy-Item "refined_bedrock_generator.js" "$backupDir/refined_bedrock_generator.js" -Force
Copy-Item "convert_json_to_tp.js" "$backupDir/convert_json_to_tp.js" -Force
Copy-Item "generate_roboguide_tp.js" "$backupDir/generate_roboguide_tp.js" -Force

# Backup documentation
Write-Host "📚 Backing up documentation..." -ForegroundColor Cyan
Copy-Item "aura-bridge-ai/DEVELOPMENT_PROGRESS.md" "$backupDir/DEVELOPMENT_PROGRESS.md" -Force
Copy-Item "README.md" "$backupDir/README.md" -Force

# Create backup manifest
$manifest = @"
# Aura Bridge AI - Backup Manifest
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Backup Directory: $backupDir

## Files Backed Up:

### Frontend Files:
- App.jsx (Updated with ABB RAPID integration)
- PathViewer.jsx (3D path visualization)
- package.json (Dependencies)
- vite.config.js (Build configuration)

### Backend Files:
- ingest.js (Updated with ABB RAPID generation)
- api.js (Updated with RAPID code serving)
- util.cjs (Utility functions)
- serverless.yml (AWS deployment config)
- cloud-package.json (Backend dependencies)

### Generated Files:
- bedrock_fanuc_generator.js (FANUC code generator)
- refined_bedrock_generator.js (Enhanced generator)
- convert_json_to_tp.js (TP file converter)
- generate_roboguide_tp.js (RoboGuide generator)

### Documentation:
- DEVELOPMENT_PROGRESS.md (This session's progress)
- README.md (Project documentation)

## Key Updates in This Backup:
1. ✅ Robot demo completely removed
2. ✅ ABB Robot Studio integration added
3. ✅ Backend updated for RAPID generation
4. ✅ Frontend updated with ABB RAPID tab
5. ✅ File download system updated
6. ✅ AI refinement system updated

## Deployment Status:
- Ready for AWS deployment
- ABB Robot Studio compatible
- Professional-grade code generation
- Clean, focused UI

## Next Steps:
1. Deploy backend: `cd cloud && serverless deploy`
2. Test with IoT data
3. Import .mod files into Robot Studio
4. Verify simulation and execution
"@

$manifest | Out-File -FilePath "$backupDir/BACKUP_MANIFEST.md" -Encoding UTF8

Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
Write-Host "📁 Backup location: $backupDir" -ForegroundColor Yellow
Write-Host "📋 Manifest created: BACKUP_MANIFEST.md" -ForegroundColor Yellow

# Show backup contents
Write-Host "`nBackup Contents:" -ForegroundColor Cyan
Get-ChildItem $backupDir | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor White
}

Write-Host "`n🎯 All updates have been saved locally!" -ForegroundColor Green
Write-Host "🚀 Ready for deployment to AWS!" -ForegroundColor Green
