const API = "https://advanced-gift-checkout-app-a7f4913968f6.herokuapp.com";
(async function () {
    const cart = useCart();
    if (await cart.hasAttribute("_connected")) {
        return; // already defined
    }
    await cart.addAttribute("_connected", "off");
    await cart.refresh()
    const cartToken = await cart.getToken();
    await cart.addAttribute("fielmann_connector", cartToken);
})();


if (!window.indexedDB) {
    console.warn("IndexedDB is not supported in this browser.");
}

async function loginInsurance(formData) {
    const cart = await useCart();
    const cartData = await cart.getCart();

    let dataStore = useDataStore("X9B2K7", "A7X9KD");

    if (await cart.isInsuranceConnected()) {
        const cartToken = await cart.getToken();
        return await dataStore.get(cartToken);
    }
    console.log("after ");
    if (!formData) return;
    console.log(formData, "Login Input");
    showLoader();
    return fetch(
        `${API}/api/insurance-login?lastname=${formData.lastname}&firstname=${formData.firstname}&dob=${formData.dob}&zip=${formData.zip}`
    )
        .then((response) => response.json())
        .then(async (response) => {
            hideLoader();
            await cart.addAttribute("_connected", "on");
            const cartToken = await cart.getToken();
            await dataStore.set(cartToken, response);
            return response;
        });
}

async function logoutInsurance() {
    let dataStore = useDataStore("X9B2K7", "A7X9KD");
    const cart = await useCart();
    const cartToken = await cart.getToken();
    await dataStore.remove(cartToken);
}

async function toggleInsurance() {
    let dataStore = useDataStore("X9B2K7", "A7X9KD");
    const cart = await useCart();
    const cartToken = await cart.getToken();
    await dataStore.remove(cartToken);
}

async function isInsuranceEnabled() {
    return true;
}

async function getBasicInfo() {
    const token = await useCart().getToken();
    const dataStore = useDataStore("X9B2K7", "A7X9KD");
    const raw = await dataStore.get(token);
    if (!raw) return null;

    try {
        const member = Array.isArray(raw) ? raw[0] : raw;

        return {
            firstName: member.firstName,
            lastName: member.lastName,
            dateOfBirth: member.dateOfBirth,
            gender: member.gender,
            memberID: member.memberID,
            insuranceCarrier: member.sourceSystem,
            insuranceCarrierSubSystem: member.sourceSubSystem,
            relationship: member.relationshipToSubscriber,
            plan: member.planCode,
            address: `${member.address1}, ${member.city}, ${member.stateCode} ${member.zipCode5}`,
        };
    } catch (e) {
        console.error("Error extracting basic info:", e);
        return null;
    }
}

async function calculateMoop(variantIdentifier) {
    const token = await useCart().getToken();
    const dataStore = useDataStore("X9B2K7", "A7X9KD");
    const raw = await dataStore.get(token);
    const member = Array.isArray(raw) ? raw[0] : raw;
    const moopMembers = member?.memberMoop;
    return moopMembers?.[variantIdentifier]?.moop ?? null;
}

async function applyInsurancePrice() {
    const token = await useCart().getToken();
    const dataStore = useDataStore("X9B2K7", "A7X9KD");
    const raw = await dataStore.get(token);
    const member = Array.isArray(raw) ? raw[0] : raw;
    const moopMembers = member?.memberMoop;
    return moopMembers?.[variantIdentifier]?.moop ?? null;
}

async function getBenefitSummary() {
    const token = await useCart().getToken();
    const dataStore = useDataStore("X9B2K7", "A7X9KD");
    const raw = await dataStore.get(token);
    const member = Array.isArray(raw) ? raw[0] : raw;
    const moopMembers = member?.memberMoop;
    return moopMembers?.["benefit_summary"] ?? null;
}

async function hideInsuranceInputIfHasSession() {
    let cart = useCart();
    if (await cart.isInsuranceConnected()) {
        getInsuranceWidget().classList.add("hide");
    } else {
        getInsuranceWidget().classList.remove("hide");
    }
}

