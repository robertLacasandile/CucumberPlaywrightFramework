@ignore
Feature: Traditional Playwright POM, API, and database examples

  @api
  Scenario: API health check
    Given the API client is ready
    When I send a GET request to "/health"
    Then the API response status should be 200

  @database
  Scenario: Database query check
    When I run the database query
      """
      select 1 as status
      """
    Then the database result should have 1 row
    And the first database row column "status" should be "1"
