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

public class sr {

	public static void main(String[] args) throws InterruptedException {
		// TODO Auto-generated method stub

		WebDriver driver = new ChromeDriver();

		driver.manage().window().maximize();

		// Open website
		driver.get("https://staging.twagateway.com/jlf2027/");

		WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));

		// Locate Student Registration radio button
		WebElement studentRadio = wait.until(
				ExpectedConditions.presenceOfElementLocated(
						By.xpath("//div[contains(@class,'StudentRegistration')]//input[@type='radio']")));

		// Scroll to element
		((JavascriptExecutor) driver).executeScript(
				"arguments[0].scrollIntoView({block:'center'});",
				studentRadio);

		// Wait until clickable
		wait.until(ExpectedConditions.elementToBeClickable(studentRadio));

		// Click radio button
		studentRadio.click();

		System.out.println("Student Registration radio button selected.");

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

		// Locate the actual + button
		WebElement plusBtn = wait2.until(
				ExpectedConditions.elementToBeClickable(
						By.xpath(
								"//button[contains(@class,'add-cart') and @data-type='plus' and @data-slug='StudentRegistration']")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", plusBtn);

		// Click + to add 1 ticket
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

		// Wait until the Continue button becomes enabled
		wait2.until(ExpectedConditions.not(ExpectedConditions.attributeContains(continueBtn, "class", "disabled")));

		// Scroll to the Continue button
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", continueBtn);

		// Wait until clickable and click the Continue button
		wait2.until(ExpectedConditions.elementToBeClickable(continueBtn));
		continueBtn.click();

		System.out.println("Continue button clicked successfully.");

		// Locate the Name input dynamically
		WebElement nameInput = wait2.until(
				ExpectedConditions.visibilityOfElementLocated(
						By.cssSelector("input[name^='attendee['][name$='[name]']")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", nameInput);

		// Fill the Name
		nameInput.clear();
		nameInput.sendKeys("Amrinder Singh");
		System.out.println("Attendee Name filled successfully.");

		// Locate the Email input dynamically
		WebElement emailInput = wait2.until(
				ExpectedConditions.visibilityOfElementLocated(
						By.cssSelector("input[name^='attendee['][name$='[email]']")));

		// Fill the Email
		emailInput.clear();
		String uniqueEmail = "amrinder+1@dreamcast.co";
		emailInput.sendKeys(uniqueEmail);
		System.out.println("Attendee Email filled successfully: " );

		// Locate the WhatsApp/Phone input dynamically
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

		// Select Country (India) using Select2 only if it is not already selected as India
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

		// Select State (Rajasthan) programmatically using Select2's jQuery trigger
		WebElement stateSelect = wait2.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("select[name^='attendee['][name$='[state]']")));
		js.executeScript("$(arguments[0]).val('Rajasthan').trigger('change');", stateSelect);
		System.out.println("State selected as Rajasthan programmatically.");

		// Wait for the City dropdown to populate and contain the "Jaipur" option
		wait2.until(ExpectedConditions.presenceOfElementLocated(
				By.xpath("//select[contains(@name, '[city]')]//option[text()='Jaipur' or @value='Jaipur']")));

		// Select City (Jaipur) programmatically using Select2's jQuery trigger
		WebElement citySelect = driver.findElement(By.cssSelector("select[name^='attendee['][name$='[city]']"));
		js.executeScript("$(arguments[0]).val('Jaipur').trigger('change');", citySelect);
		System.out.println("City selected as Jaipur programmatically.");

		// Fill School Name
		WebElement schoolNameInput = wait2.until(
				ExpectedConditions.visibilityOfElementLocated(
						By.cssSelector("input[name$='[school_name]']")));
		schoolNameInput.clear();
		schoolNameInput.sendKeys("Dreamcast School");
		System.out.println("School name filled successfully.");

		// Fill School Address
		WebElement schoolAddressInput = wait2.until(
				ExpectedConditions.visibilityOfElementLocated(
						By.cssSelector("textarea[name$='[school_address]']")));
		schoolAddressInput.clear();
		schoolAddressInput.sendKeys("Jaipur, Rajasthan");
		System.out.println("School address filled successfully.");

		// Upload Student ID
		WebElement studentIdInput = wait2.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("input[type='file'][data-fieldnum^='student_id']")));
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", studentIdInput);
		File uploadFile = new File("profile_photo.jpg");
		studentIdInput.sendKeys(uploadFile.getAbsolutePath());
		System.out.println("Student ID uploaded.");

		// Wait for crop modal to show for Student ID
		WebElement cropModal = wait2.until(
				ExpectedConditions.visibilityOfElementLocated(By.id("modal_profile")));
		System.out.println("Crop modal is visible for Student ID.");

		// Click crop button
		WebElement cropBtn = wait2.until(
				ExpectedConditions.elementToBeClickable(By.id("crop_profile")));
		try {
			cropBtn.click();
		} catch (Exception e) {
			js.executeScript("arguments[0].click();", cropBtn);
		}
		System.out.println("Crop button clicked for Student ID.");

		// Wait for modal to close
		wait2.until(ExpectedConditions.invisibilityOfElementLocated(By.id("modal_profile")));
		System.out.println("Crop modal closed for Student ID.");
		Thread.sleep(3000);

		// Upload Profile Photo
		WebElement profilePhotoInput = wait2.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("input[type='file'][data-fieldnum^='image_url']")));
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", profilePhotoInput);
		profilePhotoInput.sendKeys(uploadFile.getAbsolutePath());
		System.out.println("Profile photo uploaded.");

		// Wait for crop modal to show for Profile Photo
		cropModal = wait2.until(
				ExpectedConditions.visibilityOfElementLocated(By.id("modal_profile")));
		System.out.println("Crop modal is visible for Profile Photo.");

		// Click crop button
		cropBtn = wait2.until(
				ExpectedConditions.elementToBeClickable(By.id("crop_profile")));
		try {
			cropBtn.click();
		} catch (Exception e) {
			js.executeScript("arguments[0].click();", cropBtn);
		}
		System.out.println("Crop button clicked for Profile Photo.");

		// Wait for modal to close
		wait2.until(ExpectedConditions.invisibilityOfElementLocated(By.id("modal_profile")));
		System.out.println("Crop modal closed for Profile Photo.");
		Thread.sleep(3000);

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
		Thread.sleep(5000);

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

		// Wait for the checkout page to load
		wait2.until(ExpectedConditions.urlContains("/checkout/"));
		System.out.println("Navigated to checkout page successfully.");

		// Locate the promo code input
		WebElement promoInput = wait2.until(
				ExpectedConditions.visibilityOfElementLocated(
						By.cssSelector("input.coupon_input")));

		// Scroll to it
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", promoInput);

		// Fill the promo code
		promoInput.clear();
		promoInput.sendKeys("sr");
		System.out.println("Promo code sr entered.");

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
		Thread.sleep(5000);

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
		Thread.sleep(10000);

		// Take a final screenshot of Payment gateway page
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
		Thread.sleep(5000);

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
		Thread.sleep(10000);

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
		Thread.sleep(7000);

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
		Thread.sleep(5000);

		// Take the ultimate final screenshot
		try {
			File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
			java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("passed.png"),
					java.nio.file.StandardCopyOption.REPLACE_EXISTING);
			System.out.println("QR Code screen screenshot saved to passed.png");
		} catch (Exception e) {
			System.out.println("Failed to take final screenshot: " + e.getMessage());
		}

		driver.quit();
	}

}
