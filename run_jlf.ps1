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
cd "C:\Users\Amrinder Singh\Desktop\EclipseFolder\jlf"

# Compile and Run the Selenium Project
Add-Content -Path $logFile -Value "Compiling project..."
& mvn test-compile 2>&1 | Tee-Object -FilePath $logFile -Append

# Run FofReg class
Add-Content -Path $logFile -Value "Running FofReg..."
& mvn exec:java "-Dexec.classpathScope=test" "-Dexec.mainClass=tktplzstaging.jlf.FofReg" 2>&1 | Tee-Object -FilePath $logFile -Append

# Run fofRegwithhotel class
Add-Content -Path $logFile -Value "Running fofRegwithhotel (Friend of the Festival with Hotel)..."
& mvn exec:java "-Dexec.classpathScope=test" "-Dexec.mainClass=tktplzstaging.jlf.fofRegwithhotel" 2>&1 | Tee-Object -FilePath $logFile -Append

# Run gr class
Add-Content -Path $logFile -Value "Running gr (General Registration)..."
& mvn exec:java "-Dexec.classpathScope=test" "-Dexec.mainClass=tktplzstaging.jlf.gr" 2>&1 | Tee-Object -FilePath $logFile -Append

# Run grwithhotel class
Add-Content -Path $logFile -Value "Running grwithhotel (General Registration with Hotel)..."
& mvn exec:java "-Dexec.classpathScope=test" "-Dexec.mainClass=tktplzstaging.jlf.grwithhotel" 2>&1 | Tee-Object -FilePath $logFile -Append

# Run bookfestivehotel class
Add-Content -Path $logFile -Value "Running bookfestivehotel (Book Festival Hotel Only)..."
& mvn exec:java "-Dexec.classpathScope=test" "-Dexec.mainClass=tktplzstaging.jlf.bookfestivehotel" 2>&1 | Tee-Object -FilePath $logFile -Append

# Run bookfestivehotelwithfof class
Add-Content -Path $logFile -Value "Running bookfestivehotelwithfof (Book Festival Hotel with FOF Ticket)..."
& mvn exec:java "-Dexec.classpathScope=test" "-Dexec.mainClass=tktplzstaging.jlf.bookfestivehotelwithfof" 2>&1 | Tee-Object -FilePath $logFile -Append

# Run sr class
Add-Content -Path $logFile -Value "Running sr (Student Registration)..."
& mvn exec:java "-Dexec.classpathScope=test" "-Dexec.mainClass=tktplzstaging.jlf.sr" 2>&1 | Tee-Object -FilePath $logFile -Append

Add-Content -Path $logFile -Value "Execution finished at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Content -Path $logFile -Value "=========================================="
