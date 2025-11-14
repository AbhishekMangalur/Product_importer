# Product Importer

A Django web application for importing large CSV files (up to 500,000 products) into PostgreSQL with real-time progress tracking and webhook integration.

## Deployed Application

Your application is deployed and accessible at:
**http://194.238.19.109/**

### Security Note

> **Note**: If your browser shows an "unsecure" warning when accessing the site, please proceed by clicking "Advanced" and then "Proceed to 194.238.19.109 (unsafe)" or the equivalent option in your browser. This happens because the site is served over HTTP instead of HTTPS. For a permanent solution, you can set up an SSL certificate using Let's Encrypt.

For production use, I recommend configuring SSL with:
```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d 194.238.19.109
```

## Features

- **File Upload**: Upload large CSV files directly through the web interface
- **Real-time Progress**: Track upload progress with visual indicators
- **Product Management**: View, create, update, and delete products
- **Bulk Operations**: Delete all products with confirmation
- **Webhook Configuration**: Manage and test webhooks via UI
- **Asynchronous Processing**: Handles large files without blocking the UI

## System Architecture

- **Web Framework**: Django 5.2
- **Database**: PostgreSQL (Nhost)
- **Background Processing**: Celery with Redis
- **Frontend**: HTML, CSS, JavaScript with Bootstrap
- **Deployment**: Hostinger VPS with Nginx and Gunicorn

## Prerequisites

- Python 3.8+
- PostgreSQL database (Nhost recommended)
- Redis server
- Hostinger VPS or similar hosting environment

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AbhishekMangalur/Product_importer.git
   cd Product_importer
   ```

2. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file with your configuration:
   ```env
   DEBUG=False
   SECRET_KEY=your_secret_key_here
   DATABASE_URL=postgresql://user:password@host:port/database
   REDIS_URL=redis://localhost:6379/0
   ALLOWED_HOSTS=your_domain_or_ip
   ```

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

6. Collect static files:
   ```bash
   python manage.py collectstatic
   ```

## Deployment on Hostinger VPS

1. Connect to your VPS:
   ```bash
   ssh root@194.238.19.109
   ```

2. Install required packages:
   ```bash
   apt update && apt install -y python3 python3-pip python3-venv nginx redis-server git
   ```

3. Clone and set up the application:
   ```bash
   cd /var/www
   git clone https://github.com/AbhishekMangalur/Product_importer.git
   cd Product_importer
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. Configure systemd services for Django and Celery:
   ```bash
   # Create Django service
   nano /etc/systemd/system/product-importer.service
   
   # Create Celery worker service
   nano /etc/systemd/system/product-importer-worker.service
   ```

5. Configure Nginx:
   ```bash
   nano /etc/nginx/sites-available/product-importer
   ln -s /etc/nginx/sites-available/product-importer /etc/nginx/sites-enabled/
   systemctl restart nginx
   ```

6. Start services:
   ```bash
   systemctl daemon-reload
   systemctl start product-importer
   systemctl start product-importer-worker
   systemctl enable product-importer
   systemctl enable product-importer-worker
   ```

## SSL Configuration

To secure your application with HTTPS:

```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d 194.238.19.109
```

## Usage

1. **Upload Products**: Navigate to the Upload section to import CSV files
2. **Manage Products**: View and edit products in the Products section
3. **Configure Webhooks**: Set up webhooks in the Webhooks section
4. **Monitor Progress**: Track import progress in real-time

## CSV File Format

The application expects CSV files with the following columns:
- `sku`: Product SKU (unique identifier)
- `name`: Product name
- `description`: Product description
- `price`: Product price

Example:
```csv
sku,name,description,price
SKU001,Product 1,Description for Product 1,29.99
SKU002,Product 2,Description for Product 2,39.99
```

## Important Notes

> **Note**: Larger datasets take longer to upload and process. For datasets with 500,000+ records, processing may take several minutes to up to 30 minutes. You can close this page and check back later - the import will continue in the background.

## Troubleshooting

- If you encounter "Failed to start processing" errors, ensure Redis is running:
  ```bash
  systemctl status redis
  systemctl start redis
  ```

- Check application logs:
  ```bash
  journalctl -u product-importer -f
  journalctl -u product-importer-worker -f
  ```

## License

This project is licensed under the MIT License.