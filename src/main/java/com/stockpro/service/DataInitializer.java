package com.stockpro.service;

import com.stockpro.model.Stock;
import com.stockpro.model.Wallet;
import com.stockpro.repository.StockRepository;
import com.stockpro.repository.WalletRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    private final StockRepository stocks;
    private final WalletRepository wallets;

    public DataInitializer(StockRepository stocks, WalletRepository wallets) {
        this.stocks = stocks;
        this.wallets = wallets;
    }

    @Override
    public void run(String... args) {
        if (stocks.count() == 0) {
            stocks.save(new Stock("Tata Consultancy Services", "TCS", 3500.00));
            stocks.save(new Stock("Infosys", "INFY", 1800.00));
            stocks.save(new Stock("Reliance Industries", "RELIANCE", 2900.00));
            stocks.save(new Stock("HDFC Bank", "HDFCBANK", 1700.00));
            stocks.save(new Stock("Wipro", "WIPRO", 550.00));
            stocks.save(new Stock("ICICI Bank", "ICICIBANK", 1250.00));
            stocks.save(new Stock("Bharti Airtel", "BHARTIARTL", 1650.00));
            stocks.save(new Stock("ITC", "ITC", 450.00));
        }
        if (!wallets.existsById(1L)) wallets.save(new Wallet(50000.00));
    }
}
