const style = document.createElement('style');
style.textContent = `
    .highlight-toolbar {
    position: absolute;
    display: flex;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 9999;
}

.color-button {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid #ccc;
    margin: 0 2px;
    cursor: pointer;
}

.delete-button {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid #ccc;
    background-color: #fff;
    color: #000;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 5px;
}

.custom-highlight {
    border-radius: 3px;
    padding: 2px 0;
}
`;
document.head.appendChild(style);

const highlightColors = ['yellow', 'lightgreen', 'lightblue', 'pink'];
const textColor = 'black';
let currentHighlightColor = highlightColors[0];

// Create floating toolbar
const toolbar = document.createElement('div');
toolbar.className = 'highlight-toolbar';
toolbar.style.display = 'none';
document.body.appendChild(toolbar);

// Add color buttons to toolbar
highlightColors.forEach(color => {
    const colorButton = document.createElement('button');
    colorButton.className = 'color-button';
    colorButton.style.backgroundColor = color;
    colorButton.addEventListener('click', () => {
        currentHighlightColor = color;
        applyHighlight();
    });
    toolbar.appendChild(colorButton);
});

// Add delete button to toolbar
const deleteButton = document.createElement('button');
deleteButton.className = 'delete-button';
deleteButton.innerHTML = '×';
deleteButton.addEventListener('click', removeHighlight);
toolbar.appendChild(deleteButton);

document.addEventListener('mouseup', handleSelection);
document.addEventListener('mousedown', (e) => {
    if (!toolbar.contains(e.target)) {
        toolbar.style.display = 'none';
    }
});

function handleSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        toolbar.style.display = 'flex';
        toolbar.style.left = `${rect.left + window.scrollX + (rect.width / 2) - (toolbar.offsetWidth / 2)}px`;
        toolbar.style.top = `${rect.top + window.scrollY - toolbar.offsetHeight - 10}px`;
    } else {
        toolbar.style.display = 'none';
    }
}

function applyHighlight() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
        const range = selection.getRangeAt(0);
        const highlightSpan = findHighlightSpan(range.startContainer) || findHighlightSpan(range.endContainer);

        if (highlightSpan) {
            highlightSpan.style.backgroundColor = currentHighlightColor;
            updateHighlightInStorage(selectedText, currentHighlightColor);
        } else {
            const newNode = document.createElement('span');
            newNode.className = 'custom-highlight';
            newNode.style.backgroundColor = currentHighlightColor;
            newNode.style.color = textColor;
            range.surroundContents(newNode);
            saveHighlightToStorage(selectedText, currentHighlightColor);
        }

        toolbar.style.display = 'none';
        selection.removeAllRanges();
    }
}

function removeHighlight() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const highlightSpan = findHighlightSpan(range.startContainer) || findHighlightSpan(range.endContainer);

    if (highlightSpan) {
        const highlightedText = highlightSpan.textContent;
        const parent = highlightSpan.parentNode;
        while (highlightSpan.firstChild) {
            parent.insertBefore(highlightSpan.firstChild, highlightSpan);
        }
        parent.removeChild(highlightSpan);
        parent.normalize();
        removeHighlightFromStorage(highlightedText);
    }

    toolbar.style.display = 'none';
    selection.removeAllRanges();
}

function findHighlightSpan(node) {
    while (node && node !== document.body) {
        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('custom-highlight')) {
            return node;
        }
        node = node.parentNode;
    }
    return null;
}

// Load and apply saved highlights
window.addEventListener('load', function() {
    chrome.storage.sync.get({highlights: {}}, function(result) {
        let highlights = result.highlights[window.location.href];
        if (highlights) {
            highlights.forEach(function(highlight) {
                applyHighlightToText(highlight.text, highlight.color);
            });
        }
    });
});

function applyHighlightToText(text, color) {
    const textNodes = getTextNodes();
    textNodes.forEach(function(node) {
        const index = node.textContent.indexOf(text);
        if (index >= 0) {
            const range = document.createRange();
            range.setStart(node, index);
            range.setEnd(node, index + text.length);
            const newNode = document.createElement('span');
            newNode.className = 'custom-highlight';
            newNode.style.backgroundColor = color;
            newNode.style.color = textColor;
            range.surroundContents(newNode);
        }
    });
}

function getTextNodes() {
    const textNodes = [];
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

function updateHighlightInStorage(text, color) {
    chrome.storage.sync.get({highlights: {}}, function(result) {
        let highlights = result.highlights;
        if (highlights[window.location.href]) {
            const index = highlights[window.location.href].findIndex(h => h.text === text);
            if (index !== -1) {
                highlights[window.location.href][index].color = color;
                chrome.storage.sync.set({highlights: highlights});
            }
        }
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