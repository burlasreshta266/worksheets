package com.sreshta.pdfapp.utility;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.PDPageContentStream;

import java.io.ByteArrayOutputStream;
import java.util.List;

public class PdfCreator {

    public static byte[] createPdf(List<byte[]> images, boolean isA4) throws Exception {

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            for (byte[] imageBytes : images) {

                // Create image object
                PDImageXObject pdImage = PDImageXObject.createFromByteArray(
                        document, imageBytes, "image"
                );

                PDPage page;

                if (isA4) {
                    page = new PDPage(PDRectangle.A4);
                } else {
                    // Use image size as page size
                    float width = pdImage.getWidth();
                    float height = pdImage.getHeight();

                    page = new PDPage(new PDRectangle(width, height));
                }
                document.addPage(page);

                // Page dimensions
                float pageWidth = page.getMediaBox().getWidth();
                float pageHeight = page.getMediaBox().getHeight();

                // Image dimensions
                float imgWidth = pdImage.getWidth();
                float imgHeight = pdImage.getHeight();

                // Scale to fit page (maintain aspect ratio)
                float scale = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);

                float scaledWidth = imgWidth * scale;
                float scaledHeight = imgHeight * scale;

                // Center image
                float x = (pageWidth - scaledWidth) / 2;
                float y = (pageHeight - scaledHeight) / 2;

                // Draw image
                try (PDPageContentStream contentStream =
                             new PDPageContentStream(document, page)) {

                    contentStream.drawImage(pdImage, x, y, scaledWidth, scaledHeight);
                }
            }

            // Save PDF to byte array
            document.save(baos);
            return baos.toByteArray();
        }
    }
}