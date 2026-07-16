package com.eagleauctioner.notification.provider.impl;

import com.eagleauctioner.notification.provider.WhatsAppProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class MockWhatsAppProvider implements WhatsAppProvider {
    @Override
    public void sendWhatsApp(String mobile, String message) throws Exception {
        log.info("[MOCK_WHATSAPP] Sending WhatsApp to: {}, Message: {}", mobile, message);
    }

    @Override
    public String getProviderName() {
        return "MOCK_WHATSAPP_API";
    }
}
