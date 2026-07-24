package com.eagleauctioner.test;

import com.eagleauctioner.entity.Auction;
import com.eagleauctioner.entity.BulkImportJob;
import com.eagleauctioner.repository.AuctionLotRepository;
import com.eagleauctioner.repository.AuctionRepository;
import com.eagleauctioner.repository.BulkImportJobRepository;
import com.eagleauctioner.service.BulkLotImportService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BulkLotImportServiceTest {

    @Mock
    private BulkImportJobRepository bulkImportJobRepository;

    @Mock
    private AuctionRepository auctionRepository;

    @Mock
    private AuctionLotRepository auctionLotRepository;

    @InjectMocks
    private BulkLotImportService bulkLotImportService;

    @Test
    void testCalculateSHA256() {
        byte[] data = "test-data-for-hash".getBytes();
        String hash = bulkLotImportService.calculateSHA256(data);
        assertNotNull(hash);
        assertEquals(64, hash.length());
    }

    @Test
    void testImportLots_Success() {
        UUID auctionId = UUID.randomUUID();
        String csvContent = "lot_number,title,description,material_category,quantity,unit_of_measure,starting_price,reserve_price,minimum_increment,currency\n" +
                "101,Antique Vase,Old clay vase,Ceramics,1,pcs,1000.00,2000.00,100.00,USD";
        byte[] fileBytes = csvContent.getBytes();
        String fileHash = bulkLotImportService.calculateSHA256(fileBytes);

        Auction auction = new Auction();
        auction.setId(auctionId);

        when(bulkImportJobRepository.findByFileHash(fileHash)).thenReturn(Optional.empty());
        when(auctionRepository.findById(auctionId)).thenReturn(Optional.of(auction));
        when(auctionLotRepository.existsByAuctionIdAndLotNumber(auctionId, "101")).thenReturn(false);
        when(bulkImportJobRepository.save(any(BulkImportJob.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BulkImportJob job = bulkLotImportService.importLots(auctionId, fileBytes, "lots.csv");

        assertNotNull(job);
        assertEquals("COMPLETED", job.getStatus());
        assertEquals(1, job.getTotalRecords());
        assertEquals(1, job.getProcessedRecords());
        assertEquals(fileHash, job.getFileHash());
        verify(auctionLotRepository, times(1)).saveAll(anyList());
        verify(bulkImportJobRepository, times(1)).save(any(BulkImportJob.class));
    }

    @Test
    void testImportLots_DuplicateHash_ThrowsException() {
        UUID auctionId = UUID.randomUUID();
        byte[] fileBytes = "test-data".getBytes();
        String fileHash = bulkLotImportService.calculateSHA256(fileBytes);

        when(bulkImportJobRepository.findByFileHash(fileHash)).thenReturn(Optional.of(new BulkImportJob()));

        assertThrows(IllegalStateException.class, () -> {
            bulkLotImportService.importLots(auctionId, fileBytes, "lots.csv");
        });
        verify(bulkImportJobRepository, never()).save(any(BulkImportJob.class));
    }

    @Test
    void testImportLots_AuctionNotFound_ThrowsException() {
        UUID auctionId = UUID.randomUUID();
        String csvContent = "lot_number,title,material_category,quantity,unit_of_measure,starting_price,minimum_increment,currency\n" +
                "101,Vase,Ceramics,1,pcs,100,10,USD";
        byte[] fileBytes = csvContent.getBytes();
        String fileHash = bulkLotImportService.calculateSHA256(fileBytes);

        when(bulkImportJobRepository.findByFileHash(fileHash)).thenReturn(Optional.empty());
        when(auctionRepository.findById(auctionId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            bulkLotImportService.importLots(auctionId, fileBytes, "lots.csv");
        });
    }

    @Test
    void testImportLots_DuplicateLotInDatabase_ThrowsException() {
        UUID auctionId = UUID.randomUUID();
        String csvContent = "lot_number,title,description,material_category,quantity,unit_of_measure,starting_price,reserve_price,minimum_increment,currency\n" +
                "101,Vase,Old,Ceramics,1,pcs,100,200,10,USD";
        byte[] fileBytes = csvContent.getBytes();
        String fileHash = bulkLotImportService.calculateSHA256(fileBytes);

        Auction auction = new Auction();
        auction.setId(auctionId);

        when(bulkImportJobRepository.findByFileHash(fileHash)).thenReturn(Optional.empty());
        when(auctionRepository.findById(auctionId)).thenReturn(Optional.of(auction));
        when(auctionLotRepository.existsByAuctionIdAndLotNumber(auctionId, "101")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> {
            bulkLotImportService.importLots(auctionId, fileBytes, "lots.csv");
        });
    }

    @Test
    void testImportLots_ExceedsFileSizeLimit_ThrowsException() {
        UUID auctionId = UUID.randomUUID();
        byte[] hugeBytes = new byte[6 * 1024 * 1024]; // 6MB

        assertThrows(IllegalArgumentException.class, () -> {
            bulkLotImportService.importLots(auctionId, hugeBytes, "huge.csv");
        });
    }
}
