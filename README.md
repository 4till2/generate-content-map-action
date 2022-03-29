# Extract specified content within repository into a single object

This action allows for automatically generating a single json output with the text content and metadata of any file
within the repository according to some configurable rules with the option to then save it as a JSON file within the
repository.

### Background

I use markdown to take notes on my phone (Obsidian + Working Copy©) and computer (Obsidian + Obsidian Git), and GitHub
as a way to back up and synchronize them. I wanted a touch free way to automatically add certain pages from my "
notebook" (a git repository) onto my website. The content should have only a single source of truth, yet not require
individual fetching from my main site. This meant creating a single "endpoint" with all the desired content under one
url, regenerated to reflect any updates in real time. Now my notebook serves as a cms/database with committed changes
reflected elsewhere immediately.

Of course not all pages are ready to be published so by simply configuring the action to include only certain paths,
and/or metadata key/values only particular notes make it into the generated result. By moving the logic to the actual
notebook my main site can assume all content fetched is up-to-date and meant to be published.

### Inputs

Through inputs you can configure which files to index based on extension, path, and metadata values.
See [action.yml](action.yml) for a full list of input options with their descriptions.

The flow of the action is as follows:

1. Get all files matching the configured extension type, within the repository not matching an excluded path.
2. For each file, open to extract/convert content, and [metadata](#metadata).
3. Validate the file passes any configured metadata rules.
4. Get last modified info from git.
5. Add information to result object.
6. Write result to repository if/as configured to do so [*](#saving).
7. Return result

### Output

Array of matching objects in the following format:

```json
{
  "src": "source/path/file.extension",
  "last_modified": "DATE_LAST_MODIFIED_ACCORDING_TO_GIT_LOG",
  "content": "The actual content within the file in either original Markdown format or converted to HTML",
  "content_type": "markdown or html",
  "metadata": "Metadata object extracted from the file. Metadata is YAML parsed into an object"
}
```

#### Metadata

The metadata is parsed out of the file as YAML matching the following structure.

```yaml
---
key: value
primary:
  nested: [ array ]
---
The main content...
```

Translates to...

```javascript
metadata = {
    key: value,
    primary: {
        nested: ["array"]
    }
}
content = "The main content"
```

#### Saving

If you opt to save the file, you are still responsible for committing it to the
repository. [Full example below](#full-example-to-save-the-results-and-add-to-repository-on-each-new-push).

## Usage

You can consume the action by referencing the v1 branch

#### Basic usage to pass along object to another action.

```yaml
uses: 4till2/generate-content-map-action@v1
with:
  exclude_paths: node_modules _templates # dont include files under these paths
  output_file: '' # dont write the results, just return them.
```

#### Full example to save the results and add to repository on each new push.

```yaml
name: Generate contentmap

on:
  push:
    branches: [ main ]

jobs:
  contentmap_job:
    runs-on: ubuntu-latest
    name: Generate a contentmap
    steps:
      - name: Checkout the repo
        uses: actions/checkout@v3
        with:
          persist-credentials: false
          fetch-depth: 0

      - name: Generate the contentmap
        id: contentmap
        uses: 4till2/generate-content-map-action@v1
        with:
          exclude_paths: node_modules _templates # dont include files under these paths
          meta_key: publish # only include matching files with metadata containing the key 'publish'
          meta_value: true # farther validate that the metadata key 'publish' is set to 'true'
          output_file: generated-content-map # write the results to a file 'generated-content-map'
          output_content_type: markdown # keep the content in Markdown format (the other option is to convert to html)

      - name: Commit files
        run: |
          git config --local user.email "generate-content-map+github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add .
          git commit -m "Auto update contentmap" -a

      - name: Push changes
        uses: ad-m/github-push-action@master
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          branch: ${{ github.ref }}
```

See the actions tab on your repository for runs of this action!

## Development

This action includes tests, linting, a validation workflow, publishing, and versioning guidance.

Install the dependencies

```bash
npm install
```

Run the tests :heavy_check_mark:

```bash
$ npm test

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)
...
```

#### Change action.yml

The action.yml defines the inputs and output for the action.

See the [documentation](https://help.github.com/en/articles/metadata-syntax-for-github-actions)

#### Change the Code

The main action is run in an async function under [src/index.js](src/index.js).

#### Package for distribution

GitHub Actions will run the entry point from the action.yml. Packaging assembles the code into one file that can be
checked in to Git, enabling fast and reliable execution and preventing the need to check in node_modules.

Actions are run from GitHub repos. Packaging the action will create a packaged action in the dist folder.

Run prepare

```bash
npm run prepare
```

There is also a shortcut to lint, prepare, and test.

 ```bash
 npm run all
 ```

Since the packaged index.js is run from the dist folder.

```bash
git add dist
```

Publish

It's recommended to use a versioned branch to prevent breaking changes from affecting people.

```bash
git checkout -b v1
git commit -a -m "v1 release"
git push origin v1
```

#### Usage

The action can now be similarly to the [above explanation](#usage), but differing based on your modifications and
repository name.
