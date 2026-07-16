package com.eagleauctioner.notification.provider;

public interface SmsProvider {
    void sendSms(String mobile, String message) throws Exception;
    String getProviderName();
}
