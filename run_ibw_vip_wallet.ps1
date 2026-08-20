# run_ibw_vip_wallet.ps1
# Sets environment variables and runs the vippasswallet class.

$env:JAVA_HOME = "C:\Program Files\Java\jdk-25"
$env:PATH = "C:\Users\Amrinder Singh\maven\apache-maven-3.9.16\bin;" + $env:PATH

cd "C:\Users\Amrinder Singh\Desktop\EclipseFolder\IBW"

# Run the vippasswallet class
mvn test-compile exec:java "-Dexec.classpathScope=test" "-Dexec.mainClass=IBW.IBW.vippasswallet"
