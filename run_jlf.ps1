# run_jlf.ps1
# Automates the execution of the JLF automation scripts with real-time step display and failure tracking.

$ErrorActionPreference = "Continue"

# Log file configuration
$logFile = "C:\Users\Amrinder Singh\Desktop\EclipseFolder\jlf\automation_run.log"

function Write-Log {
    param(
        [string]$Message,
        [string]$Color = "White",
        [bool]$NoNewline = $false
    )
    if ($NoNewline) {
        Write-Host $Message -ForegroundColor $Color -NoNewline
    } else {
        Write-Host $Message -ForegroundColor $Color
    }
    # Append to log file
    try {
        Add-Content -Path $logFile -Value $Message -Encoding utf8
    } catch {}
}

function Write-Header {
    param([string]$Title)
    $line = "=" * 85
    Write-Log ""
    Write-Log $line "Cyan"
    Write-Log "  $Title" "Cyan"
    Write-Log $line "Cyan"
}

Write-Header "JLF AUTOMATION SUITE - EXECUTION START"
Write-Log "Execution started at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Yellow"
Write-Log "Log file location   : $logFile" "DarkGray"

# Configure Environment
$mavenDir = "C:\Users\Amrinder Singh\maven"
$mavenHome = "$mavenDir\apache-maven-3.9.16"
$mavenZip = "$env:TEMP\apache-maven-3.9.16-bin.zip"
$mavenUrl = "https://dlcdn.apache.org/maven/maven-3/3.9.16/binaries/apache-maven-3.9.16-bin.zip"

# Ensure Maven is downloaded and installed
if (-not (Test-Path "$mavenHome\bin\mvn.cmd")) {
    Write-Log "[SETUP] Maven not found. Downloading Apache Maven 3.9.16..." "Yellow"
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $mavenUrl -OutFile $mavenZip -TimeoutSec 60
        Write-Log "[SETUP] Extracting Maven zip..." "DarkGray"
        if (-not (Test-Path $mavenDir)) {
            New-Item -ItemType Directory -Path $mavenDir -Force | Out-Null
        }
        Expand-Archive -Path $mavenZip -DestinationPath $mavenDir -Force
        Write-Log "[SETUP] Maven installed successfully to $mavenHome." "Green"
        Remove-Item -Path $mavenZip -Force
    } catch {
        Write-Log "[ERROR] Failed to download or install Maven: $_" "Red"
        exit 1
    }
}

# Set Environment Variables for Java and Maven
$env:JAVA_HOME = "C:\Program Files\Java\jdk-25"
$env:PATH = "$mavenHome\bin;" + $env:PATH

# Navigate to jlf project directory
$projectDir = "C:\Users\Amrinder Singh\Desktop\EclipseFolder\jlf"
Set-Location -Path $projectDir

