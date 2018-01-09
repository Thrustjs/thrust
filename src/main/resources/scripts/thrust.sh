#!/bin/sh

# Setup the JVM
if [ "x$JAVA" = "x" ]; then
  if [ "x$JAVA_HOME" != "x" ]; then
    JAVA="$JAVA_HOME/bin/java"
  else
    JAVA="java"
  fi
fi

# Check if Java 8 is installed
if ! eval "$JAVA" -version 2>&1 >/dev/null | grep -q "java version \"1.8" ; then
  echo "ERROR: You should install Java >= 8 version before running any Thrust app"
  exit 1  
fi

# Running app
eval "$JAVA" -jar /opt/thrust/lib/thrust.jar $1
