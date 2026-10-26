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
			driver.get("https://staging-registration.dreamcast.in/jlf2027/");

			WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));
			JavascriptExecutor js = (JavascriptExecutor) driver;

			// Locate Book your Festival Hotel radio button
			WebElement hotelRadio = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("div.hotelWithFOF input[type='radio'], #flexRadioDefault2")));

			// Scroll and click radio button
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", hotelRadio);
			try {
				hotelRadio.click();
			} catch (Exception e) {
				System.out.println("Standard click on hotel radio intercepted, using JavaScript click fallback: " + e.getMessage());
				js.executeScript("arguments[0].click();", hotelRadio);
			}
			if (!hotelRadio.isSelected()) {
				js.executeScript("arguments[0].checked = true; $(arguments[0]).trigger('change');", hotelRadio);
			}
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

			// Fill Phone
			WebElement phoneInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.name("phone")));
			phoneInput.clear();
			String uniquePhone = "6350415261";
			phoneInput.sendKeys(uniquePhone);
			System.out.println("Phone number filled successfully: " + uniquePhone);

			// Select Country (India) if not already selected
			try {
				WebElement selectedCountrySpan = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("span.select2-selection[aria-labelledby*='country'] span.select2-selection__rendered")));
				String currentCountry = selectedCountrySpan.getText();
				if (!"India".equalsIgnoreCase(currentCountry.trim())) {
					WebElement countrySelect = wait.until(
							ExpectedConditions.presenceOfElementLocated(By.name("country")));
					js.executeScript("$(arguments[0]).find('option[value=\"India\"]').prop('selected', true);"
							+ "$(arguments[0]).val('India').trigger('change');", countrySelect);
					System.out.println("Country selected as India.");
					Thread.sleep(1500);
				} else {
					System.out.println("Country is already selected as India.");
				}
			} catch (Exception e) {
				System.out.println("Country check fallback: " + e.getMessage());
				js.executeScript("$('select[name=\"country\"]').find('option[value=\"India\"]').prop('selected', true);"
						+ "$('select[name=\"country\"]').val('India').trigger('change');");
				Thread.sleep(1500);
			}

			// Wait for State options to load, then select Rajasthan
			wait.until(driver1 -> ((JavascriptExecutor) driver1).executeScript(
					"return $('select[name=\"state\"] option[value=\"Rajasthan\"]').length > 0;").equals(true));
			try {
				// Open Select2 dropdown and click Rajasthan
				js.executeScript("$('select[name=\"state\"]').select2('open');");
				WebElement stateOption = wait.until(
						ExpectedConditions.elementToBeClickable(
								By.xpath("//li[contains(@class, 'select2-results__option') and normalize-space()='Rajasthan']")));
				try {
					stateOption.click();
				} catch (Exception ex) {
					js.executeScript("arguments[0].click();", stateOption);
				}
				System.out.println("Selected State (Rajasthan) via Select2.");
			} catch (Exception e) {
				System.out.println("Select2 UI click for State failed, using programmatic fallback: " + e.getMessage());
				WebElement stateSelect = wait.until(
						ExpectedConditions.presenceOfElementLocated(By.name("state")));
				js.executeScript(
						"$(arguments[0]).find('option[value=\"Rajasthan\"]').prop('selected', true);"
						+ "$(arguments[0]).val('Rajasthan').trigger('change');", stateSelect);
				System.out.println("Selected State (Rajasthan) programmatically.");
			}
			Thread.sleep(2000);

			// Wait for City options to load, then select Jaipur
			wait.until(driver1 -> ((JavascriptExecutor) driver1).executeScript(
					"return $('select[name=\"city\"] option[value=\"Jaipur\"]').length > 0;").equals(true));
			try {
				// Open Select2 dropdown and click Jaipur
				js.executeScript("$('select[name=\"city\"]').select2('open');");
				WebElement cityOption = wait.until(
						ExpectedConditions.elementToBeClickable(
								By.xpath("//li[contains(@class, 'select2-results__option') and normalize-space()='Jaipur']")));
				try {
					cityOption.click();
				} catch (Exception ex) {
					js.executeScript("arguments[0].click();", cityOption);
				}
				System.out.println("Selected City (Jaipur) via Select2.");
			} catch (Exception e) {
				System.out.println("Select2 UI click for City failed, using programmatic fallback: " + e.getMessage());
				WebElement citySelect = wait.until(
						ExpectedConditions.presenceOfElementLocated(By.name("city")));
				js.executeScript(
						"$(arguments[0]).find('option[value=\"Jaipur\"]').prop('selected', true);"
						+ "$(arguments[0]).val('Jaipur').trigger('change');", citySelect);
				System.out.println("Selected City (Jaipur) programmatically.");
			}
			Thread.sleep(1000);

			// Select Hotel from dropdown (The Lalit (5 Star) or Hotel Clarks Amer) using Select2
			try {
				// Open Select2 dropdown for hotel
				js.executeScript("$('select[name=\"hotel\"]').select2('open');");
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
				WebElement hotelSelect = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("select[name='hotel']")));
				js.executeScript(
						"var optionVal = $(arguments[0]).find('option[value*=\"The Lalit\"], option[value*=\"Clarks Amer\"], option:not([value=\"\"])').first().val();"
						+ "$(arguments[0]).find('option[value=\"' + optionVal + '\"]').prop('selected', true);"
						+ "$(arguments[0]).val(optionVal).trigger('change');", hotelSelect);
				System.out.println("Selected hotel via programmatic fallback.");
			}
			System.out.println("Waiting 5s for hotel rooms AJAX to load...");
			Thread.sleep(5000);

			// Select Check In Date = 13 (which is 13-01-2027)
			WebElement checkInSelect = wait.until(
					ExpectedConditions.presenceOfElementLocated(By.cssSelector("select[name='check_in']")));
			js.executeScript("$(arguments[0]).val('13').trigger('change');", checkInSelect);
			System.out.println("Selected Check In date as 13.");
			Thread.sleep(3000);

			// Select Check Out Date containing 16-01-2027
			wait.until(driver1 -> ((JavascriptExecutor) driver1).executeScript(
					"return $('select.check_out option, select[name=\"check_out\"] option').length > 1;").equals(true));
			js.executeScript("var val = $('.check_out option:contains(\"16-01-2027\")').val() || '016'; $('.check_out').val(val).trigger('change');");
			System.out.println("Selected Check Out date as 16.");
			Thread.sleep(3000);

			// Set Single Occupancy room qty to 1
			wait.until(driver1 -> ((JavascriptExecutor) driver1).executeScript(
					"return $('input[class*=\"hotel_room\"]').length > 0;").equals(true));
			js.executeScript("$('input.hotel_room1, input[class*=\"hotel_room\"]').first().val('1');");
			System.out.println("Set Single Occupancy room quantity to 1.");

			// Click Add room button
			WebElement addRoomBtn = wait.until(
					ExpectedConditions.elementToBeClickable(
							By.cssSelector("button.add-hotel-btn[data-roomid='3'], button.add-hotel-btn")));
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
							By.cssSelector("#cartSection a.booknow-btn, div.checkout_btn a.booknow-btn")));
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

			// Select 17 Jan and 18 Jan festival dates (as in fofRegwithhotel.java)
			WebElement checkbox17 = wait.until(
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

			WebElement checkbox18 = wait.until(
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

			// Locate and fill the Name input
			WebElement attendeeNameInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(
							By.cssSelector("input[name^='attendee['][name$='[name]']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", attendeeNameInput);
			attendeeNameInput.clear();
			attendeeNameInput.sendKeys("Amrinder Singh");
			System.out.println("Attendee Name filled successfully.");

			// Locate and fill the Email input
			WebElement attendeeEmailInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(
							By.cssSelector("input[name^='attendee['][name$='[email]']")));
			attendeeEmailInput.clear();
			String attendeeEmail = "amrinder+" + System.currentTimeMillis() + "@dreamcast.co";
			attendeeEmailInput.sendKeys(attendeeEmail);
			System.out.println("Attendee Email filled successfully: " + attendeeEmail);

			// Locate and fill the Phone input
			WebElement attendeePhoneInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(
							By.cssSelector("input[name^='attendee['][name$='[phone]']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", attendeePhoneInput);
			attendeePhoneInput.clear();
			attendeePhoneInput.sendKeys("6350415261");
			System.out.println("Attendee Phone number filled successfully: 6350415261");

			// Select Age Group (25-34 Years) using Select2
			try {
				WebElement ageDropdownTrigger = wait.until(
						ExpectedConditions.elementToBeClickable(
								By.cssSelector("span.select2-selection[aria-labelledby*='age_group']")));
				js.executeScript("arguments[0].scrollIntoView({block:'center'});", ageDropdownTrigger);
				try {
					ageDropdownTrigger.click();
				} catch (Exception clickEx) {
					js.executeScript("arguments[0].click();", ageDropdownTrigger);
				}

				WebElement ageOption = wait.until(
						ExpectedConditions.elementToBeClickable(
								By.xpath("//li[contains(@class, 'select2-results__option') and contains(text(), '25-34')]")));
				try {
					ageOption.click();
				} catch (Exception clickEx) {
					js.executeScript("arguments[0].click();", ageOption);
				}
				System.out.println("Age group selected successfully.");
			} catch (Exception e) {
				WebElement ageSelect = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("select[name^='attendee['][name$='[age_group]']")));
				js.executeScript("$(arguments[0]).val('25-34 Years').trigger('change');", ageSelect);
				System.out.println("Age group selected via fallback.");
			}

			// Select Country (India) using Select2
			try {
				WebElement selectedCountrySpanAttendee = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("span.select2-selection[aria-labelledby*='country'] span.select2-selection__rendered")));
				if (!"India".equalsIgnoreCase(selectedCountrySpanAttendee.getText().trim())) {
					WebElement countryDropdownTrigger = wait.until(
							ExpectedConditions.elementToBeClickable(
									By.cssSelector("span.select2-selection[aria-labelledby*='country']")));
					js.executeScript("arguments[0].scrollIntoView({block:'center'});", countryDropdownTrigger);
					try {
						countryDropdownTrigger.click();
					} catch (Exception clickEx) {
						js.executeScript("arguments[0].click();", countryDropdownTrigger);
					}
					WebElement countryOption = wait.until(
							ExpectedConditions.elementToBeClickable(
									By.xpath("//li[contains(@class, 'select2-results__option') and (text()='India' or contains(text(), 'India'))]")));
					try {
						countryOption.click();
					} catch (Exception clickEx) {
						js.executeScript("arguments[0].click();", countryOption);
					}
					System.out.println("Country selected as India.");
				} else {
					System.out.println("Country is already selected as India.");
				}
			} catch (Exception e) {
				WebElement countrySelect = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("select[name^='attendee['][name$='[country]']")));
				js.executeScript("$(arguments[0]).find('option[value=\"India\"]').prop('selected', true); $(arguments[0]).val('India').trigger('change');", countrySelect);
			}

			// Select State (Rajasthan) using Select2
			try {
				WebElement selectedStateSpanAttendee = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("span.select2-selection[aria-labelledby*='state'] span.select2-selection__rendered")));
				if (!"Rajasthan".equalsIgnoreCase(selectedStateSpanAttendee.getText().trim())) {
					WebElement stateDropdownTrigger = wait.until(
							ExpectedConditions.elementToBeClickable(
									By.cssSelector("span.select2-selection[aria-labelledby*='state']")));
					js.executeScript("arguments[0].scrollIntoView({block:'center'});", stateDropdownTrigger);
					try {
						stateDropdownTrigger.click();
					} catch (Exception clickEx) {
						js.executeScript("arguments[0].click();", stateDropdownTrigger);
					}
					WebElement stateOption = wait.until(
							ExpectedConditions.elementToBeClickable(
									By.xpath("//li[contains(@class, 'select2-results__option') and (text()='Rajasthan' or contains(text(), 'Rajasthan'))]")));
					try {
						stateOption.click();
					} catch (Exception clickEx) {
						js.executeScript("arguments[0].click();", stateOption);
					}
					System.out.println("State selected as Rajasthan.");
				} else {
					System.out.println("State is already selected as Rajasthan.");
				}
			} catch (Exception e) {
				WebElement stateSelect = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("select[name^='attendee['][name$='[state]']")));
				js.executeScript("$(arguments[0]).find('option[value=\"Rajasthan\"]').prop('selected', true); $(arguments[0]).val('Rajasthan').trigger('change');", stateSelect);
			}

			// Wait for the City dropdown to populate and select Jaipur
			wait.until(ExpectedConditions.presenceOfElementLocated(
					By.xpath("//select[contains(@name, '[city]')]//option[text()='Jaipur' or @value='Jaipur']")));
			WebElement citySelectAttendee = driver.findElement(By.cssSelector("select[name^='attendee['][name$='[city]']"));
			js.executeScript("$(arguments[0]).find('option[value=\"Jaipur\"]').prop('selected', true); $(arguments[0]).val('Jaipur').trigger('change');", citySelectAttendee);
			System.out.println("City selected as Jaipur programmatically.");

			// Select Gender (Male) programmatically
			WebElement genderSelect = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("select[name^='attendee['][name$='[gender]']")));
			js.executeScript("$(arguments[0]).val('Male').trigger('change');", genderSelect);
			System.out.println("Gender selected as Male.");

			// Select Occupation (Designation) programmatically
			WebElement designationSelect = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("select[name^='attendee['][name$='[designation]']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", designationSelect);
			js.executeScript("$(arguments[0]).val('Self-Employed Professional').trigger('change');", designationSelect);
			System.out.println("Occupation (Designation) selected as Self-Employed Professional programmatically.");

			// Select Hear About Us programmatically
			WebElement hearAboutUsSelect = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("select[name^='attendee['][name$='[hear_about_us]']")));
			js.executeScript("$(arguments[0]).val('Instagram').trigger('change');", hearAboutUsSelect);
			System.out.println("Hear about us selected as Instagram programmatically.");

			// Select Interest in Attending programmatically
			WebElement interestSelect = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("select[name^='attendee['][name$='[interest_in_attending][]']")));
			js.executeScript("$(arguments[0]).val(['Authors/ Books']).trigger('change');", interestSelect);
			System.out.println("Interest in attending selected as Authors/ Books programmatically.");

			// Upload Profile Photo
			WebElement fileInput = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("input[type='file'][name^='attendee['][name$='[image]']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", fileInput);
			File uploadFile = new File("profile_photo.jpg");
			fileInput.sendKeys(uploadFile.getAbsolutePath());
			System.out.println("Profile photo uploaded via sendKeys.");

			// Wait for crop modal to show
			wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("modal_profile")));
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

			// Wait for preview image / modal to close
			try {
				wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("div[id^='previewimage_']")));
				System.out.println("Profile photo preview is displayed.");
			} catch (Exception e) {
				wait.until(ExpectedConditions.invisibilityOfElementLocated(By.id("modal_profile")));
			}
			Thread.sleep(3000);

			// Locate and select the "I agree" Privacy Policy checkbox
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

			// Wait for either selectAddons page or checkout page
			wait.until(ExpectedConditions.or(
					ExpectedConditions.urlContains("/selectAddons/"),
					ExpectedConditions.urlContains("/checkout/")));

			// Handle Add-ons selection if on selectAddons page
			if (driver.getCurrentUrl() != null && driver.getCurrentUrl().contains("/selectAddons/")) {
				System.out.println("Navigated to selectAddons page successfully: " + driver.getCurrentUrl());

				// Select both add-ons for 17 and 18 date:
				// 1. The Heritage Evening at Amber Fort (17th January)
				// 2. The Festival Closing Writers' Ball (18th January)
				try {
					java.util.List<WebElement> addonCheckboxes = wait.until(
							ExpectedConditions.presenceOfAllElementsLocatedBy(
									By.cssSelector("input.addon-assign-checkbox, input[type='checkbox'][data-addon-id], input[type='checkbox'][name*='addon']")));
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
				} catch (Exception e) {
					System.out.println("Add-on checkboxes selection note: " + e.getMessage());
				}

				// Wait 3 seconds for cart to reflect both add-ons
				Thread.sleep(3000);

				// Click Checkout button on the selectAddons page
				WebElement addonCheckoutBtn = wait.until(
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
				wait.until(ExpectedConditions.urlContains("/checkout/"));
			}
			System.out.println("Navigated to checkout page successfully: " + driver.getCurrentUrl());
			Thread.sleep(3000);

			// Check if there is an "I agree" checkbox on the checkout page
			try {
				WebElement agreeCheckbox = driver.findElement(By.cssSelector("input[name*='agree'], input#agree"));
				if (!agreeCheckbox.isSelected()) {
					js.executeScript("arguments[0].scrollIntoView({block:'center'});", agreeCheckbox);
					js.executeScript("arguments[0].click();", agreeCheckbox);
					System.out.println("'I agree' checkbox selected on checkout page.");
				}
			} catch (Exception ex) {
				// Not present on checkout
			}

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
					ExpectedConditions.elementToBeClickable(By.cssSelector("div.checkout_btn a.booknow-btn, a.booknow-btn")));
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
