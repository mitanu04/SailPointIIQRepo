const globalLoaderOverlayId = "loadingOverlay";
const dFlexDiv = document.createElement('div');
dFlexDiv.id = globalLoaderOverlayId;

dFlexDiv.innerHTML = `
  <div class="pulse-wrapper">
    <svg xmlns="http://www.w3.org/2000/svg" width="39" height="38" viewBox="0 0 39 38" fill="none">
      <ellipse cx="20.5" cy="34.5" rx="3.5" ry="3.5" transform="rotate(90 20.5 34.5)" fill="#10A2CE"/>
      <circle cx="9.15685" cy="29.75" r="4" transform="rotate(-45 9.15685 29.75)" fill="#10A2CE"/>
      <ellipse cx="4.5" cy="18.5" rx="4.5" ry="4.5" transform="rotate(180 4.5 18.5)" fill="#10A2CE"/>
      <ellipse cx="36.5" cy="18.5" rx="2.5" ry="2.5" transform="rotate(180 36.5 18.5)" fill="#10A2CE"/>
      <ellipse cx="20.5" cy="2.5" rx="2.5" ry="2.5" transform="rotate(90 20.5 2.5)" fill="#10A2CE"/>
      <ellipse cx="31.8135" cy="29.8139" rx="2.5" ry="2.5" transform="rotate(45 31.8135 29.8139)" fill="#10A2CE"/>
      <ellipse cx="9.18652" cy="7.18641" rx="2.5" ry="2.5" transform="rotate(45 9.18652 7.18641)" fill="#10A2CE"/>
      <ellipse cx="31.8139" cy="7.18652" rx="2.5" ry="2.5" transform="rotate(-45 31.8139 7.18652)" fill="#10A2CE"/>
    </svg>
  </div>
  <div id="ui-message">${loaderMessage}</div>
`;

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

//Setting global error message
function setGlobalLoaderErrorMessage(errorMsg){
  const overlay = document.getElementById(globalLoaderOverlayId);
  if(overlay) {
    overlay.querySelector(".pulse-wrapper").style.display = "none";
    const uiMsgElement = overlay.querySelector('#ui-message');
    // Vocabulary translations should be done
    // TODO: Should handle this global errors with translation in index.html
    uiMsgElement.innerHTML = "<div class='errorMsg'>"+escapeHTML(errorMsg)+"</div>";
  }
}


document.documentElement.appendChild(dFlexDiv);
