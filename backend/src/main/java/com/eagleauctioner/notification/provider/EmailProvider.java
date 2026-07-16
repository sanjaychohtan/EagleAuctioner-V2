package com.eagleauctioner.notification.provider;

public interface EmailProvider {
    void sendEmail(String to, String subject, String body) throws Exception;
    String getProviderName();
}