function useDataStore(dbName = "MyDB", storeName = "myStore") {
    let dbPromise = null;

    const init = () => {
        if (dbPromise) return dbPromise;

        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);

            request.onerror = () => reject("Failed to open DB");

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: "key" });
                }
            };

            request.onsuccess = (e) => {
                resolve(e.target.result);
            };
        });

        return dbPromise;
    };

    const set = async (key, value) => {
        const db = await init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            const req = store.put({ key, value });

            req.onsuccess = () => resolve(true);
            req.onerror = () => reject("Set failed");
        });
    };

    const get = async (key) => {
        const db = await init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const req = store.get(key);

            req.onsuccess = () => resolve(req.result?.value ?? null);
            req.onerror = () => reject("Get failed");
        });
    };

    const remove = async (key) => {
        const db = await init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            const req = store.delete(key);

            req.onsuccess = () => resolve(true);
            req.onerror = () => reject("Remove failed");
        });
    };

    const has = async (key) => {
        const db = await init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const req = store.getKey(key);

            req.onsuccess = () => resolve(req.result !== undefined);
            req.onerror = () => reject("Has check failed");
        });
    };

    return { set, get, remove, has };
}

function renderData(response) {
    if (!response) {
        return;
    }
    let insuranceData = response[0];
    let firstname = insuranceData.firstName;
    let lastname = insuranceData.lastName;
    let address1 = insuranceData.address1;
    let sourceSystem = insuranceData.sourceSystem;
    document.querySelector("[insurance-firstname]").innerText = firstname;
    document.querySelector("[insurance-lastname]").innerText = lastname;
    document.querySelector("[insurance-address1]").innerText = address1;
    document
        .querySelector(".insurance-customer-basic-info")
        .classList.remove("hide");
}

function getInsuranceWidget() {
    return document.querySelector(".insurance-widget");
}

function updateBenefitSummary(insuranceData) {
    const benefitSummaryDiv = document.querySelector(".benefit-summary");
    const options = insuranceData[0].memberMoop.benefit_summary.frames.options;
    const concatenatedString = options
        .map(
            (option) =>
                `${option.title} ${option.price} - ${option.additional_savings}`
        )
        .join(" ");
    benefitSummaryDiv.innerHTML = concatenatedString;
}

function updatePDPPrice(insuranceData) {
    const element = document.querySelector("[price-variant-upc]");
    if (!element) return;
    const upcValue = element.getAttribute("price-variant-upc");
    if (!upcValue) return;
    let updatedPrice = insuranceData.memberMoop[upcValue].charge;
    console.log(upcValue, updatedPrice);
    document
        .querySelector(".price-item.price-item--regular")
        .classList.add("strike");
    document
        .querySelector(".insurance-price-item.price-item--regular")
        .classList.remove("hide");
    document.querySelector(
        ".insurance-price-item.price-item--regular"
    ).innerText = `$${updatedPrice}`;
}

function postInsuranceLogin(insuranceData) {
    hideInsuranceInputIfHasSession();
    renderData(insuranceData);
    // updatePDPPrice(insuranceData[0]);
    updateBenefitSummary(insuranceData);
}

const showLoader = () => {
    document.querySelector(".loader").classList.remove("hide");
};

const hideLoader = () => {
    document.querySelector(".loader").classList.add("hide");
};

function useCart() {
    let cart = null;

    const fetchCart = async () => {
        if (!cart) {
            const res = await fetch("/cart.js");
            cart = await res.json();
        }
        return cart;
    };

    const getCart = async () => {
        return await fetchCart();
    };

    const getToken = async () => {
        const cartData = await fetchCart();
        return cartData.token?.split("?")[0] ?? null;
    };

    const refresh = async () => {
        const res = await fetch("/cart.js");
        cart = await res.json();
        return cart;
    };

    const isInsuranceConnected = async () => {
        const cartData = await fetchCart();
        return cartData.attributes._connected == "on";
    };

    const hasAttribute = async (key) => {
        const cartData = await fetchCart();
        return cartData.attributes[key] !== undefined;
    };

    const addAttribute = async (key, value) => {
        return await fetch("/cart/update.js", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                attributes: {
                    [key]: value,
                },
            }),
        }).then((response) => response.json());
    };

    return {
        getCart,
        getToken,
        refresh, // optional: force re-fetch
        isInsuranceConnected,
        addAttribute,
        hasAttribute
    };
}
