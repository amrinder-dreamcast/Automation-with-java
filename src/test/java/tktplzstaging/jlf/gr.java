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

public class gr {

	public static void main(String[] args) throws InterruptedException {
		WebDriver driver = new ChromeDriver();
		driver.manage().window().maximize();

		// Open website
		driver.get("https://staging.twagateway.com/jlf2027/");

		WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));
		JavascriptExecutor js = (JavascriptExecutor) driver;

		// Locate General Registration radio button
		WebElement genRadio = wait.until(
				ExpectedConditions.presenceOfElementLocated(
						By.xpath("//div[contains(@class,'GeneralRegistration')]//input[@type='radio']")));

		// Scroll to element
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", genRadio);

		// Wait until clickable and click
		wait.until(ExpectedConditions.elementToBeClickable(genRadio));
		genRadio.click();
		System.out.println("General Registration radio button selected.");

		// Locate Book Now button
		WebElement bookNowBtn = wait.until(
				ExpectedConditions.visibilityOfElementLocated(By.id("Registration_register_btn")));

		// Scroll to Book Now button
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", bookNowBtn);

		// Wait until clickable and click robustly
		wait.until(ExpectedConditions.elementToBeClickable(bookNowBtn));
		try {
			bookNowBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on Book Now failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", bookNowBtn);
		}

		// Wait for /ticketBookings/ page
		wait.until(ExpectedConditions.urlContains("/ticketBookings/"));
		System.out.println("Navigated to ticket bookings page.");

		// Locate the plus button
		WebElement plusBtn = wait.until(
				ExpectedConditions.elementToBeClickable(
						By.xpath("//button[contains(@class,'add-cart') and @data-type='plus' and @data-slug='GeneralRegistration']")));

		// Scroll and click plus button
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", plusBtn);
		try {
			plusBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on plusBtn failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", plusBtn);
		}
		System.out.println("Added 1 General Registration ticket.");

		// Locate Continue button
		WebElement continueBtn = wait.until(
				ExpectedConditions.presenceOfElementLocated(By.cssSelector("div.bottom-ticket-count a.booknow-btn")));

		// Wait until the Continue button becomes enabled
		wait.until(ExpectedConditions.not(ExpectedConditions.attributeContains(continueBtn, "class", "disabled")));

		// Scroll and click Continue button
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", continueBtn);
		wait.until(ExpectedConditions.elementToBeClickable(continueBtn));
		continueBtn.click();
		System.out.println("Continue button clicked successfully.");

		// Wait for the attendee registration page to load and find the 15 Jan checkbox
		WebElement checkbox15 = wait.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("input[name*='[festival_dates][]'][value='15'], input.festival_dates[value='15']")));

		// Scroll to the checkbox
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", checkbox15);

		// If it's not already checked, select it
		if (!checkbox15.isSelected()) {
			js.executeScript("arguments[0].click();", checkbox15);
			System.out.println("15 Jan checkbox selected successfully.");
		} else {
			System.out.println("15 Jan checkbox was already selected.");
		}

		// Locate and fill the Name
		WebElement nameInput = wait.until(
				ExpectedConditions.visibilityOfElementLocated(
						By.cssSelector("input[name^='attendee['][name$='[name]']")));
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", nameInput);
		nameInput.clear();
		nameInput.sendKeys("Amrinder Singh");
		System.out.println("Attendee Name filled successfully.");

		// Locate and fill the Email
		WebElement emailInput = wait.until(
				ExpectedConditions.visibilityOfElementLocated(
						By.cssSelector("input[name^='attendee['][name$='[email]']")));
		emailInput.clear();
		String uniqueEmail = "amrinder+1@dreamcast.co";
		emailInput.sendKeys(uniqueEmail);
		System.out.println("Attendee Email filled successfully: " + uniqueEmail);

		// Locate and fill the Phone number
		WebElement phoneInput = wait.until(
				ExpectedConditions.visibilityOfElementLocated(
						By.cssSelector("input[name^='attendee['][name$='[phone]']")));
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", phoneInput);
		phoneInput.clear();
		String uniquePhone = "6350415261";
		phoneInput.sendKeys(uniquePhone);
		System.out.println("Attendee Phone number filled successfully: " + uniquePhone);

		// Select Age Group dynamically (first option index 1)
		WebElement ageGroupSelect = wait.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("select[name^='attendee['][name$='[age_group]']")));
		js.executeScript("$(arguments[0]).val($(arguments[0]).find('option').eq(1).val()).trigger('change');", ageGroupSelect);
		System.out.println("Age Group selected dynamically.");

		// Select Country (India) using Select2 only if it is not already selected as India
		WebElement selectedCountrySpan = wait.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("span.select2-selection[aria-labelledby*='country'] span.select2-selection__rendered")));

		String currentCountry = selectedCountrySpan.getText();
		if (!"India".equalsIgnoreCase(currentCountry.trim())) {
			WebElement countrySelect = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("select[name^='attendee['][name$='[country]']")));
			js.executeScript("$(arguments[0]).val('India').trigger('change');", countrySelect);
			System.out.println("Country selected as India programmatically.");
		} else {
			System.out.println("Country is already selected as India. Skipping click.");
		}

		// Select State (Rajasthan) programmatically
		WebElement stateSelect = wait.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("select[name^='attendee['][name$='[state]']")));
		js.executeScript("$(arguments[0]).val('Rajasthan').trigger('change');", stateSelect);
		System.out.println("State selected as Rajasthan programmatically.");

		// Wait for the City dropdown to populate and contain the "Jaipur" option
		wait.until(ExpectedConditions.presenceOfElementLocated(
				By.xpath("//select[contains(@name, '[city]')]//option[text()='Jaipur' or @value='Jaipur']")));

		// Select City (Jaipur) programmatically
		WebElement citySelect = driver.findElement(By.cssSelector("select[name^='attendee['][name$='[city]']"));
		js.executeScript("$(arguments[0]).val('Jaipur').trigger('change');", citySelect);
		System.out.println("City selected as Jaipur programmatically.");

		// Select Gender (Male) programmatically
		WebElement genderSelect = wait.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("select[name^='attendee['][name$='[gender]']")));
		js.executeScript("$(arguments[0]).val('Male').trigger('change');", genderSelect);
		System.out.println("Gender selected as Male programmatically.");

		// Select Designation dynamically (first option index 1)
		WebElement designationSelect = wait.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("select[name^='attendee['][name$='[designation]']")));
		js.executeScript("$(arguments[0]).val($(arguments[0]).find('option').eq(1).val()).trigger('change');", designationSelect);
		System.out.println("Designation selected dynamically.");

		// Select Hear About Us dynamically (first option index 1)
		WebElement hearAboutUsSelect = wait.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("select[name^='attendee['][name$='[hear_about_us]']")));
		js.executeScript("$(arguments[0]).val($(arguments[0]).find('option').eq(1).val()).trigger('change');", hearAboutUsSelect);
		System.out.println("Hear about us selected dynamically.");

		// Select Interest in Attending dynamically (first option index 1)
		WebElement interestSelect = wait.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("select[name^='attendee['][name$='[interest_in_attending][]']")));
		js.executeScript("$(arguments[0]).val([$(arguments[0]).find('option').eq(1).val()]).trigger('change');", interestSelect);
		System.out.println("Interest in attending selected dynamically.");

		// Upload Profile Photo
		WebElement fileInput = wait.until(
				ExpectedConditions.presenceOfElementLocated(
						By.cssSelector("input[type='file'][name^='attendee['][name$='[image]']")));
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", fileInput);
		File uploadFile = new File("profile_photo.jpg");
		fileInput.sendKeys(uploadFile.getAbsolutePath());
		System.out.println("Profile photo uploaded.");

		// Wait for crop modal to show
		WebElement cropModal = wait.until(
				ExpectedConditions.visibilityOfElementLocated(By.id("modal_profile")));
		System.out.println("Crop modal is visible.");

		// Click crop button
		WebElement cropBtn = wait.until(
				ExpectedConditions.elementToBeClickable(By.id("crop_profile")));
		try {
			cropBtn.click();
		} catch (Exception e) {
			js.executeScript("arguments[0].click();", cropBtn);
		}
		System.out.println("Crop button clicked.");

		// Wait for modal to close
		wait.until(ExpectedConditions.invisibilityOfElementLocated(By.id("modal_profile")));
		System.out.println("Crop modal closed.");
		Thread.sleep(3000);

		// Locate and click the Save to continue button
		WebElement saveBtn = wait.until(
				ExpectedConditions.elementToBeClickable(By.cssSelector("button.submit-btn")));
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", saveBtn);
		try {
			saveBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on Save button failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", saveBtn);
		}
		System.out.println("Save to continue button clicked.");

		// Wait 5 seconds for AJAX submission to complete
		Thread.sleep(5000);

		// Locate and click the final Continue button in the Order Summary section
		WebElement finalContinueBtn = wait.until(
				ExpectedConditions.elementToBeClickable(By.cssSelector("div.checkout_btn a.booknow-btn")));
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", finalContinueBtn);
		try {
			finalContinueBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on final Continue button failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", finalContinueBtn);
		}
		System.out.println("Final Continue button clicked.");

		// Wait for the navigation to the hotel booking page to complete
		wait.until(ExpectedConditions.urlContains("/hotelBooking/"));
		System.out.println("Navigated to hotel booking page successfully.");

		// Locate the "No, I don't need a hotel" button
		WebElement skipHotelBtn = wait.until(
				ExpectedConditions.elementToBeClickable(By.cssSelector("a.skip_btn")));

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

		// Wait for the checkout page to load
		wait.until(ExpectedConditions.urlContains("/checkout/"));
		System.out.println("Navigated to checkout page.");

		// Locate the promo code input
		WebElement promoInput = wait.until(
				ExpectedConditions.visibilityOfElementLocated(By.cssSelector("input.coupon_input")));
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", promoInput);

		// Fill the promo code
		promoInput.clear();
		promoInput.sendKeys("gr141518");
		System.out.println("Promo code gr141518 entered.");

		// Locate and click the Apply button
		WebElement applyBtn = wait.until(
				ExpectedConditions.elementToBeClickable(By.cssSelector("button.btn-coupon-apply")));
		try {
			applyBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on Apply button failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", applyBtn);
		}
		System.out.println("Apply button clicked.");

		// Wait 5 seconds for cart to update
		Thread.sleep(5000);

		// Take a screenshot of applied coupon page
		try {
			File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
			java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("interest_in_attending.png"),
					java.nio.file.StandardCopyOption.REPLACE_EXISTING);
			System.out.println("Screenshot saved to interest_in_attending.png");
		} catch (Exception e) {
			System.out.println("Failed to take screenshot: " + e.getMessage());
		}

		// Locate and click the Pay Securely button
		WebElement paySecurelyBtn = wait.until(
				ExpectedConditions.elementToBeClickable(By.cssSelector("div.checkout_btn a.booknow-btn")));
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", paySecurelyBtn);
		try {
			paySecurelyBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on Pay Securely button failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", paySecurelyBtn);
		}
		System.out.println("Pay Securely button clicked.");

		// Wait 10 seconds for redirect to complete
		Thread.sleep(10000);

		// Locate and click Razorpay Domestic option label
		WebElement razorpayDomesticLabel = wait.until(
				ExpectedConditions.elementToBeClickable(
						By.cssSelector("label[for^='payment-method-Razorpay-'][for$='-domestic']")));
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", razorpayDomesticLabel);
		try {
			razorpayDomesticLabel.click();
		} catch (Exception e) {
			System.out.println("Standard click on Razorpay Domestic label failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", razorpayDomesticLabel);
		}
		System.out.println("Razorpay Domestic option selected.");

		// Wait 5 seconds for UI update
		Thread.sleep(5000);

		// Locate and click Make Payment button
		WebElement makePaymentBtn = wait.until(
				ExpectedConditions.elementToBeClickable(By.cssSelector("button.makePayments")));
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", makePaymentBtn);
		try {
			makePaymentBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on Make Payment button failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", makePaymentBtn);
		}
		System.out.println("Make Payment button clicked.");

		// Wait 10 seconds for the payment portal to load
		Thread.sleep(10000);

		// Switch to Razorpay iframe
		try {
			WebElement razorpayIframe = wait.until(
					ExpectedConditions.presenceOfElementLocated(By.className("razorpay-checkout-frame")));
			driver.switchTo().frame(razorpayIframe);
			System.out.println("Switched to Razorpay checkout iframe.");
		} catch (Exception e) {
			System.out.println("No Razorpay checkout iframe found: " + e.getMessage());
		}

		// Locate and click Show QR button
		WebElement showQrBtn = wait.until(
				ExpectedConditions.elementToBeClickable(By.cssSelector("span[name='generateQR']")));
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", showQrBtn);
		try {
			showQrBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on Show QR failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", showQrBtn);
		}
		System.out.println("Show QR button clicked.");

		// Wait 7 seconds as requested by the user
		Thread.sleep(7000);

		// Locate and click the Continue & Pay button
		WebElement continuePayBtn = wait.until(
				ExpectedConditions.elementToBeClickable(
						By.xpath("//button[contains(., 'Continue & Pay') or contains(text(), 'Continue & Pay')]")));
		js.executeScript("arguments[0].scrollIntoView({block:'center'});", continuePayBtn);
		try {
			continuePayBtn.click();
		} catch (Exception e) {
			System.out.println("Standard click on Continue & Pay failed, trying JavaScript click fallback.");
			js.executeScript("arguments[0].click();", continuePayBtn);
		}
		System.out.println("Continue & Pay button clicked.");

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
