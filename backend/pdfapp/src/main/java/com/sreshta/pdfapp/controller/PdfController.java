package com.sreshta.pdfapp.controller;

import com.sreshta.pdfapp.service.impl.PdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
public class PdfController {

    private final PdfService pdfService;

    public PdfController(PdfService pdfService) {
        this.pdfService = pdfService;
    }


    @PostMapping("/generate-pdf")
    public ResponseEntity<byte[]> generatePdf(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "compression", defaultValue = "0") int compression,
            @RequestParam(value = "title", defaultValue = "generated_pdf") String title,
            @RequestParam(value = "isA4", defaultValue = "false") boolean isA4
    ) {
        if(files == null || files.isEmpty()) return ResponseEntity.badRequest().build();
        try {
            byte[] pdfbytes = pdfService.createPDF(files, compression, isA4);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + title + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfbytes);
        } catch (Exception e){
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}