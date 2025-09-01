import { useState, useEffect } from 'react';
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
import { v4 as uuidv4 } from 'uuid';

import localForage from 'localforage';

import { initialState } from '../config';

import SortableTask from '../components/SortableTask';
import SortableColumn from '../components/SortableColumn';
import TaskInput from '../components/TaskInput';

/**
 * ключ для хранения состояния в localStorage
 */
import { STORAGE_KEY } from '../config';

function App() {
  const [state, setState] = useImmer(initialState);
  const [history, setHistory] = useState({ past: [], future: [] });
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Загрузка состояния из localForage при монтировании
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await localForage.getItem(STORAGE_KEY);
        if (savedState) {
          setState(savedState);
        }
        setIsLoaded(true);
      } catch (error) {
        console.error('Ошибка при загрузке состояния:', error);
        setIsLoaded(true);
      }
    };

    loadState();
  }, [setState]);

  // Сохранение состояния в localForage при изменении
  useEffect(() => {
    if (isLoaded) {
      const saveState = async () => {
        try {
          await localForage.setItem(STORAGE_KEY, state);
        } catch (error) {
          console.error('Ошибка при сохранении состояния:', error);
        }
      };

      saveState();
    }
  }, [state, isLoaded]);

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

    if (activeIsTask) {
      // Находим исходную колонку (откуда перемещаем)
      const sourceColumn = state.columns.find(col => col.taskIds.includes(active.id));

      // Находим целевую колонку (куда перемещаем)
      let targetColumn;
      let overIndex;

      if (overIsTask) {
        // Если задача перемещается над другой задачей
        targetColumn = state.columns.find(col => col.taskIds.includes(over.id));
        overIndex = targetColumn.taskIds.indexOf(over.id);
      } else if (overIsColumn) {
        // Если задача перемещается в пустую колонку
        targetColumn = state.columns.find(col => col.id === over.id);
        overIndex = 0; // Добавляем в начало колонки
      } else {
        return; // Неизвестный тип элемента
      }

      // Если задачи в одной колонке
      if (sourceColumn.id === targetColumn.id) {
        updateState(draft => {
          const column = draft.columns.find(col => col.id === sourceColumn.id);
          const activeIndex = column.taskIds.indexOf(active.id);
          overIndex = overIsTask ? targetColumn.taskIds.indexOf(over.id) : 0;
          column.taskIds = arrayMove(column.taskIds, activeIndex, overIndex);
        });
      } else {
        // Если задачи в разных колонках
        updateState(draft => {
          const sourceCol = draft.columns.find(col => col.id === sourceColumn.id);
          const targetCol = draft.columns.find(col => col.id === targetColumn.id);

          const activeIndex = sourceCol.taskIds.indexOf(active.id);

          // Удаляем задачу из исходной колонки
          sourceCol.taskIds.splice(activeIndex, 1);

          // Добавляем задачу в целевую колонку
          if (overIsTask) {
            const overIndex = targetCol.taskIds.indexOf(over.id);
            targetCol.taskIds.splice(overIndex, 0, active.id);
          } else {
            targetCol.taskIds.push(active.id);
          }
        });
      }
    }
  };
  // Добавление новой колонки
  const addColumn = () => {
    if (newColumnTitle.trim() === '') return;

    const newColumnId = uuidv4();
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

    const newTaskId = uuidv4();
    updateState(draft => {
      const taskId = `task-${newTaskId}`;
      draft.tasks[taskId] = { id: taskId, content };
      const column = draft.columns.find(col => col.id === columnId);
      column.taskIds.push(taskId);
    });
  };

  // Удаление задачи
  const deleteTask = (taskId, columnId) => {
    //  console.log('Deleting task:', taskId, 'from column:', columnId);

    updateState(draft => {
      // Удаляем задачу из колонки
      const column = draft.columns.find(col => col.id === columnId);
      if (column) {
        column.taskIds = column.taskIds.filter(id => id !== taskId);
      }

      // Удаляем 
      delete draft.tasks[taskId];
    
    });
  };

  // Удаление колонки
  const deleteColumn = (columnId) => {
    updateState(draft => {
      // Находим колонку для удаления
      const columnIndex = draft.columns.findIndex(col => col.id === columnId);
      if (columnIndex === -1) return;

      // Удаляем все задачи колонки
      const columnToDelete = draft.columns[columnIndex];
      columnToDelete.taskIds.forEach(taskId => {
        delete draft.tasks[taskId];
      });

      // Удаляем саму колонку
      draft.columns.splice(columnIndex, 1);
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

  // Очистка локального хранилища
  const clearStorage = async () => {
    try {
      await localForage.removeItem(STORAGE_KEY);
      setState(initialState);
      setHistory({ past: [], future: [] });
      alert('Локальное хранилище очищено!');
    } catch (error) {
      console.error('Ошибка при очистке хранилища:', error);
    }
  };

  // загрузчик
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

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