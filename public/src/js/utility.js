/* Tworzenie bazy danych na potrzebe cacheowania JSON */
var dbPromise = idb.open('feed-store', 1, function (db) {
    if (!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', {keyPath: 'id'})
    }
});

function writeData(st, data) {
    return dbPromise
        .then(function (db) {
            /* Zmienna dla transakcji */
            var tx = db.transaction(st, 'readwrite');
            var store = tx.objectStore(st);
            store.put(data);
            return tx.complete;
        });
}

function readAllData(st) {
    return dbPromise
        .then(function (db) {
            var tx = db.transaction(st, 'readonly');
            var store = tx.objectStore(st);
            return store.getAll();
        })
}