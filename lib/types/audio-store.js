/**
 * Host-side user-audio store for the notification plugin: the custom-method
 * local file lands here instead of bloating the settings document with a data
 * URL. One file per id under `$DSH_HOME/storages/ui-notify/audio`, served,
 * uploaded, and deleted through a webServer prefix route guarded by the same
 * trust fence as `/api` (loopback-only: `isTrustedApiRequest` with an empty
 * trust list, exactly the pin the /api privileged methods use). A retention
 * sweep at host activation removes files no longer referenced by the setting.
 */
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isTrustedApiRequest } from '@deepseek-ai/dsh-client-connection';
import { dshHomePath } from '@deepseek-ai/dsh-home-paths';
import { AUDIO_URL_PREFIX, MAX_AUDIO_BYTES, audioMediaTypeOfExtension, } from "./notify-settings.js";
/** Storage root relative to `$DSH_HOME/storages`. */
const AUDIO_STORAGE_REL = join('ui-notify', 'audio');
/**
 * Absolute directory holding user-picked audio files.
 * @returns the per-id file directory under the Harness home.
 */
export function audioStorageDir() {
    return join(dshHomePath('storages'), AUDIO_STORAGE_REL);
}
/** One route tail: `/<uuid>.<ext>` with a whitelisted extension. */
const AUDIO_TAIL_PATTERN = new RegExp('^/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\.([a-z0-9]{2,5})$', 'iu');
/** Whether the tail parses to a known audio id + extension pair (the tail regex pins the id to a canonical UUID). */
function parseTail(tail) {
    const match = AUDIO_TAIL_PATTERN.exec(tail);
    const id = match?.[1];
    const extension = match?.[2]?.toLowerCase();
    const mediaType = extension === undefined ? undefined : audioMediaTypeOfExtension(extension);
    if (id === undefined || extension === undefined || mediaType === undefined)
        return undefined;
    return { id, extension, mediaType };
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
            'content-type': mediaType,
            // The id names the content, so the file is immutable until replaced.
            'cache-control': 'private, max-age=31536000, immutable',
        });
        res.end(data);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            res.writeHead(404);
            res.end('not found');
            return;
        }
        res.writeHead(500);
        res.end('read failed');
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
        if (total > MAX_AUDIO_BYTES) {
            oversized = true;
            break;
        }
        chunks.push(bytes);
    }
    if (oversized) {
        // Drain the rest so the connection is reusable; the response already rejects.
        req.resume();
        res.writeHead(413);
        res.end('too large');
        return;
    }
    const declared = req.headers['content-type']?.split(';', 1)[0]?.trim().toLowerCase();
    if (declared === undefined || !declared.startsWith('audio/')) {
        res.writeHead(415);
        res.end('unsupported media type');
        return;
    }
    try {
        await mkdir(audioStorageDir(), { recursive: true });
        await writeFile(file, Buffer.concat(chunks));
        res.writeHead(204);
        res.end();
    }
    catch {
        res.writeHead(500);
        res.end('write failed');
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
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            res.writeHead(404);
            res.end('not found');
            return;
        }
        res.writeHead(500);
        res.end('delete failed');
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
    if (!url.startsWith(`${AUDIO_URL_PREFIX}/`))
        return undefined;
    const parsed = parseTail(url.slice(AUDIO_URL_PREFIX.length));
    return parsed === undefined ? undefined : `${parsed.id}.${parsed.extension}`;
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
export async function sweepOrphanedAudio(referencedUrl) {
    const referenced = referencedUrl === undefined ? undefined : hostedFileName(referencedUrl);
    const dir = audioStorageDir();
    let removed = 0;
    try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isFile())
                continue;
            const parsed = parseTail(`/${entry.name}`);
            if (parsed === undefined || entry.name === referenced)
                continue;
            try {
                await unlink(join(dir, entry.name));
                removed += 1;
            }
            catch (error) {
                // A file already gone (an eager row delete racing the sweep) is fine;
                // any other failure is real and surfaces.
                if (error.code !== 'ENOENT')
                    throw error;
            }
        }
    }
    catch (error) {
        // An absent directory sweeps nothing; any other read failure is real.
        if (error.code === 'ENOENT')
            return 0;
        throw error;
    }
    return removed;
}
/**
 * The route handler: trust fence first, then id+extension parsing, then the
 * method dispatch. Any parse or trust failure is a plain 403/404 — no user
 * content reaches the filesystem without a valid id.
 * @param req - the incoming request.
 * @param res - the response to write.
 */
export async function handleAudioRequest(req, res) {
    if (!isTrustedApiRequest(req, [])) {
        res.writeHead(403);
        res.end('forbidden');
        return;
    }
    const pathname = new URL(
    /* v8 ignore next 1 -- node:http always sets url on server requests */
    req.url ?? '/', 'http://local').pathname;
    if (!pathname.startsWith(`${AUDIO_URL_PREFIX}/`)) {
        res.writeHead(404);
        res.end('not found');
        return;
    }
    const parsed = parseTail(pathname.slice(AUDIO_URL_PREFIX.length));
    if (parsed === undefined) {
        res.writeHead(404);
        res.end('not found');
        return;
    }
    const file = join(audioStorageDir(), `${parsed.id}.${parsed.extension}`);
    switch (req.method) {
        case 'GET': return serveAudio(file, parsed.mediaType, res);
        case 'PUT': return storeAudio(file, req, res);
        case 'DELETE': return deleteAudio(file, res);
        default:
            res.writeHead(405);
            res.end('method not allowed');
            return;
    }
}
//# sourceMappingURL=audio-store.js.map