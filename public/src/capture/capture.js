const MAX_PHOTOS = 4;

// The QR link carries the chat thread, a signed upload token and the
// backend's API base; the photos go to that backend's capture endpoint, which
// relays them to the customer's chat widget. There is no fallback backend: a
// link without them cannot be used.
const params = new URLSearchParams(location.search);
const uploadToken = params.get("token") || "";
const apiBase = (params.get("api") || "").replace(/\/$/, "");

// ─── State ───
let files = []; // Array of { file: File, url: string }
let preferredInput = "gallery"; // "gallery" or "camera"

// ─── DOM refs ───
const slide1 = document.getElementById("slide1");
const slide2 = document.getElementById("slide2");
const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const btnChoose = document.getElementById("btnChoose");
const btnCamera = document.getElementById("btnCamera");
const cameraInput = document.getElementById("cameraInput");
const photoGrid = document.getElementById("photoGrid");
const uploadCount = document.getElementById("uploadCounter");
const btnClearAll = document.getElementById("btnClearAll");
const replaceZone = document.getElementById("replaceZone");
const replaceTitle = document.getElementById("replaceTitle");
const replaceSub = document.getElementById("replaceSubtitle");
const limitMsg = document.getElementById("limitMsg");
const btnUse = document.getElementById("btnUse");
const btnUseText = document.getElementById("btnUseText");
const statusOvl = document.getElementById("statusOverlay");
const statusText = document.getElementById("statusText");
const statusSpin = document.getElementById("statusSpinner");
const statusDone = document.getElementById("statusDone");
const dot1 = document.getElementById("dot1");
const dot2 = document.getElementById("dot2");
const replaceIcon = document.querySelector(".replace-icon");

const ICON_GALLERY = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
</svg>`;
const ICON_CAMERA = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.822 1.316z" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
</svg>`;

// ─── Slide navigation ───
function showSlide(n) {
  if (n === 1) {
    slide1.classList.add("active");
    slide2.classList.remove("active");
    dot1.classList.add("active");
    dot2.classList.remove("active");
  } else {
    slide1.classList.remove("active");
    slide2.classList.add("active");
    dot1.classList.remove("active");
    dot2.classList.add("active");
  }
}

