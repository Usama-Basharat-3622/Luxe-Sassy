class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector("input");
    this.changeEvent = new Event("change", { bubbles: true });
    this.input.addEventListener("change", this.onInputChange.bind(this));
    this.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this))
    );
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(
      PUB_SUB_EVENTS.quantityUpdate,
      this.validateQtyRules.bind(this)
    );
  }

  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

  onInputChange(event) {
    this.validateQtyRules();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    if (event.target.name === "plus") {
      if (
        parseInt(this.input.dataset.min) > parseInt(this.input.step) &&
        this.input.value == 0
      ) {
        this.input.value = this.input.dataset.min;
      } else {
        this.input.stepUp();
      }
    } else {
      this.input.stepDown();
    }

    if (previousValue !== this.input.value)
      this.input.dispatchEvent(this.changeEvent);

    if (
      this.input.dataset.min === previousValue &&
      event.target.name === "minus"
    ) {
      this.input.value = parseInt(this.input.min);
    }
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const buttonMinus = this.querySelector(".quantity__button[name='minus']");
      buttonMinus.classList.toggle(
        "disabled",
        parseInt(value) <= parseInt(this.input.min)
      );
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity__button[name='plus']");
      buttonPlus.classList.toggle("disabled", value >= max);
    }
  }
}
customElements.define("quantity-input", QuantityInput);

class PricePerItem extends HTMLElement {
  constructor() {
    super();
    this.variantId = this.dataset.variantId;
    this.input = document.getElementById(
      `Quantity-${this.dataset.sectionId || this.dataset.variantId}`
    );
    if (this.input) {
      this.input.addEventListener("change", this.onInputChange.bind(this));
    }

    this.getVolumePricingArray();
  }

  updatePricePerItemUnsubscriber = undefined;
  variantIdChangedUnsubscriber = undefined;

  connectedCallback() {
    // Update variantId if variant is switched on product page
    this.variantIdChangedUnsubscriber = subscribe(
      PUB_SUB_EVENTS.variantChange,
      (event) => {
        this.variantId = event.data.variant.id.toString();
        this.getVolumePricingArray();
      }
    );

    this.updatePricePerItemUnsubscriber = subscribe(
      PUB_SUB_EVENTS.cartUpdate,
      (response) => {
        if (!response.cartData) return;

        // Item was added to cart via product page
        if (response.cartData["variant_id"] !== undefined) {
          if (response.productVariantId === this.variantId)
            this.updatePricePerItem(response.cartData.quantity);
          // Qty was updated in cart
        } else if (response.cartData.item_count !== 0) {
          const isVariant = response.cartData.items.find(
            (item) => item.variant_id.toString() === this.variantId
          );
          if (isVariant && isVariant.id.toString() === this.variantId) {
            // The variant is still in cart
            this.updatePricePerItem(isVariant.quantity);
          } else {
            // The variant was removed from cart, qty is 0
            this.updatePricePerItem(0);
          }
          // All items were removed from cart
        } else {
          this.updatePricePerItem(0);
        }
      }
    );
  }

  disconnectedCallback() {
    if (this.updatePricePerItemUnsubscriber) {
      this.updatePricePerItemUnsubscriber();
    }
    if (this.variantIdChangedUnsubscriber) {
      this.variantIdChangedUnsubscriber();
    }
  }

  onInputChange() {
    this.updatePricePerItem();
  }

  updatePricePerItem(updatedCartQuantity) {
    if (this.input) {
      this.enteredQty = parseInt(this.input.value);
      this.step = parseInt(this.input.step);
    }

    // updatedCartQuantity is undefined when qty is updated on product page. We need to sum entered qty and current qty in cart.
    // updatedCartQuantity is not undefined when qty is updated in cart. We need to sum qty in cart and min qty for product.
    this.currentQtyForVolumePricing =
      updatedCartQuantity === undefined
        ? this.getCartQuantity(updatedCartQuantity) + this.enteredQty
        : this.getCartQuantity(updatedCartQuantity) + parseInt(this.step);

    if (this.classList.contains("variant-item__price-per-item")) {
      this.currentQtyForVolumePricing =
        this.getCartQuantity(updatedCartQuantity);
    }
    for (let pair of this.qtyPricePairs) {
      if (this.currentQtyForVolumePricing >= pair[0]) {
        const pricePerItemCurrent = document.querySelector(
          `price-per-item[id^="Price-Per-Item-${
            this.dataset.sectionId || this.dataset.variantId
          }"] .price-per-item span`
        );
        this.classList.contains("variant-item__price-per-item")
          ? (pricePerItemCurrent.innerHTML =
              window.quickOrderListStrings.each.replace("[money]", pair[1]))
          : (pricePerItemCurrent.innerHTML = pair[1]);
        break;
      }
    }
  }

  getCartQuantity(updatedCartQuantity) {
    return updatedCartQuantity || updatedCartQuantity === 0
      ? updatedCartQuantity
      : parseInt(this.input.dataset.cartQuantity);
  }

