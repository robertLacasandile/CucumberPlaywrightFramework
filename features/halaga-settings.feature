@halaga @auth
Feature: Halaga sign-in and privacy
  Halaga has no account login of its own; signing in only applies to the optional cloud sync.
  These checks stay on the device: requests to any host other than the local test server are blocked.

  # Regression check: this error used to land in the hidden "Import from your computer" card on the iPhone.
  Scenario: Cloud sync sign-in rejects a missing Firebase config
    Given I launch Halaga as a fresh install
    When I try to sign in to cloud sync with
      | config   |                   |
      | email    | tester@example.test |
      | password | not-a-real-password |
    Then cloud sync should show the error "Paste the whole firebaseConfig block"
    And I should be on the Halaga "Welcome" screen

  Scenario: Hide amounts masks the Home totals
    Given I start Halaga with no data
    And I record a Halaga transaction
      | type     | income |
      | amount   | 25000  |
      | category | Salary |
      | account  | Cash   |
    And I go back to the main menu
    When I open "Settings" from Home
    And I turn on "Hide amounts" in Settings
    And I close Settings
    Then I should be on the Halaga "Home" screen
    And the Home tile "Money in" should show "₱•••••"
