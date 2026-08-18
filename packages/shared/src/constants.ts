import { GameSettings, Word } from './types.js';

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  totalRounds: 3,
  roundDuration: 60, // seconds
  maxPlayers: 8,
  categories: ['animales', 'objetos', 'comida', 'profesiones', 'lugares', 'acciones', 'deportes']
};

export const SCORING_RULES = {
  FIRST_GUESS: 100,
  SECOND_GUESS: 75,
  THIRD_GUESS: 50,
  OTHER_GUESS: 35,
  DRAWER_BONUS_PER_GUESS: 35,
  SPEED_BONUS_MAX: 20 // Extra bonus based on remaining time percentage
};

export const PLAYER_COLORS = [
  '#FF3B30', // Vibrant Red
  '#FF9500', // Energetic Orange
  '#FFCC00', // Yellow
  '#34C759', // Green
  '#00C7BE', // Teal
  '#007AFF', // Vibrant Blue
  '#5856D6', // Indigo
  '#AF52DE', // Purple
  '#FF2D55', // Pink
  '#A2845E'  // Brown/Gold
];

export const DRAWING_PALETTE = [
  '#000000', // Black
  '#FFFFFF', // White
  '#E53935', // Red
  '#FB8C00', // Orange
  '#FDD835', // Yellow
  '#43A047', // Green
  '#1E88E5', // Blue
  '#8E24AA', // Purple
  '#6D4C41', // Brown
  '#00ACC1', // Cyan
  '#D81B60'  // Pink
];

