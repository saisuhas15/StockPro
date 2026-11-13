package com.stockpro.controller;

import com.stockpro.service.TradingService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
public class PortfolioController {
    private final TradingService tradingService;
    public PortfolioController(TradingService tradingService) { this.tradingService = tradingService; }

    @GetMapping("/api/dashboard")
    public Map<String, Object> dashboard() { return tradingService.dashboard(); }

    @GetMapping("/api/portfolio")
    public List<Map<String, Object>> portfolio() { return tradingService.portfolio(); }
}
