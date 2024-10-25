"use client";
import { compileCode } from "@/actions/compile";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Language,
  LanguageOptionProps,
  languageOptions,
} from "@/config/config";
import { useToast } from "@/hooks/use-toast";
import Editor from "@monaco-editor/react";
import { Loader, Play } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef, useState } from "react";
import { ModeToggleBtn } from "./mode-toggle-btn";
import SelectLanguages from "./SelectLanguages";
import { Button } from "./ui/button";
import { ToastAction } from "./ui/toast";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";
import { editor as MonacoEditor } from "monaco-editor";
import RandomColor from "randomcolor";

export type SourceCodeProps = {
  [key in Language]?: string;
};

export default function CodeEditor() {
  const { theme } = useTheme();
  const { toast } = useToast();

  const [sourceCode, setSourceCode] = useState<SourceCodeProps>(
    languageOptions.reduce((acc, item) => {
      acc[item.language] = "";
      return acc;
    }, {} as Record<Language, string>)
  );
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOptionProps>(
    languageOptions[0]
  );
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor>(); // focus on code editor onMount
  const [loading, setLoading] = useState<boolean>(false);
  const [output, setOutput] = useState<string[]>([]);

  const handleEditorDidMount = (editor: MonacoEditor.IStandaloneCodeEditor) => {
    // Cursor focus
    editorRef.current = editor;
    editor.focus();
    // Initialize YJS
    const doc = new Y.Doc();
    // Connect to peers with WebRTC
    const provider = new WebrtcProvider("test-room", doc, {
      password: "password",
      maxConns: 10,
      signaling: [
        // "wss://localhost:4444",
        "wss://signaling.yjs.dev",
        // "wss://y-webrtc-signaling-eu.herokuapp.com",
        // "wss://y-webrtc-signaling-us.herokuapp.com",
      ],
    });
    const type = doc.getText("monaco");
    const awareness = provider.awareness;
    const color = RandomColor(); //Provied any random color to be used for each user
    awareness.setLocalStateField("user", {
      name: "Users Name",
      color: color,
    });

    // Bind YJS to Monaco
    const binding = new MonacoBinding(
      type,
      editorRef.current.getModel() as MonacoEditor.ITextModel,
      new Set([editorRef.current]),
      awareness
    );

    console.log(provider.awareness);
    console.log("doc", doc);

    return () => {
      if (provider) {
        provider.disconnect(); //We destroy doc we created and disconnect
        doc.destroy(); //the provider to stop propagting changes if user leaves editor
      }
    };
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setSourceCode({
        ...sourceCode,
        [selectedLanguage.language]: value,
      });
    }
  };

  const executeCode = async () => {
    setLoading(true);
    /**
      function sum(a,b) {
        return a + b;
      }
      console.log(sum(3, 5));
     */
    try {
      const result = await compileCode(
        sourceCode[selectedLanguage.language] ?? "",
        selectedLanguage
      );
      // console.log(result);
      if (result.run.stderr === "") {
        setLoading(false);
        setOutput(result.run.output.split("\n"));
        toast({
          description: "Compiled Successfully!",
        });
      } else {
        throw new Error(result.run.output);
      }
    } catch (error: any) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  };

  return (
    <div className="min-h-screen dark:bg-slate-900 rounded-2xl shadow-2xl py-6 px-8">
      {/* Header */}
      <div className="flex item-center justify-between">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          IDE
        </h2>
        <div className="flex items-center space-x-2 content-center">
          <ModeToggleBtn />
          <div className="w-[230px]">
            <SelectLanguages
              selected={selectedLanguage}
              setSelected={setSelectedLanguage}
            />
          </div>
        </div>
      </div>
      {/* Main */}
      <div className="bg-slate-400 dark:bg-slate-950 p-3">
        <div className="dark:bg-slate-900">
          <ResizablePanelGroup
            direction="horizontal"
            className="w-full rounded-lg border md:min-w-[450px] dark:bg-slate-900"
          >
            <ResizablePanel defaultSize={50} minSize={35}>
              <Editor
                height="100vh"
                defaultLanguage="javascript"
                theme={theme === "dark" ? "vs-dark" : "vs-Light"}
                onMount={handleEditorDidMount}
                value={sourceCode[selectedLanguage.language]}
                onChange={handleEditorChange}
                language={selectedLanguage.language}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={35}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={25}>
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900">
                    <h2>Output</h2>
                    {loading ? (
                      <Button
                        size="sm"
                        className="dark:bg-purple-600 text-slate-100 dark:hover:bg-purple-700 bg-slate-800 hover:bg-slate-900"
                        onClick={executeCode}
                        disabled={loading}
                        variant="outline"
                      >
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        <span>Running please wait ...</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="dark:bg-purple-600 text-slate-100 dark:hover:bg-purple-700 bg-slate-800 hover:bg-slate-900"
                        onClick={executeCode}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        <span>Run</span>
                      </Button>
                    )}
                  </div>
                  <div className="px-6">
                    {output.map((item, index) => (
                      <p
                        className="text-sm space-y-2 divide-y-2 divide-slate-50"
                        key={index}
                      >
                        {item}
                      </p>
                    ))}
                  </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={75}>
                  {/* Body */}
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900">
                    <h2>Input</h2>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}
