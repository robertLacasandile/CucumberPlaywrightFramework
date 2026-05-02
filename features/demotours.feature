@selenium-run
Feature: Smart action based locator resolution

  Scenario: Login using action-aware smart locators herokuapp
    Given I open the "app.herokuapp.url" login page
    When I type "tomsmith" into "Username"
    And I type config "app.heroku.password" into "Password"
    And I click "Login"
    Then I should see text in current context "You logged into a secure area!"

  Scenario: Login using action-aware smart locators demotours
    Given I open the "app.demotours.url" login page
    And I click "REGISTER"
    And I type "Test First Name" into "First Name"
    And I type "Test Last Name" into "Last Name"
    And I type "0123654987" into "Phone"
    And I type "Ttest@testing.com" into "Email"
    And I type "Test Address" into "Address"
    And I type "Manila" into "City"
    And I type "4024" into "Postal Code"
    And I type "NCR" into "State/Province"
    And I select "PHILIPPINES" from "Country"
    And I type "Test User" into "User Name"
    And I type config "app.test.password" into "Password"
    And I type config "app.test.password" into "Confirm Password"
    And I click "submit"
    Then I should see text in current context "Thank you for registering. You may now sign-in using the user name and password you've just entered."
    And I click "sign-in"
    And I type "Test User" into "User Name"
    And I type config "app.test.password" into "Password"
    And I click "submit"
    Then I should see text in current context "Login Successfully"

  Scenario: Verify pages under construction
    Given I open the "app.demotours.url" login page
    When I click "SUPPORT"
    Then I should see text in current context "This section of our web site is currently under construction.   Sorry for any inconvienece."
    When I click "CONTACT"
    Then I should see text in current context "This section of our web site is currently under construction.   Sorry for any inconvienece."

  Scenario: Login using action-aware smart locators demoinsurance
    Given I open the "app.demoinsurance.url" login page
    And I click "Register"
    And I select "Mr" from "Title"
    And I type "Robert" into "First name"
    And I type "Smith" into "Surname"
    And I type "0123654987" into "Phone"
    And I select "1935" from grouped dropdown "Date of Birth" at position 1
    And I select "January" from grouped dropdown "Date of Birth" at position 2
    And I select "20" from grouped dropdown "Date of Birth" at position 3
    And I check "Full"
    And I select "3" from "Licence Period"
    And I select "Actor" from "Occupation"
    And I type "test Street" into "Street"
    And I type "Manila" into "City"
    And I type "Philippines" into "County"
    And I type "5546" into "Post code"
    And I type "Ttest@testing.com" into "Email"
    And I type config "app.test.password" into "Password"
    And I type config "app.test.password" into "Confirm password"
    And I click "Create"
    Then I should see text in current context "Login"

  Scenario: Login using demoinsurance credentials
    Given I open the "app.demoinsurance.url" login page
    When I type "Ttest@testing.com" into "Email"
    And I type config "app.test.password" into "Password"
    And I click "Log in"
    Then I should see text in current context "Broker Insurance WebPage"
    Then I should see text in current context "Home"
    Then I should see text in current context "Request Quotation"
    Then I should see text in current context "Retrieve Quotation"
    Then I should see text in current context "Profile"
    Then I should see text in current context "Edit Profile"
