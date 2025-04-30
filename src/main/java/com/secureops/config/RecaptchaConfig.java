package com.secureops.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RecaptchaConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}