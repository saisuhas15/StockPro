package com.stockpro.repository;

import com.stockpro.model.TradeTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TradeTransactionRepository extends JpaRepository<TradeTransaction, Long> {
    List<TradeTransaction> findAllByOrderByTransactionDateDesc();
}
