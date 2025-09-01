import { useSortable } from "@dnd-kit/sortable";
import { CSS } from '@dnd-kit/utilities';

// Sortable элемент для задач
function SortableTask({ id, task, onDelete, columnId }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();

    onDelete(task.id, columnId);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-3 mb-2 rounded shadow cursor-move relative"
    >
      <div className="flex justify-between items-center">
        <div {...attributes}
      {...listeners} className="flex-grow pr-4 cursor-move"><p>{task.content}</p></div>
        <button
          onClick={handleDelete}
          onMouseDown={(e) => e.stopPropagation()}
          className="text-red-500 hover:text-red-700 text-xl font-bold p-1 ml-2 z-10 bg-white rounded"
          style={{ minWidth: '30px', minHeight: '30px' }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default SortableTask;