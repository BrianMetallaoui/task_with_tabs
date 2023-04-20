const template = document.getElementById("li_template");
const button = document.getElementById("save");
const input = document.getElementById("input");
const deleteAll = document.getElementById("deleteAll");
const elements = new Set();

//class with with properties, taskName and tabs
class Task {
  constructor(taskName, tabs) {
    this.taskName = taskName;
    this.tabs = tabs;
  }
}
let tasks = [];

button.addEventListener("click", async () => {
  //Save all tabs to local storage
  await saveTabs();
});

async function saveTabs() {
  const tabs = await getTabs();

  //Create new task object
  if (input.value !== "") {
    const task = new Task(input.value, tabs);
    tasks.push(task);
    chrome.storage.local.set({ tasks: tasks }, () => {
      console.log("Task saved");
      loadTasks();

      //Clear input
      input.value = "";
    });
  }
}

async function getTabs() {
  const queryOptions = { currentWindow: true };
  const tabs = await chrome.tabs.query(queryOptions);
  return tabs;
}

function loadTasks() {
  //Replace document.querySelector("ul") with new elements
  const ul = document.getElementById("ul");
  ul.innerHTML = "";
  chrome.storage.local.get(["tasks"], (result) => {
    console.log("Tasks loaded");
    console.log(tasks.length);
    tasks = result.tasks;
    elements.clear();

    for (let i = 0; i < tasks.length; i++) {
      let task = tasks[i];
      const element = template.content.firstElementChild.cloneNode(true);
      element.querySelector(".title").textContent = task.taskName;
      element.querySelector(".pathname").textContent = task.tabs.length;
      element.querySelector("a").addEventListener("click", async () => {
        //Open all tabs
        for (let i = 0; i < task.tabs.length; i++) {
          chrome.tabs.create({ url: task.tabs[i].url });
        }
      });
      element.querySelector(".update").addEventListener("click", async () => {
        updateTask(i);
      });
      element.querySelector(".delete").addEventListener("click", async () => {
        deleteTask(i);
      });
      elements.add(element);
    }

    console.log(ul.innerHTML);
    for (let element of elements) {
      ul.appendChild(element);
    }
  });
}

deleteAll.addEventListener("click", async () => {
  deleteAllTasks();
});

//Delete task at index and update local storage then reload tasks
function deleteTask(index) {
  chrome.storage.local.get(["tasks"], (result) => {
    result.tasks.splice(index, 1);
    chrome.storage.local.set({ tasks: result.tasks }, () => {
      console.log("Task deleted");
      loadTasks();
    });
  });
}

//Update task at index and update local storage then reload tasks
function updateTask(index) {
  chrome.storage.local.get(["tasks"], async (result) => {
    result.tasks[index].tabs = await getTabs();
    chrome.storage.local.set({ tasks: result.tasks }, () => {
      console.log("Task updated");
      loadTasks();
    });
  });
}

//delete all tasks and reload tasks
function deleteAllTasks() {
  chrome.storage.local.set({ tasks: [] }, () => {
    console.log("All tasks deleted");
    loadTasks();
  });
}

//Run loadTasks() when popup is opened
loadTasks();