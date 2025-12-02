from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import FileResponse, Http404
from PIL import Image
import tempfile
import io
import os

MAX_PDF_SIZE = 1 * 1024 * 1024  # 1 MB
DPI = 150
A4_WIDTH_IN = 8.27
A4_HEIGHT_IN = 11.69
A4_SIZE = (int(A4_WIDTH_IN * DPI), int(A4_HEIGHT_IN * DPI))
A4_RATIO = A4_SIZE[0] / A4_SIZE[1]


# ------------- Helper Functions ------------- #

def process_image(f):
    # Cleans metadata and converts image to A4 proportion
    try:
        img = Image.open(f).convert("RGB")

        # Strip EXIF (reduces size)
        data = list(img.getdata())
        img_clean = Image.new(img.mode, img.size)
        img_clean.putdata(data)

        img_ratio = img_clean.width / img_clean.height

        # Crop to A4 proportions
        if img_ratio > A4_RATIO:
            new_width = int(img_clean.height * A4_RATIO)
            left = (img_clean.width - new_width) // 2
            crop_box = (left, 0, left + new_width, img_clean.height)
        else:
            new_height = int(img_clean.width / A4_RATIO)
            top = (img_clean.height - new_height) // 2
            crop_box = (0, top, img_clean.width, top + new_height)

        img_cropped = img_clean.crop(crop_box)

        # Resize to exact A4 pixel size
        return img_cropped.resize(A4_SIZE, Image.Resampling.LANCZOS)

    except Exception:
        return None


def compress_pdf(images):
    # Returns BytesIO containing compressed PDF
    pdf_buffer = io.BytesIO()
    quality = 95

    while quality >= 20:
        pdf_buffer.seek(0)
        pdf_buffer.truncate(0)

        images[0].save(
            pdf_buffer,
            format="PDF",
            save_all=True,
            append_images=images[1:],
            quality=quality,
        )

        if pdf_buffer.tell() <= MAX_PDF_SIZE:
            break

        quality -= 10

    return pdf_buffer


def save_temp_pdf(pdf_bytes):
    # Writes PDF bytes to a temp file and returns its path
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    tmp.write(pdf_bytes.getvalue())
    tmp.flush()
    return tmp.name


def delete_pdf_from_session(request):
    # Deletes PDF file from disk and clears session keys
    pdf_path = request.session.get("pdf_path")
    if pdf_path and os.path.exists(pdf_path):
        try:
            os.remove(pdf_path)
        except Exception:
            pass
    request.session.pop("pdf_path", None)
    request.session.pop("viewed", None)


# ------------- View Functions ------------- #


def index(request):
    return render(request, "pdftool/index.html")


def create_pdf(request):
    if request.method != "POST":
        return redirect("index")

    files = request.FILES.getlist("files")
    if not files:
        messages.error(request, "⚠️ No files selected.")
        return redirect("index")

    images = []
    image_paths = []
    for f in files:
        img = process_image(f)
        if not img:
            messages.error(request, "⚠️ Error processing images.")
            return redirect("index")
        images.append(img)
        # Save processed image to temp file
        temp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        img.save(temp.name, "JPEG", quality=90)
        image_paths.append(temp.name)

    # store image list in session
    request.session["image_paths"] = image_paths

    pdf_buffer = compress_pdf(images)
    pdf_path = save_temp_pdf(pdf_buffer)

    request.session["pdf_path"] = pdf_path
    request.session["viewed"] = False
    request.session["pdf_name"] = "converted.pdf"

    return redirect("preview")


def generate_thumbnails(image_paths):
    thumbnails = []

    for idx, p in enumerate(image_paths, start=1):
        thumb_path = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg").name

        img = Image.open(p)
        img.thumbnail((200, 300))
        img.save(thumb_path, "JPEG")

        thumbnails.append((idx, thumb_path))

    return thumbnails



def preview(request):
    pdf_path = request.session.get("pdf_path")

    if not pdf_path or not os.path.exists(pdf_path):
        messages.error(request, "⚠️ No PDF available.")
        return redirect("index")

    # On reload → delete file
    if request.session.get("viewed"):
        delete_pdf_from_session(request)
        messages.info(request, "ℹ️ PDF removed after refresh.")
        return redirect("index")

    request.session["viewed"] = True
    return render(request, "pdftool/view_pdf.html")


