#!/bin/sh
BASEDIR=$(dirname "$0")

DEBUG=''

for i in "$@"
do
    case $i in
        --debug)
            DEBUG='-J-agentlib:jdwp=server=y,transport=dt_socket,address=7777,suspend=y'
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

# Running thrust with jjs
eval jjs --language=es6 $DEBUG $BASEDIR/../src/thrust.js -- $*

