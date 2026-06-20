import { useState } from "react";

const MEAL_ICONS = { fridge: "🥗", frozen: "🧊", pantry: "🏠" };
const CATEGORY_LABELS = { fridge: "Fridge", frozen: "Freezer", pantry: "Pantry" };

const PRIMARY_ITEMS = {
  fridge: [
    "Apples", "Bacon", "Bell peppers", "Butter", "Carrots", "Celery",
    "Cream cheese", "Cucumbers", "Deli chicken breast", "Deli ham", "Deli turkey",
    "Eggs", "Garlic", "Grapes", "Hot dogs", "Leftover cooked chicken",
    "Lemons", "Lettuce", "Liquid egg whites", "Limes", "Milk", "Onions",
    "Potatoes", "Shredded cheese", "Sliced cheese", "Sour cream",
    "Tomatoes", "Yogurt",
  ],
  frozen: [
    "Bacon", "Blueberries", "Broccoli", "Chicken breasts", "Chicken legs",
    "Chicken thighs", "Chicken wings", "Corn", "Diced onions", "Fish fillets",
    "Green beans", "Ground beef", "Ground turkey", "Hamburger patties",
    "Mango chunks", "Mixed berries", "Mixed vegetables", "Peas",
    "Pineapple chunks", "Pork chops", "Pork loin", "Sausage", "Shrimp",
    "Stir-fry vegetable mix", "Strawberries",
  ],
  pantry: [
    "All-purpose flour", "Apple cider vinegar", "Baking powder", "Baking soda",
    "BBQ sauce", "Beef broth", "Black beans", "Bread crumbs", "Brown rice",
    "Brown sugar", "Chicken broth", "Corn", "Cornstarch", "Crackers",
    "Diced tomatoes", "Elbow noodles", "Fettuccine", "Green beans",
    "Hot sauce", "Ketchup", "Kidney beans", "Mayonnaise", "Mustard",
    "Oatmeal", "Olive oil", "Other pasta", "Penne", "Soy sauce",
    "Spaghetti", "Splenda", "Sugar substitute", "Tomato paste",
    "Tomato sauce", "Tuna", "Vanilla extract", "Vegetable broth",
    "Vegetable oil", "White rice", "White sugar", "White vinegar",
  ],
};

const OTHER_ITEMS = {
  fridge: [
    "Bacon (frozen, thawed)", "Blueberries", "Broccoli (thawed)",
    "Chicken breasts (thawed)", "Chicken legs (thawed)", "Chicken thighs (thawed)",
    "Chicken wings (thawed)", "Corn (thawed)", "Diced onions (thawed)",
    "Fish fillets (thawed)", "Green beans (thawed)", "Ground beef (thawed)",
    "Ground turkey (thawed)", "Hamburger patties (thawed)", "Mango chunks (thawed)",
    "Mixed berries (thawed)", "Mixed vegetables (thawed)", "Peas (thawed)",
    "Pineapple chunks (thawed)", "Pork chops (thawed)", "Pork loin (thawed)",
    "Sausage (thawed)", "Shrimp (thawed)", "Stir-fry vegetable mix (thawed)",
    "Strawberries (thawed)",
    "All-purpose flour", "Apple cider vinegar", "Baking powder", "Baking soda",
    "BBQ sauce", "Beef broth", "Black beans", "Bread crumbs", "Brown rice",
    "Brown sugar", "Chicken broth", "Cornstarch", "Crackers", "Diced tomatoes",
    "Elbow noodles", "Fettuccine", "Hot sauce", "Ketchup", "Kidney beans",
    "Mayonnaise", "Mustard", "Oatmeal", "Olive oil", "Other pasta", "Penne",
    "Soy sauce", "Spaghetti", "Splenda", "Sugar substitute", "Tomato paste",
    "Tomato sauce", "Tuna", "Vanilla extract", "Vegetable broth",
    "Vegetable oil", "White rice", "White sugar", "White vinegar",
  ].sort(),
  frozen: [
    "Apples", "Bell peppers", "Butter", "Carrots", "Celery", "Cream cheese",
    "Cucumbers", "Deli chicken breast", "Deli ham", "Deli turkey", "Eggs",
    "Garlic", "Grapes", "Hot dogs", "Leftover cooked chicken", "Lemons",
    "Lettuce", "Liquid egg whites", "Limes", "Milk", "Onions", "Potatoes",
    "Shredded cheese", "Sliced cheese", "Sour cream", "Tomatoes", "Yogurt",
    "All-purpose flour", "Apple cider vinegar", "Baking powder", "Baking soda",
    "BBQ sauce", "Beef broth", "Black beans", "Bread crumbs", "Brown rice",
    "Brown sugar", "Chicken broth", "Cornstarch", "Crackers", "Diced tomatoes",
    "Elbow noodles", "Fettuccine", "Hot sauce", "Ketchup", "Kidney beans",
    "Mayonnaise", "Mustard", "Oatmeal", "Olive oil", "Other pasta", "Penne",
    "Soy sauce", "Spaghetti", "Splenda", "Sugar substitute", "Tomato paste",
    "Tomato sauce", "Tuna", "Vanilla extract", "Vegetable broth",
    "Vegetable oil", "White rice", "White sugar", "White vinegar",
  ].sort(),
  pantry: [
    "Apples", "Bacon", "Bell peppers", "Butter", "Carrots", "Celery",
    "Cream cheese", "Cucumbers", "Deli chicken breast", "Deli ham", "Deli turkey",
    "Eggs", "Garlic", "Grapes", "Hot dogs", "Leftover cooked chicken", "Lemons",
    "Lettuce", "Liquid egg whites", "Limes", "Milk", "Onions", "Potatoes",
    "Shredded cheese", "Sliced cheese", "Sour cream", "Tomatoes", "Yogurt",
    "Blueberries", "Broccoli", "Chicken breasts (thawed)", "Chicken legs (thawed)",
    "Chicken thighs (thawed)", "Chicken wings (thawed)", "Corn", "Diced onions",
    "Fish fillets (thawed)", "Green beans", "Ground beef (thawed)",
    "Ground turkey (thawed)", "Hamburger patties (thawed)", "Mango chunks",
    "Mixed berries", "Mixed vegetables", "Peas", "Pineapple chunks",
    "Pork chops (thawed)", "Pork loin (thawed)", "Sausage (thawed)",
    "Shrimp (thawed)", "Stir-fry vegetable mix", "Strawberries",
  ].sort(),
};

