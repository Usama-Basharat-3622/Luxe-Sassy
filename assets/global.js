function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return fn(...args);
  };
}

function fetchConfig(type = "json") {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: `application/${type}`,
    },
  };
}

try {
  document.querySelector(":focus-visible");
} catch (e) {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = [
    "ARROWUP",
    "ARROWDOWN",
    "ARROWLEFT",
    "ARROWRIGHT",
    "TAB",
    "ENTER",
    "SPACE",
    "ESCAPE",
    "HOME",
    "END",
    "PAGEUP",
    "PAGEDOWN",
  ];
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener("keydown", (event) => {
    if (navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener("mousedown", (event) => {
    mouseClick = true;
  });

  window.addEventListener(
    "focus",
    () => {
      if (currentFocusedElement)
        currentFocusedElement.classList.remove("focused");

      if (mouseClick) return;

      currentFocusedElement = document.activeElement;
      currentFocusedElement.classList.add("focused");
    },
    true
  );
}

function getFocusableElements(container) {
  const currentFocusableElementsString =
    'a[href]:not([disabled]):not([tabindex^="-"]), button:not([disabled]):not([tabindex^="-"]), textarea:not([disabled]):not([tabindex^="-"]), input:not([disabled]):not([tabindex^="-"]), select:not([disabled]):not([tabindex^="-"])';

  return Array.from(
    container.querySelectorAll(currentFocusableElementsString)
  ).filter((ele) => ele.offsetWidth !== 0 || ele.offsetHeight !== 0);
}

const trapFocusHandlers = {};
function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  // console.log(elements);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== "TAB") return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener("focusout", trapFocusHandlers.focusout);
  document.addEventListener("focusin", trapFocusHandlers.focusin);

  elementToFocus.focus();

  if (
    elementToFocus.tagName === "INPUT" &&
    ["search", "text", "email", "url"].includes(elementToFocus.type) &&
    elementToFocus.value
  ) {
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener("focusin", trapFocusHandlers.focusin);
  document.removeEventListener("focusout", trapFocusHandlers.focusout);
  document.removeEventListener("keydown", trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== "ESCAPE") return;

  const openDetailsElement = event.target.closest("details[open]");
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector("summary");
  openDetailsElement.removeAttribute("open");
  summaryElement.setAttribute("aria-expanded", false);
  summaryElement.focus();
}

function pauseAllMedia() {
  document.querySelectorAll(".js-youtube").forEach((video) => {
    video.contentWindow.postMessage(
      '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
      "*"
    );
  });
  document.querySelectorAll(".js-vimeo").forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', "*");
  });
  document.querySelectorAll("video").forEach((video) => video.pause());
  document.querySelectorAll("product-model").forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function scrolledCheck() {
  if (window.pageYOffset > 0) {
    document.body.classList.add("window-scrolled");
  } else {
    document.body.classList.remove("window-scrolled");
  }
}
scrolledCheck();
window.addEventListener("scroll", scrolledCheck);

function setShortViewportHeight() {
  const value = document.documentElement.clientHeight;
  const currentValue = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--100-svh");
  if (value != currentValue) {
    document.documentElement.style.setProperty("--100-svh", `${value}px`);
  }
}

function setDynamicViewportHeight() {
  const value = window.innerHeight;
  const currentValue = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--100-dvh");

  if (value != currentValue) {
    document.documentElement.style.setProperty("--100-dvh", `${value}px`);
  }
}

function setHeaderBottomPosition() {
  const header = document.getElementById("header");
  if (!header) return;
  const value = header.getBoundingClientRect().bottom;
  const currentValue = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--header-bottom-position");

  if (value && value != currentValue) {
    document.documentElement.style.setProperty(
      "--header-bottom-position",
      `${value}px`
    );
  }
}

function setFooterHeight() {
  const footer = document.getElementById("footer");
  if (!footer) return;
  const value = footer.getBoundingClientRect().height;
  const currentValue = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--footer-height");

  if (value && value != currentValue) {
    document.documentElement.style.setProperty("--footer-height", `${value}px`);
  }
}

function setProductGridHeight() {
  const productGrid = document.querySelector(".product-grid-container");
  if (!productGrid) return;
  const value = productGrid.getBoundingClientRect().height;
  const currentValue = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--product-grid-height");

  if (value && value != currentValue) {
    document.documentElement.style.setProperty(
      "--product-grid-height",
      `${value}px`
    );
  }
}

function setCustomPropertiesOnLoad() {
  setShortViewportHeight();
  setDynamicViewportHeight();

  setHeaderBottomPosition();
  setFooterHeight();
  setProductGridHeight();
}

function setCustomPropertiesOnScroll() {}

function setCustomPropertiesOnResize() {
  setShortViewportHeight();
  setDynamicViewportHeight();

  setFooterHeight();
  setProductGridHeight();
}

window.addEventListener("load", setCustomPropertiesOnLoad, false);

window.addEventListener(
  "scroll",
  debounce(setCustomPropertiesOnScroll, 300),
  false
);

window.addEventListener(
  "resize",
  debounce(setCustomPropertiesOnResize, 300),
  false
);

document.querySelectorAll("details summary").forEach((summary) => {
  summary.setAttribute(
    "aria-expanded",
    summary.parentNode.hasAttribute("open")
  );

  if (summary.nextElementSibling.getAttribute("id")) {
    summary.setAttribute("aria-controls", summary.nextElementSibling.id);
  }

  summary.addEventListener("click", (event) => {
    event.currentTarget.setAttribute(
      "aria-expanded",
      !event.currentTarget.closest("details").hasAttribute("open")
    );
  });

  if (summary.closest("header-drawer")) return;
  summary.parentElement.addEventListener("keyup", onKeyUpEscape);
});

document.querySelectorAll(".accordion-group").forEach((item) => {
  item.addEventListener("click", function (event) {
    let currentAccordion = event.target.closest(".accordion-group-item");
    let currentSummary = event.target.closest(".accordion-group-item summary");
    let accordionGroup = event.currentTarget;

    if (!currentSummary) return;
    if (!accordionGroup.contains(currentSummary)) return;

    accordionGroup
      .querySelectorAll(".accordion-group-item")
      .forEach((accordion) => {
        if (accordion != currentAccordion) {
          accordion.removeAttribute("open");
        }
      });
  });
});

class SectionId {
  static #separator = "__";

  // for a qualified section id (e.g. 'template--22224696705326__main'), return just the section id (e.g. 'template--22224696705326')
  static parseId(qualifiedSectionId) {
    return qualifiedSectionId.split(SectionId.#separator)[0];
  }

  // for a qualified section id (e.g. 'template--22224696705326__main'), return just the section name (e.g. 'main')
  static parseSectionName(qualifiedSectionId) {
    return qualifiedSectionId.split(SectionId.#separator)[1];
  }

  // for a section id (e.g. 'template--22224696705326') and a section name (e.g. 'recommended-products'), return a qualified section id (e.g. 'template--22224696705326__recommended-products')
  static getIdForSection(sectionId, sectionName) {
    return `${sectionId}${SectionId.#separator}${sectionName}`;
  }
}

class HTMLUpdateUtility {
  /**
   * Used to swap an HTML node with a new node.
   * The new node is inserted as a previous sibling to the old node, the old node is hidden, and then the old node is removed.
   *
   * The function currently uses a double buffer approach, but this should be replaced by a view transition once it is more widely supported https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
   */
  static viewTransition(
    oldNode,
    newContent,
    preProcessCallbacks = [],
    postProcessCallbacks = []
  ) {
    preProcessCallbacks?.forEach((callback) => callback(newContent));

    const newNodeWrapper = document.createElement("div");
    HTMLUpdateUtility.setInnerHTML(newNodeWrapper, newContent.outerHTML);
    const newNode = newNodeWrapper.firstChild;

    // dedupe IDs
    const uniqueKey = Date.now();
    oldNode.querySelectorAll("[id], [form]").forEach((element) => {
      element.id && (element.id = `${element.id}-${uniqueKey}`);
      element.form &&
        element.setAttribute(
          "form",
          `${element.form.getAttribute("id")}-${uniqueKey}`
        );
    });

    oldNode.parentNode.insertBefore(newNode, oldNode);
    oldNode.style.display = "none";

    postProcessCallbacks?.forEach((callback) => callback(newNode));

    setTimeout(() => oldNode.remove(), 500);
  }

  // Sets inner HTML and reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
  static setInnerHTML(element, html) {
    element.innerHTML = html;
    element.querySelectorAll("script").forEach((oldScriptTag) => {
      const newScriptTag = document.createElement("script");
      Array.from(oldScriptTag.attributes).forEach((attribute) => {
        newScriptTag.setAttribute(attribute.name, attribute.value);
      });
      newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
      oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
    });
  }
}

class CartPerformance {
  static #metric_prefix = "cart-performance";

  static createStartingMarker(benchmarkName) {
    const metricName = `${CartPerformance.#metric_prefix}:${benchmarkName}`;
    return performance.mark(`${metricName}:start`);
  }

  static measureFromEvent(benchmarkName, event) {
    const metricName = `${CartPerformance.#metric_prefix}:${benchmarkName}`;
    const startMarker = performance.mark(`${metricName}:start`, {
      startTime: event.timeStamp,
    });

    const endMarker = performance.mark(`${metricName}:end`);

    performance.measure(metricName, `${metricName}:start`, `${metricName}:end`);
  }

  static measureFromMarker(benchmarkName, startMarker) {
    const metricName = `${CartPerformance.#metric_prefix}:${benchmarkName}`;
    const endMarker = performance.mark(`${metricName}:end`);

    performance.measure(metricName, startMarker.name, `${metricName}:end`);
  }

  static measure(benchmarkName, callback) {
    const metricName = `${CartPerformance.#metric_prefix}:${benchmarkName}`;
    const startMarker = performance.mark(`${metricName}:start`);

    callback();

    const endMarker = performance.mark(`${metricName}:end`);

    performance.measure(metricName, `${metricName}:start`, `${metricName}:end`);
  }
}

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector("details");

    this.addEventListener("keyup", this.onKeyUp.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll("summary").forEach((summary) =>
      summary.addEventListener("click", this.onSummaryClick.bind(this))
    );
    // this.querySelectorAll(
    //   "button:not(.localization-selector):not(.country-selector__close-button):not(.country-filter__reset-button)"
    // ).forEach((button) =>
    //   button.addEventListener("click", this.onCloseButtonClick.bind(this))
    // );

    this.querySelector(".mobile-facets__close-button")?.addEventListener(
      "click",
      this.closeMenuDrawer.bind(this)
    );
    this.querySelector(".mobile-facets__open").addEventListener(
      "click",
      this.openMenuDrawer.bind(this)
    );
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    const openDetailsElement = event.target.closest("details[open]");
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(
          event,
          this.mainDetailsToggle.querySelector("summary")
        )
      : this.closeSubmenu(openDetailsElement);
  }

  // toggleMenuDrawer(event) {
  //   if (document.querySelector('.product-grid-container facet-filters-form').classList.contains('active')) {
  //     document.querySelector('.product-grid-container facet-filters-form').classList.remove('active');
  //   }else{
  //     document.querySelector('.product-grid-container facet-filters-form').classList.add('active');
  //   }
  //   document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  // }

  onSummaryClick(event) {
    // console.log('triggered')
    // const summaryElement = event.currentTarget;
    // const detailsElement = summaryElement.parentNode;
    // const parentMenuElement = detailsElement.closest(".has-submenu");
    // const isOpen = detailsElement.hasAttribute("open");
    // const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // function addTrapFocus() {
    //   trapFocus(
    //     summaryElement.nextElementSibling,
    //     detailsElement.querySelector("button")
    //   );
    //   summaryElement.nextElementSibling.removeEventListener(
    //     "transitionend",
    //     addTrapFocus
    //   );
    // }
    // if (detailsElement === this.mainDetailsToggle) {
    //   if (isOpen) event.preventDefault();
    //   isOpen
    //     ? this.closeMenuDrawer(event, summaryElement)
    //     : this.openMenuDrawer(summaryElement);
    //   if (window.matchMedia("(max-width: 990px)")) {
    //     document.documentElement.style.setProperty(
    //       "--viewport-height",
    //       `${window.innerHeight}px`
    //     );
    //   }
    // } else {
    //   setTimeout(() => {
    //     detailsElement.classList.add("menu-opening");
    //     summaryElement.setAttribute("aria-expanded", true);
    //     parentMenuElement && parentMenuElement.classList.add("submenu-open");
    //     !reducedMotion || reducedMotion.matches
    //       ? addTrapFocus()
    //       : summaryElement.nextElementSibling.addEventListener(
    //           "transitionend",
    //           addTrapFocus
    //         );
    //   }, 100);
    // }
  }

  openMenuDrawer(summaryElement) {
    // setTimeout(() => {
    //   this.mainDetailsToggle.classList.add("menu-opening");
    // });
    // summaryElement.setAttribute("aria-expanded", true);
    // trapFocus(this.mainDetailsToggle, summaryElement);
    // document.querySelector('.product-grid-container facet-filters-form').classList.add('active');
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event === undefined) return;

    // document.querySelector('.product-grid-container facet-filters-form').classList.remove('active');
    // this.mainDetailsToggle.classList.remove("menu-opening");
    // this.mainDetailsToggle.querySelectorAll("details").forEach((details) => {
    //   details.removeAttribute("open");
    //   details.classList.remove("menu-opening");
    // });
    // this.mainDetailsToggle
    //   .querySelectorAll(".submenu-open")
    //   .forEach((submenu) => {
    //     submenu.classList.remove("submenu-open");
    //   });

    this.querySelector(".mobile-facets__open-wrapper").click();
    document.body.classList.remove(
      `overflow-hidden-${this.dataset.breakpoint}`
    );
    console.log(`overflow-hidden-${this.dataset.breakpoint}`);
    // removeTrapFocus(elementToFocus);
    // this.closeAnimation(this.mainDetailsToggle);

    // if (event instanceof KeyboardEvent)
    //   elementToFocus?.setAttribute("aria-expanded", false);
  }

  onFocusOut() {
    setTimeout(() => {
      if (
        this.mainDetailsToggle.hasAttribute("open") &&
        !this.mainDetailsToggle.contains(document.activeElement)
      )
        this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest("details");

    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    const parentMenuElement = detailsElement.closest(".submenu-open");
    parentMenuElement && parentMenuElement.classList.remove("submenu-open");
    detailsElement.classList.remove("menu-opening");
    detailsElement
      .querySelector("summary")
      .setAttribute("aria-expanded", false);
    removeTrapFocus(detailsElement.querySelector("summary"));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute("open");
        if (detailsElement.closest("details[open]")) {
          trapFocus(
            detailsElement.closest("details[open]"),
            detailsElement.querySelector("summary")
          );
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }
}
customElements.define("menu-drawer", MenuDrawer);

class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector("details");
    this.content =
      this.mainDetailsToggle.querySelector("summary").nextElementSibling;

    this.mainDetailsToggle.addEventListener(
      "focusout",
      this.onFocusOut.bind(this)
    );
    this.mainDetailsToggle.addEventListener("toggle", this.onToggle.bind(this));
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();

    if (this.mainDetailsToggle.hasAttribute("open")) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }

  close() {
    this.mainDetailsToggle.removeAttribute("open");
    this.mainDetailsToggle
      .querySelector("summary")
      .setAttribute("aria-expanded", false);
  }
}

customElements.define("details-disclosure", DetailsDisclosure);

class DetailsModal extends HTMLElement {
  constructor() {
    super();
    this.detailsContainer = this.querySelector("details");
    this.summaryToggle = this.querySelector("summary");

    this.detailsContainer.addEventListener(
      "keyup",
      (event) => event.code.toUpperCase() === "ESCAPE" && this.close()
    );
    this.summaryToggle.addEventListener(
      "click",
      this.onSummaryClick.bind(this)
    );
    this.querySelector('button[type="button"]').addEventListener(
      "click",
      this.close.bind(this)
    );

    this.summaryToggle.setAttribute("role", "button");
  }

  isOpen() {
    return this.detailsContainer.hasAttribute("open");
  }

  onSummaryClick(event) {
    event.preventDefault();
    event.target.closest("details").hasAttribute("open")
      ? this.close()
      : this.open(event);
  }

  onBodyClick(event) {
    if (
      !this.contains(event.target) ||
      event.target.classList.contains("modal-overlay")
    )
      this.close(false);
  }

  open(event) {
    this.onBodyClickEvent =
      this.onBodyClickEvent || this.onBodyClick.bind(this);
    event.target.closest("details").setAttribute("open", true);
    document.body.addEventListener("click", this.onBodyClickEvent);
    document.body.classList.add("overflow-hidden");

    trapFocus(
      this.detailsContainer.querySelector('[tabindex="-1"]'),
      this.detailsContainer.querySelector('input:not([type="hidden"])')
    );
  }

  close(focusToggle = true) {
    removeTrapFocus(focusToggle ? this.summaryToggle : null);
    this.detailsContainer.removeAttribute("open");
    document.body.removeEventListener("click", this.onBodyClickEvent);
    document.body.classList.remove("overflow-hidden");
  }
}

customElements.define("details-modal", DetailsModal);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      "click",
      this.hide.bind(this, false)
    );
    this.addEventListener("keyup", (event) => {
      if (event.code.toUpperCase() === "ESCAPE") this.hide();
    });
    if (this.classList.contains("media-modal")) {
      this.addEventListener("pointerup", (event) => {
        if (
          event.pointerType === "mouse" &&
          !event.target.closest("deferred-media, product-model")
        )
          this.hide();
      });
    } else {
      this.addEventListener("click", (event) => {
        if (event.target === this) this.hide();
      });
    }
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    this.dataset.section = this.closest(".shopify-section").id.replace(
      "shopify-section-",
      ""
    );
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector(".template-popup");
    document.body.classList.add("overflow-hidden");
    this.setAttribute("open", "");
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia();
  }

  hide() {
    document.body.classList.remove("overflow-hidden");
    document.body.dispatchEvent(new CustomEvent("modalClosed"));
    this.removeAttribute("open");
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define("modal-dialog", ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector("button");

    if (!button) return;
    button.addEventListener("click", () => {
      const modal = document.querySelector(this.getAttribute("data-modal"));
      if (modal) modal.show(button);
    });
  }
}
customElements.define("modal-opener", ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener("click", this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    window.pauseAllMedia();
    if (!this.getAttribute("loaded")) {
      const content = document.createElement("div");
      content.appendChild(
        this.querySelector("template").content.firstElementChild.cloneNode(true)
      );

      this.setAttribute("loaded", true);
      const deferredElement = this.appendChild(
        content.querySelector("video, model-viewer, iframe")
      );
      if (focus) deferredElement.focus();
      if (
        deferredElement.nodeName == "VIDEO" &&
        deferredElement.getAttribute("autoplay")
      ) {
        // force autoplay for safari
        deferredElement.play();
      }

      // Workaround for safari iframe bug
      const formerStyle = deferredElement.getAttribute("style");
      deferredElement.setAttribute("style", "display: block;");
      window.setTimeout(() => {
        deferredElement.setAttribute("style", formerStyle);
      }, 0);
    }
  }
}

customElements.define("deferred-media", DeferredMedia);

class AccountIcon extends HTMLElement {
  constructor() {
    super();

    this.icon = this.querySelector(".icon");
  }

  connectedCallback() {
    document.addEventListener(
      "storefront:signincompleted",
      this.handleStorefrontSignInCompleted.bind(this)
    );
  }

  handleStorefrontSignInCompleted(event) {
    if (event?.detail?.avatar) {
      this.icon?.replaceWith(event.detail.avatar.cloneNode());
    }
  }
}
customElements.define("account-icon", AccountIcon);

class LocalizationForm extends HTMLElement {
  constructor() {
    super();
    this.mql = window.matchMedia("(min-width: 750px)");
    this.header = document.querySelector(".header-wrapper");
    this.elements = {
      input: this.querySelector(
        'input[name="locale_code"], input[name="country_code"]'
      ),
      button: this.querySelector("button.localization-form__select"),
      panel: this.querySelector(".disclosure__list-wrapper"),
      search: this.querySelector('input[name="country_filter"]'),
      closeButton: this.querySelector(".country-selector__close-button"),
      resetButton: this.querySelector(".country-filter__reset-button"),
      searchIcon: this.querySelector(".country-filter__search-icon"),
      liveRegion: this.querySelector("#sr-country-search-results"),
    };
    this.addEventListener("keyup", this.onContainerKeyUp.bind(this));
    this.addEventListener("keydown", this.onContainerKeyDown.bind(this));
    this.addEventListener("focusout", this.closeSelector.bind(this));
    this.elements.button.addEventListener(
      "click",
      this.openSelector.bind(this)
    );

    if (this.elements.search) {
      this.elements.search.addEventListener(
        "keyup",
        this.filterCountries.bind(this)
      );
      this.elements.search.addEventListener(
        "focus",
        this.onSearchFocus.bind(this)
      );
      this.elements.search.addEventListener(
        "blur",
        this.onSearchBlur.bind(this)
      );
      this.elements.search.addEventListener(
        "keydown",
        this.onSearchKeyDown.bind(this)
      );
    }
    if (this.elements.closeButton) {
      this.elements.closeButton.addEventListener(
        "click",
        this.hidePanel.bind(this)
      );
    }
    if (this.elements.resetButton) {
      this.elements.resetButton.addEventListener(
        "click",
        this.resetFilter.bind(this)
      );
      this.elements.resetButton.addEventListener("mousedown", (event) =>
        event.preventDefault()
      );
    }

    this.querySelectorAll("a").forEach((item) =>
      item.addEventListener("click", this.onItemClick.bind(this))
    );
  }

  hidePanel() {
    this.elements.button.setAttribute("aria-expanded", "false");
    this.elements.panel.setAttribute("hidden", true);
    if (this.elements.search) {
      this.elements.search.value = "";
      this.filterCountries();
      this.elements.search.setAttribute("aria-activedescendant", "");
    }
    document.body.classList.remove("overflow-hidden-mobile");
    document
      .querySelector(".menu-drawer")
      .classList.remove("country-selector-open");
    this.header.preventHide = false;
  }

  onContainerKeyDown(event) {
    const focusableItems = Array.from(this.querySelectorAll("a")).filter(
      (item) => !item.parentElement.classList.contains("hidden")
    );
    let focusedItemIndex = focusableItems.findIndex(
      (item) => item === document.activeElement
    );
    let itemToFocus;

    switch (event.code.toUpperCase()) {
      case "ARROWUP":
        event.preventDefault();
        itemToFocus =
          focusedItemIndex > 0
            ? focusableItems[focusedItemIndex - 1]
            : focusableItems[focusableItems.length - 1];
        itemToFocus.focus();
        break;
      case "ARROWDOWN":
        event.preventDefault();
        itemToFocus =
          focusedItemIndex < focusableItems.length - 1
            ? focusableItems[focusedItemIndex + 1]
            : focusableItems[0];
        itemToFocus.focus();
        break;
    }

    if (!this.elements.search) return;

    setTimeout(() => {
      focusedItemIndex = focusableItems.findIndex(
        (item) => item === document.activeElement
      );
      if (focusedItemIndex > -1) {
        this.elements.search.setAttribute(
          "aria-activedescendant",
          focusableItems[focusedItemIndex].id
        );
      } else {
        this.elements.search.setAttribute("aria-activedescendant", "");
      }
    });
  }

  onContainerKeyUp(event) {
    event.preventDefault();

    switch (event.code.toUpperCase()) {
      case "ESCAPE":
        if (this.elements.button.getAttribute("aria-expanded") == "false")
          return;
        this.hidePanel();
        event.stopPropagation();
        this.elements.button.focus();
        break;
      case "SPACE":
        if (this.elements.button.getAttribute("aria-expanded") == "true")
          return;
        this.openSelector();
        break;
    }
  }

  onItemClick(event) {
    event.preventDefault();
    const form = this.querySelector("form");
    this.elements.input.value = event.currentTarget.dataset.value;
    if (form) form.submit();
  }

  openSelector() {
    this.elements.button.focus();
    this.elements.panel.toggleAttribute("hidden");
    this.elements.button.setAttribute(
      "aria-expanded",
      (
        this.elements.button.getAttribute("aria-expanded") === "false"
      ).toString()
    );
    if (!document.body.classList.contains("overflow-hidden-tablet")) {
      document.body.classList.add("overflow-hidden-mobile");
    }
    if (this.elements.search && this.mql.matches) {
      this.elements.search.focus();
    }
    if (this.hasAttribute("data-prevent-hide")) {
      this.header.preventHide = true;
    }
    document
      .querySelector(".menu-drawer")
      .classList.add("country-selector-open");
  }

  closeSelector(event) {
    if (
      event.target.classList.contains("country-selector__overlay") ||
      !this.contains(event.target) ||
      !this.contains(event.relatedTarget)
    ) {
      this.hidePanel();
    }
  }

  normalizeString(str) {
    return str
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  }

  filterCountries() {
    const searchValue = this.normalizeString(this.elements.search.value);
    const popularCountries = this.querySelector(".popular-countries");
    const allCountries = this.querySelectorAll("a");
    let visibleCountries = allCountries.length;

    this.elements.resetButton.classList.toggle("hidden", !searchValue);

    if (popularCountries) {
      popularCountries.classList.toggle("hidden", searchValue);
    }

    allCountries.forEach((item) => {
      const countryName = this.normalizeString(
        item.querySelector(".country").textContent
      );
      if (countryName.indexOf(searchValue) > -1) {
        item.parentElement.classList.remove("hidden");
        visibleCountries++;
      } else {
        item.parentElement.classList.add("hidden");
        visibleCountries--;
      }
    });

    if (this.elements.liveRegion) {
      this.elements.liveRegion.innerHTML =
        window.accessibilityStrings.countrySelectorSearchCount.replace(
          "[count]",
          visibleCountries
        );
    }

    this.querySelector(".country-selector").scrollTop = 0;
    this.querySelector(".country-selector__list").scrollTop = 0;
  }

  resetFilter(event) {
    event.stopPropagation();
    this.elements.search.value = "";
    this.filterCountries();
    this.elements.search.focus();
  }

  onSearchFocus() {
    this.elements.searchIcon.classList.add(
      "country-filter__search-icon--hidden"
    );
  }

  onSearchBlur() {
    if (!this.elements.search.value) {
      this.elements.searchIcon.classList.remove(
        "country-filter__search-icon--hidden"
      );
    }
  }

  onSearchKeyDown(event) {
    if (event.code.toUpperCase() === "ENTER") {
      event.preventDefault();
    }
  }
}
customElements.define("localization-form", LocalizationForm);

class ShowMoreButton extends HTMLElement {
  constructor() {
    super();
    const button = this.querySelector("button");
    button.addEventListener("click", (event) => {
      this.expandShowMore(event);
      const nextElementToFocus = event.target
        .closest(".parent-display")
        .querySelector(".show-more-item");
      if (
        nextElementToFocus &&
        !nextElementToFocus.classList.contains("hidden") &&
        nextElementToFocus.querySelector("input")
      ) {
        nextElementToFocus.querySelector("input").focus();
      }
    });
  }
  expandShowMore(event) {
    const parentDisplay = event.target
      .closest('[id^="Show-More-"]')
      .closest(".parent-display");
    const parentWrap = parentDisplay.querySelector(".parent-wrap");
    this.querySelectorAll(".label-text").forEach((element) =>
      element.classList.toggle("hidden")
    );
    parentDisplay
      .querySelectorAll(".show-more-item")
      .forEach((item) => item.classList.toggle("hidden"));
    if (!this.querySelector(".label-show-less")) {
      this.classList.add("hidden");
    }
  }
}
customElements.define("show-more-button", ShowMoreButton);

class SearchForm extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input[type="search"]');
    this.resetButton = this.querySelector('button[type="reset"]');

    if (this.input) {
      this.input.form.addEventListener("reset", this.onFormReset.bind(this));
      this.input.addEventListener(
        "input",
        debounce((event) => {
          this.onChange(event);
        }, 300).bind(this)
      );
    }
  }

  toggleResetButton() {
    const resetIsHidden = this.resetButton.classList.contains("hidden");
    if (this.input.value.length > 0 && resetIsHidden) {
      this.resetButton.classList.remove("hidden");
    } else if (this.input.value.length === 0 && !resetIsHidden) {
      this.resetButton.classList.add("hidden");
    }
  }

  onChange() {
    this.toggleResetButton();
  }

  shouldResetForm() {
    return !document.querySelector('[aria-selected="true"] a');
  }

  onFormReset(event) {
    // Prevent default so the form reset doesn't set the value gotten from the url on page load
    event.preventDefault();
    // Don't reset if the user has selected an element on the predictive search dropdown
    if (this.shouldResetForm()) {
      this.input.value = "";
      this.input.focus();
      this.toggleResetButton();
    }
  }
}

