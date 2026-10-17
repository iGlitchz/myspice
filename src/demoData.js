// Curated local fixtures for the concept preview. Nutrition and costs are estimates.
const ingredient = (name, amount, unit, price) => ({ name, amount, unit, price });
export const RECIPES = [
  { id:'lemon-chicken', title:'Lemon & herb chicken', short:'Bright, simple, satisfying.', time:25, calories:520, cost:4.1, plant:false, allergens:[], color:'#d7bc6a', spices:'Garlic · oregano · black pepper', tools:'Skillet, saucepan, chopping board', ingredients:[ingredient('Chicken breast',300,'g',3.3),ingredient('Rice',140,'g',0.5),ingredient('Broccoli',200,'g',1),ingredient('Lemon',1,'',0.6),ingredient('Olive oil',2,'tbsp',0.4),ingredient('Garlic powder',1,'tsp',0.15),ingredient('Oregano',1,'tsp',0.15)], steps:['Cook the rice according to its packet instructions.','Season the chicken with garlic, oregano, and black pepper.','Heat the oil in a skillet. Cook the chicken until it reaches 165°F / 74°C at its thickest point.','Steam the broccoli. Serve with rice, lemon, and the chicken.'] },
  { id:'chickpea-bowl',title:'Smoky chickpea bowls',short:'Big flavor. One good bowl.',time:20,calories:490,cost:2.7,plant:true,allergens:[],color:'#b67138',spices:'Paprika · cumin · garlic',tools:'Skillet, saucepan, chopping board',ingredients:[ingredient('Chickpeas',400,'g',1.4),ingredient('Rice',140,'g',0.5),ingredient('Spinach',100,'g',1),ingredient('Lemon',1,'',0.6),ingredient('Olive oil',2,'tbsp',0.4),ingredient('Paprika',1,'tsp',0.15),ingredient('Cumin',1,'tsp',0.15)],steps:['Cook the rice according to its packet instructions.','Drain the chickpeas and pat dry.','Warm the oil in a skillet. Add the chickpeas, paprika, and cumin; cook until hot and lightly crisp.','Wilt the spinach in the skillet. Serve everything over rice with lemon.'] },
  { id:'tomato-pasta',title:'Roasted tomato pasta',short:'A weeknight classic, made yours.',time:30,calories:540,cost:2.9,plant:true,allergens:['Wheat'],color:'#aa4429',spices:'Basil · oregano · chilli',tools:'Saucepan, roasting tray, oven',ingredients:[ingredient('Pasta',180,'g',0.8),ingredient('Tomatoes',400,'g',1.9),ingredient('Spinach',100,'g',1),ingredient('Olive oil',2,'tbsp',0.4),ingredient('Basil',1,'tsp',0.15),ingredient('Chilli flakes',0.5,'tsp',0.1)],steps:['Heat the oven to 425°F / 220°C.','Toss the tomatoes with oil, basil, and chilli. Roast until softened.','Cook the pasta according to its packet instructions, reserving a little cooking water.','Toss the pasta, spinach, and tomatoes together. Loosen with the reserved water.'] },
  { id:'salmon-bowl',title:'Ginger salmon & greens',short:'Fresh greens, a little warmth.',time:25,calories:580,cost:5.8,plant:false,allergens:['Fish'],color:'#d28b65',spices:'Ginger · garlic · black pepper',tools:'Skillet, saucepan, chopping board',ingredients:[ingredient('Salmon',300,'g',6),ingredient('Rice',140,'g',0.5),ingredient('Broccoli',200,'g',1),ingredient('Lemon',1,'',0.6),ingredient('Olive oil',1,'tbsp',0.2),ingredient('Ground ginger',1,'tsp',0.15)],steps:['Cook the rice according to its packet instructions.','Season the salmon with ginger, garlic, and pepper.','Heat oil in a skillet. Cook the salmon until it reaches 145°F / 63°C at its thickest point.','Steam the broccoli and serve with rice, salmon, and lemon.'] },
  { id:'peanut-noodles',title:'Peanut & lime noodles',short:'A quick bowl with a little kick.',time:15,calories:560,cost:3.1,plant:true,allergens:['Peanuts','Wheat','Soy'],color:'#ba8648',spices:'Ginger · chilli · garlic',tools:'Saucepan, mixing bowl',ingredients:[ingredient('Wheat noodles',180,'g',1),ingredient('Peanut butter',3,'tbsp',0.7),ingredient('Soy sauce',2,'tbsp',0.3),ingredient('Carrots',150,'g',0.5),ingredient('Lime',1,'',0.6),ingredient('Ground ginger',1,'tsp',0.15)],steps:['Cook the noodles according to their packet instructions.','Mix peanut butter, soy sauce, lime juice, and ginger. Add warm water until pourable.','Shred the carrots.','Toss the noodles and carrots with the sauce. Finish with chilli to taste.'] },
  { id:'quick-chickpeas',title:'Lemony chickpea skillet',short:'Fifteen minutes, one pan.',time:15,calories:460,cost:2.5,plant:true,allergens:[],color:'#a3a558',spices:'Cumin · paprika · black pepper',tools:'Skillet, chopping board',ingredients:[ingredient('Chickpeas',400,'g',1.4),ingredient('Tomatoes',200,'g',0.95),ingredient('Spinach',100,'g',1),ingredient('Lemon',1,'',0.6),ingredient('Olive oil',1,'tbsp',0.2),ingredient('Cumin',1,'tsp',0.15),ingredient('Paprika',1,'tsp',0.15)],steps:['Drain and rinse the chickpeas. Chop the tomatoes.','Heat the oil in a skillet. Add chickpeas, tomatoes, and spices.','Cook until the tomatoes soften and the chickpeas are hot throughout.','Stir in spinach until wilted. Finish with lemon.'] },
];

