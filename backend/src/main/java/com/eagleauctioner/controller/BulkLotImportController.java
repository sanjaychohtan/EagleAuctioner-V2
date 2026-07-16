package com.eagleauctioner.controller;

import com.eagleauctioner.dto.ApiResponse;
import com.eagleauctioner.entity.BulkImportJob;
import com.eagleauctioner.service.BulkLotImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/lots/import")
@RequiredArgsConstructor
public class BulkLotImportController {

    private final BulkLotImportService bulkLotImportService;

    @PostMapping("/auctions/{auctionId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BulkImportJob>> importLots(
            @PathVariable UUID auctionId,
            @RequestParam("file") MultipartFile file) throws Exception {
        
        BulkImportJob job = bulkLotImportService.importLots(auctionId, file.getBytes(), file.getOriginalFilename());
        return ResponseEntity.ok(ApiResponse.success("Lots imported successfully", job));
    }
}
