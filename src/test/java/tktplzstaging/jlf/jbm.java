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

public class jbm {

	public static void main(String[] args) throws InterruptedException {

		WebDriver driver = new ChromeDriver();
		driver.manage().window().maximize();

		try {
			// Open JBM 2027 landing page
			driver.get("https://staging-registration.dreamcast.in/jbm2027/");
			WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));
			JavascriptExecutor js = (JavascriptExecutor) driver;

			// Locate and click Book Now button for JBM Delegate
			WebElement bookNowBtn = wait.until(
					ExpectedConditions.elementToBeClickable(
							By.xpath("//a[contains(@href, 'ticketBookings/JBMDelegate')]")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", bookNowBtn);
			try {
				bookNowBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", bookNowBtn);
			}
			System.out.println("Navigated to JBMDelegate ticket booking page.");

			// Wait for booking page URL
			wait.until(ExpectedConditions.urlContains("/ticketBookings/"));

			// Click + button to add 1 ticket
			WebElement plusBtn = wait.until(
					ExpectedConditions.elementToBeClickable(
							By.xpath("//button[contains(@class,'add-cart') and @data-type='plus']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", plusBtn);
			try {
				plusBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", plusBtn);
			}
			System.out.println("Clicked plus button to add 1 ticket.");

			// Locate Continue / Book Now button and wait until enabled
			WebElement continueBtn = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("a.booknow-btn")));
			wait.until(ExpectedConditions.not(ExpectedConditions.attributeContains(continueBtn, "class", "disabled")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", continueBtn);
			try {
				continueBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", continueBtn);
			}
			System.out.println("Continue button clicked successfully.");

			// Wait for attendee form page to load
			wait.until(ExpectedConditions.urlContains("/addAttendees/"));
			System.out.println("Attendee page loaded successfully: " + driver.getCurrentUrl());

			// Select first available festival date checkbox if present
			try {
				WebElement dateCheckbox = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("input[type='checkbox'][name*='[festival_dates][]']")));
				js.executeScript("arguments[0].scrollIntoView({block:'center'});", dateCheckbox);
				if (!dateCheckbox.isSelected()) {
					js.executeScript("arguments[0].click();", dateCheckbox);
					System.out.println("Festival date checkbox selected successfully.");
				} else {
					System.out.println("Festival date checkbox was already selected.");
				}
			} catch (Exception e) {
				System.out.println("No festival date checkbox found or needed: " + e.getMessage());
			}

			// Locate and fill Attendee Name
			WebElement nameInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(
							By.cssSelector("input[name^='attendee['][name$='[name]']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", nameInput);
			nameInput.clear();
			nameInput.sendKeys("Amrinder Singh");
			System.out.println("Attendee Name filled successfully.");

			// Locate and fill Attendee Email
			WebElement emailInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(
							By.cssSelector("input[name^='attendee['][name$='[email]']")));
			emailInput.clear();
			String uniqueEmail = "amrinder+" + System.currentTimeMillis() + "@dreamcast.co";
			emailInput.sendKeys(uniqueEmail);
			System.out.println("Attendee Email filled successfully: " + uniqueEmail);

			// Locate and fill Attendee Phone number
			WebElement phoneInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(
							By.cssSelector("input[name^='attendee['][name$='[phone]']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", phoneInput);
			phoneInput.clear();
			String uniquePhone = "6350415261";
			phoneInput.sendKeys(uniquePhone);
			System.out.println("Attendee Phone number filled successfully: " + uniquePhone);

			// Select Age Group dynamically (first option index 1)
			try {
				WebElement ageGroupSelect = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("select[name^='attendee['][name$='[age_group]']")));
				js.executeScript("$(arguments[0]).val($(arguments[0]).find('option').eq(1).val()).trigger('change');", ageGroupSelect);
				System.out.println("Age Group selected dynamically.");
			} catch (Exception e) {
				System.out.println("Age Group selection skipped: " + e.getMessage());
			}

			// Select Country (India) - Only trigger change if not already India, avoiding AJAX reset of state dropdown
			try {
				WebElement countrySelect = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("select[name^='attendee['][name$='[country]']")));
				String currentCountryVal = (String) js.executeScript("return $(arguments[0]).val();", countrySelect);
				if (!"India".equalsIgnoreCase(currentCountryVal)) {
					js.executeScript("$(arguments[0]).val('India').trigger('change');", countrySelect);
					Thread.sleep(1500);
					System.out.println("Country selected as India programmatically.");
				} else {
					System.out.println("Country is already India by default.");
				}
			} catch (Exception e) {
				System.out.println("Country selection skipped: " + e.getMessage());
			}

			// Select State (Rajasthan) - Wait for Rajasthan option to be present in state dropdown
			try {
				wait.until(ExpectedConditions.presenceOfElementLocated(
						By.xpath("//select[contains(@name, '[state]')]//option[@value='Rajasthan' or text()='Rajasthan']")));
				WebElement stateSelect = driver.findElement(By.cssSelector("select[name^='attendee['][name$='[state]']"));
				js.executeScript("$(arguments[0]).val('Rajasthan').trigger('change');", stateSelect);
				System.out.println("State selected as Rajasthan programmatically.");
			} catch (Exception e) {
				System.out.println("State selection fallback: " + e.getMessage());
				try {
					WebElement stateSelect = driver.findElement(By.cssSelector("select[name^='attendee['][name$='[state]']"));
					js.executeScript("$(arguments[0]).val($(arguments[0]).find('option').eq(1).val()).trigger('change');", stateSelect);
				} catch (Exception ignored) {}
			}

			// Select City (Jaipur) - Wait for Jaipur option to load via AJAX after state selection
			try {
				wait.until(ExpectedConditions.presenceOfElementLocated(
						By.xpath("//select[contains(@name, '[city]')]//option[@value='Jaipur' or text()='Jaipur']")));
				WebElement citySelect = driver.findElement(By.cssSelector("select[name^='attendee['][name$='[city]']"));
				js.executeScript("$(arguments[0]).val('Jaipur').trigger('change');", citySelect);
				System.out.println("City selected as Jaipur programmatically.");
			} catch (Exception e) {
				System.out.println("City selection fallback: " + e.getMessage());
				try {
					WebElement citySelect = driver.findElement(By.cssSelector("select[name^='attendee['][name$='[city]']"));
					js.executeScript("$(arguments[0]).val($(arguments[0]).find('option').eq(1).val()).trigger('change');", citySelect);
				} catch (Exception ignored) {}
			}

			// Select Gender (Male)
			try {
				WebElement genderSelect = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("select[name^='attendee['][name$='[gender]']")));
				js.executeScript("$(arguments[0]).val('Male').trigger('change');", genderSelect);
				System.out.println("Gender selected as Male programmatically.");
			} catch (Exception e) {
				System.out.println("Gender selection skipped: " + e.getMessage());
			}

			// Select Occupation dynamically
			try {
				WebElement occupationSelect = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("select[name^='attendee['][name$='[occupation]']")));
				js.executeScript("$(arguments[0]).val($(arguments[0]).find('option').eq(1).val()).trigger('change');", occupationSelect);
				System.out.println("Occupation selected dynamically.");
			} catch (Exception e) {
				System.out.println("Occupation field skipped: " + e.getMessage());
			}

			// Fill Organization
			try {
				WebElement orgInput = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("input[name^='attendee['][name$='[organization]']")));
				orgInput.clear();
				orgInput.sendKeys("Dreamcast");
				System.out.println("Organization filled successfully.");
			} catch (Exception e) {
				System.out.println("Organization field skipped: " + e.getMessage());
			}

			// Select Hear About Us dynamically
			try {
				WebElement hearAboutUsSelect = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("select[name^='attendee['][name$='[hear_about_us]']")));
				js.executeScript("$(arguments[0]).val($(arguments[0]).find('option').eq(1).val()).trigger('change');", hearAboutUsSelect);
				System.out.println("Hear about us selected dynamically.");
			} catch (Exception e) {
				System.out.println("Hear about us skipped: " + e.getMessage());
			}

			// Upload Profile Photo if present
			try {
				WebElement fileInput = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("input[type='file'][name^='attendee['][name$='[image]']")));
				js.executeScript("arguments[0].scrollIntoView({block:'center'});", fileInput);
				File uploadFile = new File("profile_photo.jpg");
				fileInput.sendKeys(uploadFile.getAbsolutePath());
				System.out.println("Profile photo uploaded.");

				// Wait for crop modal to show
				wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("modal_profile")));
				System.out.println("Crop modal is visible.");

				// Wait for cropper_profile to be initialized
				Thread.sleep(1500);
				try {
					new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> 
						((JavascriptExecutor) d).executeScript("return typeof cropper_profile !== 'undefined' && cropper_profile !== null;") == Boolean.TRUE
					);
				} catch (Exception ignored) {}

				// Click crop button
				WebElement cropBtn = wait.until(
						ExpectedConditions.elementToBeClickable(By.id("crop_profile")));
				try {
					cropBtn.click();
				} catch (Exception exCrop) {
					js.executeScript("arguments[0].click();", cropBtn);
				}
				System.out.println("Crop button clicked.");

				// Wait for modal to close or upload preview to appear
				WebDriverWait uploadWait = new WebDriverWait(driver, Duration.ofSeconds(45));
				try {
					uploadWait.until(ExpectedConditions.or(
						ExpectedConditions.invisibilityOfElementLocated(By.id("modal_profile")),
						ExpectedConditions.visibilityOfElementLocated(By.cssSelector("div[id^='previewimage_']"))
					));
					System.out.println("Crop modal closed / upload completed.");
				} catch (Exception e) {
					System.out.println("Wait for modal invisibility / preview timed out: " + e.getMessage());
					js.executeScript("if (window.$ && $('#modal_profile').length) { $('#modal_profile').modal('hide'); $('.modal-backdrop').remove(); $('body').removeClass('modal-open'); }");
				}
				js.executeScript("if (!$('#modal_profile').hasClass('show')) { $('.modal-backdrop').remove(); $('body').removeClass('modal-open'); }");
				Thread.sleep(3000);
			} catch (Exception e) {
				System.out.println("Profile photo upload skipped or not required: " + e.getMessage());
			}

			// Locate and select Privacy Policy checkbox
			try {
				WebElement privacyCheckbox = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("input[type='checkbox'][name*='[privacy_check]'], input.dc-checkbox[type='checkbox']")));
				js.executeScript("arguments[0].scrollIntoView({block:'center'});", privacyCheckbox);
				if (!privacyCheckbox.isSelected()) {
					try {
						privacyCheckbox.click();
					} catch (Exception ex) {
						js.executeScript("arguments[0].click();", privacyCheckbox);
					}
					System.out.println("Privacy policy checkbox selected successfully.");
				} else {
					System.out.println("Privacy policy checkbox was already selected.");
				}
			} catch (Exception e) {
				System.out.println("Standard locator for privacy checkbox failed, trying label fallback: " + e.getMessage());
				try {
					WebElement agreeLabel = driver.findElement(By.xpath("//label[contains(., 'I agree') or contains(., 'privacy') or contains(., 'Privacy')]"));
					js.executeScript("arguments[0].scrollIntoView({block:'center'});", agreeLabel);
					try {
						agreeLabel.click();
					} catch (Exception exClick) {
						js.executeScript("arguments[0].click();", agreeLabel);
					}
					System.out.println("Privacy policy label clicked.");
				} catch (Exception ex2) {
					System.out.println("Could not click privacy checkbox: " + ex2.getMessage());
				}
			}

			// Locate and click Save to continue button
			WebElement saveBtn = wait.until(
					ExpectedConditions.presenceOfElementLocated(By.cssSelector("button.submit-btn")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", saveBtn);
			try {
				saveBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", saveBtn);
			}
			System.out.println("Save to continue button clicked.");

			// Wait for AJAX submission to update checkout button with actual checkout URL
			WebDriverWait checkoutWait = new WebDriverWait(driver, Duration.ofSeconds(25));
			WebElement finalContinueBtn = checkoutWait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.xpath("//div[contains(@class,'checkout_btn')]//a[contains(@href, '/checkout/') or contains(@href, '/hotelBooking/')]")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", finalContinueBtn);
			try {
				finalContinueBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", finalContinueBtn);
			}
			System.out.println("Final Continue / Checkout button clicked.");

			// Wait for URL transition (either /hotelBooking/ or /checkout/)
			wait.until(ExpectedConditions.or(
					ExpectedConditions.urlContains("/hotelBooking/"),
					ExpectedConditions.urlContains("/checkout/")));
			System.out.println("Navigated to next page: " + driver.getCurrentUrl());

			// If hotel booking page appears, click skip
			if (driver.getCurrentUrl().contains("/hotelBooking/")) {
				System.out.println("Navigated to hotel booking page. Skipping hotel...");
				WebElement skipHotelBtn = wait.until(
						ExpectedConditions.elementToBeClickable(By.cssSelector("a.skip_btn")));
				js.executeScript("arguments[0].scrollIntoView({block:'center'});", skipHotelBtn);
				try {
					skipHotelBtn.click();
				} catch (Exception e) {
					js.executeScript("arguments[0].click();", skipHotelBtn);
				}
				System.out.println("No, I don't need a hotel button clicked successfully.");
			}

			// Wait for checkout page
			wait.until(ExpectedConditions.urlContains("/checkout/"));
			System.out.println("Navigated to checkout page: " + driver.getCurrentUrl());

			// Locate and click Pay Securely button
			WebElement paySecurelyBtn = wait.until(
					ExpectedConditions.elementToBeClickable(By.cssSelector("div.checkout_btn a.booknow-btn")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", paySecurelyBtn);
			try {
				paySecurelyBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", paySecurelyBtn);
			}
			System.out.println("Pay Securely button clicked.");

			// Wait for payment page or Razorpay frame
			wait.until(ExpectedConditions.or(
					ExpectedConditions.urlContains("/payments/"),
					ExpectedConditions.urlContains("/razorpay/"),
					ExpectedConditions.presenceOfElementLocated(By.className("razorpay-checkout-frame"))));
			System.out.println("On payment page: " + driver.getCurrentUrl());

			// Handle intermediate payment method selector if present (e.g. Razorpay Domestic option)
			try {
				WebElement razorpayDomesticLabel = new WebDriverWait(driver, Duration.ofSeconds(3)).until(
						ExpectedConditions.elementToBeClickable(
								By.cssSelector("label[for^='payment-method-Razorpay-'][for$='-domestic']")));
				js.executeScript("arguments[0].click();", razorpayDomesticLabel);
				System.out.println("Selected Razorpay Domestic option.");
				Thread.sleep(2000);
				WebElement makePaymentBtn = driver.findElement(By.cssSelector("button.makePayments"));
				js.executeScript("arguments[0].click();", makePaymentBtn);
				System.out.println("Clicked Make Payment button.");
			} catch (Exception ignored) {
				System.out.println("Direct Razorpay gateway loaded (no intermediate payment method selector).");
			}

			// Switch to Razorpay iframe
			WebDriverWait rzpWait = new WebDriverWait(driver, Duration.ofSeconds(25));
			WebElement razorpayIframe = rzpWait.until(
					ExpectedConditions.presenceOfElementLocated(By.className("razorpay-checkout-frame")));
			driver.switchTo().frame(razorpayIframe);
			System.out.println("Switched to Razorpay checkout iframe.");

			// Handle Razorpay V1 style (Show QR -> Continue & Pay) if present
			try {
				WebElement showQrBtn = new WebDriverWait(driver, Duration.ofSeconds(4)).until(
						ExpectedConditions.elementToBeClickable(By.cssSelector("span[name='generateQR']")));
				js.executeScript("arguments[0].scrollIntoView({block:'center'});", showQrBtn);
				try {
					showQrBtn.click();
				} catch (Exception e) {
					js.executeScript("arguments[0].click();", showQrBtn);
				}
				System.out.println("Show QR button clicked.");
				Thread.sleep(4000);

				WebElement continuePayBtn = wait.until(
						ExpectedConditions.elementToBeClickable(
								By.xpath("//button[contains(., 'Continue & Pay') or contains(text(), 'Continue & Pay')]")));
				js.executeScript("arguments[0].scrollIntoView({block:'center'});", continuePayBtn);
				try {
					continuePayBtn.click();
				} catch (Exception e) {
					js.executeScript("arguments[0].click();", continuePayBtn);
				}
				System.out.println("Continue & Pay button clicked.");
			} catch (Exception e) {
				System.out.println("Razorpay V2 / direct QR display mode active.");
			}

			// Switch back to default content to take screenshot
			driver.switchTo().defaultContent();

			// Wait 5 seconds for QR code display
			Thread.sleep(5000);

			// Take final screenshot
			try {
				File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
				java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("passed_jbm.png"),
						java.nio.file.StandardCopyOption.REPLACE_EXISTING);
				java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("passed.png"),
						java.nio.file.StandardCopyOption.REPLACE_EXISTING);
				System.out.println("QR Code screen screenshot saved to passed_jbm.png and passed.png");
			} catch (Exception e) {
				System.out.println("Failed to take final screenshot: " + e.getMessage());
			}

		} catch (Exception e) {
			System.out.println("Exception in jbm: " + e.getMessage());
			e.printStackTrace();
			throw e;
		} finally {
			driver.quit();
		}
	}
}
