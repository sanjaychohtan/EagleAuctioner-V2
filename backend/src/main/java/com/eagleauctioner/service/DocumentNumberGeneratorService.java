package com.eagleauctioner.service;

import com.eagleauctioner.enums.DocumentType;

/**
 * Service interface for generating unique, formatted document numbers (e.g. AUC-2024-0001).
 */
public interface DocumentNumberGeneratorService {
    String generateNextNumber(DocumentType type);
}