customElements.define("search-form", SearchForm);

class MainSearch extends SearchForm {
  constructor() {
    super();
    this.allSearchInputs = document.querySelectorAll('input[type="search"]');
    this.setupEventListeners();
  }

  setupEventListeners() {
    let allSearchForms = [];
    this.allSearchInputs.forEach((input) => allSearchForms.push(input.form));
    this.input.addEventListener("focus", this.onInputFocus.bind(this));
    if (allSearchForms.length < 2) return;
    allSearchForms.forEach((form) =>
      form.addEventListener("reset", this.onFormReset.bind(this))
    );
    this.allSearchInputs.forEach((input) =>
      input.addEventListener("input", this.onInput.bind(this))
    );
  }

  onFormReset(event) {
    super.onFormReset(event);
    if (super.shouldResetForm()) {
      this.keepInSync("", this.input);
    }
  }

  onInput(event) {
    const target = event.target;
    this.keepInSync(target.value, target);
  }

  onInputFocus() {
    const isSmallScreen = window.innerWidth < 750;
    if (isSmallScreen) {
      this.scrollIntoView({ behavior: "smooth" });
    }
  }

  keepInSync(value, target) {
    this.allSearchInputs.forEach((input) => {
      if (input !== target) {
        input.value = value;
      }
    });
  }
}

