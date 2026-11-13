package com.stockpro.service;

import com.stockpro.model.*;
import com.stockpro.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class TradingService {
    private final StockRepository stocks;
    private final HoldingRepository holdings;
    private final TradeTransactionRepository transactions;
    private final WalletRepository wallets;

    public TradingService(StockRepository stocks, HoldingRepository holdings,
                          TradeTransactionRepository transactions, WalletRepository wallets) {
        this.stocks = stocks;
        this.holdings = holdings;
        this.transactions = transactions;
        this.wallets = wallets;
    }

    public List<Stock> getStocks() {
        return stocks.findAll().stream().sorted(Comparator.comparing(Stock::getSymbol)).toList();
    }

    public Stock getStock(String symbol) {
        return stocks.findBySymbolIgnoreCase(symbol)
                .orElseThrow(() -> new IllegalArgumentException("Stock not found: " + symbol));
    }

    @Transactional
    public void updatePrices() {
        Random random = new Random();
        for (Stock stock : stocks.findAll()) {
            double movement = (random.nextDouble() - 0.49) * 0.0018;
            stock.updatePrice(Math.max(1.0, stock.getPrice() * (1.0 + movement)));
        }
    }

    public Map<String, Object> dashboard() {
        Wallet wallet = getWallet();
        double investment = holdings.findAll().stream()
                .mapToDouble(h -> h.getAverageBuyPrice() * h.getQuantity()).sum();
        double portfolioValue = holdings.findAll().stream()
                .mapToDouble(h -> getStock(h.getSymbol()).getPrice() * h.getQuantity()).sum();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("username", "Trader");
        result.put("walletBalance", round(wallet.getBalance()));
        result.put("totalInvestment", round(investment));
        result.put("portfolioValue", round(portfolioValue));
        result.put("profitLoss", round(portfolioValue - investment));
        return result;
    }

    public List<Map<String, Object>> portfolio() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Holding holding : holdings.findAll()) {
            Stock stock = getStock(holding.getSymbol());
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("stockId", stock.getId());
            row.put("stock", Map.of("id", stock.getId(), "companyName", stock.getCompanyName(),
                    "symbol", stock.getSymbol(), "price", stock.getPrice()));
            row.put("quantity", holding.getQuantity());
            row.put("averageBuyPrice", round(holding.getAverageBuyPrice()));
            result.add(row);
        }
        return result;
    }

    public List<TradeTransaction> transactionHistory() {
        return transactions.findAllByOrderByTransactionDateDesc();
    }

    @Transactional
    public TradeTransaction buy(String symbol, int quantity) {
        validateQuantity(quantity);
        Stock stock = getStock(symbol);
        double total = round(stock.getPrice() * quantity);
        Wallet wallet = getWallet();
        if (total > wallet.getBalance()) throw new IllegalArgumentException("Insufficient wallet balance.");
        wallet.debit(total);

        Holding holding = holdings.findBySymbolIgnoreCase(stock.getSymbol()).orElse(null);
        if (holding == null) holdings.save(new Holding(stock.getSymbol(), quantity, stock.getPrice()));
        else holding.add(quantity, stock.getPrice());

        wallets.save(wallet);
        return transactions.save(new TradeTransaction("BUY", stock.getCompanyName(),
                stock.getSymbol(), quantity, stock.getPrice()));
    }

    @Transactional
    public TradeTransaction sell(String symbol, int quantity) {
        validateQuantity(quantity);
        Stock stock = getStock(symbol);
        Holding holding = holdings.findBySymbolIgnoreCase(stock.getSymbol())
                .orElseThrow(() -> new IllegalArgumentException("You do not own this stock."));
        if (holding.getQuantity() < quantity)
            throw new IllegalArgumentException("You do not have enough shares to sell.");

        double price = stock.getPrice();
        holding.remove(quantity);
        if (holding.getQuantity() == 0) holdings.delete(holding);
        Wallet wallet = getWallet();
        wallet.credit(round(price * quantity));
        wallets.save(wallet);

        return transactions.save(new TradeTransaction("SELL", stock.getCompanyName(),
                stock.getSymbol(), quantity, price));
    }

    public Wallet getWallet() {
        return wallets.findById(1L).orElseGet(() -> wallets.save(new Wallet(50000.0)));
    }

    private void validateQuantity(int quantity) {
        if (quantity < 1 || quantity > 100000) throw new IllegalArgumentException("Quantity must be between 1 and 100000.");
    }

    private double round(double value) { return Math.round(value * 100.0) / 100.0; }
}
