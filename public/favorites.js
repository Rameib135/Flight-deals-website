document.addEventListener('DOMContentLoaded', function () {
    const deleteAllButton = document.getElementById('deleteAllButton');

    loadFavorites();

    deleteAllButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete all favorites?')) {
            await fetch('/favorites', {
                method: 'DELETE'
            });
            document.getElementById('favorites').innerHTML = '';
        }
    });
});

async function loadFavorites() {
    try {
        const response = await fetch('/favorites');
        const result = await response.json();
        const favoritesContainer = document.getElementById('favorites');

        result.favorites.forEach(data => {
            const div = document.createElement('div');
            div.classList.add('favorite');
            div.innerHTML = `
                <img src="${data.imgSrc}" alt="Favorite">
                <p>${data.text}</p>
                <button onclick="buyDeal()">Buy</button>
                <button onclick="removeDeal(this, '${data.text}')">Remove</button>
            `;
            div.querySelector('img').addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = `deal-details.html?deal=${data.id}`;
            });
            div.querySelector('p').addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = `deal-details.html?deal=${data.id}`;
            });

            favoritesContainer.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

async function removeDeal(button, text) {
    const deal = button.parentElement;
    const favoritesContainer = document.getElementById('favorites');
    favoritesContainer.removeChild(deal);

    const response = await fetch('/favorites');
    const result = await response.json();
    const updatedFavorites = result.favorites.filter(fav => fav.text !== text);

    await fetch('/favorites', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ favorites: updatedFavorites })
    });

    console.log('Removed deal from favorites:', text); // Debugging line
}

function buyDeal() {
    alert('Deal purchased!');
    console.log('Deal purchased'); // Debugging line
}
