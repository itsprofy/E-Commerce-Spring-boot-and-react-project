package com.ecommerce.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import jakarta.validation.constraints.*;

// Entity class representing a product in the e-commerce system
@Data
@Entity
@Table(name = "products")
public class Product {
    // Primary key for the product
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Product name with validation constraints
    @NotBlank(message = "Product name is required")
    @Column(nullable = false)
    private String name;

    // Product description with validation constraints
    @NotBlank(message = "Product description is required")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    // Product price with validation constraints
    @NotNull(message = "Product price is required")
    @DecimalMin(value = "0.01", message = "Product price must be greater than 0")
    @Column(nullable = false)
    private BigDecimal price;

    // Stock quantity with validation constraints
    @NotNull(message = "Stock quantity is required")
    @Min(value = 0, message = "Stock quantity cannot be negative")
    @Column(nullable = false)
    private Integer stockQuantity;

    // Flag indicating if the product is featured
    private boolean featured = false;

    // Category relationship (many-to-one)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    // Additional images relationship (one-to-many)
    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    private List<ProductImage> additionalImages = new ArrayList<>();

    // Comments relationship (one-to-many)
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"product"})
    private List<Comment> comments = new ArrayList<>();

    // Questions relationship
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"product"})
    private List<Question> questions = new ArrayList<>();

    // Main product image URL
    @Column(name = "main_image_url", length = 1000)
    private String mainImageUrl;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public Boolean getFeatured() {
        return featured;
    }

    public void setFeatured(Boolean featured) {
        this.featured = featured;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public List<String> getAdditionalImages() {
        return additionalImages.stream()
                .map(ProductImage::getImageUrl)
                .toList();
    }

    public void setAdditionalImages(List<String> imageUrls) {
        this.additionalImages.clear();
        if (imageUrls != null) {
            imageUrls.forEach(url -> {
                if (url != null && !url.trim().isEmpty()) {
                    ProductImage productImage = new ProductImage();
                    productImage.setProduct(this);
                    productImage.setImageUrl(url.trim());
                    this.additionalImages.add(productImage);
                }
            });
        }
    }
    
    public List<Comment> getComments() {
        return comments;
    }
    
    public void setComments(List<Comment> comments) {
        this.comments = comments;
    }

    public List<Question> getQuestions() {
        return questions;
    }
    
    public void setQuestions(List<Question> questions) {
        this.questions = questions;
    }
} 