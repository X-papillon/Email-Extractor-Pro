const extractBtn = document.getElementById("extractBtn");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");
const urlList = document.getElementById("urlList");
const count = document.getElementById("count");

let storedEmails = [];

// Load stored emails
document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["emails"], (result) => {
        if (result.emails) {
            storedEmails = result.emails;
            displayEmails(storedEmails);
        }
    });
});

extractBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: extractEmailsFromPage
        }, (results) => {

            if (results && results[0].result) {

                let newEmails = results[0].result;

                // Merge + remove duplicates
                storedEmails = [...new Set([...storedEmails, ...newEmails])];

                chrome.storage.local.set({ emails: storedEmails });

                displayEmails(storedEmails);
            }

        });
    });
});

function extractEmailsFromPage() {

    const pageText = document.documentElement.innerHTML;

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi;

    let emails = pageText.match(emailRegex);

    return emails ? [...new Set(emails)] : [];
}

function displayEmails(list) {
    urlList.innerHTML = "";

    list.forEach(email => {
        const a = document.createElement("a");
        a.textContent = email;
        a.href = "mailto:" + email;
        urlList.appendChild(a);
    });

    count.textContent = list.length;
}

// Export TXT
exportBtn.addEventListener("click", () => {

    if (storedEmails.length === 0) return;

    const blob = new Blob([storedEmails.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "extracted-emails.txt";
    a.click();

    URL.revokeObjectURL(url);
});

// Clear
clearBtn.addEventListener("click", () => {
    storedEmails = [];
    chrome.storage.local.remove("emails");
    displayEmails([]);
});
