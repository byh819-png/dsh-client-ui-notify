window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-notify",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let react_dom = require("react-dom");
		//#region ../../../vendor/cosmokit/lib/index.js
		/** Return true when a value is `null` or `undefined`. */
		function isNullable(value) {
			return value === null || value === void 0;
		}
		/** Return true for non-array object values. */
		function isPlainObject(data) {
			return data && typeof data === "object" && !Array.isArray(data);
		}
		/** Filter object entries and return a new object. */
		function filterKeys(object, filter) {
			return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
		}
		/** Map object values while preserving the original key set. */
		function mapValues(object, transform) {
			return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
		}
		/** Pick selected keys from an object, optionally including `undefined` values. */
		function pick(source, keys, forced) {
			if (!keys) return { ...source };
			const result = {};
			for (const key of keys) if (forced || source[key] !== void 0) result[key] = source[key];
			return result;
		}
		/** Test values using `instanceof` with a `toStringTag` fallback. */
		function is(type, value) {
			if (arguments.length === 1) return (value) => is(type, value);
			return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
		}
		function isArrayBufferLike(value) {
			return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
		}
		function isArrayBufferSource(value) {
			return isArrayBufferLike(value) || ArrayBuffer.isView(value);
		}
		/** Binary source detection and base64/hex conversion helpers. */
		var Binary;
		(function(Binary) {
			Binary.is = isArrayBufferLike;
			Binary.isSource = isArrayBufferSource;
			function fromSource(source) {
				if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
				else return source;
			}
			Binary.fromSource = fromSource;
			function toBase64(source) {
				source = fromSource(source);
				if (typeof Buffer !== "undefined") return Buffer.from(source).toString("base64");
				let binary = "";
				const bytes = new Uint8Array(source);
				for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
				return btoa(binary);
			}
			Binary.toBase64 = toBase64;
			function fromBase64(source) {
				if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
				return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
			}
			Binary.fromBase64 = fromBase64;
			function toHex(source) {
				source = fromSource(source);
				if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
				return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
			}
			Binary.toHex = toHex;
			function fromHex(source) {
				if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
				const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
				const buffer = [];
				for (let i = 0; i < hex.length; i += 2) buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
				return Uint8Array.from(buffer).buffer;
			}
			Binary.fromHex = fromHex;
		})(Binary || (Binary = {}));
		Binary.fromBase64;
		Binary.toBase64;
		Binary.fromHex;
		Binary.toHex;
		/** Deep-clone common JavaScript values while preserving prototypes and cycles. */
		function clone(source, refs = /* @__PURE__ */ new Map()) {
			if (!source || typeof source !== "object") return source;
			if (is("Date", source)) return new Date(source.valueOf());
			if (is("RegExp", source)) return new RegExp(source.source, source.flags);
			if (isArrayBufferLike(source)) return source.slice(0);
			if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
			const cached = refs.get(source);
			if (cached) return cached;
			if (Array.isArray(source)) {
				const result = [];
				refs.set(source, result);
				source.forEach((value, index) => {
					result[index] = Reflect.apply(clone, null, [value, refs]);
				});
				return result;
			}
			const result = Object.create(Object.getPrototypeOf(source));
			refs.set(source, result);
			for (const key of Reflect.ownKeys(source)) {
				const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
				if ("value" in descriptor) descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
				Reflect.defineProperty(result, key, descriptor);
			}
			return result;
		}
		/** Deeply compare arrays, dates, regexps, buffers, and plain object fields. */
		function deepEqual(a, b, strict) {
			if (a === b) return true;
			if (!strict && isNullable(a) && isNullable(b)) return true;
			if (typeof a !== typeof b) return false;
			if (typeof a !== "object") return false;
			if (!a || !b) return false;
			function check(test, then) {
				return test(a) ? test(b) ? then(a, b) : false : test(b) ? false : void 0;
			}
			return check(Array.isArray, (a, b) => a.length === b.length && a.every((item, index) => deepEqual(item, b[index]))) ?? check(is("Date"), (a, b) => a.valueOf() === b.valueOf()) ?? check(is("RegExp"), (a, b) => a.source === b.source && a.flags === b.flags) ?? check(isArrayBufferLike, (a, b) => {
				if (a.byteLength !== b.byteLength) return false;
				const viewA = new Uint8Array(a);
				const viewB = new Uint8Array(b);
				for (let i = 0; i < viewA.length; i++) if (viewA[i] !== viewB[i]) return false;
				return true;
			}) ?? Object.keys({
				...a,
				...b
			}).every((key) => deepEqual(a[key], b[key], strict));
		}
		/** Time constants plus parsing and formatting helpers. */
		var Time;
		(function(Time) {
			Time.millisecond = 1;
			Time.second = 1e3;
			Time.minute = Time.second * 60;
			Time.hour = Time.minute * 60;
			Time.day = Time.hour * 24;
			Time.week = Time.day * 7;
			let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
			function setTimezoneOffset(offset) {
				timezoneOffset = offset;
			}
			Time.setTimezoneOffset = setTimezoneOffset;
			function getTimezoneOffset() {
				return timezoneOffset;
			}
			Time.getTimezoneOffset = getTimezoneOffset;
			function getDateNumber(date = /* @__PURE__ */ new Date(), offset) {
				if (typeof date === "number") date = new Date(date);
				if (offset === void 0) offset = timezoneOffset;
				return Math.floor((date.valueOf() / Time.minute - offset) / 1440);
			}
			Time.getDateNumber = getDateNumber;
			function fromDateNumber(value, offset) {
				const date = new Date(value * Time.day);
				if (offset === void 0) offset = timezoneOffset;
				return new Date(+date + offset * Time.minute);
			}
			Time.fromDateNumber = fromDateNumber;
			const numeric = /\d+(?:\.\d+)?/.source;
			const timeRegExp = new RegExp(`^${[
				"w(?:eek(?:s)?)?",
				"d(?:ay(?:s)?)?",
				"h(?:our(?:s)?)?",
				"m(?:in(?:ute)?(?:s)?)?",
				"s(?:ec(?:ond)?(?:s)?)?"
			].map((unit) => `(${numeric}${unit})?`).join("")}$`);
			function parseTime(source) {
				const capture = timeRegExp.exec(source);
				if (!capture) return 0;
				return (parseFloat(capture[1]) * Time.week || 0) + (parseFloat(capture[2]) * Time.day || 0) + (parseFloat(capture[3]) * Time.hour || 0) + (parseFloat(capture[4]) * Time.minute || 0) + (parseFloat(capture[5]) * Time.second || 0);
			}
			Time.parseTime = parseTime;
			function parseDate(date) {
				const parsed = parseTime(date);
				if (parsed) date = Date.now() + parsed;
				else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date}`;
				else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date}`;
				return date ? new Date(date) : /* @__PURE__ */ new Date();
			}
			Time.parseDate = parseDate;
			function format(ms) {
				const abs = Math.abs(ms);
				if (abs >= Time.day - Time.hour / 2) return Math.round(ms / Time.day) + "d";
				else if (abs >= Time.hour - Time.minute / 2) return Math.round(ms / Time.hour) + "h";
				else if (abs >= Time.minute - Time.second / 2) return Math.round(ms / Time.minute) + "m";
				else if (abs >= Time.second) return Math.round(ms / Time.second) + "s";
				return ms + "ms";
			}
			Time.format = format;
			function toDigits(source, length = 2) {
				return source.toString().padStart(length, "0");
			}
			Time.toDigits = toDigits;
			function template(template, time = /* @__PURE__ */ new Date()) {
				return template.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
			}
			Time.template = template;
		})(Time || (Time = {}));
		//#endregion
		//#region ../../../vendor/schemastery/lib/index.mjs
		const kSchema = Symbol.for("schemastery");
		const kValidationError = Symbol.for("ValidationError");
		globalThis.__schemastery_index__ ??= 0;
		globalThis.__schemastery_refs__ = void 0;
		var ValidationError = class extends TypeError {
			options;
			name = "ValidationError";
			constructor(message, options) {
				let prefix = "$";
				for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
				else if (typeof segment === "number") prefix += "[" + segment + "]";
				else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
				if (prefix.startsWith(".")) prefix = prefix.slice(1);
				super((prefix === "$" ? "" : `${prefix} `) + message);
				this.options = options;
			}
			static is(error) {
				return !!error?.[kValidationError];
			}
		};
		Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
		const Schema = function(options) {
			const schema = function(data, options = {}) {
				return Schema.resolve(data, schema, options)[0];
			};
			if (options.refs) {
				const refs = mapValues(options.refs, (options) => new Schema(options));
				const getRef = (uid) => refs[uid];
				for (const key in refs) {
					const options = refs[key];
					options.sKey = getRef(options.sKey);
					options.inner = getRef(options.inner);
					options.list = options.list && options.list.map(getRef);
					options.dict = options.dict && mapValues(options.dict, getRef);
				}
				return refs[options.uid];
			}
			Object.assign(schema, options);
			if (typeof schema.callback === "string") try {
				schema.callback = new Function("return " + schema.callback)();
			} catch {}
			Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
			Object.setPrototypeOf(schema, Schema.prototype);
			schema.meta ||= {};
			schema.toString = schema.toString.bind(schema);
			return schema;
		};
		Schema.prototype = Object.create(Function.prototype);
		Schema.prototype[kSchema] = true;
		Object.defineProperty(Schema.prototype, "~standard", { get() {
			return {
				version: 1,
				vendor: "schemastery",
				validate: (value) => {
					try {
						return { value: Schema.resolve(value, this, {})[0] };
					} catch (error) {
						if (ValidationError.is(error)) return { issues: [{
							message: error.message,
							path: error.options.path
						}] };
						throw error;
					}
				}
			};
		} });
		Schema.ValidationError = ValidationError;
		Schema.prototype.toJSON = function toJSON() {
			if (globalThis.__schemastery_refs__) {
				globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
				return this.uid;
			}
			globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
			globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
			const result = {
				uid: this.uid,
				refs: globalThis.__schemastery_refs__
			};
			globalThis.__schemastery_refs__ = void 0;
			return result;
		};
		Schema.prototype.set = function set(key, value) {
			this.dict[key] = value;
			return this;
		};
		Schema.prototype.push = function push(value) {
			this.list.push(value);
			return this;
		};
		function mergeDesc(original, messages) {
			const result = typeof original === "string" ? { "": original } : { ...original };
			for (const locale in messages) {
				const value = messages[locale];
				if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
				else if (typeof value === "string") result[locale] = value;
			}
			return result;
		}
		function getInner(value) {
			return value?.$value ?? value?.$inner;
		}
		function extractKeys(data) {
			return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
		}
		Schema.prototype.i18n = function i18n(messages) {
			const schema = Schema(this);
			const desc = mergeDesc(schema.meta.description, messages);
			if (Object.keys(desc).length) schema.meta.description = desc;
			if (schema.dict) schema.dict = mapValues(schema.dict, (inner, key) => {
				return inner.i18n(mapValues(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
			});
			if (schema.list) schema.list = schema.list.map((inner, index) => {
				return inner.i18n(mapValues(messages, (data = {}) => {
					if (Array.isArray(getInner(data))) return getInner(data)[index];
					if (Array.isArray(data)) return data[index];
					return extractKeys(data);
				}));
			});
			if (schema.inner) schema.inner = schema.inner.i18n(mapValues(messages, (data) => {
				if (getInner(data)) return getInner(data);
				return extractKeys(data);
			}));
			if (schema.sKey) schema.sKey = schema.sKey.i18n(mapValues(messages, (data) => data?.$key));
			return schema;
		};
		Schema.prototype.extra = function extra(key, value) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		};
		for (const key of [
			"required",
			"disabled",
			"collapse",
			"hidden",
			"loose"
		]) Object.assign(Schema.prototype, { [key](value = true) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		} });
		Schema.prototype.deprecated = function deprecated() {
			const schema = Schema(this);
			schema.meta.badges ||= [];
			schema.meta.badges.push({
				text: "deprecated",
				type: "danger"
			});
			return schema;
		};
		Schema.prototype.experimental = function experimental() {
			const schema = Schema(this);
			schema.meta.badges ||= [];
			schema.meta.badges.push({
				text: "experimental",
				type: "warning"
			});
			return schema;
		};
		Schema.prototype.pattern = function pattern(regexp) {
			const schema = Schema(this);
			const pattern = pick(regexp, ["source", "flags"]);
			schema.meta = {
				...schema.meta,
				pattern
			};
			return schema;
		};
		Schema.prototype.simplify = function simplify(value) {
			if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
			if (isNullable(value)) return value;
			if (this.type === "object" || this.type === "dict") {
				const result = {};
				for (const key in value) {
					const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
					if (this.type === "dict" || !isNullable(item)) result[key] = item;
				}
				if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
				return result;
			} else if (this.type === "array" || this.type === "tuple") {
				const result = [];
				value.forEach((value, index) => {
					const schema = this.type === "array" ? this.inner : this.list[index];
					const item = schema ? schema.simplify(value) : value;
					result.push(item);
				});
				return result;
			} else if (this.type === "intersect") {
				const result = {};
				for (const item of this.list) Object.assign(result, item.simplify(value));
				return result;
			} else if (this.type === "union") for (const schema of this.list) try {
				Schema.resolve(value, schema, {});
				return schema.simplify(value);
			} catch {}
			return value;
		};
		Schema.prototype.toString = function toString(inline) {
			return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
		};
		Schema.prototype.role = function role(role, extra) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				role,
				extra
			};
			return schema;
		};
		for (const key of [
			"default",
			"link",
			"comment",
			"description",
			"max",
			"min",
			"step"
		]) Object.assign(Schema.prototype, { [key](value) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		} });
		const resolvers = {};
		Schema.extend = function extend(type, resolve) {
			resolvers[type] = resolve;
		};
		Schema.resolve = function resolve(data, schema, options = {}, strict = false) {
			if (!schema) return [data];
			if (options.ignore?.(data, schema)) return [data];
			if (isNullable(data) && schema.type !== "lazy") {
				if (schema.meta.required) throw new ValidationError(`missing required value`, options);
				let current = schema;
				let fallback = schema.meta.default;
				while (current?.type === "intersect" && isNullable(fallback)) {
					current = current.list[0];
					fallback = current?.meta.default;
				}
				if (isNullable(fallback)) return [data];
				data = clone(fallback);
			}
			const callback = resolvers[schema.type];
			if (!callback) throw new ValidationError(`unsupported type "${schema.type}"`, options);
			try {
				return callback(data, schema, options, strict);
			} catch (error) {
				if (!schema.meta.loose) throw error;
				return [schema.meta.default];
			}
		};
		Schema.from = function from(source) {
			if (isNullable(source)) return Schema.any();
			else if ([
				"string",
				"number",
				"boolean"
			].includes(typeof source)) return Schema.const(source).required();
			else if (source[kSchema]) return source;
			else if (typeof source === "function") switch (source) {
				case String: return Schema.string().required();
				case Number: return Schema.number().required();
				case Boolean: return Schema.boolean().required();
				case Function: return Schema.function().required();
				default: return Schema.is(source).required();
			}
			else throw new TypeError(`cannot infer schema from ${source}`);
		};
		Schema.lazy = function lazy(builder) {
			const toJSON = () => {
				if (!schema.inner[kSchema]) {
					schema.inner = schema.builder();
					schema.inner.meta = {
						...schema.meta,
						...schema.inner.meta
					};
				}
				return schema.inner.toJSON();
			};
			const schema = new Schema({
				type: "lazy",
				builder,
				inner: { toJSON }
			});
			return schema;
		};
		Schema.natural = function natural() {
			return Schema.number().step(1).min(0);
		};
		Schema.percent = function percent() {
			return Schema.number().step(.01).min(0).max(1).role("slider");
		};
		Schema.date = function date() {
			return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
				const date = new Date(value);
				if (isNaN(+date)) throw new ValidationError(`invalid date "${value}"`, options);
				return date;
			}, true)]);
		};
		Schema.regExp = function regExp(flag = "") {
			return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
				try {
					return new RegExp(value, flag);
				} catch (e) {
					throw new ValidationError(e.message, options);
				}
			}, true)]);
		};
		Schema.arrayBuffer = function arrayBuffer(encoding) {
			return Schema.union([
				Schema.is(ArrayBuffer),
				Schema.is(SharedArrayBuffer),
				Schema.transform(Schema.any(), (value, options) => {
					if (Binary.isSource(value)) return Binary.fromSource(value);
					throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
				}, true),
				...encoding ? [Schema.transform(Schema.string(), (value, options) => {
					try {
						return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
					} catch (e) {
						throw new ValidationError(e.message, options);
					}
				}, true)] : []
			]);
		};
		Schema.extend("lazy", (data, schema, options, strict) => {
			if (!schema.inner[kSchema]) {
				schema.inner = schema.builder();
				schema.inner.meta = {
					...schema.meta,
					...schema.inner.meta
				};
			}
			return Schema.resolve(data, schema.inner, options, strict);
		});
		Schema.extend("any", (data) => {
			return [data];
		});
		Schema.extend("never", (data, _, options) => {
			throw new ValidationError(`expected nullable but got ${data}`, options);
		});
		Schema.extend("const", (data, { value }, options) => {
			if (deepEqual(data, value)) return [value];
			throw new ValidationError(`expected ${value} but got ${data}`, options);
		});
		function checkWithinRange(data, meta, description, options, skipMin = false) {
			const { max = Infinity, min = -Infinity } = meta;
			if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
			if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
		}
		Schema.extend("string", (data, { meta }, options) => {
			if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
			if (meta.pattern) {
				const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
				if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
			}
			checkWithinRange(data.length, meta, "string length", options);
			return [data];
		});
		function decimalShift(data, digits) {
			const str = data.toString();
			if (str.includes("e")) return data * Math.pow(10, digits);
			const index = str.indexOf(".");
			if (index === -1) return data * Math.pow(10, digits);
			const frac = str.slice(index + 1);
			const integer = str.slice(0, index);
			if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
			return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
		}
		function isMultipleOf(data, min, step) {
			step = Math.abs(step);
			if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
			const index = step.toString().indexOf(".");
			const digits = step.toString().slice(index + 1).length;
			return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
		}
		Schema.extend("number", (data, { meta }, options) => {
			if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
			checkWithinRange(data, meta, "number", options);
			const { step } = meta;
			if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
			return [data];
		});
		Schema.extend("boolean", (data, _, options) => {
			if (typeof data === "boolean") return [data];
			throw new ValidationError(`expected boolean but got ${data}`, options);
		});
		Schema.extend("bitset", (data, { bits, meta }, options) => {
			let value = 0, keys = [];
			if (typeof data === "number") {
				value = data;
				for (const key in bits) if (data & bits[key]) keys.push(key);
			} else if (Array.isArray(data)) {
				keys = data;
				for (const key of keys) {
					if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
					if (key in bits) value |= bits[key];
				}
			} else throw new ValidationError(`expected number or array but got ${data}`, options);
			if (value === meta.default) return [value];
			return [value, keys];
		});
		Schema.extend("function", (data, _, options) => {
			if (typeof data === "function") return [data];
			throw new ValidationError(`expected function but got ${data}`, options);
		});
		Schema.extend("is", (data, { constructor }, options) => {
			if (typeof constructor === "function") {
				if (data instanceof constructor) return [data];
				throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
			} else {
				if (isNullable(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
				let prototype = Object.getPrototypeOf(data);
				while (prototype) {
					if (prototype.constructor?.name === constructor) return [data];
					prototype = Object.getPrototypeOf(prototype);
				}
				throw new ValidationError(`expected ${constructor} but got ${data}`, options);
			}
		});
		function property(data, key, schema, options) {
			try {
				const [value, adapted] = Schema.resolve(data[key], schema, {
					...options,
					path: [...options.path || [], key]
				});
				if (adapted !== void 0) data[key] = adapted;
				return value;
			} catch (e) {
				if (!options?.autofix) throw e;
				delete data[key];
				return schema.meta.default;
			}
		}
		Schema.extend("array", (data, { inner, meta }, options) => {
			if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
			checkWithinRange(data.length, meta, "array length", options, !isNullable(inner.meta.default));
			return [data.map((_, index) => property(data, index, inner, options))];
		});
		Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
			if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
			const result = {};
			for (const key in data) {
				let rKey;
				try {
					rKey = Schema.resolve(key, sKey, options)[0];
				} catch (error) {
					if (strict) continue;
					throw error;
				}
				result[rKey] = property(data, key, inner, options);
				data[rKey] = data[key];
				if (key !== rKey) delete data[key];
			}
			return [result];
		});
		Schema.extend("tuple", (data, { list }, options, strict) => {
			if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
			const result = list.map((inner, index) => property(data, index, inner, options));
			if (strict) return [result];
			result.push(...data.slice(list.length));
			return [result];
		});
		function merge(result, data) {
			for (const key in data) {
				if (key in result) continue;
				result[key] = data[key];
			}
		}
		Schema.extend("object", (data, { dict }, options, strict) => {
			if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
			const result = {};
			for (const key in dict) {
				const value = property(data, key, dict[key], options);
				if (!isNullable(value) || key in data) result[key] = value;
			}
			if (!strict) merge(result, data);
			return [result];
		});
		Schema.extend("union", (data, { list, toString }, options, strict) => {
			const messages = [];
			for (const inner of list) try {
				return Schema.resolve(data, inner, options, strict);
			} catch (error) {
				messages.push(error);
			}
			throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
		});
		Schema.extend("intersect", (data, { list, toString }, options, strict) => {
			if (!list.length) return [data];
			let result;
			for (const inner of list) {
				const value = Schema.resolve(data, inner, options, true)[0];
				if (isNullable(value)) continue;
				if (isNullable(result)) result = value;
				else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
				else if (typeof value === "object") merge(result ??= {}, value);
				else if (result !== value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
			}
			if (!strict && isPlainObject(data)) merge(result, data);
			return [result];
		});
		Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
			const [result, adapted = data] = Schema.resolve(data, inner, options, true);
			if (preserve) return [callback(result)];
			else return [callback(result), callback(adapted)];
		});
		const formatters = {};
		function defineMethod(name, keys, format) {
			formatters[name] = format;
			Object.assign(Schema, { [name](...args) {
				const schema = new Schema({ type: name });
				keys.forEach((key, index) => {
					switch (key) {
						case "sKey":
							schema.sKey = args[index] ?? Schema.string();
							break;
						case "inner":
							schema.inner = Schema.from(args[index]);
							break;
						case "list":
							schema.list = args[index].map(Schema.from);
							break;
						case "dict":
							schema.dict = mapValues(args[index], Schema.from);
							break;
						case "bits":
							schema.bits = {};
							for (const key in args[index]) {
								if (typeof args[index][key] !== "number") continue;
								schema.bits[key] = args[index][key];
							}
							break;
						case "callback": {
							const callback = schema.callback = args[index];
							callback["toJSON"] ||= () => callback.toString();
							break;
						}
						case "constructor": {
							const constructor = schema.constructor = args[index];
							if (typeof constructor === "function") constructor["toJSON"] ||= () => constructor["name"];
							break;
						}
						default: schema[key] = args[index];
					}
				});
				if (name === "object" || name === "dict") schema.meta.default = {};
				else if (name === "array" || name === "tuple") schema.meta.default = [];
				else if (name === "bitset") schema.meta.default = 0;
				return schema;
			} });
		}
		defineMethod("is", ["constructor"], ({ constructor }) => {
			if (typeof constructor === "function") return constructor.name;
			else return constructor;
		});
		defineMethod("any", [], () => "any");
		defineMethod("never", [], () => "never");
		defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
		defineMethod("string", [], () => "string");
		defineMethod("number", [], () => "number");
		defineMethod("boolean", [], () => "boolean");
		defineMethod("bitset", ["bits"], () => "bitset");
		defineMethod("function", [], () => "function");
		defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
		defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
		defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
		defineMethod("object", ["dict"], ({ dict }) => {
			if (Object.keys(dict).length === 0) return "{}";
			return `{ ${Object.entries(dict).map(([key, inner]) => {
				return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
			}).join(", ")} }`;
		});
		defineMethod("union", ["list"], ({ list }, inline) => {
			const result = list.map(({ toString: format }) => format()).join(" | ");
			return inline ? `(${result})` : result;
		});
		defineMethod("intersect", ["list"], ({ list }) => {
			return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
		});
		defineMethod("transform", [
			"inner",
			"callback",
			"preserve"
		], ({ inner }, isInner) => inner.toString(isInner));
		//#endregion
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
		Schema.object({
			[NOTIFY_FIELDS.enabled]: Schema.boolean().default(DEFAULT_NOTIFY_SETTINGS.enabled),
			[NOTIFY_FIELDS.systemNotify]: Schema.boolean().default(DEFAULT_NOTIFY_SETTINGS.systemNotify),
			[NOTIFY_FIELDS.onAnswerComplete]: Schema.boolean().default(DEFAULT_NOTIFY_SETTINGS.onAnswerComplete),
			[NOTIFY_FIELDS.onAuthRequired]: Schema.boolean().default(DEFAULT_NOTIFY_SETTINGS.onAuthRequired),
			[NOTIFY_FIELDS.method]: Schema.union([...NOTIFY_METHODS]).default(DEFAULT_NOTIFY_SETTINGS.method),
			[NOTIFY_FIELDS.ttsText]: Schema.string().default(DEFAULT_NOTIFY_SETTINGS.ttsText),
			[NOTIFY_FIELDS.customAudioUrl]: Schema.string().default(DEFAULT_NOTIFY_SETTINGS.customAudioUrl)
		});
		//#endregion
		//#region lib/types/client/locales.js
		/** `settings.notify` namespace dictionaries (the notification row's copy). */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"notify.enabled": "启用提醒",
			"notify.systemNotify": "系统通知",
			"notify.system.answerComplete": "回答已完成",
			"notify.system.authRequired": "需要授权",
			"notify.system.granted": "已开启系统通知",
			"notify.system.denied": "系统通知权限被拒绝",
			"notify.system.unsupported": "当前浏览器不支持系统通知",
			"notify.onAnswerComplete": "回答完成时提醒",
			"notify.onAuthRequired": "需要授权时提醒",
			"notify.method": "声音类型",
			"notify.method.builtin": "内置铃声",
			"notify.method.tts": "文字转语音",
			"notify.method.custom": "自定义音频",
			"notify.ttsText": "提示文字",
			"notify.ttsTextHint": "提醒时朗读以下文字",
			"notify.customAudioUrl": "音频地址",
			"notify.customHint": "支持 http(s) 链接，或选择本地音频文件（≤ 1MB）",
			"notify.pickFile": "选择文件",
			"notify.preview": "试听",
			"notify.toast.answerComplete": "「{title}」回答已完成",
			"notify.toast.authRequired": "「{title}」需要授权",
			"notify.toast.close": "关闭",
			"notify.uploaded": "音频已保存",
			"notify.fileTooLarge": "音频文件不能超过 1MB",
			"notify.fileTypeUnsupported": "不支持的音频格式",
			"notify.uploadFailed": "上传失败，请重试"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"notify.enabled": "Enable alerts",
			"notify.systemNotify": "System notification",
			"notify.system.answerComplete": "Answer complete",
			"notify.system.authRequired": "Authorization needed",
			"notify.system.granted": "System notifications enabled",
			"notify.system.denied": "System notification permission denied",
			"notify.system.unsupported": "This browser does not support system notifications",
			"notify.onAnswerComplete": "Alert when an answer completes",
			"notify.onAuthRequired": "Alert when authorization is needed",
			"notify.method": "Sound type",
			"notify.method.builtin": "Built-in ringtone",
			"notify.method.tts": "Text to speech",
			"notify.method.custom": "Custom audio",
			"notify.ttsText": "Text to speak",
			"notify.ttsTextHint": "Spoken aloud when an alert fires",
			"notify.customAudioUrl": "Audio source",
			"notify.customHint": "An http(s) link, or a local audio file (≤ 1MB)",
			"notify.pickFile": "Choose file",
			"notify.preview": "Preview",
			"notify.toast.answerComplete": "Answer complete: {title}",
			"notify.toast.authRequired": "Authorization needed: {title}",
			"notify.toast.close": "Dismiss",
			"notify.uploaded": "Audio saved",
			"notify.fileTooLarge": "The audio file must be 1MB or smaller",
			"notify.fileTypeUnsupported": "Unsupported audio format",
			"notify.uploadFailed": "Upload failed, please retry"
		};
		/** Data URI the browser plays for the built-in notification ringtone. */
		const BUILTIN_RINGTONE_DATA_URI = "data:audio/wav;base64," + [
			"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",
			"6gDVALgAlQBuAEMAFgDo/7z/k/9u/07/Nf8j/xn/GP8e/y3/Qv9e/4D/pf/O//j/IQBJAG4AjwCrAMAAzgDVANUAzQC9AKgAjABtAEkAJAD9/9f/s/+S/3X/Xv9M/0H/Pf8//0j/WP9t/4j/pv/H/+n/DAAuAE8AawCEAJgApwCvALEArQCjAJMAfgBmAEkAKwAMAOz/zv+y/5n/hP9z/2j/Yv9i/2f/cv+B/5X/rP/G/+H//f8ZADQATABhAHMAgACJAI0AiwCFAHsAbABZAEQALQAUAPz/4//M/7j/pv+Y/43/h/+F/4f/jv+Z/6b/t//K/9//9P8KAB4AMgBDAFEAXABkAGkAaQBmAF8AVQBIADkAKQAXAAUA8//i/9L/",
			"xP+5/7H/q/+p/6n/rf+z/7z/yP/U/+P/8f8AAA8AHAAoADMAOwBBAEUARgBFAEEAOwAzACoAHwAUAAgA/f/y/+f/3//X/9H/zf/L/8v/zf/R/9b/3P/j/+v/9P/8/wUADAATABkAHgAhACMAJAAjACEAHgAaABYAEQALAAYAAQD8//j/9P/x/+//7f/t/+3/7v/w//L/9P/3//n//P/+/wAAAgADAAQABAAEAAMAAgACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
			"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
			"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
			"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
			"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
			"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
			"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
			"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
			"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
		].join("");
		//#endregion
		//#region lib/types/client/sounds.js
		/**
		* Route one notification through the engine selected by the config's method.
		* @param config - current notification settings.
		* @param engine - playback engine to dispatch into.
		*/
		function dispatch(config, engine) {
			switch (config.method) {
				case "builtin":
					engine.playBuiltin();
					return;
				case "tts":
					engine.playTts(config.ttsText);
					return;
				case "custom":
					engine.playCustom(config.customAudioUrl);
					return;
				default: throw new TypeError(`unknown notification method: ${String(config.method)}`);
			}
		}
		/** Start one audio element without letting an autoplay-policy rejection (or a
		* stub environment returning a non-promise) throw from an event handler. */
		function playSafely(audio) {
			const playback = audio.play();
			if (playback !== void 0 && typeof playback.catch === "function") playback.catch(() => {});
		}
		/**
		* Real browser playback. Every entry degrades to a no-op when the platform
		* capability is absent (jsdom tests, privacy modes) or the input is empty, so
		* a misconfigured notification never throws from an event handler.
		* @returns the browser playback engine.
		*/
		function createBrowserEngine() {
			return {
				playBuiltin() {
					if (typeof Audio === "undefined") return;
					playSafely(new Audio(BUILTIN_RINGTONE_DATA_URI));
				},
				playTts(text) {
					if (typeof speechSynthesis === "undefined" || text === "") return;
					speechSynthesis.cancel();
					const utterance = new SpeechSynthesisUtterance(text);
					speechSynthesis.speak(utterance);
				},
				playCustom(url) {
					if (typeof Audio === "undefined" || url === "") return;
					playSafely(new Audio(url));
				}
			};
		}
		//#endregion
		//#region lib/types/client/notify-runtime.js
		/** One session summary projected to the two observed facts. */
		function observationOf(summary, pending) {
			return {
				running: summary.running,
				pending
			};
		}
		/** Deep field comparison deciding whether a scope re-read changed anything. */
		function sameSection(left, right) {
			return left.enabled === right.enabled && left.systemNotify === right.systemNotify && left.onAnswerComplete === right.onAnswerComplete && left.onAuthRequired === right.onAuthRequired && left.method === right.method && left.ttsText === right.ttsText && left.customAudioUrl === right.customAudioUrl;
		}
		/**
		* Sound-notification owner: durable config in, playback decisions out.
		* Reads go through {@link getConfig}; user writes only through
		* {@link setField}; every accepted change emits `notify/config` with the full
		* section so the settings row can mirror it. Session observation baselines on
		* the first list snapshot (a session already idle at load rings nothing) and
		* re-baselines on `connection/reset` (reconnect replays status frames, which
		* would otherwise fabricate false edges). Every fired edge plays the sound and
		* emits `notify/alert` (the bottom-right popup follows the master switch and
		* the event toggles — no separate toggle); when the system toggle is on it
		* also emits `notify/system` for the browser system notification.
		*/
		var NotifyRuntime = class {
			ctx;
			host;
			engine;
			config = { ...DEFAULT_NOTIFY_SETTINGS };
			revisionValue = 0;
			baseline = false;
			observed = /* @__PURE__ */ new Map();
			/**
			* @param ctx - owning context (scope, list, and event listeners are released
			* through ctx.effect on dispose; the config event emits on it).
			* @param host - durable settings scope owned by the same plugin.
			* @param engine - playback engine this runtime dispatches into.
			*/
			constructor(ctx, host, engine) {
				this.ctx = ctx;
				this.host = host;
				this.engine = engine;
				ctx.effect(() => host.subscribe(() => {
					this.adopt();
				}), "ui-notify: settings scope adoption");
				ctx.effect(() => ctx.on("connection/reset", () => {
					this.rebaseline();
				}), "ui-notify: connection reset rebaseline");
				this.adopt();
				ctx.effect(() => ctx.sessions.list.subscribe(() => {
					this.observe();
				}), "ui-notify: session list observation");
				ctx.effect(() => ctx.uiSession.pendingInteractions.subscribe(() => {
					this.observe();
				}), "ui-notify: pending interaction observation");
				this.observe();
			}
			/**
			* Read the current accepted notification settings.
			* @returns a defensive copy of the section.
			*/
			getConfig() {
				return { ...this.config };
			}
			/**
			* Read the current configuration revision (the row store's sync guard).
			* @returns the monotonic change counter.
			*/
			get revision() {
				return this.revisionValue;
			}
			/**
			* Record one explicit user choice and persist it through the settings scope.
			* A no-op write (same value) neither emits nor touches the wire.
			* @param field - one durable section field.
			* @param value - the selected value.
			*/
			setField(field, value) {
				if (this.config[field] === value) return;
				this.config = {
					...this.config,
					[field]: value
				};
				this.publish();
				this.host.set(field, value);
			}
			/**
			* Play the currently configured method once — the settings row's preview
			* path, independent of the master switch.
			*/
			preview() {
				dispatch(this.config, this.engine);
			}
			/** Adopt the scope's accepted durable section without writing it back. */
			adopt() {
				const value = this.host.getSnapshot().value;
				if (value === void 0) return;
				const next = {
					...DEFAULT_NOTIFY_SETTINGS,
					...value
				};
				if (sameSection(next, this.config)) return;
				this.config = next;
				this.publish();
			}
			/**
			* Diff the latest list snapshot against the observation mirror and fire for
			* each enabled edge: running → idle fires "answer complete", absent →
			* present pending interaction fires "authorization needed". Each fire plays
			* the configured sound and emits `notify/alert` (the bottom-right popup
			* follows the master switch and the event toggles, so it accompanies every
			* ring); when the system toggle is on it also emits `notify/system` for the
			* browser system notification. The first snapshot only records (sessions
			* already idle at load fire nothing); new sessions record without firing;
			* removed sessions drop.
			*/
			observe() {
				const snapshot = this.ctx.sessions.list.getSnapshot();
				const pending = this.ctx.uiSession?.pendingInteractions.getSnapshot() ?? /* @__PURE__ */ new Map();
				if (!this.baseline) {
					this.baseline = true;
					for (const [id, summary] of Object.entries(snapshot.byId)) this.observed.set(id, observationOf(summary, pending.has(id)));
					return;
				}
				for (const [id, summary] of Object.entries(snapshot.byId)) {
					const sessionId = id;
					const next = observationOf(summary, pending.has(sessionId));
					const prev = this.observed.get(sessionId);
					if (prev === void 0) {
						this.observed.set(sessionId, next);
						continue;
					}
					if (prev.running && !next.running && this.config.enabled && this.config.onAnswerComplete) {
						dispatch(this.config, this.engine);
						this.ctx.emit("notify/alert", {
							kind: "answer-complete",
							sessionId,
							title: summary.displayTitle
						});
						if (this.config.systemNotify) this.ctx.emit("notify/system", {
							kind: "answer-complete",
							sessionId,
							title: summary.displayTitle
						});
					}
					if (!prev.pending && next.pending && this.config.enabled && this.config.onAuthRequired) {
						dispatch(this.config, this.engine);
						this.ctx.emit("notify/alert", {
							kind: "auth-required",
							sessionId,
							title: summary.displayTitle
						});
						if (this.config.systemNotify) this.ctx.emit("notify/system", {
							kind: "auth-required",
							sessionId,
							title: summary.displayTitle
						});
					}
					this.observed.set(sessionId, next);
				}
				for (const id of this.observed.keys()) if (!(id in snapshot.byId)) this.observed.delete(id);
			}
			/** Forget observed state and re-baseline on the next snapshot (reconnect replay must not ring). */
			rebaseline() {
				this.observed.clear();
				this.baseline = false;
				this.observe();
			}
			publish() {
				this.revisionValue += 1;
				this.ctx.emit("notify/config", this.config);
			}
		};
		//#endregion
		//#region lib/types/client/settings-store.js
		/**
		* Notification row slot store: a mirror of the runtime config. The plugin's
		* apply-world change listener is the only writer; the row component reads via
		* props.useStore.
		*/
		/**
		* Declares the notification row state and write surface.
		* @returns the store handle.
		*/
		function createNotifyRowStore() {
			return (0, _deepseek_ai_dsh_client_store.defineStore)({
				init: () => ({
					config: { ...DEFAULT_NOTIFY_SETTINGS },
					revision: -1
				}),
				actions: { sync: (draft, config, revision) => {
					if (revision <= draft.revision) return;
					draft.config = { ...config };
					draft.revision = revision;
				} }
			});
		}
		//#endregion
		//#region lib/types/client/system-notify.js
		/**
		* Browser system-notification sender: the Notification API channel of the
		* plugin. Guarded so a missing or unpermitted Notification never throws from
		* an event handler; the tag makes consecutive alerts replace each other in
		* the OS notification center instead of stacking.
		*/
		/** Tag shared by every notification this plugin sends (replacement key). */
		const SYSTEM_NOTIFICATION_TAG = "dsh-ui-notify";
		/**
		* Show one system notification. A no-op when the platform capability is
		* absent (jsdom tests, unsupported browsers) or permission was not granted.
		* @param title - short localized alert copy (the notification's title line).
		* @param body - detail line, the session label.
		*/
		function showSystemNotification(title, body) {
			if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
			new Notification(title, {
				body,
				tag: SYSTEM_NOTIFICATION_TAG
			});
		}
		//#endregion
		//#region \0dsh-css:/home/yeung/deepseek-harness/packages/client/ui-notify/src/client/NotifyRow.module.css.mjs
		const css$1 = "._4rT7-G_group{border-bottom:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:10px;padding:16px 0;display:flex}._4rT7-G_optionRow{flex-wrap:wrap;align-items:center;gap:16px;display:flex}._4rT7-G_switch{font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border:0;align-items:center;gap:8px;padding:0;font-size:14px;line-height:22px;display:flex}._4rT7-G_switch:disabled{opacity:.5;cursor:default}._4rT7-G_switchLabel{text-align:left;flex:1}._4rT7-G_switchTrack{box-sizing:border-box;background:var(--dsw-alias-border-l2);border-radius:10px;width:36px;height:20px;transition:background .15s;position:relative}._4rT7-G_switchTrack[data-on]{background:var(--dsw-alias-brand-primary)}._4rT7-G_switchThumb{background:var(--dsw-alias-bg-base);border-radius:50%;width:16px;height:16px;transition:transform .15s;position:absolute;top:2px;left:2px}._4rT7-G_switchTrack[data-on] ._4rT7-G_switchThumb{transform:translate(16px)}._4rT7-G_fieldLabel{color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}._4rT7-G_select{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);min-width:160px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:4px 8px;font-size:14px;line-height:22px}._4rT7-G_select:disabled{opacity:.5}._4rT7-G_preview{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:8px;padding:4px 12px;font-size:14px;line-height:22px}._4rT7-G_preview:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}._4rT7-G_preview:disabled{opacity:.5;cursor:default}._4rT7-G_fieldBlock{flex-direction:column;align-items:flex-start;gap:6px;display:flex}._4rT7-G_customRow{align-items:center;gap:8px;width:100%;display:flex}._4rT7-G_input{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);min-width:0;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;flex:1;padding:4px 8px;font-size:14px;line-height:22px}._4rT7-G_input:disabled{opacity:.5}._4rT7-G_pickFile{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;white-space:nowrap;border-radius:8px;padding:4px 12px;font-size:14px;line-height:22px}._4rT7-G_pickFile:has(input:disabled){opacity:.5;cursor:default}._4rT7-G_hint{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}._4rT7-G_notice{color:var(--dsw-alias-state-success-primary);font-size:12px;line-height:18px}._4rT7-G_noticeError{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}";
		const tagId$1 = "@deepseek-ai/dsh-client-ui-notify/NotifyRow.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-notify";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var NotifyRow_module_css_default = {
			"customRow": "_4rT7-G_customRow",
			"fieldBlock": "_4rT7-G_fieldBlock",
			"fieldLabel": "_4rT7-G_fieldLabel",
			"group": "_4rT7-G_group",
			"hint": "_4rT7-G_hint",
			"input": "_4rT7-G_input",
			"notice": "_4rT7-G_notice",
			"noticeError": "_4rT7-G_noticeError",
			"optionRow": "_4rT7-G_optionRow",
			"pickFile": "_4rT7-G_pickFile",
			"preview": "_4rT7-G_preview",
			"select": "_4rT7-G_select",
			"switch": "_4rT7-G_switch",
			"switchLabel": "_4rT7-G_switchLabel",
			"switchThumb": "_4rT7-G_switchThumb",
			"switchTrack": "_4rT7-G_switchTrack"
		};
		//#endregion
		//#region lib/types/client/NotifyRow.js
		/**
		* Notification preference row registered into the General section item slot:
		* the master switch, the system-notification switch (with its permission
		* request), the two event switches, the sound-type selector, and the
		* method-specific inputs (TTS text / custom audio source + file picker), plus
		* a preview button that plays the current method immediately. Every control
		* writes one durable field through the injected `setField` face; the row
		* never touches the settings transport itself.
		*/
		/** Selectable alert methods in display order. */
		const METHODS = [
			{
				value: "builtin",
				labelKey: "notify.method.builtin"
			},
			{
				value: "tts",
				labelKey: "notify.method.tts"
			},
			{
				value: "custom",
				labelKey: "notify.method.custom"
			}
		];
		/** One labeled switch row (button chrome; the track/thumb draw the switch). */
		function Switch(props) {
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				role: "switch",
				className: NotifyRow_module_css_default.switch,
				"aria-checked": props.checked,
				disabled: props.disabled,
				onClick: () => {
					props.onChange(!props.checked);
				},
				children: [(0, react_jsx_runtime.jsx)("span", {
					className: NotifyRow_module_css_default.switchLabel,
					children: props.label
				}), (0, react_jsx_runtime.jsx)("span", {
					className: NotifyRow_module_css_default.switchTrack,
					"data-on": props.checked || void 0,
					"aria-hidden": "true",
					children: (0, react_jsx_runtime.jsx)("span", { className: NotifyRow_module_css_default.switchThumb })
				})]
			});
		}
		/**
		* Render the notification preference row.
		* @param props - composed slot props.
		* @returns the row element tree.
		*/
		function NotifyRow({ t, useStore, setField, preview }) {
			const config = useStore((s) => s.config);
			const active = config.enabled;
			const [notice, setNotice] = (0, react.useState)(null);
			/** Show a picker feedback message for a moment. */
			const flash = (text, error) => {
				setNotice({
					text,
					error
				});
				window.setTimeout(() => {
					setNotice(null);
				}, 4e3);
			};
			/**
			* Toggle the system-notification channel. Enabling requests the browser
			* Notification permission first (the switch click is the required user
			* gesture) and persists the field only when permission lands on granted;
			* disabling never asks again.
			*/
			const toggleSystem = (next) => {
				if (!next) {
					setField(NOTIFY_FIELDS.systemNotify, false);
					return;
				}
				if (typeof Notification === "undefined") {
					flash(t("notify.system.unsupported"), true);
					return;
				}
				if (Notification.permission === "denied") {
					flash(t("notify.system.denied"), true);
					return;
				}
				if (Notification.permission === "default") {
					Notification.requestPermission().then((permission) => {
						if (permission === "granted") {
							setField(NOTIFY_FIELDS.systemNotify, true);
							flash(t("notify.system.granted"), false);
						} else flash(t("notify.system.denied"), true);
					});
					return;
				}
				setField(NOTIFY_FIELDS.systemNotify, true);
			};
			/** Upload one picked audio file to the host route; the durable setting stores the served URL, never the bytes. */
			const pickFile = async (event) => {
				const file = event.target.files?.[0];
				if (file === void 0) return;
				if (file.size > 1048576) {
					flash(t("notify.fileTooLarge"), true);
					return;
				}
				const extension = audioExtensionOfMediaType(file.type, file.name);
				if (extension === void 0) {
					flash(t("notify.fileTypeUnsupported"), true);
					return;
				}
				try {
					const url = `${AUDIO_URL_PREFIX}/${crypto.randomUUID()}.${extension}`;
					if (!(await fetch(url, {
						method: "PUT",
						body: file,
						headers: file.type === "" ? {} : { "content-type": file.type }
					})).ok) {
						flash(t("notify.uploadFailed"), true);
						return;
					}
					const previous = config.customAudioUrl;
					if (previous.startsWith(`/_dsh-ui-notify/audio/`)) fetch(previous, { method: "DELETE" }).catch(() => {});
					setField(NOTIFY_FIELDS.customAudioUrl, url);
					flash(t("notify.uploaded"), false);
				} catch {
					flash(t("notify.uploadFailed"), true);
				}
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: NotifyRow_module_css_default.group,
				children: [
					(0, react_jsx_runtime.jsx)(Switch, {
						label: t("notify.enabled"),
						checked: config.enabled,
						onChange: (next) => {
							setField(NOTIFY_FIELDS.enabled, next);
						}
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: NotifyRow_module_css_default.optionRow,
						children: [(0, react_jsx_runtime.jsx)(Switch, {
							label: t("notify.onAnswerComplete"),
							checked: config.onAnswerComplete,
							disabled: !active,
							onChange: (next) => {
								setField(NOTIFY_FIELDS.onAnswerComplete, next);
							}
						}), (0, react_jsx_runtime.jsx)(Switch, {
							label: t("notify.onAuthRequired"),
							checked: config.onAuthRequired,
							disabled: !active,
							onChange: (next) => {
								setField(NOTIFY_FIELDS.onAuthRequired, next);
							}
						})]
					}),
					(0, react_jsx_runtime.jsx)(Switch, {
						label: t("notify.systemNotify"),
						checked: config.systemNotify,
						disabled: !active,
						onChange: toggleSystem
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: NotifyRow_module_css_default.optionRow,
						children: [
							(0, react_jsx_runtime.jsx)("label", {
								className: NotifyRow_module_css_default.fieldLabel,
								htmlFor: "ui-notify-method",
								children: t("notify.method")
							}),
							(0, react_jsx_runtime.jsx)("select", {
								id: "ui-notify-method",
								className: NotifyRow_module_css_default.select,
								value: config.method,
								disabled: !active,
								onChange: (event) => {
									setField(NOTIFY_FIELDS.method, event.target.value);
								},
								children: METHODS.map(({ value, labelKey }) => (0, react_jsx_runtime.jsx)("option", {
									value,
									children: t(labelKey)
								}, value))
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: NotifyRow_module_css_default.preview,
								disabled: !active,
								onClick: preview,
								children: t("notify.preview")
							})
						]
					}),
					config.method === "tts" && (0, react_jsx_runtime.jsxs)("label", {
						className: NotifyRow_module_css_default.fieldBlock,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: NotifyRow_module_css_default.fieldLabel,
							children: t("notify.ttsText")
						}), (0, react_jsx_runtime.jsx)("input", {
							className: NotifyRow_module_css_default.input,
							type: "text",
							value: config.ttsText,
							placeholder: t("notify.ttsTextHint"),
							disabled: !active,
							onChange: (event) => {
								setField(NOTIFY_FIELDS.ttsText, event.target.value);
							}
						})]
					}),
					config.method === "custom" && (0, react_jsx_runtime.jsxs)("div", {
						className: NotifyRow_module_css_default.fieldBlock,
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: NotifyRow_module_css_default.fieldLabel,
								children: t("notify.customAudioUrl")
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: NotifyRow_module_css_default.customRow,
								children: [(0, react_jsx_runtime.jsx)("input", {
									className: NotifyRow_module_css_default.input,
									type: "text",
									value: config.customAudioUrl,
									placeholder: "https://… 或 data:audio/…",
									disabled: !active,
									onChange: (event) => {
										setField(NOTIFY_FIELDS.customAudioUrl, event.target.value);
									}
								}), (0, react_jsx_runtime.jsxs)("label", {
									className: NotifyRow_module_css_default.pickFile,
									children: [t("notify.pickFile"), (0, react_jsx_runtime.jsx)("input", {
										type: "file",
										accept: "audio/*",
										hidden: true,
										disabled: !active,
										onChange: (event) => {
											pickFile(event);
										}
									})]
								})]
							}),
							(0, react_jsx_runtime.jsx)("div", {
								className: NotifyRow_module_css_default.hint,
								children: t("notify.customHint")
							})
						]
					}),
					notice !== null && (0, react_jsx_runtime.jsx)("div", {
						className: notice.error ? NotifyRow_module_css_default.noticeError : NotifyRow_module_css_default.notice,
						role: "status",
						children: notice.text
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/toast-store.js
		/**
		* Notification popup slot store: the single currently-shown bottom-right
		* toast. The plugin's apply-world `notify/alert` listener is the only writer
		* (`show` replaces the current toast — the newest alert wins); the popup
		* component dismisses itself after its hold, or the user closes it early.
		*/
		/**
		* Declares the popup state and write surface.
		* @returns the store handle.
		*/
		function createNotifyToastStore() {
			return (0, _deepseek_ai_dsh_client_store.defineStore)({
				init: () => ({ toast: null }),
				actions: {
					show: (draft, toast) => {
						draft.toast = toast;
					},
					dismiss: (draft) => {
						draft.toast = null;
					}
				}
			});
		}
		//#endregion
		//#region \0dsh-css:/home/yeung/deepseek-harness/packages/client/ui-notify/src/client/NotifyToast.module.css.mjs
		const css = ".rsGhFa_toast{z-index:1200;pointer-events:none;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);max-width:min(380px,100vw - 32px);color:var(--dsw-alias-label-primary);box-shadow:var(--dsw-shadow-lv3);border-left:3px solid var(--dsw-alias-state-success-primary);border-radius:12px;align-items:center;gap:10px;padding:10px 12px 10px 16px;font-size:13px;line-height:20px;animation:.2s ease-out rsGhFa_dsh-notify-toast-in,.4s 4s forwards rsGhFa_dsh-notify-toast-fade;display:flex;position:fixed;bottom:16px;right:16px}.rsGhFa_toast[data-kind=auth-required]{border-left-color:var(--dsw-alias-state-warn-primary)}.rsGhFa_text{min-width:0}.rsGhFa_close{width:24px;height:24px;color:var(--dsw-alias-label-secondary);cursor:pointer;pointer-events:auto;background:0 0;border:0;border-radius:6px;flex:none;place-items:center;padding:0;font-size:16px;line-height:1;display:grid}.rsGhFa_close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}@keyframes rsGhFa_dsh-notify-toast-in{0%{opacity:0;transform:translate(12px)}to{opacity:1;transform:translate(0)}}@keyframes rsGhFa_dsh-notify-toast-fade{to{opacity:0}}@media (prefers-reduced-motion:reduce){.rsGhFa_toast{animation:.4s 4s forwards rsGhFa_dsh-notify-toast-fade}}";
		const tagId = "@deepseek-ai/dsh-client-ui-notify/NotifyToast.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-notify";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var NotifyToast_module_css_default = {
			"close": "rsGhFa_close",
			"dsh-notify-toast-fade": "rsGhFa_dsh-notify-toast-fade",
			"dsh-notify-toast-in": "rsGhFa_dsh-notify-toast-in",
			"text": "rsGhFa_text",
			"toast": "rsGhFa_toast"
		};
		//#endregion
		//#region lib/types/client/NotifyToast.js
		/**
		* Bottom-right notification popup, registered into the shell's `shell.overlay`
		* seat: shows the newest fired alert (answer complete / authorization needed)
		* as a transient card with the session label, holds, fades, then dismisses
		* itself; the close button hides it early. Rendered through a body portal so
		* a transformed or filtered ancestor cannot trap the fixed card, and the card
		* itself stays click-through (an announcement must never block the app
		* underneath — only the close button opts into pointer events).
		*/
		/** One popup card: holds, fades, then reports done; keyed by toast seq. */
		function NotifyToastView(props) {
			(0, react.useEffect)(() => {
				const timer = setTimeout(props.onDismiss, 4400);
				return () => {
					clearTimeout(timer);
				};
			}, [props.onDismiss]);
			return (0, react_dom.createPortal)((0, react_jsx_runtime.jsxs)("div", {
				className: NotifyToast_module_css_default.toast,
				role: "status",
				"data-kind": props.kind,
				children: [(0, react_jsx_runtime.jsx)("span", {
					className: NotifyToast_module_css_default.text,
					children: props.text
				}), (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: NotifyToast_module_css_default.close,
					"aria-label": props.closeLabel,
					onClick: props.onDismiss,
					children: (0, react_jsx_runtime.jsx)("span", {
						"aria-hidden": true,
						children: "×"
					})
				})]
			}), document.body);
		}
		/**
		* Render the current popup, or nothing while none is shown.
		* @param props - composed slot props.
		* @returns the popup card or null.
		*/
		function NotifyToast({ t, useStore, actions }) {
			const toast = useStore((s) => s.toast);
			if (toast === null) return null;
			const key = toast.kind === "answer-complete" ? "notify.toast.answerComplete" : "notify.toast.authRequired";
			return (0, react_jsx_runtime.jsx)(NotifyToastView, {
				kind: toast.kind,
				text: t(key, { title: toast.title }),
				closeLabel: t("notify.toast.close"),
				onDismiss: actions.dismiss
			}, toast.seq);
		}
		//#endregion
		//#region lib/types/client/index.js
		/** Namespace owning this feature's settings-row copy. */
		const SETTINGS_NS = "settings.notify";
		/**
		* Required services: settings transport, the session list observation source,
		* plus slots/locale for the preference row. `remote` carries the forwarded
		* settings invalidation that `bindSettingsScope` subscribes to on this context.
		*/
		const inject = [
			"slots",
			"locale",
			"connection",
			"remote",
			"settingsScope",
			"sessions",
			"uiSession"
		];
		/**
		* Client plugin body: provide the notification runtime, register the
		* feature-owned preference row into the General section's item slot, register
		* the bottom-right popup into the shell's floating overlay seat, and send
		* browser system notifications for the system channel.
		* @param ctx - client cordis context.
		*/
		function apply(ctx) {
			const notify = new NotifyRuntime(ctx, ctx.settingsScope.bind({ namespace: NOTIFY_SETTINGS_NAMESPACE }), createBrowserEngine());
			ctx.provide("notify", notify);
			ctx.effect(() => ctx.locale.register(SETTINGS_NS, {
				zh,
				en
			}), "ui-notify: settings row dictionaries");
			const systemCopy = ctx.locale.bind(SETTINGS_NS);
			const store = createNotifyRowStore();
			let bound;
			const sync = () => {
				bound?.sync(notify.getConfig(), notify.revision);
			};
			ctx.on("notify/config", sync);
			const injected = (actions) => {
				bound = actions;
				sync();
				return {
					setField: (field, value) => {
						notify.setField(field, value);
					},
					preview: () => {
						notify.preview();
					}
				};
			};
			ctx.slots.inject("settings.general.item", () => ctx.slots.register({
				name: "settings.general.item",
				id: "notify",
				order: 20,
				store,
				locale: SETTINGS_NS,
				inject: injected
			}, NotifyRow));
			const toastStore = createNotifyToastStore();
			let toastBound;
			let toastSeq = 0;
			ctx.on("notify/alert", (alert) => {
				toastSeq += 1;
				toastBound?.show({
					...alert,
					seq: toastSeq
				});
			});
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "notify",
				order: 30,
				store: toastStore,
				locale: SETTINGS_NS,
				inject: (actions) => {
					toastBound = actions;
					return {};
				}
			}, NotifyToast));
			ctx.on("notify/system", (alert) => {
				showSystemNotification(alert.kind === "answer-complete" ? systemCopy("notify.system.answerComplete") : systemCopy("notify.system.authRequired"), alert.title);
			});
		}
		//#endregion
		exports.AUDIO_EXTENSION_MEDIA_TYPES = AUDIO_EXTENSION_MEDIA_TYPES;
		exports.AUDIO_ID_PATTERN = AUDIO_ID_PATTERN;
		exports.AUDIO_URL_PREFIX = AUDIO_URL_PREFIX;
		exports.MAX_AUDIO_BYTES = MAX_AUDIO_BYTES;
		exports.NotifyRow = NotifyRow;
		exports.NotifyRuntime = NotifyRuntime;
		exports.NotifyToast = NotifyToast;
		exports.SETTINGS_NS = SETTINGS_NS;
		exports.SYSTEM_NOTIFICATION_TAG = SYSTEM_NOTIFICATION_TAG;
		exports.apply = apply;
		exports.audioExtensionOfMediaType = audioExtensionOfMediaType;
		exports.audioMediaTypeOfExtension = audioMediaTypeOfExtension;
		exports.createBrowserEngine = createBrowserEngine;
		exports.createNotifyRowStore = createNotifyRowStore;
		exports.createNotifyToastStore = createNotifyToastStore;
		exports.dispatch = dispatch;
		exports.inject = inject;
		exports.showSystemNotification = showSystemNotification;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map