document.addEventListener('DOMContentLoaded', function() {
    
    const fileBtn = document.getElementById("upload-files-btn");
    const cameraBtn = document.getElementById("upload-camera-btn");
    const uploadArea = document.getElementById("upload-area");
    const filesArea = document.getElementById("files-area");
    const cameraArea = document.getElementById("camera-area");

    // upload from device files
    fileBtn.addEventListener("click", ()=> { 
        uploadArea.classList.add("d-none");
        filesArea.classList.remove("d-none");
     });

});