const canvas = document.getElementById("meme-canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const nogsImageTemplate = createImage("./nogs.png");

const IMAGE_SCALE = 0.8; // Resize uploaded image to 80%
const ELEMENT_SCALE = 0.6; // Constant scale for elements

let canvasImage = new Image();
let nogs = [];
let isDragging = false;
let currentElement = null;
let offsetX, offsetY;
let hue = 0; // Initial hue for color slider

// Initialize default canvas size
canvas.width = 400;
canvas.height = 400;

// Event Listeners
document.getElementById("image-upload").addEventListener("change", handleImageUpload);
document.getElementById("add-nogs-button").addEventListener("click", () => addElement(nogsImageTemplate, nogs));
document.getElementById("delete-nogs-button").addEventListener("click", () => deleteLastElement(nogs));
document.getElementById("reset-button").addEventListener("click", resetCanvas);
document.getElementById("download-button").addEventListener("click", downloadCanvas);

// Debounced event listeners
document.getElementById("resize-slider").addEventListener("input", debounce((e) => resizeElements(e, nogs), 200));
document.getElementById("rotate-slider").addEventListener("input", debounce((e) => rotateElements(e, nogs), 200));

// Color slider without debouncing
document.getElementById("color-slider").addEventListener("input", (e) => changeColor(e));

canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
canvas.addEventListener("touchend", handleTouchEnd);

function createImage(src) {
    const img = new Image();
    img.src = src;
    img.crossOrigin = "anonymous";
    return img;
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            displayButtonContainer();
            canvasImage.onload = () => {
                adjustCanvasSize(canvasImage);
                drawCanvasImage(event.target.result);
            };
            canvasImage.onerror = () => console.error('Failed to load image');
            canvasImage.src = event.target.result;
        };
        reader.onerror = () => console.error('Failed to read file');
        reader.readAsDataURL(file);
    } else {
        console.warn('No file selected');
    }
}

function displayButtonContainer() {
    const buttonContainer = document.getElementById("button-container");
    buttonContainer.style.display = "flex";
}

function adjustCanvasSize(image) {
    const aspectRatio = image.width / image.height;
    
    // Set canvas dimensions
    if (aspectRatio > 1) { // Image is wider than tall
        canvas.width = 400;
        canvas.height = 400 / aspectRatio;
    } else { // Image is taller or equal to wide
        canvas.height = 400;
        canvas.width = 400 * aspectRatio;
    }
}

function drawCanvasImage(src) {
    clearCanvas();
    ctx.drawImage(canvasImage, 0, 0, canvas.width, canvas.height);
    drawCanvas();
}

function addElement(template, elementsArray) {
    const element = {
        image: template,
        width: template.width * ELEMENT_SCALE, // Constant scale for elements
        height: template.height * ELEMENT_SCALE, // Constant scale for elements
        x: canvas.width / 2 - (template.width * ELEMENT_SCALE) / 2,
        y: canvas.height / 2 - (template.height * ELEMENT_SCALE) / 2,
        rotation: 0,
        color: 'white' // Default color
    };
    elementsArray.push(element);
    drawCanvas();
}

function resizeElements(e, elementsArray) {
    const scale = e.target.value;
    elementsArray.forEach(element => {
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        element.width = element.image.width * scale;
        element.height = element.image.height * scale;
        element.x = centerX - element.width / 2;
        element.y = centerY - element.height / 2;
    });
    drawCanvas();
}

function rotateElements(e, elementsArray) {
    const rotation = (e.target.value * Math.PI) / 180;
    elementsArray.forEach(element => {
        element.rotation = rotation;
    });
    drawCanvas();
}

function changeColor(e) {
    hue = e.target.value;
    drawCanvas();
}

function deleteLastElement(elementsArray) {
    elementsArray.pop();
    drawCanvas();
}

function resetCanvas() {
    nogs = [];
    drawCanvas();
}

function downloadCanvas() {
    const imageDataUrl = canvas.toDataURL();
    const link = document.createElement("a");
    link.href = imageDataUrl;
    link.download = "nogs-it.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    drawCanvas();
}

function handleMouseDown(e) {
    const { mouseX, mouseY } = getMousePosition(e);
    currentElement = findElement(mouseX, mouseY);

    if (currentElement) {
        isDragging = true;
        offsetX = mouseX - currentElement.x;
        offsetY = mouseY - currentElement.y;
        currentElement.isDragging = true;
    }
}

function handleMouseMove(e) {
    if (isDragging && currentElement) {
        const { mouseX, mouseY } = getMousePosition(e);
        currentElement.x = mouseX - offsetX;
        currentElement.y = mouseY - offsetY;
        drawCanvas();
    }
}

function handleMouseUp() {
    if (currentElement) {
        currentElement.isDragging = false;
        isDragging = false;
        currentElement = null;
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    const { mouseX, mouseY } = getTouchPosition(e);
    currentElement = findElement(mouseX, mouseY);

    if (currentElement) {
        isDragging = true;
        offsetX = mouseX - currentElement.x;
        offsetY = mouseY - currentElement.y;
        currentElement.isDragging = true;
    }
}

function handleTouchMove(e) {
    if (isDragging && currentElement) {
        e.preventDefault();
        const { mouseX, mouseY } = getTouchPosition(e);
        currentElement.x = mouseX - offsetX;
        currentElement.y = mouseY - offsetY;
        drawCanvas();
    }
}

function handleTouchEnd() {
    if (currentElement) {
        currentElement.isDragging = false;
        isDragging = false;
        currentElement = null;
    }
}

function getMousePosition(e) {
    return { mouseX: e.offsetX, mouseY: e.offsetY };
}

function getTouchPosition(e) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        mouseX: (touch.clientX - rect.left) * scaleX,
        mouseY: (touch.clientY - rect.top) * scaleY,
    };
}

function findElement(mouseX, mouseY) {
    return nogs.find(element =>
        mouseX > element.x &&
        mouseX < element.x + element.width &&
        mouseY > element.y &&
        mouseY < element.y + element.height
    );
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawCanvas() {
    clearCanvas();
    if (canvasImage.src) {
        ctx.drawImage(canvasImage, 0, 0, canvas.width, canvas.height);
    }
    applyGradientMapFilter();
    drawElements(nogs);
}

function drawElements(elementsArray) {
    elementsArray.forEach(element => {
        ctx.save();
        ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
        ctx.rotate(element.rotation);

        // Apply hue filter
        ctx.filter = `hue-rotate(${hue}deg)`;
        ctx.drawImage(element.image, -element.width / 2, -element.height / 2, element.width, element.height);
        
        // Reset filter
        ctx.filter = 'none';
        ctx.restore();
    });
}

function applyGradientMapFilter() {
    // Implement gradient mapping logic if needed.
}

// Debounce function to limit the rate at which a function is executed
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}
