package com.secureops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling
//@ComponentScan(basePackages = {"com.secureops.hr", "com.secureops.sales"})
public class SecureopsErpApplication {

	public static void main(String[] args) {
		SpringApplication.run(SecureopsErpApplication.class, args);
	}

}
