package com.eagleauctioner.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
public class RedirectValidationService {

    private static final List<String> DOMAIN_WHITELIST = Arrays.asList(
        "eagleauctioner.com",
        "localhost",
        "127.0.0.1"
    );

    public boolean isValidRedirect(String url) {
        if (url == null || url.trim().isEmpty()) {
            return false;
        }

        String lowerUrl = url.trim().toLowerCase();

        // Block dangerous schemes
        if (lowerUrl.startsWith("javascript:") || lowerUrl.startsWith("data:") || lowerUrl.startsWith("file:")) {
            log.warn("Blocked redirect attempt with dangerous scheme: {}", url);
            return false;
        }

        // Safe Relative URLs must start with "/" and NOT "//" (which can be a protocol-relative redirect to external domains)
        if (url.startsWith("/") && !url.startsWith("//")) {
            return true;
        }

        try {
            URI uri = new URI(url);
            String host = uri.getHost();

            if (host == null) {
                return false;
            }

            // Verify domain against whitelist
            for (String allowedDomain : DOMAIN_WHITELIST) {
                if (host.equals(allowedDomain) || host.endsWith("." + allowedDomain)) {
                    return true;
                }
            }

            log.warn("Blocked untrusted external redirect to host: {}", host);
            return false;
        } catch (Exception e) {
            log.error("Error parsing redirect URL: {}", url, e);
            return false;
        }
    }
}
