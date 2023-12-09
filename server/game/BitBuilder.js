const bitwise = require('bitwise');

class BitBuilder {
  constructor(num) {
    this.bits = bitwise.byte.read(num || 0);
  }

  or(num) {
    this.bits = bitwise.bits.or(this.bits, bitwise.byte.read(num));
    return this;
  }

  and(num) {
    this.bits = bitwise.bits.and(this.bits, bitwise.byte.read(num));
    return this;
  }

  build() {
    return bitwise.byte.write(this.bits);
  }
}

module.exports = BitBuilder;
