#!/bin/sh

# ========================================
# script: build-tpm.sh
# description: Build tpm executable
# ========================================

# ------------------------------------------------
# Global variabels
# ------------------------------------------------
TPM_JAR=./build/libs/tpm-0.1.0.jar
JAVA=""
# ------------------------------------------------
# Functions
# ------------------------------------------------

prepare() {
    echo "Preparing to generate tpm."
    rm -f ${TPM_JAR} 2> /dev/null
}

check_graal_home() {
    echo "Checking GraalVM ..."
    if [ -z "${GRAAL_HOME}" ]; then
        OUTPUT=$(java -version 2>&1 | grep -ic "graalvm")
        if [ ${OUTPUT} -gt 0 ]; then
            JAVA=$(which java)
            GRAAL_HOME=$(dirname "${JAVA}")
            OUTPUT=$(echo ${GRAAL_HOME} | grep -ce "^/.*/bin$")
            if [ $OUTPUT -eq 1 ]; then
                GRAAL_HOME=$(dirname "${GRAAL_HOME}")
            fi
        fi

        if [ -z "${GRAAL_HOME}" ]; then
            echo "\e[31mError\e[m: Enviroment variable '\e[1mGRAAL_HOME\e[m' not found" >&2
            exit 1
        fi
    fi
    echo "GraalVM home=${GRAAL_HOME}."
}

build_jar() {
    echo "Building .jar ..."
    ./gradlew clean build jarBinary ${TPM_BUILD_NO_TEST} --no-daemon
    RET=$?
    if [ ${RET} -ne 0 ]; then
        echo "\e[31mError\e[0m: Failed to build jar" >&2
        exit 2
    fi
}

build_tpm() {
    echo "Mounting '\e[1mtpm\e[m'..."

    $GRAAL_HOME/bin/native-image \
      --no-server \
      --no-fallback \
      --enable-all-security-services -H:+JNI \
      -H:ReflectionConfigurationFiles=reflection.json \
      -H:EnableURLProtocols=http,https \
      -cp ${TPM_JAR} \
      br.com.softbox.tpm.Tpm \
      build/tpm

    RET=$?
    if [ ${RET} -ne 0 ]; then
        echo "\e[31mError\e[0m: Failed to mount"
        exit 2
    fi
}

# ------------------------------------------------
# 'Main'
# ------------------------------------------------
prepare
check_graal_home
build_jar
build_tpm

echo "Done build tpm!"
