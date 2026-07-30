package com.eagleauctioner.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.UUID;

@Service
public class DocumentStorageService {
    
    public String store(MultipartFile file, String module) throws IOException {
        validateMagicBytes(file);
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        // Storage: Return path
        return "/storage/" + module + "/" + fileName;
    }
    
    private void validateMagicBytes(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) return;
        byte[] bytes = file.getInputStream().readNBytes(8);
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        
        if (filename.endsWith(".pdf") && (bytes.length < 4 || bytes[0] != '%' || bytes[1] != 'P' || bytes[2] != 'D' || bytes[3] != 'F')) {
            throw new IllegalArgumentException("Invalid file format: PDF header signature mismatch");
        } else if (filename.endsWith(".png") && (bytes.length < 4 || (bytes[0] & 0xFF) != 0x89 || bytes[1] != 'P' || bytes[2] != 'N' || bytes[3] != 'G')) {
            throw new IllegalArgumentException("Invalid file format: PNG header signature mismatch");
        } else if ((filename.endsWith(".jpg") || filename.endsWith(".jpeg")) && (bytes.length < 2 || (bytes[0] & 0xFF) != 0xFF || (bytes[1] & 0xFF) != 0xD8)) {
            throw new IllegalArgumentException("Invalid file format: JPEG header signature mismatch");
        }
    }
    
    public void delete(String storagePath) {
        // Log deletion
    }
}