customElements.define("main-search", MainSearch);

class PredictiveSearch extends SearchForm {
  constructor() {
    super();
    this.cachedResults = {};
    this.predictiveSearchResults = this.querySelector(
      "[data-predictive-search]"
    );
    this.allPredictiveSearchInstances =
      document.querySelectorAll("predictive-search");
    this.isOpen = false;
    this.abortController = new AbortController();
    this.searchTerm = "";

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.input.form.addEventListener("submit", this.onFormSubmit.bind(this));

    this.input.addEventListener("focus", this.onFocus.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.addEventListener("keyup", this.onKeyup.bind(this));
    this.addEventListener("keydown", this.onKeydown.bind(this));
  }

  getQuery() {
    return this.input.value.trim();
  }

  onChange() {
    super.onChange();
    const newSearchTerm = this.getQuery();
    if (!this.searchTerm || !newSearchTerm.startsWith(this.searchTerm)) {
      // Remove the results when they are no longer relevant for the new search term
      // so they don't show up when the dropdown opens again
      this.querySelector("#predictive-search-results-groups-wrapper")?.remove();
    }

    // Update the term asap, don't wait for the predictive search query to finish loading
    this.updateSearchForTerm(this.searchTerm, newSearchTerm);

    this.searchTerm = newSearchTerm;

    if (!this.searchTerm.length) {
      this.close(true);
      return;
    }

    this.getSearchResults(this.searchTerm);
  }

  onFormSubmit(event) {
    if (
      !this.getQuery().length ||
      this.querySelector('[aria-selected="true"] a')
    )
      event.preventDefault();
  }

  onFormReset(event) {
    super.onFormReset(event);
    if (super.shouldResetForm()) {
      this.searchTerm = "";
      this.onChange();
      this.abortController.abort();
      this.abortController = new AbortController();
      this.closeResults(true);
    }
  }

  onFocus() {
    const currentSearchTerm = this.getQuery();

    if (!currentSearchTerm.length) return;

    if (this.searchTerm !== currentSearchTerm) {
      // Search term was changed from other search input, treat it as a user change
      this.onChange();
    } else if (this.getAttribute("results") === "true") {
      this.open();
    } else {
      this.getSearchResults(this.searchTerm);
    }
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onKeyup(event) {
    if (!this.getQuery().length) this.close(true);
    event.preventDefault();

    switch (event.code) {
      case "ArrowUp":
        this.switchOption("up");
        break;
      case "ArrowDown":
        this.switchOption("down");
        break;
      case "Enter":
        this.selectOption();
        break;
    }
  }

  onKeydown(event) {
    // Prevent the cursor from moving in the input when using the up and down arrow keys
    if (event.code === "ArrowUp" || event.code === "ArrowDown") {
      event.preventDefault();
    }
  }

  updateSearchForTerm(previousTerm, newTerm) {
    const searchForTextElement = this.querySelector(
      "[data-predictive-search-search-for-text]"
    );
    const currentButtonText = searchForTextElement?.innerText;
    if (currentButtonText) {
      if (currentButtonText.match(new RegExp(previousTerm, "g")).length > 1) {
        // The new term matches part of the button text and not just the search term, do not replace to avoid mistakes
        return;
      }
      const newButtonText = currentButtonText.replace(previousTerm, newTerm);
      searchForTextElement.innerText = newButtonText;
    }
  }

  switchOption(direction) {
    if (!this.getAttribute("open")) return;

    const moveUp = direction === "up";
    const selectedElement = this.querySelector('[aria-selected="true"]');

    // Filter out hidden elements (duplicated page and article resources) thanks
    // to this https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
    const allVisibleElements = Array.from(
      this.querySelectorAll("li, button.predictive-search__item")
    ).filter((element) => element.offsetParent !== null);
    let activeElementIndex = 0;

    if (moveUp && !selectedElement) return;

    let selectedElementIndex = -1;
    let i = 0;

    while (selectedElementIndex === -1 && i <= allVisibleElements.length) {
      if (allVisibleElements[i] === selectedElement) {
        selectedElementIndex = i;
      }
      i++;
    }

    this.statusElement.textContent = "";

    if (!moveUp && selectedElement) {
      activeElementIndex =
        selectedElementIndex === allVisibleElements.length - 1
          ? 0
          : selectedElementIndex + 1;
    } else if (moveUp) {
      activeElementIndex =
        selectedElementIndex === 0
          ? allVisibleElements.length - 1
          : selectedElementIndex - 1;
    }

    if (activeElementIndex === selectedElementIndex) return;

    const activeElement = allVisibleElements[activeElementIndex];

    activeElement.setAttribute("aria-selected", true);
    if (selectedElement) selectedElement.setAttribute("aria-selected", false);

    this.input.setAttribute("aria-activedescendant", activeElement.id);
  }

  selectOption() {
    const selectedOption = this.querySelector(
      '[aria-selected="true"] a, button[aria-selected="true"]'
    );

    if (selectedOption) selectedOption.click();
  }

  getSearchResults(searchTerm) {
    const queryKey = searchTerm.replace(" ", "-").toLowerCase();
    this.setLiveRegionLoadingState();

    if (this.cachedResults[queryKey]) {
      this.renderSearchResults(this.cachedResults[queryKey]);
      return;
    }

    fetch(
      `${routes.predictive_search_url}?q=${encodeURIComponent(
        searchTerm
      )}&section_id=predictive-search`,
      {
        signal: this.abortController.signal,
      }
    )
      .then((response) => {
        if (!response.ok) {
          var error = new Error(response.status);
          this.close();
          throw error;
        }

        return response.text();
      })
      .then((text) => {
        const resultsMarkup = new DOMParser()
          .parseFromString(text, "text/html")
          .querySelector("#shopify-section-predictive-search").innerHTML;
        // Save bandwidth keeping the cache in all instances synced
        this.allPredictiveSearchInstances.forEach(
          (predictiveSearchInstance) => {
            predictiveSearchInstance.cachedResults[queryKey] = resultsMarkup;
          }
        );
        this.renderSearchResults(resultsMarkup);
      })
      .catch((error) => {
        if (error?.code === 20) {
          // Code 20 means the call was aborted
          return;
        }
        this.close();
        throw error;
      });
  }

  setLiveRegionLoadingState() {
    this.statusElement =
      this.statusElement || this.querySelector(".predictive-search-status");
    this.loadingText =
      this.loadingText || this.getAttribute("data-loading-text");

    this.setLiveRegionText(this.loadingText);
    this.setAttribute("loading", true);
  }

  setLiveRegionText(statusText) {
    this.statusElement.setAttribute("aria-hidden", "false");
    this.statusElement.textContent = statusText;

    setTimeout(() => {
      this.statusElement.setAttribute("aria-hidden", "true");
    }, 1000);
  }

  renderSearchResults(resultsMarkup) {
    this.predictiveSearchResults.innerHTML = resultsMarkup;
    this.setAttribute("results", true);

    this.setLiveRegionResults();
    this.open();
  }

  setLiveRegionResults() {
    this.removeAttribute("loading");
    this.setLiveRegionText(
      this.querySelector("[data-predictive-search-live-region-count-value]")
        .textContent
    );
  }

  getResultsMaxHeight() {
    this.resultsMaxHeight =
      window.innerHeight -
      document.querySelector(".section-header")?.getBoundingClientRect().bottom;
    return this.resultsMaxHeight;
  }

  open() {
    this.predictiveSearchResults.style.maxHeight =
      this.resultsMaxHeight || `${this.getResultsMaxHeight()}px`;
    this.setAttribute("open", true);
    this.input.setAttribute("aria-expanded", true);
    this.isOpen = true;
  }

  close(clearSearchTerm = false) {
    this.closeResults(clearSearchTerm);
    this.isOpen = false;
  }

  closeResults(clearSearchTerm = false) {
    if (clearSearchTerm) {
      this.input.value = "";
      this.removeAttribute("results");
    }
    const selected = this.querySelector('[aria-selected="true"]');

    if (selected) selected.setAttribute("aria-selected", false);

    this.input.setAttribute("aria-activedescendant", "");
    this.removeAttribute("loading");
    this.removeAttribute("open");
    this.input.setAttribute("aria-expanded", false);
    this.resultsMaxHeight = false;
    this.predictiveSearchResults.removeAttribute("style");
  }
}

customElements.define("predictive-search", PredictiveSearch);

class TabList extends HTMLElement {
  constructor() {
    super();

    this.tabButtons = this.querySelectorAll(".tab-button");
    this.tabPanels = this.querySelectorAll(".tab-panel");

    this.bindEvents();
  }

  bindEvents() {
    this.addEventListener("click", (e) => {
      const clickedTab = e.target.closest(".tab-button");
      if (!clickedTab) return;
      e.preventDefault();

      this.switchTab(clickedTab);
    });

    this.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowLeft":
          this.moveLeft();
          break;
        case "ArrowRight":
          this.moveRight();
          break;
        case "Home":
          e.preventDefault();
          this.switchTab(tabButtons[0]);
          break;
        case "End":
          e.preventDefault();
          this.switchTab(tabButtons[tabButtons.length - 1]);
          break;
      }
    });
  }

  moveLeft() {
    const currentTab = document.activeElement;
    if (!currentTab.parentElement.previousElementSibling) {
      this.switchTab(tabButtons[tabButtons.length - 1]);
    } else {
      this.switchTab(
        currentTab.parentElement.previousElementSibling.querySelector("a")
      );
    }
  }

  moveRight() {
    const currentTab = document.activeElement;
    if (!currentTab.parentElement.nextElementSibling) {
      this.switchTab(tabButtons[0]);
    } else {
      this.switchTab(
        currentTab.parentElement.nextElementSibling.querySelector("a")
      );
    }
  }

  switchTab(newTab) {
    const activePanelId = newTab.getAttribute("href");
    const activePanel = this.querySelector(activePanelId);

    this.tabButtons.forEach((button) => {
      button.setAttribute("aria-selected", false);
      button.setAttribute("tabindex", "-1");
    });

    this.tabPanels.forEach((panel) => {
      panel.classList.add("hidden");
    });

    activePanel.classList.remove("hidden");

    newTab.setAttribute("aria-selected", true);
    newTab.setAttribute("tabindex", "0");
    newTab.focus();
  }
}
customElements.define("tab-list", TabList);
class PromoBarSlider extends HTMLElement {
  constructor() {
    super();
    this.swiper = this.querySelector(".swiper");
  }
  connectedCallback() {
    new Swiper(this.swiper, {
      loop: true,
      speed: 400,
      effect: "fade",
      mousewheel: {
        forceToAxis: true,
      },
      fadeEffect: {
        crossFade: true,
      },
      autoplay: {
        enabled: true,
        pauseOnMouseEnter: false,
        disableOnInteraction: false,
      },
      navigation: {
        prevEl: this.swiper.querySelector(".swiper-button-prev"),
        nextEl: this.swiper.querySelector(".swiper-button-next"),
      },
    });
  }
}
customElements.define("announcement-bar-slider", PromoBarSlider);

