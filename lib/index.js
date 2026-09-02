import z from "@deepseek-ai/schemastery";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
//#region lib/types/notify-settings.js
/**
* Durable settings of the notification plugin, shared by the Host schema
* (`src/index.ts`) and the browser scope (`src/client/index.ts`).
*/
/** Settings namespace owned by the notification plugin. */
const NOTIFY_SETTINGS_NAMESPACE = "ui-notify";
/** Built-in notification methods accepted at the registry and settings boundaries. */
const NOTIFY_METHODS = [
	"builtin",
	"tts",
	"custom"
];
/** Largest local audio file accepted for the custom method (protects host storage). */
const MAX_AUDIO_BYTES = 1024 * 1024;
/** URL prefix of the host-side user-audio route (see `src/index.ts`). */
const AUDIO_URL_PREFIX = "/_dsh-ui-notify/audio";
/** Canonical UUID pattern of one stored audio id (path-segment safety: no separators). */
const AUDIO_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
/** Stored filename extension → audio media type (the URL carries the extension, so the route answers with the right type). */
const AUDIO_EXTENSION_MEDIA_TYPES = {
	wav: "audio/wav",
	mp3: "audio/mpeg",
	ogg: "audio/ogg",
	mp4: "audio/mp4",
	webm: "audio/webm",
	aac: "audio/aac",
	flac: "audio/flac",
	m4a: "audio/mp4",
	aiff: "audio/x-aiff",
	aif: "audio/x-aiff",
	wma: "audio/x-ms-wma",
	mid: "audio/midi",
	midi: "audio/midi"
};
/** Media type → stored extension (upload-side inverse of {@link AUDIO_EXTENSION_MEDIA_TYPES}). */
const AUDIO_MEDIA_TYPE_EXTENSIONS = Object.fromEntries(Object.entries(AUDIO_EXTENSION_MEDIA_TYPES).map(([extension, mediaType]) => [mediaType, extension]));
/**
* Resolve the stored extension for one declared audio media type, falling back
* to the file-name extension when the browser reports an empty type (some
* systems leave `file.type` blank for audio files).
* @param mediaType - the file picker's `file.type` value.
* @param fileName - the picked file's name, used as the empty-type fallback.
* @returns the lowercase extension, or undefined when neither source is accepted.
*/
function audioExtensionOfMediaType(mediaType, fileName) {
	const byType = mediaType === "" ? void 0 : AUDIO_MEDIA_TYPE_EXTENSIONS[mediaType] ?? (mediaType === "audio/x-wav" ? "wav" : void 0);
	if (byType !== void 0) return byType;
	if (fileName === void 0) return void 0;
	const dot = fileName.lastIndexOf(".");
	if (dot < 0) return void 0;
	const byName = fileName.slice(dot + 1).toLowerCase();
	return byName in AUDIO_EXTENSION_MEDIA_TYPES ? byName : void 0;
}
/**
* Resolve the media type for one stored audio extension.
* @param extension - lowercase extension from the route path.
* @returns the media type, or undefined when unknown.
*/
function audioMediaTypeOfExtension(extension) {
	return AUDIO_EXTENSION_MEDIA_TYPES[extension];
}
/** Field names of the durable section (the row writes one field per control). */
const NOTIFY_FIELDS = {
	/** Master switch: whether notifications are enabled at all. */
	enabled: "enabled",
	/** Whether a browser system notification accompanies the sound. */
	systemNotify: "systemNotify",
	/** Ring when a session's answer finishes (running → idle edge). */
	onAnswerComplete: "onAnswerComplete",
	/** Ring when a session needs authorization (approval/question pending). */
	onAuthRequired: "onAuthRequired",
	/** Playback method: built-in ringtone, text-to-speech, or a custom audio file. */
	method: "method",
	/** Text spoken by the TTS method. */
	ttsText: "ttsText",
	/** Custom audio source (http(s) URL or data URL) played by the custom method. */
	customAudioUrl: "customAudioUrl"
};
/** Default section when the user-settings document has no override. */
const DEFAULT_NOTIFY_SETTINGS = {
	enabled: false,
	systemNotify: false,
	onAnswerComplete: true,
	onAuthRequired: true,
	method: "builtin",
	ttsText: "回答完成",
	customAudioUrl: ""
};
/** Durable notification schema; also the wire envelope the browser scope validates against. */
const NotifySettingsSchema = z.object({
	[NOTIFY_FIELDS.enabled]: z.boolean().default(DEFAULT_NOTIFY_SETTINGS.enabled),
	[NOTIFY_FIELDS.systemNotify]: z.boolean().default(DEFAULT_NOTIFY_SETTINGS.systemNotify),
	[NOTIFY_FIELDS.onAnswerComplete]: z.boolean().default(DEFAULT_NOTIFY_SETTINGS.onAnswerComplete),
	[NOTIFY_FIELDS.onAuthRequired]: z.boolean().default(DEFAULT_NOTIFY_SETTINGS.onAuthRequired),
	[NOTIFY_FIELDS.method]: z.union([...NOTIFY_METHODS]).default(DEFAULT_NOTIFY_SETTINGS.method),
	[NOTIFY_FIELDS.ttsText]: z.string().default(DEFAULT_NOTIFY_SETTINGS.ttsText),
	[NOTIFY_FIELDS.customAudioUrl]: z.string().default(DEFAULT_NOTIFY_SETTINGS.customAudioUrl)
});
/**
* Narrow one wire or registry value to a persistable method.
* @param value - value crossing the settings or registry boundary.
* @returns whether the value is a built-in method.
*/
function isNotifyMethod(value) {
	return NOTIFY_METHODS.some((method) => method === value);
}
//#endregion
//#region lib/types/audio-store.js
/**
* Host-side user-audio store for the notification plugin: the custom-method
* local file lands here instead of bloating the settings document with a data
* URL. One file per id under `$DSH_HOME/storages/ui-notify/audio`, served,
* uploaded, and deleted through a webServer prefix route guarded by the same
* trust fence as `/api` (loopback-only: `isTrustedApiRequest` with an empty
* trust list, exactly the pin the /api privileged methods use). A retention
* sweep at host activation removes files no longer referenced by the setting.
*/
/** Storage root relative to `$DSH_HOME/storages`. */
const AUDIO_STORAGE_REL = join("ui-notify", "audio");
/**
* Absolute directory holding user-picked audio files.
* @returns the per-id file directory under the Harness home.
*/
function audioStorageDir() {
	return join(dshHomePath("storages"), AUDIO_STORAGE_REL);
}
/** One route tail: `/<uuid>.<ext>` with a whitelisted extension. */
const AUDIO_TAIL_PATTERN = /* @__PURE__ */ new RegExp("^/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\.([a-z0-9]{2,5})$", "iu");
/** Whether the tail parses to a known audio id + extension pair (the tail regex pins the id to a canonical UUID). */
function parseTail(tail) {
	const match = AUDIO_TAIL_PATTERN.exec(tail);
	const id = match?.[1];
	const extension = match?.[2]?.toLowerCase();
	const mediaType = extension === void 0 ? void 0 : audioMediaTypeOfExtension(extension);
	if (id === void 0 || extension === void 0 || mediaType === void 0) return void 0;
	return {
		id,
		extension,
		mediaType
	};
}
/**
* Serve one stored audio file.
* @param file - the storage path.
* @param mediaType - the audio media type to respond with.
* @param res - the response to write.
*/
async function serveAudio(file, mediaType, res) {
	try {
		const data = await readFile(file);
		res.writeHead(200, {
			"content-type": mediaType,
			"cache-control": "private, max-age=31536000, immutable"
		});
		res.end(data);
	} catch (error) {
		if (error.code === "ENOENT") {
			res.writeHead(404);
			res.end("not found");
			return;
		}
		res.writeHead(500);
		res.end("read failed");
	}
}
/**
* Accept one uploaded audio file, bounded by {@link MAX_AUDIO_BYTES}.
* @param file - the storage path.
* @param req - the upload request whose body is the audio bytes.
* @param res - the response to write.
*/
async function storeAudio(file, req, res) {
	const chunks = [];
	let total = 0;
	let oversized = false;
	for await (const chunk of req) {
		const bytes = chunk;
		total += bytes.byteLength;
		if (total > 1048576) {
			oversized = true;
			break;
		}
		chunks.push(bytes);
	}
	if (oversized) {
		req.resume();
		res.writeHead(413);
		res.end("too large");
		return;
	}
	const declared = req.headers["content-type"]?.split(";", 1)[0]?.trim().toLowerCase();
	if (declared === void 0 || !declared.startsWith("audio/")) {
		res.writeHead(415);
		res.end("unsupported media type");
		return;
	}
	try {
		await mkdir(audioStorageDir(), { recursive: true });
		await writeFile(file, Buffer.concat(chunks));
		res.writeHead(204);
		res.end();
	} catch {
		res.writeHead(500);
		res.end("write failed");
	}
}
/**
* Remove one stored audio file.
* @param file - the storage path.
* @param res - the response to write.
*/
async function deleteAudio(file, res) {
	try {
		await unlink(file);
		res.writeHead(204);
		res.end();
	} catch (error) {
		if (error.code === "ENOENT") {
			res.writeHead(404);
			res.end("not found");
			return;
		}
		res.writeHead(500);
		res.end("delete failed");
	}
}
/**
* The stored file name one served URL references, or undefined when the URL
* does not point into this store (empty, an http(s)/data URL, or a tail this
* route cannot parse).
* @param url - the setting's `customAudioUrl` value.
* @returns the `<id>.<ext>` file name, or undefined for a non-hosted reference.
*/
function hostedFileName(url) {
	if (!url.startsWith(`/_dsh-ui-notify/audio/`)) return void 0;
	const parsed = parseTail(url.slice(21));
	return parsed === void 0 ? void 0 : `${parsed.id}.${parsed.extension}`;
}
/**
* Retention sweep: remove every stored audio file not referenced by the
* current custom-audio setting. The setting's `customAudioUrl` is the only
* reference into this store — anything else is an orphan (a hand-edited
* setting, an upload whose settings write never landed, or a failed eager
* cleanup) and is deleted. Only files matching the canonical id pattern are
* ever touched; foreign content in the directory is left alone. An absent
* directory sweeps nothing; a non-ENOENT read or unlink failure throws so the
* caller can surface it.
* @param referencedUrl - the current `customAudioUrl` setting value.
* @returns how many files were removed.
*/
async function sweepOrphanedAudio(referencedUrl) {
	const referenced = referencedUrl === void 0 ? void 0 : hostedFileName(referencedUrl);
	const dir = audioStorageDir();
	let removed = 0;
	try {
		const entries = await readdir(dir, { withFileTypes: true });
		for (const entry of entries) {
			if (!entry.isFile()) continue;
			if (parseTail(`/${entry.name}`) === void 0 || entry.name === referenced) continue;
			try {
				await unlink(join(dir, entry.name));
				removed += 1;
			} catch (error) {
				if (error.code !== "ENOENT") throw error;
			}
		}
	} catch (error) {
		if (error.code === "ENOENT") return 0;
		throw error;
	}
	return removed;
}
/**
* The route handler: id+extension parsing first, then the method dispatch.
* Trust fencing happens in the route registration (apply below) via the core
* `connection.requestRejection()` — by the time a request reaches here it has
* already passed the Host/Origin and browser-auth fence. Any parse failure is
* a plain 404 — no user content reaches the filesystem without a valid id.
* @param req - the incoming request.
* @param res - the response to write.
*/
async function handleAudioRequest(req, res) {
	const pathname = new URL(
		/* v8 ignore next 1 -- node:http always sets url on server requests */
		req.url ?? "/",
		"http://local"
	).pathname;
	if (!pathname.startsWith(`/_dsh-ui-notify/audio/`)) {
		res.writeHead(404);
		res.end("not found");
		return;
	}
	const parsed = parseTail(pathname.slice(21));
	if (parsed === void 0) {
		res.writeHead(404);
		res.end("not found");
		return;
	}
	const file = join(audioStorageDir(), `${parsed.id}.${parsed.extension}`);
	switch (req.method) {
		case "GET": return serveAudio(file, parsed.mediaType, res);
		case "PUT": return storeAudio(file, req, res);
		case "DELETE": return deleteAudio(file, res);
		default:
			res.writeHead(405);
			res.end("method not allowed");
			return;
	}
}
//#endregion
//#region lib/types/index.js
/**
* Host registration for the notification plugin: exposes the durable
* `ui-notify` settings namespace so the browser row can read and write it,
* serves the user-picked custom audio through a trust-fenced webServer route
* (`/_dsh-ui-notify/audio/<id>.<ext>`) so file bytes never enter the settings
* document, and sweeps orphaned hosted audio on activation.
*/
// dsh 0.1.2-alpha: settings.register() takes the namespace string directly
// (the old settingsNamespace() wrapper is gone from dsh-settings).
const NOTIFY_NAMESPACE = NOTIFY_SETTINGS_NAMESPACE;
/**
* Register the durable notification section when the settings provider is
* composed (the browser row's scope reads and writes through this namespace),
* the user-audio route when an HTTP server is composed, and — once the
* section is registered — sweep hosted audio the setting no longer references.
* @param ctx - Host context that may acquire settings and HTTP services.
*/
function apply(ctx) {
	ctx.inject(["settings"], (settingsCtx) => {
		sweepOrphanedAudio(settingsCtx.settings.register(NOTIFY_NAMESPACE, NotifySettingsSchema).get().customAudioUrl).catch((error) => {
			settingsCtx.logger.warn("client-ui-notify: audio retention sweep failed", error);
		});
	});
	// Fenced like the core /api prefix: dsh 0.1.2-alpha no longer exports the
	// raw `isTrustedApiRequest` helper — the fence now lives on the `connection`
	// service as `requestRejection()` (Host/Origin trust + browser auth).
	ctx.inject(["connection", "webServer"], (httpCtx) => {
		httpCtx.effect(() => httpCtx.webServer.register({
			kind: "prefix",
			path: AUDIO_URL_PREFIX,
			handler: async (req, res) => {
				const rejection = httpCtx.connection.requestRejection(req);
				if (rejection !== void 0) {
					res.writeHead(rejection);
					res.end(rejection === 401 ? "unauthorized" : "forbidden");
					return;
				}
				await handleAudioRequest(req, res);
			}
		}), "client-ui-notify: user-audio route");
	});
}
//#endregion
export { AUDIO_EXTENSION_MEDIA_TYPES, AUDIO_ID_PATTERN, AUDIO_URL_PREFIX, DEFAULT_NOTIFY_SETTINGS, MAX_AUDIO_BYTES, NOTIFY_FIELDS, NOTIFY_METHODS, NOTIFY_SETTINGS_NAMESPACE, apply, audioExtensionOfMediaType, audioMediaTypeOfExtension, audioStorageDir, handleAudioRequest, isNotifyMethod, sweepOrphanedAudio };
