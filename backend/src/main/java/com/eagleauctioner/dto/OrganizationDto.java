package com.eagleauctioner.dto;

import java.util.UUID;

public record OrganizationDto(
        UUID id,
        String organizationName,
        String registrationNumber,
        String gstin,
        String registeredAddress
) {}