  getVolumePricingArray() {
    const volumePricing = document.getElementById(
      `Volume-${this.dataset.sectionId || this.dataset.variantId}`
    );
    this.qtyPricePairs = [];

    if (volumePricing) {
      volumePricing.querySelectorAll("li").forEach((li) => {
        const qty = parseInt(li.querySelector("span:first-child").textContent);
        const price = li.querySelector("span:not(:first-child):last-child")
          .dataset.text;
        this.qtyPricePairs.push([qty, price]);
      });
    }
    this.qtyPricePairs.reverse();
  }
}
customElements.define("price-per-item", PricePerItem);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.addEventListener("change", (event) => {
      const target = this.getInputForEventTarget(event.target);
      this.updateSelectionMetadata(event);

      publish(PUB_SUB_EVENTS.optionValueSelectionChange, {
        data: {
          event,
          target,
          selectedOptionValues: this.selectedOptionValues,
        },
      });
    });
  }

  updateSelectionMetadata({ target }) {
    const { value, tagName } = target;

    if (tagName === "SELECT" && target.selectedOptions.length) {
      Array.from(target.options)
        .find((option) => option.getAttribute("selected"))
        .removeAttribute("selected");
      target.selectedOptions[0].setAttribute("selected", "selected");

      const swatchValue = target.selectedOptions[0].dataset.optionSwatchValue;
      const selectedDropdownSwatchValue = target
        .closest(".product-form__input")
        .querySelector("[data-selected-value] > .swatch");
      if (!selectedDropdownSwatchValue) return;
      if (swatchValue) {
        selectedDropdownSwatchValue.style.setProperty(
          "--swatch--background",
          swatchValue
        );
        selectedDropdownSwatchValue.classList.remove("swatch--unavailable");
      } else {
        selectedDropdownSwatchValue.style.setProperty(
          "--swatch--background",
          "unset"
        );
        selectedDropdownSwatchValue.classList.add("swatch--unavailable");
      }

      selectedDropdownSwatchValue.style.setProperty(
        "--swatch-focal-point",
        target.selectedOptions[0].dataset.optionSwatchFocalPoint || "unset"
      );
    } else if (tagName === "INPUT" && target.type === "radio") {
      const selectedSwatchValue = target
        .closest(`.product-form__input`)
        .querySelector("[data-selected-value]");
      if (selectedSwatchValue) selectedSwatchValue.innerHTML = value;
    }
  }

  getInputForEventTarget(target) {
    return target.tagName === "SELECT" ? target.selectedOptions[0] : target;
  }

  get selectedOptionValues() {
    return Array.from(
      this.querySelectorAll("select option[selected], fieldset input:checked")
    ).map(({ dataset }) => dataset.optionValueId);
  }
}
customElements.define("variant-selects", VariantSelects);

class ProductRecommendations extends HTMLElement {
  observer = undefined;

  constructor() {
    super();
  }

  connectedCallback() {
    this.initializeRecommendations(this.dataset.productId);
  }

  initializeRecommendations(productId) {
    this.observer?.unobserve(this);
    this.observer = new IntersectionObserver(
      (entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.unobserve(this);
        this.loadRecommendations(productId);
      },
      { rootMargin: "0px 0px 400px 0px" }
    );
    this.observer.observe(this);
  }

