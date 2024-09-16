let highlightColor = 'yellow';
const textColor = 'black';

document.addEventListener('mouseup', function() {
    let selection = window.getSelection();
    let selectedText = selection.toString().trim();
    if (selectedText.length > 0) {
        let range = selection.getRangeAt(0);
        let startNode = range.startContainer;
        let endNode = range.endContainer;
        
        // Check if the selection intersects with a highlight
        let highlightSpan = findHighlightSpan(startNode) || findHighlightSpan(endNode);
        
        if (highlightSpan) {
            // Remove the highlight
            removeHighlight(highlightSpan);
        } else {
            // Add new highlight
            let newNode = document.createElement('span');
            newNode.setAttribute('class', 'custom-highlight');
            newNode.style.backgroundColor = highlightColor;
            newNode.style.color = textColor;
            range.surroundContents(newNode);
            
            // Save the highlight
            saveHighlightToStorage(selectedText, highlightColor);
        }
    }
});

function findHighlightSpan(node) {
    while (node && node !== document.body) {
        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('custom-highlight')) {
            return node;
        }
        node = node.parentNode;
    }
    return null;
}

function removeHighlight(highlightSpan) {
    let highlightedText = highlightSpan.textContent;
    let parent = highlightSpan.parentNode;
    while (highlightSpan.firstChild) {
        parent.insertBefore(highlightSpan.firstChild, highlightSpan);
    }
    parent.removeChild(highlightSpan);
    parent.normalize(); // Combine adjacent text nodes
    
    // Remove from storage
    removeHighlightFromStorage(highlightedText);
}

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
            newNode.style.color = textColor;
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

function saveHighlightToStorage(text, color) {
    chrome.storage.sync.get({highlights: {}}, function(result) {
        let highlights = result.highlights;
        if (!highlights[window.location.href]) {
            highlights[window.location.href] = [];
        }
        highlights[window.location.href].push({
            text: text,
            color: color
        });
        chrome.storage.sync.set({highlights: highlights});
    });
}

function removeHighlightFromStorage(text) {
    chrome.storage.sync.get({highlights: {}}, function(result) {
        let highlights = result.highlights;
        if (highlights[window.location.href]) {
            highlights[window.location.href] = highlights[window.location.href].filter(h => h.text !== text);
            chrome.storage.sync.set({highlights: highlights});
        }
    });
}

// Add message listener
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "setColor") {
        highlightColor = request.color;
    } else if (request.action === "clearHighlights") {
        let highlights = document.getElementsByClassName('custom-highlight');
        while(highlights.length > 0){
            removeHighlight(highlights[0]);
        }
        // Clear stored highlights for this page
        chrome.storage.sync.get({highlights: {}}, function(result) {
            let highlights = result.highlights;
            delete highlights[window.location.href];
            chrome.storage.sync.set({highlights: highlights});
        });
    }
});