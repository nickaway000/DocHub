document.addEventListener("DOMContentLoaded", () => {
    const socket = io();
    const urlParams = new URLSearchParams(window.location.search);
    const documentId = urlParams.get("doc");
    const email = urlParams.get("email");

    const documentTitle = document.getElementById("document-title");
    const documentContent = document.getElementById("document-content");
    const saveButton = document.getElementById("save-button");
    const collaboratorList = document.getElementById("collaborator-list");

    socket.emit("joinDocument", { documentId, email });

    socket.on("documentContent", ({ document }) => {
        documentTitle.value = document.title;
        documentContent.value = document.content;
    });

    socket.on("documentUpdated", ({ document }) => {
        documentTitle.value = document.title;
        documentContent.value = document.content;
    });

    socket.on("collaboratorJoined", ({ email }) => {
        const listItem = document.createElement("li");
        listItem.textContent = email;
        collaboratorList.appendChild(listItem);
    });

    documentContent.addEventListener("input", () => {
        socket.emit("editDocument", {
            documentId,
            title: documentTitle.value,
            content: documentContent.value,
        });
    });

    saveButton.addEventListener("click", () => {
        fetch(`/documents/${documentId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: documentTitle.value,
                content: documentContent.value
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text) });
            }
            return response.json();
        })
        .then(doc => {
            console.log("Document saved:", doc);
        })
        .catch(error => {
            console.error("Error saving document:", error);
            alert(`Error saving document: ${error.message}`);
        });
    });
});
