package com.stockpro.model;

import jakarta.persistence.*;

@Entity
@Table(name = "holdings", uniqueConstraints = @UniqueConstraint(columnNames = "symbol"))
public class Holding {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String symbol;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private double averageBuyPrice;

    protected Holding() {}

    public Holding(String symbol, int quantity, double averageBuyPrice) {
        this.symbol = symbol;
        this.quantity = quantity;
        this.averageBuyPrice = averageBuyPrice;
    }

    public Long getId() { return id; }
    public String getSymbol() { return symbol; }
    public int getQuantity() { return quantity; }
    public double getAverageBuyPrice() { return averageBuyPrice; }

    public void add(int qty, double price) {
        double totalCost = averageBuyPrice * quantity + price * qty;
        quantity += qty;
        averageBuyPrice = totalCost / quantity;
    }

    public void remove(int qty) { quantity -= qty; }
}
