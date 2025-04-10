import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { base } from '$app/paths';

// Look into sqlite build flags to remove write functionality from binary
// cd ext/wasm; make oz barebones=1
// Or provide my own JS bindings and emscripten will strip out the unreferenced code

let db, file, strictArgs = true;

const sqlite3 = await sqlite3InitModule({
  print: console.log,
  printErr: console.error,
});
const vfsStruct = new sqlite3.capi.sqlite3_vfs();
vfsStruct.$iVersion = 3;
vfsStruct.$szOsFile = sqlite3.capi.sqlite3_file.structInfo.sizeof;
vfsStruct.$mxPathname = 1024;
vfsStruct.$zName = sqlite3.wasm.allocCString('http');

const vfsMethods = {
  xOpen: (pVfs, zName, pFile, flags, pOutFlags) => {
    console.log(`xOpen ${pVfs} ${zName} ${pFile} ${flags} ${pOutFlags}`);

    if (zName === 0) {
      console.error('Cannot open undefined URL');
      return sqlite3.capi.SQLITE_CANTOPEN;
    }

    if (file) { // xAccess calls xOpen
      console.error('File already open');
      return sqlite3.capi.SQLITE_CANTOPEN;
    }

    const url = sqlite3.wasm.cstrToJs(zName);
    let resultCode;
    try {
      const request = new XMLHttpRequest(); // can't use fetch because we need blocking API
      request.open('HEAD', url, false);
      request.onload = () => {
        if (request.status !== 200) { // HTTP OK
          console.error(`Failed to open file: ${url}`);
          resultCode = sqlite3.capi.SQLITE_CANTOPEN;
          return;
        }
        if (request.getResponseHeader('Accept-Ranges') !== 'bytes') {
          console.warn(`Server does not report byte range support: ${url}`);
        }

        const handle = {
          fid: pFile,
          url: url,
          file: new sqlite3.capi.sqlite3_file(pFile),
          size: parseInt(request.getResponseHeader('Content-Length')) || 0,
        };
        handle.file.$pMethods = ioStruct.pointer;
        file = handle;
      };
      request.send();
      resultCode = resultCode || sqlite3.capi.SQLITE_OK;
      sqlite3.wasm.poke(pOutFlags, sqlite3.capi.SQLITE_OPEN_READONLY, 'i32');
    } catch (err) {
      console.error(`Failed to open file: ${url}`);
      resultCode = sqlite3.capi.SQLITE_CANTOPEN;
    }

    return resultCode;
  }, xDelete: () => {
    console.log('xDelete');
    return sqlite3.capi.SQLITE_READONLY;
  }, xAccess: (pVfs, zName, flags, pResOut) => {
    console.log(`xAccess ${pVfs} ${zName} ${flags} ${pResOut}`);
    if (flags === sqlite3.capi.SQLITE_ACCESS_READWRITE) {
      return sqlite3.capi.SQLITE_READONLY;
    }

    const pFile = 9999;
    const resultCode = vfsMethods.xOpen(pVfs, zName, pFile, flags, pResOut);
    if (resultCode === sqlite3.capi.SQLITE_OK) {
      ioMethods.xClose(pFile);
    } else {
      sqlite3.wasm.poke(pResOut, 0, 'i32');
    }
    return resultCode;
  }, xFullPathname: (pVfs, zName, nOut, zOut) => {
    console.log('xFullPathname');
    const i = sqlite3.wasm.cstrncpy(zOut, zName, nOut);
    return i < nOut ? sqlite3.capi.SQLITE_OK : sqlite3.capi.SQLITE_CANTOPEN;
  }, xRandomness: (pVfs, nByte, zOut) => {
    console.log('xRandomness');
    const buffer = new Uint8Array(nByte);
    window.crypto.getRandomValues(buffer);

    // memcpy would be more efficient
    buffer.forEach((byte, i) => {
      sqlite3.wasm.poke(zOut + i, byte, 'i8');
    });
    return nByte;
  }, xSleep: (pVfs, microseconds) => {
    console.error('xSleep not implemented');
    return sqlite3.capi.SQLITE_ERROR;
  },
  xCurrentTime: (pVfs, pOut) => {
    console.log('xCurrentTime');
    sqlite3.wasm.poke(pOut, 2440587.5 + (new Date().getTime() / 86400000), 'f64');
    return sqlite3.capi.SQLITE_OK;
  }, xGetLastError: (pVfs, nOut, pOut) => {
    console.log('xGetLastError');
    return sqlite3.capi.SQLITE_OK;
  }, xCurrentTimeInt64: (pVfs, pOut) => {
    console.log('xCurrentTimeInt64');
    sqlite3.wasm.poke(pOut, 2440587.5 * 86400000 + (new Date()).getTime(), 'i64');
    return sqlite3.capi.SQLITE_OK;
  }
};
const ioStruct = new sqlite3.capi.sqlite3_io_methods();
const ioMethods = {
  xClose: pFile => {
    console.log('xClose');
    if (!file) {
      return sqlite3.capi.SQLITE_NOTFOUND;
    }
    file.file.dispose();
    file = null;
    return sqlite3.capi.SQLITE_OK;
  }, xRead: (pFile, zBuf, iAmt, iOfst) => {
    console.log(`xRead ${pFile} ${zBuf} ${iAmt} ${iOfst}`);
    if (!file) {
      return sqlite3.capi.SQLITE_NOTFOUND;
    }

    if (!file.pageSize) {
      file.pageSize = 1024;
      const buffer = sqlite3.wasm.alloc(2);
      strictArgs = false;
      const resultCode = ioMethods.xRead(pFile, buffer, 2, 16);

      let page = new Uint16Array(1);
      page[0] = sqlite3.wasm.peek(buffer, 'i16');
      sqlite3.wasm.exports.sqlite3_free(buffer);

      if (resultCode !== sqlite3.capi.SQLITE_OK) {
        return sqlite3.capi.SQLITE_IOERR;
      }

      // SQLite database files are big-endian, ARM and x86 are little-endian
      const platformLittleEndian = (new Uint32Array((new Uint8Array([1,2,3,4])).buffer))[0] === 0x04030201;
      const swapEndianness = array => array.map(e => ((e & 0xff00) >> 8) | ((e & 0x00ff) << 8));
      if (platformLittleEndian) {
        page = swapEndianness(page);
      }
      file.pageSize = page[0];
      console.log(`Page size: ${file.pageSize}`);
    }

    try {
      const offset = Number(iOfst);
      const pageIndex = Math.floor(offset / file.pageSize);
      const rangeStart = pageIndex * file.pageSize;

      if (strictArgs && pageIndex * file.pageSize !== offset) {
        throw new Error('xRead not page-aligned');
      }
      if (rangeStart + file.pageSize < offset + iAmt) {
        throw new Error('xRead can only read one page');
      }

      // We could preemptively fetch additional pages here
      let buffer;
      const request = new XMLHttpRequest();
      request.open('GET', file.url, false);
      request.setRequestHeader('Range', `bytes=${rangeStart}-${rangeStart + file.pageSize - 1}`); // inclusive
      request.responseType = 'arraybuffer';
      request.onload = () => {
        if ([200, 206].includes(request.status)) { // HTTP OK, Partial Content
          buffer = new Uint8Array(request.response);
        }
      };
      request.send();
      if (!buffer || buffer.length !== file.pageSize) {
        console.error(`${request.status} Failed to load page`);
        return sqlite3.capi.SQLITE_IOERR;
      }

      sqlite3.wasm.heap8u().set(buffer.subarray(offset - rangeStart, offset - rangeStart + iAmt), zBuf);
      strictArgs = true;
      return sqlite3.capi.SQLITE_OK;
    } catch (err) {
      console.error(err);
      return sqlite3.capi.SQLITE_ERROR;
    }
  }, xWrite: () => {
    console.log('xWrite');
    return sqlite3.capi.SQLITE_READONLY;
  }, xTruncate: () => {
    console.log('xTruncate');
    return sqlite3.capi.SQLITE_READONLY;
  }, xSync: () => {
    console.log('xSync');
    return sqlite3.capi.SQLITE_READONLY;
  }, xFileSize: (pFile, pOut) => {
    console.log('xFileSize');
    if (!file) {
      return sqlite3.capi.SQLITE_NOTFOUND;
    }
    sqlite3.wasm.poke(pOut, file.size, 'i64');
    return sqlite3.capi.SQLITE_OK;
  }, xLock: () => {
    console.log('xLock');
    return sqlite3.capi.SQLITE_OK;
  }, xUnlock: () => {
    console.log('xUnlock');
    return sqlite3.capi.SQLITE_OK;
  }, xCheckReservedLock: (pFile, pOut) => {
    console.log('xCheckReservedLock');
    sqlite3.wasm.poke(pOut, 0, 'i32');
    return sqlite3.capi.SQLITE_OK;
  }, xFileControl: () => {
    console.log('xFileControl');
    return sqlite3.capi.SQLITE_NOTFOUND;
  }, xSectorSize: () => {
    console.log('xSectorSize');
    return sqlite3.capi.SQLITE_OK;
  }, xDeviceCharacteristics: () => {
    console.log('xDeviceCharacteristics');
    return sqlite3.capi.SQLITE_IOCAP_IMMUTABLE;
  }, xShmMap: () => {
    console.log('xShmMap');
    return sqlite3.capi.SQLITE_READONLY;
  }, xShmLock: () => {
    console.log('xShmLock');
    return sqlite3.capi.SQLITE_READONLY;
  }, xShmBarrier: () => {
    console.log('xShmBarrier');
    return sqlite3.capi.SQLITE_READONLY;
  }, xShmUnmap: () => {
    console.log('xShmUnmap');
    return sqlite3.capi.SQLITE_READONLY;
  }
};
sqlite3.vfs.installVfs({
  io: { struct: ioStruct, methods: ioMethods },
  vfs: { struct: vfsStruct, methods: vfsMethods },
});
db = new sqlite3.oo1.DB(`${base}/aqi.sqlite`, 'rt', 'http');
postMessage('ready');

self.onmessage = e => postMessage(
  db.exec({
    sql: e.data,
    returnValue: 'resultRows',
  })
);
