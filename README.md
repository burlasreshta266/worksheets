# Image to PDF Converter (Full Stack)

A full-stack web application that allows users to upload, edit, and convert images into a compressed PDF with customizable size limits.


## Features

* Upload multiple images
* Edit images before export:

  * Crop
  * Apply filters (grayscale, contrast)
  * Reorder pages
  * Add/remove pages
* Generate PDF with:

  * Adjustable size limit (1MB–100MB)
  * High-quality default mode
  * Optional A4 page layout
* Automatic image compression using binary search for optimal quality


## Usage

1. Upload images
2. Edit as needed
3. Select compression level
4. Click **Download**
5. PDF will be generated and downloaded


## How It Works

1. Images are uploaded and edited in the frontend
2. Edited images are sent to the backend
3. Backend pipeline:

   * Convert to `BufferedImage`
   * Resize (if needed)
   * Compress using adaptive quality
   * Generate PDF using PDFBox
4. Final PDF is returned and downloaded


## Tech Stack

**Frontend**

* React
* React Bootstrap

**Backend**

* Spring Boot
* Apache PDFBox
* Java ImageIO