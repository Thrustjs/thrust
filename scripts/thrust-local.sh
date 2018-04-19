#!/bin/sh
BASEDIR=$(dirname "$0")

# Running thrust with jjs
eval jjs $BASEDIR/../src/thrust.js -- $*