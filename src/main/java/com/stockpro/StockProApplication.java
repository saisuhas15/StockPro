package com.stockpro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class StockProApplication {
    public static void main(String[] args) {
        SpringApplication.run(StockProApplication.class, args);
    }
}
