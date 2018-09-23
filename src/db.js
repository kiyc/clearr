import Dexie from 'dexie';

const db = new Dexie('clearr');

db.version(1).stores({
    groups: '++id, name, sort, deleted',
    tasks: '++id, groups_id, text, sort, deleted',
});

export default db;