# Clean up any leftover orphaned chromedriver processes before running
$orphans = Get-Process chromedriver -ErrorAction SilentlyContinue
if ($orphans) {
    Write-Log "[CLEANUP] Terminating $($orphans.Count) orphaned chromedriver process(es)..." "DarkYellow"
    $orphans | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Step 1: Ensure we have the latest updated code from origin/jlf
Write-Header "STEP 1: UPDATING REPOSITORY (GIT PULL)"
try {
    $currentBranch = (& git rev-parse --abbrev-ref HEAD 2>$null).Trim()
    Write-Log "Current branch: $currentBranch" "DarkCyan"
    if ($currentBranch -eq "jlf") {
        Write-Log "Pulling latest code from git origin/jlf..." "Cyan"
        $pullOutput = & git pull origin jlf 2>&1
        foreach ($pLine in $pullOutput) {
            Write-Log "  $pLine" "DarkGray"
        }
    } else {
        Write-Log "[WARN] Current branch is '$currentBranch' (expected 'jlf'). Skipping auto git-pull to avoid conflict." "Yellow"
    }
} catch {
    Write-Log "[WARN] Git pull failed: $_" "Yellow"
}

# Step 2: Compile test classes
Write-Header "STEP 2: COMPILING TEST CODE"
Write-Log "Running: mvn test-compile..." "Cyan"
$compileFailed = $false
$compileOutput = & cmd.exe /c "mvn test-compile" 2>&1
foreach ($cLine in $compileOutput) {
    $strLine = $cLine.ToString()
    if ($strLine -match '\[ERROR\]') {
        Write-Log "  $strLine" "Red"
        $compileFailed = $true
    } elseif ($strLine -match 'BUILD SUCCESS') {
        Write-Log "  $strLine" "Green"
    } else {
        Write-Log "  $strLine" "DarkGray"
    }
}

if ($compileFailed) {
    Write-Log "[FATAL] Compilation failed! Check error details above. Aborting test execution." "Red"
    exit 1
}

# Results Tracker
$global:TestResults = [System.Collections.Generic.List[PSCustomObject]]::new()

# Function to execute each JLF test class in isolation with real-time display and failure detection
function Invoke-JlfClass {
    param(
        [string]$ClassName,
        [string]$DisplayName
    )

    Write-Log ""
    $divLine = "-" * 85
    Write-Log $divLine "DarkCyan"
    Write-Log ">> RUNNING: $DisplayName" "Cyan"
    Write-Log "   Class  : $ClassName" "DarkGray"
    Write-Log "   Time   : $(Get-Date -Format 'HH:mm:ss')" "DarkGray"
    Write-Log $divLine "DarkCyan"

    $startTime = Get-Date
    $hasFailure = $false
    $failureLocation = ""
    $failureMessage = ""

    try {
        & cmd.exe /c "mvn exec:java -Dexec.classpathScope=test -Dexec.mainClass=$ClassName" 2>&1 | ForEach-Object {
            $line = $_.ToString().TrimEnd()
            if ([string]::IsNullOrWhiteSpace($line)) { return }

            # Record to log file
            try { Add-Content -Path $logFile -Value $line -Encoding utf8 } catch {}

            # Detect failure signals
            if ($line -match 'BUILD FAILURE' -or $line -match 'Exception in thread' -or $line -match '\[ERROR\]') {
                $hasFailure = $true
            }

            # Extract exception type and message
            if ($line -match '(?:Exception in thread "[^"]+"\s+)?([a-zA-Z0-9_\.]*(?:Exception|Error)):\s*(.*)') {
                $hasFailure = $true
                $exType = $Matches[1]
                $exMsg = $Matches[2].Trim()
                if ([string]::IsNullOrEmpty($failureMessage)) {
                    $failureMessage = "${exType}: $exMsg"
                }
                Write-Host "  [EXCEPTION] $line" -ForegroundColor Red
                return
            }

            # Extract stack trace line in our code (e.g. at tktplzstaging.jlf.sr.main(sr.java:243))
            if ($line -match 'at\s+(tktplzstaging\.jlf\.\w+(?:\.\w+)?\(([\w\.\-]+):(\d+)\))') {
                $hasFailure = $true
                $failureLocation = "$($Matches[2]) (Line $($Matches[3]))"
                Write-Host "  [FAIL POINT] --> $line" -ForegroundColor Red
                return
            }

            # Highlight test execution progress steps
            if ($line -match '(selected|clicked|uploaded|filled successfully|Page loaded|preview is displayed|Crop modal|screenshot saved|Switched to|Total :|Cart|navigated to)') {
                Write-Host "  [STEP] $line" -ForegroundColor Green
                return
            }

            # Warnings and fallback notices
            if ($line -match '(WARNING|intercepted|fallback|failed, trying|TimeoutException)') {
                Write-Host "  [WARN] $line" -ForegroundColor Yellow
                return
            }

            # Maven errors
            if ($line -match '\[ERROR\]') {
                Write-Host "  $line" -ForegroundColor Red
                return
            }

            # General Maven informational noise (muted)
            if ($line -match '^\[INFO\]') {
                Write-Host "  $line" -ForegroundColor DarkGray
                return
            }

            # Default output
            Write-Host "  $line" -ForegroundColor Gray
        }

        $exitCode = $LASTEXITCODE
        if ($exitCode -ne 0) {
            $hasFailure = $true
        }
    } catch {
        $hasFailure = $true
        $failureMessage = $_.Exception.Message
        Write-Log "[ERROR] Execution exception: $_" "Red"
    }

    $elapsed = (Get-Date) - $startTime
    $elapsedFormatted = "{0:mm\:ss}" -f $elapsed

    # If failure was detected, print prominent failure alert
    if ($hasFailure) {
        Write-Log ""
        Write-Log "*************************************************************************************" "Red"
        Write-Log " [FAILED] $DisplayName FAILED! (Duration: $elapsedFormatted)" "Red"
        if (-not [string]::IsNullOrEmpty($failureLocation)) {
            Write-Log "   Failure Location : $failureLocation" "Yellow"
        } else {
            Write-Log "   Failure Location : Check log for details (Exit Code $exitCode)" "DarkYellow"
        }
        if (-not [string]::IsNullOrEmpty($failureMessage)) {
            Write-Log "   Error Details    : $failureMessage" "Red"
        }
        Write-Log "*************************************************************************************" "Red"

        $summaryLoc = if ($failureLocation) { $failureLocation } else { "Exit Code $exitCode" }
        $global:TestResults.Add([PSCustomObject]@{
            Name     = $DisplayName
            Class    = $ClassName
            Status   = "FAILED"
            Duration = $elapsedFormatted
            Location = $summaryLoc
            Details  = $failureMessage
        })
    } else {
        Write-Log " [PASSED] $DisplayName finished successfully in $elapsedFormatted." "Green"
        $global:TestResults.Add([PSCustomObject]@{
            Name     = $DisplayName
            Class    = $ClassName
            Status   = "PASSED"
            Duration = $elapsedFormatted
            Location = "-"
            Details  = "-"
        })
    }

    # Clean up any orphaned chromedriver between test runs
    Get-Process chromedriver -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Run all JLF automation test classes
Invoke-JlfClass -ClassName "tktplzstaging.jlf.FofReg" -DisplayName "FofReg"
Invoke-JlfClass -ClassName "tktplzstaging.jlf.fofRegwithhotel" -DisplayName "fofRegwithhotel (Friend of the Festival with Hotel)"
Invoke-JlfClass -ClassName "tktplzstaging.jlf.gr" -DisplayName "gr (General Registration)"
Invoke-JlfClass -ClassName "tktplzstaging.jlf.grwithhotel" -DisplayName "grwithhotel (General Registration with Hotel)"
Invoke-JlfClass -ClassName "tktplzstaging.jlf.bookfestivehotel" -DisplayName "bookfestivehotel (Book Festival Hotel Only)"
Invoke-JlfClass -ClassName "tktplzstaging.jlf.bookfestivehotelwithfof" -DisplayName "bookfestivehotelwithfof (Book Festival Hotel with FOF Ticket)"
Invoke-JlfClass -ClassName "tktplzstaging.jlf.sr" -DisplayName "sr (Student Registration)"

# Final Summary Report
Write-Header "JLF AUTOMATION EXECUTION SUMMARY"
Write-Log "Completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Yellow"

$totalTests = $global:TestResults.Count
$passedCount = ($global:TestResults | Where-Object { $_.Status -eq "PASSED" }).Count
$failedCount = ($global:TestResults | Where-Object { $_.Status -eq "FAILED" }).Count

Write-Log "Total Tests : $totalTests | Passed: $passedCount | Failed: $failedCount" $(if ($failedCount -eq 0) { "Green" } else { "Yellow" })
Write-Log ""

# Print formatted summary table
$formatHeader = "{0,-50} {1,-10} {2,-10} {3}"
Write-Log ($formatHeader -f "TEST NAME", "STATUS", "DURATION", "FAILURE LOCATION") "DarkCyan"
Write-Log ("-" * 85) "DarkCyan"

foreach ($res in $global:TestResults) {
    $statusColor = if ($res.Status -eq "PASSED") { "Green" } else { "Red" }
    $rowText = $formatHeader -f $res.Name, $res.Status, $res.Duration, $res.Location
    Write-Log $rowText $statusColor
}

Write-Log ("=" * 85) "Cyan"

if ($failedCount -gt 0) {
    Write-Log ""
    Write-Log "FAILED SCRIPTS BREAKDOWN:" "Red"
    foreach ($res in ($global:TestResults | Where-Object { $_.Status -eq "FAILED" })) {
        Write-Log "  * $($res.Name)" "Red"
        Write-Log "    Class    : $($res.Class)" "DarkYellow"
        Write-Log "    Failed At: $($res.Location)" "Yellow"
        if ($res.Details) {
            Write-Log "    Reason   : $($res.Details)" "DarkRed"
        }
    }
    Write-Log ""
} else {
    Write-Log ""
    Write-Log "ALL 7 TESTS COMPLETED AND PASSED SUCCESSFULLY!" "Green"
    Write-Log ""
}

Write-Log "Full run output logged to: $logFile" "DarkGray"
Write-Log "Execution finished at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "Yellow"
Write-Log "=====================================================================================" "Cyan"
