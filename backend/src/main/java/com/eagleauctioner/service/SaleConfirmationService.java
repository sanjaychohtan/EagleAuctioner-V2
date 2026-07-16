package com.eagleauctioner.service;

import com.eagleauctioner.dto.CommercialDocumentDTOs.*;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.SaleConfirmationStatus;
import com.eagleauctioner.enums.DocumentType;
import com.eagleauctioner.repository.SaleConfirmationRepository;
import com.eagleauctioner.repository.AuctionWinnerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Enterprise service governing Sale Confirmation document lifecycles.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SaleConfirmationService {

    private final SaleConfirmationRepository saleConfirmationRepository;
    private final DocumentNumberGeneratorService documentNumberGenerator;
    private final PurchaseOrderService purchaseOrderService;

    @Transactional
    public SaleConfirmation createDraft(AuctionWinner winner) {
        log.info("Auto-generating Draft Sale Confirmation for Winner: {}", winner.getId());

        String docNum = documentNumberGenerator.generateNextNumber(DocumentType.SALE_CONFIRMATION);

        SaleConfirmation sc = SaleConfirmation.builder()
                .documentNumber(docNum)
                .winner(winner)
                .status(SaleConfirmationStatus.DRAFT)
                .saleAmount(winner.getWinningAmount())
                .termsAndConditions("Default Enterprise Auction Terms and Conditions. All sales are final.")
                .versions(new ArrayList<>())
                .build();

        SaleConfirmationVersion v1 = SaleConfirmationVersion.builder()
                .versionNumber(1)
                .status(SaleConfirmationStatus.DRAFT)
                .saleAmount(winner.getWinningAmount())
                .termsAndConditions(sc.getTermsAndConditions())
                .changedBy("SYSTEM")
                .changeReason("Initial auto-generation on Winner Approved event")
                .build();

        sc.addVersion(v1);
        SaleConfirmation saved = saleConfirmationRepository.save(sc);
        log.info("Draft Sale Confirmation saved successfully: {}", saved.getDocumentNumber());
        return saved;
    }

    @Transactional
    public SaleConfirmationResponse updateStatus(UUID scId, SaleConfirmationStatus newStatus, String reason, String actorName) {
        log.info("Updating Sale Confirmation {} status to {} by {}", scId, newStatus, actorName);

        SaleConfirmation sc = saleConfirmationRepository.findByIdWithRelations(scId)
                .orElseThrow(() -> new IllegalArgumentException("Sale Confirmation not found: " + scId));

        if (sc.getStatus() == SaleConfirmationStatus.ACCEPTED && newStatus != SaleConfirmationStatus.ACCEPTED) {
            throw new IllegalStateException("Immutable constraint violated: Cannot modify an already ACCEPTED Sale Confirmation");
        }

        SaleConfirmationStatus previousStatus = sc.getStatus();
        sc.setStatus(newStatus);

        int nextVerNum = sc.getVersions().size() + 1;
        SaleConfirmationVersion nextVer = SaleConfirmationVersion.builder()
                .versionNumber(nextVerNum)
                .status(newStatus)
                .saleAmount(sc.getSaleAmount())
                .termsAndConditions(sc.getTermsAndConditions())
                .changedBy(actorName)
                .changeReason(reason)
                .build();

        sc.addVersion(nextVer);
        SaleConfirmation saved = saleConfirmationRepository.save(sc);

        // Business Rule 2: Sale Confirmation Accepted -> Auto Purchase Order
        if (newStatus == SaleConfirmationStatus.ACCEPTED && previousStatus != SaleConfirmationStatus.ACCEPTED) {
            log.info("Sale Confirmation {} accepted. Triggering auto Purchase Order generation.", saved.getDocumentNumber());
            purchaseOrderService.createPurchaseOrder(saved);
        }

        return mapToResponse(saved);
    }

    @Transactional
    public SaleConfirmationResponse updateTerms(UUID scId, String terms, String reason, String actorName) {
        log.info("Updating Sale Confirmation {} terms and conditions by {}", scId, actorName);

        SaleConfirmation sc = saleConfirmationRepository.findByIdWithRelations(scId)
                .orElseThrow(() -> new IllegalArgumentException("Sale Confirmation not found: " + scId));

        if (sc.getStatus() == SaleConfirmationStatus.ACCEPTED) {
            throw new IllegalStateException("Immutable constraint violated: Cannot modify an already ACCEPTED Sale Confirmation");
        }

        sc.setTermsAndConditions(terms);

        int nextVerNum = sc.getVersions().size() + 1;
        SaleConfirmationVersion nextVer = SaleConfirmationVersion.builder()
                .versionNumber(nextVerNum)
                .status(sc.getStatus())
                .saleAmount(sc.getSaleAmount())
                .termsAndConditions(terms)
                .changedBy(actorName)
                .changeReason(reason)
                .build();

        sc.addVersion(nextVer);
        SaleConfirmation saved = saleConfirmationRepository.save(sc);
        return mapToResponse(saved);
    }

    public SaleConfirmationResponse getById(UUID id) {
        SaleConfirmation sc = saleConfirmationRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new IllegalArgumentException("Sale Confirmation not found: " + id));
        return mapToResponse(sc);
    }

    public SaleConfirmationResponse getByWinnerId(UUID winnerId) {
        SaleConfirmation sc = saleConfirmationRepository.findByWinnerId(winnerId)
                .orElseThrow(() -> new IllegalArgumentException("Sale Confirmation not found for Winner: " + winnerId));
        return mapToResponse(sc);
    }

    private SaleConfirmationResponse mapToResponse(SaleConfirmation sc) {
        if (sc == null) return null;
        
        List<SaleConfirmationVersionResponse> verList = sc.getVersions().stream()
                .map(v -> SaleConfirmationVersionResponse.builder()
                        .id(v.getId())
                        .versionNumber(v.getVersionNumber())
                        .status(v.getStatus())
                        .saleAmount(v.getSaleAmount())
                        .termsAndConditions(v.getTermsAndConditions())
                        .changedBy(v.getChangedBy())
                        .changeReason(v.getChangeReason())
                        .createdAt(v.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return SaleConfirmationResponse.builder()
                .id(sc.getId())
                .documentNumber(sc.getDocumentNumber())
                .winnerId(sc.getWinner().getId())
                .auctionLotId(sc.getWinner().getAuctionLot() != null ? sc.getWinner().getAuctionLot().getId() : null)
                .bidderCompanyName(sc.getWinner().getWinnerCompanyName())
                .status(sc.getStatus())
                .saleAmount(sc.getSaleAmount())
                .termsAndConditions(sc.getTermsAndConditions())
                .version(sc.getVersions().size())
                .createdAt(sc.getCreatedAt())
                .versions(verList)
                .build();
    }
}