class HpColorCarousel extends HTMLElement {
  constructor() {
    super();
    this.swiper = this.querySelector(".swiper");
  }
  connectedCallback() {
    this.swiperData = new Swiper(this.swiper, {
      slidesPerView: 2,
      spaceBetween: 12,
      loop: true,
      speed: 8000,
      grabCursor: true,
      mousewheel: {
        forceToAxis: true,
      },
      scrollbar: {
        el: ".swiper-scrollbar",
      },
      autoplay: {
        enabled: true,
        delay: 0,
        disableOnInteraction: false,
        pauseOnMouseEnter: false,
      },
      breakpoints: {
        768: {
          slidesPerView: 3,
        },
        992: {
          slidesPerView: 4,
        },
        1200: {
          slidesPerView: 6,
        },
      },
    });

    this.swiperData.el.addEventListener("focusin", (event) => {
      this.swiperData.autoplay.pause();
      this.swiperData.params.loop = false;
    });

    this.swiperData.el.addEventListener("focusout", (event) => {
      if (!this.swiperData.el.contains(event.relatedTarget)) {
        this.swiperData.params.loop = true;
        this.swiperData.autoplay.resume();
      }
    });
  }
}
customElements.define("hp-color-carousel", HpColorCarousel);

class HpBlogCarousel extends HTMLElement {
  constructor() {
    super();
    this.swiper = this.querySelector(".swiper");
  }
  connectedCallback() {
    new Swiper(this.swiper, {
      slidesPerView: 1.3,
      spaceBetween: 12,
      slidesOffsetBefore: 16,
      slidesOffsetAfter: 16,
      loop: false,
      speed: 400,
      threshold: 6,
      grabCursor: true,
      mousewheel: {
        forceToAxis: true,
      },
      scrollbar: {
        el: ".swiper-scrollbar",
      },
      breakpoints: {
        768: {
          slidesPerView: 2.3,
          spaceBetween: 16,
          slidesOffsetBefore: 24,
          slidesOffsetAfter: 24,
        },
        992: {
          slidesPerView: 3.3,
          spaceBetween: 16,
          slidesOffsetBefore: 24,
          slidesOffsetAfter: 24,
        },
        1200: {
          slidesPerView: 4,
          spaceBetween: 16,
          slidesOffsetBefore: 0,
          slidesOffsetAfter: 0,
        },
      },
    });
  }
}
customElements.define("hp-blog-carousel", HpBlogCarousel);

