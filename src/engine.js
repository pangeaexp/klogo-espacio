export function createEngine(workerSource, wasmUrl) {
  let worker;
  let objectUrl;
  let active;
  let nextId = 0;
  let disposed = false;
  let ready = false;
  let waitingRunId;
  const abort = new AbortController();

  const release = () => {
    if (!active) return;
    clearTimeout(active.timer);
    const pending = active;
    active = undefined;
    return pending;
  };

  const dispose = (error = new Error("Motor detenido.")) => {
    disposed = true;
    abort.abort(error);
    release()?.reject(error);
    worker?.terminate();
    worker = undefined;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = undefined;
  };

  function send(request, responseType, transfer = []) {
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      const timer = setTimeout(() => {
        dispose(new Error("El motor agotó el tiempo de espera."));
      }, 8000);
      active = { id, responseType, timer, resolve, reject };
      try {
        worker.postMessage({ ...request, id }, transfer);
      } catch (error) {
        dispose(error);
      }
    });
  }

  async function start() {
    const deadline = setTimeout(() => {
      dispose(new Error("El motor agotó el tiempo de arranque."));
    }, 8000);
    try {
      const response = await fetch(wasmUrl, { signal: abort.signal });
      if (!response.ok) throw new Error(`No se pudo leer el WASM local (HTTP ${response.status}).`);
      const wasmBytes = await response.arrayBuffer();
      if (disposed) throw abort.signal.reason;
      objectUrl = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
      worker = new Worker(objectUrl);
      worker.onmessage = ({ data }) => {
        if (!active || data?.id !== active.id || data.type !== active.responseType) return;
        release().resolve(data);
      };
      worker.onerror = (event) => {
        event.preventDefault();
        dispose(new Error(event.message || "El worker dejó de responder."));
      };
      worker.onmessageerror = () => dispose(new Error("No se pudo leer la respuesta del worker."));
      const reply = await send({ type: "init", wasmBytes }, "ready", [wasmBytes]);
      if (!reply.ok) throw new Error(reply.error.message);
      if (reply.protocol !== 5) throw new Error("La versión del protocolo WASM es incompatible.");
      ready = true;
    } catch (error) {
      dispose(error);
      throw error;
    } finally {
      clearTimeout(deadline);
    }
  }

  async function requestResult(request) {
    if (!ready || disposed || active) throw new Error("El motor no está disponible.");
    const reply = await send(request, "result");
    if (reply.error?.code !== "invalid_key") {
      waitingRunId = reply.input || reply.step || reply.slice || reply.delay_ms !== undefined
        ? reply.runId : undefined;
    }
    return reply;
  }

  return {
    start,
    run(source, maxSteps, stepMode = false, sliceSteps = 0) {
      return requestResult({ type: "run", source, maxSteps, stepMode, sliceSteps });
    },
    step() {
      return requestResult({ type: "step", runId: waitingRunId });
    },
    resume(word) {
      return requestResult({ type: "resume", word, runId: waitingRunId });
    },
    resumeKey(key) {
      return requestResult({ type: "resume_key", key, runId: waitingRunId });
    },
    // LEECLIC: turtle coordinates on the 2D canvas, column and row on LIENZO.
    resumeClick(x, y) {
      return requestResult({ type: "resume_click", click: `${x} ${y}`, runId: waitingRunId });
    },
    // `run` leaves step mode when continuing after ESPERA or NOTA.
    continueAfterPause(run = false) {
      return requestResult({ type: "continue", runId: waitingRunId, run });
    },
    dispose,
  };
}
