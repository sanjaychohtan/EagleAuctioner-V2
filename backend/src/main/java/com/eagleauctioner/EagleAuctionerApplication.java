package com.eagleauctioner;

import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
public class EagleAuctionerApplication {

    public static void main(String[] args) {
        org.springframework.boot.SpringApplication.run(EagleAuctionerApplication.class, args);
    }

}
