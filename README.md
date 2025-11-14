# Product Importer Application

A Django web application for importing large CSV files (up to 500,000 products) into a PostgreSQL database with real-time progress tracking, webhook integration, and product management capabilities.

## Features

1. **File Upload via UI**
   - Upload large CSV files (up to 500,000 products)
   - Real-time progress indicator during upload
   - Automatic duplicate handling based on SKU (case-insensitive)
   - Optimized for large file processing

2. **Upload Progress Visibility**
   - Real-time progress updates in the UI
   - Visual progress bar and percentage indicators
   - Status messages ("Parsing CSV", "Validating", "Import Complete")
   - Error handling with retry options

3. **Product Management UI**
   - View, create, update, and delete products
   - Filtering by SKU, name, active status, or description
   - Paginated product listings
   - Inline editing and modal forms

4. **Bulk Delete**
   - Delete all products with confirmation dialog
   - Success/failure notifications
   - Visual feedback during processing

5. **Webhook Configuration**
   - Add, edit, test, and delete webhooks
   - Configure webhook URLs and event types
   - Enable/disable webhooks
   - Test triggers with response feedback

## Technology Stack

- **Web Framework**: Django (Python)
- **Database**: PostgreSQL (Nhost)
- **Asynchronous Processing**: Celery with Redis
- **Frontend**: HTML/CSS/JavaScript with Bootstrap
- **Deployment**: Render

## Quick Start with Docker Compose

The easiest way to run the application is with Docker Compose, which will automatically set up all required services:

1. Make sure you have Docker and Docker Compose installed
2. Run the application:
   ```bash
   # On Linux/Mac:
   ./start.sh
   
   # On Windows:
   start.bat
   ```
   
   Or manually:
   ```bash
   docker-compose up -d
   ```

3. Access the application at http://localhost:8000

This will start all required services:
- PostgreSQL database on port 5432
- Redis server on port 6379
- Django web server on port 8000
- Celery worker for background processing

## Application Components

### 1. File Upload System
- **Location**: `/upload/`
- **Features**:
  - CSV file upload with validation
  - Real-time progress tracking (0-100%)
  - Fake progress simulation during upload phase (0-70%)
  - Real progress during processing phase (70-100%)
  - Upload duration tracking in seconds
  - Case-insensitive SKU handling with automatic overwrite
  - Asynchronous processing with Celery
  - Error handling and retry mechanisms

### 2. Product Management
- **Location**: `/products/`
- **Features**:
  - View all products with pagination
  - Filter by SKU, name, description, and active status
  - Create new products via modal form
  - Edit existing products
  - Delete individual products with confirmation
  - Bulk delete all products with confirmation
  - Real-time search with debounced input

### 3. Webhook Management
- **Location**: `/webhooks/`
- **Features**:
  - View all configured webhooks
  - Add new webhooks with URL and event type
  - Edit existing webhooks
  - Enable/disable webhooks
  - Delete webhooks with confirmation
  - Test webhooks with detailed response feedback
  - Response code and timing information

### 4. API Endpoints

#### Products API
- `GET /api/products/` - List all products (paginated)
- `POST /api/products/` - Create a new product
- `GET /api/products/{id}/` - Get a specific product
- `PUT /api/products/{id}/` - Update a specific product
- `DELETE /api/products/{id}/` - Delete a specific product
- `POST /api/products/bulk-delete/` - Delete all products

#### Webhooks API
- `GET /api/webhooks/` - List all webhooks (paginated)
- `POST /api/webhooks/` - Create a new webhook
- `GET /api/webhooks/{id}/` - Get a specific webhook
- `PUT /api/webhooks/{id}/` - Update a specific webhook
- `DELETE /api/webhooks/{id}/` - Delete a specific webhook
- `POST /api/webhooks/{id}/test/` - Test a specific webhook

#### File Processor API
- `POST /api/file-processor/upload/` - Upload a CSV file
- `GET /api/file-processor/status/{id}/` - Get upload status

## Deployment Instructions

### Prerequisites

1. Create a Render account: https://render.com
2. Create an Nhost account and PostgreSQL database: https://nhost.io

### Deploying to Render

1. Fork this repository to your GitHub account
2. Log in to Render Dashboard
3. Click "New+" and select "Web Service"
4. Connect your GitHub account and select your forked repository
5. Configure the service:
   - Name: `product-importer`
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - Start Command: `gunicorn product_importer.wsgi:application`
6. Add environment variables:
   - `DATABASE_URL`: Your Nhost PostgreSQL connection string
   - `REDIS_URL`: Render will automatically populate this
   - `SECRET_KEY`: Generate a secure secret key
   - `DEBUG`: Set to `False` for production
7. Click "Create Web Service"

### Setting up Redis

1. In the Render Dashboard, click "New+" and select "Redis"
2. Name it `product-importer-redis`
3. Select the free tier

### Setting up Celery Worker

1. In the Render Dashboard, click "New+" and select "Background Worker"
2. Connect to the same repository
3. Configure the service:
   - Name: `product-importer-worker`
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `celery -A product_importer worker --loglevel=info`
4. Add the same environment variables as the web service

### Configuring Nhost PostgreSQL

1. Log in to your Nhost dashboard
2. Create a new project or use an existing one
3. Get your PostgreSQL connection string from the database settings
4. Update the `DATABASE_URL` environment variable in Render with this connection string

### Running Migrations

After deployment, you'll need to run database migrations:

1. Go to your web service in Render
2. Click on "Manual Deploy" → "Run Migration"
3. Or use the Render Shell to run:
   ```
   python manage.py migrate
   ```

## Local Development

### Prerequisites

- Python 3.8+
- PostgreSQL
- Redis

### Setup with All Services

The recommended approach is to use Docker Compose as described in the Quick Start section above.

### Manual Setup

If you prefer to run services manually:

1. Clone the repository:
   ```
   git clone <repository-url>
   cd product-importer
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/product_importer
   REDIS_URL=redis://localhost:6379
   SECRET_KEY=your-secret-key
   DEBUG=True
   ```

5. Run migrations:
   ```
   python manage.py migrate
   ```

6. Create a superuser:
   ```
   python manage.py createsuperuser
   ```

7. Start the development server:
   ```
   python manage.py runserver
   ```

8. In another terminal, start the Celery worker:
   ```
   celery -A product_importer worker --loglevel=info
   ```

## Graceful Fallback

The application is designed to work smoothly even when Redis is not available:

- **With Redis**: Uses Celery for asynchronous background processing
- **Without Redis**: Automatically falls back to synchronous processing
- **Development Mode**: Uses synchronous execution by default for easier debugging

## Architecture

The application uses a distributed architecture to handle large file imports efficiently:

1. **Web Interface**: Django serves the frontend and handles user interactions
2. **File Upload**: Files are uploaded asynchronously to avoid timeouts
3. **Task Queue**: Celery processes file imports in the background
4. **Database**: PostgreSQL stores products and application data
5. **Real-time Updates**: WebSocket-like functionality through periodic AJAX polling
6. **Webhooks**: Configurable webhooks for external integrations

## Handling Long Operations

To handle the 30-second timeout limitation on platforms like Render:

1. File uploads are processed asynchronously using Celery
2. Progress is tracked in the database and updated in real-time
3. Users can close the browser and return later to check progress
4. Webhooks are triggered upon completion/failure
5. Large operations are chunked into smaller tasks when possible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.