package com.eagleauctioner.notification.provider.impl;

import com.eagleauctioner.notification.provider.SmsProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class MockSmsProvider implements SmsProvider {
    @Override
    public void sendSms(String mobile, String message) throws Exception {
        log.info("[MOCK_SMS] Sending SMS to: {}, Message: {}", mobile, message);
    }

    @Override
    public String getProviderName() {
        return "MOCK_SMS_GATEWAY";
    }
}
