/**
 * Represents a person with basic information and actions.
 * @class
 * @extends {Object}
 * @author John Doe
 * @version 1.0.0
 */
class Person extends Object {
  constructor(name, age) {
    super();
    this.name = name;
    this.age = age;
  }

  /**
   * @description Greets the person by name.
   */
  greet() {
    console.log(`Hello, my name is ${this.name}!`);
  }

  /**
   * @description Calculates the birth year based on the current year and age.
   */
  getBirthYear() {
    const currentYear = new Date().getFullYear();
    return currentYear - this.age;
  }

  /**
   * @description Asynchronously fetches the person's favorite quote.
   */
  async getFavoriteQuote() {
    // Simulating an async operation
    return new Promise(resolve => {
      setTimeout(() => {
        resolve("To be or not to be, that is the question.");
      }, 1000);
    });
  }

  /**
   * Updates the person's age.
   * @param {number} newAge - The new age to set
   * @returns {void}
   * @throws {Error} If the new age is negative
   */
  updateAge(newAge = this.age + 1) {
    if (newAge < 0) {
      throw new Error("Age cannot be negative");
    }
    this.age = newAge;
  }
}

module.exports = Person;