var COLORS = {
  BLACK: '\u001B[30m',
  RED: '\u001B[31m',
  GREEN: '\u001B[32m',
  YELLOW: '\u001B[33m',
  BLUE: '\u001B[34m',
  MAGENTA: '\u001B[35m',
  CYAM: '\u001B[36m',
  WHITE: '\u001B[37m',
  BRIGHT_BLACK: '\u001B[30;1m',
  BRIGHT_RED: '\u001B[31;1m',
  BRIGHT_GREEN: '\u001B[32;1m',
  BRIGHT_YELLOW: '\u001B[33;1m',
  BRIGHT_BLUE: '\u001B[34;1m',
  BRIGHT_MAGENTA: '\u001B[35;1m',
  BRIGHT_CYAN: '\u001B[36;1m',
  BRIGHT_WHITE: '\u001B[37;1m',

  RESET: '\u001B[0m'
}

function wrap (wrap, text) {
  return wrap + text + COLORS.RESET
}

function make () {
  var colors = Array.prototype.slice.call(arguments)

  return function (text) {
    return wrap(colors.join(''), text)
  }
}

exports = {
  COLORS: COLORS,
  make: make
}
