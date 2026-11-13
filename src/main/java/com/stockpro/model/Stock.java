package com.stockpro.model;

import jakarta.persistence.*;

@Entity
@Table(name = "stocks")
public class Stock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false, unique = true)
    private String symbol;

    @Column(nullable = false)
    private double price;

    @Column(nullable = false)
    private double previousPrice;

    protected Stock() {}

    public Stock(String companyName, String symbol, double price) {
        this.companyName = companyName;
        this.symbol = symbol;
        this.price = price;
        this.previousPrice = price;
    }

    public Long getId() { return id; }
    public String getCompanyName() { return companyName; }
    public String getSymbol() { return symbol; }
    public double getPrice() { return price; }
    public double getPreviousPrice() { return previousPrice; }

    public void updatePrice(double newPrice) {
        previousPrice = price;
        price = Math.round(newPrice * 100.0) / 100.0;
    }
}
