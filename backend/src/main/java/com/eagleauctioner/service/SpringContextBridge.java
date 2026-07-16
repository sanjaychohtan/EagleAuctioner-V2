package com.eagleauctioner.service;

import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

@Component
public class SpringContextBridge implements ApplicationContextAware {
    private static ApplicationContext context;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        context = applicationContext;
    }

    public static <T> T getService(Class<T> serviceClass) {
        if (context == null) {
            return null;
        }
        try {
            return context.getBean(serviceClass);
        } catch (Exception e) {
            return null;
        }
    }
}
