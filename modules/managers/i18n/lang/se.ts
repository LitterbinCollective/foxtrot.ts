export default {
  "commands": {
    "settings": {
      "unknown": "okänd inställning.",
      "not-null": "den hära inställningen kan inte tas bort.",
      "set": "sätt `{0}` till `{1}`.",
      "current": "aktuella serverspecifika inställningar.",
      "no-value": "[inget värde]"
    },

    "feedback": {
      "fail": "kunde inte skicka feedback.",
      "success": "tackar! din feedback har skickats till vår server."
    },

    "module": {
      "assigned": "tilldelad {0} modul!",
      "destroy": "förstör modulen...",
      "switched": "bytte till {0} modul!"
    },

    "no-issue-url": "skicka rapporter direkt till värden.",

    "ping": {
      "pong": "pong!",
      "unit": "ms",
      "footer": "shard ID: {0}"
    },

    "uptime": {
      "secret": "lider för {0}",
      "res": "uppe för {0}",

      "units": [
        "ms",
        "s",
        "m",
        "h",
        "d"
      ]
    },

    "corrupt": {
      "current-infrequency": "infrekvens just nu: `{0}`.",

      "invalid-mode": "ogiltigt läge. tillgängliga lägen: `{0}`.",
      "current-mode": "läget just nu: `{0}`.",

      "current-rand-sample": "aktuella slump provbit: `{0}`.",

      "enabled": "korruption på. (sänkte volym till `{0}%` för att undvika hörskador.)",
      "disabled": "korruption av."
    },

    "effect": {
      "add": "lade till effekt `{0}`!",
      "clear": "effekter borttagna!",
      "remove": "tog bort effekt `{0}`!",
      "set": "satte `{0}` till `{1}`!",

      "list-options": "lista inställningar",
      "set-option": "sätt inställning",
      "get-option": "få inställning",
      "effect-id": "effekt ID: {0} ({1})",
      "available-effects": "tillgängliga effekter",
      "options-for": "inställningar för `{0}`",
      "effects": "effekter"
    },

    "nothing-is-playing": "ingenting spelas upp just nu.",
    "voice-leave": "vi hörs senare.",
    "current-volume": "volymen just nu: `{0}`%.",
    "current-packet-loss": "paketförlust just nu: `{0}`%.",
    "current-bitrate": "bithastighet just nu: `{0}`.",
    "skipped": "skippade!",
    "play-sfx": "spelar upp `{0}`.",
    "join-msg": "tja!",
    "url-or-file": "du måste antingen ge en URL eller ladda up en fil.",
    "query-not-found": "hittade inte.",

    "queue": {
      "nothing": "ingenting hittades i kön.",
      "remove": "tog bort `{0}` från kön!",
      "clear": "rensade kön!",
      "paginator": "kö - {0}"
    },

    "runtime-error": "körtidsfel!!",
    "argument-error": "argumentfel.",
    "missing-required-parameter": "saknar nödvändig parameter."
  },

  "voice-check": {
    "bot-not-in-voice": "jag är inte kopplad.",
    "voice-not-init": "röst har inte initierats än!",
    "member-not-in-voice": "du är inte i röstkanalen.",
    "not-enough-perms-send-messages": "inte tillräckligt med behörigheter att prata i textkanalen.",
    "not-enough-perms-speak": "inte tillräckligt med behörigheter för att prata i röstkanalen.",
    "already-connected": "redan kopplad till en röstkanal på denna server",
    "members-overflow": "kanalanvändargräns nådd."
  },

  "effects-mgr": {
    "not-found": "specifierad effekt inte hittad.",
    "stack-overflow": "för många effekter!",
    "stack-underflow": "för få effekter!",
    "option-not-found": "specifierad effekt inställning inte hittad.",
    "value-undefined": "ett värde måste specifieras.",
    "out-of-range": "specifierad värde utom räckhåll `[{0}; {1}]`"
  },

  "queue": {
    "url-unsupported": "URL kan inte spelas upp.",
    "not-found": "specifierad innehåll har inte hittats."
  },

  "corrupt-mode-not-allowed": "du kan inte sätta på korrupterad läge. (om du vill riskera din och alla andras hörförmåga, sätt `allowCorrupt` inställningen till `true` och återkoppla botten.)",
  "invalid-number": "ogiltig numerisk värde har getts.",
  "page": "sida {0}/{1}",

  "voice-modules": {
    "no-active": "ingen modul är aktiv",
    "not-found": "angiven modul hittades inte. {0}"
  }
};