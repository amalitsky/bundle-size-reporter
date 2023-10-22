export interface IFileGroup {
  key: string; // unique id
  label?: string; // text label for the report itself
  globs: string[];
  excludeGlobs?: string[]; // List of patterns to ignore folder/files
}

export interface IAnalyzeConfig {
  groups: IFileGroup[];
  normalizeFilename?: string | RegExp | ((fileName: string) => string);
  filenameHashLabel?: string;
  input?: {
    path: string;
  };
  output?: {
    path: string;
  };
}

interface IPrintConfig {
  input?: {
    path: string;
  };
  output?: {
    path: string;
  };
}

export interface IBsrConfig {
  analyze: IAnalyzeConfig;
  print?: IPrintConfig;
}

export interface IFile {
  normalizedName: string;
  path: string; // relative
  normalizedPath: string;
  size: number;
  gzipSize: number;
  group: IFileGroup['key'];
}

export interface IBsrReport {
  files: IFile[];
}