export const DEFAULT_PREFS = { allergies:[], allergyAnswered:false, diet:'Everything', goal:'Save time', minutes:30, cooks:3, people:2, budget:'Balanced' };
export const ALLERGIES = ['None','Milk','Eggs','Wheat','Soy','Peanuts','Tree nuts','Sesame','Fish','Shellfish'];
export const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export function eligibleRecipes(prefs, ratings = {}, recipes = RECIPES) {
  return recipes.filter(recipe =>
    recipe.allergens.every(allergen => !prefs.allergies.includes(allergen)) &&
    (prefs.diet !== 'Plant-based' || recipe.plant) &&
    (prefs.goal !== 'Eat more plants' || recipe.plant) &&
    recipe.time <= prefs.minutes &&
    (prefs.budget !== 'Keep it low' || recipe.cost <= 3.2) &&
    ratings[recipe.id] !== 'skip'
  ).sort((a,b) => (ratings[b.id] === 'like' ? 1 : 0) - (ratings[a.id] === 'like' ? 1 : 0) || (prefs.goal === 'Spend less' ? a.cost-b.cost : prefs.goal === 'Save time' ? a.time-b.time : 0));
}

export function createPlan(prefs, ratings, recipes) {
  const eligible = eligibleRecipes(prefs, ratings, recipes);
  if (!eligible.length) return null;
  const cookDays = Array.from({length:prefs.cooks},(_,i) => Math.floor(i*7/prefs.cooks));
  let batch = -1;
  const plan = DAYS.map((day,i) => {
    if (cookDays.includes(i)) batch++;
    return { day, dinner:eligible[batch % eligible.length].id, cook:cookDays.includes(i), batch, lunch:i === 0 ? eligible[0].id : null };
  });
  plan.forEach((day,i) => { if (i>0) day.lunch = plan[i-1].dinner; });
  return plan;
}

export function groceriesFor(plan, prefs, recipes) {
  if (!plan) return [];
  const totals = new Map();
  plan.forEach(day => [day.lunch,day.dinner].forEach(id => {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;
    recipe.ingredients.forEach(item => {
      const key = item.name.toLowerCase()+'|'+item.unit;
      const existing = totals.get(key) || { ...item, amount:0, price:0, key };
      existing.amount += item.amount * prefs.people / 2;
      existing.price += item.price * prefs.people / 2;
      totals.set(key,existing);
    });
  }));
  // Simple breakfast recommendation is explicit and included in the list.
  totals.set('fruit', { key:'fruit',name:'Seasonal fruit',amount:7*prefs.people,unit:'portions',price:7*prefs.people*0.65 });
  return [...totals.values()];
}

export const quantity = n => Number(n.toFixed(1));
