package com.eagleauctioner.test;

import com.eagleauctioner.service.RedirectValidationService;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class RedirectValidationServiceTest {

    private final RedirectValidationService service = new RedirectValidationService();

    @Test
    void testSafeRelativeRedirects() {
        assertTrue(service.isValidRedirect("/dashboard"));
        assertTrue(service.isValidRedirect("/profile/settings"));
    }

    @Test
    void testProtocolRelativeRedirects_ShouldBeBlocked() {
        assertFalse(service.isValidRedirect("//attacker.com/malicious"));
    }

    @Test
    void testDangerousSchemes_ShouldBeBlocked() {
        assertFalse(service.isValidRedirect("javascript:alert(1)"));
        assertFalse(service.isValidRedirect("data:text/html,<script>alert(1)</script>"));
        assertFalse(service.isValidRedirect("file:///etc/passwd"));
    }

    @Test
    void testWhitelistedDomains_ShouldPass() {
        assertTrue(service.isValidRedirect("http://eagleauctioner.com/home"));
        assertTrue(service.isValidRedirect("https://sub.eagleauctioner.com/settings"));
        assertTrue(service.isValidRedirect("http://localhost:8080/callback"));
    }

    @Test
    void testUntrustedExternalDomains_ShouldBeBlocked() {
        assertFalse(service.isValidRedirect("https://attacker.com"));
        assertFalse(service.isValidRedirect("http://google.com"));
    }
}
