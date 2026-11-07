function loginLocators(page) {
  return {
    usernameInput: page.locator('#username, input[name="username"], input[name="userName"]').first(),
    emailInput: page.locator('#email, input[name="email"], input[type="email"]').first(),
    passwordInput: page.locator('#password, input[name="password"], input[type="password"]').first(),
    loginButton: page
      .locator('button, input[type="button"], input[type="submit"]')
      .filter({ hasText: /(login|log in|submit|sign in)/i })
      .or(page.locator('input[value="Login"], input[value="Log in"], input[value="Submit"], input[value="Sign in"]'))
      .first(),
    flashMessage: page.locator('#flash, .flash, .notice, .success').first()
  };
}

module.exports = {
  loginLocators
};
