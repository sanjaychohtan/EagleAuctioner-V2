package com.eagleauctioner.notification.provider.impl;

import com.eagleauctioner.notification.provider.EmailProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class MockEmailProvider implements EmailProvider {
    @Override
    public void sendEmail(String to, String subject, String body) throws Exception {
        log.info("[MOCK_EMAIL] Sending email to: {}, Subject: {}", to, subject);
    }

    @Override
    public String getProviderName() {
        return "MOCK_SMTP";
    }
}
