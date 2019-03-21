chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({name: 'mikina3'})
    chrome.storage.sync.set({reg: 'NA1'})
    
})