  loadRecommendations(productId) {
    fetch(
      `${this.dataset.url}&product_id=${productId}&section_id=${this.dataset.sectionId}`
    )
      .then((response) => response.text())
      .then((text) => {
        const html = document.createElement("div");
        html.innerHTML = text;
        const recommendations = html.querySelector("product-recommendations");

        if (recommendations?.innerHTML.trim().length) {
          this.innerHTML = recommendations.innerHTML;
        }

        this.carousel = this.querySelector(".swiper");

        this.swiper = new Swiper(this.carousel, {
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
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
customElements.define("product-recommendations", ProductRecommendations);

class ProductInfo extends HTMLElement {
  quantityInput = undefined;
  quantityForm = undefined;
  onVariantChangeUnsubscriber = undefined;
  cartUpdateUnsubscriber = undefined;
  abortController = undefined;
  pendingRequestUrl = null;
  preProcessHtmlCallbacks = [];
  postProcessHtmlCallbacks = [];

  constructor() {
    super();

    this.quantityInput = this.querySelector(".quantity__input");
  }

  connectedCallback() {
    this.initializeProductSwapUtility();

    this.onVariantChangeUnsubscriber = subscribe(
      PUB_SUB_EVENTS.optionValueSelectionChange,
      this.handleOptionValueChange.bind(this)
    );

    this.initQuantityHandlers();
    this.dispatchEvent(
      new CustomEvent("product-info:loaded", { bubbles: true })
    );
  }

  addPreProcessCallback(callback) {
    this.preProcessHtmlCallbacks.push(callback);
  }

  initQuantityHandlers() {
    if (!this.quantityInput) return;

    this.quantityForm = this.querySelector(".product-form__quantity");
    if (!this.quantityForm) return;

    this.setQuantityBoundries();
    if (!this.dataset.originalSection) {
      this.cartUpdateUnsubscriber = subscribe(
        PUB_SUB_EVENTS.cartUpdate,
        this.fetchQuantityRules.bind(this)
      );
    }
  }

  disconnectedCallback() {
    this.onVariantChangeUnsubscriber();
    this.cartUpdateUnsubscriber?.();
  }

  initializeProductSwapUtility() {
    this.preProcessHtmlCallbacks.push((html) =>
      html
        .querySelectorAll(".scroll-trigger")
        .forEach((element) => element.classList.add("scroll-trigger--cancel"))
    );
    this.postProcessHtmlCallbacks.push((newNode) => {
      window?.Shopify?.PaymentButton?.init();
      window?.ProductModel?.loadShopifyXR();
    });
  }

  handleOptionValueChange({ data: { event, target, selectedOptionValues } }) {
    if (!this.contains(event.target)) return;

    this.resetProductFormState();

    const productUrl =
      target.dataset.productUrl || this.pendingRequestUrl || this.dataset.url;
    this.pendingRequestUrl = productUrl;
    const shouldSwapProduct = this.dataset.url !== productUrl;
    const shouldFetchFullPage =
      this.dataset.updateUrl === "true" && shouldSwapProduct;

    this.renderProductInfo({
      requestUrl: this.buildRequestUrlWithParams(
        productUrl,
        selectedOptionValues,
        shouldFetchFullPage
      ),
      targetId: target.id,
      callback: shouldSwapProduct
        ? this.handleSwapProduct(productUrl, shouldFetchFullPage)
        : this.handleUpdateProductInfo(productUrl),
    });
  }

  resetProductFormState() {
    const productForm = this.productForm;
    productForm?.toggleSubmitButton(true);
    productForm?.handleErrorMessage();
  }

  handleSwapProduct(productUrl, updateFullPage) {
    return (html) => {
      this.productModal?.remove();

      const selector = updateFullPage
        ? "product-info[id^='MainProduct']"
        : "product-info";
      const variant = this.getSelectedVariant(html.querySelector(selector));
      this.updateURL(productUrl, variant?.id);

      if (updateFullPage) {
        document.querySelector("head title").innerHTML =
          html.querySelector("head title").innerHTML;

        HTMLUpdateUtility.viewTransition(
          document.querySelector("main"),
          html.querySelector("main"),
          this.preProcessHtmlCallbacks,
          this.postProcessHtmlCallbacks
        );
      } else {
        HTMLUpdateUtility.viewTransition(
          this,
          html.querySelector("product-info"),
          this.preProcessHtmlCallbacks,
          this.postProcessHtmlCallbacks
        );
      }
    };
  }

  renderProductInfo({ requestUrl, targetId, callback }) {
    this.abortController?.abort();
    this.abortController = new AbortController();

    fetch(requestUrl, { signal: this.abortController.signal })
      .then((response) => response.text())
      .then((responseText) => {
        this.pendingRequestUrl = null;
        const html = new DOMParser().parseFromString(responseText, "text/html");
        callback(html);
      })
      .then(() => {
        // set focus to last clicked option value
        document.querySelector(`#${targetId}`)?.focus();
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          console.log("Fetch aborted by user");
        } else {
          console.error(error);
        }
      });
  }

  getSelectedVariant(productInfoNode) {
    const selectedVariant = productInfoNode.querySelector(
      "variant-selects [data-selected-variant]"
    )?.innerHTML;
    return !!selectedVariant ? JSON.parse(selectedVariant) : null;
  }

  buildRequestUrlWithParams(url, optionValues, shouldFetchFullPage = false) {
    const params = [];

    !shouldFetchFullPage && params.push(`section_id=${this.sectionId}`);

    if (optionValues.length) {
      params.push(`option_values=${optionValues.join(",")}`);
    }

    return `${url}?${params.join("&")}`;
  }

  updateOptionValues(html) {
    const variantSelects = html.querySelector("variant-selects");
    if (variantSelects) {
      HTMLUpdateUtility.viewTransition(
        this.variantSelectors,
        variantSelects,
        this.preProcessHtmlCallbacks
      );
    }
  }

  handleUpdateProductInfo(productUrl) {
    return (html) => {
      const variant = this.getSelectedVariant(html);

      this.pickupAvailability?.update(variant);
      this.updateOptionValues(html);
      this.updateURL(productUrl, variant?.id);
      this.updateVariantInputs(variant?.id);

      if (!variant) {
        this.setUnavailable();
        return;
      }

      this.updateMedia(variant);

      const updateSourceFromDestination = (
        id,
        shouldHide = (source) => false
      ) => {
        const source = html.getElementById(`${id}-${this.sectionId}`);
        const destination = this.querySelector(
          `#${id}-${this.dataset.section}`
        );
        if (source && destination) {
          destination.innerHTML = source.innerHTML;
          destination.classList.toggle("hidden", shouldHide(source));
        }
      };

      updateSourceFromDestination("price");
      updateSourceFromDestination("Sku", ({ classList }) =>
        classList.contains("hidden")
      );
      updateSourceFromDestination(
        "Inventory",
        ({ innerText }) => innerText === ""
      );
      updateSourceFromDestination("Volume");
      updateSourceFromDestination("Price-Per-Item", ({ classList }) =>
        classList.contains("hidden")
      );

      this.updateQuantityRules(this.sectionId, html);
      this.querySelector(
        `#Quantity-Rules-${this.dataset.section}`
      )?.classList.remove("hidden");
      this.querySelector(
        `#Volume-Note-${this.dataset.section}`
      )?.classList.remove("hidden");

      this.productForm?.toggleSubmitButton(
        html
          .getElementById(`ProductSubmitButton-${this.sectionId}`)
          ?.hasAttribute("disabled") ?? true,
        window.variantStrings.soldOut
      );

      publish(PUB_SUB_EVENTS.variantChange, {
        data: {
          sectionId: this.sectionId,
          html,
          variant,
        },
      });
    };
  }

  updateVariantInputs(variantId) {
    this.querySelectorAll(
      `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`
    ).forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = variantId ?? "";
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  updateURL(url, variantId) {
    this.querySelector("share-button")?.updateUrl(
      `${window.shopUrl}${url}${variantId ? `?variant=${variantId}` : ""}`
    );

    if (this.dataset.updateUrl === "false") return;
    window.history.replaceState(
      {},
      "",
      `${url}${variantId ? `?variant=${variantId}` : ""}`
    );
  }

  setUnavailable() {
    this.productForm?.toggleSubmitButton(
      true,
      window.variantStrings.unavailable
    );

    const selectors = [
      "price",
      "Inventory",
      "Sku",
      "Price-Per-Item",
      "Volume-Note",
      "Volume",
      "Quantity-Rules",
    ]
      .map((id) => `#${id}-${this.dataset.section}`)
      .join(", ");
    document
      .querySelectorAll(selectors)
      .forEach(({ classList }) => classList.add("hidden"));
  }

  updateMedia(variant) {
    const productGallery = document.getElementById(
      `ProductGallery-${this.dataset.section}`
    );
    const ProductZoomGallery = document.getElementById(
      `ProductZoomGallery-${this.dataset.section}`
    );
    if (productGallery) productGallery.refresh(variant);
    if (ProductZoomGallery) ProductZoomGallery.refresh(variant);
  }

  setQuantityBoundries() {
    const data = {
      cartQuantity: this.quantityInput.dataset.cartQuantity
        ? parseInt(this.quantityInput.dataset.cartQuantity)
        : 0,
      min: this.quantityInput.dataset.min
        ? parseInt(this.quantityInput.dataset.min)
        : 1,
      max: this.quantityInput.dataset.max
        ? parseInt(this.quantityInput.dataset.max)
        : null,
      step: this.quantityInput.step ? parseInt(this.quantityInput.step) : 1,
    };

    let min = data.min;
    const max = data.max === null ? data.max : data.max - data.cartQuantity;
    if (max !== null) min = Math.min(min, max);
    if (data.cartQuantity >= data.min) min = Math.min(min, data.step);

    this.quantityInput.min = min;

    if (max) {
      this.quantityInput.max = max;
    } else {
      this.quantityInput.removeAttribute("max");
    }
    this.quantityInput.value = min;

    publish(PUB_SUB_EVENTS.quantityUpdate, undefined);
  }

  fetchQuantityRules() {
    const currentVariantId = this.productForm?.variantIdInput?.value;
    if (!currentVariantId) return;

    this.querySelector(
      ".quantity__rules-cart .loading__spinner"
    ).classList.remove("hidden");
    return fetch(
      `${this.dataset.url}?variant=${currentVariantId}&section_id=${this.dataset.section}`
    )
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, "text/html");
        this.updateQuantityRules(this.dataset.section, html);
      })
      .catch((e) => console.error(e))
      .finally(() =>
        this.querySelector(
          ".quantity__rules-cart .loading__spinner"
        ).classList.add("hidden")
      );
  }

  updateQuantityRules(sectionId, html) {
    if (!this.quantityInput) return;
    this.setQuantityBoundries();

    const quantityFormUpdated = html.getElementById(
      `QuantityForm-${sectionId}`
    );
    const selectors = [
      ".quantity__input",
      ".quantity__rules",
      ".quantity__label",
    ];
    for (let selector of selectors) {
      const current = this.quantityForm.querySelector(selector);
      const updated = quantityFormUpdated.querySelector(selector);
      if (!current || !updated) continue;
      if (selector === ".quantity__input") {
        const attributes = [
          "data-cart-quantity",
          "data-min",
          "data-max",
          "step",
        ];
        for (let attribute of attributes) {
          const valueUpdated = updated.getAttribute(attribute);
          if (valueUpdated !== null) {
            current.setAttribute(attribute, valueUpdated);
          } else {
            current.removeAttribute(attribute);
          }
        }
      } else {
        current.innerHTML = updated.innerHTML;
      }
    }
  }

  get productForm() {
    return this.querySelector(`product-form`);
  }

  get productModal() {
    return document.querySelector(`#ProductModal-${this.dataset.section}`);
  }

  get pickupAvailability() {
    return this.querySelector(`pickup-availability`);
  }

  get variantSelectors() {
    return this.querySelector("variant-selects");
  }

  get relatedProducts() {
    const relatedProductsSectionId = SectionId.getIdForSection(
      SectionId.parseId(this.sectionId),
      "related-products"
    );
    return document.querySelector(
      `product-recommendations[data-section-id^="${relatedProductsSectionId}"]`
    );
  }

  get quickOrderList() {
    const quickOrderListSectionId = SectionId.getIdForSection(
      SectionId.parseId(this.sectionId),
      "quick_order_list"
    );
    return document.querySelector(
      `quick-order-list[data-id^="${quickOrderListSectionId}"]`
    );
  }

  get sectionId() {
    return this.dataset.originalSection || this.dataset.section;
  }
}
customElements.define("product-info", ProductInfo);

class ProductForm extends HTMLElement {
  constructor() {
    super();

    this.form = this.querySelector("form");
    this.variantIdInput.disabled = false;
    this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
    this.cart =
      document.querySelector("cart-notification") ||
      document.querySelector("cart-drawer");
    this.submitButton = this.querySelector('[type="submit"]');
    this.submitButtonText = this.submitButton.querySelector("span");

    if (document.querySelector("cart-drawer"))
      this.submitButton.setAttribute("aria-haspopup", "dialog");

    this.hideErrors = this.dataset.hideErrors === "true";
  }

  onSubmitHandler(evt) {
    evt.preventDefault();
    if (this.submitButton.getAttribute("aria-disabled") === "true") return;

    this.handleErrorMessage();

    this.submitButton.setAttribute("aria-disabled", true);
    this.submitButton.classList.add("loading");
    this.querySelector(".loading__spinner").classList.remove("hidden");

    const config = fetchConfig("javascript");
    config.headers["X-Requested-With"] = "XMLHttpRequest";
    delete config.headers["Content-Type"];

    const formData = new FormData(this.form);
    if (this.cart) {
      formData.append(
        "sections",
        this.cart.getSectionsToRender().map((section) => section.id)
      );
      formData.append("sections_url", window.location.pathname);
      this.cart.setActiveElement(document.activeElement);
    }
    config.body = formData;

    fetch(`${routes.cart_add_url}`, config)
      .then((response) => response.json())
      .then((response) => {
        if (response.status) {
          publish(PUB_SUB_EVENTS.cartError, {
            source: "product-form",
            productVariantId: formData.get("id"),
            errors: response.errors || response.description,
            message: response.message,
          });
          this.handleErrorMessage(response.description);

          const soldOutMessage =
            this.submitButton.querySelector(".sold-out-message");
          if (!soldOutMessage) return;
          this.submitButton.setAttribute("aria-disabled", true);
          this.submitButtonText.classList.add("hidden");
          soldOutMessage.classList.remove("hidden");
          this.error = true;
          return;
        } else if (!this.cart) {
          window.location = window.routes.cart_url;
          return;
        }

        const startMarker = CartPerformance.createStartingMarker(
          "add:wait-for-subscribers"
        );
        if (!this.error)
          publish(PUB_SUB_EVENTS.cartUpdate, {
            source: "product-form",
            productVariantId: formData.get("id"),
            cartData: response,
          }).then(() => {
            CartPerformance.measureFromMarker(
              "add:wait-for-subscribers",
              startMarker
            );
          });
        this.error = false;
        const quickAddModal = this.closest("quick-add-modal");
        if (quickAddModal) {
          document.body.addEventListener(
            "modalClosed",
            () => {
              setTimeout(() => {
                CartPerformance.measure("add:paint-updated-sections", () => {
                  this.cart.renderContents(response);
                });
              });
            },
            { once: true }
          );
          quickAddModal.hide(true);
        } else {
          CartPerformance.measure("add:paint-updated-sections", () => {
            this.cart.renderContents(response);
          });
        }
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        this.submitButton.classList.remove("loading");
        if (this.cart && this.cart.classList.contains("is-empty"))
          this.cart.classList.remove("is-empty");
        if (!this.error) this.submitButton.removeAttribute("aria-disabled");
        this.querySelector(".loading__spinner").classList.add("hidden");

        CartPerformance.measureFromEvent("add:user-action", evt);
      });
  }

  handleErrorMessage(errorMessage = false) {
    if (this.hideErrors) return;

    this.errorMessageWrapper =
      this.errorMessageWrapper ||
      this.querySelector(".product-form__error-message-wrapper");
    if (!this.errorMessageWrapper) return;
    this.errorMessage =
      this.errorMessage ||
      this.errorMessageWrapper.querySelector(".product-form__error-message");

    this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);

    if (errorMessage) {
      this.errorMessage.textContent = errorMessage;
    }
  }

  toggleSubmitButton(disable = true, text) {
    if (disable) {
      this.submitButton.setAttribute("disabled", "disabled");
      if (text) this.submitButtonText.textContent = text;
    } else {
      this.submitButton.removeAttribute("disabled");
      this.submitButtonText.textContent = window.variantStrings.addToCart;
    }
  }

  get variantIdInput() {
    return this.form.querySelector("[name=id]");
  }
}
customElements.define("product-form", ProductForm);

class RecipientForm extends HTMLElement {
  constructor() {
    super();
    this.recipientFieldsLiveRegion = this.querySelector(
      `#Recipient-fields-live-region-${this.dataset.sectionId}`
    );
    this.checkboxInput = this.querySelector(
      `#Recipient-checkbox-${this.dataset.sectionId}`
    );
    this.checkboxInput.disabled = false;
    this.hiddenControlField = this.querySelector(
      `#Recipient-control-${this.dataset.sectionId}`
    );
    this.hiddenControlField.disabled = true;
    this.emailInput = this.querySelector(
      `#Recipient-email-${this.dataset.sectionId}`
    );
    this.nameInput = this.querySelector(
      `#Recipient-name-${this.dataset.sectionId}`
    );
    this.messageInput = this.querySelector(
      `#Recipient-message-${this.dataset.sectionId}`
    );
    this.sendonInput = this.querySelector(
      `#Recipient-send-on-${this.dataset.sectionId}`
    );
    this.offsetProperty = this.querySelector(
      `#Recipient-timezone-offset-${this.dataset.sectionId}`
    );
    if (this.offsetProperty)
      this.offsetProperty.value = new Date().getTimezoneOffset().toString();

    this.errorMessageWrapper = this.querySelector(
      ".product-form__recipient-error-message-wrapper"
    );
    this.errorMessageList = this.errorMessageWrapper?.querySelector("ul");
    this.errorMessage =
      this.errorMessageWrapper?.querySelector(".error-message");
    this.defaultErrorHeader = this.errorMessage?.innerText;
    this.currentProductVariantId = this.dataset.productVariantId;
    this.addEventListener("change", this.onChange.bind(this));
    this.onChange();
  }

  cartUpdateUnsubscriber = undefined;
  variantChangeUnsubscriber = undefined;
  cartErrorUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(
      PUB_SUB_EVENTS.cartUpdate,
      (event) => {
        if (
          event.source === "product-form" &&
          event.productVariantId.toString() === this.currentProductVariantId
        ) {
          this.resetRecipientForm();
        }
      }
    );

    this.variantChangeUnsubscriber = subscribe(
      PUB_SUB_EVENTS.variantChange,
      (event) => {
        if (event.data.sectionId === this.dataset.sectionId) {
          this.currentProductVariantId = event.data.variant.id.toString();
        }
      }
    );

    this.cartUpdateUnsubscriber = subscribe(
      PUB_SUB_EVENTS.cartError,
      (event) => {
        if (
          event.source === "product-form" &&
          event.productVariantId.toString() === this.currentProductVariantId
        ) {
          this.displayErrorMessage(event.message, event.errors);
        }
      }
    );
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }

    if (this.variantChangeUnsubscriber) {
      this.variantChangeUnsubscriber();
    }

    if (this.cartErrorUnsubscriber) {
      this.cartErrorUnsubscriber();
    }
  }

