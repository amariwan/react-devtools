export type SourceOrigin = "react-debug" | "compile-attribute" | "static-index";
export type SourceConfidence = "exact" | "derived" | "approximate";

export type SourceLocation = {
  workspaceRelativePath: string;
  line: number;
  column: number;
  origin: SourceOrigin;
  confidence: SourceConfidence;
};
