package com.stockpro.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SimulatedPriceService {
    private final TradingService tradingService;
    public SimulatedPriceService(TradingService tradingService) { this.tradingService = tradingService; }

    @Scheduled(fixedRate = 3000)
    public void update() { tradingService.updatePrices(); }
}