class HpProductCarousel extends HTMLElement {
  constructor() {
    super();
    this.swiper = this.querySelector(".swiper");
  }
  connectedCallback() {
    new Swiper(this.swiper, {
      observer: true,
      observeParents: true,
      slidesPerView: 1.2,
      spaceBetween: 12,
      slidesOffsetBefore: 16,
      slidesOffsetAfter: 16,
      loop: false,
      speed: 400,
      threshold: 6,
      grabCursor: true,
      mousewheel: {
        forceToAxis: true,
      },
      scrollbar: {
        el: ".swiper-scrollbar",
      },
      breakpoints: {
        768: {
          slidesPerView: 2.2,
          spaceBetween: 16,
          slidesOffsetBefore: 24,
          slidesOffsetAfter: 24,
        },
        992: {
          slidesPerView: 3.2,
          spaceBetween: 16,
          slidesOffsetBefore: 24,
          slidesOffsetAfter: 24,
        },
        1200: {
          slidesPerView: 4.2,
          spaceBetween: 16,
          slidesOffsetBefore: 24,
          slidesOffsetAfter: 24,
        },
      },
    });
  }
}
customElements.define("hp-product-carousel", HpProductCarousel);

class HeaderMega extends HTMLElement {
  constructor() {
    super();

    this.dropdowns = this.querySelectorAll(".header-dropdown");
    this.dropdownToggles = this.querySelectorAll(".header-dropdown-toggle");
    this.dropdownMenus = this.querySelectorAll(".header-dropdown-menu");

    this.bindEvents();
  }

