const todoText = document.getElementById('todoText');
const submitBtn = document.getElementById('submitBtn');
const todoItems = document.getElementById('todoItems');
const todoFilter = document.getElementById('todoFilter');
const sortBtn = document.getElementById('sortBtn');
const searchBox = document.getElementById('searchBox');
const modeSwitch = document.getElementById('modeSwitch');
const deadlineInput = document.getElementById('deadlineInput');
const urgencyDropdown = document.getElementById('urgencyDropdown');
const groupDropdown = document.getElementById('groupDropdown');

let todoList = JSON.parse(localStorage.getItem('todoList')) || [];
let sortByDate = false;
let darkTheme = localStorage.getItem('darkTheme') === 'true';

window.onload = function() {
  if (darkTheme) document.body.classList.add('night-theme');
  displayTodos();
};

submitBtn.addEventListener('click', function() {
  const text = todoText.value.trim();
  if (text) {
    const todo = {
      id: Date.now(),
      text,
      completed: false,
      deadline: deadlineInput.value || null,
      urgency: urgencyDropdown.value || 'medium',
      group: groupDropdown.value || 'general',
      createdAt: Date.now()
    };
    
    todoList.push(todo);
    saveTodos();
    displayTodos();
    
    todoText.value = '';
    deadlineInput.value = '';
    
    setTimeout(function() {
      const newTodo = document.querySelector(`li[data-id="${todo.id}"]`);
      if (newTodo) {
        newTodo.classList.add('highlight-effect');
        setTimeout(function() {
          newTodo.classList.remove('highlight-effect');
        }, 1000);
      }
    }, 10);
  }
});

function createTodoElement(todo) {
  const li = document.createElement('li');
  li.dataset.id = todo.id;
  li.className = `${todo.urgency}`;
  li.draggable = true;
  
  let statusIcon;
  if (todo.completed) {
    statusIcon = '✅';
  } else {
    statusIcon = '🕒';
  }
  
  const deadlineDisplay = todo.deadline ? new Date(todo.deadline).toLocaleDateString() : 'No date set';
  
  let isLate = false;
  if (todo.deadline && !todo.completed) {
    const deadline = new Date(todo.deadline);
    const today = new Date();
    isLate = deadline < today;
  }
  
  li.innerHTML = `
    <div class="item-content">
      <span class="todo-text">${todo.text}</span>
      <div class="item-details">
        <span class="item-group">${todo.group}</span>
        <span class="item-deadline ${isLate ? 'late' : ''}">${deadlineDisplay}</span>
      </div>
    </div>
    <div class="item-buttons">
      <span class="status-icon">${statusIcon}</span>
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    </div>
  `;
  
  if (todo.completed) {
    li.classList.add('done');
  }
  
  if (isLate) {
    li.classList.add('late');
  }
  
  li.querySelector('.status-icon').addEventListener('click', function() {
    todo.completed = !todo.completed;
    saveTodos();
    displayTodos();
  });
  
  li.querySelector('.edit-btn').addEventListener('click', function(e) {
    e.stopPropagation();
    const newText = prompt('Edit todo:', todo.text);
    if (newText !== null && newText.trim() !== '') {
      todo.text = newText.trim();
      saveTodos();
      displayTodos();
    }
  });
  
  li.querySelector('.delete-btn').addEventListener('click', function(e) {
    e.stopPropagation();
    
    if (confirm('Delete this todo?')) {
      const element = e.target.closest('li');
      element.classList.add('fade-out');
      
      setTimeout(function() {
        todoList = todoList.filter(function(t) {
          return t.id !== todo.id;
        });
        saveTodos();
        displayTodos();
      }, 300);
    }
  });
  
  li.addEventListener('dragstart', handleDragStart);
  li.addEventListener('dragover', handleDragOver);
  li.addEventListener('drop', handleDrop);
  li.addEventListener('dragend', handleDragEnd);
  
  return li;
}

let dragItem = null;

function handleDragStart(e) {
  dragItem = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  
  e.dataTransfer.dropEffect = 'move';
  
  const rect = this.getBoundingClientRect();
  const midpoint = rect.y + (rect.height / 2);
  
  if (e.clientY - midpoint > 0) {
    this.classList.add('drop-after');
    this.classList.remove('drop-before');
  } else {
    this.classList.add('drop-before');
    this.classList.remove('drop-after');
  }
  
  return false;
}

function handleDrop(e) {
  e.stopPropagation();
  e.preventDefault();
  
  if (dragItem !== this) {
    const allItems = Array.from(todoItems.querySelectorAll('li'));
    const draggedIndex = allItems.indexOf(dragItem);
    const targetIndex = allItems.indexOf(this);
    
    const draggedItemId = parseInt(dragItem.dataset.id);
    const targetItemId = parseInt(this.dataset.id);
    
    const draggedTodo = todoList.find(function(t) { 
      return t.id === draggedItemId; 
    });
    
    todoList = todoList.filter(function(t) {
      return t.id !== draggedItemId;
    });
    
    const targetTodoIndex = todoList.findIndex(function(t) { 
      return t.id === targetItemId;
    });
    
    todoList.splice(
      targetIndex > draggedIndex ? targetTodoIndex + 1 : targetTodoIndex, 
      0, 
      draggedTodo
    );
    
    saveTodos();
    displayTodos();
  }
  
  return false;
}