export default function PantryInput({ pantryItems = { fridge: [], frozen: [], pantry: [] }, setPantryItems }) {
  const [selected, setSelected] = useState({ fridge: "", frozen: "", pantry: "" });
  const [customText, setCustomText] = useState("");
  const [customCategory, setCustomCategory] = useState("fridge");

  function addFromDropdown(category, value) {
    if (!value || pantryItems[category].includes(value)) return;
    setPantryItems(prev => ({ ...prev, [category]: [...prev[category], value] }));
    setSelected(prev => ({ ...prev, [category]: "" }));
  }

  function addCustomItem() {
    const item = customText.trim();
    if (!item || pantryItems[customCategory].includes(item)) return;
    setPantryItems(prev => ({ ...prev, [customCategory]: [...prev[customCategory], item] }));
    setCustomText("");
  }

  function removeItem(category, item) {
    setPantryItems(prev => ({
      ...prev,
      [category]: prev[category].filter(i => i !== item),
    }));
  }

  function getAvailablePrimary(category) {
    return PRIMARY_ITEMS[category].filter(f => !pantryItems[category].includes(f));
  }

  function getAvailableOther(category) {
    return OTHER_ITEMS[category].filter(f => !pantryItems[category].includes(f));
  }

  return (
    <div className="pantry-section">
      {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
        <div key={category} className="pantry-category">
          <div className="category-header">
            <span className="category-badge">{MEAL_ICONS[category]} {label}</span>
          </div>

          {pantryItems[category].length > 0 && (
            <div className="chip-list">
              {pantryItems[category].map(item => (
                <span key={item} className="chip">
                  {item}
                  <button
                    className="chip-remove"
                    onClick={() => removeItem(category, item)}
                    aria-label={`Remove ${item}`}
                  >×</button>
                </span>
              ))}
            </div>
          )}

          <div className="pantry-add-row">
            <select
              className="pantry-select"
              value={selected[category]}
              onChange={e => addFromDropdown(category, e.target.value)}
            >
              <option value="">Pick from {label.toLowerCase()} list…</option>
              {getAvailablePrimary(category).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
              <option disabled>──────────────</option>
              {getAvailableOther(category).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {/* Single custom item row at the bottom */}
      <div className="custom-item-row">
        <select
          className="pantry-select custom-category-select"
          value={customCategory}
          onChange={e => setCustomCategory(e.target.value)}
        >
          <option value="fridge">🥗 Fridge</option>
          <option value="frozen">🧊 Freezer</option>
          <option value="pantry">🏠 Pantry</option>
        </select>
        <input
          className="pantry-custom-input"
          type="text"
          placeholder="Type a custom item…"
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") addCustomItem(); }}
        />
        <button
          className="btn btn-secondary"
          onClick={addCustomItem}
          disabled={!customText.trim()}
        >Add</button>
      </div>
    </div>
  );
}