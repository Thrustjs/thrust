#!/bin/sh

DEBUG=''
GRAAL=false
THRUSTDIR=/opt/thrust/lib/

for i in "$@"
do
    case $i in
        --debug)
            DEBUG='-J-agentlib:jdwp=server=y,transport=dt_socket,address=7777,suspend=y'
        ;;
        --graal)
            GRAAL=true
        ;;
        *)
                # unknown option
        ;;
    esac
done

if [ "${DEBUG}" != "" ]; then 
    if ! [ -x "$(command -v ncdbg)" ]; then
        echo 'Error: ncdbg não foi encontrado, vide seção de debug no README.' >&2
        exit 1
    fi
    
    echo 'Iniciando NCDbg para debug...'
    ncdbg &>/dev/null &
fi

if [ "${GRAAL}" = true ]; then 
    if [ "${GRAAL_HOME}" = "" ]; then
        echo 'Error: To use thrust with graal, GRAAL_HOME must be set.' >&2
        exit 1
    fi

    eval $GRAAL_HOME/bin/js --jvm --strict $THRUSTDIR/thrust.js -- -GRAAL true -THRUSTDIR $THRUSTDIR $*
else 
    eval jjs -strict --language=es6 $DEBUG $THRUSTDIR/thrust.js -- $*
fi