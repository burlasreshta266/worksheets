// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {

    const cameraButton = document.getElementById('upload-camera-btn');
    const filesButton = document.getElementById('upload-files-btn');
    const choiceArea = document.getElementById('upload-choice-area'); 
    const filesArea = document.getElementById('files-area');
    const cameraArea = document.getElementById('camera-area');

    // Show Camera Form
    cameraButton.addEventListener('click', () => {
        choiceArea.classList.add('d-none');
        cameraArea.classList.remove('d-none');
    });

    // Show Files Form
    filesButton.addEventListener('click', () => {
        choiceArea.classList.add('d-none');
        filesArea.classList.remove('d-none');
    });
});