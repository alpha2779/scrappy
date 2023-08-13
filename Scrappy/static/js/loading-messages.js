// Function to load CSV file
function loadCSVFile(url, callback) {
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function () {
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
    callback(xhr.responseText);
    }
};
xhr.open("GET", url, true);
xhr.send();
}

// Function to parse CSV data
function parseCSVData(data) {
var messages = data.split("\n");
messages = messages.filter(function (message) {
    return message.trim() !== "";
});
return messages;
}

// Function to update the loading message
function updateLoadingMessage(messages) {
var loadingMessageElement = document.getElementById("loading-message");
var randomIndex = Math.floor(Math.random() * messages.length);
var randomMessage = messages[randomIndex];
loadingMessageElement.textContent = randomMessage;
}

// Fetch and load the CSV file
loadCSVFile("static/loading-messages.csv", function (data) {
var messages = parseCSVData(data);
updateLoadingMessage(messages);
});