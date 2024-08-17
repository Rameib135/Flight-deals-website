// RAME IBRAHEM AND ALI KHATIB
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const registerLink = document.getElementById('registerLink');
    const logoutButton = document.getElementById('logoutButton');
    const deals = document.querySelectorAll('.deal');
    const dropZone = document.getElementById('dropZone');
    const successMessage = document.getElementById('successMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();
            if (result.success) {
                document.cookie = `token=${result.token}; path=/; max-age=${24 * 60 * 60}`;
                window.location.href = '/main.html';
            } else {
                alert('Invalid username or password');
            }
        });

        registerLink.addEventListener('click', async () => {
            const username = prompt('Enter username:');
            const password = prompt('Enter password:');
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();
            if (result.success) {
                alert('Registered successfully');
            } else {
                alert('User already exists');
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            document.cookie = 'token=; Max-Age=0; path=/';
            window.location.href = '/index.html';
        });
    }

    if (window.location.pathname.includes('main.html')) {
        checkAuth();
    }

    if (deals.length > 0) {
        deals.forEach(deal => {
            deal.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text', JSON.stringify({
                    text: e.target.querySelector('.deal-info').textContent,
                    imgSrc: e.target.querySelector('img').src
                }));
            });

            const addToFavoritesButton = deal.querySelector('.add-to-favorites');
            addToFavoritesButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const data = {
                    text: deal.querySelector('.deal-info').textContent,
                    imgSrc: deal.querySelector('img').src
                };
                addDealToFavorites(data);
            });

            deal.addEventListener('click', (e) => {
                const dealId = deal.getAttribute('data-id');
                window.location.href = `deal-details.html?deal=${dealId}`;
            });
        });
    }

    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const data = JSON.parse(e.dataTransfer.getData('text'));
            await addDealToFavorites(data);
        });
    }

    if (window.location.pathname.includes('deal-details.html')) {
        const dealId = getQueryParameter('deal');
        console.log('Deal ID from URL:', dealId); // Debugging line
        if (dealId) {
            loadDealDetails(dealId);
        } else {
            document.getElementById('deal-info').innerHTML = `<p>No deal specified.</p>`;
        }
    }
});

async function addDealToFavorites(data) {
    const favoritesContainer = document.getElementById('favorites');

    // Fetch existing favorites
    const response = await fetch('/favorites');
    const result = await response.json();

    // Check if the deal already exists in favorites
    const exists = result.favorites.some(fav => fav.text === data.text);

    if (exists) {
        alert('This deal is already in your favorites.');
        return;
    }

    result.favorites.push(data);

    await fetch('/favorites', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ favorites: result.favorites })
    });

    const div = document.createElement('div');
    div.classList.add('favorite');
    div.innerHTML = `
        <img src="${data.imgSrc}" alt="Favorite">
        <p>${data.text}</p>
    `;
    favoritesContainer.appendChild(div);

    showSuccessMessage();
}

function showSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'block';
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

function getQueryParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get(name);
    console.log(`Query parameter "${name}":`, param); // Debugging line
    return param;
}


async function loadDealDetails(dealId) {
    try {
        const response = await fetch('deals.json');
        const deals = await response.json();
        console.log('Deals loaded:', deals); // Debugging line

        const deal = deals.find(d => d.id === parseInt(dealId));
        console.log('Deal found:', deal); // Debugging line
        if (deal) {
            document.getElementById('deal-title').textContent = deal.title;
            document.getElementById('deal-image').src = deal.image;
            document.getElementById('deal-info').innerHTML = `
                <h2>Location: ${deal.location}</h2>
                <p><strong>Duration:</strong> ${deal.duration}</p>
                <p><strong>Price:</strong> ${deal.price}</p>
                <p><strong>Participants:</strong> ${deal.participants}</p>
                <p><strong>Inclusions:</strong> ${deal.inclusions}</p>
                <p>${deal.description}</p>
            `;
        } else {
            document.getElementById('deal-info').innerHTML = `<p>Deal not found.</p>`;
        }
    } catch (error) {
        console.error('Error loading deal details:', error);
        document.getElementById('deal-info').innerHTML = `<p>Error loading deal details.</p>`;
    }
}


function checkAuth() {
    const token = getCookie('token');
    if (!token) {
        window.location.href = '/login.html';
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
