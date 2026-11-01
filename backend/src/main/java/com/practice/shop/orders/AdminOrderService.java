package com.practice.shop.orders;


import com.practice.shop.catalog.Product;
import com.practice.shop.catalog.ProductRepository;
import com.practice.shop.common.BadRequestException;
import com.practice.shop.common.NotFoundException;
import com.practice.shop.common.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdminOrderService {

    private static final Set<String> SORTABLE_FIELDS = Set.of("createdAt", "total", "status");

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public AdminOrderService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    /** All orders (or only one status), as summaries, page by page. */
    @Transactional(readOnly = true)
    public PageResponse<AdminOrderSummary> list(OrderStatus status, Pageable pageable) {
        for (Sort.Order order : pageable.getSort()) {
            if (!SORTABLE_FIELDS.contains(order.getProperty())) {
                throw new BadRequestException("Cannot sort by '" + order.getProperty() + "'. Allowed: createdAt, total, status");
            }
        }
        Page<Order> page = (status == null)
                ? orderRepository.findAll(pageable)
                : orderRepository.findByStatus(status,  pageable);
        return PageResponse.from(page.map(AdminOrderSummary::from));
    }

    @Transactional(readOnly = true)
    public OrderResponse get(UUID publicId) {
        return orderRepository.findByPublicId(publicId)
                .map(OrderResponse::from)
                .orElseThrow(() -> new NotFoundException("Order", publicId));
    }

    public OrderResponse changeStatus(UUID publicId, OrderStatus next) {
        Order order = orderRepository.findByPublicIdForUpdate(publicId)
                .orElseThrow(() -> new NotFoundException("Order", publicId));

        boolean changed = order.changeStatus(next);

        if (changed && next == OrderStatus.CANCELLED) {
            returnStock(order);
        }
        return OrderResponse.from(order);
    }

    private void returnStock(Order order) {
        Map<Long, Integer> quantities = order.getItems().stream()
                .collect(Collectors.toMap(OrderItem::getProductId, OrderItem::getQuantity, Integer::sum));

        for (Product product : productRepository.findAllByIdForUpdate(quantities.keySet())) {
            product.increaseStock(quantities.get(product.getId()));
        }
    }

}
