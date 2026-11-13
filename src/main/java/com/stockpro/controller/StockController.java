package com.stockpro.controller;

import com.stockpro.model.Stock;
import com.stockpro.service.CandleService;
import com.stockpro.service.TradingService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/stocks")
public class StockController {
    private final TradingService tradingService;
    private final CandleService candleService;

    public StockController(TradingService tradingService, CandleService candleService) {
        this.tradingService = tradingService;
        this.candleService = candleService;
    }

    @GetMapping
    public List<Stock> all() { return tradingService.getStocks(); }

    @GetMapping("/{symbol}")
    public Stock one(@PathVariable String symbol) { return tradingService.getStock(symbol); }

    @GetMapping("/{symbol}/candles")
    public List<Map<String, Object>> candles(@PathVariable String symbol,
                                              @RequestParam(defaultValue = "1m") String timeframe) {
        return candleService.candles(symbol, timeframe);
    }
}
