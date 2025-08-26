import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

import { useImmer } from 'use-immer';
import { initialState } from '../config';

import SortableTask from '../components/SortableTask';
import SortableColumn from '../components/SortableColumn';
import TaskInput from '../components/TaskInput';

// ID
const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [state, setState] = useImmer(initialState);
  const [history, setHistory] = useState({ past: [], future: [] });
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Функция для обновления состояния с сохранением истории
  const updateState = (updater) => {
    setHistory(prev => ({
      past: [...prev.past, JSON.parse(JSON.stringify(state))],
      future: []
    }));
    setState(updater);
  };

  // Отмена последнего действия
  const undo = () => {
    if (history.past.length > 0) {
      const previousState = history.past[history.past.length - 1];
      setHistory(prev => ({
        past: prev.past.slice(0, -1),
        future: [state, ...prev.future]
      }));
      setState(previousState);
    }
  };

  // Повтор последнего отмененного действия
  const redo = () => {
    if (history.future.length > 0) {
      const nextState = history.future[0];
      setHistory(prev => ({
        past: [...prev.past, state],
        future: prev.future.slice(1)
      }));
      setState(nextState);
    }
  };

  // Обработчик начала перетаскивания
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Обработчик завершения перетаскивания
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Если элемент брошен в том же месте
    if (active.id === over.id) return;

    // Определяем тип перетаскиваемого элемента
    const activeIsColumn = state.columns.some(col => col.id === active.id);
    const overIsColumn = state.columns.some(col => col.id === over.id);

    // Перемещение колонки
    if (activeIsColumn && overIsColumn) {
      updateState(draft => {
        const activeIndex = draft.columns.findIndex(col => col.id === active.id);
        const overIndex = draft.columns.findIndex(col => col.id === over.id);
        draft.columns = arrayMove(draft.columns, activeIndex, overIndex);
      });
      return;
    }

    // Перемещение задачи
    const activeIsTask = state.tasks[active.id];
    const overIsTask = state.tasks[over.id];

    if (activeIsTask && overIsTask) {
      // Находим колонки, в которых находятся задачи
      const activeColumn = state.columns.find(col => col.taskIds.includes(active.id));
      const overColumn = state.columns.find(col => col.taskIds.includes(over.id));

      // Если задачи в одной колонке
      if (activeColumn.id === overColumn.id) {
        updateState(draft => {
          const column = draft.columns.find(col => col.id === activeColumn.id);
          const activeIndex = column.taskIds.indexOf(active.id);
          const overIndex = column.taskIds.indexOf(over.id);
          column.taskIds = arrayMove(column.taskIds, activeIndex, overIndex);
        });
      } else {
        // Если задачи в разных колонках
        updateState(draft => {
          const activeCol = draft.columns.find(col => col.id === activeColumn.id);
          const overCol = draft.columns.find(col => col.id === overColumn.id);

          const activeIndex = activeCol.taskIds.indexOf(active.id);
          const overIndex = overCol.taskIds.indexOf(over.id);

          // Удаляем задачу из активной колонки
          activeCol.taskIds.splice(activeIndex, 1);
          // Добавляем задачу в целевую колонку
          overCol.taskIds.splice(overIndex, 0, active.id);
        });
      }
    }
  };

  // Добавление новой колонки
  const addColumn = () => {
    if (newColumnTitle.trim() === '') return;

    const newColumnId = generateId();
    updateState(draft => {
      draft.columns.push({
        id: `column-${newColumnId}`,
        title: newColumnTitle,
        taskIds: []
      });
    });
    setNewColumnTitle('');
  };

  // Добавление новой задачи в колонку
  const addTask = (columnId, content) => {
    if (content.trim() === '') return;

    const newTaskId = generateId();
    updateState(draft => {
      const taskId = `task-${newTaskId}`;
      draft.tasks[taskId] = { id: taskId, content };
      const column = draft.columns.find(col => col.id === columnId);
      column.taskIds.push(taskId);
    });
  };

  // Удаление задачи
  const deleteTask = (taskId, columnId) => {
    updateState(draft => {
      // Удаляем задачу из колонки
      const column = draft.columns.find(col => col.id === columnId);
      if (column) {
        column.taskIds = column.taskIds.filter(id => id !== taskId);
      }
      
      // Удаляем саму задачу
      if (draft.tasks[taskId]) {
        delete draft.tasks[taskId];
      }
    });
  };

  // Удаление колонки
  const deleteColumn = (columnId) => {
    // Находим колонку для удаления
    const columnToDelete = state.columns.find(col => col.id === columnId);
    if (!columnToDelete) return;
    
    // Удаляем все задачи колонки
    const newTasks = {...state.tasks};
    columnToDelete.taskIds.forEach(taskId => {
      delete newTasks[taskId];
    });
    
    // Удаляем колонку
    updateState({
      ...state,
      tasks: newTasks,
      columns: state.columns.filter(col => col.id !== columnId)
    });
  };

  // Экспорт состояния в JSON
  const exportToJson = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = 'trello-board.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Mini Trello</h1>
          <div className="flex space-x-2">
            <button
              onClick={undo}
              disabled={history.past.length === 0}
              className={`px-4 py-2 rounded ${history.past.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
            >
              Отменить
            </button>
            <button
              onClick={redo}
              disabled={history.future.length === 0}
              className={`px-4 py-2 rounded ${history.future.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
            >
              Повторить
            </button>
            <button
              onClick={exportToJson}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Экспорт (JSON)
            </button>
          </div>
        </header>

        <div className="mb-4 flex">
          <input
            type="text"
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            placeholder="Название колонки"
            className="flex-grow px-4 py-2 mr-2 border rounded"
          />
          <button
            onClick={addColumn}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Добавить колонку
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={state.columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex overflow-x-auto pb-4">
              {state.columns.map((column) => (
                <SortableColumn key={column.id} id={column.id} title={column.title} onDelete={deleteColumn}>
                  <TaskInput columnId={column.id} onAddTask={addTask} />

                  <SortableContext items={column.taskIds} strategy={verticalListSortingStrategy}>
                    <div className="min-h-64">
                      {column.taskIds.map((taskId) => {
                        const task = state.tasks[taskId];
                        if (!task) return null; // если нет задачи, то пропускаем её
                        return (
                          <SortableTask
                            key={task.id}
                            id={task.id}
                            task={task}
                            columnId={column.id}
                            onDelete={deleteTask}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </SortableColumn>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

export default App;