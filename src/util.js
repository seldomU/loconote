
// Copyright (c) 2022 Uwe Koch
// Licensed under the MIT license. See LICENSE file in the project root for details.

// create DOM node from HTML string
export function createDomNode(htmlStr) {
    var template = document.createElement('template');
    template.innerHTML = htmlStr.trim();
    return template.content.firstChild;
}