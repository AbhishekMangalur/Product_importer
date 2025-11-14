#!/bin/bash

# Start all services with Docker Compose
echo "Starting Product Importer application..."
echo "This will start PostgreSQL, Redis, Django web server, and Celery worker..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Start services
echo "Starting services..."
docker-compose up -d

echo ""
echo "Services started successfully!"
echo "Web application: http://localhost:8000"
echo "PostgreSQL: localhost:5432"
echo "Redis: localhost:6379"
echo ""
echo "To stop services, run: docker-compose down"