import { useState, useEffect } from "react";

const MEAL_ICONS = { Breakfast: "🌅", Lunch: "☀️", Dinner: "🌙", Snack: "🍎" };

function MealCard({ meal, day, onSwap, onGetRecipe, onRecipeLoaded }) {
  const [recipe, setRecipe] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  useEffect(() => {
    setRecipe(null);
    onRecipeLoaded(meal.type, day, null);
  }, [meal.name]);

  async function handleGetRecipe() {
    if (recipe) {
      setRecipe(null);
      onRecipeLoaded(meal.type, day, null);
      return;
    }
    setLoadingRecipe(true);
    try {
      const r = await onGetRecipe(meal);
      setRecipe(r);
      onRecipeLoaded(meal.type, day, r);
    } catch {
      // silently fail
    } finally {
      setLoadingRecipe(false);
    }
  }

  function handleSwap() {
    setRecipe(null);
    onRecipeLoaded(meal.type, day, null);
    onSwap(meal.type, meal.name, day);
  }

  return (
    <div className="meal-card">
      <div className="meal-card-header">
        <div className="meal-label">
          <span className="meal-label-icon">{MEAL_ICONS[meal.type] || "🍽️"}</span>
          <span className="meal-label-text">{meal.type}</span>
        </div>
        <div className="meal-card-actions">
          <button className="btn btn-icon" onClick={handleSwap} disabled={meal.swapping} title="Swap this meal">
            {meal.swapping ? "⏳" : "↺"}
          </button>
          <button className="btn btn-icon" onClick={handleGetRecipe} disabled={loadingRecipe || meal.swapping} title={recipe ? "Hide recipe" : "Show recipe"}>
            {loadingRecipe ? "…" : "📋"}
          </button>
        </div>
      </div>

      <div className="meal-card-body">
        {meal.swapping ? (
          <div className="loading-container" style={{ padding: "20px 0" }}>
            <div className="loading-spinner" style={{ width: 28, height: 28, borderWidth: 2 }} />
            <p className="loading-text" style={{ marginTop: 10 }}>Finding a new meal…</p>
          </div>
        ) : (
          <>
            <h3 className="meal-name">{meal.name}</h3>
            <p className="meal-description">{meal.description}</p>
            <div className="meal-meta">
              {meal.calories && <span className="meal-calories">🔥 {meal.calories} kcal</span>}
              {meal.servingSize && <span className="meal-serving">🍽️ {meal.servingSize}</span>}
            </div>
          </>
        )}
      </div>

      {recipe && !meal.swapping && (
        <div className="recipe-panel">
          <h4 className="recipe-title">How to make it</h4>
          <div className="recipe-meta">
            {recipe.prepTime && <span className="recipe-meta-item">⏱ Prep: {recipe.prepTime}</span>}
            {recipe.cookTime && <span className="recipe-meta-item">🍳 Cook: {recipe.cookTime}</span>}
            {recipe.servings && <span className="recipe-meta-item">🍽️ Serves: {recipe.servings}</span>}
          </div>
          {recipe.ingredients?.length > 0 && (
            <>
              <p className="recipe-section-label">Ingredients</p>
              <ul className="recipe-ingredients">
                {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
              </ul>
            </>
          )}
          {recipe.steps?.length > 0 && (
            <>
              <p className="recipe-section-label">Steps</p>
              <ol className="recipe-steps">
                {recipe.steps.map((step, i) => {
                  const clean = step.replace(/^(step\s*\d+[:.]?\s*|\d+[.)]\s*)/i, "");
                  return (
                    <li key={i} className="recipe-step">
                      <span className="recipe-step-num">{i + 1}</span>
                      <span>{clean}</span>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function buildPDF(plan) {
  let html = `
    <html>
    <head>
      <title>Pantry to Plate — ${plan.type === "daily" ? "Daily" : "Weekly"} Meal Plan</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Georgia, serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 2rem; margin-bottom: 4px; color: #0a3d4a; }
        .subtitle { font-size: 0.9rem; color: #666; margin-bottom: 32px; }
        .day-header { font-size: 1.3rem; font-weight: bold; color: #0a3d4a; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #5BC8E8; }
        .meal { margin-bottom: 20px; padding: 16px; border: 1px solid #ddd; border-radius: 8px; page-break-inside: avoid; }
        .meal-type { font-size: 0.7rem; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; color: #5BC8E8; margin-bottom: 4px; }
        .meal-name { font-size: 1.1rem; font-weight: bold; color: #1a1a1a; margin-bottom: 4px; }
        .meal-desc { font-size: 0.88rem; color: #555; margin-bottom: 8px; line-height: 1.5; }
        .meal-meta { font-size: 0.78rem; color: #888; }
        .recipe { margin-top: 14px; padding-top: 14px; border-top: 1px dashed #ccc; }
        .recipe-title { font-size: 0.95rem; font-weight: bold; color: #0a3d4a; margin-bottom: 8px; }
        .recipe-meta-row { font-size: 0.78rem; color: #5BC8E8; margin-bottom: 10px; }
        .section-label { font-size: 0.68rem; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; color: #aaa; margin: 10px 0 6px; }
        ul { padding-left: 16px; }
        ul li { font-size: 0.85rem; color: #444; margin-bottom: 3px; line-height: 1.5; }
        ol { list-style: none; padding: 0; }
        ol li { font-size: 0.85rem; color: #444; margin-bottom: 8px; line-height: 1.5; display: flex; gap: 10px; align-items: flex-start; }
        .step-num { background: #5BC8E8; color: #fff; border-radius: 50%; min-width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: bold; flex-shrink: 0; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>Pantry to Plate</h1>
      <p class="subtitle">${plan.type === "daily" ? "Daily Meal Plan" : "Weekly Meal Plan"} — Generated just for you</p>
  `;

  function renderMeals(meals) {
    return meals.map(m => {
      let mealHtml = `
        <div class="meal">
          <div class="meal-type">${m.type}</div>
          <div class="meal-name">${m.name}</div>
          <div class="meal-desc">${m.description}</div>
          <div class="meal-meta">🔥 ${m.calories || ""} kcal &nbsp;|&nbsp; 🍽️ ${m.servingSize || ""}</div>
      `;
      if (m.recipe) {
        mealHtml += `<div class="recipe">
          <div class="recipe-title">How to make it</div>
          <div class="recipe-meta-row">
            ${m.recipe.prepTime ? `⏱ Prep: ${m.recipe.prepTime} &nbsp;` : ""}
            ${m.recipe.cookTime ? `🍳 Cook: ${m.recipe.cookTime} &nbsp;` : ""}
            ${m.recipe.servings ? `🍽️ Serves: ${m.recipe.servings}` : ""}
          </div>`;
        if (m.recipe.ingredients?.length) {
          mealHtml += `<div class="section-label">Ingredients</div><ul>`;
          m.recipe.ingredients.forEach(ing => { mealHtml += `<li>${ing}</li>`; });
          mealHtml += `</ul>`;
        }
        if (m.recipe.steps?.length) {
          mealHtml += `<div class="section-label">Steps</div><ol>`;
          m.recipe.steps.forEach((step, i) => {
            const clean = step.replace(/^(step\s*\d+[:.]?\s*|\d+[.)]\s*)/i, "");
            mealHtml += `<li><span class="step-num">${i + 1}</span><span>${clean}</span></li>`;
          });
          mealHtml += `</ol>`;
        }
        mealHtml += `</div>`;
      }
      mealHtml += `</div>`;
      return mealHtml;
    }).join("");
  }

  if (plan.type === "daily") {
    html += renderMeals(plan.meals);
  } else {
    plan.days.forEach(({ day, meals }) => {
      html += `<div class="day-header">📅 ${day}</div>`;
      html += renderMeals(meals);
    });
  }

  html += `</body></html>`;
  return html;
}

export default function MealPlan({ plan, onSwap, onGetRecipe }) {
  const [recipes, setRecipes] = useState({});
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  function handleRecipeLoaded(mealType, day, recipe) {
    const key = day ? `${day}-${mealType}` : mealType;
    setRecipes(prev => ({ ...prev, [key]: recipe }));
  }

  function getPlanWithRecipes() {
    if (plan.type === "daily") {
      return {
        ...plan,
        meals: plan.meals.map(m => ({
          ...m,
          recipe: recipes[m.type] || null
        }))
      };
    } else {
      return {
        ...plan,
        days: plan.days.map(d => ({
          ...d,
          meals: d.meals.map(m => ({
            ...m,
            recipe: recipes[`${d.day}-${m.type}`] || null
          }))
        }))
      };
    }
  }

  async function loadAllRecipes() {
    setLoadingAll(true);
    setLoadingProgress(0);

    const allMeals = [];
    if (plan.type === "daily") {
      plan.meals.forEach(m => allMeals.push({ meal: m, day: null }));
    } else {
      plan.days.forEach(({ day, meals }) => {
        meals.forEach(m => allMeals.push({ meal: m, day }));
      });
    }

    let completed = 0;

    await Promise.all(allMeals.map(async ({ meal, day }) => {
      const key = day ? `${day}-${meal.type}` : meal.type;
      if (!recipes[key]) {
        try {
          const r = await onGetRecipe(meal);
          setRecipes(prev => ({ ...prev, [key]: r }));
        } catch {
          // skip failed ones
        }
      }
      completed++;
      setLoadingProgress(Math.round((completed / allMeals.length) * 100));
    }));

    setLoadingAll(false);
  }

  function handleSavePDF() {
    const planWithRecipes = getPlanWithRecipes();
    const html = buildPDF(planWithRecipes);
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  }

  const totalMeals = plan.type === "daily"
    ? plan.meals.length
    : plan.days.reduce((sum, d) => sum + d.meals.length, 0);
  const loadedCount = Object.values(recipes).filter(Boolean).length;
  const allLoaded = loadedCount >= totalMeals;

  if (plan.type === "daily") {
    const totalCalories = plan.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    return (
      <div className="meal-plan">
        <h2 className="meal-plan-heading">Your Daily Meal Plan</h2>
        <p className="meal-plan-subheading">~{totalCalories.toLocaleString()} calories total</p>
        {plan.meals.map(meal => (
          <MealCard
            key={meal.type}
            meal={meal}
            day={null}
            onSwap={onSwap}
            onGetRecipe={onGetRecipe}
            onRecipeLoaded={handleRecipeLoaded}
          />
        ))}
        <div className="share-section">
          {!allLoaded ? (
            <button className="btn-share btn-open-all" onClick={loadAllRecipes} disabled={loadingAll}>
              {loadingAll ? `⏳ Loading recipes… ${loadingProgress}%` : "📋 Open All Recipes"}
            </button>
          ) : (
            <p className="share-label" style={{ color: "var(--accent)" }}>✅ All recipes loaded!</p>
          )}
          <button className="btn-share" onClick={handleSavePDF}>📄 Save as PDF</button>
        </div>
      </div>
    );
  }

  return (
    <div className="meal-plan">
      <h2 className="meal-plan-heading">Your Weekly Meal Plan</h2>
      <p className="meal-plan-subheading">7 days of meals planned just for you</p>
      {plan.days.map(({ day, meals }) => (
        <div key={day}>
          <div className="week-day-header">📅 {day}</div>
          {meals.map(meal => (
            <MealCard
              key={`${day}-${meal.type}`}
              meal={meal}
              day={day}
              onSwap={onSwap}
              onGetRecipe={onGetRecipe}
              onRecipeLoaded={handleRecipeLoaded}
            />
          ))}
        </div>
      ))}
      <div className="share-section">
        {!allLoaded ? (
          <button className="btn-share btn-open-all" onClick={loadAllRecipes} disabled={loadingAll}>
            {loadingAll ? `⏳ Loading recipes… ${loadingProgress}%` : "📋 Open All Recipes"}
          </button>
        ) : (
          <p className="share-label" style={{ color: "var(--accent)" }}>✅ All recipes loaded!</p>
        )}
        <button className="btn-share" onClick={handleSavePDF}>📄 Save as PDF</button>
      </div>
    </div>
  );
}