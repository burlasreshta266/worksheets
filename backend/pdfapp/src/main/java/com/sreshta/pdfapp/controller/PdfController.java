package com.sreshta.pdfapp.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
public class PdfController {

    @PostMapping("/generate-pdf")
    public ResponseEntity<byte[]> generatePdf(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("compression") int compression,
            @RequestParam("title") String title
    ) {
        try {
            // TEMP: return dummy PDF
            byte[] pdfBytes = "Dummy PDF".getBytes();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + title + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}