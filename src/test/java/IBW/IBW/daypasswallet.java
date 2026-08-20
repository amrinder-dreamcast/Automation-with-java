package IBW.IBW;

import java.io.File;
import java.io.FileWriter;
import java.time.Duration;
import java.util.List;
import java.util.Set;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

public class daypasswallet {

	public static void main(String[] args) {
		ChromeOptions options = new ChromeOptions();
		options.addArguments("--disable-popup-blocking");
		
		WebDriver driver = new ChromeDriver(options);
		try {
			driver.manage().window().maximize();
			driver.get("https://staging-ibw26.dreamcast.in/");
			
			WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(25));
			JavascriptExecutor js = (JavascriptExecutor) driver;

			WebElement buyTicketsBtn = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//h3[contains(text(),'Early Bird - Day Pass')]/ancestor::div[contains(@class,'flex-col')]//a[text()='Buy Tickets']")
			));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", buyTicketsBtn);
			Thread.sleep(1000);
			buyTicketsBtn.click();
			
			// Click + button
			WebElement plusBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[text()='+']")));
			plusBtn.click();
			System.out.println("Clicked + button.");
			Thread.sleep(2000);
			
			// Click Continue
			WebElement continueBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[text()='Continue']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", continueBtn);
			Thread.sleep(1000);
			try {
				continueBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", continueBtn);
			}
			System.out.println("Clicked Continue button.");
			
			WebElement fullNameInput = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//label[contains(.,'Full name')]/input")));
			System.out.println("Checkout form loaded successfully.");
			Thread.sleep(4000);
			
			// Generate dynamic name and email to guarantee OTP step triggers cleanly
			long timestamp = System.currentTimeMillis() / 1000;
			String dynamicName = "amrinder101_" + timestamp;
			String dynamicEmail = "amrinder+101_" + timestamp + "@dreamcast.co";
			
			// Fill Full Name
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", fullNameInput);
			fullNameInput.click();
			fullNameInput.sendKeys(Keys.chord(Keys.CONTROL, "a"), Keys.BACK_SPACE);
			fullNameInput.sendKeys(dynamicName + " singh");
			System.out.println("Filled Full Name: " + dynamicName + " singh");
			
			// Fill WhatsApp
			WebElement phoneInput = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//label[contains(.,'WhatsApp Number')]/descendant::input")));
			phoneInput.click();
			phoneInput.sendKeys(Keys.chord(Keys.CONTROL, "a"), Keys.BACK_SPACE);
			phoneInput.sendKeys("6350415261");
			System.out.println("Filled WhatsApp.");
			
			// Fill Email
			WebElement emailInput = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//label[contains(.,'Email')]/input")));
			emailInput.click();
			emailInput.sendKeys(Keys.chord(Keys.CONTROL, "a"), Keys.BACK_SPACE);
			emailInput.sendKeys(dynamicEmail);
			System.out.println("Filled Email: " + dynamicEmail);
			
			// Fill DOB
			WebElement dobInput = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//label[contains(.,'DOB')]/input")));
			dobInput.sendKeys(Keys.chord(Keys.CONTROL, "a"), Keys.BACK_SPACE);
			dobInput.sendKeys("15081995");
			System.out.println("Filled DOB.");
			
			// Fill Bike Make
			WebElement bikeMakeInput = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//label[contains(.,'Bike Make')]/input")));
			bikeMakeInput.click();
			bikeMakeInput.sendKeys(Keys.chord(Keys.CONTROL, "a"), Keys.BACK_SPACE);
			bikeMakeInput.sendKeys("Royal Enfield");
			System.out.println("Filled Bike Make.");
			
			// Select Gender
			WebElement genderSelect = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//label[contains(.,'Gender')]/select")));
			Select selectGender = new Select(genderSelect);
			selectGender.selectByVisibleText("Male");
			System.out.println("Selected Gender.");
			
			Thread.sleep(2000);
			
			// Click Send OTP
			WebElement sendOtpBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[text()='Send OTP to verify this email']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", sendOtpBtn);
			Thread.sleep(1000);
			sendOtpBtn.click();
			System.out.println("Clicked Send OTP button.");
			
			// Wait for OTP fields
			List<WebElement> otpBoxes = wait.until(ExpectedConditions.presenceOfAllElementsLocatedBy(
				By.xpath("//input[contains(@class, 'text-center')]")
			));
			System.out.println("Found " + otpBoxes.size() + " OTP boxes. Entering OTP '000000'...");
			for (int i = 0; i < 6 && i < otpBoxes.size(); i++) {
				otpBoxes.get(i).sendKeys("0");
			}
			
			// Click Verify OTP
			WebElement verifyOtpBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[text()='Verify OTP']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", verifyOtpBtn);
			Thread.sleep(1000);
			verifyOtpBtn.click();
			System.out.println("Clicked Verify OTP button.");
			
			// Wait for verification success
			Thread.sleep(3000);
			
			// Click Next button
			WebElement nextBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[text()='Next']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", nextBtn);
			Thread.sleep(1000);
			nextBtn.click();
			System.out.println("Clicked Next button.");
			Thread.sleep(2000);
			
			// Click Continue in Order Summary
			WebElement summaryContinueBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//aside//button[text()='Continue']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", summaryContinueBtn);
			Thread.sleep(1000);
			try {
				summaryContinueBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", summaryContinueBtn);
			}
			System.out.println("Clicked Continue button in Order Summary.");
			
			// Wait for transition to /race-participate
			wait.until(ExpectedConditions.urlContains("/race-participate"));
			System.out.println("Navigated to race-participate page successfully. URL: " + driver.getCurrentUrl());
			Thread.sleep(2000);
			
			// Click Select button for "Breakfast at the Lake"
			WebElement lakeSelectBtn = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//h3[contains(text(), 'Breakfast at the Lake')]/following::button[contains(., 'Select')][1]")
			));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", lakeSelectBtn);
			Thread.sleep(1000);
			lakeSelectBtn.click();
			System.out.println("Clicked Select button for Breakfast at the Lake.");
			Thread.sleep(2000);
			
			// Click option containing "amrinder101"
			WebElement attendeeOption = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//*[contains(text(), 'amrinder101') and not(self::script) and not(self::style)]")
			));
			attendeeOption.click();
			System.out.println("Selected attendee name option.");
			Thread.sleep(1000);
			
			// Click Add button next to it
			WebElement addBtn = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//h3[contains(text(), 'Breakfast at the Lake')]/following::button[text()='Add'][1]")
			));
			addBtn.click();
			System.out.println("Clicked Add button.");
			Thread.sleep(2000);
			
			// Click Save & Next
			WebElement saveNextBtn = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//button[text()='Save & Next']")
			));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", saveNextBtn);
			Thread.sleep(1000);
			saveNextBtn.click();
			System.out.println("Clicked Save & Next button.");
			Thread.sleep(4000);
			
			// Wait for Wallet Top-up page to load
			WebElement walletLabel = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//label[contains(., 'amrinder101')]")
			));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", walletLabel);
			Thread.sleep(1000);
			walletLabel.click();
			System.out.println("Clicked attendee label on Wallet page.");
			Thread.sleep(3000);
			
			// Click 3,000 wallet top-up button
			WebElement wallet3000Btn = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//button[contains(., '3,000')]")
			));
			wallet3000Btn.click();
			System.out.println("Clicked 3,000 wallet top-up button.");
			Thread.sleep(2000);
			
			// Click Save & Next on Wallet page
			WebElement saveWalletBtn = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//button[text()='Save & Next']")
			));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", saveWalletBtn);
			Thread.sleep(1000);
			saveWalletBtn.click();
			System.out.println("Clicked Save & Next button on Wallet page.");
			Thread.sleep(4000);
			
			// Wait for Review Order page elements to load
			WebElement payNowBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//button[contains(., 'Pay Now')]")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", payNowBtn);
			
			// Capture the handle of original tab
			String originalTab = driver.getWindowHandle();
			
			Thread.sleep(1000);
			payNowBtn.click();
			System.out.println("Clicked Pay Now button.");
			
			// Wait for the new tab to open
			Thread.sleep(8000);
			
			Set<String> allTabs = driver.getWindowHandles();
			System.out.println("Number of open tabs: " + allTabs.size());
			
			String paymentTab = null;
			for (String tab : allTabs) {
				if (!tab.equals(originalTab)) {
					paymentTab = tab;
					driver.switchTo().window(tab);
					System.out.println("Switched to the payment tab.");
					break;
				}
			}
			
			if (paymentTab == null) {
				throw new Exception("Payment tab did not open successfully.");
			}
			
			// Wait for the payment portal page to load in the new tab
			Thread.sleep(8000);
			System.out.println("Payment Tab Title: " + driver.getTitle());
			System.out.println("Payment Tab URL: " + driver.getCurrentUrl());
			
			// Click Make Payment
			WebElement makePaymentBtn = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//button[contains(., 'Make Payment')]")
			));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", makePaymentBtn);
			Thread.sleep(1000);
			makePaymentBtn.click();
			System.out.println("Clicked Make Payment button.");
			
			// Wait for payment portal (Razorpay frame) to appear
			Thread.sleep(10000);
			
			// Switch to Razorpay iframe
			List<WebElement> iframes = driver.findElements(By.tagName("iframe"));
			boolean frameFound = false;
			for (WebElement iframe : iframes) {
				String className = iframe.getAttribute("class");
				if (className != null && className.contains("razorpay-checkout-frame")) {
					driver.switchTo().frame(iframe);
					System.out.println("Switched to Razorpay checkout frame.");
					frameFound = true;
					break;
				}
			}
			
			if (!frameFound) {
				throw new Exception("Razorpay checkout iframe not found.");
			}
			
			Thread.sleep(4000);
			
			// Click Netbanking
			WebElement netbankingBtn = wait.until(ExpectedConditions.elementToBeClickable(By.xpath("//span[text()='Netbanking']")));
			netbankingBtn.click();
			System.out.println("Clicked Netbanking option.");
			Thread.sleep(3000);
			
			// Select State Bank of India (which automatically starts processing/redirecting)
			WebElement sbiBtn = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//span[contains(text(), 'State Bank of India') or contains(text(), 'SBI')]")
			));
			sbiBtn.click();
			System.out.println("Selected State Bank of India.");
			
			// Wait to see if a 3rd tab (mock bank tab) opens
			Thread.sleep(10000);
			
			Set<String> allTabsAfterBank = driver.getWindowHandles();
			System.out.println("Number of open tabs after bank selection: " + allTabsAfterBank.size());
			
			String bankTab = null;
			for (String tab : allTabsAfterBank) {
				if (!tab.equals(originalTab) && !tab.equals(paymentTab)) {
					bankTab = tab;
					driver.switchTo().window(tab);
					System.out.println("Switched to the bank tab.");
					break;
				}
			}
			
			if (bankTab != null) {
				// Wait for mock bank page to load
				Thread.sleep(8000);
				System.out.println("Bank Tab URL: " + driver.getCurrentUrl());
				
				// Click Success button on the mock bank page
				WebElement successBtn = wait.until(ExpectedConditions.elementToBeClickable(
					By.xpath("//button[contains(., 'Success') or text()='Success' or @value='Success']")
				));
				successBtn.click();
				System.out.println("Clicked Success button on mock bank page.");
			} else {
				System.out.println("Mock bank tab was not found. Checking if redirect happened in the payment tab instead...");
				driver.switchTo().defaultContent();
				WebElement successBtn = wait.until(ExpectedConditions.elementToBeClickable(
					By.xpath("//button[contains(., 'Success') or text()='Success' or @value='Success']")
				));
				successBtn.click();
				System.out.println("Clicked Success button on current payment tab.");
			}
			
			// Wait for payment tab to close and transition to complete
			Thread.sleep(15000);
			
			// Switch back to original main tab
			driver.switchTo().window(originalTab);
			System.out.println("Switched back to original tab. URL: " + driver.getCurrentUrl());
			
			// Wait for registration success page to load
			Thread.sleep(12000);
			System.out.println("Final page URL: " + driver.getCurrentUrl());
			
			// Save final screenshot of success
			try {
				File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
				java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("ibw_wallet_success.png"),
						java.nio.file.StandardCopyOption.REPLACE_EXISTING);
				System.out.println("Success screenshot saved to ibw_wallet_success.png");
			} catch (Exception e) {
				System.out.println("Failed to save screenshot: " + e.getMessage());
			}
			
			// Save final page source of success
			try (FileWriter writer = new FileWriter("ibw_wallet_success.html")) {
				writer.write(driver.getPageSource());
				System.out.println("Success page source saved to ibw_wallet_success.html");
			} catch (Exception e) {
				System.out.println("Failed to save page source: " + e.getMessage());
			}

		} catch (Exception e) {
			System.out.println("Exception occurred during execution: " + e.getMessage());
			e.printStackTrace();
			// Take error screenshot
			try {
				File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
				java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("ibw_wallet_error.png"),
						java.nio.file.StandardCopyOption.REPLACE_EXISTING);
				System.out.println("Error screenshot saved to ibw_wallet_error.png");
			} catch (Exception se) {
				System.out.println("Failed to save error screenshot: " + se.getMessage());
			}
			// Save error page source
			try (FileWriter writer = new FileWriter("ibw_wallet_error.html")) {
				writer.write(driver.getPageSource());
				System.out.println("Error page source saved to ibw_wallet_error.html");
			} catch (Exception pe) {
				System.out.println("Failed to save error page source: " + pe.getMessage());
			}
		} finally {
			driver.quit();
		}
	}

}
