document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email");

    fetch("/documents")
        .then(response => {
            if (!response.ok) throw new Error("Error fetching documents");
            return response.json();
        })
        .then(documents => {
            const documentList = document.getElementById("document-list");
            documents.forEach(doc => {
                const listItem = document.createElement("li");
                listItem.textContent = doc.title;
                listItem.onclick = () => window.location.href = `/editor.html?doc=${doc.id}&email=${email}`;
                documentList.appendChild(listItem);
            });
        })
        .catch(error => console.error("Error fetching documents:", error));
});

function createNewDocument() {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email");

    fetch("/documents", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ title: "Untitled", content: "" })
    }).then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.json();
    }).then(doc => {
        window.location.href = `/editor.html?doc=${doc.id}&email=${email}`;
    }).catch(error => {
        console.error("Error creating document:", error);
        alert(`Error creating document: ${error.message}`);
    });
}
