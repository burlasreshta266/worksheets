document.addEventListener("DOMContentLoaded", () => {

    /* --------------------------------------------------
       ELEMENTS
    -------------------------------------------------- */
    const panel = document.getElementById("thumbnailPanel");
    const grid = document.getElementById("thumbnailGrid");

    const openReorder = document.getElementById("openReorder");
    const openDelete = document.getElementById("openDelete");

    const reorderControls = document.getElementById("reorderControls");
    const deleteControls = document.getElementById("deleteControls");

    const deleteForm = document.getElementById("deleteForm");

    /* --------------------------------------------------
       OPEN REORDER MODE
    -------------------------------------------------- */
    openReorder.addEventListener("click", () => {
    panel.style.display = "block";

    panel.classList.add("reorder-mode");
    panel.classList.remove("delete-mode");

    reorderControls.style.display = "block";
    deleteControls.style.display = "none";

    document.querySelectorAll(".delete-checkbox")
        .forEach(cb => cb.classList.add("d-none"));

    if (grid) {
        grid.classList.add('no-swipe');
        document.querySelectorAll('.draggable-item').forEach(it => {
            it.style.touchAction = 'none';
            it.style.msTouchAction = 'none';
        });
    }

    document.body.classList.add('reorder-active');
    });

    /* --------------------------------------------------
       OPEN DELETE MODE
    -------------------------------------------------- */
    openDelete.addEventListener("click", () => {
        panel.style.display = "block";

        panel.classList.add("delete-mode");
        panel.classList.remove("reorder-mode");

        reorderControls.style.display = "none";
        deleteControls.style.display = "block";

        // Show delete checkboxes
        document.querySelectorAll(".delete-checkbox")
            .forEach(cb => cb.classList.remove("d-none"));

        if (grid) {
            grid.classList.remove('no-swipe');
            document.querySelectorAll('.draggable-item').forEach(it => {
                it.style.touchAction = '';
                it.style.msTouchAction = '';
            });
        }
        document.body.classList.remove('reorder-active');
    });

    /* --------------------------------------------------
       DELETE SELECTED PAGES
    -------------------------------------------------- */
    document.getElementById("deleteSelectedBtn").addEventListener("click", () => {
        const selected = [...document.querySelectorAll(".delete-page-checkbox:checked")]
            .map(cb => cb.value);

        if (selected.length === 0) {
            alert("Please select at least one page.");
            return;
        }

        if (!confirm("Delete pages: " + selected.join(", ") + "?")) return;

        deleteForm.action = "/delete_pages/" + selected.join("-") + "/";
        deleteForm.submit();
    });

    /* --------------------------------------------------
       SELECT THUMBNAILS (DELETE MODE)
    -------------------------------------------------- */
    grid.addEventListener("click", e => {
        if (!panel.classList.contains("delete-mode")) return;

        const item = e.target.closest(".draggable-item");
        if (!item) return;

        const cb = item.querySelector(".delete-page-checkbox");
        const wrapper = item.querySelector(".thumbnail-wrapper");

        cb.checked = !cb.checked;

        cb.checked ?
            wrapper.classList.add("selected") :
            wrapper.classList.remove("selected");
    });

/* ============================================================
   DRAG & DROP — WITH DRAG HANDLES (mobile-friendly)
   ============================================================ */

let draggingItem = null;
let pointerId = null;

// helper: find nearest item
function getCenterY(el) {
    const r = el.getBoundingClientRect();
    return r.top + r.height / 2;
}
function getNearest(y) {
    const items = [...grid.querySelectorAll(".draggable-item:not(.dragging)")];
    return items.find(i => y < getCenterY(i));
}

// START DRAG — only when handle is touched
function onHandleDown(e) {
    if (!panel.classList.contains("reorder-mode")) return;

    const item = e.currentTarget.closest(".draggable-item");
    draggingItem = item;

    if (e.pointerType === "mouse" && e.button !== 0) return;

    pointerId = e.pointerId;
    draggingItem.classList.add("dragging");

    try { draggingItem.setPointerCapture(pointerId); } catch {}

    e.preventDefault();
}

// MOVE
function onHandleMove(e) {
    if (!draggingItem) return;
    if (e.pointerId !== pointerId) return;

    const y = e.clientY ?? e.touches?.[0]?.clientY;
    const next = getNearest(y);

    grid.insertBefore(draggingItem, next || null);
}

// END
function onHandleUp(e) {
    if (!draggingItem) return;

    try { draggingItem.releasePointerCapture(pointerId); } catch {}

    draggingItem.classList.remove("dragging");
    draggingItem = null;
    pointerId = null;
}

/* ---------------------------------------
   ATTACH DRAG EVENTS ONLY TO HANDLE
--------------------------------------- */
document.querySelectorAll(".drag-handle").forEach(handle => {
    handle.addEventListener("pointerdown", onHandleDown, { passive: false });
    handle.addEventListener("pointermove", onHandleMove, { passive: false });
    handle.addEventListener("pointerup", onHandleUp);
    handle.addEventListener("pointercancel", onHandleUp);

    // fallback touch events for older iOS
    handle.addEventListener("touchstart", e => {
        const f = {
            currentTarget: handle,
            pointerType: "touch",
            pointerId: Date.now(),
            clientY: e.touches[0].clientY,
            preventDefault: () => e.preventDefault()
        };
        onHandleDown(f);
    }, { passive: false });

    handle.addEventListener("touchmove", e => {
        const f = {
            pointerId: pointerId,
            clientY: e.touches[0].clientY,
            touches: e.touches
        };
        onHandleMove(f);
    }, { passive: false });

    handle.addEventListener("touchend", () => onHandleUp({}));
});

    /* --------------------------------------------------
       SAVE ORDER
    -------------------------------------------------- */
    document.getElementById("saveOrderBtn").addEventListener("click", () => {
        const items = [...document.querySelectorAll(".draggable-item")];
        const order = items.map(i => i.dataset.page);

        document.getElementById("orderInput").value = order.join(",");
        document.getElementById("reorderForm").submit();
    });

    /* --------------------------------------------------
       LIVE PDF PREVIEW REFRESH
    -------------------------------------------------- */
    const embed = document.querySelector("embed");
    embed.src = embed.src + "?v=" + Date.now();

    /* --------------------------------------------------
       EDIT TITLE
    -------------------------------------------------- */
    const editBtn = document.getElementById("editTitleBtn");
    const saveBtn = document.getElementById("saveTitleBtn");
    const titleInput = document.getElementById("titleInput");

    editBtn.addEventListener("click", () => {
        titleInput.disabled = false;
        titleInput.focus();
        editBtn.classList.add("d-none");
        saveBtn.classList.remove("d-none");
    });

});
