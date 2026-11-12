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

public class mediaAccreditation {

	public static void main(String[] args) throws InterruptedException {

		WebDriver driver = new ChromeDriver();
		driver.manage().window().maximize();

		try {
			// Open JLF 2027 landing page
			driver.get("https://staging-registration.dreamcast.in/jlf2027/");
			WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));
			JavascriptExecutor js = (JavascriptExecutor) driver;

			// Locate Media Accreditation radio button on landing page
			WebElement mediaRadio = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("input#flexRadioDefault_new1, input[data-slug*='mediaRegistrations']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", mediaRadio);
			try {
				mediaRadio.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", mediaRadio);
			}
			js.executeScript("arguments[0].checked = true; $(arguments[0]).trigger('change');", mediaRadio);
			System.out.println("Media Accreditation radio button selected.");

			// Wait for Book Now button href to update to mediaRegistrations
			WebElement bookNowBtn = wait.until(
					ExpectedConditions.presenceOfElementLocated(
							By.cssSelector("a.registernow, #Registration_register_btn, a.booknow-btn")));
			wait.until(ExpectedConditions.attributeContains(bookNowBtn, "href", "mediaRegistrations"));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", bookNowBtn);
			wait.until(ExpectedConditions.elementToBeClickable(bookNowBtn));
			try {
				bookNowBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", bookNowBtn);
			}
			System.out.println("Book Now button clicked.");

			// Wait for Media Registrations form page to load
			wait.until(ExpectedConditions.urlContains("/mediaRegistrations"));
			System.out.println("Navigated to Media Registration page: " + driver.getCurrentUrl());

			// Select Salutation (Mr.)
			try {
				WebElement salutationSelect = wait.until(
						ExpectedConditions.presenceOfElementLocated(By.cssSelector("select[name='salutation']")));
				js.executeScript("$(arguments[0]).val('Mr.').trigger('change');", salutationSelect);
				System.out.println("Salutation selected as Mr.");
			} catch (Exception e) {
				System.out.println("Salutation selection skipped: " + e.getMessage());
			}

			// Fill Name
			WebElement nameInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.cssSelector("input[name='name']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", nameInput);
			nameInput.clear();
			nameInput.sendKeys("Amrinder Singh");
			System.out.println("Name filled: Amrinder Singh");

