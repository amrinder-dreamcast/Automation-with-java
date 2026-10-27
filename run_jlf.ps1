# run_jlf.ps1
# Automates the execution of the JLF (FofReg, gr, sr) automation scripts.

$logFile = "C:\Users\Amrinder Singh\Desktop\EclipseFolder\jlf\automation_run.log"
Add-Content -Path $logFile -Value "=========================================="
Add-Content -Path $logFile -Value "Execution started at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Configure Environment
$mavenDir = "C:\Users\Amrinder Singh\maven"
$mavenHome = "$mavenDir\apache-maven-3.9.16"
$mavenZip = "$env:TEMP\apache-maven-3.9.16-bin.zip"
$mavenUrl = "https://dlcdn.apache.org/maven/maven-3/3.9.16/binaries/apache-maven-3.9.16-bin.zip"

# Ensure Maven is downloaded and installed
if (-not (Test-Path "$mavenHome\bin\mvn.cmd")) {
    Add-Content -Path $logFile -Value "Maven not found. Downloading Apache Maven 3.9.16..."
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $mavenUrl -OutFile $mavenZip -TimeoutSec 60
        Add-Content -Path $logFile -Value "Extracting Maven zip..."
        if (-not (Test-Path $mavenDir)) {
            New-Item -ItemType Directory -Path $mavenDir -Force | Out-Null
        }
        Expand-Archive -Path $mavenZip -DestinationPath $mavenDir -Force
        Add-Content -Path $logFile -Value "Maven installed successfully to $mavenHome."
        Remove-Item -Path $mavenZip -Force
    } catch {
        Add-Content -Path $logFile -Value "ERROR: Failed to download or install Maven: $_"
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
Get-Process chromedriver -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Ensure we have the latest updated code from origin/jlf
Add-Content -Path $logFile -Value "Updating repository with latest code from git origin/jlf..."
try {
    $currentBranch = (& git rev-parse --abbrev-ref HEAD 2>$null).Trim()
    if ($currentBranch -eq "jlf") {
        $gitPullOut = & git pull origin jlf 2>&1 | Out-String
        Add-Content -Path $logFile -Value $gitPullOut
    } else {
        Add-Content -Path $logFile -Value "Current branch is '$currentBranch' (expected 'jlf'). Skipping auto git-pull to avoid conflict."
    }
} catch {
    Add-Content -Path $logFile -Value "Warning: Git pull failed: $_"
}

# Compile and update the project classes with the latest code
Add-Content -Path $logFile -Value "Compiling project with updated code..."
$compileOutput = & cmd.exe /c "mvn test-compile" 2>&1 | Out-String
Add-Content -Path $logFile -Value $compileOutput

# Function to execute each JLF test class in isolation so failure of one does not prevent others from running
function Invoke-JlfClass {
    param(
        [string]$ClassName,
        [string]$DisplayName
    )
    Add-Content -Path $logFile -Value "`n------------------------------------------"
    Add-Content -Path $logFile -Value "Running $DisplayName ($ClassName)... [$(Get-Date -Format 'HH:mm:ss')]"
    try {
        $runOutput = & cmd.exe /c "mvn exec:java -Dexec.classpathScope=test -Dexec.mainClass=$ClassName" 2>&1 | Out-String
        Add-Content -Path $logFile -Value $runOutput
        Add-Content -Path $logFile -Value "Finished $DisplayName at $(Get-Date -Format 'HH:mm:ss') (Exit Code: $LASTEXITCODE)."
    } catch {
        Add-Content -Path $logFile -Value "ERROR during $DisplayName : $_"
    }
    # Clean up any orphaned chromedriver between test classes
    Get-Process chromedriver -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Only run JLF .java test classes
Invoke-JlfClass -ClassName "tktplzstaging.jlf.FofReg" -DisplayName "FofReg"
Invoke-JlfClass -ClassName "tktplzstaging.jlf.fofRegwithhotel" -DisplayName "fofRegwithhotel (Friend of the Festival with Hotel)"
Invoke-JlfClass -ClassName "tktplzstaging.jlf.gr" -DisplayName "gr (General Registration)"
Invoke-JlfClass -ClassName "tktplzstaging.jlf.grwithhotel" -DisplayName "grwithhotel (General Registration with Hotel)"
Invoke-JlfClass -ClassName "tktplzstaging.jlf.bookfestivehotel" -DisplayName "bookfestivehotel (Book Festival Hotel Only)"
Invoke-JlfClass -ClassName "tktplzstaging.jlf.bookfestivehotelwithfof" -DisplayName "bookfestivehotelwithfof (Book Festival Hotel with FOF Ticket)"
Invoke-JlfClass -ClassName "tktplzstaging.jlf.sr" -DisplayName "sr (Student Registration)"

Add-Content -Path $logFile -Value "Execution finished at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Content -Path $logFile -Value "=========================================="
