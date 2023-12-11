const bitwise = require('bitwise');

/**
 * Represents a BitBuilder object that performs bitwise operations on numbers.
 */
class BitBuilder {
  constructor(num) {
    this.bits = bitwise.byte.read(num || 0);
  }

  /**
   * Performs a bitwise OR operation with the given number.
   * @param {number} num - The number to perform the OR operation with.
   * @returns {BitBuilder} - The BitBuilder object for method chaining.
   */
  or(num) {
    this.bits = bitwise.bits.or(this.bits, bitwise.byte.read(num));
    return this;
  }

  /**
   * Performs a bitwise AND operation with the given number.
   * @param {number} num - The number to perform the AND operation with.
   * @returns {BitBuilder} - The BitBuilder object for method chaining.
   */
  and(num) {
    this.bits = bitwise.bits.and(this.bits, bitwise.byte.read(num));
    return this;
  }

  /**
   * Builds and returns the final number after performing the bitwise operations.
   * @returns {number} - The final number after performing the bitwise operations.
   */
  build() {
    return bitwise.byte.write(this.bits);
  }
}

module.exports = BitBuilder;
