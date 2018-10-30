import _camelCase from 'lodash/camelCase';
import _chunk from 'lodash/chunk';
import _map from 'lodash/map';


const sym = Symbol('bucket');

const delayedCookieDelete = (
    bucket,
    k,
    _cookieTimerIds,
) => {
    bucket.delete(k);
    delete _cookieTimerIds[k];
};

class Document {
    constructor(opts = {}) {
        this.opts = {
            setTimers: false,
        };

        Object.assign(this.opts, opts);

        Object.defineProperties(this, {
            _cookieTimerIds: {
                enumerable: false,
                value: {},
            },
            cookie: {
                ...Object.getOwnPropertyDescriptors(Document.prototype).cookie,
                enumerable: true,
            },
            opts: {
                enumerable: false,
            },
            [sym]: {
                enumerable: false,
                value: new Map(),
            },
        });
    }

    get cookie() {
        const items = [
            ...this[sym],
        ];

        return _map(items, (item) => item.join('='))
            .join('; ');
    }

    set cookie(input) {
        if (!input) {
            return void 0;
        }

        const {
            _cookieTimerIds,
            opts: { setTimers },
            [sym]: bucket,
        } = this;

        if (input === '__VOID_BUCKET__') { // for spec
            return bucket.clear();
        }

        const pieces = input.split(/[=;]/);
        const key = pieces.shift().trim();
        const val = pieces.shift().trim();

        if (!key) {
            return void 0;
        }

        const {
            expires,
            maxAge,
        } = _chunk(pieces, 2)
            .reduce((metadata, [ k, v ]) => {
                metadata[_camelCase(k.trim())] = v;

                return metadata;
            }, {});

        if (expires) {
            const expiry = (new Date(expires)).getTime();
            const now = (new Date()).getTime();

            if (expiry < now) {
                clearTimeout(_cookieTimerIds[key]);

                return bucket.delete(key);
            }

            if (setTimers) {
                _cookieTimerIds[key] = setTimeout(
                    delayedCookieDelete,
                    expiry,
                    bucket,
                    key,
                    _cookieTimerIds,
                );
                // fall through to the set() below
            }
        }
        else if (
            maxAge !== undefined
        ) {
            const maxAgeInt = parseInt(maxAge, 10);

            if (maxAgeInt === 0) {
                clearTimeout(_cookieTimerIds[key]);

                return bucket.delete(key);
            }
            if (setTimers) {
                _cookieTimerIds[key] = setTimeout(
                    delayedCookieDelete,
                    maxAgeInt,
                    bucket,
                    key,
                    _cookieTimerIds,
                );
                // fall through to the set() below
            }
        }

        bucket.set(key, val);
    }

    get cookieTimerIds() {
        return this._cookieTimerIds;
    }
}

export default Document;
