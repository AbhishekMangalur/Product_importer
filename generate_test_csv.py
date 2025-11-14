import csv
import sys

def generate_test_csv(filename, num_records=1000):
    """
    Generate a CSV file with product data for testing
    """
    print(f"Generating CSV file with {num_records:,} records...")
    
    with open(filename, 'w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        
        # Write header
        writer.writerow(['sku', 'name', 'description', 'price'])
        
        # Write product rows
        for i in range(1, num_records + 1):
            sku = f'SKU-{i:05d}'
            name = f'Product {i}'
            description = f'Description for product {i} with some additional text to make it longer'
            price = f'{(i * 1.99) % 1000:.2f}'
            
            writer.writerow([sku, name, description, price])
            
            # Show progress every 1,000 rows
            if i % 1000 == 0:
                print(f"Generated {i:,} records...")
    
    print(f"CSV file '{filename}' with {num_records:,} records generated successfully!")

if __name__ == "__main__":
    # Default to 10,000 records if no argument provided
    num_records = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
    filename = sys.argv[2] if len(sys.argv) > 2 else 'test_10k_products.csv'
    
    generate_test_csv(filename, num_records)