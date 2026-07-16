package com.eagleauctioner.service;

import com.eagleauctioner.dto.ContractSettlementPaymentDTOs.*;
import com.eagleauctioner.entity.*;
import com.eagleauctioner.enums.ContractStatus;
import com.eagleauctioner.enums.DocumentType;
import com.eagleauctioner.event.ContractAcceptedEvent;
import com.eagleauctioner.event.ContractGeneratedEvent;
import com.eagleauctioner.event.ContractRejectedEvent;
import com.eagleauctioner.event.ContractTerminatedEvent;
import com.eagleauctioner.event.WinnerApprovedEvent;
import com.eagleauctioner.repository.ContractRepository;
import com.eagleauctioner.repository.AuctionWinnerRepository;
import com.eagleauctioner.exception.ResourceNotFoundException;
import com.eagleauctioner.enums.WinnerStatus;
import com.eagleauctioner.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.scheduling.annotation.Async;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Enterprise service governing Legal Contracts generated from approved lot winners.
 * Implements strict security validations (IDOR protection) and version audits.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ContractService {

    private final ContractRepository contractRepository;
    private final DocumentNumberGeneratorService documentNumberGenerator;
    private final ApplicationEventPublisher eventPublisher;
    private final SettlementService settlementService;

    @Transactional
    public Contract createContractDraft(AuctionWinner winner) {
        if (winner == null) {
            throw new IllegalArgumentException("Winner cannot be null");
        }

        // CRITICAL-2: Verify that createContractDraft() only accepts APPROVED Winners.
        if (winner.getStatus() != WinnerStatus.APPROVED) {
            throw new IllegalStateException("Cannot generate contract for winner with status: " + winner.getStatus());
        }

        // CRITICAL-1: Only ONE Contract may exist for one Winner/Auction Lot (idempotency check)
        java.util.Optional<Contract> existing = contractRepository.findByWinnerId(winner.getId());
        if (existing.isPresent()) {
            log.info("Contract already exists for Winner ID: {}. Returning existing contract.", winner.getId());
            return existing.get();
        }

        log.info("Generating Draft Contract for Winner ID: {}", winner.getId());

        String documentNumber = documentNumberGenerator.generateNextNumber(DocumentType.CONTRACT);

        Contract contract = Contract.builder()
                .documentNumber(documentNumber)
                .winner(winner)
                .status(ContractStatus.DRAFT)
                .totalAmount(winner.getWinningAmount())
                .termsAndConditions("This is the legally binding draft trade contract. All dispute resolutions are bound to local jurisdictional trade laws.")
                .versions(new ArrayList<>())
                .build();

        ContractVersion v1 = ContractVersion.builder()
                .versionNumber(1)
                .status(ContractStatus.DRAFT)
                .totalAmount(contract.getTotalAmount())
                .termsAndConditions(contract.getTermsAndConditions())
                .changedBy("SYSTEM")
                .changeReason("Auto-generation upon Winner approval")
                .build();

        contract.addVersion(v1);
        try {
            Contract saved = contractRepository.saveAndFlush(contract);
            log.info("Draft Contract saved with number: {}", saved.getDocumentNumber());

            // Publish domain event
            eventPublisher.publishEvent(new ContractGeneratedEvent(
                    saved.getId(), saved.getDocumentNumber(), winner.getId(), saved.getTotalAmount()
            ));

            return saved;
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            log.warn("Concurrent duplicate contract creation detected. Recovering existing contract for winner: {}", winner.getId());
            return contractRepository.findByWinnerId(winner.getId())
                    .orElseThrow(() -> ex);
        }
    }

    @Transactional
    public ContractResponse acceptContract(UUID contractId, String reason) {
        log.info("Accepting/Signing Contract ID: {}", contractId);
        
        Contract contract = contractRepository.findByIdWithRelations(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));

        validateContractAccess(contract);

        if (contract.getStatus() == ContractStatus.ACCEPTED) {
            throw new IllegalStateException("Contract is already accepted.");
        }
        if (contract.getStatus() == ContractStatus.REJECTED || contract.getStatus() == ContractStatus.TERMINATED) {
            throw new IllegalStateException("Cannot accept a contract in status: " + contract.getStatus());
        }

        String actor = SecurityUtils.getCurrentActor();

        contract.setStatus(ContractStatus.ACCEPTED);

        int nextVerNum = contract.getVersions().size() + 1;
        ContractVersion nextVer = ContractVersion.builder()
                .versionNumber(nextVerNum)
                .status(ContractStatus.ACCEPTED)
                .totalAmount(contract.getTotalAmount())
                .termsAndConditions(contract.getTermsAndConditions())
                .changedBy(actor)
                .changeReason(reason != null ? reason : "Contract accepted and signed by counterparty.")
                .build();

        contract.addVersion(nextVer);
        Contract saved = contractRepository.save(contract);
        log.info("Contract {} status updated to ACCEPTED.", saved.getDocumentNumber());

        // Publish acceptance domain event
        eventPublisher.publishEvent(new ContractAcceptedEvent(
                saved.getId(), saved.getDocumentNumber(), actor
        ));

        // Business Rule Cascade: Contract Accepted -> Settlement Creation
        log.info("Contract Accepted! Cascading settlement generation for contract: {}", saved.getDocumentNumber());
        
        String region = settlementService.detectRegion(saved);
        settlementService.createSettlementDraft(saved, region);

        return mapToResponse(saved);
    }

    public ContractResponse getById(UUID id) {
        Contract contract = contractRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + id));

        validateContractAccess(contract);
        return mapToResponse(contract);
    }

    public ContractResponse getByWinnerId(UUID winnerId) {
        Contract contract = contractRepository.findByWinnerId(winnerId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found for Winner: " + winnerId));

        validateContractAccess(contract);
        return mapToResponse(contract);
    }

    @Transactional
    public ContractResponse rejectContract(UUID contractId, String reason) {
        log.info("Rejecting Contract ID: {}", contractId);
        Contract contract = contractRepository.findByIdWithRelations(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));

        validateContractAccess(contract);

        if (contract.getStatus() != ContractStatus.DRAFT && contract.getStatus() != ContractStatus.PENDING_SIGNATURE) {
            throw new IllegalStateException("Can only reject contracts in DRAFT or PENDING_SIGNATURE status.");
        }

        String actor = SecurityUtils.getCurrentActor();
        contract.setStatus(ContractStatus.REJECTED);

        ContractVersion version = ContractVersion.builder()
                .contract(contract)
                .versionNumber(contract.getVersions().size() + 1)
                .status(ContractStatus.REJECTED)
                .totalAmount(contract.getTotalAmount())
                .termsAndConditions(contract.getTermsAndConditions())
                .changedBy(actor)
                .changeReason(reason)
                .build();

        contract.getVersions().add(version);
        Contract saved = contractRepository.save(contract);

        eventPublisher.publishEvent(new ContractRejectedEvent(this, saved.getId(), reason, actor));

        return mapToResponse(saved);
    }

    @Transactional
    public ContractResponse terminateContract(UUID contractId, String reason) {
        log.info("Terminating Contract ID: {}", contractId);
        Contract contract = contractRepository.findByIdWithRelations(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));

        // Strict RBAC: Usually only ADMIN or SELLER can terminate an ACTIVE contract
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isAdmin) {
             validateContractAccess(contract);
             // Additional check: Bidder might not be allowed to terminate alone
        }

        if (contract.getStatus() == ContractStatus.TERMINATED) {
            throw new IllegalStateException("Contract is already terminated.");
        }

        String actor = SecurityUtils.getCurrentActor();
        contract.setStatus(ContractStatus.TERMINATED);

        ContractVersion version = ContractVersion.builder()
                .contract(contract)
                .versionNumber(contract.getVersions().size() + 1)
                .status(ContractStatus.TERMINATED)
                .totalAmount(contract.getTotalAmount())
                .termsAndConditions(contract.getTermsAndConditions())
                .changedBy(actor)
                .changeReason(reason)
                .build();

        contract.getVersions().add(version);
        Contract saved = contractRepository.save(contract);

        eventPublisher.publishEvent(new ContractTerminatedEvent(this, saved.getId(), reason, actor));

        return mapToResponse(saved);
    }

    public List<ContractVersionResponse> getContractHistory(UUID contractId) {
        Contract contract = contractRepository.findByIdWithRelations(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));

        validateContractAccess(contract);

        return contract.getVersions().stream()
                .map(v -> ContractVersionResponse.builder()
                        .id(v.getId())
                        .versionNumber(v.getVersionNumber())
                        .status(v.getStatus())
                        .totalAmount(v.getTotalAmount())
                        .termsAndConditions(v.getTermsAndConditions())
                        .changedBy(v.getChangedBy())
                        .changeReason(v.getChangeReason())
                        .createdAt(v.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * OWASP ASVS IDOR validation checks with strict null safety to differentiate data integrity issues from security violations.
     */
    public void validateContractAccess(Contract contract) {
        if (contract == null) {
            throw new IllegalArgumentException("Contract cannot be null");
        }
        if (contract.getWinner() == null) {
            throw new IllegalArgumentException("Contract winner association is missing.");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AccessDeniedException("[SECURITY_VIOLATION] Unauthenticated request during contract access.");
        }

        String username = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) return;

        // Verify if buyer with explicit null safety
        if (contract.getWinner().getBidderProfile() == null ||
            contract.getWinner().getBidderProfile().getUser() == null ||
            contract.getWinner().getBidderProfile().getUser().getEmail() == null) {
            throw new IllegalArgumentException("Incomplete or corrupt buyer relationship data.");
        }
        String buyerEmail = contract.getWinner().getBidderProfile().getUser().getEmail();
        if (username.equalsIgnoreCase(buyerEmail)) return;

        // Verify if seller with explicit null safety
        if (contract.getWinner().getAuctionLot() == null ||
            contract.getWinner().getAuctionLot().getAuction() == null ||
            contract.getWinner().getAuctionLot().getAuction().getSellerProfile() == null ||
            contract.getWinner().getAuctionLot().getAuction().getSellerProfile().getUser() == null ||
            contract.getWinner().getAuctionLot().getAuction().getSellerProfile().getUser().getEmail() == null) {
            throw new IllegalArgumentException("Incomplete or corrupt seller relationship data in lot snapshot.");
        }
        String sellerEmail = contract.getWinner().getAuctionLot().getAuction().getSellerProfile().getUser().getEmail();
        if (username.equalsIgnoreCase(sellerEmail)) return;

        log.error("[IDOR_ATTEMPT] User '{}' tried to access Contract '{}'", username, contract.getDocumentNumber());
        throw new AccessDeniedException("Access Denied: You do not have permissions to access this contract.");
    }

    public ContractResponse mapToResponse(Contract contract) {
        if (contract == null) return null;

        List<ContractVersionResponse> verList = contract.getVersions().stream()
                .map(v -> ContractVersionResponse.builder()
                        .id(v.getId())
                        .versionNumber(v.getVersionNumber())
                        .status(v.getStatus())
                        .totalAmount(v.getTotalAmount())
                        .termsAndConditions(v.getTermsAndConditions())
                        .changedBy(v.getChangedBy())
                        .changeReason(v.getChangeReason())
                        .createdAt(v.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ContractResponse.builder()
                .id(contract.getId())
                .documentNumber(contract.getDocumentNumber())
                .winnerId(contract.getWinner().getId())
                .saleConfirmationId(contract.getSaleConfirmation() != null ? contract.getSaleConfirmation().getId() : null)
                .status(contract.getStatus())
                .totalAmount(contract.getTotalAmount())
                .termsAndConditions(contract.getTermsAndConditions())
                .createdAt(contract.getCreatedAt())
                .updatedAt(contract.getUpdatedAt())
                .versions(verList)
                .build();
    }
}
