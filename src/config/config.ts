export enum Language {
  javascript = "javascript",
  java = "java",
  sqlite3 = "sqlite3",
  python = "python",
}

export interface LanguageOptionProps {
  language: Language;
  version: string;
  aliases: string[];
  runtime?: string;
}

export const languageOptions: Array<LanguageOptionProps> = [
  {
    language: Language.java,
    version: "15.0.2",
    aliases: []
  },
  {
    language: Language.python,
    version: "3.10.0",
    aliases: [
      "py",
      "py3",
      "python3",
      "python3.10"
    ]
  },
  {
    language: Language.javascript,
    version: "18.15.0",
    aliases: [
      "node-javascript",
      "node-js",
      "javascript",
      "js"
    ],
    runtime: "node"
  },
  {
    language: Language.sqlite3,
    version: "3.36.0",
    aliases: [
      "sqlite",
      "sql"
    ]
  },
]