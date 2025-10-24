from django.shortcuts import render, redirect
from django.contrib import messages
import tempfile
import os
from django.http import FileResponse
from PIL import Image

def index(request):
    return render(request, 'pdftool/index.html')


def create_pdf(request):
    if request.method == 'POST':
        files = request.FILES.getlist('files')
        if files:
            images = []

            # resize image to A4
            for f in files:
                i = Image.open(f).convert('RGB')
                i = i.resize((1240, 1754))
                images.append(i)
            
            if images:
                # save pdf to temp
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
                pdf_path = temp_file.name
                images[0].save(pdf_path, save_all=True, append_images=images[1:])
                temp_file.flush()
                request.session['pdf_path'] = pdf_path
                messages.error(request, "Created pdf")
                return redirect('index')
            else:
                messages.error(request, "⚠️ Error processing images. Please try again.")
                return redirect('index')

        # If no files are selected
        else:
            messages.error(request, "⚠️ No files selected. Please upload at least one image.")
            return redirect('index')
    else:
        return redirect('index')


