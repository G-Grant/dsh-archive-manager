import { Remote, RemoteError, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { SessionId } from "@deepseek-ai/dsh-session";
import { appendFile, lstat, readFile, realpath, rm } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, sep } from "node:path";
import { homedir } from "node:os";

const MAX_BATCH_SIZE = 500;
const GENERATION_FILE = /^session(?:-v[1-9][0-9]*)?\.jsonl(?:\.zstd)?$/;
const DIAG_LOG = "/tmp/dsh-archive-manager-diag.log";

let cachedVersion;

/** Report the installed package version so the diag log identifies the bundle. */
async function pluginVersion() {
  if (cachedVersion !== undefined) return cachedVersion;
  try {
    const manifest = JSON.parse(await readFile(new URL("./package.json", import.meta.url), "utf8"));
    cachedVersion = typeof manifest?.version === "string" ? manifest.version : "unknown";
  } catch {
    cachedVersion = "unknown";
  }
  return cachedVersion;
}

async function diag(entry) {
  try {
    await appendFile(DIAG_LOG, `${new Date().toISOString()} ${JSON.stringify(entry)}\n`);
  } catch {
    // Diagnostics are optional and must never fail a business call.
  }
}

function serviceOf(ctx, name) {
  try {
    return ctx.get(name);
  } catch {
    return undefined;
  }
}

function textId(value) {
  return typeof value === "string" ? value : String(value ?? "");
}

function issue(reason) {
  const error = new Error(reason);
  error.archiveManagerReason = reason;
  return error;
}

function failure(sessionId, reason) {
  return { sessionId, status: "failed", reason };
}

function projectDirectoryName(value) {
  return value === "_no-cwd" || /^--.+--$/.test(value);
}

function encodeSegment(raw) {
  if (raw.length === 0) throw issue("unsafe-artifact-path");
  if (raw === ".") return "~002E";
  if (raw === "..") return "~002E~002E";
  let result = "";
  for (let index = 0; index < raw.length; index += 1) {
    const code = raw.charCodeAt(index);
    const character = String.fromCharCode(code);
    result += character !== "~" && /^[A-Za-z0-9._-]$/.test(character)
      ? character
      : `~${code.toString(16).toUpperCase().padStart(4, "0")}`;
  }
  return result;
}

async function readArchivedIds(ctx) {
  const controller = serviceOf(ctx, "workspaceController");
  if (typeof controller?.follow !== "function") {
    throw new RemoteError("archive-manager/unavailable", "Archived-session state is unavailable in this deployment.", { reason: "workspace-follow-unavailable" });
  }
  const abort = new AbortController();
  const stream = controller.follow(abort.signal);
  const iterator = stream?.[Symbol.asyncIterator]?.();
  if (iterator === undefined) {
    abort.abort();
    throw new RemoteError("archive-manager/unavailable", "Archived-session state is unavailable in this deployment.", { reason: "workspace-follow-invalid" });
  }
  try {
    const first = await iterator.next();
    const frame = first.value;
    if (first.done || frame?.type !== "baseline" || !Array.isArray(frame.value?.archivedSessionIds)) {
      throw new RemoteError("archive-manager/unavailable", "The workspace archive state could not be read.", { reason: "workspace-baseline-missing" });
    }
    return new Set(frame.value.archivedSessionIds.map(textId));
  } finally {
    abort.abort();
    try {
      await iterator.return?.();
    } catch {
      // The one-shot baseline has already been received; cancellation is best effort.
    }
  }
}

async function readSnapshots(ctx) {
  const persistence = serviceOf(ctx, "sessionPersistence");
  if (typeof persistence?.list !== "function") {
    throw new RemoteError("archive-manager/unavailable", "This deployment's session storage cannot be inspected safely.", { reason: "session-persistence-unavailable" });
  }
  const snapshots = await persistence.list();
  return new Map((snapshots ?? []).map((snapshot) => [textId(snapshot?.id), snapshot]));
}

function openReason(ctx, sessionId) {
  const sessions = serviceOf(ctx, "sessions");
  try {
    if (sessions?.get?.(sessionId) !== undefined) return "open-session";
  } catch {
    return "open-session";
  }
  const agents = serviceOf(ctx, "agents");
  try {
    const agent = agents?.get?.(sessionId);
    if (agent?.status === "running") return "running-session";
    if (agent !== undefined) return "open-session";
  } catch {
    return "open-session";
  }
  return undefined;
}