  onChange() {
    if (this.checkboxInput.checked) {
      this.enableInputFields();
      this.recipientFieldsLiveRegion.innerText =
        window.accessibilityStrings.recipientFormExpanded;
    } else {
      this.clearInputFields();
      this.disableInputFields();
      this.clearErrorMessage();
      this.recipientFieldsLiveRegion.innerText =
        window.accessibilityStrings.recipientFormCollapsed;
    }
  }

  inputFields() {
    return [
      this.emailInput,
      this.nameInput,
      this.messageInput,
      this.sendonInput,
    ];
  }

  disableableFields() {
    return [...this.inputFields(), this.offsetProperty];
  }

  clearInputFields() {
    this.inputFields().forEach((field) => (field.value = ""));
  }

  enableInputFields() {
    this.disableableFields().forEach((field) => (field.disabled = false));
  }

  disableInputFields() {
    this.disableableFields().forEach((field) => (field.disabled = true));
  }

  displayErrorMessage(title, body) {
    this.clearErrorMessage();
    this.errorMessageWrapper.hidden = false;
    if (typeof body === "object") {
      this.errorMessage.innerText = this.defaultErrorHeader;
      return Object.entries(body).forEach(([key, value]) => {
        const errorMessageId = `RecipientForm-${key}-error-${this.dataset.sectionId}`;
        const fieldSelector = `#Recipient-${key}-${this.dataset.sectionId}`;
        const message = `${value.join(", ")}`;
        const errorMessageElement = this.querySelector(`#${errorMessageId}`);
        const errorTextElement =
          errorMessageElement?.querySelector(".error-message");
        if (!errorTextElement) return;

        if (this.errorMessageList) {
          this.errorMessageList.appendChild(
            this.createErrorListItem(fieldSelector, message)
          );
        }

        errorTextElement.innerText = `${message}.`;
        errorMessageElement.classList.remove("hidden");

        const inputElement = this[`${key}Input`];
        if (!inputElement) return;

        inputElement.setAttribute("aria-invalid", true);
        inputElement.setAttribute("aria-describedby", errorMessageId);
      });
    }

    this.errorMessage.innerText = body;
  }

