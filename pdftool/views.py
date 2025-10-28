from django.shortcuts import render, redirect
from django.contrib import messages
import tempfile
import os, io
from django.http import FileResponse, Http404
from PIL import Image

MAX_PDF_SIZE = 1 * 1024 * 1024
A4_SIZE = (1240, 1754)

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

                    # Resize to A4 resolution (~150 DPI)
                    img_clean = img_clean.resize(A4_SIZE)
                    images.append(img_clean)

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
            messages.error(request, "Created pdf")
            return redirect('index')                

        # If no files are selected
        else:
            messages.error(request, "⚠️ No files selected. Please upload at least one image.")
            return redirect('index')
    else:
        return redirect('index')



def download_pdf(request):
    pdf_path = request.session.get('pdf_path')
    if not pdf_path or not os.path.exists(pdf_path):
        raise Http404("No PDF available for download.")

    # Serve the file
    response = FileResponse(open(pdf_path, 'rb'), as_attachment=True, filename='converted.pdf')

    # Cleanup: delete file and remove from session
    try:
        os.remove(pdf_path)
    except Exception:
        pass
    request.session.pop('pdf_path', None)

    return response