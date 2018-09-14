#!/bin/sh
BASEDIR=$(dirname "$0")
THRUSTDIR=$BASEDIR/../src/

DEBUG=''
GRAAL=false

for i in "$@"
do
    case $i in
        --debug)
            DEBUG=true
        ;;
        --graal)
            GRAAL=true
        ;;
        *)
                # unknown option
        ;;
    esac
done

if [ "${GRAAL}" = true ] || [ "${USE_THRUST_GRAAL}" = true ]; then  
    if [ "${GRAAL_HOME}" = "" ]; then
        echo 'Error: To use thrust with graal, GRAAL_HOME must be set.' >&2
        exit 1
    fi

    if [ "${DEBUG}" = true ]; then 
        DEBUG='--inspect'
    fi

    eval $GRAAL_HOME/bin/js --jvm --js.nashorn-compat --strict $DEBUG $THRUSTDIR/thrust.js -- -GRAAL true -THRUSTDIR $THRUSTDIR $*
else 
    if [ "${DEBUG}" = true ]; then 
        if ! [ -x "$(command -v ncdbg)" ]; then
            echo 'Error: ncdbg não foi encontrado, vide seção de debug no README.' >&2
            exit 1
        fi

        DEBUG='--J-agentlib:jdwp=server=y,transport=dt_socket,address=7777,suspend=y'

        echo 'Iniciando NCDbg para debug...'
        ncdbg &>/dev/null &
    fi

    eval jjs -strict --language=es6 $DEBUG $THRUSTDIR/thrust.js -- $*
fi