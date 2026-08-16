package com.notifyhub;

import org.springframework.batch.core.configuration.annotation.EnableJdbcJobRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableJdbcJobRepository
public class NotifyhubApplication {

	public static void main(String[] args) {
		SpringApplication.run(NotifyhubApplication.class, args);
	}

}
