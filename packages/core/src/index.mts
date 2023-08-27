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
  build?: {
    location: string;
  };
  output?: string;
}

interface IPrintConfig {
  input?: string;
  output?: string;
}

export interface IBsrConfig {
  analyze: IAnalyzeConfig;
  print?: IPrintConfig;
}

export interface IFile {
  name: string;
  path: string; // relative
  size: number;
  gzipSize: number;
  group: IFileGroup['key'];
}

export interface IBsrReport {
  files: IFile[];
}