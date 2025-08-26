/**
 *  @initialState
 */
export const initialState = {
  columns: [
    {
      id: 'column-1',
      title: 'To Do',
      taskIds: ['task-1', 'task-2', 'task-3']
    },
    {
      id: 'column-2',
      title: 'In Progress',
      taskIds: ['task-4']
    },
    {
      id: 'column-3',
      title: 'Done',
      taskIds: ['task-5']
    }
  ],
  tasks: {
    'task-1': { id: 'task-1', content: 'Изучить #1' },
    'task-2': { id: 'task-2', content: 'Написать #2' },
    'task-3': { id: 'task-3', content: 'Изучить #3' },
    'task-4': { id: 'task-4', content: 'Изучить #4' },
    'task-5': { id: 'task-5', content: 'Изучить №5' }
  }
};

// Ключ для сохранения в localForage
export const STORAGE_KEY = 'trello-app-state';