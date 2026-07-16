package com.eagleauctioner.notification.provider;

public interface WhatsAppProvider {
    void sendWhatsApp(String mobile, String message) throws Exception;
    String getProviderName();
}