// ─── Render preview grid ───
function renderGrid() {
  photoGrid.innerHTML = "";
  files.forEach((item, idx) => {
    const cell = document.createElement("div");
    cell.className = "photo-cell";

    const img = document.createElement("img");
    img.src = item.url;
    img.alt = `Photo ${idx + 1}`;

    const removeBtn = document.createElement("button");
    removeBtn.className = "photo-remove";
    removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`;
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      removePhoto(idx);
    };

    cell.appendChild(img);
    cell.appendChild(removeBtn);
    photoGrid.appendChild(cell);
  });

  // Update counter
  uploadCount.textContent = `Uploaded (${files.length}/${MAX_PHOTOS})`;
  btnUseText.textContent = `Use ${files.length} Photo${files.length !== 1 ? "s" : ""}`;
  btnUse.disabled = files.length === 0;

  // Show/hide limit message
  if (files.length >= MAX_PHOTOS) {
    limitMsg.style.display = "flex";
    replaceTitle.textContent = "Replace a photo";
    replaceSub.textContent = "Tap or drag to replace any photo";
    replaceIcon.innerHTML = ICON_GALLERY;
  } else {
    limitMsg.style.display = "none";
    if (preferredInput === "camera") {
      replaceTitle.textContent = "Take more photos";
      replaceSub.textContent = `Tap to open camera (${MAX_PHOTOS - files.length} remaining)`;
      replaceIcon.innerHTML = ICON_CAMERA;
    } else {
      replaceTitle.textContent = "Add more photos";
      replaceSub.textContent = `Tap to add more (${MAX_PHOTOS - files.length} remaining)`;
      replaceIcon.innerHTML = ICON_GALLERY;
    }
  }
}

// ─── Add photos ───
function addPhotos(newFiles) {
  const remaining = MAX_PHOTOS - files.length;
  const toAdd = Array.from(newFiles).slice(0, remaining);

  toAdd.forEach((file) => {
    const url = URL.createObjectURL(file);
    files.push({ file, url });
  });

  if (files.length > 0) {
    renderGrid();
    showSlide(2);
  }
}

// ─── Remove photo ───
function removePhoto(index) {
  URL.revokeObjectURL(files[index].url);
  files.splice(index, 1);

  if (files.length === 0) {
    showSlide(1);
  } else {
    renderGrid();
  }
}

// ─── Clear all ───
function clearAll() {
  files.forEach((item) => URL.revokeObjectURL(item.url));
  files = [];
  preferredInput = "gallery"; // Reset preference
  showSlide(1);
}

// ─── Upload (parallel) ───
async function uploadPhotos() {
  if (files.length === 0) return;

  if (!apiBase || !uploadToken) {
    statusOvl.classList.add("active");
    statusSpin.style.display = "none";
    statusDone.style.display = "none";
    statusText.textContent =
      "This upload link is incomplete. Please scan the QR code again.";
    return;
  }

  statusOvl.classList.add("active");
  statusText.textContent = `Uploading ${files.length} photo${files.length !== 1 ? "s" : ""}...`;
  statusSpin.style.display = "block";
  statusDone.style.display = "none";

  try {
    // Fire all uploads in PARALLEL — one fetch per photo
    const uploads = files.map((item) => {
      const form = new FormData();
      form.append("photos", item.file);
      form.append("token", uploadToken);
      return fetch(`${apiBase}/capture/photos/`, {
        method: "POST",
        body: form,
      }).then((res) => {
        if (!res.ok) throw new Error(`Upload rejected (${res.status})`);
        return res;
      });
    });

    await Promise.all(uploads);

    // Show success
    statusSpin.style.display = "none";
    statusDone.style.display = "flex";
    statusText.textContent = "Done! You can close this page now.";
  } catch (err) {
    console.error("Upload failed:", err);
    statusSpin.style.display = "none";
    statusText.textContent = "Upload failed. Please try again.";
    setTimeout(() => {
      statusOvl.classList.remove("active");
    }, 2000);
  }
}

// ─── Event listeners ───

// Choose button & dropzone click → open file picker
btnChoose.onclick = (e) => {
  e.stopPropagation();
  preferredInput = "gallery";
  fileInput.value = "";
  fileInput.click();
};

dropzone.onclick = () => {
  preferredInput = "gallery";
  fileInput.value = "";
  fileInput.click();
};

// Replace zone → open file picker (adds more or replaces)
replaceZone.onclick = () => {
  if (preferredInput === "camera" && files.length < MAX_PHOTOS) {
    cameraInput.value = "";
    cameraInput.click();
  } else {
    fileInput.value = "";
    fileInput.click();
  }
};

// File selected (Gallery)
fileInput.onchange = (e) => {
  if (e.target.files && e.target.files.length > 0) {
    addPhotos(e.target.files);
  }
};

// Camera button click
btnCamera.onclick = (e) => {
  e.stopPropagation();
  preferredInput = "camera";
  cameraInput.value = "";
  cameraInput.click();
};

// File selected (Camera)
cameraInput.onchange = (e) => {
  if (e.target.files && e.target.files.length > 0) {
    addPhotos(e.target.files);
  }
};

// Drag & drop on dropzone
dropzone.ondragover = (e) => {
  e.preventDefault();
  dropzone.classList.add("drag-over");
};
dropzone.ondragleave = () => {
  dropzone.classList.remove("drag-over");
};
dropzone.ondrop = (e) => {
  e.preventDefault();
  dropzone.classList.remove("drag-over");
  if (e.dataTransfer.files.length > 0) {
    addPhotos(e.dataTransfer.files);
  }
};

// Clear all
btnClearAll.onclick = clearAll;

// Use photos → parallel upload
btnUse.onclick = uploadPhotos;
