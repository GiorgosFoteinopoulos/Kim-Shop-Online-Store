package com.practice.shop.orders;

import com.practice.shop.catalog.Product;
import com.practice.shop.catalog.ProductRepository;
import com.practice.shop.common.BadRequestException;
import com.practice.shop.common.ConflictException;
import com.practice.shop.common.NotFoundException;
import com.practice.shop.common.UnauthorizedException;
import com.practice.shop.users.AppUser;
import com.practice.shop.users.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final AppUserRepository userRepository;

    public OrderService(AppUserRepository userRepository,OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public OrderResponse placeOrder(PlaceOrderRequest request, String userEmail) {
        AppUser customer = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedException("Account not found"));

        Map<Long, Integer> quantities = new LinkedHashMap<>();
        for (OrderLineRequest line : request.items()) {
            if (quantities.put(line.productId(), line.quantity()) != null) {
                throw new BadRequestException("Product " + line.productId() + " appears more than once.");
            }
        }

        Map<Long, Product> products = productRepository.findAllByIdForUpdate(quantities.keySet()).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));


        Order order = new Order(customer.getId(), customer.getFullName(), customer.getEmail());

        quantities.forEach((productId, quantity) -> {
            Product product = products.get(productId);
            if (product == null) {
                throw new NotFoundException("Product", productId);
            }
            if (!product.isActive()) {
                throw new ConflictException(product.getName() + " is no longer available.");
            }
            product.decreaseStock(quantity);
            order.addItem(product.getId(),product.getName(), product.getPrice(), quantity);
        });
        return OrderResponse.from(orderRepository.save(order));
    }


    @Transactional(readOnly = true)
    public OrderResponse getOrder(UUID publicId, String userEmail) {

        AppUser customer = findCustomer(userEmail);

        return orderRepository.findByPublicIdAndUserId(publicId, customer.getId())
                .map(OrderResponse::from)
                .orElseThrow(() -> new NotFoundException("Order", publicId));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(String userEmail) {
        AppUser customer = findCustomer(userEmail);

        return orderRepository.findAllByUserIdOrderByCreatedAtDesc(customer.getId()).stream()
                .map(OrderResponse::from)
                .toList();
    }

    private AppUser findCustomer(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Account not found"));
    }

}
