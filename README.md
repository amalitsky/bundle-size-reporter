# Bundle Size Reporter

_Bundle Size Reporter_ is a command line tool to measure and keep track of your website _initial load_ files size.

It reads local build file sizes by patterns defined in _config_ file and prints
them as a simple text report into console and a text file.

Example report:

```
HTML files:
- index.html: 107KB / 22KB
JS files:
- app-[hash].js: 239KB / 78KB
- framework-[hash].js: 26KB / 10KB
- component---src-page-templates-post-list-post-list-tsx-[hash].js: 17KB / 5KB
- commons-[hash].js: 17KB / 6KB
- webpack-runtime-[hash].js: 14KB / 4KB

Group total: 313KB / 103KB

JSON files:
- page-data.json: 29KB / 12KB
- 2737273111.json: 6KB / 2KB
- app-data.json: 0KB / 0KB

Group total: 35KB / 14KB

TOTAL: 455KB / 139KB
```

It can also [compare changes](#json-report-and-comparison) between two builds.
Comparison helps to track bundle size changes during the development process.

## Installation

`npm install -D @bundle-size-reporter/cli`

## Configuration

Create `bsr.config.json` file in the package/root folder. Here is a sample configuration:

```json
{
  "analyze": {
    "build": {
      "location": "dist"
    },
    "groups": [
      {
        "key": "html",
        "globs": ["index.html"],
        "label": "HTML"
      },
      {
        "key": "js",
        "globs": ["assets/index-*.js"],
        "label": "JS"
      },
      {
        "key": "css",
        "globs": ["assets/index-*.css"],
        "label": "CSS"
      }
    ],
    "output": "bundle-size-report.json",
    "normalizeFilename": "^.+?\\W+([\\d\\w]{8,32})\\.[\\d\\w]{2,5}$",
    "filenameHashLabel": "[hash]"
  },
  "print": {
    "output": "bundle-size-report.txt"
  }
}
```

### analyze.build

_type: string **required**_

Path to the folder with an application build to read and analyze files from.
All file groups will be resolved relatively to this folder.

### analyze.groups

_type: Object[] **required**_

Defines a list of file groups we want to include into the report.
You can use a single group for all files or add as many groups as you wish -
i.e. group them by file type as _html_, _js_ and _css_.

#### analyze.groups[].key

_type: string **required**_

Unique identifier for the group.

#### analyze.groups[].glob

_type: string **required**_

[Glob pattern](https://www.npmjs.com/package/glob) defining a list of files for the group.

#### analyze.groups[].label

_type: string_

Text label for the group of files to be used in the report.
Group `key` will be used when not set.

#### analyze.output

_type: string_

_default value:_ `'bundle-size-report.json'`

[_Json_ report](#json-report-and-comparison) filename.
Not to be confused with a [text report file](#printoutput).

#### analyze.filenameHashLabel

_type: string_

_default value: empty string_

String to be used to replace content based hashes in file names.
So that `main-absch24.js` becomes `main-[hash].js` in report files, and we can compare
essentially same files between two different builds.

#### analyze.normalizeFilename

_type: RegExp_

Regular expression which is used to find content-based hashes in filenames.
**Must have** a
[capturing group](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Capturing_group)
with a string to be replaced with a [`filenameHashLabel`](#analyzefilenamehashlabel).
Only first capturing group will be used.

### print.output

_type: string_

Filename for the _text_ format report file.
Simple text, almost the same as `npx run print` command output.

## Running

- `npx bsr analyze` - read files defined in config file and save report into [_json_ file](#analyzeoutput)
- `npx bsr print bundle-size-report.json` - print a [text report](#printoutput) out of the _json_ file report created by the `analyze` command above. Path to the _json_ report file must be provided
- `npx bsr autorun` - sequentially run both commands above

To see a list of arguments for any command pass `--help` flag: `npx bsr print --help`.

## JSON Report and Comparison

Json formatted report file contains a list of files which matched group globs, and is used as intermediary between `analyze` and `print` commands.

It allows us to compare changes between two different builds of the same website:

`npx bsr print bundle-size-report.json --compare-with bundle-size-report-previous-build.json`.
