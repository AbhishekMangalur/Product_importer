@echo off
echo Starting Product Importer application...
echo This will start PostgreSQL, Redis, Django web server, and Celery worker...
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

REM Check if docker-compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: docker-compose is not installed. Please install docker-compose first.
    pause
    exit /b 1
)

REM Start services
echo Starting services...
docker-compose up -d

echo.
echo Services started successfully!
echo Web application: http://localhost:8000
echo PostgreSQL: localhost:5432
echo Redis: localhost:6379
echo.
echo To stop services, run: docker-compose down
echo.
pause