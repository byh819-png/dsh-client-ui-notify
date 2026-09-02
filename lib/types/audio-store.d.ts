import type { IncomingMessage, ServerResponse } from 'node:http';
/**
 * Absolute directory holding user-picked audio files.
 * @returns the per-id file directory under the Harness home.
 */
export declare function audioStorageDir(): string;
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
export declare function sweepOrphanedAudio(referencedUrl: string | undefined): Promise<number>;
/**
 * The route handler: trust fence first, then id+extension parsing, then the
 * method dispatch. Any parse or trust failure is a plain 403/404 — no user
 * content reaches the filesystem without a valid id.
 * @param req - the incoming request.
 * @param res - the response to write.
 */
export declare function handleAudioRequest(req: IncomingMessage, res: ServerResponse): Promise<void>;
//# sourceMappingURL=audio-store.d.ts.map