async function validateArtifact(snapshot, sessionId) {
  const location = snapshot?.location;
  if (location?.kind !== "jsonl") throw issue("storage-kind-unsupported");
  const artifactPath = location.path;
  if (typeof artifactPath !== "string" || !isAbsolute(artifactPath)) throw issue("unsafe-artifact-path");
  const sessionDirectory = dirname(artifactPath);
  if (basename(sessionDirectory) !== encodeSegment(sessionId)) throw issue("unsafe-artifact-path");
  if (!projectDirectoryName(basename(dirname(sessionDirectory)))) throw issue("unsafe-artifact-path");
  if (!GENERATION_FILE.test(basename(artifactPath))) throw issue("unsafe-artifact-path");

  let artifactStat;
  let directoryStat;
  try {
    artifactStat = await lstat(artifactPath);
    directoryStat = await lstat(sessionDirectory);
  } catch (error) {
    if (error?.code === "ENOENT") throw issue("session-not-found");
    throw issue("unsafe-artifact-path");
  }
  if (!artifactStat.isFile() || !directoryStat.isDirectory() || directoryStat.isSymbolicLink()) throw issue("unsafe-artifact-path");

  let canonicalDirectory;
  let canonicalArtifact;
  try {
    canonicalDirectory = await realpath(sessionDirectory);
    canonicalArtifact = await realpath(artifactPath);
  } catch {
    throw issue("unsafe-artifact-path");
  }
  if (canonicalDirectory !== sessionDirectory || canonicalArtifact !== artifactPath) throw issue("unsafe-artifact-path");
  const child = relative(canonicalDirectory, canonicalArtifact);
  if (!child || child.startsWith(`..${sep}`) || isAbsolute(child)) throw issue("unsafe-artifact-path");
  return canonicalDirectory;
}

const PREVIEW_LIMIT = 280;

/** Normalize an epoch-millisecond timestamp from either a number or an ISO string. */
function toEpoch(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string" && value.length > 0) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

/** Collapse one message body into a 2-3 line list preview. */
function clipPreview(text) {
  const flat = String(text ?? "").replace(/\s+/g, " ").trim();
  if (flat.length === 0) return "";
  return flat.length <= PREVIEW_LIMIT ? flat : `${flat.slice(0, PREVIEW_LIMIT - 1)}…`;
}

/** Project a working directory into a display name plus an abbreviated path. */
function describeProject(cwd) {
  if (typeof cwd !== "string" || cwd.length === 0) return null;
  const home = homedir();
  const name = basename(cwd);
  const path = cwd === home ? "~" : cwd.startsWith(`${home}${sep}`) ? `~${cwd.slice(home.length)}` : cwd;
  return { name: name.length > 0 ? name : path, path };
}

async function readSessionRows(ctx) {
  const controller = serviceOf(ctx, "sessionController");
  const rows = new Map();
  if (typeof controller?.list !== "function") return rows;
  try {
    const value = await controller.list({}, undefined);
    for (const item of Array.isArray(value?.items) ? value.items : []) {
      const sessionId = textId(item?.sessionId);
      if (sessionId.length === 0) continue;
      rows.set(sessionId, {
        sessionId,
        title: typeof item?.title === "string" ? item.title : "",
        updatedAt: toEpoch(item?.updatedAt),
        createdAt: toEpoch(item?.createdAt),
        cwd: typeof item?.cwd === "string" ? item.cwd : ""
      });
    }
  } catch {
    // Titles are a convenience; the archive baseline remains authoritative.
  }
  return rows;
}

/** Read the persisted session headers (creation time and working directory) without loading logs. */
async function readSessionHeaders(ctx) {
  const query = serviceOf(ctx, "sessionQuery");
  const headers = new Map();
  if (typeof query?.listSessions !== "function") return headers;
  try {
    for (const record of await query.listSessions(undefined)) {
      const sessionId = textId(record?.header?.id);
      if (sessionId.length > 0) headers.set(sessionId, record.header);
    }
  } catch {
    // Headers only enrich rows; the archive baseline still decides membership.
  }
  return headers;
}

/** Fold the stored title of each archived session in one corpus observation. */
async function readSessionTitles(ctx, sessionIds) {
  const query = serviceOf(ctx, "sessionQuery");
  const titles = new Map();
  if (typeof query?.readTitleSnapshots !== "function" || sessionIds.length === 0) return titles;
  try {
    const results = await query.readTitleSnapshots(sessionIds, undefined);
    for (const result of results ?? []) {
      if (result?.status !== "fulfilled") continue;
      const title = result.value?.title?.title;
      if (typeof title === "string" && title.trim().length > 0) titles.set(textId(result.sessionId), title.trim());
    }
  } catch {
    // Titles fall back to the first message line.
  }
  return titles;
}

/** Read a short body preview per archived session with bounded concurrency. */
async function readSessionPreviews(ctx, sessionIds) {
  const query = serviceOf(ctx, "sessionQuery");
  const previews = new Map();
  if (typeof query?.filterEvents !== "function" || sessionIds.length === 0) return previews;
  const queue = [...sessionIds];
  const worker = async () => {
    while (queue.length > 0) {
      const sessionId = queue.shift();
      try {
        const documents = await query.filterEvents(sessionId, [{ kind: "type", values: ["user/message"] }]);
        const first = (documents ?? []).map((document) => document?.text ?? "").find((text) => text.trim().length > 0);
        if (first !== undefined) previews.set(sessionId, clipPreview(first));
      } catch {
        // One unreadable log must not hide the row.
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, sessionIds.length) }, worker));
  return previews;
}

