@halaga @core
Feature: Halaga core flows - recording money
  Test data only: every scenario starts from an empty, fresh install.

  Background:
    Given I start Halaga with no data

  Scenario: Recording income adds to Money in
    When I record a Halaga transaction
      | type     | income |
      | amount   | 25000  |
      | category | Salary |
      | account  | Cash   |
    Then Halaga should confirm it was logged
    When I go back to the main menu
    Then the Home tile "Money in" should show "₱25,000.00"
    And the Home transactions should list "Salary"

  Scenario: Recording an expense adds to Money out
    When I record a Halaga transaction
      | type     | expense    |
      | amount   | 350.50     |
      | category | Groceries  |
      | account  | Cash       |
      | note     | Test basket |
    Then Halaga should confirm it was logged
    When I go back to the main menu
    Then the Home tile "Money out" should show "₱350.50"
    And the Home transactions should list "Groceries"

  Scenario: An expense needs a category
    When I fill a Halaga transaction without saving
      | type   | expense |
      | amount | 100     |
    And I save the transaction
    Then the Add form should show the error "Choose a category"

  Scenario: A transfer between accounts is not money in or out
    When I record a Halaga transaction
      | type    | transfer |
      | amount  | 1000     |
      | account | Cash     |
      | to      | GCash    |
    Then Halaga should confirm it was logged
    When I go back to the main menu
    Then the Home tile "Money in" should show "₱0.00"
    And the Home tile "Money out" should show "₱0.00"

  Scenario: Adding a to-do on the Checklist
    When I open the "Checklist" tab
    And I add the to-do "Call the bank about the card limit"
    Then my to-dos should include "Call the bank about the card limit"

  Scenario: Adding a debt shows it under Flows
    When I open the "Flows" tab
    And I open the "Debts" section in Flows
    And I add a Halaga debt
      | kind   | Bank personal loan |
      | name   | Test personal loan |
      | start  | 2026-11-01         |
      | amount | 12000              |
      | rate   | 1                  |
      | months | 12                 |
    Then Halaga should confirm it was saved with "Test personal loan is added to Flows → Debts"
    When I close the confirmation
    Then the Debts page should show "Bank and personal loans" with "1 debt"
