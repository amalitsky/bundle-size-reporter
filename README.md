# Bundle Size Reporter

_Bundle Size Reporter_ is a command line tool to measure and keep track of your website _initial load_ files size.

It reads local build file sizes by patterns defined in _config_ file,
prints them as a simple text report into console,
and creates a local text file.

#### Example bundle size report:

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
    "input": {
      "path": "dist"
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
    "output": {
      "path": "bundle-size-stats.json"
    },
    "normalizeFilename": "^.+?\\W+([\\d\\w]{8,32})\\.[\\d\\w]{2,5}$",
    "filenameHashLabel": "[hash]"
  },
  "print": {
    "output": {
      "path": "bundle-size-report.txt"
    }
  }
}
```

### analyze.input.path

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

#### analyze.output.path

_type: string_

_default value:_ `'bundle-size-stats.json'`

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

### print.output.path

_type: string_

Filename for the _text_ format report file.
Simple text, almost the same as `npx run print` command output.

## CLI Commands

- `npx bsr analyze` - read files by _groups_ defined in config file and
  save _stats_ into a [_json_ file](#analyzeoutputpath)
- `npx bsr print` - print a bundle size report into a terminal out of
  _stats_ file created by the `analyze` command above.
  Text report file is created **only** if `output=report.txt` argument is supplied
  or when [`print.output.path`](#printoutputpath) is set in the config file.
- `npx bsr autorun` - sequentially run both commands above.
  To save text report into a file provide a `report` argument to the command
  or have [`print.output.path`](#printoutputpath) is set in the config file.

To see full list of arguments for any CLI command, run it with a `--help` argument,
i.e.: `npx bsr print --help`.

## JSON Report and Comparison

Json formatted _stats_ file contains a list of files which matched _group_ globs from
config file, and is used as intermediary between `analyze` and `print` commands.

It also allows to compare changes between two different builds of the same website with
a following command:

`npx bsr print bundle-size-stats.json --compare-with bundle-size-stats-previous.json`.

Stats file contains file sizes for a particular build and **does not** keep comparison data.