  createErrorListItem(target, message) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.setAttribute("href", target);
    a.innerText = message;
    li.appendChild(a);
    li.className = "error-message";
    return li;
  }

  clearErrorMessage() {
    this.errorMessageWrapper.hidden = true;

    if (this.errorMessageList) this.errorMessageList.innerHTML = "";

    this.querySelectorAll(".recipient-fields .form__message").forEach(
      (field) => {
        field.classList.add("hidden");
        const textField = field.querySelector(".error-message");
        if (textField) textField.innerText = "";
      }
    );

    [
      this.emailInput,
      this.messageInput,
      this.nameInput,
      this.sendonInput,
    ].forEach((inputElement) => {
      inputElement.setAttribute("aria-invalid", false);
      inputElement.removeAttribute("aria-describedby");
    });
  }

  resetRecipientForm() {
    if (this.checkboxInput.checked) {
      this.checkboxInput.checked = false;
      this.clearInputFields();
      this.clearErrorMessage();
    }
  }
}
customElements.define("recipient-form", RecipientForm);

class QuickAddModal extends ModalDialog {
  constructor() {
    super();
    this.modalContent = this.querySelector('[id^="QuickAddInfo-"]');

    this.addEventListener("product-info:loaded", ({ target }) => {
      target.addPreProcessCallback(this.preprocessHTML.bind(this));
    });
  }

