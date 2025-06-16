package com.ecommerce.controller;

import com.ecommerce.model.Product;
import com.ecommerce.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class ProductController {

    private static final Logger logger = LoggerFactory.getLogger(ProductController.class);

    @Autowired
    private ProductService productService;

    @GetMapping
    public ResponseEntity<Page<Product>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort)
    {
        logger.info("Received request to get all products. Page: {}, Size: {}, Sort: {}", page, size, sort);
        try {
            PageRequest pageRequest;
            if (sort != null && !sort.isEmpty()) {
                String[] sortParams = sort.split(",");
                String field = sortParams[0];
                String direction = sortParams.length > 1 ? sortParams[1] : "asc";
                pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction), field));
            } else {
                pageRequest = PageRequest.of(page, size, Sort.by("name"));
            }
            
            Page<Product> products = productService.getAllProducts(pageRequest);
            
            if (products == null || products.isEmpty()) {
                logger.warn("No products found in the database");
                return ResponseEntity.ok(Page.empty());
            }
            
            // Log each product's category
            products.getContent().forEach(product -> {
                logger.info("Product {} (ID: {}) has category: {}", 
                    product.getName(), 
                    product.getId(),
                    product.getCategory() != null ? 
                        String.format("ID: %d, Name: %s", 
                            product.getCategory().getId(), 
                            product.getCategory().getName()) : 
                        "None");
            });
            
            logger.info("Successfully retrieved {} products", products.getTotalElements());
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            logger.error("Error retrieving products: ", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/featured")
    public ResponseEntity<Page<Product>> getFeaturedProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        logger.info("Received request to get featured products. Page: {}, Size: {}", page, size);
        try {
            PageRequest pageRequest = PageRequest.of(page, size, Sort.by("name"));
            Page<Product> products = productService.getFeaturedProducts(pageRequest);
            logger.info("Successfully retrieved {} featured products", products.getTotalElements());
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            logger.error("Error retrieving featured products: ", e);
            throw e;
        }
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Product>> searchProducts(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size)
    {
        logger.info("Received search request. Name: {}, CategoryId: {}, Page: {}, Size: {}", name, categoryId, page, size);
        try {
            PageRequest pageRequest = PageRequest.of(page, size, Sort.by("name"));
            Page<Product> products;
            
            if (name != null && !name.isEmpty() && categoryId != null) {
                // Search by both name and category
                products = productService.searchByNameAndCategoryId(name, categoryId, pageRequest);
                logger.info("Successfully retrieved {} products by name and category", products.getTotalElements());
            } else if (name != null && !name.isEmpty()) {
                // Search by name only
                products = productService.searchByName(name, pageRequest);
                logger.info("Successfully retrieved {} products by name", products.getTotalElements());
            } else if (categoryId != null) {
                // Search by category only
                products = productService.searchByCategoryId(categoryId, pageRequest);
                logger.info("Successfully retrieved {} products by category", products.getTotalElements());
            } else {
                // No search criteria, return all products
                products = productService.getAllProducts(pageRequest);
                logger.info("Successfully retrieved {} products (default search)", products.getTotalElements());
            }
            
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            logger.error("Error searching products: ", e);
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        logger.info("Received request to get product by id: {}", id);
        try {
            Product product = productService.getProductById(id);
            logger.info("Successfully retrieved product with id: {}", id);
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            logger.error("Error retrieving product with id {}: ", id, e);
            throw e;
        }
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody Product product) {
        logger.info("Received request to create product: {}", product.getName());
        try {
            logger.info("Product data received: {}", product);
            
            if (product.getCategory() != null) {
                logger.info("Category ID: {}, Category Name: {}", 
                    product.getCategory().getId(), 
                    product.getCategory().getName());
            }
            
            Product savedProduct = productService.createProduct(product);
            logger.info("Successfully created product with id: {}", savedProduct.getId());
            return ResponseEntity.ok(savedProduct);
        } catch (Exception e) {
            logger.error("Error creating product: ", e);
            logger.error("Error details: {}", e.getMessage());
            if (e.getCause() != null) {
                logger.error("Caused by: {}", e.getCause().getMessage());
            }
            
            // Return a more detailed error message
            String errorMessage = e.getMessage();
            if (errorMessage.contains("Product description must be between")) {
                return ResponseEntity.badRequest().body(errorMessage);
            } else if (errorMessage.contains("Product name must be between")) {
                return ResponseEntity.badRequest().body(errorMessage);
            } else if (errorMessage.contains("Product price is required")) {
                return ResponseEntity.badRequest().body(errorMessage);
            } else if (errorMessage.contains("Product stock quantity")) {
                return ResponseEntity.badRequest().body(errorMessage);
            }
            
            return ResponseEntity.status(500).body("Error creating product: " + errorMessage);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        logger.info("Received request to update product with id: {}", id);
        try {
            product.setId(id);
            Product updatedProduct = productService.updateProduct(product);
            logger.info("Successfully updated product with id: {}", id);
            return ResponseEntity.ok(updatedProduct);
        } catch (Exception e) {
            logger.error("Error updating product with id {}: ", id, e);
            
            // Return a more detailed error message
            String errorMessage = e.getMessage();
            if (errorMessage.contains("Product description must be between")) {
                return ResponseEntity.badRequest().body(errorMessage);
            } else if (errorMessage.contains("Product name must be between")) {
                return ResponseEntity.badRequest().body(errorMessage);
            } else if (errorMessage.contains("Product price is required")) {
                return ResponseEntity.badRequest().body(errorMessage);
            } else if (errorMessage.contains("Product stock quantity")) {
                return ResponseEntity.badRequest().body(errorMessage);
            }
            
            return ResponseEntity.status(500).body("Error updating product: " + errorMessage);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        logger.info("Received request to delete product with id: {}", id);
        try {
            productService.deleteProduct(id);
            logger.info("Successfully deleted product with id: {}", id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error deleting product with id {}: ", id, e);
            throw e;
        }
    }
} 