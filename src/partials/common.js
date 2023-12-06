///////////////////
// Cookies Popup //
///////////////////

(function(){

  const localStorageKey = "unisave-cookies-popup-accepted";

  function createPopup() {
    if (window.localStorage.getItem(localStorageKey) == "true")
      return;

    const popup = document.createElement("div");
    popup.classList.add("cookies-popup");
    popup.innerHTML = `
      <div class="cookies-text">
        By using this website, you agree to our cookies (view
          <a href="/legal/privacy-policy">privacy policy</a>
        ).
      </div>
      <button class="cookies-button">OK</button>
    `;

    popup.querySelector(".cookies-button").addEventListener("click", () => {
      window.localStorage.setItem(localStorageKey, "true");
      popup.remove();
    });

    document.body.appendChild(popup);
  }

  window.addEventListener("load", createPopup);

}());
