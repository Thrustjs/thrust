#!/bin/sh

# =========================================================
# script: isntall-thrust-from-here
# Installs thrust from this repository.
# =========================================================

# ***********************************************
# Global variables
# ***********************************************

INSTALL_DIR=/opt/thrust
BASE_DIR=$(dirname "$0")

cd $BASE_DIR
BASE_DIR=$(pwd)
cd -

TPM_DIR=${BASE_DIR}/tpm
THRUSTCORE_DIR=${BASE_DIR}/thrust-core
WORK_DIR=${BASE_DIR}/local-install-dir
THRUST_TEMP_DIR=${WORK_DIR}/thrust
GRAALVM_THRUST_DIR=${THRUST_TEMP_DIR}/graalvm
GRAALVM_PKG=https://github.com/oracle/graal/releases/download/vm-19.2.1/graalvm-ce-linux-amd64-19.2.1.tar.gz
GRAALVM_TGZ_NAME=graalvm.tgz
GRAALVM_DIR=graalvm-ce-19.2.1
GRAALVM_TGZ=${WORK_DIR}/${GRAALVM_TGZ_NAME}
DOWNLOAD_GRAALVM=0
DNL_BY=curl
# ***********************************************
# Functions
# ***********************************************

cleanup() {
    echo "* Cleanup"
    rm -rf "${WORK_DIR}"
}

prepare() {
    cd ${BASE_DIR}
    echo "* Prepare to install thrust in: \e[1m${INSTALL_DIR}\e[m"
    if [ -z "${GRAALVM_HOME}" ]; then
        DOWNLOAD_GRAALVM=1

        has_dnl=$(which curl | wc -l)
        if [ $has_dnl -eq 0 ]; then
            has_dnl=$(which wget | wc -l)
            if [ $has_dnl -eq 0 ]; then
                echo "* \e[33mWarning\e[m: Not found \e[1mcurl\e[m neither \e[1mwget\e[m"
                exit 1
            else
                DNL_BY=wget
            fi
        fi
    fi
    
    mkdir -p ${THRUST_TEMP_DIR}/jars
    
    echo "  - Base    directory: ${BASE_DIR}"
    echo "  - Working directory: ${WORK_DIR}"
}

download_graalvm() {
    if [ ${DOWNLOAD_GRAALVM} -eq 1 ]; then
        echo "* Downloading GraalVM"

        if [ $DNL_BY = "curl" ]; then
            curl -LJ ${GRAALVM_PKG} -o ${GRAALVM_TGZ}
            RET=$?
        else
            wget --no-check-certificate --content-disposition ${GRAALVM_PKG} -O ${GRAALVM_TGZ}
            RET=$?
        fi

        if [ $RET -ne 0 ]; then
            echo "* \e[31mError\e[m: Failed to download GraalVM" >&2
            exit 2
        fi
    fi
}

install_graalvm() {
    if [ ${DOWNLOAD_GRAALVM} -eq 1 ]; then
        echo "* Installing GrallVM"
        if [ ! -f ${GRAALVM_TGZ} ]; then
            echo "* \e[33mWarning\e[m: Not found \e[1m${GRAALVM_TGZ_NAME}\e[m"
            exit 3
        fi
        cd ${WORK_DIR}

        tar xzvf ${GRAALVM_TGZ_NAME}
        RET="$?"
        if [ ${RET} -ne 0 ]; then
            echo "* \e[31mError\e[m: Failed to descompact GraalVM\e[m" >&2
            exit 4
        fi

        rm ${GRAALVM_TGZ_NAME}
        mv ${GRAALVM_DIR} ${GRAALVM_THRUST_DIR}
        
        cd ${GRAALVM_THRUST_DIR}
        rm -rf sample
        cd ${BASE_DIR}
        GRAALVM_HOME=${GRAALVM_THRUST_DIR}
    fi
    JAVA_HOME=${GRAALVM_HOME}
    PATH=${GRAALVM_HOME}/bin:$PATH
    echo "*  => Temporary GraalVM Home: \e[1m${GRAALVM_HOME}\e[m"
}

install_native_image() {
    if [ ! -f "${GRAALVM_HOME}/bin/native-image" ]; then
        echo "* Installing native-image"
        gu install native-image
    fi
}

build_jars() {
    echo "* Building thrust-core"
    cd ${THRUSTCORE_DIR}
    ./gradlew clean build -x test --no-daemon
    RET="$?"
    if [ ${RET} -ne 0 ]; then
        echo "* \e[31mError\e[m: Error on build \e[1mthrust-core\e[m" >&2
        exit 4
    fi
    
    echo "* Building tpm"
    cd ${TPM_DIR}
    chmod u+x build-tpm.sh
    GRAAL_HOME=${GRAALVM_HOME} TPM_BUILD_NO_TEST="-x test" ./build-tpm.sh
    RET="$?"
    if [ ${RET} -ne 0 ]; then
        echo "* \e[31mError\e[m: Error on build \e[1mtpm\e[m" >&2
        exit 4
    fi
    cd ${BASE_DIR}
}

build_tmp_thrust_dir() {
    echo "* Mount thrust directory"
    
    cd ${THRUST_TEMP_DIR}
    
    cp ${TPM_DIR}/build/tpm .
    cp ${GRAALVM_HOME}/jre/lib/amd64/libsunec.so .
    
    cp ${THRUSTCORE_DIR}/build/libs/thrust.jar jars/.
    cp ${THRUSTCORE_DIR}/scripts/thrust .

    chmod a+x thrust
    chmod a+x tpm
}

mount_thrust_directory() {
    echo "* Copying thrust files...."
    mkdir -p ${INSTALL_DIR}
    RET="$?"
    if [ ${RET} -ne 0 ]; then
        echo "* \e[31mError\e[m: Failed mkdir \e[1m${INSTALL_DIR}\e[m." >&2
        exit 6
    fi

    cp -rf ${THRUST_TEMP_DIR}/* ${INSTALL_DIR}/.
}

# ***********************************************
# Main
# ***********************************************

echo "\e[32mThrust\e[m install from repository"

while getopts 'd:' opt; do
    case "$opt" in
        d) INSTALL_DIR="${OPTARG}";;
        "?") exit 1;;
    esac
done

cleanup
prepare
 trap cleanup EXIT

download_graalvm
install_graalvm
install_native_image
build_jars
build_tmp_thrust_dir
mount_thrust_directory
