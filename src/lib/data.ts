export interface Ingredient {
  id: string;
  name: string;
  category: "base" | "protein" | "greens" | "topping";
  portion: string;
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  highlight?: string;
  image: string;
}

export interface PresetMeal {
  id: string;
  name: string;
  tagline: string;
  category: "Hipertrofia" | "Definição" | "Low Carb" | "Longevidade";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  price: number;
  image: string;
  description: string;
  badge: string;
}

export interface Review {
  id: string;
  author: string;
  role: string;
  avatar: string;
  rating: number;
  comment: string;
  verified: boolean;
  gain: string;
}

export const PRESET_MEALS: PresetMeal[] = [
  {
    id: "meal-1",
    name: "Salmon Power Bowl",
    tagline: "Ômega 3 & Alta Densidade Proteica",
    category: "Hipertrofia",
    calories: 560,
    protein: 42,
    carbs: 48,
    fat: 20,
    price: 46.9,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    description: "Salmão fresco grelhado, quinoa real, abacate, edamame crocante e molho ponzu fit.",
    badge: "Mais Pedido",
  },
  {
    id: "meal-2",
    name: "Steak & Sweet Potato",
    tagline: "Clássico Anabólico Puro Músculo",
    category: "Hipertrofia",
    calories: 620,
    protein: 52,
    carbs: 58,
    fat: 14,
    price: 42.5,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    description: "Mignon em tiras macias, batata doce assada no alecrim e brócolis ninja ao vapor.",
    badge: "52g Proteína",
  },
  {
    id: "meal-3",
    name: "Clean Chicken & Quinoa",
    tagline: "Déficit Calórico Sem Perder Massa",
    category: "Definição",
    calories: 410,
    protein: 45,
    carbs: 32,
    fat: 7,
    price: 34.9,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    description: "Peito de frango marinado em ervas finas, arroz negro aromático e aspargos verdes.",
    badge: "Low Fat",
  },
  {
    id: "meal-4",
    name: "Vegan Tofu Boost",
    tagline: "100% Plant-Based com Aminoácidos",
    category: "Longevidade",
    calories: 440,
    protein: 28,
    carbs: 44,
    fat: 15,
    price: 36.0,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    description: "Tofu grelhado com gergelim preto tostado, purê de mandioquinha e mix de sementes.",
    badge: "Vegano",
  },
];

