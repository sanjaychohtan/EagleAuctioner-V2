package com.eagleauctioner.service;

import com.eagleauctioner.entity.Auction;
import com.eagleauctioner.entity.AuctionLot;
import com.eagleauctioner.entity.BulkImportJob;
import com.eagleauctioner.enums.AuctionLotStatus;
import com.eagleauctioner.repository.AuctionLotRepository;
import com.eagleauctioner.repository.AuctionRepository;
import com.eagleauctioner.repository.BulkImportJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class BulkLotImportService {

    private final BulkImportJobRepository bulkImportJobRepository;
    private final AuctionRepository auctionRepository;
    private final AuctionLotRepository auctionLotRepository;

    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limits

    @Transactional
    public BulkImportJob importLots(UUID auctionId, byte[] fileBytes, String fileName) {
        // File size validation
        if (fileBytes == null || fileBytes.length == 0) {
            throw new IllegalArgumentException("File is empty or invalid");
        }
        if (fileBytes.length > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of 5MB");
        }

        String fileHash = calculateSHA256(fileBytes);
        
        // Idempotency check (Duplicate Hash detection)
        if (bulkImportJobRepository.findByFileHash(fileHash).isPresent()) {
            throw new IllegalStateException("Duplicate Bulk Lot Import Detected: File already uploaded and processed");
        }

        // Verify auction exists
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found with ID: " + auctionId));

        List<AuctionLot> lotsToSave = new ArrayList<>();
        Set<String> lotNumbersInBatch = new HashSet<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(fileBytes), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null || headerLine.trim().isEmpty()) {
                throw new IllegalArgumentException("Invalid CSV: Header line is missing");
            }

            // Simple header structure parsing
            String[] headers = headerLine.split(",");
            Map<String, Integer> headerMap = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                headerMap.put(headers[i].trim().toLowerCase(), i);
            }

            // Ensure mandatory headers are present
            String[] requiredHeaders = {"lot_number", "title", "material_category", "quantity", "unit_of_measure", "starting_price", "minimum_increment", "currency"};
            for (String req : requiredHeaders) {
                if (!headerMap.containsKey(req)) {
                    throw new IllegalArgumentException("Invalid CSV: Missing required header field '" + req + "'");
                }
            }

            String line;
            int lineNumber = 1;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.trim().isEmpty()) {
                    continue;
                }

                // Parse columns (handles simple commas without nesting complex quotes for performance)
                String[] columns = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
                if (columns.length < requiredHeaders.length) {
                    throw new IllegalArgumentException("Invalid CSV row at line " + lineNumber + ": Column count mismatch");
                }

                String lotNumber = getColumnValue(columns, headerMap, "lot_number").replaceAll("^\"|\"$", "").trim();
                String title = getColumnValue(columns, headerMap, "title").replaceAll("^\"|\"$", "").trim();
                String description = getColumnValue(columns, headerMap, "description").replaceAll("^\"|\"$", "").trim();
                String materialCategory = getColumnValue(columns, headerMap, "material_category").replaceAll("^\"|\"$", "").trim();
                String quantityStr = getColumnValue(columns, headerMap, "quantity").replaceAll("^\"|\"$", "").trim();
                String unitOfMeasure = getColumnValue(columns, headerMap, "unit_of_measure").replaceAll("^\"|\"$", "").trim();
                String startingPriceStr = getColumnValue(columns, headerMap, "starting_price").replaceAll("^\"|\"$", "").trim();
                String reservePriceStr = getColumnValue(columns, headerMap, "reserve_price").replaceAll("^\"|\"$", "").trim();
                String minimumIncrementStr = getColumnValue(columns, headerMap, "minimum_increment").replaceAll("^\"|\"$", "").trim();
                String currency = getColumnValue(columns, headerMap, "currency").replaceAll("^\"|\"$", "").trim();

                // Base field validations
                if (lotNumber.isEmpty() || title.isEmpty() || materialCategory.isEmpty() || quantityStr.isEmpty() || unitOfMeasure.isEmpty() || startingPriceStr.isEmpty() || minimumIncrementStr.isEmpty() || currency.isEmpty()) {
                    throw new IllegalArgumentException("Validation Error at line " + lineNumber + ": Required fields cannot be empty");
                }

                // Check for duplicate lot numbers within the same CSV batch
                if (!lotNumbersInBatch.add(lotNumber)) {
                    throw new IllegalArgumentException("Validation Error at line " + lineNumber + ": Duplicate lot number '" + lotNumber + "' detected within the imported file");
                }

                // Check for duplicate lot numbers in the database for this auction
                if (auctionLotRepository.existsByAuctionIdAndLotNumber(auctionId, lotNumber)) {
                    throw new IllegalArgumentException("Validation Error at line " + lineNumber + ": Lot number '" + lotNumber + "' already exists in this auction in the system");
                }

                BigDecimal quantity;
                Long startingPrice;
                Long reservePrice = null;
                Long minimumIncrement;

                try {
                    quantity = new BigDecimal(quantityStr);
                    startingPrice = new java.math.BigDecimal(startingPriceStr).movePointRight(2).longValueExact();
                    minimumIncrement = new java.math.BigDecimal(minimumIncrementStr).movePointRight(2).longValueExact();
                    if (!reservePriceStr.isEmpty()) {
                        reservePrice = new java.math.BigDecimal(reservePriceStr).movePointRight(2).longValueExact();
                    }
                } catch (NumberFormatException ex) {
                    throw new IllegalArgumentException("Validation Error at line " + lineNumber + ": Failed to parse numeric values", ex);
                }

                AuctionLot lot = AuctionLot.builder()
                        .auction(auction)
                        .lotNumber(lotNumber)
                        .title(title)
                        .description(description)
                        .materialCategory(materialCategory)
                        .quantity(quantity)
                        .unitOfMeasure(unitOfMeasure)
                        .startingPrice(startingPrice)
                        .reservePrice(reservePrice)
                        .minimumIncrement(minimumIncrement)
                        .currency(currency)
                        .lotStatus(AuctionLotStatus.DRAFT) // Default state
                        .displayOrder(lineNumber - 1)
                        .build();

                // Run pre-persist domain validations explicitly
                lot.validateLotBusinessRules();

                lotsToSave.add(lot);
            }

            if (lotsToSave.isEmpty()) {
                throw new IllegalArgumentException("Invalid CSV: No lot records found to import");
            }

            // Bulk Save Lots under transaction
            auctionLotRepository.saveAll(lotsToSave);

            BulkImportJob job = BulkImportJob.builder()
                    .fileHash(fileHash)
                    .status("COMPLETED")
                    .totalRecords(lotsToSave.size())
                    .processedRecords(lotsToSave.size())
                    .createdAt(Instant.now())
                    .build();

            BulkImportJob savedJob = bulkImportJobRepository.save(job);
            log.info("Bulk Import completed successfully. Job ID: {}, Total imported lots: {}", savedJob.getId(), lotsToSave.size());
            return savedJob;

        } catch (IllegalArgumentException ex) {
            log.error("Bulk Import Row Validation Failed. Rolling back changes. Reason: {}", ex.getMessage());
            throw ex;
        } catch (Exception ex) {
            log.error("Internal Error during Bulk Lot Import process. Rolling back changes.", ex);
            throw new RuntimeException("Bulk Lot Import Failed: " + ex.getMessage(), ex);
        }
    }

    private String getColumnValue(String[] columns, Map<String, Integer> headerMap, String field) {
        Integer index = headerMap.get(field);
        if (index == null || index >= columns.length) {
            return "";
        }
        return columns[index];
    }

    public String calculateSHA256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }
}