export const INITIAL_WORD_BANK: Word[] = [
  // Animales
  { id: 'anim_1', text: 'Pingüino', category: 'animales', difficulty: 1, aliases: ['pinguino', 'penguin'] },
  { id: 'anim_2', text: 'Elefante', category: 'animales', difficulty: 1, aliases: ['elephant'] },
  { id: 'anim_3', text: 'Jirafa', category: 'animales', difficulty: 1, aliases: ['giraffe'] },
  { id: 'anim_4', text: 'León', category: 'animales', difficulty: 1, aliases: ['leon', 'lion'] },
  { id: 'anim_5', text: 'Tiburón', category: 'animales', difficulty: 1, aliases: ['tiburon', 'shark'] },
  { id: 'anim_6', text: 'Mono', category: 'animales', difficulty: 1, aliases: ['chango', 'simio', 'gorila', 'monkey'] },
  { id: 'anim_7', text: 'Delfín', category: 'animales', difficulty: 1, aliases: ['delfin', 'dolphin'] },
  { id: 'anim_8', text: 'Cocodrilo', category: 'animales', difficulty: 2, aliases: ['caiman', 'alligator', 'crocodile'] },
  { id: 'anim_9', text: 'Canguro', category: 'animales', difficulty: 1, aliases: ['kangaroo'] },
  { id: 'anim_10', text: 'Murciélago', category: 'animales', difficulty: 2, aliases: ['murcielago', 'bat'] },
  { id: 'anim_11', text: 'Pulpo', category: 'animales', difficulty: 1, aliases: ['octopus'] },
  { id: 'anim_12', text: 'Serpiente', category: 'animales', difficulty: 1, aliases: ['vibora', 'culebra', 'snake'] },
  { id: 'anim_13', text: 'Flamenco', category: 'animales', difficulty: 2, aliases: ['flamingo'] },
  { id: 'anim_14', text: 'Koala', category: 'animales', difficulty: 1 },
  { id: 'anim_15', text: 'Búho', category: 'animales', difficulty: 1, aliases: ['buho', 'lechuza', 'owl'] },
  { id: 'anim_16', text: 'Camello', category: 'animales', difficulty: 2, aliases: ['dromedario'] },
  { id: 'anim_17', text: 'Caballo', category: 'animales', difficulty: 1, aliases: ['horse', 'potro'] },
  { id: 'anim_18', text: 'Cerdito', category: 'animales', difficulty: 1, aliases: ['chancho', 'cerdo', 'puerco', 'pig'] },

  // Objetos
  { id: 'obj_1', text: 'Guitarra', category: 'objetos', difficulty: 1, aliases: ['guitar'] },
  { id: 'obj_2', text: 'Bicicleta', category: 'objetos', difficulty: 1, aliases: ['bici', 'bike', 'bicycle'] },
  { id: 'obj_3', text: 'Reloj', category: 'objetos', difficulty: 1, aliases: ['clock', 'watch'] },
  { id: 'obj_4', text: 'Telescopio', category: 'objetos', difficulty: 2, aliases: ['telescope'] },
  { id: 'obj_5', text: 'Paraguas', category: 'objetos', difficulty: 1, aliases: ['sombrilla', 'umbrella'] },
  { id: 'obj_6', text: 'Cámara', category: 'objetos', difficulty: 1, aliases: ['camara', 'camera', 'camara de fotos'] },
  { id: 'obj_7', text: 'Lámpara', category: 'objetos', difficulty: 1, aliases: ['lampara', 'lamp', 'velador'] },
  { id: 'obj_8', text: 'Auriculares', category: 'objetos', difficulty: 1, aliases: ['auris', 'audifonos', 'headphones', 'auricular'] },
  { id: 'obj_9', text: 'Heladera', category: 'objetos', difficulty: 1, aliases: ['refrigerador', 'refrigeradora', 'nevera', 'fridge'] },
  { id: 'obj_10', text: 'Micrófono', category: 'objetos', difficulty: 1, aliases: ['microfono', 'mic'] },
  { id: 'obj_11', text: 'Mochila', category: 'objetos', difficulty: 1, aliases: ['backpack', 'morral'] },
  { id: 'obj_12', text: 'Monopatín', category: 'objetos', difficulty: 2, aliases: ['monopatin', 'skate', 'patineta', 'scooter'] },
  { id: 'obj_13', text: 'Tijeras', category: 'objetos', difficulty: 1, aliases: ['tijera', 'scissors'] },
  { id: 'obj_14', text: 'Espejo', category: 'objetos', difficulty: 1, aliases: ['mirror'] },
  { id: 'obj_15', text: 'Corona', category: 'objetos', difficulty: 1, aliases: ['crown'] },
  { id: 'obj_16', text: 'Llave', category: 'objetos', difficulty: 1, aliases: ['key'] },
  { id: 'obj_17', text: 'Extintor', category: 'objetos', difficulty: 2, aliases: ['matafuego', 'matafuegos'] },

  // Comida
  { id: 'food_1', text: 'Pizza', category: 'comida', difficulty: 1 },
  { id: 'food_2', text: 'Hamburguesa', category: 'comida', difficulty: 1, aliases: ['burger', 'hamburguer'] },
  { id: 'food_3', text: 'Sushi', category: 'comida', difficulty: 1 },
  { id: 'food_4', text: 'Helado', category: 'comida', difficulty: 1, aliases: ['ice cream', 'cono de helado', 'cucurucho'] },
  { id: 'food_5', text: 'Empanada', category: 'comida', difficulty: 1, aliases: ['empanadas'] },
  { id: 'food_6', text: 'Sandía', category: 'comida', difficulty: 1, aliases: ['sandia', 'watermelon'] },
  { id: 'food_7', text: 'Taco', category: 'comida', difficulty: 1, aliases: ['tacos'] },
  { id: 'food_8', text: 'Chocolate', category: 'comida', difficulty: 1, aliases: ['barra de chocolate'] },
  { id: 'food_9', text: 'Huevo frito', category: 'comida', difficulty: 1, aliases: ['huevo'] },
  { id: 'food_10', text: 'Papas fritas', category: 'comida', difficulty: 1, aliases: ['papas', 'fritas', 'fries'] },
  { id: 'food_11', text: 'Torta', category: 'comida', difficulty: 1, aliases: ['pastel', 'cake', 'tarta de cumpleaños'] },
  { id: 'food_12', text: 'Mate', category: 'comida', difficulty: 1, aliases: ['un mate', 'yerba mate'] },
  { id: 'food_13', text: 'Pochoclos', category: 'comida', difficulty: 1, aliases: ['palomitas', 'popcorn', 'pororo', 'pochoclo'] },
  { id: 'food_14', text: 'Aguacate', category: 'comida', difficulty: 1, aliases: ['palta', 'avocado'] },

  // Profesiones
  { id: 'prof_1', text: 'Astronauta', category: 'profesiones', difficulty: 1, aliases: ['astronaut'] },
  { id: 'prof_2', text: 'Bombero', category: 'profesiones', difficulty: 1, aliases: ['bombera', 'firefighter'] },
  { id: 'prof_3', text: 'Médico', category: 'profesiones', difficulty: 1, aliases: ['medico', 'doctor', 'doctora', 'medica'] },
  { id: 'prof_4', text: 'Cocinero', category: 'profesiones', difficulty: 1, aliases: ['chef', 'cocinera'] },
  { id: 'prof_5', text: 'Policía', category: 'profesiones', difficulty: 1, aliases: ['policia', 'cop', 'police'] },
  { id: 'prof_6', text: 'Pintor', category: 'profesiones', difficulty: 1, aliases: ['artista', 'painter'] },
  { id: 'prof_7', text: 'Detective', category: 'profesiones', difficulty: 2, aliases: ['investigador'] },
  { id: 'prof_8', text: 'Piloto', category: 'profesiones', difficulty: 1, aliases: ['aviador'] },
  { id: 'prof_9', text: 'Mago', category: 'profesiones', difficulty: 1, aliases: ['ilusionista', 'magician'] },
  { id: 'prof_10', text: 'Pirata', category: 'profesiones', difficulty: 1, aliases: ['pirate'] },

  // Lugares
  { id: 'place_1', text: 'Playa', category: 'lugares', difficulty: 1, aliases: ['beach', 'costa'] },
  { id: 'place_2', text: 'Pirámide', category: 'lugares', difficulty: 1, aliases: ['piramide', 'pyramid', 'piramides'] },
  { id: 'place_3', text: 'Castillo', category: 'lugares', difficulty: 1, aliases: ['castle', 'palacio'] },
  { id: 'place_4', text: 'Volcán', category: 'lugares', difficulty: 1, aliases: ['volcan', 'volcano'] },
  { id: 'place_5', text: 'Isla desierta', category: 'lugares', difficulty: 2, aliases: ['isla', 'island'] },
  { id: 'place_6', text: 'Hospital', category: 'lugares', difficulty: 1, aliases: ['clinica'] },
  { id: 'place_7', text: 'Cine', category: 'lugares', difficulty: 1, aliases: ['cinema', 'sala de cine'] },
  { id: 'place_8', text: 'Faro', category: 'lugares', difficulty: 1, aliases: ['lighthouse'] },
  { id: 'place_9', text: 'Parque de atracciones', category: 'lugares', difficulty: 2, aliases: ['parque de diversiones', 'montaña rusa'] },

  // Acciones
  { id: 'act_1', text: 'Bailar', category: 'acciones', difficulty: 1, aliases: ['bailando', 'baile', 'dance'] },
  { id: 'act_2', text: 'Nadar', category: 'acciones', difficulty: 1, aliases: ['nadando', 'natacion', 'swim'] },
  { id: 'act_3', text: 'Dormir', category: 'acciones', difficulty: 1, aliases: ['durmiendo', 'roncar', 'sleep'] },
  { id: 'act_4', text: 'Pescar', category: 'acciones', difficulty: 1, aliases: ['pescando', 'pesca', 'fishing'] },
  { id: 'act_5', text: 'Cocinar', category: 'acciones', difficulty: 1, aliases: ['cocinando', 'cooking'] },
  { id: 'act_6', text: 'Esquiar', category: 'acciones', difficulty: 2, aliases: ['esquiando', 'ski'] },
  { id: 'act_7', text: 'Volar', category: 'acciones', difficulty: 1, aliases: ['volando', 'fly'] },
  { id: 'act_8', text: 'Cantar', category: 'acciones', difficulty: 1, aliases: ['cantando', 'sing'] },

  // Deportes
  { id: 'sport_1', text: 'Fútbol', category: 'deportes', difficulty: 1, aliases: ['futbol', 'soccer', 'football'] },
  { id: 'sport_2', text: 'Básquet', category: 'deportes', difficulty: 1, aliases: ['basquet', 'baloncesto', 'basketball'] },
  { id: 'sport_3', text: 'Tenis', category: 'deportes', difficulty: 1, aliases: ['tennis'] },
  { id: 'sport_4', text: 'Boxeo', category: 'deportes', difficulty: 1, aliases: ['boxing'] },
  { id: 'sport_5', text: 'Surf', category: 'deportes', difficulty: 1, aliases: ['surfing'] },
  { id: 'sport_6', text: 'Golf', category: 'deportes', difficulty: 1 }
];
