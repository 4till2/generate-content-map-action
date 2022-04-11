const showdown = require('showdown')
const YAML = require('yaml')
const core = require("@actions/core");
const BASE_SHOWDOWN_OPTIONS = {}
const SHOWDOWN_OPTIONS = {completeHTMLDocument: false, emoji: true, tasklists: true, moreStyling: true}

const convertMarkdownToHtml = (markdown, options = {}) => {
    const converter = new showdown.Converter({...BASE_SHOWDOWN_OPTIONS, ...options});
    let html = converter.makeHtml(markdown).replace(/[\n\r]/g, '');
    return html
}

const yamlToJs = (yml) => {
    try {
        return YAML.parse(yml);
    } catch (e) {
        core.info(`Error parsing Yaml: ${yml}`)
        return {};
    }
}

const parsePage = (content, trimVal) => {
    let md = content.match(/^(?<metadata>(---)[\S\s]+?(---))(?<body>[\S\s]*)/m) // The first instance of yaml --- ---
    let metadata = md.groups.metadata.replace(/---/g, '')
    let body = md.groups.body
    return {
        metadata: yamlToJs(metadata),
        body: body.slice(0, trimVal) // if trimVal is undefined the entire body is returned.
    }
}

const formatContent = (content, type, trimVal) => {
    let {body, metadata} = parsePage(content, trimVal)
    return {
        content: (() => {
            switch (type) {
                case 'html':
                    return convertMarkdownToHtml(body, SHOWDOWN_OPTIONS);
                case 'markdown':
                    return body
                default:
                    return;
            }
        })(),
        metadata: metadata
    }
}
module.exports = {formatContent}