function linkedWorkspaces(ctx, sessionId) {
  const registry = serviceOf(ctx, "workspaceRegistry");
  if (typeof registry?.list !== "function") return { registry, workspaces: [] };
  const workspaces = [];
  for (const workspace of registry.list() ?? []) {
    try {
      if ((workspace.sessionIds ?? []).some((candidate) => textId(candidate) === sessionId)) workspaces.push(workspace);
    } catch {
      // A projection that cannot be read must not expand the deletion target.
    }
  }
  return { registry, workspaces };
}

async function cleanBookkeeping(ctx, sessionId, registry, workspaces) {
  const warnings = [];
  const typedId = SessionId(sessionId);
  try {
    if (typeof registry?.unarchiveSession === "function") await registry.unarchiveSession(typedId);
    else warnings.push("archive-state-not-cleaned");
  } catch {
    warnings.push("archive-state-not-cleaned");
  }
  let workspaceAccountingCleaned = false;
  try {
    if (typeof registry?.forgetSession === "function") {
      await registry.forgetSession(typedId);
      workspaceAccountingCleaned = true;
    } else {
      for (const workspace of workspaces) {
        if (typeof workspace.detachSession !== "function") continue;
        await workspace.detachSession(typedId);
        workspaceAccountingCleaned = true;
      }
    }
  } catch {
    warnings.push("workspace-accounting-not-cleaned");
  }
  if (!workspaceAccountingCleaned) warnings.push("workspace-accounting-not-cleaned");
  try {
    await serviceOf(ctx, "sessionProjectionCache")?.forget?.(typedId);
  } catch {
    warnings.push("projection-cache-not-cleaned");
  }
  try {
    ctx.emit("api-session/removed", typedId);
  } catch {
    warnings.push("lifecycle-notified-with-warning");
  }
  return [...new Set(warnings)];
}

/** Drop bookkeeping for an archived session whose log is already gone. */
async function forgetWithoutLog(ctx, sessionId) {
  const linked = await linkedWorkspaces(ctx, sessionId);
  const warnings = await cleanBookkeeping(ctx, sessionId, linked.registry, linked.workspaces);
  return {
    sessionId,
    status: "deleted",
    note: "log-missing",
    ...(warnings.length > 0 ? { warning: warnings.join(",") } : {})
  };
}

/** Normalise a remote batch request into a deduplicated, bounded id list. */
function batchIds(request) {
  const rawIds = request?.sessionIds;
  if (!Array.isArray(rawIds) || rawIds.length === 0 || rawIds.length > MAX_BATCH_SIZE) {
    throw new RemoteError("archive-manager/invalid-request", `Choose between 1 and ${MAX_BATCH_SIZE} archived sessions.`, { reason: "invalid-sessionIds" });
  }
  const sessionIds = [...new Set(rawIds.map(textId).filter(Boolean))];
  if (sessionIds.length === 0) {
    throw new RemoteError("archive-manager/invalid-request", "The session list is empty.", { reason: "empty-sessionIds" });
  }
  return sessionIds;
}

class ArchiveManager extends TypertRemoteService {
  constructor(ctx) {
    super(ctx, "archiveManager");
    void pluginVersion().then((version) => diag({ event: "start", version }));
    // TEMPORARY diagnostics: record what the live host sees before any client call.
    try {
      const timer = setTimeout(() => void this.probe(), 800);
      timer?.unref?.();
    } catch {
      // Diagnostics must never block service construction.
    }
  }

  async probe() {
    try {
      const archivedIds = await readArchivedIds(this.ctx);
      const rows = await readSessionRows(this.ctx);
      await diag({
        event: "probe",
        archived: archivedIds.size,
        described: rows.size,
        sample: [...archivedIds].slice(0, 3)
      });
    } catch (error) {
      await diag({
        event: "probe-failed",
        code: String(error?.code ?? ""),
        message: String(error?.message ?? error)
      });
    }
  }

