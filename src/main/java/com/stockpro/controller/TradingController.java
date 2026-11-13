package com.stockpro.controller;

import com.stockpro.model.TradeTransaction;
import com.stockpro.service.TradingService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/trading")
public class TradingController {
    private final TradingService tradingService;
    public TradingController(TradingService tradingService) { this.tradingService = tradingService; }

    @PostMapping("/buy")
    public TradeTransaction buy(@RequestParam String symbol, @RequestParam int quantity) {
        return tradingService.buy(symbol, quantity);
    }

    @PostMapping("/sell")
    public TradeTransaction sell(@RequestParam String symbol, @RequestParam int quantity) {
        return tradingService.sell(symbol, quantity);
    }

    @GetMapping("/transactions")
    public List<TradeTransaction> transactions() { return tradingService.transactionHistory(); }
}
