package com.stockpro.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "trade_transactions")
public class TradeTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Instant transactionDate;

    @Column(nullable = false)
    private String transactionType;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String stockSymbol;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private double price;

    @Column(nullable = false)
    private double totalAmount;

    protected TradeTransaction() {}

    public TradeTransaction(String type, String company, String symbol, int quantity, double price) {
        this.transactionDate = Instant.now();
        this.transactionType = type;
        this.companyName = company;
        this.stockSymbol = symbol;
        this.quantity = quantity;
        this.price = price;
        this.totalAmount = Math.round(quantity * price * 100.0) / 100.0;
    }

    public Long getId() { return id; }
    public Instant getTransactionDate() { return transactionDate; }
    public String getTransactionType() { return transactionType; }
    public String getCompanyName() { return companyName; }
    public String getStockSymbol() { return stockSymbol; }
    public int getQuantity() { return quantity; }
    public double getPrice() { return price; }
    public double getTotalAmount() { return totalAmount; }
}