  hide(preventFocus = false) {
    const cartNotification =
      document.querySelector("cart-notification") ||
      document.querySelector("cart-drawer");
    if (cartNotification) cartNotification.setActiveElement(this.openedBy);
    this.modalContent.innerHTML = "";

    if (preventFocus) this.openedBy = null;
    super.hide();
  }

  show(opener) {
    opener.setAttribute("aria-disabled", true);
    opener.classList.add("loading");
    opener.querySelector(".loading__spinner").classList.remove("hidden");

    fetch(opener.getAttribute("data-product-url"))
      .then((response) => response.text())
      .then((responseText) => {
        const responseHTML = new DOMParser().parseFromString(
          responseText,
          "text/html"
        );
        const productElement = responseHTML.querySelector("product-info");

        this.preprocessHTML(productElement);
        HTMLUpdateUtility.setInnerHTML(
          this.modalContent,
          productElement.outerHTML
        );

        if (window.Shopify && Shopify.PaymentButton) {
          Shopify.PaymentButton.init();
        }
        if (window.ProductModel) window.ProductModel.loadShopifyXR();

        super.show(opener);
      })
      .finally(() => {
        opener.removeAttribute("aria-disabled");
        opener.classList.remove("loading");
        opener.querySelector(".loading__spinner").classList.add("hidden");
      });
  }

  preprocessHTML(productElement) {
    productElement.classList.forEach((classApplied) => {
      if (classApplied.startsWith("color-") || classApplied === "gradient")
        this.modalContent.classList.add(classApplied);
    });
    this.preventDuplicatedIDs(productElement);
    this.removeDOMElements(productElement);
    this.removeGalleryListSemantic(productElement);
    this.updateImageSizes(productElement);
    this.preventVariantURLSwitching(productElement);
  }

  preventVariantURLSwitching(productElement) {
    productElement.setAttribute("data-update-url", "false");
  }

  removeDOMElements(productElement) {
    const pickupAvailability = productElement.querySelector(
      "pickup-availability"
    );
    if (pickupAvailability) pickupAvailability.remove();

    const productModal = productElement.querySelector("product-modal");
    if (productModal) productModal.remove();

    const modalDialog = productElement.querySelectorAll("modal-dialog");
    if (modalDialog) modalDialog.forEach((modal) => modal.remove());
  }

  preventDuplicatedIDs(productElement) {
    const sectionId = productElement.dataset.section;

    const oldId = sectionId;
    const newId = `quickadd-${sectionId}`;
    productElement.innerHTML = productElement.innerHTML.replaceAll(
      oldId,
      newId
    );
    Array.from(productElement.attributes).forEach((attribute) => {
      if (attribute.value.includes(oldId)) {
        productElement.setAttribute(
          attribute.name,
          attribute.value.replace(oldId, newId)
        );
      }
    });

    productElement.dataset.originalSection = sectionId;
  }

  removeGalleryListSemantic(productElement) {
    const galleryList = productElement.querySelector('[id^="Slider-Gallery"]');
    if (!galleryList) return;

    galleryList.setAttribute("role", "presentation");
    galleryList
      .querySelectorAll('[id^="Slide-"]')
      .forEach((li) => li.setAttribute("role", "presentation"));
  }

  updateImageSizes(productElement) {
    const product = productElement.querySelector(".product");
    const desktopColumns = product?.classList.contains("product--columns");
    if (!desktopColumns) return;

    const mediaImages = product.querySelectorAll(".product__media img");
    if (!mediaImages.length) return;

    let mediaImageSizes =
      "(min-width: 1000px) 715px, (min-width: 750px) calc((100vw - 11.5rem) / 2), calc(100vw - 4rem)";

    if (product.classList.contains("product--medium")) {
      mediaImageSizes = mediaImageSizes.replace("715px", "605px");
    } else if (product.classList.contains("product--small")) {
      mediaImageSizes = mediaImageSizes.replace("715px", "495px");
    }

    mediaImages.forEach((img) => img.setAttribute("sizes", mediaImageSizes));
  }
}
customElements.define("quick-add-modal", QuickAddModal);

