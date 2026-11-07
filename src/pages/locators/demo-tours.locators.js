function demoToursLocators(page) {
  return {
    registerLink: page.getByRole('link', { name: 'REGISTER' }),
    signInLink: page.getByRole('link', { name: /sign-in/i }),
    firstNameInput: page.locator('input[name="firstName"]'),
    lastNameInput: page.locator('input[name="lastName"]'),
    phoneInput: page.locator('input[name="phone"]'),
    emailInput: page.locator('input[name="userName"]'),
    addressInput: page.locator('input[name="address1"]'),
    cityInput: page.locator('input[name="city"]'),
    stateInput: page.locator('input[name="state"]'),
    postalCodeInput: page.locator('input[name="postalCode"]'),
    countrySelect: page.locator('select[name="country"]'),
    usernameInput: page.locator('input[name="email"]'),
    passwordInput: page.locator('input[name="password"]'),
    confirmPasswordInput: page.locator('input[name="confirmPassword"]'),
    submitButton: page.locator('input[name="submit"]')
  };
}

module.exports = {
  demoToursLocators
};
