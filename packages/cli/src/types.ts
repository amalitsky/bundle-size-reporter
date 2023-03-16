export interface IFileGroup {
  key: string; // unique id
  label?: string; // text label for the report itself
  globs: string[];
  excludeGlobs?: string[]; // List of patterns to ignore folder/files
}

interface IAnalyzeConfig {
  groups: IFileGroup[];
  build?: {
    location: string;
  };
  output?: string;
}

interface IPrintConfig {
  input?: string;
  output?: string;
}

export interface IBSRConfig {
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

export interface IBSRReport {
  files: IFile[];
}
