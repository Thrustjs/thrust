@echo off
rem Setup the JVM

if "x%JAVA_HOME%" == "x" (
  set  JAVA=java
  echo JAVA_HOME is not set. Unexpected results may occur.
  echo Set JAVA_HOME to the directory of your local JDK to avoid this message.
) else (
  if not exist "%JAVA_HOME%" (
    echo JAVA_HOME "%JAVA_HOME%" path doesn't exist
    goto :EOF
  ) else (
    rem Setting JAVA property to "%JAVA_HOME%\bin\java"
    set "JAVA=%JAVA_HOME%\bin\java"
  )
)

"%JAVA%" -version 2>&1 | findstr /I /R /C:"java version .1.[8-9]" > nul
if errorlevel == 1 (
    echo "ERROR: You should install Java >= 8 version before running any Thrust app"
    goto :EOF
)

rem Running app
"%JAVA%" -jar ./thrust.jar %*
