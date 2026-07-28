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

public class bookfestivehotelwithfof {

	public static void main(String[] args) throws InterruptedException {
		WebDriver driver = new ChromeDriver();
		driver.manage().window().maximize();

		try {
			// Open website
			driver.get("https://staging.twagateway.com/jlf2027/");

			WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));
			JavascriptExecutor js = (JavascriptExecutor) driver;

			// Locate Book your Festival Hotel radio button
			WebElement hotelRadio = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("div.hotelWithFOF input[type='radio'], #flexRadioDefault3")));

			// Scroll and click radio button
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", hotelRadio);
			wait.until(ExpectedConditions.elementToBeClickable(hotelRadio));
			hotelRadio.click();
			System.out.println("Hotel Only radio button selected.");

			// Locate and click Book Now button
			WebElement bookNowBtn = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.id("Registration_register_btn")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", bookNowBtn);
			wait.until(ExpectedConditions.elementToBeClickable(bookNowBtn));
			try {
				bookNowBtn.click();
			} catch (Exception e) {
				System.out.println("Standard click on Book Now failed, trying JavaScript click fallback.");
				js.executeScript("arguments[0].click();", bookNowBtn);
			}
			System.out.println("Book Now button clicked.");

			// Wait for the form page to load
			wait.until(ExpectedConditions.urlContains("/hotelWithFOF"));
			System.out.println("Navigated to hotel booking form page successfully.");

			// Fill Name
			WebElement nameInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.name("name")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", nameInput);
			nameInput.clear();
			nameInput.sendKeys("Amrinder Singh");
			System.out.println("Name filled successfully.");

			// Fill Email (generate unique)
			WebElement emailInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.name("email")));
			emailInput.clear();
			String uniqueEmail = "amrinder+" + System.currentTimeMillis() + "@dreamcast.co";
			emailInput.sendKeys(uniqueEmail);
			System.out.println("Email filled successfully: " + uniqueEmail);

			// Fill Phone (generate unique 10-digit number to bypass duplicates)
			WebElement phoneInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.name("phone")));
			phoneInput.clear();
			String uniquePhone = "6" + (System.currentTimeMillis() % 1000000000L);
			while(uniquePhone.length() < 10) {
				uniquePhone += "0";
			}
			phoneInput.sendKeys(uniquePhone);
			System.out.println("Phone number filled successfully: " + uniquePhone);

			// Select Country (India)
			WebElement countrySelect = wait.until(
					ExpectedConditions.presenceOfElementLocated(By.name("country")));
			js.executeScript("$(arguments[0]).val('India').trigger('change');", countrySelect);
			System.out.println("Country selected as India.");
			Thread.sleep(1000);

			// Select State (Rajasthan)
			WebElement stateSelect = wait.until(
					ExpectedConditions.presenceOfElementLocated(By.name("state")));
			js.executeScript("$(arguments[0]).val('Rajasthan').trigger('change');", stateSelect);
			System.out.println("State selected as Rajasthan.");
			Thread.sleep(2000);

			// Select City (Jaipur)
			WebElement citySelect = wait.until(
					ExpectedConditions.presenceOfElementLocated(By.name("city")));
			js.executeScript("$(arguments[0]).val('Jaipur').trigger('change');", citySelect);
			System.out.println("City selected as Jaipur.");
			Thread.sleep(1000);

			// Select Hotel Clarks Amer (Festival Venue) using Select2 trigger
			WebElement hotelSelect = wait.until(
					ExpectedConditions.presenceOfElementLocated(By.name("hotel")));
			js.executeScript("$(arguments[0]).val('Clarks Amer (Festival Venue)').trigger('change');", hotelSelect);
			System.out.println("Selected Clarks Amer hotel. Waiting 5s for AJAX...");
			Thread.sleep(5000);

			// Select Check In Date = 13 (which is 13-01-2027)
			WebElement checkInSelect = wait.until(
					ExpectedConditions.presenceOfElementLocated(By.name("check_in")));
			js.executeScript("$(arguments[0]).val('13').trigger('change');", checkInSelect);
			System.out.println("Selected Check In date as 13.");
			Thread.sleep(3000);

			// Select Check Out Date containing 16-01-2027
			js.executeScript("$('.check_out').val($('.check_out option:contains(\"16-01-2027\")').val()).trigger('change');");
			System.out.println("Selected Check Out date as 16.");
			Thread.sleep(3000);

			// Set Single Occupancy room qty to 1
			js.executeScript("$('input.hotel_room1').val('1');");
			System.out.println("Set Single Occupancy room quantity to 1.");

			// Click Add room button
			WebElement addRoomBtn = wait.until(
					ExpectedConditions.elementToBeClickable(
							By.cssSelector("button.add-hotel-btn[data-roomid='1']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", addRoomBtn);
			try {
				addRoomBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", addRoomBtn);
			}
			System.out.println("Clicked Add Room button. Waiting 5s for cart update...");
			Thread.sleep(5000);

			// Click Checkout button in the cart
			WebElement checkoutBtn = wait.until(
					ExpectedConditions.elementToBeClickable(
							By.cssSelector("#cartSection a.booknow-btn")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", checkoutBtn);
			try {
				checkoutBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", checkoutBtn);
			}
			System.out.println("Clicked Checkout button.");

			// Wait for FOFBooking page to load
			wait.until(ExpectedConditions.urlContains("/FOFBooking"));
			System.out.println("Navigated to FOF Booking (add-ons) page.");

			// Click Plus button to add FOF ticket package
			WebElement plusBtn = wait.until(
					ExpectedConditions.elementToBeClickable(By.cssSelector("button.add-cart[data-type='plus']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", plusBtn);
			try {
				plusBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", plusBtn);
			}
			System.out.println("FOF package added.");
			Thread.sleep(5000);

			// Click Continue button on FOFBooking page
			WebElement continueBtn = wait.until(
					ExpectedConditions.presenceOfElementLocated(By.cssSelector("div.checkout_btn a.booknow-btn")));
			wait.until(ExpectedConditions.not(ExpectedConditions.attributeContains(continueBtn, "class", "disabled")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", continueBtn);
			try {
				continueBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", continueBtn);
			}
			System.out.println("Continue button clicked.");

			// Wait for addFOFAttendees page to load
			wait.until(ExpectedConditions.urlContains("/addFOFAttendees"));
			System.out.println("Navigated to FOF Attendees form page successfully.");

			// Select 15 Jan checkbox
			WebElement checkbox15 = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("input[name='attendee[61][festival_dates][]'][value='15']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", checkbox15);
			if (!checkbox15.isSelected()) {
				js.executeScript("arguments[0].click();", checkbox15);
				System.out.println("15 Jan checkbox selected successfully.");
			}

			// Fill Age Group dynamically
			WebElement ageGroupSelect = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("select[name='attendee[61][age_group]']")));
			js.executeScript("$(arguments[0]).val($(arguments[0]).find('option').eq(1).val()).trigger('change');", ageGroupSelect);
			System.out.println("Age Group selected.");

			// Select City (Jaipur) programmatically
			WebElement citySelect2 = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("select[name='attendee[61][city]']")));
			js.executeScript("$(arguments[0]).val('Jaipur').trigger('change');", citySelect2);
			System.out.println("City selected as Jaipur.");

			// Select Gender (Male) programmatically
			WebElement genderSelect = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("select[name='attendee[61][gender]']")));
			js.executeScript("$(arguments[0]).val('Male').trigger('change');", genderSelect);
			System.out.println("Gender selected as Male.");

			// Select Designation dynamically
			WebElement designationSelect = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("select[name='attendee[61][designation]']")));
			js.executeScript("$(arguments[0]).val($(arguments[0]).find('option').eq(1).val()).trigger('change');", designationSelect);
			System.out.println("Designation selected.");

			// Select Hear About Us dynamically
			WebElement hearAboutUsSelect = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("select[name='attendee[61][hear_about_us]']")));
			js.executeScript("$(arguments[0]).val($(arguments[0]).find('option').eq(1).val()).trigger('change');", hearAboutUsSelect);
			System.out.println("Hear about us selected.");

			// Select Interest in Attending dynamically
			WebElement interestSelect = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("select[name='attendee[61][interest_in_attending][]']")));
			js.executeScript("$(arguments[0]).val([$(arguments[0]).find('option').eq(1).val()]).trigger('change');", interestSelect);
			System.out.println("Interest in attending selected.");

			// Upload Profile Photo
			WebElement fileInput = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("input[type='file'][name='attendee[61][image]']")));
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

			// Click Save to continue
			WebElement saveBtn = wait.until(
					ExpectedConditions.elementToBeClickable(By.cssSelector("button.submit-btn")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", saveBtn);
			try {
				saveBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", saveBtn);
			}
			System.out.println("Save to continue button clicked.");
			Thread.sleep(5000);

			// Click Checkout button
			WebElement checkoutBtn2 = wait.until(
					ExpectedConditions.presenceOfElementLocated(By.cssSelector("div.checkout_btn a.booknow-btn")));
			wait.until(ExpectedConditions.not(ExpectedConditions.attributeContains(checkoutBtn2, "class", "disabled")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", checkoutBtn2);
			try {
				checkoutBtn2.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", checkoutBtn2);
			}
			System.out.println("Checkout button clicked.");

			// Wait for checkout page to load
			wait.until(ExpectedConditions.urlContains("/checkout/"));
			System.out.println("Navigated to checkout page successfully.");
			Thread.sleep(5000);

			// Enter coupon code via JS
			js.executeScript("$('.coupon_input').val('fof1');");
			System.out.println("Promo code fof1 entered.");

			// Click Apply via JS
			WebElement applyBtn = wait.until(
					ExpectedConditions.elementToBeClickable(By.cssSelector("button.btn-coupon-apply")));
			js.executeScript("arguments[0].click();", applyBtn);
			System.out.println("Apply clicked.");
			Thread.sleep(5000);

			// Take a screenshot of the checkout page
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

		} finally {
			driver.quit();
		}
	}
}
