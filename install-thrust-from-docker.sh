#!/bin/sh

# ============================================================
# script: install-thrust-from-docker
# description: Mounts and install trhust from a docker image.
#
# ./install-thrust-from-docker.sh installs on /opt/thrust
# ./install-thrust-from-docker.sh -d <dir> installs on <dir>.
# ============================================================

# ------------------------------------------------
# Global variables
# ------------------------------------------------

INSTALL_DIR=/opt/thrust
DOCKER_IMAGE_NAME=thrust-build-0.8.0
DOCKER_TRASH_IMAGE=thrust-trash-image

# ------------------------------------------------
# Functions
# ------------------------------------------------

build_docker_image() {
  echo "Building docker image..."
  docker build -t ${DOCKER_IMAGE_NAME} .
  RET=$?
  if [ $RET -ne 0 ]; then
    echo "Failed to build docker image" >&2
    exit 1
  fi
}

remove_docker_image() {
    echo "Removing docker image: ${DOCKER_IMAGE_NAME}."
    docker image rm ${DOCKER_IMAGE_NAME}
}

remove_trash_image() {
    docker rm -f ${DOCKER_TRASH_IMAGE}
}

install_image_from_docker() {
  echo "Installing thrust/tpm from Docker..."

  docker create -ti --name ${DOCKER_TRASH_IMAGE} ${DOCKER_IMAGE_NAME} bash
  RET=$?
  if [ $RET -ne 0 ]; then
    echo "!!! Failed to build temporary docker container." >&2
    exit 2
  fi

  if [ -d ${INSTALL_DIR} ]; then
    echo "* Removing old directory..."
    rm -rf ${INSTALL_DIR}
    RET=$?
    if [ $RET -ne 0 ]; then
      echo "!!! Failed to remove directory: $INSTALL_DIR." >&2
      remove_trash_image
      exit 3
    fi
  fi
  echo "Creating directory: ${INSTALL_DIR}."
  
  echo "Copying tpm."
  docker cp ${DOCKER_TRASH_IMAGE}:/opt/thrust ${INSTALL_DIR}
  RET=$?
  if [ $RET -ne 0 ]; then
    echo "!!! Failed to copy tpm to $INSTALL_DIR." >&2
    remove_trash_image
    exit 4
  fi
  echo "Stopping docker container image"
  remove_trash_image
}

post_copy() {
  cd ${INSTALL_DIR}
  echo "Add permissions to files"
  chmod a+x ./tpm
  chmod a+x ./thrust
}

# ------------------------------------------------
# Main
# ------------------------------------------------

echo "Thrust install from Docker."

while getopts "d:" opt; do
  case "$opt" in
    d) INSTALL_DIR="${OPTARG}";;
    "?") exit 1;;
  esac
done

echo "Prepare to install thrust in: ${INSTALL_DIR}"

remove_docker_image
build_docker_image
install_image_from_docker
post_copy
remove_docker_image

echo "Thrust installation ended."