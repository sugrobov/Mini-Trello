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
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(task.id, columnId);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-3 mb-2 rounded shadow cursor-move"
    >
      <div className="flex justify-between items-center" {...attributes} {...listeners}>
        <p>{task.content}</p>
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 text-xl font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default SortableTask;