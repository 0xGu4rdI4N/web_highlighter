document.getElementById('yellow').addEventListener('click', () => setColor('yellow'));
document.getElementById('green').addEventListener('click', () => setColor('lightgreen'));
document.getElementById('blue').addEventListener('click', () => setColor('lightblue'));
document.getElementById('clear').addEventListener('click', clearHighlights);

function setColor(color) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "setColor", color: color});
    });
}

function clearHighlights() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "clearHighlights"});
    });
}