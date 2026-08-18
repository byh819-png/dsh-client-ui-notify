/** `settings.notify` namespace dictionaries (the notification row's copy). */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'notify.title': '声音提醒',
  'notify.enabled': '启用声音提醒',
  'notify.onAnswerComplete': '回答完成时提醒',
  'notify.onAuthRequired': '需要授权时提醒',
  'notify.method': '提醒方式',
  'notify.method.builtin': '内置铃声',
  'notify.method.tts': '文字转语音',
  'notify.method.custom': '自定义音频',
  'notify.ttsText': '提示文字',
  'notify.ttsTextHint': '提醒时朗读以下文字',
  'notify.customAudioUrl': '音频地址',
  'notify.customHint': '支持 http(s) 链接，或选择本地音频文件（≤ 1MB）',
  'notify.pickFile': '选择文件',
  'notify.preview': '试听',
  'notify.uploaded': '音频已保存',
  'notify.fileTooLarge': '音频文件不能超过 1MB',
  'notify.fileTypeUnsupported': '不支持的音频格式',
  'notify.uploadFailed': '上传失败，请重试',
} satisfies Record<string, string>

/** The settings.notify namespace key union. */
export type NotifyKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'notify.title': 'Sound alerts',
  'notify.enabled': 'Enable sound alerts',
  'notify.onAnswerComplete': 'Alert when an answer completes',
  'notify.onAuthRequired': 'Alert when authorization is needed',
  'notify.method': 'Alert method',
  'notify.method.builtin': 'Built-in ringtone',
  'notify.method.tts': 'Text to speech',
  'notify.method.custom': 'Custom audio',
  'notify.ttsText': 'Text to speak',
  'notify.ttsTextHint': 'Spoken aloud when an alert fires',
  'notify.customAudioUrl': 'Audio source',
  'notify.customHint': 'An http(s) link, or a local audio file (≤ 1MB)',
  'notify.pickFile': 'Choose file',
  'notify.preview': 'Preview',
  'notify.uploaded': 'Audio saved',
  'notify.fileTooLarge': 'The audio file must be 1MB or smaller',
  'notify.fileTypeUnsupported': 'Unsupported audio format',
  'notify.uploadFailed': 'Upload failed, please retry',
} satisfies Record<NotifyKey, string>
