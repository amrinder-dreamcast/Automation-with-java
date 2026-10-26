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

public class fofRegwithhotel {

	public static void main(String[] args) throws InterruptedException {
		WebDriver driver = new ChromeDriver();
		driver.manage().window().maximize();

		try {
			// Open website
			driver.get("https://staging-registration.dreamcast.in/jlf2027/");

			WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));

			// Locate Friend of the Festival radio button
			WebElement friendOfFestivalRadio = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.xpath("//div[contains(@class,'FriendoftheFestival')]//input[@type='radio']")));

			// Scroll to element and click radio button
			((JavascriptExecutor) driver).executeScript(
					"arguments[0].scrollIntoView({block:'center'});",
					friendOfFestivalRadio);
			try {
				friendOfFestivalRadio.click();
			} catch (Exception e) {
				System.out.println("Standard click on Friend of Festival radio intercepted, using JavaScript click fallback: " + e.getMessage());
				((JavascriptExecutor) driver).executeScript("arguments[0].click();", friendOfFestivalRadio);
			}
			if (!friendOfFestivalRadio.isSelected()) {
				((JavascriptExecutor) driver).executeScript("arguments[0].checked = true; $(arguments[0]).trigger('change');", friendOfFestivalRadio);
			}

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

			// Locate the actual + button
			WebElement plusBtn = wait2.until(
					ExpectedConditions.elementToBeClickable(
							By.xpath(
									"//button[contains(@class,'add-cart') and @data-type='plus' and @data-slug='FriendoftheFestival']")));

			// Scroll to it
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", plusBtn);

			// Click + to add 1 ticket robustly
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
			try {
				continueBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", continueBtn);
			}

			System.out.println("Continue button clicked successfully.");

			// Select 17 Jan and 18 Jan festival dates
			WebElement checkbox17 = wait2.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("input.festival_dates[value='17'], input[name*='[festival_dates][]'][value='17']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", checkbox17);
			if (!checkbox17.isSelected()) {
				js.executeScript("arguments[0].click();", checkbox17);
				System.out.println("17 Jan checkbox selected successfully.");
			} else {
				System.out.println("17 Jan checkbox was already selected.");
			}
			Thread.sleep(1000);

			WebElement checkbox18 = wait2.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("input.festival_dates[value='18'], input[name*='[festival_dates][]'][value='18']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", checkbox18);
			if (!checkbox18.isSelected()) {
				js.executeScript("arguments[0].click();", checkbox18);
				System.out.println("18 Jan checkbox selected successfully.");
			} else {
				System.out.println("18 Jan checkbox was already selected.");
			}
			Thread.sleep(1000);

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
			String uniqueEmail = "amrinder+" + System.currentTimeMillis() + "@dreamcast.co";
			emailInput.sendKeys(uniqueEmail);
			System.out.println("Attendee Email filled successfully: " + uniqueEmail);

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

			// Select Age Group (25-34 Years) using Select2
			WebElement ageDropdownTrigger = wait2.until(
					ExpectedConditions.elementToBeClickable(
							By.cssSelector("span.select2-selection[aria-labelledby*='age_group']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", ageDropdownTrigger);
			try {
				ageDropdownTrigger.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", ageDropdownTrigger);
			}

			WebElement ageOption = wait2.until(
					ExpectedConditions.elementToBeClickable(
							By.xpath("//li[contains(@class, 'select2-results__option') and contains(text(), '25-34')]")));
			try {
				ageOption.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", ageOption);
			}
			System.out.println("Age group selected successfully.");

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
				try {
					countryDropdownTrigger.click();
				} catch (Exception e) {
					js.executeScript("arguments[0].click();", countryDropdownTrigger);
				}

				WebElement countryOption = wait2.until(
						ExpectedConditions.elementToBeClickable(
								By.xpath(
										"//li[contains(@class, 'select2-results__option') and (text()='India' or contains(text(), 'India'))]")));
				try {
					countryOption.click();
				} catch (Exception e) {
					js.executeScript("arguments[0].click();", countryOption);
				}
				System.out.println("Country selected as India.");
			} else {
				System.out.println("Country is already selected as India. Skipping click.");
			}

			// Select State (Rajasthan) using Select2 only if it is not already selected as Rajasthan
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
				try {
					stateDropdownTrigger.click();
				} catch (Exception e) {
					js.executeScript("arguments[0].click();", stateDropdownTrigger);
				}

				WebElement stateOption = wait2.until(
						ExpectedConditions.elementToBeClickable(
								By.xpath(
										"//li[contains(@class, 'select2-results__option') and (text()='Rajasthan' or contains(text(), 'Rajasthan'))]")));
				try {
					stateOption.click();
				} catch (Exception e) {
					js.executeScript("arguments[0].click();", stateOption);
				}
				System.out.println("State selected as Rajasthan.");
			} else {
				System.out.println("State is already selected as Rajasthan. Skipping click.");
			}

			// Wait for the City dropdown to populate and contain the "Jaipur" option
			wait2.until(ExpectedConditions.presenceOfElementLocated(
					By.xpath("//select[contains(@name, '[city]')]//option[text()='Jaipur' or @value='Jaipur']")));

			// Select City (Jaipur) programmatically using Select2's jQuery trigger
			WebElement citySelect = driver.findElement(By.cssSelector("select[name^='attendee['][name$='[city]']"));
			js.executeScript("$(arguments[0]).val('Jaipur').trigger('change');", citySelect);
			System.out.println("City selected as Jaipur programmatically.");

			// Select Gender (Male) programmatically using Select2's jQuery trigger
			WebElement genderSelect = wait2.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("select[name^='attendee['][name$='[gender]']")));
			js.executeScript("$(arguments[0]).val('Male').trigger('change');", genderSelect);
			System.out.println("Gender selected as Male programmatically.");

			// Locate the Occupation (Designation) select dropdown dynamically
			WebElement designationSelect = wait2.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("select[name^='attendee['][name$='[designation]']")));

			// Scroll to it
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", designationSelect);

			// Select Occupation programmatically using Select2's jQuery trigger
			js.executeScript("$(arguments[0]).val('Self-Employed Professional').trigger('change');", designationSelect);
			System.out.println("Occupation (Designation) selected as Self-Employed Professional programmatically.");

			// Select How did you hear about us (Instagram) programmatically using Select2's jQuery trigger
			WebElement hearAboutUsSelect = wait2.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("select[name^='attendee['][name$='[hear_about_us]']")));
			js.executeScript("$(arguments[0]).val('Instagram').trigger('change');", hearAboutUsSelect);
			System.out.println("Hear about us selected as Instagram programmatically.");

			// Select Interest in attending (Authors/ Books) programmatically using Select2's jQuery trigger
			WebElement interestSelect = wait2.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("select[name^='attendee['][name$='[interest_in_attending][]']")));
			js.executeScript("$(arguments[0]).val(['Authors/ Books']).trigger('change');", interestSelect);
			System.out.println("Interest in attending selected as Authors/ Books programmatically.");

			// Locate the file input for profile photo dynamically
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
			wait2.until(ExpectedConditions.visibilityOfElementLocated(By.id("modal_profile")));
			System.out.println("Crop modal is visible.");

			// Locate the Crop button
			WebElement cropBtn = wait2.until(
					ExpectedConditions.elementToBeClickable(By.id("crop_profile")));

			// Click the Crop button
			try {
				cropBtn.click();
			} catch (Exception e) {
				System.out.println("Standard click on Crop button failed, trying JavaScript click fallback.");
				js.executeScript("arguments[0].click();", cropBtn);
			}
			System.out.println("Crop button clicked successfully.");

			// Wait for the preview image to be displayed
			try {
				wait2.until(ExpectedConditions.visibilityOfElementLocated(
								By.cssSelector("div[id^='previewimage_']")));
				System.out.println("Profile photo preview is displayed (upload completed).");
			} catch (Exception e) {
				System.out.println("Preview div did not become visible, waiting 5 seconds instead.");
				Thread.sleep(5000);
			}

			// Locate and select the "I agree" Privacy Policy checkbox
			try {
				WebElement privacyCheckbox = wait2.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("input[type='checkbox'][name*='[privacy_check]'], input.dc-checkbox[type='checkbox']")));
				js.executeScript("arguments[0].scrollIntoView({block:'center'});", privacyCheckbox);
				if (!privacyCheckbox.isSelected()) {
					try {
						privacyCheckbox.click();
					} catch (Exception ex) {
						js.executeScript("arguments[0].click();", privacyCheckbox);
					}
					System.out.println("Privacy policy 'I agree' checkbox selected successfully.");
				} else {
					System.out.println("Privacy policy 'I agree' checkbox was already selected.");
				}
			} catch (Exception e) {
				System.out.println("Standard locator for privacy checkbox failed, trying label fallback: " + e.getMessage());
				try {
					WebElement agreeLabel = driver.findElement(By.xpath("//label[contains(., 'I agree')]"));
					js.executeScript("arguments[0].scrollIntoView({block:'center'});", agreeLabel);
					try {
						agreeLabel.click();
					} catch (Exception exClick) {
						js.executeScript("arguments[0].click();", agreeLabel);
					}
					System.out.println("Privacy policy 'I agree' label clicked.");
				} catch (Exception ex2) {
					System.out.println("Could not click 'I agree' checkbox: " + ex2.getMessage());
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
			Thread.sleep(5000);

			// Locate the final Continue button in the Order Summary section
			WebElement finalContinueBtn = wait2.until(
					ExpectedConditions.elementToBeClickable(
							By.cssSelector("div.checkout_btn a.booknow-btn")));

			// Wait until enabled (no disabled class)
			wait2.until(ExpectedConditions.not(ExpectedConditions.attributeContains(finalContinueBtn, "class", "disabled")));
			String targetHotelUrl = finalContinueBtn.getAttribute("href");

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

			// Wait for navigation or fallback
			Thread.sleep(3000);
			if (driver.getCurrentUrl() != null && !driver.getCurrentUrl().contains("/hotelBooking/")) {
				if (targetHotelUrl != null && targetHotelUrl.contains("/hotelBooking/")) {
					driver.get(targetHotelUrl);
				}
			}

			// Wait for the navigation to the hotel booking page to complete
			wait2.until(ExpectedConditions.urlContains("/hotelBooking/"));
			System.out.println("Navigated to hotel booking page successfully: " + driver.getCurrentUrl());

			// Select hotel from dropdown (The Lalit (5 Star) or Hotel Clarks Amer)
			try {
				WebElement hotelDropdown = wait.until(
						ExpectedConditions.elementToBeClickable(
								By.cssSelector("span.select2-selection[aria-labelledby*='hotel'], span.select2-selection")));
				js.executeScript("arguments[0].scrollIntoView({block:'center'});", hotelDropdown);
				try {
					hotelDropdown.click();
				} catch (Exception clickEx) {
					js.executeScript("arguments[0].click();", hotelDropdown);
				}
				System.out.println("Hotel dropdown opened.");

				wait.until(ExpectedConditions.visibilityOfElementLocated(
						By.cssSelector("ul.select2-results__options")));

				WebElement hotelOption = wait.until(
						ExpectedConditions.elementToBeClickable(
								By.xpath("//li[contains(@class, 'select2-results__option') and not(text()='Select Hotel') and (contains(text(), 'The Lalit') or contains(text(), 'Clarks Amer'))]")));
				String selectedHotelName = hotelOption.getText();
				try {
					hotelOption.click();
				} catch (Exception clickOptEx) {
					js.executeScript("arguments[0].click();", hotelOption);
				}
				System.out.println("Selected hotel from dropdown: " + selectedHotelName);
			} catch (Exception e) {
				System.out.println("Select2 UI click failed, trying programmatic dropdown selection fallback: " + e.getMessage());
				WebElement hotelSelect = wait2.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("select[name='hotel']")));
				js.executeScript(
						"var optionVal = $(arguments[0]).find('option[value*=\"The Lalit\"], option[value*=\"Clarks Amer\"], option:not([value=\"\"])').first().val();"
						+ "$(arguments[0]).val(optionVal).trigger('change');", hotelSelect);
				System.out.println("Selected hotel via programmatic fallback.");
			}
			System.out.println("Waiting 5s for hotel rooms AJAX to load...");
			Thread.sleep(5000);

			// Select Check In Date = 13 (which is 13-01-2027)
			WebElement checkInSelect = wait2.until(
					ExpectedConditions.presenceOfElementLocated(By.cssSelector("select[name='check_in']")));
			js.executeScript("$(arguments[0]).val('13').trigger('change');", checkInSelect);
			System.out.println("Selected Check In date as 13.");
			Thread.sleep(3000);

			// Select Check Out Date containing 16-01-2027
			js.executeScript("$('.check_out').val($('.check_out option:contains(\"16-01-2027\")').val()).trigger('change');");
			System.out.println("Selected Check Out date as 16.");
			Thread.sleep(3000);

			// Select Airport to Hotel Transfer = no
			try {
				WebElement airportTransferSelect = driver.findElement(By.cssSelector("select[name='airport_to_hotel_transfer']"));
				js.executeScript("$(arguments[0]).val('no').trigger('change');", airportTransferSelect);
				System.out.println("Selected Airport transfer as no.");
				Thread.sleep(2000);
			} catch (Exception ex) {
				System.out.println("Airport transfer element not found or not required: " + ex.getMessage());
			}

			// Set room quantity to 1
			js.executeScript("$('input.hotel_room1, input[class*=\"hotel_room\"]').first().val('1');");
			System.out.println("Set Single Occupancy room quantity to 1.");

			// Click Add room button
			WebElement addRoomBtn = wait2.until(
					ExpectedConditions.elementToBeClickable(
							By.cssSelector("button.add-hotel-btn[data-roomid='1'], button.add-hotel-btn")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", addRoomBtn);
			try {
				addRoomBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", addRoomBtn);
			}
			System.out.println("Clicked Add Room button. Waiting 5s for cart update...");
			Thread.sleep(5000);

			// Click Checkout button in the cart
			WebElement checkoutBtn = wait2.until(
					ExpectedConditions.elementToBeClickable(
							By.cssSelector("#cartSection a.booknow-btn, div.checkout_btn a.booknow-btn, a.booknow-btn")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", checkoutBtn);
			try {
				checkoutBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", checkoutBtn);
			}
			System.out.println("Clicked Checkout button on hotel booking page.");

			// Wait for either selectAddons page or checkout page
			wait2.until(ExpectedConditions.or(
					ExpectedConditions.urlContains("/selectAddons/"),
					ExpectedConditions.urlContains("/checkout/")));

			// Handle Add-ons selection if on selectAddons page
			if (driver.getCurrentUrl() != null && driver.getCurrentUrl().contains("/selectAddons/")) {
				System.out.println("Navigated to selectAddons page successfully: " + driver.getCurrentUrl());

				// Select both add-ons for 17 and 18 date:
				// 1. The Heritage Evening at Amber Fort (17th January)
				// 2. The Festival Closing Writers' Ball (18th January)
				java.util.List<WebElement> addonCheckboxes = wait2.until(
						ExpectedConditions.presenceOfAllElementsLocatedBy(
								By.cssSelector("input.addon-assign-checkbox, input[type='checkbox'][data-addon-id]")));
				System.out.println("Found " + addonCheckboxes.size() + " add-on checkbox(es).");

				for (WebElement addonCb : addonCheckboxes) {
					js.executeScript("arguments[0].scrollIntoView({block:'center'});", addonCb);
					if (!addonCb.isSelected()) {
						try {
							addonCb.click();
						} catch (Exception ex) {
							js.executeScript("arguments[0].click();", addonCb);
						}
						System.out.println("Selected add-on checkbox (addon-id: " + addonCb.getAttribute("data-addon-id") + ").");
						Thread.sleep(2000);
					} else {
						System.out.println("Add-on checkbox was already selected (addon-id: " + addonCb.getAttribute("data-addon-id") + ").");
					}
				}

				// Wait 3 seconds for cart to reflect both add-ons
				Thread.sleep(3000);

				// Click Checkout button on the selectAddons page
				WebElement addonCheckoutBtn = wait2.until(
						ExpectedConditions.elementToBeClickable(
								By.cssSelector("#cartSection a.booknow-btn, div.checkout_btn a.booknow-btn, a.booknow-btn")));
				js.executeScript("arguments[0].scrollIntoView({block:'center'});", addonCheckoutBtn);
				try {
					addonCheckoutBtn.click();
				} catch (Exception e) {
					System.out.println("Standard click on Add-ons Checkout failed, trying JavaScript click fallback.");
					js.executeScript("arguments[0].click();", addonCheckoutBtn);
				}
				System.out.println("Clicked Checkout button on Add-ons page.");

				// Wait for checkout page to load
				wait2.until(ExpectedConditions.urlContains("/checkout/"));
			}
			System.out.println("Navigated to checkout page successfully: " + driver.getCurrentUrl());

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
			Thread.sleep(5000);

			// Take a screenshot of applied coupon
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

			// Take a final screenshot of Payment portal page
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

			// Locate Show QR button
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

		} finally {
			driver.quit();
		}
	}
}
