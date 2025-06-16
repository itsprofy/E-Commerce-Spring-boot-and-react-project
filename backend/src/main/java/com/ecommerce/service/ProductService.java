package com.ecommerce.service;

import com.ecommerce.model.Product;
import com.ecommerce.model.Category;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;

    public Page<Product> getAllProducts(Pageable pageable) {
        Page<Product> products = productRepository.findAll(pageable);
        // Force loading of categories
        products.getContent().forEach(product -> {
            if (product.getCategory() != null) {
                product.getCategory().getName(); // Force loading
            }
        });
        return products;
    }

    public Page<Product> getFeaturedProducts(Pageable pageable) {
        return productRepository.findByFeaturedTrue(pageable);
    }

    public Page<Product> searchByName(String name, Pageable pageable) {
        return productRepository.findByNameContainingIgnoreCase(name, pageable);
    }

    public Page<Product> searchByCategory(String category, Pageable pageable) {
        return productRepository.findByCategoryNameContainingIgnoreCase(category, pageable);
    }

    public Page<Product> searchByCategoryId(Long categoryId, Pageable pageable) {
        return productRepository.findByCategoryId(categoryId, pageable);
    }
    
    public Page<Product> searchByNameAndCategoryId(String name, Long categoryId, Pageable pageable) {
        return productRepository.findByNameContainingIgnoreCaseAndCategoryId(name, categoryId, pageable);
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    @Transactional
    public Product createProduct(Product product) {
        try {
            // If the product has a category, make sure it exists
            if (product.getCategory() != null && product.getCategory().getId() != null) {
                Category category = categoryRepository.findById(product.getCategory().getId())
                        .orElseThrow(() -> new RuntimeException("Category not found with id: " + product.getCategory().getId()));
                product.setCategory(category);
            }
            
            // Validate required fields
            if (product.getName() == null || product.getName().trim().isEmpty()) {
                throw new RuntimeException("Product name is required");
            }
            if (product.getPrice() == null) {
                throw new RuntimeException("Product price is required");
            }
            if (product.getStockQuantity() == null) {
                throw new RuntimeException("Product stock quantity is required");
            }
            
            return productRepository.save(product);
        } catch (Exception e) {
            throw new RuntimeException("Error creating product: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Product updateProduct(Product product) {
        if (!productRepository.existsById(product.getId())) {
            throw new RuntimeException("Product not found with id: " + product.getId());
        }
        
        // If the product has a category, make sure it exists
        if (product.getCategory() != null && product.getCategory().getId() != null) {
            Category category = categoryRepository.findById(product.getCategory().getId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + product.getCategory().getId()));
            product.setCategory(category);
        }
        
        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }
} 