// API Configuration
const API_KEY = '1ef9459f2e2041e9baa6a616d45bb6dd';
const BASE_URL = 'https://api.spoonacular.com';

// Utility functions for loading and error states
function showLoading() {
    const resultsDiv = document.getElementById('results');
    const loadingSpinner = document.querySelector('.loading');
    
    resultsDiv.innerHTML = '';
    loadingSpinner.style.display = 'block';
}

function hideLoading() {
    const loadingSpinner = document.querySelector('.loading');
    loadingSpinner.style.display = 'none';
}

function showError(message) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `<div class="error">${message}</div>`;
}

// Function to get detailed recipe information by ID
async function getRecipeInformation(recipeId, includeNutrition = true) {
    const url = `${BASE_URL}/recipes/${recipeId}/information?apiKey=${API_KEY}&includeNutrition=${includeNutrition}`;
    
    try {
        showLoading();
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const recipeData = await response.json();
        return recipeData;
    } catch (error) {
        console.error('Error fetching recipe information:', error);
        showError('Failed to load recipe details. Please try again.');
        throw error;
    } finally {
        hideLoading();
    }
}

// Function to search recipes with detailed information
async function searchRecipesWithDetails(query) {
    const searchUrl = `${BASE_URL}/recipes/complexSearch?apiKey=${API_KEY}&query=${encodeURIComponent(query)}&number=6&addRecipeInformation=true`;
    
    try {
        showLoading();
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error searching recipes:', error);
        showError('Failed to search recipes. Please try again.');
        return [];
    } finally {
        hideLoading();
    }
}

// Function to display detailed recipe information
function displayRecipeDetails(recipe) {
    const recipeDiv = document.createElement('div');
    recipeDiv.className = 'recipe';
    
    const nutrition = recipe.nutrition?.nutrients || [];
    const calories = nutrition.find(n => n.name === 'Calories')?.amount || 'N/A';
    const protein = nutrition.find(n => n.name === 'Protein')?.amount || 'N/A';
    const carbs = nutrition.find(n => n.name === 'Carbohydrates')?.amount || 'N/A';
    const fat = nutrition.find(n => n.name === 'Fat')?.amount || 'N/A';
    
    recipeDiv.innerHTML = `
        <h3>${recipe.title}</h3>
        ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}" loading="lazy">` : ''}
        <div class="recipe-info">
            <p><strong>Ready in:</strong> ${recipe.readyInMinutes || 'N/A'} minutes</p>
            <p><strong>Servings:</strong> ${recipe.servings || 'N/A'}</p>
            <p><strong>Health Score:</strong> ${recipe.healthScore || 'N/A'}/100</p>
        </div>
        <div class="nutrition-info">
            <p><strong>Calories:</strong> ${calories}${typeof calories === 'number' ? ' kcal' : ''}</p>
            <p><strong>Protein:</strong> ${protein}${typeof protein === 'number' ? 'g' : ''}</p>
            <p><strong>Carbs:</strong> ${carbs}${typeof carbs === 'number' ? 'g' : ''}</p>
            <p><strong>Fat:</strong> ${fat}${typeof fat === 'number' ? 'g' : ''}</p>
        </div>        
        <button onclick="showFullRecipe(${recipe.id})" class="view-recipe-btn">View Full Recipe</button>
    `;
    
    return recipeDiv;
}

// Display recipe results
function displayResults(recipes) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    
    if (recipes.length === 0) {
        resultsDiv.innerHTML = `<div class="no-results">No recipes found. Try a different search term.</div>`;
        return;
    }
    
    recipes.forEach(recipe => {
        const element = displayRecipeDetails(recipe);
        resultsDiv.appendChild(element);
    });
}

// Search function
async function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (!query) {
        showError('Please enter a search term');
        return;
    }
    
    try {
        const results = await searchRecipesWithDetails(query);
        displayResults(results);
    } catch (error) {
        console.error('Search failed:', error);
    }
}

// Function to show full recipe details in a modal
async function showFullRecipe(recipeId) {
    try {
        const fullRecipe = await getRecipeInformation(recipeId, true);
        
        let modal = document.getElementById('recipe-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'recipe-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="closeModal()">&times;</span>
                <h2>${fullRecipe.title}</h2>
                ${fullRecipe.image ? `<img src="${fullRecipe.image}" alt="${fullRecipe.title}">` : ''}
                
                <div class="recipe-details">
                    <h3>Ingredients:</h3>
                    <ul class="ingredients-list">
                        ${fullRecipe.extendedIngredients?.map(ingredient => 
                            `<li>${ingredient.original}</li>`
                        ).join('') || '<li>No ingredients available</li>'}
                    </ul>
                    
                    <h3>Instructions:</h3>
                    <div class="instructions">
                        ${fullRecipe.instructions || 'No instructions available'}
                    </div>
                    
                    ${fullRecipe.analyzedInstructions?.length ? 
                        `<div class="step-by-step">
                            <h4>Step-by-step:</h4>
                            <ol>
                                ${fullRecipe.analyzedInstructions[0].steps.map(step => 
                                    `<li>${step.step}</li>`
                                ).join('')}
                            </ol>
                        </div>` : ''
                    }
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error showing full recipe:', error);
    }
}

function closeModal() {
    const modal = document.getElementById('recipe-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    
    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('recipe-modal');
        if (event.target === modal) {
            closeModal();
        }
    });
});