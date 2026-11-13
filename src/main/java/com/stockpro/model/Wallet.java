package com.stockpro.model;

import jakarta.persistence.*;

@Entity
@Table(name = "wallet")
public class Wallet {
    @Id
    private Long id = 1L;

    @Column(nullable = false)
    private double balance = 50000.0;

    protected Wallet() {}

    public Wallet(double balance) { this.id = 1L; this.balance = balance; }
    public Long getId() { return id; }
    public double getBalance() { return balance; }
    public void debit(double amount) { balance = Math.round((balance - amount) * 100.0) / 100.0; }
    public void credit(double amount) { balance = Math.round((balance + amount) * 100.0) / 100.0; }
}
