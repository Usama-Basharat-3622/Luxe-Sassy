document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-button');
    const accordionItems = document.querySelectorAll('.accordion-item');
    const allButton = document.querySelector('.filter-button[data-filter="all"]');

    // Set default active for 'All' button and display all accordions
    allButton.classList.add('active');
    accordionItems.forEach(item => item.classList.add('active'));

    var acc = document.getElementsByClassName("accordion-title");
    for (let i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var panel = this.nextElementSibling;
            panel.style.transition = 'max-height 0.4s ease';
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');

            accordionItems.forEach(item => {
                const accordionTitle = item.querySelector('.accordion-title');
                accordionTitle.classList.remove('active');
                var panel = accordionTitle.nextElementSibling;
                panel.style.transition = 'none';
                panel.style.maxHeight = null;
            });

            filterButtons.forEach(btn => btn.classList.remove('active'));

            this.classList.add('active');

            if (filter === 'all') {
                accordionItems.forEach(item => {
                    item.style.display = 'block'; // Show all accordions
                });
            } else {
                accordionItems.forEach(item => {
                    if (item.getAttribute('data-tag').toLowerCase() === filter.toLowerCase()) {
                        item.style.display = 'block'; // Show matching accordions
                    } else {
                        item.style.display = 'none'; // Hide non-matching accordions
                    }
                });
            }
        });
    });
});


// Function to open accordion when Enter is pressed
function openAccordion(event, element) {
    if (event.key === 'Enter') {
        element.click();
    }
}