def view_pdf(request):
    pdf_path = request.session.get("pdf_path")

    if not pdf_path or not os.path.exists(pdf_path):
        raise Http404("PDF not found.")

    return FileResponse(open(pdf_path, "rb"), content_type="application/pdf")


def download_pdf(request):
    pdf_path = request.session.get("pdf_path")
    pdf_name = request.session.get("pdf_name", "converted.pdf")

    if not pdf_path or not os.path.exists(pdf_path):
        raise Http404("No PDF for download.")

    response = FileResponse(
        open(pdf_path, "rb"),
        as_attachment=True,
        filename = pdf_name,
    )

    # Cleanup after sending
    def cleanup(*args, **kwargs):
        delete_pdf_from_session(request)
        return original_close(*args, **kwargs)

    original_close = response.close
    response.close = cleanup

    return response


def edit(request):
    pdf_path = request.session.get("pdf_path")
    pdf_name = request.session.get("pdf_name", "converted.pdf")
    image_paths = request.session.get("image_paths", [])

    if not pdf_path or not os.path.exists(pdf_path):
        messages.error(request, "⚠️ No PDF available to edit.")
        return redirect("index")

    thumbnails = generate_thumbnails(image_paths)

    request.session["thumbnail_paths"] = [t[1] for t in thumbnails]

    return render(request, "pdftool/edit.html", {
        "pdf_url": "/view_pdf/",
        "pdf_title": pdf_name,
        "thumbnails": thumbnails,
    })



# Change the pdf title
def edit_pdf_name(request):
    if request.method != "POST":
        return redirect("edit")

    new_name = request.POST.get("pdf_name", "").strip()
    if not new_name:
        messages.error(request, "⚠️ PDF name cannot be empty.")
        return redirect("edit")

    if not new_name.lower().endswith(".pdf"):
        new_name += ".pdf"

    request.session["pdf_name"] = new_name
    messages.success(request, "✅ PDF name updated.")
    return redirect("edit")


# Delete the current pdf
def delete_pdf(request):
    if request.method != "POST":
        return redirect("edit")

    # Remove the PDF and session info
    delete_pdf_from_session(request)

    messages.success(request, "🗑️ PDF deleted successfully.")
    return redirect("index")


def delete_pages(request, pages):
    image_paths = request.session.get("image_paths", [])

    if not image_paths:
        messages.error(request, "⚠️ No pages available.")
        return redirect("edit")

    try:
        page_nums = [int(p) for p in pages.split('-')]
    except:
        messages.error(request, "⚠️ Invalid page numbers.")
        return redirect("edit")

    # keep only pages NOT deleted
    remaining = [p for i, p in enumerate(image_paths, start=1) if i not in page_nums]

    if not remaining:
        delete_pdf_from_session(request)
        messages.warning(request, "⚠️ All pages deleted.")
        return redirect("index")

    # rebuild PDF from remaining images
    imgs = [Image.open(path).convert("RGB") for path in remaining]
    pdf_buffer = compress_pdf(imgs)
    new_pdf_path = save_temp_pdf(pdf_buffer)

    # update session
    request.session["pdf_path"] = new_pdf_path
    request.session["image_paths"] = remaining

    messages.success(request, f"🗑 Deleted pages: {', '.join(map(str, page_nums))}")
    return redirect("edit")


def reorder_pages(request):
    if request.method != "POST":
        return redirect("edit")

    order = request.POST.get("order")
    if not order:
        messages.error(request, "⚠️ No reorder data received.")
        return redirect("edit")

    try:
        new_order = [int(x) for x in order.split(",")]
    except:
        messages.error(request, "⚠️ Invalid reorder format.")
        return redirect("edit")

    image_paths = request.session.get("image_paths", [])
    if not image_paths:
        messages.error(request, "⚠️ No images found.")
        return redirect("edit")

    if len(new_order) != len(image_paths):
        messages.error(request, "⚠️ Reorder length mismatch.")
        return redirect("edit")

    # Convert order to index positions (1-based → list index)
    new_paths = [image_paths[i - 1] for i in new_order]

    # Rebuild PDF from new order
    imgs = [Image.open(p).convert("RGB") for p in new_paths]
    pdf_buffer = compress_pdf(imgs)
    new_pdf_path = save_temp_pdf(pdf_buffer)

    # Save reorder in session
    request.session["image_paths"] = new_paths
    request.session["pdf_path"] = new_pdf_path

    messages.success(request, "🔄 Pages reordered successfully.")
    return redirect("edit")
