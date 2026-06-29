package AGDMtest;

import java.io.File;
import java.io.PrintWriter;
import java.time.Duration;
import java.util.Scanner;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

public class AGDMreg {

	public static void main(String[] args) {
		// Read/write the run count
		int count = 1;
		File countFile = new File("run_count.txt");
		if (countFile.exists()) {
			try (Scanner scanner = new Scanner(countFile)) {
				if (scanner.hasNextInt()) {
					count = scanner.nextInt();
				}
			} catch (Exception e) {
				System.out.println("Could not read run_count.txt: " + e.getMessage());
			}
		}
		
		String firstName = "amrinder " + count;
		String lastName = "singh";
		String email = "amrinder+" + count + "@dreamcast.co";
		
		// Generate random 10-digit phone number
		java.util.Random rand = new java.util.Random();
		StringBuilder sb = new StringBuilder("9");
		for (int i = 0; i < 9; i++) {
			sb.append(rand.nextInt(10));
		}
		String randomPhone = sb.toString();
		
		String company = "dreamcast";
		String designation = "QA";
		
		System.out.println("----------------------------------------------");
		System.out.println("Running automation with details:");
		System.out.println("First Name: " + firstName);
		System.out.println("Last Name: " + lastName);
		System.out.println("Email: " + email);
		System.out.println("Phone: " + randomPhone);
		System.out.println("Company: " + company);
		System.out.println("Designation: " + designation);
		System.out.println("Country: UAE");
		System.out.println("----------------------------------------------");

		WebDriver driver = new ChromeDriver();
		WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(25));
		JavascriptExecutor js = (JavascriptExecutor) driver;
		
