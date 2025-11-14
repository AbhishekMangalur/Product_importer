document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing products page');
    
    // Load products on page load
    loadProducts();

    // Filter form handling
    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        document.getElementById('skuFilter').addEventListener('input', loadProducts);
        document.getElementById('nameFilter').addEventListener('input', loadProducts);
        document.getElementById('descriptionFilter').addEventListener('input', loadProducts);
        document.getElementById('activeFilter').addEventListener('change', loadProducts);
        document.getElementById('clearFilters').addEventListener('click', clearFilters);
    }

    // Add product form handling
    const saveProductBtn = document.getElementById('saveProductBtn');
    if (saveProductBtn) {
        saveProductBtn.addEventListener('click', saveProduct);
    }

    // Bulk delete handling
    const confirmBulkDelete = document.getElementById('confirmBulkDelete');
    if (confirmBulkDelete) {
        confirmBulkDelete.addEventListener('click', bulkDeleteProducts);
    }

    function loadProducts() {
        const skuFilter = document.getElementById('skuFilter').value;
        const nameFilter = document.getElementById('nameFilter').value;
        const descriptionFilter = document.getElementById('descriptionFilter').value;
        const activeFilter = document.getElementById('activeFilter').value;

        let url = '/api/products/?format=json';
        if (skuFilter) url += `&sku=${encodeURIComponent(skuFilter)}`;
        if (nameFilter) url += `&search=${encodeURIComponent(nameFilter)}`;
        if (descriptionFilter) url += `&description=${encodeURIComponent(descriptionFilter)}`;
        if (activeFilter) url += `&active=${activeFilter}`;

        fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.getElementById('productsTableBody');
            tableBody.innerHTML = '';

            if (!data || !data.results) {
                // Show error message
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="6" class="text-center text-danger">
                        Error loading products. Please try again.
                    </td>
                `;
                tableBody.appendChild(row);
                return;
            }

            if (data.results.length === 0) {
                // Show a message when no products are found
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="6" class="text-center">
                        No products found matching the current filters
                    </td>
                `;
                tableBody.appendChild(row);
            } else {
                data.results.forEach(product => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${product.sku}</td>
                        <td>${product.name}</td>
                        <td>${product.description || ''}</td>
                        <td>$${parseFloat(product.price).toFixed(2)}</td>
                        <td>${product.active ? 'Active' : 'Inactive'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${product.id}">Edit</button>
                            <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${product.id}">Delete</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            }

            // Add event listeners to action buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    editProduct(this.dataset.id);
                });
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    deleteProduct(this.dataset.id);
                });
            });

            // Render pagination
            renderPagination(data);
        })
        .catch(error => {
            console.error('Error loading products:', error);
            const tableBody = document.getElementById('productsTableBody');
            tableBody.innerHTML = '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="6" class="text-center text-danger">
                    Error loading products: ${error.message}
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    function renderPagination(data) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        if (data.previous) {
            const prevItem = document.createElement('li');
            prevItem.className = 'page-item';
            prevItem.innerHTML = `<a class="page-link" href="#" data-url="${data.previous}">Previous</a>`;
            prevItem.querySelector('a').addEventListener('click', function(e) {
                e.preventDefault();
                loadProductsFromUrl(this.dataset.url);
            });
            pagination.appendChild(prevItem);
        }

        if (data.next) {
            const nextItem = document.createElement('li');
            nextItem.className = 'page-item';
            nextItem.innerHTML = `<a class="page-link" href="#" data-url="${data.next}">Next</a>`;
            nextItem.querySelector('a').addEventListener('click', function(e) {
                e.preventDefault();
                loadProductsFromUrl(this.dataset.url);
            });
            pagination.appendChild(nextItem);
        }
    }

    function loadProductsFromUrl(url) {
        fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Update table with new data
            const tableBody = document.getElementById('productsTableBody');
            tableBody.innerHTML = '';

            if (!data || !data.results) {
                // Show error message
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="6" class="text-center text-danger">
                        Error loading products. Please try again.
                    </td>
                `;
                tableBody.appendChild(row);
                return;
            }

            if (data.results.length === 0) {
                // Show a message when no products are found
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="6" class="text-center">
                        No products found matching the current filters
                    </td>
                `;
                tableBody.appendChild(row);
            } else {
                data.results.forEach(product => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${product.sku}</td>
                        <td>${product.name}</td>
                        <td>${product.description || ''}</td>
                        <td>$${parseFloat(product.price).toFixed(2)}</td>
                        <td>${product.active ? 'Active' : 'Inactive'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${product.id}">Edit</button>
                            <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${product.id}">Delete</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            }

            // Add event listeners to action buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    editProduct(this.dataset.id);
                });
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    deleteProduct(this.dataset.id);
                });
            });

            // Render pagination
            renderPagination(data);
        })
        .catch(error => {
            console.error('Error loading products:', error);
            const tableBody = document.getElementById('productsTableBody');
            tableBody.innerHTML = '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="6" class="text-center text-danger">
                    Error loading products: ${error.message}
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    function clearFilters() {
        document.getElementById('skuFilter').value = '';
        document.getElementById('nameFilter').value = '';
        document.getElementById('descriptionFilter').value = '';
        document.getElementById('activeFilter').value = '';
        loadProducts();
    }

    function saveProduct() {
        const form = document.getElementById('addProductForm');
        const productId = form.getAttribute('data-edit-id');
        
        const sku = document.getElementById('sku').value;
        const name = document.getElementById('name').value;
        const description = document.getElementById('description').value;
        const price = document.getElementById('price').value;
        const active = document.getElementById('active').checked;

        const productData = {
            sku: sku,
            name: name,
            description: description,
            price: price,
            active: active
        };

        let url, method;
        if (productId) {
            // Update existing product
            url = `/api/products/${productId}/`;
            method = 'PUT';
        } else {
            // Create new product
            url = '/api/products/';
            method = 'POST';
        }

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.id || data.sku) {
                // Close modal and refresh product list
                const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
                modal.hide();
                loadProducts();
                
                // Reset form
                document.getElementById('addProductForm').reset();
                form.removeAttribute('data-edit-id');
                document.querySelector('#addProductModal .modal-title').textContent = 'Add Product';
                document.getElementById('saveProductBtn').textContent = 'Save Product';
            } else {
                alert('Error saving product: ' + JSON.stringify(data));
            }
        })
        .catch(error => {
            alert('Error saving product: ' + error.message);
        });
    }

    function editProduct(id) {
        // Fetch the product data
        fetch(`/api/products/${id}/`)
        .then(response => response.json())
        .then(product => {
            // Populate the form with existing data
            document.getElementById('sku').value = product.sku;
            document.getElementById('name').value = product.name;
            document.getElementById('description').value = product.description || '';
            document.getElementById('price').value = product.price;
            document.getElementById('active').checked = product.active;
            
            // Set a data attribute to indicate we're editing
            const form = document.getElementById('addProductForm');
            form.setAttribute('data-edit-id', id);
            
            // Change the modal title and save button text
            document.querySelector('#addProductModal .modal-title').textContent = 'Edit Product';
            document.getElementById('saveProductBtn').textContent = 'Update Product';
            
            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('addProductModal'));
            modal.show();
        })
        .catch(error => {
            alert('Error loading product: ' + error.message);
        });
    }

    function deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            fetch(`/api/products/${id}/`, {
                method: 'DELETE'
            })
            .then(response => {
                if (response.ok) {
                    loadProducts();
                } else {
                    alert('Error deleting product');
                }
            })
            .catch(error => {
                alert('Error deleting product: ' + error.message);
            });
        }
    }

    function bulkDeleteProducts() {
        if (confirm('Are you sure you want to delete ALL products? This action cannot be undone.')) {
            fetch('/api/products/bulk-delete/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({confirm: true})
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    // Close modal and refresh product list
                    const modal = bootstrap.Modal.getInstance(document.getElementById('bulkDeleteModal'));
                    modal.hide();
                    loadProducts();
                    alert(data.message);
                } else {
                    alert('Error deleting products: ' + JSON.stringify(data));
                }
            })
            .catch(error => {
                alert('Error deleting products: ' + error.message);
            });
        }
    }
});