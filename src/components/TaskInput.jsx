import { useState } from "react";

// Компонент для ввода новой задачи
const TaskInput = ({ columnId, onAddTask }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddTask(columnId, content);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Добавить задачу..."
        className="w-full px-3 py-2 border rounded"
      />
      <button
        type="submit"
        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Добавить
      </button>
    </form>
  );
};

export default TaskInput;