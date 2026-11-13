package com.stockpro.repository;

import com.stockpro.model.Holding;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface HoldingRepository extends JpaRepository<Holding, Long> {
    Optional<Holding> findBySymbolIgnoreCase(String symbol);
}