		try {
			driver.manage().window().maximize();
			driver.get("https://live.dreamcast.in/eventbot/Evolution/admin/login");
			
			WebElement emailField = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("exampleInputEmail1")));
			WebElement passwordField = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("exampleInputPassword1")));
			
			emailField.sendKeys("master@admin.com");
			passwordField.sendKeys("aa_masteradmin1235");
			
			WebElement submitBtn;
			try {
				submitBtn = driver.findElement(By.cssSelector("button[type='submit']"));
			} catch (Exception e) {
				try {
					submitBtn = driver.findElement(By.xpath("//button[contains(text(), 'Login') or contains(text(), 'Sign In') or contains(text(), 'Submit') or contains(text(), 'LOG IN') or contains(text(), 'Log In')]"));
				} catch (Exception ex) {
					submitBtn = driver.findElement(By.className("btn"));
				}
			}
			
			submitBtn.click();
			System.out.println("Login button clicked.");
			
			// Wait for redirection to dashboard
			Thread.sleep(5000);
			System.out.println("URL after login: " + driver.getCurrentUrl());
			
			// Navigate to Old Users RSVP (Delegates) page
			System.out.println("Navigating to Old Users RSVP (Delegates) page...");
			driver.get("https://live.dreamcast.in/eventbot/Evolution/admin/old-users-rsvp/2");
			Thread.sleep(5000);
			System.out.println("URL of RSVP page: " + driver.getCurrentUrl());
			
			// Click on "+ Add User" link/button
			WebElement addUserBtn = null;
			try {
				addUserBtn = wait.until(ExpectedConditions.elementToBeClickable(
					By.xpath("//a[contains(text(), 'Add User') or contains(., 'Add User')]")
				));
			} catch (Exception e) {
				System.out.println("Could not find Add User link by text. Searching all links...");
				java.util.List<WebElement> links = driver.findElements(By.tagName("a"));
				for (WebElement link : links) {
					if (link.getText().contains("Add User")) {
						addUserBtn = link;
						break;
					}
				}
			}
			
			if (addUserBtn != null) {
				System.out.println("Clicking Add User link...");
				try {
					addUserBtn.click();
				} catch (Exception clickEx) {
					js.executeScript("arguments[0].click();", addUserBtn);
				}
				
				// Wait for the sidebar to display
				Thread.sleep(3000);
				System.out.println("Sidebar opened. Filling in form details...");
				
				// Fill the fields
				WebElement fNameInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.name("first_name")));
				WebElement lNameInput = driver.findElement(By.name("last_name"));
				WebElement emailInput = driver.findElement(By.name("email"));
				WebElement phoneInput = driver.findElement(By.name("phone"));
				WebElement companyInput = driver.findElement(By.name("company"));
				WebElement designationInput = driver.findElement(By.name("designation"));
				
				fNameInput.clear();
				fNameInput.sendKeys(firstName);
				
				lNameInput.clear();
				lNameInput.sendKeys(lastName);
				
				emailInput.clear();
				emailInput.sendKeys(email);
				
				phoneInput.clear();
				phoneInput.sendKeys(randomPhone);
				
				companyInput.clear();
				companyInput.sendKeys(company);
				
				designationInput.clear();
				designationInput.sendKeys(designation);
				
				// Select Country (UAE)
				WebElement countrySelect = driver.findElement(By.id("country"));
				Select selectCountry = new Select(countrySelect);
				boolean countrySelected = false;
				for (WebElement option : selectCountry.getOptions()) {
					String text = option.getText().trim();
					String val = option.getAttribute("value").trim();
					if (text.equalsIgnoreCase("uae") || text.toLowerCase().contains("united arab emirates") || val.equalsIgnoreCase("uae")) {
						selectCountry.selectByValue(val);
						System.out.println("Selected country: " + text + " (value: " + val + ")");
						countrySelected = true;
						break;
					}
				}
				if (!countrySelected) {
					try {
						selectCountry.selectByVisibleText("UAE");
					} catch (Exception countryEx) {
						System.out.println("Failed to select UAE: " + countryEx.getMessage());
					}
				}
				
				// Find and click the submit button
				WebElement submitFormBtn = null;
				java.util.List<WebElement> visibleButtons = driver.findElements(By.tagName("button"));
				for (WebElement btn : visibleButtons) {
					if (btn.isDisplayed()) {
						String txt = btn.getText().trim();
						if (txt.toLowerCase().contains("add") || txt.toLowerCase().contains("submit") || txt.toLowerCase().contains("save")) {
							if (!txt.contains("Add User")) {
								submitFormBtn = btn;
								break;
							}
						}
					}
				}
				if (submitFormBtn == null) {
					try {
						submitFormBtn = driver.findElement(By.xpath("//button[@type='submit' and not(contains(text(), 'Add User'))]"));
					} catch (Exception ex) {
						submitFormBtn = driver.findElement(By.cssSelector("form button"));
					}
				}
				
				if (submitFormBtn != null) {
					System.out.println("Clicking submit button: '" + submitFormBtn.getText().trim() + "'...");
					try {
						submitFormBtn.click();
					} catch (Exception clickEx) {
						js.executeScript("arguments[0].click();", submitFormBtn);
					}
					
					// Wait for page to reload/update
					Thread.sleep(6000);
					
					// Scroll down to the pagination links
					System.out.println("Locating pagination links at the bottom...");
					java.util.List<WebElement> paginationLinks = driver.findElements(By.xpath("//ul[contains(@class, 'pagination')]//a | //div[contains(@class, 'pagination')]//a"));
					
					WebElement lastPageLink = null;
					int maxPage = -1;
					for (WebElement link : paginationLinks) {
						String text = link.getText().trim();
						try {
							int pageNum = Integer.parseInt(text);
							if (pageNum > maxPage) {
								maxPage = pageNum;
								lastPageLink = link;
							}
						} catch (NumberFormatException e) {
							// not a pure page number link
						}
					}
					
					if (lastPageLink == null && !paginationLinks.isEmpty()) {
						lastPageLink = paginationLinks.get(paginationLinks.size() - 1);
					}
					
					if (lastPageLink != null) {
						System.out.println("Clicking last page link (Text: '" + lastPageLink.getText() + "')...");
						js.executeScript("arguments[0].scrollIntoView({block:'center'});", lastPageLink);
						Thread.sleep(1000);
						try {
							lastPageLink.click();
						} catch (Exception e) {
							js.executeScript("arguments[0].click();", lastPageLink);
						}
						
						// Wait for pagination to load
						Thread.sleep(5000);
						System.out.println("URL after pagination: " + driver.getCurrentUrl());
						
						// Search for the row containing the user we just added
						java.util.List<WebElement> rows = driver.findElements(By.tagName("tr"));
						WebElement targetRow = null;
						for (WebElement row : rows) {
							String text = row.getText();
							if (text.toLowerCase().contains(firstName.toLowerCase()) || text.toLowerCase().contains(email.toLowerCase())) {
								System.out.println("Found match row: " + text);
								targetRow = row;
								break;
							}
						}
						
						if (targetRow != null) {
							// Click the three dots button in this row
							WebElement threeDots = null;
							try {
								threeDots = targetRow.findElement(By.xpath(".//button[contains(@class, 'dropdown-toggle')] | .//a[contains(@class, 'dropdown-toggle')] | .//*[contains(@class, 'dot-three') or contains(@class, 'three-dots') or contains(@class, 'ellipsis')]"));
							} catch (Exception ex) {
								threeDots = targetRow.findElement(By.xpath(".//button | .//a"));
							}
							
							if (threeDots != null) {
								System.out.println("Clicking the three dots...");
								js.executeScript("arguments[0].scrollIntoView({block:'center'});", threeDots);
								Thread.sleep(1000);
								try {
									threeDots.click();
								} catch (Exception clickEx) {
									js.executeScript("arguments[0].click();", threeDots);
								}
								Thread.sleep(2000);
								
								// Get the Copy Link element
								WebElement copyLinkItem = null;
								try {
									copyLinkItem = wait.until(ExpectedConditions.elementToBeClickable(
										By.xpath("//a[contains(text(), 'Copy link') or contains(., 'Copy link')]")
									));
								} catch (Exception e) {
									java.util.List<WebElement> allLinks = driver.findElements(By.tagName("a"));
									for (WebElement link : allLinks) {
										if (link.getText().contains("Copy link")) {
											copyLinkItem = link;
											break;
										}
									}
								}
								
								if (copyLinkItem != null) {
									// Parse the onclick attribute to get ID
									String onclick = copyLinkItem.getAttribute("onclick");
									String id = "";
									java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("copyLink\\('(\\d+)'");
									java.util.regex.Matcher matcher = pattern.matcher(onclick);
									if (matcher.find()) {
										id = matcher.group(1);
									}
									System.out.println("Parsed ID for RSVP Link: " + id);
									
									// Construct the RSVP URL (base64 encoded ID)
									String encodedId = java.util.Base64.getEncoder().encodeToString(id.getBytes());
									String rsvpUrl = "https://live.dreamcast.in/eventbot/Evolution/rsvp-attendees/" + encodedId;
									System.out.println("Constructed RSVP URL: " + rsvpUrl);
									
									// Click 'Copy link' to copy it on screen (which triggers the alert)
									System.out.println("Clicking 'Copy link'...");
									try {
										copyLinkItem.click();
									} catch (Exception clickEx) {
										js.executeScript("arguments[0].click();", copyLinkItem);
									}
									
									// Close the success alert
									Thread.sleep(3000);
									try {
										org.openqa.selenium.Alert alert = driver.switchTo().alert();
										System.out.println("Browser alert popped up: " + alert.getText());
										alert.accept();
									} catch (org.openqa.selenium.NoAlertPresentException ex) {
										System.out.println("No browser alert popped up.");
									}
									
									// Now, open a new tab and go to the RSVP Url
									System.out.println("Opening a new tab and navigating to the RSVP URL...");
									driver.switchTo().newWindow(org.openqa.selenium.WindowType.TAB);
									driver.get(rsvpUrl);
									Thread.sleep(6000);
									System.out.println("RSVP Page URL: " + driver.getCurrentUrl());
									
									// Fill Industry, Sub Industry, and Country on RSVP page
									System.out.println("Filling Industry, Sub Industry, and Country details...");
									
									WebElement industrySelect = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//select[contains(@name, '[industry]')]")));
									Select selectIndustry = new Select(industrySelect);
									selectIndustry.selectByValue("Banking");
									System.out.println("Selected Industry: Banking");
									
									Thread.sleep(3000); // Wait for sub-industry options to load
									
									WebElement subIndustrySelect = driver.findElement(By.xpath("//select[contains(@name, '[sub_industry]')]"));
									Select selectSubIndustry = new Select(subIndustrySelect);
									wait.until(driver1 -> selectSubIndustry.getOptions().size() > 1);
									java.util.List<WebElement> subOptions = selectSubIndustry.getOptions();
									if (subOptions.size() > 1) {
										selectSubIndustry.selectByIndex(1);
										System.out.println("Selected Sub Industry: " + subOptions.get(1).getText());
									}
									
									try {
										WebElement countrySelect2 = driver.findElement(By.xpath("//select[contains(@name, '[country]')]"));
										Select selectCountry2 = new Select(countrySelect2);
										selectCountry2.selectByValue("United Arab Emirates");
										System.out.println("Selected Country: United Arab Emirates");
									} catch (Exception e) {
										System.out.println("Could not select country: " + e.getMessage());
									}
									
									// Take screenshot of the RSVP details form
									try {
										File srcFile = ((org.openqa.selenium.TakesScreenshot) driver).getScreenshotAs(org.openqa.selenium.OutputType.FILE);
										java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("rsvp_form_page.png"),
												java.nio.file.StandardCopyOption.REPLACE_EXISTING);
										System.out.println("RSVP Form screenshot saved to rsvp_form_page.png");
									} catch (Exception e) {
										System.out.println("Failed to take RSVP page screenshot: " + e.getMessage());
									}
									
									// Find and click the submit/confirm button on the RSVP page
									WebElement rsvpSubmitBtn = null;
									try {
										rsvpSubmitBtn = wait.until(ExpectedConditions.elementToBeClickable(
											By.xpath("//button[@type='submit'] | //input[@type='submit'] | //button[contains(text(), 'Submit') or contains(text(), 'Confirm') or contains(text(), 'RSVP') or contains(text(), 'Register') or contains(text(), 'ADD') or contains(text(), 'Add')]")
										));
									} catch (Exception ex) {
										java.util.List<WebElement> btns = driver.findElements(By.tagName("button"));
										for (WebElement b : btns) {
											if (b.isDisplayed()) {
												rsvpSubmitBtn = b;
												break;
											}
										}
									}
									
									if (rsvpSubmitBtn != null) {
										System.out.println("Clicking RSVP form submit button (Text: '" + rsvpSubmitBtn.getText() + "')...");
										try {
											rsvpSubmitBtn.click();
										} catch (Exception clickEx) {
											js.executeScript("arguments[0].click();", rsvpSubmitBtn);
										}
										
										Thread.sleep(6000);
										
										// Handle any alerts on submission
										try {
											org.openqa.selenium.Alert alert = driver.switchTo().alert();
											System.out.println("Browser alert after RSVP submit: " + alert.getText());
											alert.accept();
										} catch (org.openqa.selenium.NoAlertPresentException ex) {
											// no alert
										}
										
										// Switch back to Admin tab (tab index 0)
										System.out.println("Switching back to the Admin tab...");
										java.util.List<String> tabs = new java.util.ArrayList<>(driver.getWindowHandles());
										driver.switchTo().window(tabs.get(0));
										
										// Load fresh clean Admin Delegates Page
										System.out.println("Navigating to Admin Delegates page...");
										driver.get("https://live.dreamcast.in/eventbot/Evolution/admin/old-users-rsvp/2");
										Thread.sleep(6000);
										System.out.println("Admin tab URL after loading delegates: " + driver.getCurrentUrl());
										
										try {
											File debugFile = ((org.openqa.selenium.TakesScreenshot) driver).getScreenshotAs(org.openqa.selenium.OutputType.FILE);
											java.nio.file.Files.copy(debugFile.toPath(), java.nio.file.Paths.get("debug_delegates_load.png"),
													java.nio.file.StandardCopyOption.REPLACE_EXISTING);
											System.out.println("Debug screenshot saved to debug_delegates_load.png");
										} catch (Exception e) {
											System.out.println("Failed to take debug screenshot: " + e.getMessage());
										}
										
										// Select search filter dropdown first (so that input field becomes visible)
										System.out.println("Selecting search filter dropdown...");
										WebElement filterSelect = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//select[contains(@name, 'search_field[]')]")));
										Select selectFilter = new Select(filterSelect);
										boolean filterSelected = false;
										for (WebElement opt : selectFilter.getOptions()) {
											String text = opt.getText().trim();
											String val = opt.getAttribute("value").trim();
											if (text.toLowerCase().contains("first name") || val.toLowerCase().contains("first_name")) {
												selectFilter.selectByValue(val);
												System.out.println("Selected search filter: " + text);
												filterSelected = true;
												break;
											}
										}
										if (!filterSelected) {
											selectFilter.selectByIndex(1);
										}
										Thread.sleep(1000);
										
										// Search for the registered user by first name
										System.out.println("Searching for attendee by first name: " + firstName);
										WebElement searchInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//input[@name='input_value[]']")));
										searchInput.clear();
										searchInput.sendKeys(firstName);
										
										WebElement searchBtn = driver.findElement(By.xpath("//button[contains(text(), 'Search') or contains(., 'Search')]"));
										try {
											searchBtn.click();
										} catch (Exception e) {
											js.executeScript("arguments[0].click();", searchBtn);
										}
										Thread.sleep(5000);
										
										// Verify status in the result row
										java.util.List<WebElement> resultRows = driver.findElements(By.tagName("tr"));
										boolean verified = false;
										for (WebElement row : resultRows) {
											String rowText = row.getText();
											if (rowText.toLowerCase().contains(firstName.toLowerCase())) {
												System.out.println("Found search result row: " + rowText);
												if (rowText.contains("Publish")) {
													System.out.println("VERIFICATION SUCCESS: Status converted to 'Publish'!");
												} else {
													System.out.println("VERIFICATION FAILED: Status is still: " + rowText);
												}
												verified = true;
												break;
											}
										}
										if (!verified) {
											System.out.println("ERROR: Could not find user row in search results.");
										}
										
										// Take status verification screenshot
										try {
											File srcFile = ((org.openqa.selenium.TakesScreenshot) driver).getScreenshotAs(org.openqa.selenium.OutputType.FILE);
											java.nio.file.Files.copy(srcFile.toPath(), java.nio.file.Paths.get("final_status_check.png"),
													java.nio.file.StandardCopyOption.REPLACE_EXISTING);
											System.out.println("Final status check screenshot saved to final_status_check.png");
										} catch (Exception e) {
											System.out.println("Failed to take screenshot: " + e.getMessage());
										}
										
										// Update run count
										try (PrintWriter out = new PrintWriter(countFile)) {
											out.print(count + 1);
											System.out.println("SUCCESS: RSVP complete and status verified! Incremented next run count to " + (count + 1));
										} catch (Exception e) {
											System.out.println("Error saving run_count.txt: " + e.getMessage());
										}
									} else {
										System.out.println("ERROR: Could not locate the submit button on the RSVP form page.");
									}
									
								} else {
									System.out.println("ERROR: Could not find 'Copy link' item.");
								}
							} else {
								System.out.println("ERROR: Could not find three-dots button in the row.");
							}
						} else {
							System.out.println("ERROR: Could not find the newly added user row on the last page.");
						}
					} else {
						System.out.println("ERROR: Could not find pagination links.");
					}
				} else {
					System.out.println("ERROR: Could not find submit button inside the sidebar form.");
				}
			} else {
				System.out.println("ERROR: Could not find '+ Add User' button/link on the page.");
			}
			
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			driver.quit();
		}
	}

}
