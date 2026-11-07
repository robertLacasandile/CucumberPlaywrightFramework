@halaga @smoke
Feature: Halaga smoke - launch and navigation
  Halaga's screens are the web bundle inside the iOS app, run here in WebKit at iPhone size.
  Every scenario starts as a fresh install (empty storage).

  Scenario: A fresh install opens on the welcome screen
    Given I launch Halaga as a fresh install
    Then I should be on the Halaga "Welcome" screen
    And the Halaga tab bar should be hidden

  Scenario: Starting with nothing shows an empty Home
    Given I launch Halaga as a fresh install
    When I choose to start with nothing
    Then I should be on the Halaga "Home" screen
    And the Halaga tab bar should be visible
    And the Home tile "Money in" should show "₱0.00"
    And the Home tile "Money out" should show "₱0.00"
    And the Home tile "Total debt now" should show "₱0.00"

  Scenario Outline: Each tab opens its screen
    Given I start Halaga with no data
    When I open the "<tab>" tab
    Then the "<tab>" screen title should be "<title>"

    Examples:
      | tab       | title     |
      | Checklist | Checklist |
      | Flows     | Flows     |
      | Insights  | Insights  |

  Scenario Outline: Home header buttons open their screens
    Given I start Halaga with no data
    When I open "<screen>" from Home
    Then the "<screen>" screen title should be "<screen>"

    Examples:
      | screen   |
      | Settings |
      | Accounts |
      | Budgets  |