  bindEvents() {
    this.addEventListener("keyup", this.onKeyUp.bind(this));

    this.dropdownToggles.forEach((item) => {
      item.addEventListener("click", this.onDropdownToggleClick.bind(this));
    });

    this.addEventListener("focusout", this.onDropdownFocusOut.bind(this));

    // this.dropdowns.forEach((item) => {
    //   item.addEventListener("mouseleave", this.onDropdownMouseLeave.bind(this));
    // });

    // this.dropdownMenus.forEach((item) => {
    //   //item.addEventListener("mouseleave", this.onDropdownMouseLeave.bind(this));
    // });
  }

  onDropdownToggleClick(event) {
    event.preventDefault();

    const dropdownToggle = event.currentTarget;
    const dropdown = dropdownToggle.parentNode;

    if (this.isDropdownOpen(dropdown)) {
      this.closeDropdown(dropdown);
      this.closeMega();
    } else {
      this.openDropdown(dropdown);
      this.openMega();
    }
  }

  onDropdownMouseEnter(event) {
    const dropdown = event.currentTarget;

    if (this.hasDropdownOpen()) {
      if (this.isDropdownClose(dropdown)) {
        this.openTimer = setTimeout(() => {
          if (this.closeTimer) {
            clearTimeout(this.closeTimer);
          }
          this.closeAllDropdowns();
          this.openDropdown(dropdown);
        }, 100);
      } else {
        if (this.closeTimer) {
          clearTimeout(this.closeTimer);
        }
        if (this.openTimer) {
          clearTimeout(this.openTimer);
        }
      }
    } else {
      this.openDropdown(dropdown);
      this.openMega();
    }
  }

  onDropdownMouseLeave(event) {
    const dropdown = event.currentTarget;

    if (this.isDropdownOpen(dropdown)) {
      this.closeTimer = setTimeout(() => {
        this.closeDropdown(dropdown);
        this.closeMega();
      }, 200);
    }
  }

  onDropdownFocusOut(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      if (this.hasDropdownOpen()) {
        this.closeAllDropdowns();
        this.closeMega();
      }
    }
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    const openDetailsElement = event.target.closest("details[open]");
    if (!openDetailsElement) return;

    this.closeDropdown(openDetailsElement);
    this.closeMega();
  }

  isDropdownOpen(detailsElement) {
    return (
      detailsElement.hasAttribute("open") &&
      detailsElement.classList.contains("open")
    );
  }

  isDropdownClose(detailsElement) {
    return !detailsElement.hasAttribute("open");
  }

  hasDropdownOpen() {
    return this.classList.contains("dropdown-open");
  }

  openDropdown(detailsElement) {
    const summaryElement = detailsElement.querySelector("summary");

    // close all sub drawers
    this.closeAllDropdowns();

    detailsElement.setAttribute("open", "");
    detailsElement.classList.add("open");
    summaryElement.setAttribute("aria-expanded", true);

    // update status
    this.classList.add("dropdown-open");

    // trap focus
    trapFocus(detailsElement, summaryElement);
  }

  closeDropdown(detailsElement) {
    const summaryElement = detailsElement.querySelector("summary");

    detailsElement.removeAttribute("open");
    detailsElement.classList.remove("open");

    summaryElement.setAttribute("aria-expanded", false);

    // remove trap focus
    removeTrapFocus(summaryElement);

    // close sub drawer animation

    // update status
    this.classList.remove("dropdown-open");
  }

  closeAllDropdowns() {
    this.dropdowns.forEach((item) => {
      if (this.isDropdownOpen(item)) {
        this.closeDropdown(item);
      }
    });
  }

  openMega() {
    document.body.classList.add("header-mega-open", "overflow-hidden");
  }

  closeMega() {
    document.body.classList.remove("header-mega-open", "overflow-hidden");
  }
}
customElements.define("header-mega", HeaderMega);

class HeaderDrawer extends HTMLElement {
  constructor() {
    super();

    this.drawerContainer = this.querySelector(".header-drawer-container");
    this.drawerToggle = this.drawerContainer.querySelector(
      ".header-drawer-toggle"
    );
    // this.drawerCloseButton = this.drawerContainer.querySelector(
    //   ".header-drawer-close"
    // );
    this.drawer = this.drawerContainer.querySelector(".header-drawer");
    this.drawerLink = this.drawerContainer.querySelectorAll(
      ".header-drawer-menu-link"
    );

    this.subDrawerContainers = this.drawerContainer.querySelectorAll(
      ".header-child-drawer-container, .header-grand-drawer-container"
    );
    this.subDrawerToggles = this.drawerContainer.querySelectorAll(
      ".header-child-drawer-toggle, .header-grand-drawer-toggle"
    );
    this.subDrawers = this.drawerContainer.querySelectorAll(
      ".header-child-drawer, .header-grand-drawer"
    );
    this.subDrawerCloseButtons = this.drawerContainer.querySelectorAll(
      ".header-child-drawer-close, .header-grand-drawer-close"
    );

    this.bindEvents();
  }

  bindEvents() {
    this.addEventListener("keyup", this.onKeyUp.bind(this));
    // this.addEventListener("focusout", this.onDrawerFocusOut.bind(this));

    this.drawerToggle.addEventListener(
      "click",
      this.onDrawerToggleClick.bind(this)
    );
    // this.drawerCloseButton.addEventListener(
    //   "click",
    //   this.onDrawerCloseButtonClick.bind(this)
    // );

    this.subDrawerToggles.forEach((item) => {
      item.addEventListener("click", this.onSubDrawerToggleClick.bind(this));
    });

    this.subDrawerCloseButtons.forEach((item) => {
      item.addEventListener(
        "click",
        this.onSubDrawerCloseButtonClick.bind(this)
      );
    });

    // this.subDrawerContainers.forEach((item) => {
    //   item.addEventListener("focusout", this.onSubDrawerFocusOut.bind(this));
    // });
  }

