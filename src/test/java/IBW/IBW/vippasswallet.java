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

public class vippasswallet {

	public static void main(String[] args) {
		ChromeOptions options = new ChromeOptions();
		options.addArguments("--disable-popup-blocking");
		
		WebDriver driver = new ChromeDriver(options);
		try {
			driver.manage().window().maximize();
			driver.get("https://staging-ibw26.dreamcast.in/");
			
			WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(25));
			JavascriptExecutor js = (JavascriptExecutor) driver;

			// Click Buy Tickets for Early Bird - VIP Pass
			WebElement buyTicketsBtn = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//h3[contains(text(),'Early Bird - VIP Pass')]/ancestor::div[contains(@class,'flex-col')]//a[text()='Buy Tickets']")
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
			
			// Robustly wait for checkout form (Full name field) to appear after clicking Continue
			long start1 = System.currentTimeMillis();
			WebElement fullNameInput = null;
			while (fullNameInput == null && (System.currentTimeMillis() - start1) < 20000) {
				try {
					continueBtn.click();
				} catch (Exception e) {
					try {
						js.executeScript("arguments[0].click();", continueBtn);
					} catch (Exception jsEx) {}
				}
				try {
					fullNameInput = driver.findElement(By.xpath("//label[contains(.,'Full name')]/input"));
				} catch (Exception e) {}
				Thread.sleep(1000);
			}
			if (fullNameInput == null) {
				throw new Exception("Full name input not found after 20 seconds.");
			}
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
			
			// Select T-shirt size if present
			try {
				WebElement tshirtSelect = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//label[contains(.,'T-shirt')]/select")));
				Select selectTshirt = new Select(tshirtSelect);
				selectTshirt.selectByVisibleText("L");
				System.out.println("Selected T-shirt size.");
			} catch (Exception e) {
				System.out.println("T-shirt size selection not present/required, skipping.");
			}
			
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
			
			// Click Continue in Order Summary robustly until URL transitions to race-participate
			WebElement summaryContinueBtn = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//aside//button[text()='Continue']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", summaryContinueBtn);
			
			long start2 = System.currentTimeMillis();
			while (!driver.getCurrentUrl().contains("/race-participate") && (System.currentTimeMillis() - start2) < 15000) {
				try {
					summaryContinueBtn.click();
				} catch (Exception e) {}
				Thread.sleep(1000);
			}
			System.out.println("Navigated to race-participate page successfully. URL: " + driver.getCurrentUrl());
			Thread.sleep(2000);
			
			// --- STEP 1: ADD ONE RACE ADDON (The Race Pack) ---
			// Click Select button for "The Race Pack"
			WebElement racePackSelectBtn = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//h3[contains(text(), 'The Race Pack')]/following::button[contains(., 'Select')][1]")
			));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", racePackSelectBtn);
			Thread.sleep(1000);
			racePackSelectBtn.click();
			System.out.println("Clicked Select button for The Race Pack.");
			Thread.sleep(2000);
			
			// Click option containing "amrinder101"
			WebElement attendeeOptionRace = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//*[contains(text(), 'amrinder101') and not(self::script) and not(self::style)]")
			));
			attendeeOptionRace.click();
			System.out.println("Selected attendee name option for Race.");
			Thread.sleep(1000);
			
			// Click Add button next to it
			WebElement addBtnRace = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//h3[contains(text(), 'The Race Pack')]/following::button[text()='Add'][1]")
			));
			addBtnRace.click();
			System.out.println("Clicked Add button for Race.");
			Thread.sleep(2000);
			
			// Click Save & Next on Race Addon page
			WebElement saveNextRaceBtn = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//button[text()='Save & Next']")
			));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", saveNextRaceBtn);
			Thread.sleep(1000);
			saveNextRaceBtn.click();
			System.out.println("Clicked Save & Next button on Race page.");
			Thread.sleep(4000);

			// --- STEP 2: ADD ONE PARTICIPATE ADDON (Breakfast at the Lake) ---
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
			WebElement attendeeOptionParticipate = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//*[contains(text(), 'amrinder101') and not(self::script) and not(self::style)]")
			));
			attendeeOptionParticipate.click();
			System.out.println("Selected attendee name option for Participate.");
			Thread.sleep(1000);
			
			// Click Add button next to it
			WebElement addBtnParticipate = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//h3[contains(text(), 'Breakfast at the Lake')]/following::button[text()='Add'][1]")
			));
			addBtnParticipate.click();
			System.out.println("Clicked Add button for Participate.");
			Thread.sleep(2000);
			
			// Click Save & Next on Participate Addon page
			WebElement saveNextParticipateBtn = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//button[text()='Save & Next']")
			));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", saveNextParticipateBtn);
			Thread.sleep(1000);
			saveNextParticipateBtn.click();
			System.out.println("Clicked Save & Next button on Participate page.");
			Thread.sleep(4000);
			
			// --- STEP 3: WALLET TOP-UP (1,000) ---
			// Wait for Wallet Top-up page to load
			WebElement walletLabel = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//label[contains(., 'amrinder101')]")
			));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", walletLabel);
			Thread.sleep(1000);
			walletLabel.click();
			System.out.println("Clicked attendee label on Wallet page.");
			Thread.sleep(3000);
			
			// Click 1,000 wallet top-up button
			WebElement wallet1000Btn = wait.until(ExpectedConditions.elementToBeClickable(
				By.xpath("//button[contains(., '1,000')]")
			));
			wallet1000Btn.click();
			System.out.println("Clicked 1,000 wallet top-up button.");
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
				java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("ibw_vipwallet_success.png"),
						java.nio.file.StandardCopyOption.REPLACE_EXISTING);
				System.out.println("Success screenshot saved to ibw_vipwallet_success.png");
			} catch (Exception e) {
				System.out.println("Failed to save screenshot: " + e.getMessage());
			}
			
			// Save final page source of success
			try (FileWriter writer = new FileWriter("ibw_vipwallet_success.html")) {
				writer.write(driver.getPageSource());
				System.out.println("Success page source saved to ibw_vipwallet_success.html");
			} catch (Exception e) {
				System.out.println("Failed to save page source: " + e.getMessage());
			}

		} catch (Exception e) {
			System.out.println("Exception occurred during execution: " + e.getMessage());
			e.printStackTrace();
			// Take error screenshot
			try {
				File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
				java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("ibw_vipwallet_error.png"),
						java.nio.file.StandardCopyOption.REPLACE_EXISTING);
				System.out.println("Error screenshot saved to ibw_vipwallet_error.png");
			} catch (Exception se) {
				System.out.println("Failed to save error screenshot: " + se.getMessage());
			}
			// Save error page source
			try (FileWriter writer = new FileWriter("ibw_vipwallet_error.html")) {
				writer.write(driver.getPageSource());
				System.out.println("Error page source saved to ibw_vipwallet_error.html");
			} catch (Exception pe) {
				System.out.println("Failed to save error page source: " + pe.getMessage());
			}
		} finally {
			driver.quit();
		}
	}

}
