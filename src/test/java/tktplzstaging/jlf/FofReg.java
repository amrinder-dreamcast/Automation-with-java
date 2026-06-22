package tktplzstaging.jlf;

import java.io.File;
import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class FofReg {

	public static void main(String[] args) throws InterruptedException {
		// TODO Auto-generated method stub

		WebDriver driver = new ChromeDriver();

		driver.manage().window().maximize();

		// Open website
		driver.get("https://staging.twagateway.com/jlf2027/");

		WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));

		// Locate Friend of the Festival radio button
		WebElement friendOfFestivalRadio = wait.until(
				ExpectedConditions.presenceOfElementLocated(
						By.xpath("//div[contains(@class,'FriendoftheFestival')]//input[@type='radio']")));

		// Scroll to element
		((JavascriptExecutor) driver).executeScript(
				"arguments[0].scrollIntoView({block:'center'});",
				friendOfFestivalRadio);

		// Wait until clickable
		wait.until(ExpectedConditions.elementToBeClickable(friendOfFestivalRadio));

		// Click radio button
		friendOfFestivalRadio.click();

		System.out.println("Friend of the Festival radio button selected.");

		WebDriverWait wait1 = new WebDriverWait(driver, Duration.ofSeconds(20));

		WebElement bookNowBtn = wait1.until(
				ExpectedConditions.visibilityOfElementLocated(
						By.id("Registration_register_btn")));

		// Scroll to Book Now button
		((JavascriptExecutor) driver).executeScript(
				"arguments[0].scrollIntoView({block:'center'});",
				bookNowBtn);

		// Wait until clickable
		wait1.until(ExpectedConditions.elementToBeClickable(bookNowBtn));

		// Click robustly
		try {
			bookNowBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on Book Now failed, trying JavaScript click fallback.");
			((JavascriptExecutor) driver).executeScript("arguments[0].click();", bookNowBtn);
		}

		WebDriverWait wait2 = new WebDriverWait(driver, Duration.ofSeconds(20));
		JavascriptExecutor js = (JavascriptExecutor) driver;

		// Wait for the URL transition to ensure the bookings page has loaded
		wait2.until(ExpectedConditions.urlContains("/ticketBookings/"));
		System.out.println("URL contains /ticketBookings/. Page loaded successfully.");

		// Locate the actual + button (adding data-type='plus' specifically to avoid
		// matching the - button)
		WebElement plusBtn = wait2.until(
				ExpectedConditions.elementToBeClickable(
						By.xpath(
								"//button[contains(@class,'add-cart') and @data-type='plus' and @data-slug='FriendoftheFestival']")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", plusBtn);

		// Click + to add 1 ticket robustly (this automatically triggers the AJAX
		// request and updates the value)
		try {
			plusBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on plusBtn failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", plusBtn);
		}

		// Locate the Continue button
		WebElement continueBtn = wait2.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("div.bottom-ticket-count a.booknow-btn")));

		// Wait until the Continue button becomes enabled (disabled class is removed
		// after AJAX success)
		wait2.until(ExpectedConditions.not(ExpectedConditions.attributeContains(continueBtn, "class", "disabled")));

		// Scroll to the Continue button
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", continueBtn);

		// Wait until clickable and click the Continue button
		wait2.until(ExpectedConditions.elementToBeClickable(continueBtn));
		continueBtn.click();

		System.out.println("Continue button clicked successfully.");

		// Wait for the attendee registration page to load and find the 15 Jan checkbox
		WebElement checkbox15 = wait2.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("input.festival_dates[value='15']")));

		// Scroll to the checkbox
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", checkbox15);

		// If it's not already checked, select it
		if (!checkbox15.isSelected()) {
			// Using JavaScript to click since the custom checkbox has opacity: 0
			js.executeScript("arguments[0].click();", checkbox15);
			System.out.println("15 Jan checkbox selected successfully.");
		} else {
			System.out.println("15 Jan checkbox was already selected.");
		}

		// Locate the Name input dynamically (avoiding dynamic ID by matching name
		// start/end patterns)
		WebElement nameInput = wait2.until(
				ExpectedConditions.visibilityOfElementLocated(
						By.cssSelector("input[name^='attendee['][name$='[name]']")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", nameInput);

		// Fill the Name
		nameInput.clear();
		nameInput.sendKeys("Amrinder Singh");
		System.out.println("Attendee Name filled successfully.");

		// Locate the Email input dynamically (avoiding dynamic ID by matching name
		// start/end patterns)
		WebElement emailInput = wait2.until(
				ExpectedConditions.visibilityOfElementLocated(
						By.cssSelector("input[name^='attendee['][name$='[email]']")));

		// Fill the Email
		emailInput.clear();
		String uniqueEmail = "amrinder+" + System.currentTimeMillis() + "@dreamcast.co";
		emailInput.sendKeys(uniqueEmail);
		System.out.println("Attendee Email filled successfully: " + uniqueEmail);

		// Locate the WhatsApp/Phone input dynamically (avoiding dynamic ID by matching
		// name start/end patterns)
		WebElement phoneInput = wait2.until(
				ExpectedConditions.visibilityOfElementLocated(
						By.cssSelector("input[name^='attendee['][name$='[phone]']")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", phoneInput);

		// Fill the Phone number
		phoneInput.clear();
		String uniquePhone = "6350415261";
		phoneInput.sendKeys(uniquePhone);
		System.out.println("Attendee Phone number filled successfully: " + uniquePhone);

		// Select Age Group (25-34 Years) using Select2
		WebElement ageDropdownTrigger = wait2.until(
				ExpectedConditions.elementToBeClickable(
						By.cssSelector("span.select2-selection[aria-labelledby*='age_group']")));
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", ageDropdownTrigger);
		ageDropdownTrigger.click();

		WebElement ageOption = wait2.until(
				ExpectedConditions.elementToBeClickable(
						By.xpath("//li[contains(@class, 'select2-results__option') and contains(text(), '25-34')]")));
		ageOption.click();
		System.out.println("Age group selected successfully.");

		// Select Country (India) using Select2 only if it is not already selected as
		// India
		WebElement selectedCountrySpan = wait2.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector(
								"span.select2-selection[aria-labelledby*='country'] span.select2-selection__rendered")));

		String currentCountry = selectedCountrySpan.getText();
		if (!"India".equalsIgnoreCase(currentCountry.trim())) {
			WebElement countryDropdownTrigger = wait2.until(
					ExpectedConditions.elementToBeClickable(
							By.cssSelector("span.select2-selection[aria-labelledby*='country']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", countryDropdownTrigger);
			countryDropdownTrigger.click();

			WebElement countryOption = wait2.until(
					ExpectedConditions.elementToBeClickable(
							By.xpath(
									"//li[contains(@class, 'select2-results__option') and (text()='India' or contains(text(), 'India'))]")));
			countryOption.click();
			System.out.println("Country selected as India.");
		} else {
			System.out.println("Country is already selected as India. Skipping click.");
		}

		// Select State (Rajasthan) using Select2 only if it is not already selected as
		// Rajasthan
		WebElement selectedStateSpan = wait2.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector(
								"span.select2-selection[aria-labelledby*='state'] span.select2-selection__rendered")));

		String currentState = selectedStateSpan.getText();
		if (!"Rajasthan".equalsIgnoreCase(currentState.trim())) {
			WebElement stateDropdownTrigger = wait2.until(
					ExpectedConditions.elementToBeClickable(
							By.cssSelector("span.select2-selection[aria-labelledby*='state']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", stateDropdownTrigger);
			stateDropdownTrigger.click();

			WebElement stateOption = wait2.until(
					ExpectedConditions.elementToBeClickable(
							By.xpath(
									"//li[contains(@class, 'select2-results__option') and (text()='Rajasthan' or contains(text(), 'Rajasthan'))]")));
			stateOption.click();
			System.out.println("State selected as Rajasthan.");
		} else {
			System.out.println("State is already selected as Rajasthan. Skipping click.");
		}

		// Wait for the City dropdown to populate and contain the "Jaipur" option
		// (completing the AJAX load)
		wait2.until(ExpectedConditions.presenceOfElementLocated(
				By.xpath("//select[contains(@name, '[city]')]//option[text()='Jaipur' or @value='Jaipur']")));

		// Select City (Jaipur) programmatically using Select2's jQuery trigger
		WebElement citySelect = driver.findElement(By.cssSelector("select[name^='attendee['][name$='[city]']"));
		try {
			System.out.println("City dropdown HTML options: " + citySelect.getAttribute("innerHTML"));
		} catch (Exception e) {
			System.out.println("Failed to print city options: " + e.getMessage());
		}
		js.executeScript("$(arguments[0]).val('Jaipur').trigger('change');", citySelect);
		System.out.println("City selected as Jaipur programmatically.");

		// Select Gender (Male) programmatically using Select2's jQuery trigger
		WebElement genderSelect = wait2.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("select[name^='attendee['][name$='[gender]']")));
		js.executeScript("$(arguments[0]).val('Male').trigger('change');", genderSelect);
		System.out.println("Gender selected as Male programmatically.");

		// Locate the Designation input dynamically (which represents the Occupation field after Organisation was removed)
		WebElement designationInput = wait2.until(
				ExpectedConditions.visibilityOfElementLocated(
						By.cssSelector("input[name^='attendee['][name$='[designation]']")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", designationInput);

		// Fill the Designation (Occupation)
		designationInput.clear();
		designationInput.sendKeys("qa");
		System.out.println("Attendee Designation (Occupation) filled successfully.");

		// Select How did you hear about us (Instagram) programmatically using Select2's
		// jQuery trigger
		WebElement hearAboutUsSelect = wait2.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("select[name^='attendee['][name$='[hear_about_us]']")));
		js.executeScript("$(arguments[0]).val('Instagram').trigger('change');", hearAboutUsSelect);
		System.out.println("Hear about us selected as Instagram programmatically.");

		// Select Interest in attending (Authors/ Books) programmatically using
		// Select2's jQuery trigger
		WebElement interestSelect = wait2.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("select[name^='attendee['][name$='[interest_in_attending][]']")));
		js.executeScript("$(arguments[0]).val(['Authors/ Books']).trigger('change');", interestSelect);
		System.out.println("Interest in attending selected as Authors/ Books programmatically.");

		// Locate the file input for profile photo dynamically (avoiding dynamic ID)
		WebElement fileInput = wait2.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("input[type='file'][name^='attendee['][name$='[image]']")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", fileInput);

		// Upload the profile photo using sendKeys
		File uploadFile = new File("profile_photo.jpg");
		fileInput.sendKeys(uploadFile.getAbsolutePath());
		System.out.println("Profile photo uploaded via sendKeys.");

		// Wait for the crop modal to become visible
		WebElement cropModal = wait2.until(
				ExpectedConditions.visibilityOfElementLocated(By.id("modal_profile")));
		System.out.println("Crop modal is visible.");

		// Locate the Crop button
		WebElement cropBtn = wait2.until(
				ExpectedConditions.elementToBeClickable(By.id("crop_profile")));

		// Click the Crop button robustly
		try {
			cropBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on Crop button failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", cropBtn);
		}
		System.out.println("Crop button clicked successfully.");

		// Wait for the preview image to be displayed (indicating AJAX upload finished
		// after cropping)
		try {
			WebElement previewDiv = wait2.until(
					ExpectedConditions.visibilityOfElementLocated(
							By.cssSelector("div[id^='previewimage_']")));
			System.out.println("Profile photo preview is displayed (upload completed).");
		} catch (Exception e) {
			System.out.println("Preview div did not become visible, waiting 5 seconds instead: " + e.getMessage());
			Thread.sleep(5000);
			// Print browser console logs for debugging
			try {
				System.out.println("--- Browser Console Logs Start ---");
				for (org.openqa.selenium.logging.LogEntry entry : driver.manage().logs()
						.get(org.openqa.selenium.logging.LogType.BROWSER)) {
					System.out.println(new java.util.Date(entry.getTimestamp()) + " " + entry.getLevel() + " "
							+ entry.getMessage());
				}
				System.out.println("--- Browser Console Logs End ---");
			} catch (Exception le) {
				System.out.println("Failed to fetch browser logs: " + le.getMessage());
			}
		}

		// Locate the Save to continue button
		WebElement saveBtn = wait2.until(
				ExpectedConditions.elementToBeClickable(
						By.cssSelector("button.submit-btn")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", saveBtn);

		// Click the Save to continue button
		try {
			saveBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on Save button failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", saveBtn);
		}
		System.out.println("Save to continue button clicked successfully.");

		// Wait 5 seconds for AJAX submission to complete
		try {
			Thread.sleep(5000);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}

		// Print browser console logs unconditionally for debugging
		try {
			System.out.println("--- Browser Console Logs Start ---");
			for (org.openqa.selenium.logging.LogEntry entry : driver.manage().logs()
					.get(org.openqa.selenium.logging.LogType.BROWSER)) {
				System.out.println(
						new java.util.Date(entry.getTimestamp()) + " " + entry.getLevel() + " " + entry.getMessage());
			}
			System.out.println("--- Browser Console Logs End ---");
		} catch (Exception le) {
			System.out.println("Failed to fetch browser logs: " + le.getMessage());
		}

		// Locate the final Continue button in the Order Summary section
		WebElement finalContinueBtn = wait2.until(
				ExpectedConditions.elementToBeClickable(
						By.cssSelector("div.checkout_btn a.booknow-btn")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", finalContinueBtn);

		// Click the final Continue button
		try {
			finalContinueBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on final Continue button failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", finalContinueBtn);
		}
		System.out.println("Final Continue button clicked successfully.");

		// Wait for the navigation to the hotel booking page to complete
		wait2.until(ExpectedConditions.urlContains("/hotelBooking/"));
		System.out.println("Navigated to hotel booking page successfully.");

		// Locate the "No, I don't need a hotel" button
		WebElement skipHotelBtn = wait2.until(
				ExpectedConditions.elementToBeClickable(
						By.cssSelector("a.skip_btn")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", skipHotelBtn);

		// Click the skip button
		try {
			skipHotelBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on skipHotelBtn failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", skipHotelBtn);
		}
		System.out.println("No, I don't need a hotel button clicked successfully.");

		// Wait 5 seconds for redirection to complete
		try {
			Thread.sleep(5000);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}

		// Locate the promo code input
		WebElement promoInput = wait2.until(
				ExpectedConditions.visibilityOfElementLocated(
						By.cssSelector("input.coupon_input")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", promoInput);

		// Fill the promo code
		promoInput.clear();
		promoInput.sendKeys("fof1");
		System.out.println("Promo code fof1 entered.");

		// Locate the Apply button
		WebElement applyBtn = wait2.until(
				ExpectedConditions.elementToBeClickable(
						By.cssSelector("button.btn-coupon-apply")));

		// Click the Apply button
		try {
			applyBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on Apply button failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", applyBtn);
		}
		System.out.println("Apply button clicked successfully.");

		// Wait 5 seconds for cart to update
		try {
			Thread.sleep(5000);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}

		// Take a screenshot
		try {
			File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
			java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("interest_in_attending.png"),
					java.nio.file.StandardCopyOption.REPLACE_EXISTING);
			System.out.println("Screenshot saved to interest_in_attending.png");
		} catch (Exception e) {
			System.out.println("Failed to take screenshot: " + e.getMessage());
		}

		// Locate the Pay Securely button
		WebElement paySecurelyBtn = wait2.until(
				ExpectedConditions.elementToBeClickable(
						By.cssSelector("div.checkout_btn a.booknow-btn")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", paySecurelyBtn);

		// Click the Pay Securely button
		try {
			paySecurelyBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on Pay Securely button failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", paySecurelyBtn);
		}
		System.out.println("Pay Securely button clicked successfully.");

		// Wait 10 seconds for redirect/load to complete
		try {
			Thread.sleep(10000);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}

		// Take a final screenshot
		try {
			File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
			java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("passed.png"),
					java.nio.file.StandardCopyOption.REPLACE_EXISTING);
			System.out.println("Final screenshot saved to passed.png");
		} catch (Exception e) {
			System.out.println("Failed to take final screenshot: " + e.getMessage());
		}

		// Locate Razorpay Domestic option label
		WebElement razorpayDomesticLabel = wait2.until(
				ExpectedConditions.elementToBeClickable(
						By.cssSelector("label[for^='payment-method-Razorpay-'][for$='-domestic']")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", razorpayDomesticLabel);

		// Click it robustly
		try {
			razorpayDomesticLabel.click();
		} catch (Exception e) {
			System.out.println("Standard click on Razorpay Domestic label failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", razorpayDomesticLabel);
		}
		System.out.println("Razorpay Domestic option selected successfully.");

		// Wait 5 seconds for UI update
		try {
			Thread.sleep(5000);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}

		// Take a new final screenshot
		try {
			File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
			java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("passed.png"),
					java.nio.file.StandardCopyOption.REPLACE_EXISTING);
			System.out.println("Final screenshot updated and saved to passed.png");
		} catch (Exception e) {
			System.out.println("Failed to take final screenshot: " + e.getMessage());
		}

		// Locate Make Payment button
		WebElement makePaymentBtn = wait2.until(
				ExpectedConditions.elementToBeClickable(
						By.cssSelector("button.makePayments")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", makePaymentBtn);

		// Click Make Payment button
		try {
			makePaymentBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on Make Payment button failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", makePaymentBtn);
		}
		System.out.println("Make Payment button clicked successfully.");

		// Wait 10 seconds for the payment portal to load
		try {
			Thread.sleep(10000);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}

		// Take the ultimate final screenshot
		try {
			File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
			java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("passed.png"),
					java.nio.file.StandardCopyOption.REPLACE_EXISTING);
			System.out.println("Payment portal screenshot saved to passed.png");
		} catch (Exception e) {
			System.out.println("Failed to take payment portal screenshot: " + e.getMessage());
		}

		// Switch to Razorpay iframe if present
		try {
			WebElement razorpayIframe = wait2.until(
					ExpectedConditions.presenceOfElementLocated(By.className("razorpay-checkout-frame")));
			driver.switchTo().frame(razorpayIframe);
			System.out.println("Switched to Razorpay checkout iframe.");
		} catch (Exception e) {
			System.out.println("No Razorpay checkout iframe found: " + e.getMessage());
		}

		// Locate Show QR button (using the specific name attribute on the span)
		WebElement showQrBtn = wait2.until(
				ExpectedConditions.elementToBeClickable(
						By.cssSelector("span[name='generateQR']")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", showQrBtn);

		// Click Show QR button
		try {
			showQrBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on Show QR failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", showQrBtn);
		}
		System.out.println("Show QR button clicked successfully.");

		// Wait 7 seconds as requested by the user
		try {
			Thread.sleep(7000);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}

		// Locate and click the Continue & Pay button in the fee breakup modal
		WebElement continuePayBtn = wait2.until(
				ExpectedConditions.elementToBeClickable(
						By.xpath("//button[contains(., 'Continue & Pay') or contains(text(), 'Continue & Pay')]")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", continuePayBtn);

		// Click Continue & Pay button
		try {
			continuePayBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on Continue & Pay failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", continuePayBtn);
		}
		System.out.println("Continue & Pay button clicked successfully.");

		// Switch back to default content to take screenshot
		driver.switchTo().defaultContent();

		// Wait 5 seconds for QR code to display
		try {
			Thread.sleep(5000);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}

		// Take the ultimate final screenshot
		try {
			File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
			java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("passed.png"),
					java.nio.file.StandardCopyOption.REPLACE_EXISTING);
			System.out.println("QR Code screen screenshot saved to passed.png");
		} catch (Exception e) {
			System.out.println("Failed to take final screenshot: " + e.getMessage());
		}
	}

}
