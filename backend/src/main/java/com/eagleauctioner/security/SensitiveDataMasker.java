package com.eagleauctioner.security;

import org.springframework.stereotype.Component;

@Component
public class SensitiveDataMasker {

    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "*****";
        int atIdx = email.indexOf("@");
        if (atIdx <= 2) return "***" + email.substring(atIdx);
        return email.substring(0, 2) + "****" + email.substring(atIdx);
    }

    public String maskMobile(String mobile) {
        if (mobile == null || mobile.length() < 6) return "******";
        return mobile.substring(0, 3) + "****" + mobile.substring(mobile.length() - 2);
    }

    public String maskFinancialValue(String val) {
        if (val == null) return "₹ ***.**";
        return "₹ ***,***.00";
    }
}
