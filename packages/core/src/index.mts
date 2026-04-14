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

export interface IPrintConfigOptions {
  omitZeroSizeFiles?: boolean;
  omitZeroGzipSizeFiles?: boolean;
}

interface IPrintConfig {
  input?: {
    path: string;
  };
  output?: {
    path: string;
    options?: IPrintConfigOptions;
  };
}

export interface IBsrConfig {
  analyze: IAnalyzeConfig;
  print?: IPrintConfig;
}

export interface IFile {
  normalizedName: string;
  // list for case when same normalized filename is generated with multiple hashes
  paths: string[]; // relative paths to the original files
  normalizedPath: string;
  size: number;
  gzipSize: number;
  group: IFileGroup['key'];
}

export interface IBsrReport {
  files: IFile[];
}
