package com.practice.shop.orders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminOrderSummary(
        UUID id,
        OrderStatus status,
        List<OrderStatus> nextStatuses,
        String customerName,
        String customerEmail,
        String total,
        Instant createdAt
) {
    static AdminOrderSummary from(Order order) {
        return new AdminOrderSummary(
                order.getPublicId(),
                order.getStatus(),
                order.getStatus().nextStatuses(),
                order.getCustomerName(),
                order.getCustomerEmail(),
                order.getTotal().toPlainString(),
                order.getCreatedAt()
        );
    }
}
