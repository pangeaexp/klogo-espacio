const protocol = 5;
const defaultMaxSteps = 100_000;
const maximumSteps = 24_000_000;
const maxSourceBytes = 64 * 1024;
const maxInputBytes = 4096;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
let engine;
let pending;

function failure(code, message) {
  return { ok: false, error: { code, message } };
}

async function load(request) {
  let bytes = request.wasmBytes;
  if (bytes === undefined) {
    const response = await fetch(request.wasmUrl ?? "./klogo.wasm");
    if (!response.ok) {
      throw new Error(`No se pudo cargar klogo.wasm (HTTP ${response.status}).`);
    }
    bytes = await response.arrayBuffer();
  }
  const { instance } = await WebAssembly.instantiate(bytes, {});
  const exports = instance.exports;
  if (!(exports.memory instanceof WebAssembly.Memory)
      || typeof exports.klogo_prepare !== "function"
      || typeof exports.klogo_run !== "function"
      || typeof exports.klogo_resume !== "function"
      || typeof exports.klogo_continue !== "function"
      || typeof exports.klogo_step !== "function"
      || typeof exports.klogo_output_length !== "function") {
    throw new Error("El módulo WASM no exporta la interfaz de KLogo.");
  }
  return exports;
}

function inputFailure(message) {
  return { ok: false, error: { code: "input", message, line: 1, column: 1 } };
}

function writeRequest(wasm, text, type) {
  const resume = type !== "run";
  const limit = resume ? maxInputBytes : maxSourceBytes;
  const limitMessage = resume ? "La respuesta supera los 4 KiB." : "El programa supera los 64 KiB.";
  if (typeof text !== "string") {
    const message = { run: "Se esperaba un programa de Logo como texto.",
      resume: "Se esperaba una palabra.", resume_key: "Se esperaba una tecla.",
      resume_click: "Se esperaba un clic." }[type];
    return inputFailure(message);
  }
  if (text.length > limit) return inputFailure(limitMessage);
  const input = encoder.encode(text);
  if (input.length > limit) return inputFailure(limitMessage);
  const inputAddress = wasm.klogo_prepare(input.length);
  new Uint8Array(wasm.memory.buffer, inputAddress, input.length).set(input);
}

function execute(wasm, request) {
  let outputAddress;
  if (request.type === "step") {
    outputAddress = wasm.klogo_step(0);
  } else if (request.type === "continue") {
    // After ESPERA or NOTA, continue keeps the mode unless the host asks to run on;
    // after a step or a slice it leaves step mode.
    outputAddress = pending.type === "delay" && request.run !== true
      ? wasm.klogo_continue() : wasm.klogo_step(1);
  } else {
    const { type } = request;
    const text = type === "resume_key" ? request.key
      : type === "resume_click" ? request.click
      : type === "resume" ? request.word : request.source;
    const error = writeRequest(wasm, text, type);
    if (error) return error;
    if (type === "resume_key") {
      outputAddress = wasm.klogo_resume_key();
    } else if (type === "resume_click") {
      outputAddress = wasm.klogo_resume_click();
    } else if (type === "resume") {
      outputAddress = wasm.klogo_resume();
    } else {
      const maxSteps = request.maxSteps === undefined ? defaultMaxSteps : request.maxSteps;
      if (!Number.isSafeInteger(maxSteps) || maxSteps < 1 || maxSteps > maximumSteps) {
        return inputFailure(`El presupuesto debe estar entre 1 y ${maximumSteps} pasos.`);
      }
      const sliceSteps = request.sliceSteps === undefined ? 0 : request.sliceSteps;
      if (!Number.isSafeInteger(sliceSteps) || sliceSteps < 0 || sliceSteps > maximumSteps) {
        return inputFailure(`Las tandas deben tener entre 0 y ${maximumSteps} pasos.`);
      }
      const seed = crypto.getRandomValues(new Uint32Array(2));
      outputAddress = wasm.klogo_run(seed[0], seed[1], maxSteps, request.stepMode === true ? 1 : 0, sliceSteps);
    }
  }
  const output = new Uint8Array(wasm.memory.buffer, outputAddress, wasm.klogo_output_length());
  const outcome = JSON.parse(decoder.decode(output));
  const runId = request.type === "run" ? request.id : request.runId;
  if (outcome.error?.code !== "invalid_key") {
    pending = undefined;
    if (outcome.input) {
      const type = { key: "resume_key", click: "resume_click" }[outcome.input.kind] ?? "resume";
      pending = { runId, type };
    }
    if (outcome.delay_ms !== undefined) pending = { runId, type: "delay" };
    if (outcome.step) pending = { runId, type: "step" };
    if (outcome.slice) pending = { runId, type: "slice" };
  }
  return { ...outcome, runId };
}

self.onmessage = async ({ data: request }) => {
  const id = request?.id;
  if (typeof id !== "string" && !Number.isSafeInteger(id)) return;

  if (request.type === "init") {
    if (engine) {
      self.postMessage({ type: "ready", id, ...failure("protocol", "El motor ya se está usando.") });
      return;
    }
    engine = load(request);
    try {
      await engine;
      self.postMessage({ type: "ready", id, protocol, ok: true });
    } catch (error) {
      engine = undefined;
      self.postMessage({ type: "ready", id, ...failure("wasm_load", error.message) });
    }
    return;
  }

  const respond = (outcome) => self.postMessage({ type: "result", id, ...outcome });
  if (!["run", "resume", "resume_key", "resume_click", "continue", "step"].includes(request.type)) {
    respond(failure("protocol", "Se esperaba un mensaje init, run, resume, resume_key, resume_click, continue o step."));
    return;
  }
  if (!engine) {
    respond(failure("protocol", "Inicializa el motor antes de ejecutar un programa."));
    return;
  }
  let wasm;
  try {
    wasm = await engine;
  } catch (error) {
    respond(failure("wasm_load", error.message));
    return;
  }
  try {
    if (request.type === "run") {
      pending = undefined;
    } else if (!pending || request.runId !== pending.runId || !(request.type === pending.type
        || (["continue", "step"].includes(request.type) && ["delay", "step", "slice"].includes(pending.type)))) {
      respond(failure("protocol", "La ejecución indicada no está esperando ese tipo de respuesta."));
      return;
    }
    respond(execute(wasm, request));
  } catch (error) {
    respond(failure("wasm_run", error.message));
  }
};
