package com.stockpro.repository;

import com.stockpro.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findBySymbolIgnoreCase(String symbol);
    boolean existsBySymbolIgnoreCase(String symbol);
}
