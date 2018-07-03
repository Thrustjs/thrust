#!/bin/sh
BASEDIR=$(dirname "$0")

THRUSTDIR=$BASEDIR/../src

# Running thrust with GraalVM js
eval /usr/lib/graalvm-ce-1.0.0-rc2/bin/js --jvm --strict $BASEDIR/../src/thrust.js -- -THRUSTDIR $THRUSTDIR $*