class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener("click", (event) => {
      event.preventDefault();
      const cartItems =
        this.closest("cart-items") || this.closest("cart-drawer-items");
      cartItems.updateQuantity(this.dataset.index, 0, event);
    });
  }
}
customElements.define("cart-remove-button", CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement =
      document.getElementById("shopping-cart-line-item-status") ||
      document.getElementById("CartDrawer-LineItemStatus");

    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);

    this.addEventListener("change", debouncedOnChange.bind(this));
  }

  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(
      PUB_SUB_EVENTS.cartUpdate,
      (event) => {
        if (event.source === "cart-items") {
          return;
        }
        return this.onCartUpdate();
      }
    );
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute("value");
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;
    let message = "";

    if (inputValue < event.target.dataset.min) {
      message = window.quickOrderListStrings.min_error.replace(
        "[min]",
        event.target.dataset.min
      );
    } else if (inputValue > parseInt(event.target.max)) {
      message = window.quickOrderListStrings.max_error.replace(
        "[max]",
        event.target.max
      );
    } else if (inputValue % parseInt(event.target.step) !== 0) {
      message = window.quickOrderListStrings.step_error.replace(
        "[step]",
        event.target.step
      );
    }

    if (message) {
      this.setValidity(event, index, message);
    } else {
      event.target.setCustomValidity("");
      event.target.reportValidity();
      this.updateQuantity(
        index,
        inputValue,
        event,
        document.activeElement.getAttribute("name"),
        event.target.dataset.quantityVariantId
      );
    }
  }

  onChange(event) {
    this.validateQuantity(event);
  }

  onCartUpdate() {
    if (this.tagName === "CART-DRAWER-ITEMS") {
      return fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(
            responseText,
            "text/html"
          );
          const selectors = ["cart-drawer-items", ".cart-drawer__footer"];
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          }
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      return fetch(`${routes.cart_url}?section_id=main-cart-items`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(
            responseText,
            "text/html"
          );
          const sourceQty = html.querySelector("cart-items");
          this.innerHTML = sourceQty.innerHTML;
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  getSectionsToRender() {
    return [
      {
        id: "Cart",
        section: "cart-main",
        selector: ".cart-content",
      },
      {
        id: "cart-icon-bubble",
        section: "cart-icon-bubble",
        selector: ".shopify-section",
      },
      {
        id: "cart-live-region-text",
        section: "cart-live-region-text",
        selector: ".shopify-section",
      },
    ];
  }

  updateQuantity(line, quantity, event, name, variantId) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });
    const eventTarget =
      event.currentTarget instanceof CartRemoveButton ? "clear" : "change";

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);

        CartPerformance.measure(
          `${eventTarget}:paint-updated-sections"`,
          () => {
            const quantityElement =
              document.getElementById(`Quantity-${line}`) ||
              document.getElementById(`Drawer-quantity-${line}`);
            const items = document.querySelectorAll(".cart-item");

            if (parsedState.errors) {
              quantityElement.value = quantityElement.getAttribute("value");
              this.updateLiveRegions(line, parsedState.errors);
              return;
            }

            this.classList.toggle("is-empty", parsedState.item_count === 0);
            const cartDrawerWrapper = document.querySelector("cart-drawer");
            const cartFooter = document.getElementById("main-cart-footer");

            if (cartFooter)
              cartFooter.classList.toggle(
                "is-empty",
                parsedState.item_count === 0
              );
            if (cartDrawerWrapper)
              cartDrawerWrapper.classList.toggle(
                "is-empty",
                parsedState.item_count === 0
              );

            this.getSectionsToRender().forEach((section) => {
              const elementToReplace =
                document
                  .getElementById(section.id)
                  .querySelector(section.selector) ||
                document.getElementById(section.id);
              elementToReplace.innerHTML = this.getSectionInnerHTML(
                parsedState.sections[section.section],
                section.selector
              );
            });
            const updatedValue = parsedState.items[line - 1]
              ? parsedState.items[line - 1].quantity
              : undefined;
            let message = "";
            if (
              items.length === parsedState.items.length &&
              updatedValue !== parseInt(quantityElement.value)
            ) {
              if (typeof updatedValue === "undefined") {
                message = window.cartStrings.error;
              } else {
                message = window.cartStrings.quantityError.replace(
                  "[quantity]",
                  updatedValue
                );
              }
            }
            this.updateLiveRegions(line, message);

            const lineItem =
              document.getElementById(`CartItem-${line}`) ||
              document.getElementById(`CartDrawer-Item-${line}`);
            if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
              cartDrawerWrapper
                ? trapFocus(
                    cartDrawerWrapper,
                    lineItem.querySelector(`[name="${name}"]`)
                  )
                : lineItem.querySelector(`[name="${name}"]`).focus();
            } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
              trapFocus(
                cartDrawerWrapper.querySelector(".drawer__inner-empty"),
                cartDrawerWrapper.querySelector("a")
              );
            } else if (
              document.querySelector(".cart-item") &&
              cartDrawerWrapper
            ) {
              trapFocus(
                cartDrawerWrapper,
                document.querySelector(".cart-item__name")
              );
            }
          }
        );

        CartPerformance.measureFromEvent(`${eventTarget}:user-action`, event);

        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: "cart-items",
          cartData: parsedState,
          variantId: variantId,
        });
      })
      .catch(() => {
        this.querySelectorAll(".loading__spinner").forEach((overlay) =>
          overlay.classList.add("hidden")
        );
        const errors =
          document.getElementById("cart-errors") ||
          document.getElementById("CartDrawer-CartErrors");
        errors.textContent = window.cartStrings.error;
      })
      .finally(() => {
        this.disableLoading(line);
      });
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) ||
      document.getElementById(`CartDrawer-LineItemError-${line}`);
    if (lineItemError)
      lineItemError.querySelector(".cart-item__error-text").textContent =
        message;

    this.lineItemStatusElement.setAttribute("aria-hidden", true);

    const cartStatus =
      document.getElementById("cart-live-region-text") ||
      document.getElementById("CartDrawer-LiveRegionText");
    cartStatus.setAttribute("aria-hidden", false);

    setTimeout(() => {
      cartStatus.setAttribute("aria-hidden", true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    const mainCartItems =
      document.getElementById("main-cart-items") ||
      document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.add("cart__items--disabled");

    const cartItemElements = this.querySelectorAll(
      `#CartItem-${line} .loading__spinner`
    );
    const cartDrawerItemElements = this.querySelectorAll(
      `#CartDrawer-Item-${line} .loading__spinner`
    );

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) =>
      overlay.classList.remove("hidden")
    );

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute("aria-hidden", false);
  }

  disableLoading(line) {
    const mainCartItems =
      document.getElementById("main-cart-items") ||
      document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.remove("cart__items--disabled");

    const cartItemElements = this.querySelectorAll(
      `#CartItem-${line} .loading__spinner`
    );
    const cartDrawerItemElements = this.querySelectorAll(
      `#CartDrawer-Item-${line} .loading__spinner`
    );

    cartItemElements.forEach((overlay) => overlay.classList.add("hidden"));
    cartDrawerItemElements.forEach((overlay) =>
      overlay.classList.add("hidden")
    );
  }
}
customElements.define("cart-items", CartItems);

