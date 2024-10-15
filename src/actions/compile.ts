"use server"

import { LanguageOptionProps } from "@/config/config";

export const compileCode = async (sourceCode: string, languageInfo: LanguageOptionProps) => {
  try {
    const res = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "language": languageInfo.language,
        "version": languageInfo.version,
        "files": [
          {
            "content": sourceCode
          }
        ],
        "stdin": "",
        "args": ["1", "2", "3"],
        "compile_timeout": 10000,
        "run_timeout": 3000,
        "compile_memory_limit": -1,
        "run_memory_limit": -1
      })
    });
    const jsonRes = await res.json();
    return jsonRes;
  } catch (error) {
    console.log("[compileCode]", error);
  }
}