  onDrawerToggleClick(event) {
    event.preventDefault();

    if (this.isDrawerOpen()) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  onDrawerCloseButtonClick(event) {
    event.preventDefault();
    this.closeDrawer();
  }

  onSubDrawerToggleClick(event) {
    event.preventDefault();

    const subDrawerToggle = event.currentTarget;
    const subDrawerContainer = subDrawerToggle.parentNode;

    if (this.isSubDrawerOpen(subDrawerContainer)) {
      this.closeSubDrawer(subDrawerContainer);
    } else {
      this.openSubDrawer(subDrawerContainer);
    }
  }

  onSubDrawerCloseButtonClick(event) {
    event.preventDefault();

    const detailsElement = event.currentTarget.closest("details");
    this.closeSubDrawer(detailsElement);
  }

  onDrawerFocusOut(event) {
    const relatedTarget = event.relatedTarget;
    setTimeout(() => {
      if (this.isDrawerOpen() && !this.drawerContainer.contains(relatedTarget))
        this.closeDrawer();
    });
  }

  onSubDrawerFocusOut(event) {
    const subDrawerContainer = event.currentTarget;
    const relatedTarget = event.relatedTarget;
    setTimeout(() => {
      if (this.hasSubDrawerOpen() && relatedTarget === this.drawer)
        this.closeSubDrawer(subDrawerContainer);
    });
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    const openDetailsElement = event.target.closest("details[open]");
    if (!openDetailsElement) return;

    if (openDetailsElement === this.drawerContainer) {
      this.closeDrawer(this.drawerToggle);
    } else {
      this.closeSubDrawer(openDetailsElement);
    }
  }

  isDrawerOpen() {
    return (
      this.drawerContainer.hasAttribute("open") &&
      this.drawerContainer.classList.contains("open")
    );
  }

  isSubDrawerOpen(detailsElement) {
    return (
      detailsElement.hasAttribute("open") &&
      detailsElement.classList.contains("open")
    );
  }

  isSubDrawerClose(detailsElement) {
    return !detailsElement.hasAttribute("open");
  }

  hasSubDrawerOpen() {
    return this.drawerContainer.classList.contains("subdrawer-open");
  }

  openDrawer() {
    // open drawer
    setTimeout(() => {
      this.drawerContainer.setAttribute("open", "");
      this.drawerContainer.classList.add("open");
      this.drawerToggle.setAttribute("aria-expanded", true);
    });

    // trap focus
    trapFocus(this.drawerContainer, this.drawerToggle);

    // update status
    document.body.classList.add("header-drawer-open", "overflow-hidden");
  }

  openSubDrawer(detailsElement) {
    const summaryElement = detailsElement.querySelector("summary");

    // // close all sub drawers
    // this.closeAllSubDrawers();

    // open sub drawer
    setTimeout(() => {
      detailsElement.setAttribute("open", "");
      detailsElement.classList.add("open");
      summaryElement.setAttribute("aria-expanded", true);
    });

    // trap focus
    trapFocus(detailsElement, summaryElement);

    // update status
    detailsElement.closest("ul").parentNode.classList.add("subdrawer-open");
    // this.drawerContainer.classList.add("subdrawer-open");
  }

  closeDrawer(elementToFocus = false) {
    // remove trap focus
    removeTrapFocus(elementToFocus);

    // close drawer
    this.drawerContainer.classList.remove("open");
    this.drawerContainer.removeAttribute("open");
    this.drawerToggle.setAttribute("aria-expanded", false);

    // close all sub drawers
    this.closeAllSubDrawers();

    // update status
    document.body.classList.remove("header-drawer-open", "overflow-hidden");
  }

  closeSubDrawer(detailsElement) {
    const summaryElement = detailsElement.querySelector("summary");

    // remove trap focus
    removeTrapFocus(summaryElement);

    // close sub drawer
    detailsElement.classList.remove("open");
    detailsElement.removeAttribute("open");
    summaryElement.setAttribute("aria-expanded", false);

    // update status
    detailsElement.closest("ul").parentNode.classList.remove("subdrawer-open");
    // this.drawerContainer.classList.remove("subdrawer-open");
  }

  closeAllSubDrawers() {
    this.subDrawerContainers.forEach((item) => {
      if (this.isSubDrawerOpen(item)) {
        this.closeSubDrawer(item);
      }
    });
  }
}
customElements.define("header-drawer", HeaderDrawer);

class ProductGallery extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector(".swiper");
    this.script = this.querySelector('[type="application/json"]');
    this.variantDefaultData = this.getDefaultVariantData();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.loadContent(this.variantDefaultData, this.slider);
    this.initSlider();
  }

  refresh(variantData) {
    if (this.sliderSwiper) {
      this.destroySlider(this.sliderSwiper);
    }
    this.loadContent(variantData, this.slider);
    this.initSlider();
  }

  getDefaultVariantData() {
    return JSON.parse(this.script.textContent);
  }

  loadContent(variantData, slider) {
    this.template = slider.querySelector("template");
    const variantID = variantData.id;
    const templateContent = this.template.content.cloneNode(true);
    const target = slider.querySelector(".swiper-wrapper");
    target.innerHTML = "";
    target.append(templateContent);
    Array.from(target.children).forEach(function (item) {
      if (item.dataset.variantId != variantID) {
        item.remove();
      }
    });
  }

  initSlider() {
    this.sliderSwiper = new Swiper(this.slider, {
      observer: true,
      observeParents: true,
      slidesPerView: "auto",
      spaceBetween: 12,
      loop: true,
      speed: 400,
      grabCursor: true,
      mousewheel: {
        forceToAxis: true,
      },
      focusableElements: ".focusDisableSwiper",
      navigation: {
        prevEl: this.slider.querySelector(".swiper-button-prev"),
        nextEl: this.slider.querySelector(".swiper-button-next"),
        disabledClass: "hidden",
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true,
        pageUpDown: true,
      },
      pagination: {
        el: this.slider.querySelector(".swiper-pagination"),
        type: "bullets",
      },
    });
  }

  destroySlider(swiper) {
    swiper.destroy(true, true);
  }
}
customElements.define("product-gallery", ProductGallery);

class ProductZoomGallery extends ModalDialog {
  constructor() {
    super();
    this.slider = this.querySelector(".pdp-product-zoom-slider");
    this.thumbSlider = this.querySelector(".pdp-product-zoom-thumbSlider");
    this.sliderTemplate = this.querySelector(".template--slider");
    this.thumbSliderTemplate = this.querySelector(".template--thumbSlider");
    this.script = this.querySelector('[type="application/json"]');
    this.variantDefaultData = this.getDefaultVariantData();
  }

  connectedCallback() {
    this.init();
  }

  hide() {
    super.hide();
  }

  show(opener) {
    super.show(opener);
    this.showActiveMedia();
  }

  showActiveMedia() {
    const activeMediaIndex = this.openedBy.dataset.mediaIndex;
    this.sliderSwiper.slideTo(activeMediaIndex, 0);
  }

  init() {
    this.loadContent(
      this.variantDefaultData,
      this.thumbSlider,
      this.thumbSliderTemplate
    );
    this.loadContent(this.variantDefaultData, this.slider, this.sliderTemplate);
    this.initThumbSlider();
    this.initSlider();
  }

  refresh(variantData) {
    if (this.thumbSwiper) {
      this.destroySlider(this.thumbSwiper);
    }
    if (this.sliderSwiper) {
      this.destroySlider(this.sliderSwiper);
    }
    this.loadContent(variantData, this.thumbSlider, this.thumbSliderTemplate);
    this.loadContent(variantData, this.slider, this.sliderTemplate);
    this.initThumbSlider();
    this.initSlider();
  }

  getDefaultVariantData() {
    return JSON.parse(this.script.textContent);
  }

  loadContent(variantData, slider, template) {
    const variantID = variantData.id;
    const templateContent = template.content.cloneNode(true);
    const target = slider.querySelector(".swiper-wrapper");
    target.innerHTML = "";
    target.append(templateContent);
    Array.from(target.children).forEach(function (item) {
      if (item.dataset.variantId != variantID) {
        item.remove();
      }
    });
  }

  initThumbSlider() {
    this.thumbSwiper = new Swiper(this.thumbSlider, {
      observer: true,
      observeParents: true,
      slidesPerView: "auto",
      spaceBetween: 0,
      freeMode: true,
      watchSlidesProgress: true,
    });
  }

  initSlider() {
    this.sliderSwiper = new Swiper(this.slider, {
      observer: true,
      observeParents: true,
      slidesPerView: 1,
      spaceBetween: 12,
      loop: true,
      speed: 400,
      grabCursor: true,
      mousewheel: {
        forceToAxis: true,
      },
      focusableElements: ".focusDisableSwiper",
      navigation: {
        prevEl: this.slider.querySelector(".swiper-button-prev"),
        nextEl: this.slider.querySelector(".swiper-button-next"),
        disabledClass: "hidden",
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true,
        pageUpDown: true,
      },
      thumbs: {
        swiper: this.thumbSwiper,
      },
    });
  }

  destroySlider(swiper) {
    swiper.destroy(true, true);
  }
}
customElements.define("product-zoom-gallery", ProductZoomGallery);

class ProductZoom extends ModalDialog {
  constructor() {
    super();

    this.addEventListener("click", (event) => {
      this.hide();
    });
  }

  hide() {
    super.hide();
  }

  show(opener) {
    super.show(opener);
    this.showActiveMedia();
  }

  showActiveMedia() {
    this.querySelectorAll(
      `[data-media-id]:not([data-media-id="${this.openedBy.getAttribute(
        "data-media-id"
      )}"])`
    ).forEach((element) => {
      element.classList.remove("active");
    });
    const activeMedia = this.querySelector(
      `[data-media-id="${this.openedBy.getAttribute("data-media-id")}"]`
    );

    activeMedia.classList.add("active");
    activeMedia.scrollIntoView();

    const container = this.querySelector(".dialog-modal-main");

    if (
      activeMedia.clientWidth > container.clientWidth &&
      activeMedia.clientHeight > container.clientHeight
    ) {
      container.scrollLeft =
        (activeMedia.clientWidth - container.clientWidth) / 2;
      container.scrollTop =
        (activeMedia.clientHeight - container.clientHeight) / 2;
    }
  }
}
customElements.define("product-zoom", ProductZoom);

class productCard extends HTMLElement {
  constructor() {
    super();
    this.selectedOption = this.querySelector("input:checked");
    this.template = this.querySelector("template");
    this.media = this.querySelector("[data-product-card-media]");
    this.linkTop = this.querySelector("[data-product-card-top-link]");
    this.linkBottom = this.querySelector("[data-product-card-bottom-link]");
    this.price = this.querySelector("[data-product-card-price]");
  }

  connectedCallback() {
    if (this.selectedOption) {
      this.updateMedia(this.selectedOption);
      this.updateText(this.selectedOption);
    }

    this.addEventListener("change", (event) => {
      this.selectedOption = event.target;
      this.updateMedia(this.selectedOption);
      this.updateText(this.selectedOption);
    });
  }

  updateText(option) {
    this.linkTop.href = option.dataset.optionVariantLink;
    this.linkBottom.href = option.dataset.optionVariantLink;
    if (this.price) {
      this.price.innerHTML = option.dataset.optionVariantPrice;
    }
  }

  updateMedia(option) {
    const optionValue = option.dataset.optionValue;
    const templateContent = this.template.content.cloneNode(true);
    this.media.innerHTML = "";
    this.media.append(templateContent);
    Array.from(this.media.children).forEach(function (item) {
      if (item.dataset.optionValue != optionValue) {
        item.remove();
      }
    });
  }
}
customElements.define("product-card", productCard);

///////

