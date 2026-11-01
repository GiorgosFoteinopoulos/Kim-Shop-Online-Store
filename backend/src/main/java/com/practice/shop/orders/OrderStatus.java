package com.practice.shop.orders;

import java.util.Arrays;
import java.util.List;

public enum OrderStatus {
    PLACED,
    PAID,
    SHIPPED,
    CANCELLED;

    public boolean canMoveTo(OrderStatus next) {
        return switch (this) {
            case PLACED -> next == PAID || next == CANCELLED;
            case PAID -> next == SHIPPED || next == CANCELLED;
            case SHIPPED, CANCELLED -> false;
        };
    }

    public List<OrderStatus> nextStatuses() {
        return Arrays.stream(values())
                .filter(this::canMoveTo)
                .toList();
    }
}
