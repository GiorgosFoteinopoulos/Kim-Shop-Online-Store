package com.practice.shop.orders;


import com.practice.shop.common.ConflictException;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name= "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;

    @Column(name="user_id", updatable = false)
    private Long userId;

    @Column(name = "customer_name", nullable = false,  length = 100)
    private String customerName;

    @Column(name = "customer_email", nullable = false, length = 254)
    private String customerEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<OrderItem> items = new ArrayList<>();

    protected Order() {

    }

    public Order(Long userId,String customerName, String customerEmail) {
        this.publicId = UUID.randomUUID();
        this.userId = userId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.status = OrderStatus.PLACED;
        this.total = new BigDecimal("0.00");
        this.createdAt = Instant.now();
    }

    public void addItem(Long productId, String productName, BigDecimal unitPrice, int quantity) {
        OrderItem item = new OrderItem(this, productId, productName, unitPrice, quantity);
        items.add(item);
        total = total.add(item.getLineTotal());
    }

    public boolean changeStatus(OrderStatus next) {
        if (next == status) {
            return false;
        }
        if (!status.canMoveTo(next)) {
            throw new ConflictException("Cannot change order status from " + status + " to " + next + ".");
        }
        status = next;
        return true;
    }

    public Long getId() {
        return id;
    }
    public Long getUserId() {return userId;}
    public UUID getPublicId() {
        return publicId;
    }
    public String getCustomerName() {
        return customerName;
    }
    public String getCustomerEmail() {
        return customerEmail;
    }
    public OrderStatus getStatus() {
        return status;
    }
    public BigDecimal getTotal() {
        return total;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
    public List<OrderItem> getItems() {
        return List.copyOf(items);
    }
}