export const INGREDIENTS: Ingredient[] = [
  // BASES
  {
    id: "b-1",
    name: "Arroz Negro com Ervas",
    category: "base",
    portion: "120g",
    price: 8.0,
    calories: 140,
    protein: 4,
    carbs: 30,
    fat: 1,
    highlight: "Antioxidante",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "b-2",
    name: "Batata Doce com Alecrim",
    category: "base",
    portion: "140g",
    price: 6.5,
    calories: 120,
    protein: 2,
    carbs: 28,
    fat: 0.5,
    highlight: "Baixo IG",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "b-3",
    name: "Quinoa Real em Grãos",
    category: "base",
    portion: "120g",
    price: 10.0,
    calories: 155,
    protein: 6,
    carbs: 27,
    fat: 3,
    highlight: "Superalimento",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "b-4",
    name: "Mix Low Carb (Couve-Flor)",
    category: "base",
    portion: "130g",
    price: 9.0,
    calories: 45,
    protein: 3,
    carbs: 7,
    fat: 0.5,
    highlight: "Keto Friendly",
    image: "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=400&q=80",
  },

  // PROTEÍNAS
  {
    id: "p-1",
    name: "Peito de Frango Grelhado",
    category: "protein",
    portion: "150g",
    price: 15.0,
    calories: 175,
    protein: 34,
    carbs: 0,
    fat: 3.5,
    highlight: "Pura Proteína",
    image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p-2",
    name: "Patinho Moído ao Sugo",
    category: "protein",
    portion: "150g",
    price: 18.0,
    calories: 210,
    protein: 35,
    carbs: 2,
    fat: 7.0,
    highlight: "Rico em Ferro",
    image: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p-3",
    name: "Filé de Salmão Fresco",
    category: "protein",
    portion: "140g",
    price: 27.0,
    calories: 245,
    protein: 29,
    carbs: 0,
    fat: 14.0,
    highlight: "Ômega 3 Puro",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p-4",
    name: "Tofu Orgânico Defumado",
    category: "protein",
    portion: "150g",
    price: 16.0,
    calories: 145,
    protein: 19,
    carbs: 3,
    fat: 6.5,
    highlight: "100% Vegano",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
  },

  // VEGETAIS & LEGUMES
  {
    id: "g-1",
    name: "Brócolis Ninja no Vapor",
    category: "greens",
    portion: "100g",
    price: 5.0,
    calories: 35,
    protein: 3,
    carbs: 6,
    fat: 0.5,
    highlight: "Fibra e Fitoquímicos",
    image: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "g-2",
    name: "Aspargos Grelhados",
    category: "greens",
    portion: "80g",
    price: 9.5,
    calories: 30,
    protein: 2.8,
    carbs: 4,
    fat: 0.3,
    highlight: "Diurético Natural",
    image: "https://images.unsplash.com/photo-1515471209610-dae1c92d8777?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "g-3",
    name: "Cenouras Baby Glaciadas",
    category: "greens",
    portion: "90g",
    price: 4.5,
    calories: 42,
    protein: 1,
    carbs: 9,
    fat: 0.4,
    highlight: "Beta-Caroteno",
    image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&q=80",
  },

  // TOPPINGS & MOLHOS
  {
    id: "t-1",
    name: "Pesto de Manjericão Fit",
    category: "topping",
    portion: "30g",
    price: 4.5,
    calories: 85,
    protein: 2,
    carbs: 1,
    fat: 8.5,
    highlight: "Gorduras Boas",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "t-2",
    name: "Mix Gergelim e Chia",
    category: "topping",
    portion: "20g",
    price: 3.5,
    calories: 60,
    protein: 3,
    carbs: 2,
    fat: 5.0,
    highlight: "Crocância e Minerais",
    image: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=400&q=80",
  },
];

export const REVIEWS: Review[] = [
  {
    id: "rev-1",
    author: "Matheus Silveira",
    role: "Atleta de Crossfit & Engenheiro",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    comment: "Os macros batem 100% com meu MyFitnessPal. Salmão crocante e sabor de restaurante 5 estrelas sem fugir da dieta.",
    verified: true,
    gain: "-4kg de gordura em 30 dias",
  },
  {
    id: "rev-2",
    author: "Juliana Mendes",
    role: "Nutricionista Esportiva",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    comment: "Indico para todos os meus pacientes que não têm tempo de cozinhar. Embalagem sem BPA e ingredientes de altíssima qualidade.",
    verified: true,
    gain: "12 clientes usando",
  },
  {
    id: "rev-3",
    author: "Rodrigo Costa",
    role: "Praticante de Musculação",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    comment: "O montador de marmitas é genial. Eu escolho 50g de proteína exatos e chega quentinho na porta da academia!",
    verified: true,
    gain: "+3kg de massa magra",
  },
];

export const GYM_HUBS = [
  {
    id: "hub-1",
    name: "Hub SmartFit Paulista",
    distance: "1.2 km",
    deliveryTime: "18-24 min",
    address: "Av. Paulista, 1200",
    lat: -23.5614,
    lng: -46.6559,
  },
  {
    id: "hub-2",
    name: "Hub Bodytech Jardins",
    distance: "2.4 km",
    deliveryTime: "25-32 min",
    address: "Rua Oscar Freire, 800",
    lat: -23.5658,
    lng: -46.6681,
  },
  {
    id: "hub-3",
    name: "Hub Bluefit Pinheiros",
    distance: "3.8 km",
    deliveryTime: "30-38 min",
    address: "Rua Teodoro Sampaio, 1400",
    lat: -23.5601,
    lng: -46.6854,
  },
];
