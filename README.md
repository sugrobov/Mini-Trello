Mini-Trello Application 
[![Live Demo](https://img.shields.io/badge/demo-live-green?style=for-the-badge)](https://m-trello.netlify.app/)
A React-based task management application with Trello-like functionality, featuring drag-and-drop capabilities, undo/redo actions, and persistent state storage.

🚀 Features
- Multi-column boards with create, delete, and reorder functionality
- Drag & Drop for tasks and columns using @dnd-kit
- Undo/Redo system for action history management
- Persistent state across page reloads using localForage
- JSON export for data backup and sharing
- Responsive design with Tailwind CSS styling

🛠 Technologies Used
- React 18+ - UI framework
- @dnd-kit - Drag and drop functionality
- use-immer - Immutable state management
- localForage - Client-side storage
- Tailwind CSS - Styling and responsive design

📦 Installation and Setup
Clone the repository:

bash
git clone <your-repository-url>
cd mini-trello

Install dependencies:

bash
npm install

Start the development server:

bash
npm run dev

Open http://localhost:5173 in your browser.

🎮 How to Use
Column Management
Add a column: Enter a title in the input field and click "Add Column"
Delete a column: Click the "×" button in the column header
Reorder columns: Drag a column by its header to a new position

Task Management
Add a task: Enter text in the input field below a column and click "Add"
Delete a task: Click the "×" button on a task card
Move tasks: Drag tasks between columns or within the same column

Additional Features
Undo/Redo: Use the "Undo" and "Redo" buttons to manage action history
Export data: Click "Export JSON" to save your board state to a file

Clear data: Click "Clear" to remove all data from local storage