class CartNote extends HTMLElement {
  constructor() {
    super();

    this.addEventListener(
      "input",
      debounce((event) => {
        const body = JSON.stringify({ note: event.target.value });
        fetch(`${routes.cart_update_url}`, {
          ...fetchConfig(),
          ...{ body },
        }).then(() =>
          CartPerformance.measureFromEvent("note-update:user-action", event)
        );
      }, ON_CHANGE_DEBOUNCE_TIMER)
    );
  }
}
customElements.define("cart-note", CartNote);

class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener(
      "keyup",
      (evt) => evt.code === "Escape" && this.close()
    );
    this.querySelector("#CartDrawer-Overlay").addEventListener(
      "click",
      this.close.bind(this)
    );
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector("#cart-icon-bubble");
    if (!cartLink) return;

    cartLink.setAttribute("role", "button");
    cartLink.setAttribute("aria-haspopup", "dialog");
    cartLink.addEventListener("click", (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener("keydown", (event) => {
      if (event.code.toUpperCase() === "SPACE") {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(opener) {
    if (opener) this.setActiveElement(opener);
    this.openBy = opener;
    this.setAttribute("open", "");
    trapFocus(this, this.querySelector('[role="dialog"]'));
    document.body.classList.add("cart-drawer-opening", "overflow-hidden");
  }

  close() {
    removeTrapFocus(this.openBy);
    this.removeAttribute("open");
    document.body.classList.remove("cart-drawer-opening", "overflow-hidden");
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute("role", "button");
    cartDrawerNote.setAttribute("aria-expanded", "false");

    if (cartDrawerNote.nextElementSibling.getAttribute("id")) {
      cartDrawerNote.setAttribute(
        "aria-controls",
        cartDrawerNote.nextElementSibling.id
      );
    }

    cartDrawerNote.addEventListener("click", (event) => {
      event.currentTarget.setAttribute(
        "aria-expanded",
        !event.currentTarget.closest("details").hasAttribute("open")
      );
    });

    cartDrawerNote.parentElement.addEventListener("keyup", onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.querySelector(".drawer__inner").classList.contains("is-empty") &&
      this.querySelector(".drawer__inner").classList.remove("is-empty");
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);

      if (!sectionElement) return;
      sectionElement.innerHTML = this.getSectionInnerHTML(
        parsedState.sections[section.id],
        section.selector
      );
    });

    setTimeout(() => {
      this.querySelector("#CartDrawer-Overlay").addEventListener(
        "click",
        this.close.bind(this)
      );
      this.open();
    });
  }

  getSectionInnerHTML(html, selector = ".shopify-section") {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: "cart-drawer",
        selector: "#CartDrawer",
      },
      {
        id: "cart-icon-bubble",
      },
    ];
  }

  getSectionDOM(html, selector = ".shopify-section") {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}
customElements.define("cart-drawer", CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: "CartDrawer",
        section: "cart-drawer",
        selector: ".drawer__inner",
      },
      {
        id: "cart-icon-bubble",
        section: "cart-icon-bubble",
        selector: ".shopify-section",
      },
    ];
  }
}
customElements.define("cart-drawer-items", CartDrawerItems);


// Remove warranty product if its not paired with any Frame
function removeWarranty() {

  fetch('/cart.js').then((res) => {
      return res.json();
    }).then((data) => {
      items = data.items;
      const warrantyInCart = items.find((item) => item.title == "Warranty" && !item.properties["Paired With"]);
      const cartItems =
                  document.querySelector("cart-items") || document.querySelector("cart-drawer-items");
      if (warrantyInCart) {
        const warrantyElement = document.querySelector(`[data-cart-item-key="${warrantyInCart.key}"]`);
        const line = warrantyElement.dataset.cartIndex
        cartItems.updateQuantity(line, 0, warrantyInCart.id.toString());
      }
  });
}

removeWarranty();

(function () {
  const form = document.querySelector('form[action*="/cart/add"]');
  if (!form) return;

  const idInput = form.querySelector('[name="id"]'); // variant id input
  const weightEl = document.querySelector('[data-variant-weight]'); // your target element

  // grab the JSON for weights (dynamic product id instead of hardcoding)
  const weightsEl = document.querySelector('[id^="VariantWeights-"]');
  if (!weightsEl || !weightEl) return;

  const weights = JSON.parse(weightsEl.textContent || "{}");

  function render(variantId) {
    const grams = weights[variantId];
    if (grams) {
      weightEl.textContent = `${grams} g`;
      weightEl.setAttribute("data-variant-weight", grams);
    } else {
      weightEl.textContent = '';
    }
  }

  // Initial render (page load)
  render(idInput.value);

  // Watch hidden variant id input changes
  const observer = new MutationObserver(() => render(idInput.value));
  observer.observe(idInput, { attributes: true, attributeFilter: ["value"] });

  // Also catch Shopify's built-in event if theme triggers it
  document.addEventListener("variant:change", (e) => {
    const id = e.detail?.variant?.id;
    if (id) render(String(id));
  });
})();
