const selectors = {
  customerAddresses: '[data-customer-addresses]',
  addressCountrySelect: '[data-address-country-select]',
  addressContainer: '[data-address]',
  toggleAddressButton: 'button[aria-expanded]',
  cancelAddressButton: 'button[type="reset"]',
  deleteAddressButton: 'button[data-confirm-message]',
  editAddressButton: '[data-edit-address-button]', 
  cancelEditAddressButton: '[data-cancel-edit-address-button]'
};

const attributes = {
  expanded: 'aria-expanded',
  confirmMessage: 'data-confirm-message',
};

class CustomerAddresses {
  constructor() {
    this.elements = this._getElements();
    if (Object.keys(this.elements).length === 0) return;
    this._setupCountries();
    this._setupEventListeners();
    this._setupCancelEditAddressButton();
    this.previouslyFocusedElement = null;
  }

  _setupCancelEditAddressButton() {
    const cancelEditAddressButtons = document.querySelectorAll(selectors.cancelEditAddressButton);
    cancelEditAddressButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const editAddressFormContainer = document.querySelector(`.address-edit-form.active`);
        editAddressFormContainer?.classList.remove('active');
        if (this.previouslyFocusedElement) {
          this.previouslyFocusedElement.focus();
        }
      });
    });
  }

  _getElements() {
    const container = document.querySelector(selectors.customerAddresses);
    return container
      ? {
          container,
          addressContainer: container.querySelector(selectors.addressContainer),
          toggleButtons: document.querySelectorAll(selectors.toggleAddressButton),
          cancelButtons: container.querySelectorAll(selectors.cancelAddressButton),
          deleteButtons: container.querySelectorAll(selectors.deleteAddressButton),
          countrySelects: container.querySelectorAll(selectors.addressCountrySelect),
          editButtons: container.querySelectorAll(selectors.editAddressButton),
        }
      : {};
  }

  _setupCountries() {
    // if (Shopify && Shopify.CountryProvinceSelector) {
    //   // eslint-disable-next-line no-new
    //   new Shopify.CountryProvinceSelector('AddressCountryNew', 'AddressProvinceNew', {
    //     hideElement: 'AddressProvinceContainerNew',
    //   });
    //   this.elements.countrySelects.forEach((select) => {
    //     const formId = select.dataset.formId;
    //     // eslint-disable-next-line no-new
    //     new Shopify.CountryProvinceSelector(`AddressCountry_${formId}`, `AddressProvince_${formId}`, {
    //       hideElement: `AddressProvinceContainer_${formId}`,
    //     });
    //   });
    // }
  }

  _setupEventListeners() {
    this.elements.toggleButtons.forEach((element) => {
      element.addEventListener('click', this._handleAddEditButtonClick);
    });
    this.elements.cancelButtons.forEach((element) => {
      element.addEventListener('click', this._handleCancelButtonClick);
    });
    this.elements.deleteButtons.forEach((element) => {
      element.addEventListener('click', this._handleDeleteButtonClick);
    });
    this.elements.editButtons.forEach((element) => {
      element.addEventListener('click', this.handleEditButtonClick.bind(this));
    });
  }

  _toggleExpanded(target) {
    target?.setAttribute(attributes.expanded, (target?.getAttribute(attributes.expanded) === 'false').toString());
  }

  _handleAddEditButtonClick = ({ currentTarget }) => {
    this._toggleExpanded(currentTarget);
  };

  _handleCancelButtonClick = ({ currentTarget }) => {
    this._toggleExpanded(currentTarget?.closest(selectors.addressContainer)?.querySelector(`[${attributes.expanded}]`));
  };

  _handleDeleteButtonClick = ({ currentTarget }) => {
    const confirmationModal = document.querySelector('.modal.delete-address-modal');
    const body = document.querySelector('body');
    const previouslyFocusedElement = document.activeElement; 

    confirmationModal?.classList.add('open');
    body?.classList.add('overflow-hidden');

    trapFocus(confirmationModal, confirmationModal.querySelector('.close'));

    const closeButton = confirmationModal.querySelector('.close');
    closeButton?.addEventListener('click', () => {
      confirmationModal?.classList.remove('open');
      body?.classList.remove('overflow-hidden');

      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
      }
    });

    const confirmDeleteButton = confirmationModal.querySelector('.confirm-delete');
    confirmDeleteButton?.addEventListener('click', () => {
      Shopify.postLink(currentTarget.dataset.target, {
        parameters: { _method: 'delete' },
      });
      confirmationModal?.classList.remove('open');
      body?.classList.remove('overflow-hidden');

      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
      }
    });
  };

  handleEditButtonClick(event) {
    const addressId = event.currentTarget.getAttribute('data-address-id');    
    const editAddressFormContainer = document.querySelector(`.customer-addresses-forms-list`); 
    
    editAddressFormContainer.querySelector('.address-edit-form.active')?.classList.remove('active');
    
    const editAddressForm = document.querySelector(`#EditAddress_${addressId}`);
    this.previouslyFocusedElement = document.activeElement; 
    
    editAddressForm.classList.add("active");

    const cancelButton = editAddressForm.querySelector(selectors.cancelEditAddressButton);

    const formContainer = editAddressForm;
    formContainer.querySelector('.cancel-button-edit-form.hidden').remove();

    if (cancelButton && formContainer) {
      trapFocus(formContainer , cancelButton);
    } 
  }
}