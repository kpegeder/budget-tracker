let db;

// Create a new db request for a "budget" database
const request = indexedDB.open("budget", 1);

// Creating or updating the version of the database
request.onupgradeneeded = function (event) {
  // Create object store called "pending" and set autoIncrement to true
  console.log(event);
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

// If the onupgradeneeded event exits successfully, the database will open
request.onsuccess = function (event) {
  console.log(event);

  // Check if the app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

// If error connecting to the database, display error
request.onerror = function (event) {
  console.log("Whoops! " + event.target.errorCode);
};

// Save a record for offline use
function saveRecord(record) {
  // Create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");

  // Access your pending object store
  const store = transaction.objectStore("pending");

  // Add record to your store with add method
  store.add(record);
}

// Check to see if transactions happened while offline
function checkDatabase() {
  // Open a transaction on your pending db
  const transaction = db.transaction(["pending"], "readwrite");

  // Access pending object store
  const store = transaction.objectStore("pending");

  // Get all records from store and set to a variable
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    console.log(getAll);
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Contect-type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          // If successful, open a transaction on your pending db
          const transaction = db.transaction(["pending"], "readwrite");

          // Access pending object store
          const store = transaction.objectStore("pending");

          // Clear all items in the store
          store.clear();
        });
    }
  };
}

// Listen for app coming back online
window.addEventListener("online", checkDatabase);
