package com.eagleauctioner.service.impl;

import com.eagleauctioner.entity.DocumentSequence;
import com.eagleauctioner.enums.DocumentType;
import com.eagleauctioner.repository.DocumentSequenceRepository;
import com.eagleauctioner.service.DocumentNumberGeneratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentNumberGeneratorServiceImpl implements DocumentNumberGeneratorService {

    private final DocumentSequenceRepository documentSequenceRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextNumber(DocumentType type) {
        int currentYear = LocalDate.now().getYear();
        return generateNextNumber("DEFAULT", "MAIN", currentYear, "GLOBAL", type);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNextNumber(String tenantId, String branchCode, Integer year, String regionCode, DocumentType type) {
        log.info("Requesting next sequence for coord: tenant={}, branch={}, year={}, region={}, type={}", 
                tenantId, branchCode, year, regionCode, type);

        DocumentSequence sequence = documentSequenceRepository.findByCoordinatesForUpdate(tenantId, branchCode, year, regionCode, type)
                .orElseGet(() -> {
                    log.info("Initializing new isolated sequence coordinate row.");
                    DocumentSequence newSeq = DocumentSequence.builder()
                            .tenantId(tenantId)
                            .branchCode(branchCode)
                            .year(year)
                            .regionCode(regionCode)
                            .documentType(type)
                            .nextValue(1L)
                            .version(0L)
                            .build();
                    return documentSequenceRepository.saveAndFlush(newSeq);
                });

        long allocatedValue = sequence.getNextValue();
        sequence.setNextValue(allocatedValue + 1);
        documentSequenceRepository.saveAndFlush(sequence);

        String prefix = getPrefix(type);

        StringBuilder numberBuilder = new StringBuilder();
        if (!"DEFAULT".equalsIgnoreCase(tenantId)) {
            numberBuilder.append(tenantId).append("-");
        }
        numberBuilder.append(prefix);
        if (!"MAIN".equalsIgnoreCase(branchCode)) {
            numberBuilder.append("-").append(branchCode);
        }
        if (!"GLOBAL".equalsIgnoreCase(regionCode)) {
            numberBuilder.append("-").append(regionCode);
        }
        numberBuilder.append("-").append(year).append("-").append(String.format("%05d", allocatedValue));

        String formattedNumber = numberBuilder.toString();
        log.info("Successfully allocated transaction-safe coordinate document number: {}", formattedNumber);
        return formattedNumber;
    }

    private String getPrefix(DocumentType type) {
        return switch (type) {
            case SALE_CONFIRMATION -> "SC";
            case PURCHASE_ORDER -> "PO";
            case FEE_INVOICE -> "FI";
            case CONTRACT -> "CT";
            case SETTLEMENT -> "ST";
            case GST_INVOICE -> "GST";
            case AUCTION -> "AUC";
            case PAYMENT -> "PMT";
            case PAYMENT_ADVICE -> "ADV";
            case BIDDER -> "BID";
            case SELLER -> "SEL";
            case INVOICE -> "INV";
            case TICKET -> "TIC";
        };
    }
}
