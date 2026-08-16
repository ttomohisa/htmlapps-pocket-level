# コンポーネント

`components/` は実行時に読み込む依存ファイルではなく、`src/index.template.html` へコピー・調整するためのソーススニペットです。

## 確認ダイアログ

`htmlapps-template` と互換の `AppConfirm.ask({ title, message, confirmLabel, cancelLabel, tone })` を使用します。

Esc、背景タップによるキャンセル、フォーカス復元、スマホのSafe Areaを考慮したボトムシート表示を維持してください。
