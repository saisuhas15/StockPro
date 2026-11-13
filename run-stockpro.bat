@echo off
title StockPro
echo ======================================
echo            STOCKPRO START
echo ======================================
where mvn >nul 2>nul
if errorlevel 1 (
  echo Maven was not found. Install Maven and add it to PATH.
  pause
  exit /b 1
)
where java >nul 2>nul
if errorlevel 1 (
  echo Java was not found. Install Java 21 and add it to PATH.
  pause
  exit /b 1
)
mvn spring-boot:run
pause
