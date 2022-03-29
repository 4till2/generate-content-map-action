const showdown = require('showdown')
const YAML = require('yaml')
const BASE_SHOWDOWN_OPTIONS = {}
const SHOWDOWN_OPTIONS = {completeHTMLDocument: false, emoji: true, tasklists: true, moreStyling: true}

const convertMarkdownToHtml = (markdown, options = {}) => {
    const converter = new showdown.Converter({...BASE_SHOWDOWN_OPTIONS, ...options});
    let html = converter.makeHtml(markdown).replace(/[\n\r]/g, '');
    return html
}

const parseMetadata = (content) => {
    let md = content.match(/^(?<metadata>---\s*\n(.*?\n)+)^(---\s*$\n?)/m)
    if (!md || !md.groups.metadata) return ""
    let metadata = md.groups.metadata
    return YAML.parse(metadata)
}

const formatContent = (content, type) => {
    return {
        content: (() => {
            switch (type) {
                case 'html':
                    return convertMarkdownToHtml(content, SHOWDOWN_OPTIONS);
                case 'markdown':
                    return content;
                default:
                    return;
            }
        })(),
        metadata: parseMetadata(content)
    }
}
module.exports = {formatContent}
