export default {
  "commands": {
    "settings": {
      "unknown": "不詳-設定.",
      "not-null": "設定削除できません.",
      "set": "`{0}` を `{1}` に設定します!",
      "current": "現在設定.",
      "no-value": "[値ナシ]"
    },

    "feedback": {
      "fail": "饋還-失敗.",
      "success": "ありがと!うきみの饋還わ送信されました."
    },

    "module": {
      "assigned": "{0}モジュールが割り当てられた！",
      "destroy": "モジュールを破壊する",
      "switched": "{0}モジュールに切り替わった！"
    },

    "no-issue-url": "提出-発行.",

    "ping": {
      "pong": "ポン!",
      "unit": "ミリ秒",
      "footer": "shard ID: {0}"
    },

    "uptime": {
      "secret": "受難-為に {0}",
      "res": "稼働-為に {0}",

      "units": [
        "ms",
        "s",
        "m",
        "h",
        "d"
      ]
    },

    "corrupt": {
      "current-infrequency": "現在まれな: `{0}`.",

      "invalid-mode": "インバリッドモード. 可用-モード: `{0}`.",
      "current-mode": "現在モード: `{0}`.",

      "current-rand-sample": "現在-ランドサンプル: `{0}`.",

      "enabled": "腐敗 イネーブル. (音量-せと `{0}%` あなたの耳を守ります!.)",
      "disabled": "腐敗  ディセーブル."
    },

    "effect": {
      "add": "効果付与! `{0}`!",
      "clear": "効果-クリア!",
      "remove": "効果はずした `{0}`!",
      "set": "`{0}` を `{1}` に設定します!",

      "list-options": "設定見せる",
      "set-option": "セット設定",
      "get-option": "得る設定",
      "effect-id": "効果 ID: {0} ({1})",
      "available-effects": "使用可能効果",
      "options-for": "設定-為に `{0}`",
      "effects": "効果"
    },

    "nothing-is-playing": "現在何も遊びされていません.",
    "voice-leave": "バイバイ!",
    "current-volume": "現在音量: `{0}`%.",
    "current-packet-loss": "現在のパケット損失: `{0}`%.",
    "current-bitrate": "現在のビットレート: `{0}`.",
    "skipped": "とばす!",
    "play-sfx": "遊び `{0}`.",
    "join-msg": "ちっす!",
    "url-or-file": "アップロードファイルまたはURL.",
    "query-not-found": "未発見.",

    "queue": {
      "nothing": "待ち行列空っぽ.",
      "remove": "除く `{0}` から 待ち行列!",
      "clear": "待ち行列クリア!",
      "paginator": "待ち行列 - {0}"
    },

    "argument-error": "引数エラー.",
    "missing-required-parameter": "行方不明引数."
  },

  "runtime-error": "ランタイムエラー",

  "voice-check": {
    "bot-not-in-voice": "わたしわ接続していない.",
    "voice-not-init": "声初期化されていません!",
    "member-not-in-voice": "あなたは声チャンネルにいません.",
    "not-enough-perms-send-messages": "テキスト チャネル許可がありません.",
    "not-enough-perms-speak": "声チャネル許可がありません.",
    "already-connected": "既に通話中つく声 チャネル.",
    "members-overflow": "チャネルのユーザー制限に達しました."
  },

  "effects-mgr": {
    "not-found": "特定効果-見つかりません.",
    "stack-overflow": "効果やりすぎだ!",
    "stack-underflow": "効果少なすぎる.",
    "option-not-found": "特定効果 オプション-見つかりません.",
    "value-undefined": "価値わ提供.",
    "out-of-range": "価値-範囲外! `[{0}; {1}]`"
  },

  "queue": {
    "url-unsupported": "URLサポートされていません.",
    "not-found": "特定アイテム-見つかりません."
  },

  "corrupt-mode-not-allowed": "腐敗有効にすることはできません. (有効にするには, セット `allowCorrupt` に設定 `true` そして再起動.)",
  "invalid-number": "無効番号価値は提供.",
  "page": "頁 {0}/{1}",

  "voice-modules": {
    "no-active": "モジュールがアクティブでない",
    "not-found": "指定されたモジュールが見つかりません。 {0}"
  }
};