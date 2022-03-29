const core = require('@actions/core');
const glob = require('@actions/glob');
const exec = require('@actions/exec');
const {mkdirP} = require("@actions/io");
const {dirname} = require("path");

const {get_content, write_file} = require('./file_handler');
const {formatContent} = require("./formatter");

async function run() {
    try {
        const include_file_types = core.getInput('file_types') || 'md'
        const include_meta_key = core.getInput('meta_key')
        const include_meta_value = core.getInput('meta_value')
        const exclude_path = core.getInput('exclude_path')
        const output_file = core.getInput('output_file') || 'site_content_map'
        const output_content_type = core.getInput('output_content_type') || 'markdown'
        const site_path = core.getInput('website_root')

        const current_path = process.cwd();
        const include = include_file_types.split(' ').map(ext => `**/*.${ext}`)
        const exclude = exclude_path ? exclude_path.split(' ').map(ext => `!**/*${ext}`) : ''
        const patterns = include.concat(exclude)
        const globber = await glob.create(patterns.join('\n'))
        const files = await globber.glob()

        core.info(`Getting files with pattern:  ${patterns}`);
        core.info(`Matching files:  ${files}`);
        core.info(`Output path:  ${output_file}`);
        core.info(`Current path:  ${current_path}`);

        let contents = await Promise.all(
            files.map(async (file) => {
                let {content, metadata} = formatContent(await get_content(file), output_content_type)
                if (!validate_page(metadata, include_meta_key, include_meta_value)) return
                return {
                    src: file.replace(current_path, site_path),
                    last_modified: await lastModified(file),
                    content: content,
                    content_type: output_content_type,
                    metadata: metadata
                }
            })
        ).then(res => res.filter(f => f)) // remove empty slots as a result of validate_page

        if (output_file) {
            const targetDir = dirname(output_file);
            await mkdirP(targetDir);
            await write_file(`${output_file}.json`, JSON.stringify(contents))
        }
        core.setOutput('contents', contents);
    } catch (error) {
        core.setFailed(error.message);
    }
}

const lastModified = async (file) => {
    return execResults('git', ['log', '-1', '--format=%cI', file]).then(result => {
        return result ? result.trim() : new Date()
    })
}

const execResults = async (...command) => {
    let result = '';
    let error = '';

    const options = {};
    options.listeners = {
        stdout: (data) => {
            result += data.toString();
        },
        stderr: (data) => {
            error += data.toString();
        }
    };
    await exec.exec(...command, options)
    if (error) throw Error(error)
    return result
}

const validate_page = (meta, key, value) => {
    if (key) {
        if (!meta || !meta[key]) return false
        return (value ? meta[key].toString() === value.toString() : meta[key] !== undefined)
    }
    return true
}

run();
