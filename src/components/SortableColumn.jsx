import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable элемент для колонок
function SortableColumn({ id, title, children, onDelete }) {
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
    onDelete(id);
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-200 rounded-lg p-4 w-80 mr-4 flex-shrink-0">
      <div className="flex justify-between items-center mb-4">
        <div {...attributes} {...listeners} className="cursor-move flex-grow"> {/* разделили область перетаскивания 
                                                                                и кнопки удаления;
                                                                                flex-grow к заголовку - чтобы он занимал все доступное пространство
                                                               */}
          <h3 className="font-semibold text-lg text-gray-800">
            {title}
          </h3>
        </div>
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 text-xl font-bold ml-2"
        >
          ×
        </button>
      </div>
      {children}
    </div>
  );
}

export default SortableColumn;