#!/bin/sh

THRUSTDIR=/opt/thrust/lib/

if [ "${GRAAL_HOME}" = "" ]; then
    echo 'Error: GRAAL_HOME environment variable must be set. Download it from https://github.com/oracle/graal/releases' >&2
    exit 1
fi

if [ "${DEBUG}" = true ]; then 
    DEBUG='--inspect'
fi

eval $GRAAL_HOME/bin/js --jvm --polyglot --nashorn-compat $DEBUG $THRUSTDIR/thrust.js -- $*
