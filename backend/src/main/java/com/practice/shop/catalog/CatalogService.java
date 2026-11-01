package com.practice.shop.catalog;


import com.practice.shop.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import com.practice.shop.common.BadRequestException;
import com.practice.shop.common.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Set;

@Service
@Transactional(readOnly = true)
public class CatalogService {

    private static final Set<String> SORTABLE_FIELDS = Set.of("name", "price", "id");

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CatalogService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public PageResponse<ProductResponse> listProducts(String categorySlug, String search, Pageable pageable) {
        for (Sort.Order order : pageable.getSort()) {
            if (!SORTABLE_FIELDS.contains(order.getProperty())) {
                throw new BadRequestException("Cannot sort by '" + order.getProperty() + "'. Allowed: name, price, id");
            }
        }
        Page<Product> page = productRepository.search(blankToNull(categorySlug), searchTerm(search), pageable);
        return PageResponse.from(page.map(ProductResponse::from));
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.strip();
    }


    private static String searchTerm(String value) {
        return (value == null || value.isBlank()) ? "" : value.strip();
    }
    public List<CategoryResponse> listCategories() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(CategoryResponse::from)
                .toList();
    }

    public ProductResponse getProduct(long id) {
        return productRepository.findByIdAndActiveTrue(id)
                .map(ProductResponse::from)
                .orElseThrow(() -> new NotFoundException("Product", id));
    }
}

