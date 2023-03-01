export const defaultReportFileName = 'bundle-size-report.json';
export const configFileName = 'bsr.config.json';

/** Regex for the file name with content hash. */
// TODO pass in config
export const fileNameHashRegex = /(\W)[\d\w]{8,32}\.([\d\w]{2,5})$/;
