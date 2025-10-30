from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib import messages
import tempfile
import os, io
from django.http import FileResponse, Http404
from PIL import Image

MAX_PDF_SIZE = 1 * 1024 * 1024  # 1 MB
DPI = 150
A4_WIDTH_IN = 8.27  # A4 width in inches
A4_HEIGHT_IN = 11.69  # A4 height in inches
A4_SIZE = (int(A4_WIDTH_IN * DPI), int(A4_HEIGHT_IN * DPI))  # (~1240x1754 at 150 DPI)
A4_SIZE_RATIO = (int(A4_WIDTH_IN * DPI)/int(A4_HEIGHT_IN * DPI))

def index(request):
    pdf_path = request.session.get('pdf_path')
    return render(request, 'pdftool/index.html', {'pdf_exists': bool(pdf_path)})


def create_pdf(request):
    if request.method == 'POST':
        files = request.FILES.getlist('files')
        if files:
            images = []

            # resize image to A4
            for f in files:
                try:
                    img = Image.open(f).convert('RGB')

                    # Strip EXIF metadata (reduces ~100–300 KB per image)
                    data = list(img.getdata())
                    img_clean = Image.new(img.mode, img.size)
                    img_clean.putdata(data)
                    
                    # Calculate current image aspect ratio
                    img_ratio = img_clean.width / img_clean.height
                    
                    if img_ratio > A4_SIZE_RATIO:
                        # Image is wider than A4
                        new_width = int(img_clean.height * A4_SIZE_RATIO)
                        new_height = img_clean.height
                        left = (img_clean.width - new_width) // 2
                        top = 0
                        right = left + new_width
                        bottom = new_height
                    else:
                        # Image is taller than A4
                        new_width = img_clean.width
                        new_height = int(img_clean.width / A4_SIZE_RATIO)
                        left = 0
                        top = (img_clean.height - new_height) // 2
                        right = new_width
                        bottom = top + new_height

                    # Crop the image to A4 proportions
                    img_cropped = img_clean.crop((left, top, right, bottom))
                    
                    # Resize the cropped image to exact A4 dimensions
                    img_resized = img_cropped.resize(A4_SIZE, Image.Resampling.LANCZOS)
                    
                    images.append(img_resized)

                except Exception:
                    messages.error(request, "⚠️ Error processing images. Please try again.")
                    return redirect('index')
            
            # no valid images are present 
            if not images:
                messages.error(request, "⚠️ No valis images selected. Please try again.")
                return redirect('index')
            
            quality = 95
            pdf_bytes = io.BytesIO()

            # Try compressing PDF until under 1MB
            while quality >= 20:
                pdf_bytes.seek(0)
                pdf_bytes.truncate(0)

                # Save first image, append others
                images[0].save(pdf_bytes, format="PDF", save_all=True,
                       append_images=images[1:], quality=quality)

                pdf_size = pdf_bytes.tell()
                if pdf_size <= MAX_PDF_SIZE:
                    break
                quality -= 10


            # save pdf to temp
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
            temp_file.write(pdf_bytes.getvalue())
            pdf_path = temp_file.name
            temp_file.flush()
            request.session['pdf_path'] = pdf_path
            request.session['viewed'] = False
            return redirect('preview')                

        # If no files are selected
        else:
            messages.error(request, "⚠️ No files selected. Please upload at least one image.")
            return redirect('index')
    else:
        return redirect('index')


# Download PDF button
def download_pdf(request):
    pdf_path = request.session.get('pdf_path')
    if not pdf_path or not os.path.exists(pdf_path):
        raise Http404("No PDF available for download.")
    response = FileResponse(open(pdf_path, 'rb'), as_attachment=True, filename='converted.pdf')
    return response


# Preview PDF page after it is done
def preview(request):
    pdf_path = request.session.get('pdf_path')
    if not pdf_path or not os.path.exists(pdf_path):
        messages.error(request, "⚠️ No PDF available to preview.")
        return redirect('index')
    
    # id pdf has already been viewed, delete it
    if request.session.get('viewed', False) == True:
        try:
            os.remove(pdf_path)
        except Exception:
            pass
        request.session.pop('pdf_path', None)
        request.session.pop('viewed', None)
        messages.info(request, "ℹ️ PDF has been removed after viewing. Upload again")
        return redirect('index')
    
    # not viewed yet, set viewed to true
    request.session['viewed'] = True
    return render(request, 'pdftool/view_pdf.html',)

def view_pdf(request):
    pdf_path = request.session.get('pdf_path')
    if not pdf_path or not os.path.exists(pdf_path):
        raise Http404("No PDF available for viewing.")
    return FileResponse(open(pdf_path, 'rb'), content_type='application/pdf')


# Edit pdf
def edit_pdf(request):
    pdf_path = request.session.get('pdf_path')
    if not pdf_path or not os.path.exists(pdf_path):
        messages.error(request, "⚠️ No PDF available to edit.")
        return redirect('index')
    
    context = {
        'pdf_title' : 'Created-pdf.pdf',
        'pdf_url' : reverse('view_pdf'),
    }
    return render(request, 'pdftool/edit_pdf.html', context)