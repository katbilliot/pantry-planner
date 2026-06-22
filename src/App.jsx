import { useState } from "react";
import PantryInput from "./components/PantryInput";
import MealPlan from "./components/MealPlan";
import "./App.css";

const HEADERS = {
  "Content-Type": "application/json",
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

async function callClaude(body) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  return response.json();
}

export default function App() {
  const [pantryItems, setPantryItems] = useState({ fridge: [], frozen: [], pantry: [] });
  const [calories, setCalories] = useState("");
  const [planType, setPlanType] = useState("daily");
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dismissedMeals, setDismissedMeals] = useState([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const allItems = [
    ...pantryItems.fridge.map(i => `${i} (fridge)`),
    ...pantryItems.frozen.map(i => `${i} (frozen)`),
    ...pantryItems.pantry.map(i => `${i} (pantry)`),
  ];

  function handleReset() {
    setPantryItems({ fridge: [], frozen: [], pantry: [] });
    setCalories("");
    setPlanType("daily");
    setMealPlan(null);
    setError(null);
    setDismissedMeals([]);
    setShowResetConfirm(false);
  }

  async function generateMealPlan() {
    setLoading(true);
    setError(null);
    setDismissedMeals([]);
    setMealPlan(null);

    try {
      if (planType === "daily") {
        const prompt = `You are a helpful meal planning assistant. Create a meal plan for one day using these available ingredients: ${allItems.join(", ")}.
Daily calorie goal: ${calories} calories.
Please create exactly 4 meals: Breakfast, Lunch, Dinner, and Snack.
For each meal, calories should reflect ONE serving size. Always include a realistic serving size.
Respond ONLY with a JSON object in this exact format (no markdown, no extra text):
{
  "meals": [
    {"type":"Breakfast","name":"Meal name here","description":"Brief 1-2 sentence description","calories":400,"servingSize":"1 bowl"},
    {"type":"Lunch","name":"Meal name here","description":"Brief 1-2 sentence description","calories":600,"servingSize":"1 plate"},
    {"type":"Dinner","name":"Meal name here","description":"Brief 1-2 sentence description","calories":700,"servingSize":"1 serving"},
    {"type":"Snack","name":"Meal name here","description":"Brief 1-2 sentence description","calories":300,"servingSize":"1 cup"}
  ]
}`;
        const data = await callClaude({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] });
        const clean = data.content[0].text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        setMealPlan({ type: "daily", meals: parsed.meals });

      } else {
        const usedMeals = [];
        const results = [];

        for (const day of DAYS) {
          const avoidList = usedMeals.length > 0
            ? `\nDo NOT repeat any of these meals already used this week: ${usedMeals.join(", ")}.`
            : "";

          const prompt = `Create a meal plan for ${day} using these ingredients: ${allItems.join(", ")}.
Daily calorie goal: ${calories} calories.
Create exactly 4 meals: Breakfast, Lunch, Dinner, Snack.
Every meal must be DIFFERENT from all other days.${avoidList}
For each meal, calories should reflect ONE serving size. Always include a realistic serving size.
Respond ONLY with a JSON array (no markdown, no extra text):
[
  {"type":"Breakfast","name":"Meal name","description":"Brief description","calories":400,"servingSize":"1 bowl"},
  {"type":"Lunch","name":"Meal name","description":"Brief description","calories":600,"servingSize":"1 plate"},
  {"type":"Dinner","name":"Meal name","description":"Brief description","calories":700,"servingSize":"1 serving"},
  {"type":"Snack","name":"Meal name","description":"Brief description","calories":300,"servingSize":"1 cup"}
]`;

          const data = await callClaude({ model: "claude-sonnet-4-6", max_tokens: 600, messages: [{ role: "user", content: prompt }] });
          const clean = data.content[0].text.replace(/```json|```/g, "").trim();
          const meals = JSON.parse(clean);
          meals.forEach(m => usedMeals.push(m.name));
          results.push({ day, meals });
        }

        setMealPlan({ type: "weekly", days: results });
      }
    } catch (err) {
      setError("Something went wrong generating your meal plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function swapMeal(mealType, currentName, day = null) {
    const newDismissed = [...dismissedMeals, currentName];
    setDismissedMeals(newDismissed);

    const isWeekly = planType === "weekly";

    const prompt = `Suggest ONE alternative ${mealType} meal using: ${allItems.join(", ")}.
Daily calorie goal: ${calories}. Do NOT suggest: ${newDismissed.join(", ")}.
Include a realistic serving size.
Respond ONLY with JSON (no markdown): {"name":"Meal name","description":"Brief description","calories":400,"servingSize":"1 bowl"}`;

    try {
      if (!isWeekly) {
        setMealPlan(prev => ({
          ...prev,
          meals: prev.meals.map(m => m.type === mealType ? { ...m, swapping: true } : m)
        }));
      } else {
        setMealPlan(prev => ({
          ...prev,
          days: prev.days.map(d => d.day === day
            ? { ...d, meals: d.meals.map(m => m.type === mealType ? { ...m, swapping: true } : m) }
            : d)
        }));
      }

      const data = await callClaude({ model: "claude-sonnet-4-6", max_tokens: 300, messages: [{ role: "user", content: prompt }] });
      const clean = data.content[0].text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const newMeal = {
        type: mealType,
        name: parsed.name,
        description: parsed.description,
        calories: parsed.calories,
        servingSize: parsed.servingSize
      };

      if (!isWeekly) {
        setMealPlan(prev => ({
          ...prev,
          meals: prev.meals.map(m => m.type === mealType ? newMeal : m)
        }));
      } else {
        setMealPlan(prev => ({
          ...prev,
          days: prev.days.map(d => d.day === day
            ? { ...d, meals: d.meals.map(m => m.type === mealType ? newMeal : m) }
            : d)
        }));
      }
    } catch {
      if (!isWeekly) {
        setMealPlan(prev => ({
          ...prev,
          meals: prev.meals.map(m => m.type === mealType ? { ...m, swapping: false } : m)
        }));
      } else {
        setMealPlan(prev => ({
          ...prev,
          days: prev.days.map(d => d.day === day
            ? { ...d, meals: d.meals.map(m => m.type === mealType ? { ...m, swapping: false } : m) }
            : d)
        }));
      }
      setError("Couldn't swap that meal. Please try again.");
    }
  }

  async function getRecipe(meal) {
    const prompt = `Write a clear recipe for: "${meal.name}". Using: ${allItems.join(", ")}.
Respond ONLY with JSON (no markdown):
{"prepTime":"10 mins","cookTime":"20 mins","servings":"2 servings","ingredients":["ingredient 1"],"steps":["Do this first"]}
Keep steps concise. Do not number the steps.`;
    const data = await callClaude({ model: "claude-sonnet-4-6", max_tokens: 600, messages: [{ role: "user", content: prompt }] });
    const clean = data.content[0].text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  }

  const hasItems = allItems.length > 0;
  const hasCalories = calories !== "" && Number(calories) > 0;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <h1 className="app-title">Pantry <em>to</em> Plate</h1>
          <p className="app-tagline">Turn what you have into something delicious</p>
        </div>
      </header>

      <main className="app-main">

        <div className="how-it-works">
          <p className="how-it-works-text">
            Welcome to Pantry to Plate! Enter your daily calorie goal, add the ingredients you already have in your fridge, freezer, and pantry, and choose a daily or weekly meal plan. Click Generate and Pantry to Plate will create a personalized meal plan using the foods you already have on hand, helping you save money and reduce food waste. If you don't like a meal, simply click the refresh button next to it for a new suggestion. To view the full recipe, ingredients, nutrition information, and cooking instructions, click the 📋 icon. When you're ready to save your plan, click <strong style={{color: "var(--accent)"}}>Open All Recipes</strong> and then <strong style={{color: "var(--accent)"}}>Save as PDF</strong> to download your complete meal plan and recipe collection. 🍽️
          </p>
        </div>

        <div className="card">
          <h2 className="card-title"><span className="icon">🎯</span> Daily Calorie Goal</h2>
          <div className="calorie-row">
            <div className="calorie-input-wrap">
              <input
                type="number"
                value={calories}
                placeholder="e.g. 2000"
                onChange={e => setCalories(e.target.value)}
                min={500}
                max={5000}
                step={50}
              />
              <span className="calorie-unit">kcal / day</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title"><span className="icon">🧺</span> What's in your kitchen?</h2>
          <PantryInput pantryItems={pantryItems} setPantryItems={setPantryItems} />
        </div>

        <div className="card">
          <h2 className="card-title"><span className="icon">📅</span> Plan Type</h2>
          <div className="plan-toggle">
            <button
              className={`plan-toggle-btn ${planType === "daily" ? "active" : ""}`}
              onClick={() => { setPlanType("daily"); setMealPlan(null); }}
            >📋 Daily Plan</button>
            <button
              className={`plan-toggle-btn ${planType === "weekly" ? "active" : ""}`}
              onClick={() => { setPlanType("weekly"); setMealPlan(null); }}
            >📆 Weekly Plan</button>
          </div>
        </div>

        <div className="generate-section">
          <button
            className="btn btn-primary"
            onClick={generateMealPlan}
            disabled={!hasItems || !hasCalories || loading}
          >
            {loading
              ? planType === "weekly" ? "✨ Building your week…" : "✨ Planning your meals…"
              : planType === "weekly" ? "✨ Generate Weekly Plan" : "✨ Generate Meal Plan"}
          </button>
        </div>

        {error && <div className="error-banner">⚠️ {error}</div>}

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">
              {planType === "weekly"
                ? "Building 7 unique days of meals — this takes about 30 seconds…"
                : "Finding the perfect meals for your ingredients…"}
            </p>
          </div>
        )}

        {mealPlan && !loading && (
          <MealPlan
            plan={mealPlan}
            onSwap={swapMeal}
            onGetRecipe={getRecipe}
          />
        )}

        <div className="reset-section">
          {!showResetConfirm ? (
            <button className="btn-reset" onClick={() => setShowResetConfirm(true)}>
              🔄 Start Over
            </button>
          ) : (
            <div className="reset-confirm">
              <p className="reset-warning">⚠️ This will clear everything — all your ingredients, your meal plan, and your calorie goal. Are you sure?</p>
              <div className="reset-confirm-btns">
                <button className="btn-reset-confirm" onClick={handleReset}>Yes, start fresh</button>
                <button className="btn-reset-cancel" onClick={() => setShowResetConfirm(false)}>Never mind</button>
              </div>
            </div>
          )}
        </div>

      </main>

      <footer className="app-footer">
        <p>© 2026 Pantry to Plate. All rights reserved.</p>
      </footer>

    </div>
  );
}