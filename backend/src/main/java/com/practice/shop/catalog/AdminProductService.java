package com.practice.shop.catalog;


import com.practice.shop.common.BadRequestException;
import com.practice.shop.common.NotFoundException;
import com.practice.shop.common.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;


@Service
@Transactional
public class AdminProductService {

    private static final Set<String> SORTABLE_FIELDS = Set.of("id", "name", "price", "stock");

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public AdminProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminProductResponse> list(Pageable pageable) {
        for (Sort.Order order : pageable.getSort()) {
            if (!SORTABLE_FIELDS.contains(order.getProperty())) {
                throw new BadRequestException("Cannot sort by '" + order.getProperty() + "'. Allowed: id, name, price, stock");
            }
        }
        return PageResponse.from(productRepository.findAllForAdmin(pageable).map(AdminProductResponse::from));
    }

    @Transactional(readOnly = true)
    public AdminProductResponse get(long id) {
        return productRepository.findById(id)
                .map(AdminProductResponse::from)
                .orElseThrow(() -> new NotFoundException("Product", id));
    }

    public AdminProductResponse create(ProductRequest request) {
        Product product = new Product(
                request.name().trim(),
                blankToNull(request.description()),
                request.price(),
                request.stock(),
                blankToNull(request.imageUrl()),
                findCategory(request.categoryId()));
        return AdminProductResponse.from(productRepository.save(product));
    }

    public AdminProductResponse update(long id, ProductRequest request) {
        Product product = lockProduct(id);
        product.update(
                request.name().trim(),
                blankToNull(request.description()),
                request.price(),
                request.stock(),
                blankToNull(request.imageUrl()),
                findCategory(request.categoryId()));
        return AdminProductResponse.from(product);
    }

    public void archive(long id) {
        lockProduct(id).archive();
    }

    public AdminProductResponse restore(long id) {
        Product product = lockProduct(id);
        product.restore();
        return AdminProductResponse.from(product);
    }

    private Product lockProduct(long id) {
        return productRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Product", id));
    }

    private Category findCategory(long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Category " + id + " does not exist."));
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }


}
