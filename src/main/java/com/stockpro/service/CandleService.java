package com.stockpro.service;

import com.stockpro.model.Stock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CandleService {
    private final TradingService tradingService;
    private final Map<String, List<Tick>> history = new ConcurrentHashMap<>();

    public CandleService(TradingService tradingService) { this.tradingService = tradingService; }

    @Scheduled(fixedRate = 3000)
    public void capture() {
        long now = Instant.now().getEpochSecond();
        for (Stock stock : tradingService.getStocks()) {
            List<Tick> list = history.computeIfAbsent(stock.getSymbol(), k -> Collections.synchronizedList(new ArrayList<>()));
            synchronized (list) {
                list.add(new Tick(now, stock.getPrice()));
                if (list.size() > 15000) list.subList(0, list.size() - 15000).clear();
            }
        }
    }

    public List<Map<String, Object>> candles(String symbol, String timeframe) {
        Stock stock = tradingService.getStock(symbol);
        long seconds = switch (timeframe == null ? "1m" : timeframe.toLowerCase(Locale.ROOT)) {
            case "5m" -> 300L;
            case "15m" -> 900L;
            case "1h" -> 3600L;
            case "1d" -> 86400L;
            default -> 60L;
        };

        List<Tick> source = history.computeIfAbsent(stock.getSymbol(), k -> Collections.synchronizedList(new ArrayList<>()));
        List<Tick> copy;
        synchronized (source) { copy = new ArrayList<>(source); }
        if (copy.isEmpty()) copy.add(new Tick(Instant.now().getEpochSecond(), stock.getPrice()));

        Map<Long, Bar> grouped = new TreeMap<>();
        for (Tick tick : copy) {
            long bucket = tick.time / seconds * seconds;
            Bar bar = grouped.get(bucket);
            if (bar == null) grouped.put(bucket, new Bar(bucket, tick.price));
            else bar.add(tick.price);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        grouped.values().forEach(bar -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("time", bar.time);
            row.put("open", round(bar.open));
            row.put("high", round(bar.high));
            row.put("low", round(bar.low));
            row.put("close", round(bar.close));
            result.add(row);
        });
        return result;
    }

    private double round(double n) { return Math.round(n * 100.0) / 100.0; }
    private record Tick(long time, double price) {}
    private static class Bar {
        final long time;
        final double open;
        double high, low, close;
        Bar(long time, double price) { this.time=time; this.open=price; this.high=price; this.low=price; this.close=price; }
        void add(double price) { high=Math.max(high,price); low=Math.min(low,price); close=price; }
    }
}
