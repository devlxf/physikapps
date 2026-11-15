// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      AD: x0 => x0.screen,
      AE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      AF: x0 => x0.wheelDeltaX,
      AG: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      AH: x0 => x0.value,
      AI: () => Date.now(),
      AJ: x0 => x0.frameCount,
      AK: (o, p) => p in o,
      AL: (x0,x1,x2) => x0.setItem(x1,x2),
      B: s => printToConsole(s),
      BB: x0 => new Uint16Array(x0),
      BC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      BD: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      BE: x0 => new ResizeObserver(x0),
      BF: x0 => x0.key,
      BG: x0 => x0.v8BreakIterator,
      BH: x0 => x0.selectionDirection,
      BI: (map, o) => map.get(o),
      BJ: x0 => x0.selectedTrack,
      BK: x0 => x0.groups,
      BL: x0 => x0.baseURI,
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      CC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      CD: x0 => x0.tabIndex,
      CE: (x0,x1) => x0.getPropertyValue(x1),
      CF: x0 => x0.identifier,
      CG: () => globalThis.Intl,
      CH: x0 => x0.selectionStart,
      CI: x0 => new WeakRef(x0),
      CJ: x0 => x0.completed,
      CK: (d, f) => d.toExponential(f),
      CL: x0 => x0.document,
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: x0 => new Int32Array(x0),
      DC: (x0,x1) => x0.querySelector(x1),
      DD: (x0,x1) => x0.contains(x1),
      DE: x0 => globalThis.parseFloat(x0),
      DF: x0 => x0.touches,
      DG: (x0,x1) => x0.segment(x1),
      DH: x0 => x0.selectionEnd,
      DI: x0 => x0.deref(),
      DJ: x0 => x0.ready,
      DK: x0 => ({cache: x0}),
      DL: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      EC: (x0,x1) => x0.item(x1),
      ED: x0 => x0.activeElement,
      EE: (x0,x1) => x0.getComputedStyle(x1),
      EF: x0 => x0.pressure,
      EG: x0 => x0.index,
      EH: x0 => x0.keyCode,
      EI: () => globalThis.WeakRef,
      EJ: x0 => x0.tracks,
      EK: (x0,x1,x2) => x0.fetch(x1,x2),
      EL: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      F: () => new Error().stack,
      FB: x0 => new Uint32Array(x0),
      FC: x0 => x0.length,
      FD: x0 => x0.parentNode,
      FE: x0 => x0.documentElement,
      FF: x0 => x0.tiltY,
      FG: x0 => x0.next(),
      FH: (x0,x1) => x0.scrollIntoView(x1),
      FI: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      FJ: x0 => x0.close(),
      FK: x0 => x0.keys(),
      FL: x0 => x0.abort(),
      G: s => JSON.stringify(s),
      GB: x0 => new Float32Array(x0),
      GC: (x0,x1) => x0.querySelectorAll(x1),
      GD: x0 => x0.tagName,
      GE: x0 => x0.computedStyleMap(),
      GF: x0 => x0.tiltX,
      GG: x0 => x0.value,
      GH: x0 => x0.multiViewEnabled,
      GI: (a, s, e) => a.slice(s, e),
      GJ: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      GK: (x0,x1) => x0.delete(x1),
      GL: () => new AbortController(),
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      HC: (x0,x1) => x0.getAttribute(x1),
      HD: x0 => x0.target,
      HE: (x0,x1) => x0.get(x1),
      HF: x0 => x0.pointerType,
      HG: x0 => x0.done,
      HH: (x0,x1) => x0.replaceWith(x1),
      HI: (a, l) => a.length = l,
      HJ: (x0,x1) => x0.decode(x1),
      HK: x0 => x0.getRegistrations(),
      HL: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: x0 => new Float64Array(x0),
      IC: x0 => x0.remove(),
      ID: x0 => x0.clientY,
      IE: (o, p) => p in o,
      IF: x0 => x0.pointerId,
      IG: (o, m, a) => o[m].apply(o, a),
      IH: (x0,x1) => { x0.type = x1 },
      II: (x0,x1,x2,x3) => x0.sendCommand(x1,x2,x3),
      IJ: x0 => x0.displayHeight,
      IK: x0 => x0.unregister(),
      IL: (x0,x1) => globalThis.fetch(x0,x1),
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      JC: (x0,x1) => x0.appendChild(x1),
      JD: x0 => x0.clientX,
      JE: (x0,x1) => { x0.textContent = x1 },
      JF: x0 => x0.getCoalescedEvents(),
      JG: x0 => x0.iterator,
      JH: (x0,x1) => { x0.className = x1 },
      JI: () => globalThis.PdfiumWasmCommunicator,
      JJ: x0 => x0.displayWidth,
      JK: x0 => x0.reload(),
      JL: (x0,x1) => x0.get(x1),
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: x0 => new ArrayBuffer(x0),
      KC: (x0,x1) => x0.append(x1),
      KD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      KE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      KF: (x0,x1) => x0.getModifierState(x1),
      KG: () => globalThis.Symbol,
      KH: (x0,x1) => { x0.tabIndex = x1 },
      KI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      KJ: x0 => x0.duration,
      KK: x0 => x0.serviceWorker,
      KL: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      L: o => o === undefined,
      LB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      LC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      LD: x0 => x0.getBoundingClientRect(),
      LE: x0 => x0.matches,
      LF: s => s.trimLeft(),
      LG: (x0,x1) => new Intl.Segmenter(x0,x1),
      LH: (x0,x1) => { x0.name = x1 },
      LI: (x0,x1,x2) => x0.addEventListener(x1,x2),
      LJ: x0 => x0.image,
      LK: x0 => x0.caches,
      LL: (x0,x1) => x0.forEach(x1),
      M: o => String(o),
      MB: (x0,x1,x2) => new DataView(x0,x1,x2),
      MC: x0 => x0.style,
      MD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      ME: (x0,x1) => x0.matchMedia(x1),
      MF: (x0,x1) => x0[x1],
      MG: x0 => x0.Segmenter,
      MH: (x0,x1) => { x0.placeholder = x1 },
      MI: x0 => x0.preventDefault(),
      MJ: () => globalThis.window.ImageDecoder,
      MK: x0 => x0.ok,
      ML: x0 => x0.name,
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o, p) => o[p],
      NC: x0 => x0.debugShowSemanticsNodes,
      ND: s => new Date(s * 1000).getTimezoneOffset() * 60,
      NE: x0 => x0.matches,
      NF: x0 => x0.index,
      NG: x0 => x0.buffer,
      NH: (x0,x1) => { x0.autocomplete = x1 },
      NI: () => globalThis.document,
      NJ: x0 => x0.close(),
      NK: (x0,x1,x2) => x0.insertBefore(x1,x2),
      NL: x0 => x0.statusText,
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      OC: o => o,
      OD: Date.now,
      OE: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      OF: s => s.toUpperCase(),
      OG: x0 => x0.wasmMemory,
      OH: (x0,x1) => { x0.name = x1 },
      OI: (x0,x1) => x0.createElement(x1),
      OJ: x0 => x0.height,
      OK: x0 => x0.id,
      OL: x0 => x0.url,
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      PC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      PD: (handle) => clearTimeout(handle),
      PE: f => f.dartFunction,
      PF: x0 => x0.pop(),
      PG: () => globalThis.window._flutter_skwasmInstance,
      PH: (x0,x1) => { x0.placeholder = x1 },
      PI: (x0,x1) => x0.querySelector(x1),
      PJ: x0 => x0.width,
      PK: x0 => x0.offsetHeight,
      PL: x0 => x0.status,
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.byteOffset,
      QC: (x0,x1) => x0.warn(x1),
      QD: (a, l) => a.length = l,
      QE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      QF: x0 => x0.flags,
      QG: () => new TextDecoder(),
      QH: (x0,x1) => { x0.action = x1 },
      QI: (x0,x1) => x0.appendChild(x1),
      QJ: o => o.byteLength,
      QK: x0 => x0.offsetWidth,
      QL: x0 => x0.getReader(),
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: o => o.buffer,
      RC: x0 => x0.console,
      RD: (x0,x1) => x0.closest(x1),
      RE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      RF: (a, s) => a.join(s),
      RG: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      RH: (x0,x1) => { x0.method = x1 },
      RI: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      RJ: (x0,x1,x2) => x0.sendCommand(x1,x2),
      RK: x0 => x0.stopPropagation(),
      RL: x0 => x0.read(),
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: Function.prototype.call.bind(DataView.prototype.getUint8),
      SC: () => globalThis.window,
      SD: x0 => x0.bottom,
      SE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      SF: (x0,x1) => x0.error(x1),
      SG: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      SH: (x0,x1) => { x0.noValidate = x1 },
      SI: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      SJ: (o, p) => delete o[p],
      SK: x0 => x0.disabled,
      SL: x0 => x0.value,
      T: x0 => new Promise(x0),
      TB: (b, o) => new DataView(b, o),
      TC: (o, c) => o instanceof c,
      TD: x0 => x0.top,
      TE: (o, i) => o[i],
      TF: () => globalThis.console,
      TG: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      TH: (x0,x1) => x0.removeAttribute(x1),
      TI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      TJ: (x0,x1) => x0.createElement(x1),
      TK: (x0,x1) => { x0.min = x1 },
      TL: x0 => x0.done,
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: (b, o, l) => new DataView(b, o, l),
      UC: (x0,x1) => x0.exec(x1),
      UD: x0 => x0.right,
      UE: o => o.length,
      UF: s => s.trimRight(),
      UG: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      UH: x0 => x0.isConnected,
      UI: (x0,x1) => { x0.src = x1 },
      UJ: (x0,x1) => x0.append(x1),
      UK: (x0,x1) => { x0.max = x1 },
      UL: x0 => x0.cancel(),
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      VC: x0 => x0.length,
      VD: x0 => x0.left,
      VE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      VF: x0 => x0.blur(),
      VG: x0 => x0.history,
      VH: x0 => x0.click(),
      VI: (x0,x1) => { x0.async = x1 },
      VJ: (x0,x1,x2) => x0.insertRule(x1,x2),
      VK: (x0,x1) => { x0.disabled = x1 },
      VL: x0 => x0.body,
      W: x0 => new Array(x0),
      WB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      WC: (x0,x1) => { x0.lastIndex = x1 },
      WD: x0 => x0.clientY,
      WE: x0 => x0.language,
      WF: x0 => x0.button,
      WG: x0 => x0.search,
      WH: (x0,x1) => x0.getElementsByClassName(x1),
      WI: (x0,x1) => { x0.charset = x1 },
      WJ: (x0,x1) => x0.add(x1),
      WK: (x0,x1) => { x0.scrollLeft = x1 },
      WL: x0 => x0.headers,
      X: o => [o],
      XB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      XC: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      XD: x0 => x0.clientX,
      XE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      XF: x0 => x0.innerHeight,
      XG: x0 => x0.location,
      XH: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      XI: (x0,x1) => { x0.type = x1 },
      XJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      XK: (x0,x1) => { x0.spellcheck = x1 },
      XL: x0 => x0.signal,
      Y: (o0, o1) => [o0, o1],
      YB: (t, s) => t.set(s),
      YC: o => o instanceof RegExp,
      YD: x0 => x0.changedTouches,
      YE: () => globalThis.window.FinalizationRegistry,
      YF: x0 => x0.innerWidth,
      YG: x0 => x0.pathname,
      YH: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      YI: x0 => x0.href,
      YJ: (x0,x1,x2) => x0.addEventListener(x1,x2),
      YK: (x0,x1) => { x0.disabled = x1 },
      YL: x0 => x0.length,
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      ZC: (string, times) => string.repeat(times),
      ZD: x0 => x0.offsetY,
      ZE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      ZF: x0 => x0.height,
      ZG: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      ZH: (x0,x1) => x0.dispatchEvent(x1),
      ZI: x0 => x0.location,
      ZJ: x0 => x0.preventDefault(),
      ZK: (x0,x1) => x0.transferFromImageBitmap(x1),
      ZL: x0 => x0.getReader(),
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      aC: x0 => x0.dotAll,
      aD: x0 => x0.offsetX,
      aE: x0 => new window.FinalizationRegistry(x0),
      aF: x0 => x0.width,
      aG: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      aH: (x0,x1) => x0.createEvent(x1),
      aI: () => globalThis.window,
      aJ: x0 => x0.createRange(),
      aK: (x0,x1) => x0.getContext(x1),
      aL: x0 => x0.value,
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      bC: x0 => x0.unicode,
      bD: x0 => x0.type,
      bE: (x0,x1) => x0.unregister(x1),
      bF: x0 => x0.clientHeight,
      bG: o => Object.keys(o),
      bH: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      bI: x0 => x0.baseURI,
      bJ: (x0,x1) => x0.selectNode(x1),
      bK: (x0,x1) => { x0.height = x1 },
      bL: x0 => x0.done,
      c: o => o,
      cB: Function.prototype.call.bind(DataView.prototype.getUint32),
      cC: x0 => x0.ignoreCase,
      cD: x0 => x0.maxTouchPoints,
      cE: (x0,x1) => x0.contains(x1),
      cF: x0 => x0.clientWidth,
      cG: x0 => x0.state,
      cH: x0 => x0.readText(),
      cI: x0 => { globalThis.pdfiumWasmWorkerUrl = x0 },
      cJ: x0 => x0.getSelection(),
      cK: (x0,x1) => { x0.width = x1 },
      cL: x0 => x0.read(),
      d: (o, p) => o[p],
      dB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      dC: x0 => x0.multiline,
      dD: x0 => x0.platform,
      dE: (s) => +s,
      dF: (x0,x1) => { x0.content = x1 },
      dG: x0 => x0.hash,
      dH: x0 => x0.clipboard,
      dI: x0 => ({type: x0}),
      dJ: x0 => x0.removeAllRanges(),
      dK: x0 => x0.rasterEndMilliseconds,
      dL: x0 => x0.body,
      e: () => globalThis,
      eB: Function.prototype.call.bind(DataView.prototype.getInt32),
      eC: (string, token) => string.split(token),
      eD: x0 => x0.body,
      eE: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      eF: (x0,x1) => { x0.name = x1 },
      eG: x0 => x0.state,
      eH: (x0,x1) => x0.writeText(x1),
      eI: (x0,x1) => new Blob(x0,x1),
      eJ: (x0,x1) => x0.addRange(x1),
      eK: x0 => x0.rasterStartMilliseconds,
      eL: (x0,x1) => new OffscreenCanvas(x0,x1),
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      fC: o => o instanceof Array,
      fD: () => globalThis.document,
      fE: s => s.trim(),
      fF: x0 => x0.head,
      fG: (x0,x1) => x0.go(x1),
      fH: x0 => x0.unlock(),
      fI: x0 => globalThis.URL.createObjectURL(x0),
      fJ: () => globalThis.window,
      fK: x0 => x0.imageBitmaps,
      fL: x0 => x0.assetBase,
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: o => o instanceof Uint16Array,
      gC: (a, i) => a[i],
      gD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      gE: x0 => x0.classList,
      gF: (x0,x1) => x0.removeChild(x1),
      gG: x0 => x0.parentElement,
      gH: (x0,x1) => x0.lock(x1),
      gI: x0 => x0.content,
      gJ: (x0,x1) => { x0.innerText = x1 },
      gK: x0 => x0.canvasKitMaximumSurfaces,
      gL: x0 => x0.loader,
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: Function.prototype.call.bind(DataView.prototype.getUint16),
      hC: a => a.length,
      hD: x0 => x0.hasFocus(),
      hE: x0 => x0.preventDefault(),
      hF: x0 => x0.firstChild,
      hG: (x0,x1) => x0.querySelectorAll(x1),
      hH: x0 => x0.orientation,
      hI: (x0,x1) => x0.writeText(x1),
      hJ: x0 => x0.offsetY,
      hK: x0 => x0.nextSibling,
      hL: () => globalThis._flutter,
      i: (l, r) => l === r,
      iB: o => o instanceof Int16Array,
      iC: (x0,x1) => x0.test(x1),
      iD: x0 => x0.relatedTarget,
      iE: x0 => x0.parent,
      iF: x0 => x0.viewConstraints,
      iG: (d, digits) => d.toFixed(digits),
      iH: (x0,x1) => x0.querySelector(x1),
      iI: x0 => x0.clipboard,
      iJ: x0 => x0.offsetX,
      iK: (x0,x1) => x0.debug(x1),
      j: x0 => x0.random(),
      jB: Function.prototype.call.bind(DataView.prototype.getInt16),
      jC: x0 => x0.userAgent,
      jD: x0 => x0.shiftKey,
      jE: x0 => x0.timeStamp,
      jF: x0 => x0.hostElement,
      jG: x0 => x0.maxHeight,
      jH: (x0,x1) => { x0.title = x1 },
      jI: x0 => x0.navigator,
      jJ: x0 => x0.button,
      jK: x0 => x0.hostElement,
      k: o => o,
      kB: o => o instanceof Uint8ClampedArray,
      kC: x0 => x0.navigator,
      kD: (decoder, codeUnits) => decoder.decode(codeUnits),
      kE: (x0,x1) => x0.hasAttribute(x1),
      kF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      kG: x0 => x0.maxWidth,
      kH: (x0,x1) => x0.vibrate(x1),
      kI: x0 => x0.close(),
      kJ: x0 => x0.classList,
      kK: x0 => x0.location,
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      lC: Function.prototype.call.bind(String.prototype.toLowerCase),
      lD: () => new TextDecoder("utf-8", {fatal: true}),
      lE: x0 => x0.buttons,
      lF: x0 => ({runApp: x0}),
      lG: x0 => x0.minHeight,
      lH: x0 => x0.arrayBuffer(),
      lI: (x0,x1) => x0.revokeObjectURL(x1),
      lJ: (x0,x1) => { x0.height = x1 },
      lK: (x0,x1) => x0.getModifierState(x1),
      m: () => globalThis.Math,
      mB: Function.prototype.call.bind(DataView.prototype.setInt32),
      mC: Object.is,
      mD: () => new TextDecoder("utf-8", {fatal: false}),
      mE: x0 => x0.ctrlKey,
      mF: () => typeof dartUseDateNowForTicks !== "undefined",
      mG: x0 => x0.minWidth,
      mH: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      mI: (x0,x1) => { x0.src = x1 },
      mJ: (x0,x1) => { x0.width = x1 },
      mK: x0 => x0.metaKey,
      n: (x0,x1) => x0.prepend(x1),
      nB: Function.prototype.call.bind(DataView.prototype.setUint32),
      nC: x0 => x0.vendor,
      nD: (a, i, v) => a[i] = v,
      nE: x0 => x0.y,
      nF: () => Date.now(),
      nG: (x0,x1) => x0.removeProperty(x1),
      nH: x0 => x0.status,
      nI: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      nJ: x0 => x0.style,
      nK: x0 => x0.altKey,
      o: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      oB: Function.prototype.call.bind(DataView.prototype.setInt16),
      oC: (x0,x1) => x0.createTextNode(x1),
      oD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      oE: x0 => x0.x,
      oF: () => 1000 * performance.now(),
      oG: (x0,x1) => x0.add(x1),
      oH: (x0,x1) => x0.fetch(x1),
      oI: x0 => x0.naturalHeight,
      oJ: x0 => x0.sheet,
      oK: x0 => x0.ctrlKey,
      p: b => !!b,
      pB: Function.prototype.call.bind(DataView.prototype.setUint16),
      pC: (x0,x1) => { x0.id = x1 },
      pD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      pE: x0 => x0.scrollTop,
      pF: (x0,x1) => x0.requestAnimationFrame(x1),
      pG: x0 => x0.data,
      pH: x0 => x0.content,
      pI: x0 => x0.naturalWidth,
      pJ: x0 => x0.head,
      pK: x0 => x0.isComposing,
      q: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setUint8),
      qC: (x0,x1) => { x0.nonce = x1 },
      qD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      qE: x0 => x0.offsetTop,
      qF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qG: (x0,x1) => { x0.scrollTop = x1 },
      qH: x0 => x0.document,
      qI: x0 => x0.decode(),
      qJ: () => globalThis.document,
      qK: x0 => x0.code,
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.setInt8),
      rC: x0 => x0.nonce,
      rD: x0 => x0.visibilityState,
      rE: x0 => x0.scrollLeft,
      rF: x0 => x0.now(),
      rG: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      rH: (a, i) => a.splice(i, 1),
      rI: (x0,x1) => { x0.decoding = x1 },
      rJ: (x0,x1) => x0.append(x1),
      rK: x0 => x0.repeat,
      s: () => ({}),
      sB: Function.prototype.call.bind(DataView.prototype.getInt8),
      sC: () => globalThis.window.flutterConfiguration,
      sD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      sE: x0 => x0.offsetLeft,
      sF: x0 => x0.performance,
      sG: (x0,x1) => { x0.value = x1 },
      sH: a => a.pop(),
      sI: (x0,x1) => { x0.crossOrigin = x1 },
      sJ: x0 => x0.click(),
      sK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      t: (o, p, v) => o[p] = v,
      tB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      tC: (x0,x1) => x0.attachShadow(x1),
      tD: x0 => x0.disconnect(),
      tE: x0 => x0.offsetParent,
      tF: x0 => new Uint8Array(x0),
      tG: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      tH: (map, o, v) => map.set(o, v),
      tI: (x0,x1) => x0.createObjectURL(x1),
      tJ: x0 => x0.remove(),
      tK: x0 => x0.userAgent,
      u: () => [],
      uB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      uC: (x0,x1) => x0.createElement(x1),
      uD: x0 => new Intl.Locale(x0),
      uE: (o, p, r) => o.replace(p, () => r),
      uF: (x0,x1,x2) => x0.slice(x1,x2),
      uG: (x0,x1) => { x0.value = x1 },
      uH: () => new WeakMap(),
      uI: x0 => x0.URL,
      uJ: x0 => globalThis.URL.revokeObjectURL(x0),
      uK: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.scale,
      vD: x0 => x0.region,
      vE: (o, p, r) => o.replaceAll(p, () => r),
      vF: (x0,x1) => x0.decode(x1),
      vG: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      vH: x0 => x0.debugSkipFontRetryDelay,
      vI: x0 => new Blob(x0),
      vJ: x0 => x0.body,
      vK: (x0,x1) => x0.removeItem(x1),
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.visualViewport,
      wD: x0 => x0.script,
      wE: x0 => x0.deltaMode,
      wF: (x0,x1) => x0.adoptText(x1),
      wG: x0 => x0.value,
      wH: (x0,x1,x2) => x0.set(x1,x2),
      wI: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      wJ: (x0,x1) => { x0.display = x1 },
      wK: x0 => x0.localStorage,
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.devicePixelRatio,
      xD: x0 => x0.language,
      xE: x0 => x0.deltaY,
      xF: x0 => x0.first(),
      xG: x0 => x0.selectionDirection,
      xH: x0 => x0.fontFallbackBaseUrl,
      xI: x0 => new window.ImageDecoder(x0),
      xJ: x0 => x0.style,
      xK: (x0,x1) => x0.getItem(x1),
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.height,
      yD: x0 => x0.languages,
      yE: x0 => x0.deltaX,
      yF: x0 => x0.next(),
      yG: x0 => x0.selectionStart,
      yH: (handle) => clearInterval(handle),
      yI: x0 => x0.name,
      yJ: (x0,x1) => { x0.download = x1 },
      yK: (x0,x1) => x0.key(x1),
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      zC: x0 => x0.width,
      zD: (x0,x1) => x0.observe(x1),
      zE: x0 => x0.wheelDeltaY,
      zF: x0 => x0.current(),
      zG: x0 => x0.selectionEnd,
      zH: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      zI: x0 => x0.repetitionCount,
      zJ: (x0,x1) => { x0.href = x1 },
      zK: x0 => x0.length,

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      s: [
        "([ \r\n\t]+)|([!-\\[\\]-‧‪-퟿豈-￿][̀-ͯ]*|[\ud800-\udbff][\udc00-\udfff][̀-ͯ]*|\\\\verb\\*([^]).*?\\3|\\\\verb([^*a-zA-Z]).*?\\4|\\\\operatorname\\*|\\\\[a-zA-Z@]+[ \r\n\t]*|\\\\[^\ud800-\udfff])",
      ],
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