class ArticleRelatedArticles extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector(".swiper");
  }
  connectedCallback() {
    if (window.innerWidth < 1025) {
      this.slider.style.setProperty("--swiper-scrollbar-sides-offset", "16px");
    }
    this.swiper = new Swiper(this.slider, {
      slidesPerView: 2.18,
      spaceBetween: 12,
      freeMode: true,
      watchSlidesProgress: true,
      mousewheel: {
        forceToAxis: true,
      },
      scrollbar: {
        el: ".cb-slider-scrollbar",
        draggable: true,
      },
      breakpoints: {
        0: {
          slidesOffsetBefore: 16,
          slidesOffsetAfter: 16,
        },
        1025: {
          slidesPerView: 4,
          spaceBetween: 16,
          centeredSlides: false,
          scrollbar: false,
          scrollbar: {
            el: ".cb-slider-scrollbar",
            draggable: true,
          },
        },
      },
    });
  }
}
customElements.define("article-related-articles", ArticleRelatedArticles);

class PageVideosSlider extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector(".swiper");
  }
  connectedCallback() {
    if (window.innerWidth < 1025) {
      this.slider.style.setProperty("--swiper-scrollbar-sides-offset", "16px");
    }
    this.swiper = new Swiper(this.slider, {
      slidesPerView: 2.18,
      spaceBetween: 12,
      freeMode: true,
      watchSlidesProgress: true,
      mousewheel: {
        forceToAxis: true,
      },
      breakpoints: {
        0: {
          scrollbar: {
            el: ".vs-slider-scrollbar",
            draggable: true,
          },
          grabCursor: true,
          slidesOffsetBefore: 16,
          slidesOffsetAfter: 16,
        },
        1025: {
          slidesPerView: 4.13,
          spaceBetween: 16,
          slidesOffsetBefore: 24,
          slidesOffsetAfter: 24,
          centeredSlides: false,
          scrollbar: false,
          navigation: {
            nextEl: ".vs-next-btn",
            prevEl: ".vs-prev-btn",
          },
        },
      },
    });
  }
}

customElements.define("page-videos-slider", PageVideosSlider);

class ContentBlocks extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector(".swiper");
  }
  connectedCallback() {
    const blockCount = parseInt(this.dataset.blockCount || "4", 10);
    if (window.innerWidth < 1025) {
      this.slider.style.setProperty("--swiper-scrollbar-sides-offset", "16px");
    }
    this.swiper = new Swiper(this.slider, {
      slidesPerView: 2.18,
      spaceBetween: 12,
      freeMode: true,
      watchSlidesProgress: true,
      mousewheel: {
        forceToAxis: true,
      },
      scrollbar: {
        el: ".cb-slider-scrollbar",
        draggable: true,
      },
      breakpoints: {
        0: {
          slidesOffsetBefore: 16,
          slidesOffsetAfter: 16,
        },
        1025: {
          slidesPerView: blockCount,
          spaceBetween: 16,
        },
      },
    });
  }
}
customElements.define("content-blocks", ContentBlocks);

if (window.innerWidth < 1025) {
  class ArticleLayoutGrid extends HTMLElement {
    constructor() {
      super();
      this.slider = this.querySelector(".swiper");
    }
    connectedCallback() {
      if (window.innerWidth < 1025) {
        this.slider.style.setProperty(
          "--swiper-scrollbar-sides-offset",
          "16px"
        );
      }
      this.swiper = new Swiper(this.slider, {
        breakpoints: {
          0: {
            slidesPerView: 2.18,
            spaceBetween: 12,
            freeMode: true,
            watchSlidesProgress: true,
            mousewheel: {
              forceToAxis: true,
            },
            scrollbar: {
              el: ".cb-slider-scrollbar",
              draggable: true,
            },
            slidesOffsetBefore: 16,
            slidesOffsetAfter: 16,
          },
          1025: {
            slidesPerView: 4,
            scrollbar: false,
          },
        },
      });
    }
  }
  customElements.define("article-layout-grid", ArticleLayoutGrid);
}

class QuantitySelectorCl extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const container = this;

    const totalBox = container.querySelector(".js-cl-total-boxes");
    const totalPriceBox = container.querySelector(".js-cl-total-boxes-value");

    const pricingModule = container.querySelector(".pricing-module__cl");
    const pricePerBox = parseFloat(pricingModule?.dataset.boxPrice) || 0;
    const annualSupplyThreshold =
      parseInt(pricingModule?.dataset.clAnnualSupply) || Infinity;

    const pricePerBoxElement = container.querySelector(
      ".cl_price_per_box_value"
    );
    const pricePerBoxDiscountedElement = container.querySelector(
      ".cl_price_per_box_value_discounted"
    );

    const leftQuantityInput = container.querySelector(
      ".quantity_cl_left .quantity__input_cl"
    );
    const rightQuantityInput = container.querySelector(
      ".quantity_cl_right .quantity__input_cl"
    );

    const leftCheckbox = container.querySelector("#quantity-checkbox-left");
    const rightCheckbox = container.querySelector("#quantity-checkbox-right");
    const leftQuantity = container.querySelector(".quantity_cl_left");
    const rightQuantity = container.querySelector(".quantity_cl_right");

    const updateTotal = () => {
      const leftValue =
        leftQuantityInput && !leftQuantityInput.disabled
          ? parseInt(leftQuantityInput.value) || 0
          : 0;
      const rightValue =
        rightQuantityInput && !rightQuantityInput.disabled
          ? parseInt(rightQuantityInput.value) || 0
          : 0;
      const total = leftValue + rightValue;

      const rawDiscountedPrice =
        parseFloat(pricingModule?.dataset.discountedPrice) || pricePerBox;

      // Check if discount actually applies
      const hasValidDiscount = rawDiscountedPrice < pricePerBox;
      const isDiscounted = total >= annualSupplyThreshold && hasValidDiscount;
      const finalPricePerBox = isDiscounted ? rawDiscountedPrice : pricePerBox;

      const totalPrice = (total * finalPricePerBox) / 100;

      if (totalBox) totalBox.textContent = total;
      if (totalPriceBox) {
        const nonDiscountedTotal = (total * pricePerBox) / 100;
        totalPriceBox.textContent = "$" + nonDiscountedTotal.toFixed(2);
      }

      const subtotalBox = container.querySelector(".cl_subtotal_value");
      if (subtotalBox) subtotalBox.textContent = "$" + totalPrice.toFixed(2);

      // Toggle visibility of price elements
      if (pricePerBoxElement && pricePerBoxDiscountedElement) {
        const showDiscount = isDiscounted && hasValidDiscount;
        pricePerBoxElement.classList.toggle("hidden", showDiscount);
        pricePerBoxDiscountedElement.classList.toggle("hidden", !showDiscount);
      }

      // Toggle visibility of annual price section
      const annualPriceElement = container.querySelector(".cl_annual_price");
      const annualPriceValueElement = container.querySelector(
        ".cl_annual_price_value"
      );
      if (annualPriceElement && annualPriceValueElement) {
        if (isDiscounted && hasValidDiscount) {
          annualPriceElement.classList.remove("hidden");
          const savings = ((pricePerBox - rawDiscountedPrice) * total) / 100;
          annualPriceValueElement.textContent = "-$" + savings.toFixed(2);
        } else {
          annualPriceElement.classList.add("hidden");
          annualPriceValueElement.textContent = "$0.00";
        }
      }

      // Disable or enable the "Select Lenses" button based on total
      const selectLensesBtn = document.getElementById("la-select-lenses-btn");
      if (selectLensesBtn) {
        if (total === 0) {
          selectLensesBtn.setAttribute("disabled", "true");
          selectLensesBtn.setAttribute("tabindex", "-1");
        } else {
          selectLensesBtn.removeAttribute("disabled");
          selectLensesBtn.removeAttribute("tabindex");
        }
      }
    };

    container.querySelectorAll(".quantity_cl").forEach((quantityBox) => {
      const input = quantityBox.querySelector(".quantity__input_cl");
      const minusBtn = quantityBox.querySelector('button[name="minus"]');
      const plusBtn = quantityBox.querySelector('button[name="plus"]');

      const min = parseInt(input.min) || 1;
      const max = parseInt(input.max) || 12;

      minusBtn.addEventListener("click", () => {
        let value = parseInt(input.value) || min;
        input.value = Math.max(min, value - 1);
        updateTotal();
      });

      plusBtn.addEventListener("click", () => {
        let value = parseInt(input.value) || min;
        input.value = Math.min(max, value + 1);
        updateTotal();
      });
    });

    const toggleState = (checkbox, quantityDiv) => {
      const isDisabled = !checkbox.checked;
      const input = quantityDiv.querySelector(".quantity__input_cl");

      quantityDiv.querySelectorAll("input, button").forEach((el) => {
        el.disabled = isDisabled;
      });

      if (input) {
        input.value = isDisabled ? 0 : 1;
      }

      updateTotal();
    };

    if (leftCheckbox && rightCheckbox && leftQuantity && rightQuantity) {
      toggleState(leftCheckbox, leftQuantity);
      toggleState(rightCheckbox, rightQuantity);

      leftCheckbox.addEventListener("change", () => {
        toggleState(leftCheckbox, leftQuantity);
      });

      rightCheckbox.addEventListener("change", () => {
        toggleState(rightCheckbox, rightQuantity);
      });
    }

    updateTotal();
  }
}

customElements.define("quantity-selector-cl", QuantitySelectorCl);
