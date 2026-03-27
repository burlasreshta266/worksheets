package com.sreshta.pdfapp.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface PdfService {
    byte[] createPDF(List<MultipartFile> files, int compression, boolean isA4) throws Exception;
}
