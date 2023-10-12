const template = document.getElementById("li_template");
const button = document.getElementById("save");
const input = document.getElementById("input");
const deleteAll = document.getElementById("deleteAll");
const elements = new Set();

const storageKey = "tabsWithTasks";

//class with with properties, taskName and tabs
class Task {
  constructor(taskName, tabs) {
    this.taskName = taskName;
    this.tabs = tabs;
  }
}
let localTasks = [];

button.addEventListener("click", async () => {
  //Save all tabs to local storage
  await saveTabs();
});

async function saveTabs() {
  const tabs = await getTabs();

  //Create new task object
  if (input.value !== "") {
    const task = new Task(input.value, tabs);
    localTasks.push(task);
    chrome.storage.local.set({ tasks: localTasks }, () => {
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
  chrome.storage.local.get([storageKey], (result) => {
    console.log("Tasks loaded");
    console.log(localTasks.length);

    //if result.tasks is not a list make it a blank list
    if (!result.tasks) {
      result.tasks = [];
    }

    localTasks = result.tasks;
    elements.clear();

    for (let i = 0; i < localTasks.length; i++) {
      let task = localTasks[i];
      const element = template.content.firstElementChild.cloneNode(true);
      element.querySelector(".title").textContent = task.taskName;
      element.querySelector(".pathname").textContent = task.tabs.length;
      element.querySelector("a").addEventListener("click", async () => {
        openLinks(task.tabs);
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
  chrome.storage.local.get([storageKey], (result) => {
    result.tasks.splice(index, 1);
    chrome.storage.local.set({ tasks: result.tasks }, () => {
      console.log("Task deleted");
      loadTasks();
    });
  });
}

//Update task at index and update local storage then reload tasks
function updateTask(index) {
  chrome.storage.local.get([storageKey], async (result) => {
    result.tasks[index].tabs = await getTabs();
    chrome.storage.local.set({ tasks: result.tasks }, () => {
      console.log("Task updated");
      loadTasks();
    });
  });
}

function openLinks(tabsToOpen) {
  //Open all tabs from tabsToOpen in current window and close the other tabs in the window
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    const tabsToClose = tabs.filter((tab) => !tabsToOpen.includes(tab));
    for (let tab of tabsToOpen) {
      chrome.tabs.create({ url: tab.url });
    }
    chrome.tabs.remove(tabsToClose.map((tab) => tab.id));
  });

  //Focus on the first tab
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    chrome.tabs.update(tabs[0].id, { active: true });
  });

  // //Open all tabs from tabsToOpen in a new window
  // chrome.windows.create({ url: tabsToOpen.map((tab) => tab.url) });

  // //Close previous window
  // chrome.windows.getCurrent((window) => {
  //   chrome.windows.remove(window.id);
  // });
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
