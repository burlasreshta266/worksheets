import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";

function reorderItems(items, startIndex, endIndex) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(startIndex, 1);
  nextItems.splice(endIndex, 0, movedItem);
  return nextItems;
}

function ReorderGrid({ images, onReorder }) {
  const handleDragEnd = (result) => {
    const { destination, source } = result;

    if (!destination || destination.index === source.index) {
      return;
    }

    onReorder?.(reorderItems(images, source.index, destination.index));
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="reorder-grid" direction="horizontal">
        {(provided) => (
          <div
            className="reorder-grid"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {images.map((image, index) => (
              <Draggable
                key={image.key ?? index}
                draggableId={String(image.key ?? index)}
                index={index}
              >
                {(draggableProvided, snapshot) => (
                  <div
                    ref={draggableProvided.innerRef}
                    {...draggableProvided.draggableProps}
                    {...draggableProvided.dragHandleProps}
                    className={`reorder-grid-item ${snapshot.isDragging ? "reorder-grid-item-dragging" : ""}`}
                  >
                    <img
                      src={image.src}
                      alt={`Page ${index + 1}`}
                      className="reorder-grid-image"
                    />
                    <div className="reorder-grid-label">Page {index + 1}</div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export default ReorderGrid;
