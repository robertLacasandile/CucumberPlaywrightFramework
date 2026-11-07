@ui @pom
Feature: Traditional Playwright page object login

  Scenario: Login using traditional page object model
    Given I open the login page using POM for "app.herokuapp.url"
    When I login using POM with config username "app.heroku.username" and config password "app.heroku.password"
    Then I should see text using POM "You logged into a secure area!"
