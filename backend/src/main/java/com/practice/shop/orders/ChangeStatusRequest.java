package com.practice.shop.orders;


import jakarta.validation.constraints.NotNull;

public record ChangeStatusRequest(@NotNull OrderStatus status)  {
}
