export default {
  "commands": {
    "settings": {
      "unknown": "unknown setting.",
      "not-null": "this setting cannot be removed.",
      "set": "set `{0}` to `{1}`.",
      "current": "current server-specific settings.",
      "no-value": "[no value]"
    },

    "feedback": {
      "fail": "failed to submit feedback.",
      "success": "thanks! your feedback has been sent to our server."
    },

    "module": {
      "assigned": "assigned {0} module!",
      "destroy": "destroying module...",
      "switched": "switched to {0} module!"
    },

    "no-issue-url": "submit issues directly to the host.",

    "ping": {
      "pong": "pong!",
      "unit": "ms",
      "footer": "shard ID: {0}"
    },

    "uptime": {
      "secret": "suffering for {0}",
      "res": "running for {0}",

      "units": [
        "ms",
        "s",
        "m",
        "h",
        "d"
      ]
    },

    "corrupt": {
      "current-infrequency": "current infrequency: `{0}`.",

      "invalid-mode": "invalid mode. modes available: `{0}`.",
      "current-mode": "current mode: `{0}`.",

      "current-rand-sample": "current rand sample: `{0}`.",

      "enabled": "corruption enabled. (lowered volume to `{0}%` to avoid any hearing damages.)",
      "disabled": "corruption disabled."
    },

    "effect": {
      "add": {
        "single": "added effect `{0}`!",
        "multiple": "added effects!",
      },
      "clear": "effects cleared!",
      "remove": "removed effect `{0}`!",
      "set": "set `{0}` to `{1}`!",

      "list-options": "list options",
      "set-option": "set option",
      "get-option": "get option",
      "effect-id": "effect ID: {0} ({1})",
      "available-effects": "available effects",
      "options-for": "options for `{0}`",
      "effects": "effects"
    },

    "nothing-is-playing": "nothing is playing right now.",
    "voice-leave": "hear you later.",
    "current-volume": "current volume: `{0}`%.",
    "current-packet-loss": "current packet loss: `{0}`%.",
    "current-bitrate": "current bitrate: `{0}`.",
    "skipped": "skipped!",
    "play-sfx": "playing `{0}`.",
    "join-msg": "hoi!",
    "url-or-file": "you need to either pass a URL or upload a file.",
    "query-not-found": "not found.",

    "queue": {
      "nothing": "nothing is in the queue right now.",
      "remove": "removed `{0}` from the queue!",
      "clear": "queue cleared!",
      "paginator": "queue - {0}"
    },

    "argument-error": "argument error.",
    "missing-required-parameter": "missing required parameter."
  },

  "runtime-error": {
    "title": "ooops!!",
    "description": "an error has occurred while executing the command. please try again later.",
    "min": "ooops!! {0}"
  },

  "voice-check": {
    "bot-not-in-voice": "i'm not connected.",
    "voice-not-init": "voice not yet initialized!",
    "member-not-in-voice": "you're not in the voice channel.",
    "not-enough-perms-send-messages": "not enough permissions to talk in this text channel.",
    "not-enough-perms-speak": "not enough permissions to speak in this voice channel.",
    "already-connected": "already connected to a voice channel on this server",
    "members-overflow": "channel user limit reached."
  },

  "effects-mgr": {
    "not-found": "specified effect not found.",
    "stack-overflow": "too many effects!",
    "stack-underflow": "too few effects!",
    "option-not-found": "specified effect option not found.",
    "value-undefined": "value has to be provided",
    "out-of-range": "given value out of range `[{0}; {1}]`",

    "spec": {
      "syntax": "syntax error in `{0}`",
      "expected-kv": "expected key=value in `{0}`",
      "expected-number": "expected a number in `{0}`",
      "option-not-found": "option `{0}` not found in `{1}`",
      "value-out-of-range": "value `{0}` out of range for `{1}` in `{2}`",
    }
  },

  "queue": {
    "url-unsupported": "the requested URL is not supported.",
    "not-found": "specified item not found."
  },

  "corrupt-mode-not-allowed": "you cannot enable corrupt mode. (if you want to risk your and everyone else's hearing, set `allowCorrupt` setting to `true` and reconnect the bot.)",
  "invalid-number": "invalid number value provided.",
  "page": "page {0}/{1}",

  "voice-modules": {
    "no-active": "no module is active",
    "not-found": "specified module not found. available modules: {0}."
  },

  "special": {
    "to-disable": "disable special events (may need to reconnect)",

    "nye": {
      "title": "happy new years eve!",
      "description": "{0} will play westminster melody and firework sounds on jan 1st at 12 a.m. for every timezone. check the bot's status to see which timezone is next to celebrate New Year's Eve."
    }
  },

  "tts": {
    "content": {
      "attachments": "this message contains attachments.",
      "embeds": "this message contains embeds.",
      "urls": "this message contains links.",
      "attachments-embeds": "this message contains attachments and embeds.",
      "attachments-urls": "this message contains attachments and links.",
      "attachments-embeds-urls": "this message contains attachments, embeds, and links.",
      "embeds-urls": "this message contains embeds and links."
    },

    "join": "{0} joined the voice channel.",
    "leave": "{0} left the voice channel.",
    "say": "{0} said: {1}"
  },

  "feedback": {
    "title": "how was your experience?",
    "description": "you were using `{0}` branch of {1}. it would mean a lot to us if you let us know what you think!",
    "pre-button": "how satisfied are you using this branch of {0}?",
    "response": "thanks for your feedback! if you want to provide more details about your experience, please click the button below.",
    "button": "send additional feedback",
    "thanks": "thanks for your feedback!",

    "grade": {
      "1": "1 (very unsatisfied)",
      "2": "2",
      "3": "3",
      "4": "4",
      "5": "5 (very satisfied)"
    },

    "modal": {
      "title": "supplement feedback",
      "input": "details",
      "placeholder": "i like the bot, but...",
    }
  }
};