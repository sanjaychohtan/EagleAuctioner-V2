package com.eagleauctioner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record KycReviewRequest(
        @NotBlank @Pattern(regexp = "APPROVED|REJECTED") String decision,
        @NotBlank @Size(min = 10, max = 1000) String reviewNotes
) {}
