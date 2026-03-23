function ThumbnailGrid({ images, selectedIndexes = [], onChange, selectable = true }) {
  const selectedSet = new Set(selectedIndexes);

  const toggleSelect = (index) => {
    if (!selectable) {
      return;
    }

    const nextSelection = new Set(selectedSet);

    if (nextSelection.has(index)) {
      nextSelection.delete(index);
    } else {
      nextSelection.add(index);
    }

    onChange?.(Array.from(nextSelection).sort((left, right) => left - right));
  };

  return (
    <div className="thumbnail-grid">
      {images.map((img, index) => (
        <div
          key={img.key ?? index}
          className={`thumbnail-grid-item ${selectedSet.has(index) ? "thumbnail-grid-item-selected" : ""}`}
          onClick={() => toggleSelect(index)}
          role={selectable ? "button" : undefined}
          tabIndex={selectable ? 0 : undefined}
          onKeyDown={(event) => {
            if (!selectable) {
              return;
            }

            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleSelect(index);
            }
          }}
        >
          <img
            src={img.src}
            alt={`Page ${index + 1}`}
            className="thumbnail-grid-image"
          />
          <div className="thumbnail-grid-label">Page {index + 1}</div>
        </div>
      ))}
    </div>
  );
}

export default ThumbnailGrid;
