// utility: create DOM node from HTML string
export function createDomNode(htmlStr) {
    var template = document.createElement('template');
    template.innerHTML = htmlStr.trim();
    return template.content.firstChild;
}