package com.practice.shop.catalog;

public record AdminProductResponse(
        Long id,
        String name,
        String description,
        String price,
        int stock,
        String imageUrl,
        CategoryResponse category,
        boolean active
) {
    static AdminProductResponse from(Product product) {
        return new AdminProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice().toPlainString(),
                product.getStock(),
                product.getImageUrl(),
                CategoryResponse.from(product.getCategory()),
                product.isActive()
        );
    }
}
