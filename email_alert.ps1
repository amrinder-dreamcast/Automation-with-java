# email_alert.ps1
# Handles email and webhook notifications when JLF automation scripts get stuck or fail.

param(
    [switch]$Test
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configFile = Join-Path $scriptDir "email_config.json"

function Get-EmailConfig {
    if (Test-Path $configFile) {
        try {
            $json = Get-Content -Path $configFile -Raw -Encoding utf8 | ConvertFrom-Json
            return $json
        } catch {
            Write-Host "[ALERT-WARN] Failed to parse email_config.json: $_" -ForegroundColor Yellow
        }
    }
    return [PSCustomObject]@{
        enabled      = $true
        recipient    = "amrinder@dreamcast.co"
        senderEmail  = "amrinder@dreamcast.co"
        senderName   = "JLF Automation Monitor"
        smtpServer   = "smtp.gmail.com"
        smtpPort     = 587
        enableSsl    = $true
        smtpUser     = "amrinder@dreamcast.co"
        appPassword  = ""
        webhookUrl   = ""
    }
}

function Send-JlfAlert {
    param(
        [Parameter(Mandatory=$true)]
        [string]$TestName,

        [Parameter(Mandatory=$true)]
        [string]$ClassName,

        [Parameter(Mandatory=$true)]
        [string]$Status,          # e.g. "STUCK / TIMEOUT" or "FAILED (EXCEPTION)"

        [string]$FailureLocation = "",
        [string]$ErrorMessage = "",
        [string]$LastStep = "",
        [string]$Duration = "",
        [string[]]$LogSnippet = @(),
        [string]$ScreenshotPath = ""
    )

    $config = Get-EmailConfig
    if (-not $config.enabled) {
        Write-Host "[ALERT] Alerts are disabled in email_config.json" -ForegroundColor DarkGray
        return $false
    }

    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $machineName = $env:COMPUTERNAME
    $isStuck = $Status -match 'STUCK|TIMEOUT'
    $badgeText = if ($isStuck) { "SCRIPT STUCK / HANGING" } else { "SCRIPT EXECUTION FAILED" }
    $badgeColor = if ($isStuck) { "#dc3545" } else { "#e63946" }

    $subject = "[JLF Alert] ${badgeText}: $TestName ($timestamp)"

    # Build clean HTML email body
    $safeError = [System.Web.HttpUtility]::HtmlEncode($ErrorMessage)
    $safeLoc   = [System.Web.HttpUtility]::HtmlEncode($FailureLocation)
    $safeStep  = [System.Web.HttpUtility]::HtmlEncode($LastStep)
    $safeLogs  = if ($LogSnippet.Count -gt 0) {
        [System.Web.HttpUtility]::HtmlEncode(($LogSnippet -join "`n"))
    } else {
        "No additional log output available."
    }

    $htmlBody = @"
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
  .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e1e4e8; }
  .header { background: linear-gradient(135deg, $badgeColor, #b02a37); color: #ffffff; padding: 24px 30px; text-align: left; }
  .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
  .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
  .badge { display: inline-block; background: rgba(255,255,255,0.25); padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; }
  .content { padding: 30px; }
  .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
  .details-table th, .details-table td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #eee; }
  .details-table th { width: 32%; background-color: #f8f9fa; color: #555; font-weight: 600; }
  .details-table td { color: #222; }
  .highlight-loc { color: #d90429; font-weight: bold; font-family: Consolas, monospace; }
  .highlight-err { color: #b7094c; font-family: Consolas, monospace; word-break: break-all; }
  .section-title { font-size: 14px; font-weight: 700; color: #444; margin: 20px 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px; }
  .log-box { background: #1e1e1e; color: #d4d4d4; padding: 14px; border-radius: 6px; font-family: Consolas, 'Courier New', monospace; font-size: 12px; line-height: 1.5; overflow-x: auto; max-height: 250px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; }
  .footer { background: #f8f9fa; padding: 16px 30px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="badge">$badgeText</div>
    <h1>$TestName</h1>
    <p>Automated alert triggered from host: <strong>$machineName</strong> at $timestamp</p>
  </div>
  <div class="content">
    <table class="details-table">
      <tr>
        <th>Status</th>
        <td><strong style="color: $badgeColor;">$Status</strong></td>
      </tr>
      <tr>
        <th>Test Class</th>
        <td><code>$ClassName</code></td>
      </tr>
      <tr>
        <th>Failure Point</th>
        <td class="highlight-loc">$(if ($safeLoc) { $safeLoc } else { "Unknown / Process Terminated" })</td>
      </tr>
      <tr>
        <th>Error Message</th>
        <td class="highlight-err">$(if ($safeError) { $safeError } else { "No explicit exception string (Process hung or exited unexpectedly)" })</td>
      </tr>
      <tr>
        <th>Last Successful Step</th>
        <td>$(if ($safeStep) { "✅ " + $safeStep } else { "None recorded" })</td>
      </tr>
      <tr>
        <th>Execution Duration</th>
        <td>$Duration</td>
      </tr>
    </table>

    <div class="section-title">Recent Console Output Before Failure:</div>
    <div class="log-box">$safeLogs</div>
  </div>
  <div class="footer">
    JLF Automated Test Monitor &bull; Jaipur Literature Festival Automation Suite
  </div>
</div>
</body>
</html>
"@

    # Always persist alert HTML locally for backup/review
    $alertHtmlPath = Join-Path $scriptDir "last_failure_alert.html"
    try {
        Set-Content -Path $alertHtmlPath -Value $htmlBody -Encoding utf8
        Write-Host "  [ALERT] Failure alert HTML saved to: $alertHtmlPath" -ForegroundColor DarkCyan
    } catch {}

    $emailSent = $false

    # Send via SMTP if appPassword is provided
    if (-not [string]::IsNullOrWhiteSpace($config.appPassword)) {
        try {
            Write-Host "  [ALERT] Sending notification email to $($config.recipient)..." -ForegroundColor Cyan
            $mail = New-Object System.Net.Mail.MailMessage
            $mail.From = New-Object System.Net.Mail.MailAddress($config.senderEmail, $config.senderName)
            $mail.To.Add($config.recipient)
            $mail.Subject = $subject
            $mail.Body = $htmlBody
            $mail.IsBodyHtml = $true
            $mail.Priority = [System.Net.Mail.MailPriority]::High

            # Attach screenshot if available
            if ($ScreenshotPath -and (Test-Path $ScreenshotPath)) {
                try {
                    $attachment = New-Object System.Net.Mail.Attachment($ScreenshotPath)
                    $mail.Attachments.Add($attachment)
                } catch {
                    Write-Host "  [ALERT-WARN] Could not attach screenshot: $_" -ForegroundColor DarkYellow
                }
            }

            $smtp = New-Object System.Net.Mail.SmtpClient($config.smtpServer, [int]$config.smtpPort)
            $smtp.EnableSsl = [bool]$config.enableSsl
            $smtp.Timeout = 20000
            $smtp.Credentials = New-Object System.Net.NetworkCredential($config.smtpUser, $config.appPassword)
            $smtp.Send($mail)
            $mail.Dispose()
            $smtp.Dispose()

            Write-Host "  [ALERT-OK] Alert email successfully sent to $($config.recipient)!" -ForegroundColor Green
            $emailSent = $true
        } catch {
            Write-Host "  [ALERT-FAIL] Could not send email via SMTP: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  [ALERT-NOTE] To receive email alerts at $($config.recipient), enter your Google App Password in email_config.json" -ForegroundColor Yellow
    }

    # Optional Webhook notification (Google Chat / Slack / Teams)
    if (-not [string]::IsNullOrWhiteSpace($config.webhookUrl)) {
        try {
            Write-Host "  [ALERT] Dispatching webhook alert..." -ForegroundColor Cyan
            $payload = @{
                text = "*JLF AUTOMATION ALERT*`n*Status:* $Status`n*Test:* $TestName`n*Location:* $FailureLocation`n*Error:* $ErrorMessage`n*Host:* $machineName`n*Time:* $timestamp"
            } | ConvertTo-Json
            Invoke-RestMethod -Uri $config.webhookUrl -Method Post -Body $payload -ContentType "application/json" -TimeoutSec 10 | Out-Null
            Write-Host "  [ALERT-OK] Webhook alert sent successfully!" -ForegroundColor Green
        } catch {
            Write-Host "  [ALERT-WARN] Webhook delivery failed: $_" -ForegroundColor DarkYellow
        }
    }

    return $emailSent
}

# If called with -Test, send a verification email
if ($Test) {
    Write-Host "`n=== JLF EMAIL ALERT VERIFICATION ===" -ForegroundColor Cyan
    $config = Get-EmailConfig
    Write-Host "Target Recipient : $($config.recipient)" -ForegroundColor White
    Write-Host "SMTP Server      : $($config.smtpServer):$($config.smtpPort)" -ForegroundColor White
    Write-Host "SMTP User        : $($config.smtpUser)" -ForegroundColor White
    Write-Host "App Password Set : $(if ($config.appPassword) { 'YES (Length: ' + $config.appPassword.Length + ')' } else { 'NO (Empty)' })" -ForegroundColor $(if ($config.appPassword) { 'Green' } else { 'Yellow' })

    if ([string]::IsNullOrWhiteSpace($config.appPassword)) {
        Write-Host "`n[ACTION NEEDED] Please edit 'email_config.json' and set 'appPassword' with your 16-character Google App Password." -ForegroundColor Yellow
        Write-Host "Steps to generate a Google App Password for amrinder@dreamcast.co:" -ForegroundColor DarkCyan
        Write-Host " 1. Go to https://myaccount.google.com/security" -ForegroundColor DarkGray
        Write-Host " 2. Under 'How you sign in to Google', ensure 2-Step Verification is ON." -ForegroundColor DarkGray
        Write-Host " 3. Click '2-Step Verification' -> Scroll to bottom -> 'App passwords'." -ForegroundColor DarkGray
        Write-Host " 4. Name it 'JLF Automation' and copy the 16-character password into email_config.json." -ForegroundColor DarkGray
    } else {
        Write-Host "`nSending test email alert..." -ForegroundColor Cyan
        $res = Send-JlfAlert `
            -TestName "Test Automation Run (Verification)" `
            -ClassName "tktplzstaging.jlf.sr" `
            -Status "VERIFICATION TEST" `
            -FailureLocation "sr.java (Line 243)" `
            -ErrorMessage "This is a verification test to confirm email alerting works." `
            -LastStep "Crop modal is visible for Student ID." `
            -Duration "00:15" `
            -LogSnippet @("Line 1: Test step completed", "Line 2: Alert test triggered successfully")

        if ($res) {
            Write-Host "`n[SUCCESS] Check inbox of $($config.recipient) for the alert email!" -ForegroundColor Green
        } else {
            Write-Host "`n[FAILED] Test email failed to send. Check the error message above." -ForegroundColor Red
        }
    }
}
