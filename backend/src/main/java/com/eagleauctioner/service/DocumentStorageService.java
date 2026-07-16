package com.eagleauctioner.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.UUID;

@Service
public class DocumentStorageService {
    
    public String store(MultipartFile file, String module) throws IOException {
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        // Simulation: Just return a path
        return "/storage/" + module + "/" + fileName;
    }
    
    public void delete(String storagePath) {
        // Simulation: Log deletion
    }
}
