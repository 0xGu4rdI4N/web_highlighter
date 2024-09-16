let highlightColor = 'yellow';

document.addEventListener('mouseup', function() {
    let selectedText = window.getSelection().toString();
    if (selectedText.length > 0) {
        let range = window.getSelection().getRangeAt(0);
        let newNode = document.createElement('span');
        newNode.setAttribute('class', 'custom-highlight');
        newNode.style.backgroundColor = highlightColor;
        range.surroundContents(newNode);
        
        // Save the highlight
        chrome.storage.sync.get({highlights: {}}, function(result) {
            let highlights = result.highlights;
            if (!highlights[window.location.href]) {
                highlights[window.location.href] = [];
            }
            highlights[window.location.href].push({
                text: selectedText,
                color: highlightColor
            });
            chrome.storage.sync.set({highlights: highlights});
        });
    }
});

// Load and apply saved highlights
window.addEventListener('load', function() {
    chrome.storage.sync.get({highlights: {}}, function(result) {
        let highlights = result.highlights[window.location.href];
        if (highlights) {
            highlights.forEach(function(highlight) {
                applyHighlight(highlight.text, highlight.color);
            });
        }
    });
});

function applyHighlight(text, color) {
    let textNodes = getTextNodes();
    textNodes.forEach(function(node) {
        let index = node.textContent.indexOf(text);
        if (index >= 0) {
            let range = document.createRange();
            range.setStart(node, index);
            range.setEnd(node, index + text.length);
            let newNode = document.createElement('span');
            newNode.setAttribute('class', 'custom-highlight');
            newNode.style.backgroundColor = color;
            range.surroundContents(newNode);
        }
    });
}

function getTextNodes() {
    let textNodes = [];
    function getTextNodesHelper(node) {
        if (node.nodeType == Node.TEXT_NODE) {
            textNodes.push(node);
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                getTextNodesHelper(node.childNodes[i]);
            }
        }
    }
    getTextNodesHelper(document.body);
    return textNodes;
}