			// Fill Media Outlet
			WebElement mediaOutletInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.cssSelector("input[name='media_outlet']")));
			mediaOutletInput.clear();
			mediaOutletInput.sendKeys("Dreamcast Media");
			System.out.println("Media Outlet filled: Dreamcast Media");

			// Fill Designation
			WebElement designationInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.cssSelector("input[name='designation']")));
			designationInput.clear();
			designationInput.sendKeys("Journalist");
			System.out.println("Designation filled: Journalist");

			// Fill Nationality
			WebElement nationalityInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.cssSelector("input[name='nationality']")));
			nationalityInput.clear();
			nationalityInput.sendKeys("Indian");
			System.out.println("Nationality filled: Indian");

			// Country (India) - avoid unnecessary change event if already India
			try {
				WebElement countrySelect = driver.findElement(By.cssSelector("select[name='country']"));
				String currentCountry = (String) js.executeScript("return $(arguments[0]).val();", countrySelect);
				if (!"India".equalsIgnoreCase(currentCountry)) {
					js.executeScript("$(arguments[0]).val('India').trigger('change');", countrySelect);
					Thread.sleep(1500);
					System.out.println("Country selected as India.");
				} else {
					System.out.println("Country is already India by default.");
				}
			} catch (Exception e) {
				System.out.println("Country selection note: " + e.getMessage());
			}

			// Select State (Rajasthan)
			try {
				wait.until(ExpectedConditions.presenceOfElementLocated(
						By.xpath("//select[@name='state']//option[@value='Rajasthan' or text()='Rajasthan']")));
				WebElement stateSelect = driver.findElement(By.cssSelector("select[name='state']"));
				js.executeScript("$(arguments[0]).val('Rajasthan').trigger('change');", stateSelect);
				System.out.println("State selected as Rajasthan.");
			} catch (Exception e) {
				System.out.println("State selection fallback: " + e.getMessage());
				try {
					WebElement stateSelect = driver.findElement(By.cssSelector("select[name='state']"));
					js.executeScript("$(arguments[0]).val($(arguments[0]).find('option').eq(1).val()).trigger('change');", stateSelect);
				} catch (Exception ignored) {}
			}

			// Select City (Jaipur) - wait for cities to load via AJAX
			try {
				wait.until(ExpectedConditions.presenceOfElementLocated(
						By.xpath("//select[@name='city']//option[@value='Jaipur' or text()='Jaipur']")));
				WebElement citySelect = driver.findElement(By.cssSelector("select[name='city']"));
				js.executeScript("$(arguments[0]).val('Jaipur').trigger('change');", citySelect);
				System.out.println("City selected as Jaipur.");
			} catch (Exception e) {
				System.out.println("City selection fallback: " + e.getMessage());
				try {
					WebElement citySelect = driver.findElement(By.cssSelector("select[name='city']"));
					js.executeScript("$(arguments[0]).val($(arguments[0]).find('option').eq(1).val()).trigger('change');", citySelect);
				} catch (Exception ignored) {}
			}

			// Fill Age
			WebElement ageInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.cssSelector("input[name='age']")));
			ageInput.clear();
			ageInput.sendKeys("28");
			System.out.println("Age filled: 28");

			// Fill Phone number (generated unique 10-digit number to satisfy unique backend constraint)
			WebElement phoneInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.cssSelector("input[name='phone']")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", phoneInput);
			phoneInput.clear();
			String uniquePhone = "98" + (long) (Math.random() * 90000000L + 10000000L);
			phoneInput.sendKeys(uniquePhone);
			System.out.println("Phone number filled: " + uniquePhone);

			// Fill Email
			WebElement emailInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.cssSelector("input[name='email']")));
			emailInput.clear();
			String uniqueEmail = "amrinder+media" + System.currentTimeMillis() + "@dreamcast.co";
			emailInput.sendKeys(uniqueEmail);
			System.out.println("Email filled: " + uniqueEmail);

			// Fill Supervisor Name
			WebElement supervisorNameInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.cssSelector("input[name='supervisor_name']")));
			supervisorNameInput.clear();
			supervisorNameInput.sendKeys("Chief Editor");
			System.out.println("Supervisor Name filled.");

			// Fill Supervisor Email
			WebElement supervisorEmailInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.cssSelector("input[name='supervisor_email']")));
			supervisorEmailInput.clear();
			supervisorEmailInput.sendKeys("editor+" + System.currentTimeMillis() + "@dreamcast.co");
			System.out.println("Supervisor Email filled.");

			// Fill Supervisor Contact
			WebElement supervisorContactInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.cssSelector("input[name='supervisor_contact']")));
			supervisorContactInput.clear();
			supervisorContactInput.sendKeys("9876543210");
			System.out.println("Supervisor Contact filled.");

			// Fill Emergency Contact
			WebElement emergencyContactInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.cssSelector("input[name='emergency_contact']")));
			emergencyContactInput.clear();
			emergencyContactInput.sendKeys("9876543211");
			System.out.println("Emergency Contact filled.");

			// Fill Profile Information
			WebElement profileInput = wait.until(
					ExpectedConditions.visibilityOfElementLocated(By.cssSelector("textarea[name='profile']")));
			profileInput.clear();
			profileInput.sendKeys("Senior journalist and media correspondent covering arts, literature, and cultural festival proceedings.");
			System.out.println("Profile information filled.");

			// Fill Special Requirement
			try {
				WebElement specialReqInput = driver.findElement(By.cssSelector("textarea[name='special_requirement']"));
				specialReqInput.clear();
				specialReqInput.sendKeys("None");
				System.out.println("Special requirement filled.");
			} catch (Exception ignored) {}

			// Select All Festival Dates
			try {
				WebElement checkAllDates = driver.findElement(By.id("checkall"));
				js.executeScript("arguments[0].scrollIntoView({block:'center'});", checkAllDates);
				if (!checkAllDates.isSelected()) {
					js.executeScript("arguments[0].click();", checkAllDates);
				}
				System.out.println("All festival dates selected.");
			} catch (Exception e) {
				System.out.println("Checkall fallback, clicking individual date checkboxes: " + e.getMessage());
				try {
					WebElement firstDate = driver.findElement(By.cssSelector("input[name='festival_dates[]']"));
					js.executeScript("arguments[0].click();", firstDate);
				} catch (Exception ignored) {}
			}

			// Upload Profile Photo
			try {
				WebElement fileInput = wait.until(
						ExpectedConditions.presenceOfElementLocated(
								By.cssSelector("input[type='file'].image_profile, input[type='file'][name='attendee[][image]']")));
				js.executeScript("arguments[0].scrollIntoView({block:'center'});", fileInput);
				File uploadFile = new File("profile_photo.jpg");
				fileInput.sendKeys(uploadFile.getAbsolutePath());
				System.out.println("Profile photo uploaded.");

				// Wait for crop modal to show
				wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("modal_profile")));
				System.out.println("Crop modal is visible.");

				// Wait for cropper_profile to initialize
				Thread.sleep(1500);
				try {
					new WebDriverWait(driver, Duration.ofSeconds(10)).until(d -> 
						((JavascriptExecutor) d).executeScript("return typeof cropper_profile !== 'undefined' && cropper_profile !== null;") == Boolean.TRUE
					);
				} catch (Exception ignored) {}

				// Click Crop button
				WebElement cropBtn = wait.until(
						ExpectedConditions.elementToBeClickable(By.id("crop_profile")));
				try {
					cropBtn.click();
				} catch (Exception exCrop) {
					js.executeScript("arguments[0].click();", cropBtn);
				}
				System.out.println("Crop button clicked.");

				// Wait for crop modal to close or upload preview image to appear
				WebDriverWait uploadWait = new WebDriverWait(driver, Duration.ofSeconds(30));
				try {
					uploadWait.until(ExpectedConditions.or(
						ExpectedConditions.invisibilityOfElementLocated(By.id("modal_profile")),
						ExpectedConditions.presenceOfElementLocated(By.cssSelector("#preview img, div[id^='preview'] img"))
					));
					System.out.println("Crop modal closed / image uploaded.");
				} catch (Exception e) {
					System.out.println("Crop modal wait note: " + e.getMessage());
					js.executeScript("if (window.$ && $('#modal_profile').length) { $('#modal_profile').modal('hide'); $('.modal-backdrop').remove(); $('body').removeClass('modal-open'); }");
				}
				js.executeScript("if (!$('#modal_profile').hasClass('show')) { $('.modal-backdrop').remove(); $('body').removeClass('modal-open'); }");
				Thread.sleep(2000);
			} catch (Exception e) {
				System.out.println("Profile photo upload skipped or not required: " + e.getMessage());
			}

			// Accept Guidelines checkbox
			try {
				WebElement guidelinesCheck = wait.until(
						ExpectedConditions.presenceOfElementLocated(By.id("acceptGuidelines")));
				js.executeScript("arguments[0].scrollIntoView({block:'center'});", guidelinesCheck);
				if (!guidelinesCheck.isSelected()) {
					try {
						guidelinesCheck.click();
					} catch (Exception ex) {
						js.executeScript("arguments[0].click();", guidelinesCheck);
					}
					System.out.println("Guidelines checkbox selected.");
				} else {
					System.out.println("Guidelines checkbox was already selected.");
				}
			} catch (Exception e) {
				System.out.println("Guidelines checkbox note: " + e.getMessage());
			}

			// Accept Privacy Policy checkbox
			try {
				WebElement privacyCheck = wait.until(
						ExpectedConditions.presenceOfElementLocated(By.id("acceptPrivacy")));
				js.executeScript("arguments[0].scrollIntoView({block:'center'});", privacyCheck);
				if (!privacyCheck.isSelected()) {
					try {
						privacyCheck.click();
					} catch (Exception ex) {
						js.executeScript("arguments[0].click();", privacyCheck);
					}
					System.out.println("Privacy policy checkbox selected.");
				} else {
					System.out.println("Privacy policy checkbox was already selected.");
				}
			} catch (Exception e) {
				System.out.println("Privacy policy checkbox note: " + e.getMessage());
			}

			// Locate and click Submit button
			WebElement submitBtn = wait.until(
					ExpectedConditions.elementToBeClickable(By.cssSelector("a.booknow-btn")));
			js.executeScript("arguments[0].scrollIntoView({block:'center'});", submitBtn);
			try {
				submitBtn.click();
			} catch (Exception e) {
				js.executeScript("arguments[0].click();", submitBtn);
			}
			System.out.println("Submit button clicked.");

			// Wait for redirection to Thank You page
			WebDriverWait submitWait = new WebDriverWait(driver, Duration.ofSeconds(30));
			submitWait.until(ExpectedConditions.urlContains("/mediaRegistrations/thankyou/"));
			System.out.println("Navigated to Thank You page: " + driver.getCurrentUrl());

			// Verify confirmation message
			WebElement thankYouHeading = submitWait.until(
					ExpectedConditions.visibilityOfElementLocated(
							By.xpath("//*[contains(text(), 'Thank you for your request for Media Accreditation') or contains(text(), 'Thank you')]")));
			System.out.println("Confirmed message: " + thankYouHeading.getText().trim());

			// Wait 3 seconds for page rendering
			Thread.sleep(3000);

			// Take final screenshot
			try {
				File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
				java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("passed_media.png"),
						java.nio.file.StandardCopyOption.REPLACE_EXISTING);
				java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("passed.png"),
						java.nio.file.StandardCopyOption.REPLACE_EXISTING);
				System.out.println("Confirmation screenshot saved to passed_media.png and passed.png");
			} catch (Exception e) {
				System.out.println("Failed to take final screenshot: " + e.getMessage());
			}

		} catch (Exception e) {
			System.out.println("Exception in mediaAccreditation: " + e.getMessage());
			e.printStackTrace();
			throw e;
		} finally {
			driver.quit();
		}
	}
}