function handleDragEnd() {
  const list = document.querySelectorAll('li');
  for (let i = 0; i < list.length; i++) {
    list[i].classList.remove('dragging');
    list[i].classList.remove('drop-after');
    list[i].classList.remove('drop-before');
  }
}

function displayTodos() {
  todoItems.innerHTML = '';
  
  let filtered = [...todoList];
  
  if (searchBox && searchBox.value) {
    const searchTerm = searchBox.value.toLowerCase();
    
    filtered = filtered.filter(function(todo) {
      return todo.text.toLowerCase().includes(searchTerm) || 
             todo.group.toLowerCase().includes(searchTerm);
    });
  }
  
  if (todoFilter.value === 'completed') {
    filtered = filtered.filter(function(todo) {
      return todo.completed === true;
    });
  } else if (todoFilter.value === 'pending') {
    filtered = filtered.filter(function(todo) {
      return todo.completed === false;
    });
  } else if (todoFilter.value === 'overdue') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    filtered = filtered.filter(function(todo) {
      return todo.deadline && new Date(todo.deadline) < today && !todo.completed;
    });
  } else if (todoFilter.value === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    filtered = filtered.filter(function(todo) {
      if (!todo.deadline) return false;
      const todoDate = new Date(todo.deadline);
      return todoDate >= today && todoDate < tomorrow;
    });
  } else if (todoFilter.value.startsWith('group-')) {
    const group = todoFilter.value.replace('group-', '');
    filtered = filtered.filter(function(todo) {
      return todo.group === group;
    });
  }
  
  if (sortByDate) {
    filtered.sort(function(a, b) {
      return b.createdAt - a.createdAt;
    });
  } else {
    filtered.sort(function(a, b) {
      const urgencyRank = { 
        high: 1, 
        medium: 2, 
        low: 3 
      };
      return urgencyRank[a.urgency] - urgencyRank[b.urgency];
    });
  }
  
  if (filtered.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'No todos to show';
    todoItems.appendChild(emptyMessage);
  } else {
    for (let i = 0; i < filtered.length; i++) {
      const li = createTodoElement(filtered[i]);
      todoItems.appendChild(li);
    }
  }
  
  updateGroupFilters();  
  updateStats();
}

function updateGroupFilters() {
  if (!groupDropdown) return;
  
  const groups = [];
  const groupMap = {};
  
  for (let i = 0; i < todoList.length; i++) {
    const group = todoList[i].group;
    if (!groupMap[group]) {
      groupMap[group] = true;
      groups.push(group);
    }
  }
  
  const groupOptions = todoFilter.querySelectorAll('option[data-group]');
  for (let i = 0; i < groupOptions.length; i++) {
    groupOptions[i].remove();
  }
  
  for (let i = 0; i < groups.length; i++) {
    const option = document.createElement('option');
    option.value = `group-${groups[i]}`;
    option.textContent = `Group: ${groups[i]}`;
    option.dataset.group = true;
    todoFilter.appendChild(option);
  }
}

function updateStats() {
  const stats = document.getElementById('statsArea');
  if (!stats) return;
  
  const total = todoList.length;
  const completed = todoList.filter(function(t) { return t.completed; }).length;
  const pending = total - completed;
  
  stats.innerHTML = `
    <span>Total: ${total}</span>
    <span>Done: ${completed}</span>
    <span>Pending: ${pending}</span>
  `;
}

todoFilter.addEventListener('change', displayTodos);

sortBtn.addEventListener('click', function() {
  sortByDate = !sortByDate;
  sortBtn.textContent = sortByDate ? 'Sort by Urgency' : 'Sort Newest';
  displayTodos();
});

if (searchBox) {
  let searchTimer;
  searchBox.addEventListener('input', function() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function() {
      displayTodos();
    }, 200);
  });
}

if (modeSwitch) {
  modeSwitch.addEventListener('click', function() {
    darkTheme = !darkTheme;
    document.body.classList.toggle('night-theme', darkTheme);
    localStorage.setItem('darkTheme', darkTheme);
  });
}

const cleanupBtn = document.getElementById('cleanupBtn');
if (cleanupBtn) {
  cleanupBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to delete all completed todos?')) {
      todoList = todoList.filter(function(todo) {
        return !todo.completed;
      });
      saveTodos();
      displayTodos();
    }
  });
}

function saveTodos() {
  localStorage.setItem('todoList', JSON.stringify(todoList));
}

const saveBtn = document.getElementById('saveBtn');
if (saveBtn) {
  saveBtn.addEventListener('click', function() {
    const dataStr = JSON.stringify(todoList, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportName = 'todos-' + new Date().toISOString().slice(0, 10) + '.json';
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', exportName);
    link.click();
  });
}

const loadBtn = document.getElementById('loadBtn');
if (loadBtn) {
  loadBtn.addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importedTodos = JSON.parse(e.target.result);
          if (Array.isArray(importedTodos)) {
            if (confirm(`Import ${importedTodos.length} todos? This will replace your current todos.`)) {
              todoList = importedTodos;
              saveTodos();
              displayTodos();
            }
          } else {
            alert('Invalid file format. Please select a valid todos.json file.');
          }
        } catch (error) {
          alert('Failed to parse the file. Please select a valid JSON file.');
          console.error(error);
        }
      };
      reader.readAsText(file);
    });
    
    input.click();
  });
}