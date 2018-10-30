import Document from './cookie.mjs';
import {
    LocalStorage,
    SessionStorage,
} from './webstorage.mjs';

// avoid conflicts with globals
const doc = new Document();
const locStorage = new LocalStorage();
const sesStorage = new SessionStorage();

export {
    doc,
    locStorage,
    sesStorage,
};
