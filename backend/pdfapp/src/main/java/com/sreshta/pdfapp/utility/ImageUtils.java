package com.sreshta.pdfapp.utility;

import org.springframework.web.multipart.MultipartFile;
import javax.imageio.*;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.ArrayList;
import java.util.List;

public class ImageUtils {

    private static final float MAX_QUALITY = 1.0f;
    private static final float MIN_QUALITY = 0.05f;
    private static final double PDF_METADATA_BUFFER = 1.02; // 2% overhead


    // --- SECTION 1: LOADING & TRANSFORMATION ---

    public static List<BufferedImage> loadImages(List<MultipartFile> files) throws IOException {
        List<BufferedImage> images = new ArrayList<>();
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                try (InputStream is = file.getInputStream()) {
                    BufferedImage img = ImageIO.read(is);
                    if (img != null) images.add(img);
                }
            }
        }
        return images;
    }

    public static List<BufferedImage> resizeAll(List<BufferedImage> images, int maxSide) {
        List<BufferedImage> resized = new ArrayList<>();
        for (BufferedImage img : images) {
            resized.add(resize(img, maxSide));
        }
        return resized;
    }

    private static BufferedImage resize(BufferedImage img, int maxSide) {
        int w = img.getWidth(), h = img.getHeight();
        double scale = Math.min((double) maxSide / w, (double) maxSide / h);
        if (scale >= 1.0) return img;

        int targetW = (int) (w * scale), targetH = (int) (h * scale);
        BufferedImage resized = new BufferedImage(targetW, targetH, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resized.createGraphics();

        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        g2d.drawImage(img, 0, 0, targetW, targetH, null);
        g2d.dispose();
        return resized;
    }


    // --- SECTION 2: SIZING & LIMIT CHECKING (Overloaded) ---

    // Checks if a list of already encoded JPEG bytes fits in the limit.
    public static boolean isWithinLimit(List<byte[]> jpegData, long limitInBytes) {
        long totalSize = 0;
        for (byte[] data : jpegData) totalSize += data.length;
        return (totalSize * PDF_METADATA_BUFFER) <= limitInBytes;
    }

    // checks if a BufferedImage list fits in the limit
    public static boolean isWithinLimit(List<BufferedImage> images, long limitInBytes, float testQuality) throws IOException {
        long totalSize = 0;
        for (BufferedImage img : images) {
            totalSize += getEncodedSize(img, testQuality);
        }
        return (totalSize * PDF_METADATA_BUFFER) <= limitInBytes;
    }


    // --- SECTION 3: COMPRESSION ENGINE ---

    public static List<byte[]> compressToLimit(List<BufferedImage> images, long limitInBytes) throws IOException {
        float low = MIN_QUALITY, high = MAX_QUALITY;
        float bestQuality = MIN_QUALITY;

        // Binary Search for the best quality setting
        for (int i = 0; i < 8; i++) {
            float mid = (low + high) / 2.0f;
            if (isWithinLimit(images, limitInBytes, mid)) {
                bestQuality = mid;
                low = mid; // Try to increase quality
            } else {
                high = mid; // Must decrease quality
            }
        }

        return encodeAllToJpeg(images, bestQuality);
    }

    public static List<byte[]> encodeAllToJpeg(List<BufferedImage> images, float quality) throws IOException {
        List<byte[]> results = new ArrayList<>();
        for (BufferedImage img : images) results.add(toJpegBytes(img, quality));
        return results;
    }

    private static byte[] toJpegBytes(BufferedImage img, float quality) throws IOException {
        // convert to rgb color
        BufferedImage rgbImage = new BufferedImage(
                img.getWidth(),
                img.getHeight(),
                BufferedImage.TYPE_INT_RGB
        );

        Graphics2D g = rgbImage.createGraphics();
        g.setColor(Color.WHITE); // fill background for transparency
        g.fillRect(0, 0, img.getWidth(), img.getHeight());
        g.drawImage(img, 0, 0, null);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpg").next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(quality);

        try (ImageOutputStream ios = ImageIO.createImageOutputStream(baos)) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(rgbImage, null, null), param);
        } finally {
            writer.dispose();
        }
        return baos.toByteArray();
    }

    private static long getEncodedSize(BufferedImage img, float quality) throws IOException {
        return toJpegBytes(img, quality).length;
    }
}