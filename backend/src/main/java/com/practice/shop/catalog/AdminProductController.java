package com.practice.shop.catalog;


import com.practice.shop.common.PageResponse;
import jakarta.validation.Valid;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;


@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    private final AdminProductService adminProductService;

    public AdminProductController(AdminProductService adminProductService) {
        this.adminProductService = adminProductService;
    }

    @GetMapping
    public PageResponse<AdminProductResponse> list(@PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return adminProductService.list(pageable);

    }

    @GetMapping("/{id}")
    public AdminProductResponse get(@PathVariable long id) {
        return adminProductService.get(id);
    }

    @PostMapping
    public ResponseEntity<AdminProductResponse> create(@Valid @RequestBody ProductRequest request) {
        AdminProductResponse created = adminProductService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public AdminProductResponse update(@PathVariable long id, @Valid @RequestBody ProductRequest request) {
            return adminProductService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@PathVariable long id) {
        adminProductService.archive(id);
    }

    @PostMapping("/{id}/restore")
    public AdminProductResponse restore(@PathVariable long id) {
        return adminProductService.restore(id);
    }
}
