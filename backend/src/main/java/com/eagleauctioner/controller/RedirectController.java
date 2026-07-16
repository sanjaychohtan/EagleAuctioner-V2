package com.eagleauctioner.controller;

import com.eagleauctioner.service.RedirectValidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/redirect")
@RequiredArgsConstructor
public class RedirectController {

    private final RedirectValidationService redirectValidationService;

    @GetMapping
    public ResponseEntity<?> handleRedirect(@RequestParam("url") String url) {
        if (!redirectValidationService.isValidRedirect(url)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or untrusted redirect target");
        }
        return ResponseEntity.status(HttpStatus.FOUND).header("Location", url).build();
    }
}