  async listArchivedSessions() {
    const started = Date.now();
    const archivedIds = await readArchivedIds(this.ctx);
    const ids = [...archivedIds];
    const rows = await readSessionRows(this.ctx);
    const headers = await readSessionHeaders(this.ctx);
    const [titles, previews] = await Promise.all([
      readSessionTitles(this.ctx, ids),
      readSessionPreviews(this.ctx, ids)
    ]);
    const sessions = ids.map((sessionId) => {
      const row = rows.get(sessionId);
      const header = headers.get(sessionId);
      const cwd = (typeof row?.cwd === "string" && row.cwd.length > 0 ? row.cwd : "") ||
        (typeof header?.cwd === "string" ? header.cwd : "");
      const preview = previews.get(sessionId) ?? "";
      const title = (typeof row?.title === "string" && row.title.trim().length > 0 ? row.title.trim() : "") ||
        titles.get(sessionId) || "";
      return {
        sessionId,
        title,
        preview,
        createdAt: toEpoch(header?.createdAt) || toEpoch(row?.createdAt),
        updatedAt: toEpoch(row?.updatedAt) || toEpoch(header?.createdAt),
        cwd,
        project: describeProject(cwd)
      };
    });
    sessions.sort((a, b) => b.updatedAt - a.updatedAt || a.sessionId.localeCompare(b.sessionId));
    const debug = {
      archived: archivedIds.size,
      described: rows.size,
      titled: titles.size,
      previewed: previews.size,
      elapsedMs: Date.now() - started,
      at: new Date().toISOString()
    };
    await diag({ event: "list", ...debug });
    return { sessions, debug };
  }

  async purgeArchivedSessions(request) {
    const sessionIds = batchIds(request);
    const archivedIds = await readArchivedIds(this.ctx);
    const snapshots = await readSnapshots(this.ctx);
    const results = [];
    for (const sessionId of sessionIds) {
      if (!archivedIds.has(sessionId)) {
        results.push(failure(sessionId, "not-archived"));
        continue;
      }
      const opened = openReason(this.ctx, sessionId);
      if (opened !== undefined) {
        results.push(failure(sessionId, opened));
        continue;
      }
      const snapshot = snapshots.get(sessionId);
      if (snapshot === undefined) {
        results.push(await forgetWithoutLog(this.ctx, sessionId));
        continue;
      }
      let sessionDirectory;
      try {
        sessionDirectory = await validateArtifact(snapshot, sessionId);
      } catch (error) {
        results.push(failure(sessionId, error?.archiveManagerReason ?? "unsafe-artifact-path"));
        continue;
      }
      const linked = await linkedWorkspaces(this.ctx, sessionId);
      try {
        await rm(sessionDirectory, { recursive: true, force: false });
      } catch (error) {
        if (error?.code === "ENOENT") {
          results.push(await forgetWithoutLog(this.ctx, sessionId));
          continue;
        }
        results.push(failure(sessionId, "delete-failed"));
        continue;
      }
      const warnings = await cleanBookkeeping(this.ctx, sessionId, linked.registry, linked.workspaces);
      results.push({
        sessionId,
        status: "deleted",
        ...(warnings.length > 0 ? { warning: warnings.join(",") } : {})
      });
    }
    return { results };
  }

  async unarchiveSessions(request) {
    const sessionIds = batchIds(request);
    const archivedIds = await readArchivedIds(this.ctx);
    const controller = serviceOf(this.ctx, "workspaceController");
    if (controller === undefined) {
      throw new RemoteError("archive-manager/unavailable", "The workspace controller is unavailable.", { reason: "workspace-unavailable" });
    }
    const results = [];
    for (const sessionId of sessionIds) {
      if (!archivedIds.has(sessionId)) {
        results.push(failure(sessionId, "not-archived"));
        continue;
      }
      try {
        await controller.unarchiveSession({ sessionId });
        results.push({ sessionId, status: "unarchived" });
      } catch (error) {
        const code = typeof error?.code === "string" && error.code.length > 0 ? error.code : "unarchive-failed";
        results.push(failure(sessionId, code));
      }
    }
    await diag({ event: "unarchive", requested: sessionIds.length, done: results.filter((item) => item.status === "unarchived").length });
    return { results };
  }
}

const markerInitializers = [];
for (const name of ["listArchivedSessions", "purgeArchivedSessions", "unarchiveSessions"]) {
  Remote(name)(ArchiveManager.prototype[name], {
    kind: "method",
    name,
    static: false,
    private: false,
    addInitializer(initializer) {
      markerInitializers.push(initializer);
    }
  });
}
for (const initializer of markerInitializers) initializer.call(Object.create(ArchiveManager.prototype));

export { ArchiveManager };
export default ArchiveManager;
