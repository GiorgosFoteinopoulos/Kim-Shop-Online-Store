package com.practice.shop.catalog;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 2000) String description,
        @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2)BigDecimal price,
        @NotNull @Min(0) @Max(100_000) Integer stock,
        @Size(max = 500) @Pattern(regexp = "https?://.+", message = "must start with http:// or https://")
        String imageUrl,

        @NotNull @Positive Long categoryId
        ) {
}
