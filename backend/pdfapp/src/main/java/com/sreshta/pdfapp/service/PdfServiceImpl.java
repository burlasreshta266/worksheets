package com.sreshta.pdfapp.service;

import com.sreshta.pdfapp.service.impl.PdfService;
import com.sreshta.pdfapp.utility.ImageUtils;
import com.sreshta.pdfapp.utility.PdfCreator;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.List;

@Service
public class PdfServiceImpl implements PdfService {

    @Override
    public byte[] createPDF(List<MultipartFile> files, int compression, boolean isA4) throws Exception {

        List<BufferedImage> raw = ImageUtils.loadImages(files);

        List<byte[]> finalJpegs;

        long targetSize = compression * 1024L * 1024L;

        if (compression == 0) {
            finalJpegs = ImageUtils.encodeAllToJpeg(raw, 0.98f);

        } else {
            List<BufferedImage> resized = ImageUtils.resizeAll(raw, 2000);

            if (ImageUtils.isWithinLimit(resized, targetSize, 0.98f)) {
                finalJpegs = ImageUtils.encodeAllToJpeg(resized, 0.98f);
            } else {
                finalJpegs = ImageUtils.compressToLimit(resized, targetSize);
            }
        }

        return PdfCreator.createPdf(finalJpegs, isA4);
    }
}
