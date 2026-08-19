import { Difficulty, GameMode, RoundMode } from './types.js';
export const CATEGORIES = [
    { id: 'animales', label: 'Animales', emoji: '🦁' },
    { id: 'objetos', label: 'Objetos', emoji: '🎸' },
    { id: 'comida', label: 'Comida', emoji: '🍕' },
    { id: 'profesiones', label: 'Profesiones', emoji: '👩‍🚀' },
    { id: 'lugares', label: 'Lugares', emoji: '🏝️' },
    { id: 'acciones', label: 'Acciones', emoji: '🏃' },
    { id: 'deportes', label: 'Deportes', emoji: '⚽' },
    { id: 'peliculas', label: 'Películas', emoji: '🎬', multiWord: true }
];
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
export function getCategoryMeta(id) {
    return CATEGORIES.find((c) => c.id === id);
}
export function getCategoryLabel(id) {
    if (!id)
        return 'General';
    return getCategoryMeta(id)?.label ?? id;
}
export const DIFFICULTIES = [
    {
        id: Difficulty.EASY,
        label: 'Fácil',
        emoji: '🟢',
        description: 'Palabras simples y muy conocidas',
        levels: [1],
        scoreMultiplier: 1
    },
    {
        id: Difficulty.MEDIUM,
        label: 'Medio',
        emoji: '🟡',
        description: 'Un poco más difíciles de dibujar',
        levels: [2, 1],
        scoreMultiplier: 1.25
    },
    {
        id: Difficulty.HARD,
        label: 'Difícil',
        emoji: '🔴',
        description: 'Conceptos abstractos y títulos largos',
        levels: [3, 2],
        scoreMultiplier: 1.5
    }
];
export function getDifficultyMeta(id) {
    return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[0];
}
export const TEAM_PRESETS = [
    { name: 'Rojos', color: '#FF3B30', emoji: '🔥' },
    { name: 'Azules', color: '#007AFF', emoji: '💧' },
    { name: 'Verdes', color: '#34C759', emoji: '🌿' },
    { name: 'Amarillos', color: '#FFCC00', emoji: '⚡' },
    { name: 'Violetas', color: '#AF52DE', emoji: '🔮' },
    { name: 'Naranjas', color: '#FF9500', emoji: '🍊' }
];
export const TEAM_LIMITS = {
    MIN_TEAMS: 2,
    MAX_TEAMS: 6,
    MIN_PER_TEAM: 1,
    MAX_PER_TEAM: 8
};
/** Intentos que tiene el equipo en su turno. 0 = ilimitados mientras dure el tiempo. */
export const ATTEMPTS_OPTIONS = [
    { value: 1, label: '1 intento', hint: 'Clásico: una sola chance' },
    { value: 3, label: '3 intentos', hint: 'Un poco más permisivo' },
    { value: 5, label: '5 intentos', hint: 'Para grupos grandes' },
    { value: 0, label: 'Sin límite', hint: 'Hasta que se acabe el tiempo' }
];
/** Probabilidad de que salga la carta "¡Juegan todos!" */
export const ALL_PLAY_OPTIONS = [
    { value: 0, label: 'Nunca', hint: 'Siempre por turnos' },
    { value: 15, label: 'Pocas veces', hint: '~1 de cada 7 rondas' },
    { value: 30, label: 'A veces', hint: '~1 de cada 3 rondas' },
    { value: 50, label: 'Seguido', hint: 'La mitad de las rondas' }
];
// ---------------------------------------------------------------------------
// Configuración por defecto
// ---------------------------------------------------------------------------
export const DEFAULT_GAME_SETTINGS = {
    totalRounds: 3,
    roundDuration: 60,
    maxPlayers: 8,
    categories: ['animales', 'objetos', 'comida'],
    difficulty: Difficulty.EASY,
    mode: GameMode.FREE_FOR_ALL,
    roundMode: RoundMode.TIME,
    teamCount: 2,
    maxPlayersPerTeam: 4,
    attemptsPerTurn: 1,
    allPlayEnabled: true,
    allPlayChance: 30
};
export const ROUND_DURATION_OPTIONS = [30, 60, 90, 120];
export const TOTAL_ROUNDS_OPTIONS = [2, 3, 5, 8];
export const MAX_PLAYERS_OPTIONS = [4, 8, 12, 16];
// ---------------------------------------------------------------------------
// Puntaje
// ---------------------------------------------------------------------------
export const SCORING_RULES = {
    FIRST_GUESS: 100,
    SECOND_GUESS: 75,
    THIRD_GUESS: 50,
    OTHER_GUESS: 35,
    DRAWER_BONUS_PER_GUESS: 35,
    /** Bonus extra según el tiempo que sobró */
    SPEED_BONUS_MAX: 20,
    /** Modo riesgo: acertar con un único intento vale más */
    RISK_CORRECT: 120,
    RISK_CLOSE: 30,
    /** Equipo que acierta en su turno */
    TEAM_CORRECT: 100,
    TEAM_FIRST_BONUS: 30,
    /** Premio por resolverla en el primer intento del turno */
    FIRST_ATTEMPT_BONUS: 25,
    /** Carta "¡Juegan todos!": solo cobra el primero que acierta, y paga más */
    ALL_PLAY_CORRECT: 150
};
/**
 * Tiempos del ciclo de partida. Todas las fases avanzan solas para que una TV
 * sin mouse ni teclado pueda completar una partida entera sin intervención.
 */
export const TIMINGS = {
    COUNTDOWN_SECONDS: 3,
    ROUND_RESULT_MS: 7000,
    SCOREBOARD_MS: 9000,
    DRAWER_DISCONNECT_GRACE_MS: 8000,
    GUESS_COOLDOWN_MS: 600,
    MAX_GUESSES_PER_ROUND: 40,
    /** Cada cuánto el cliente agrupa y envía los puntos del trazo */
    STROKE_FLUSH_MS: 55,
    /** Si no llega ningún estado en este lapso, el cliente pide resincronizar */
    SYNC_WATCHDOG_MS: 12000
};
// ---------------------------------------------------------------------------
// Paletas
// ---------------------------------------------------------------------------
export const PLAYER_COLORS = [
    '#FF3B30',
    '#FF9500',
    '#FFCC00',
    '#34C759',
    '#00C7BE',
    '#007AFF',
    '#5856D6',
    '#AF52DE',
    '#FF2D55',
    '#A2845E'
];
export const DRAWING_PALETTE = [
    '#000000',
    '#FFFFFF',
    '#E53935',
    '#FB8C00',
    '#FDD835',
    '#43A047',
    '#1E88E5',
    '#8E24AA',
    '#6D4C41',
    '#00ACC1',
    '#D81B60'
];
// ---------------------------------------------------------------------------
// Banco de palabras
// Nivel 1 = fácil · 2 = medio · 3 = difícil
// ---------------------------------------------------------------------------
export const INITIAL_WORD_BANK = [
    // ---------------------------- ANIMALES ----------------------------
    { id: 'anim_1', text: 'Pingüino', category: 'animales', difficulty: 1, aliases: ['pinguino'] },
    { id: 'anim_2', text: 'Elefante', category: 'animales', difficulty: 1 },
    { id: 'anim_3', text: 'Jirafa', category: 'animales', difficulty: 1 },
    { id: 'anim_4', text: 'León', category: 'animales', difficulty: 1, aliases: ['leon'] },
    { id: 'anim_5', text: 'Tiburón', category: 'animales', difficulty: 1, aliases: ['tiburon'] },
    { id: 'anim_6', text: 'Mono', category: 'animales', difficulty: 1, aliases: ['chango', 'simio'] },
    { id: 'anim_7', text: 'Pulpo', category: 'animales', difficulty: 1 },
    { id: 'anim_8', text: 'Caballo', category: 'animales', difficulty: 1, aliases: ['potro'] },
    { id: 'anim_9', text: 'Cerdo', category: 'animales', difficulty: 1, aliases: ['chancho', 'puerco', 'cerdito'] },
    { id: 'anim_10', text: 'Serpiente', category: 'animales', difficulty: 1, aliases: ['vibora', 'culebra'] },
    { id: 'anim_11', text: 'Cocodrilo', category: 'animales', difficulty: 2, aliases: ['caiman', 'yacare'] },
    { id: 'anim_12', text: 'Murciélago', category: 'animales', difficulty: 2, aliases: ['murcielago'] },
    { id: 'anim_13', text: 'Canguro', category: 'animales', difficulty: 2 },
    { id: 'anim_14', text: 'Flamenco', category: 'animales', difficulty: 2 },
    { id: 'anim_15', text: 'Camello', category: 'animales', difficulty: 2, aliases: ['dromedario'] },
    { id: 'anim_16', text: 'Erizo', category: 'animales', difficulty: 2 },
    { id: 'anim_17', text: 'Pavo real', category: 'animales', difficulty: 2, aliases: ['pavoreal'] },
    { id: 'anim_18', text: 'Oso hormiguero', category: 'animales', difficulty: 3, aliases: ['hormiguero'] },
    { id: 'anim_19', text: 'Ornitorrinco', category: 'animales', difficulty: 3 },
    { id: 'anim_20', text: 'Camaleón', category: 'animales', difficulty: 3, aliases: ['camaleon'] },
    { id: 'anim_21', text: 'Mantis religiosa', category: 'animales', difficulty: 3, aliases: ['mantis'] },
    { id: 'anim_22', text: 'Perezoso', category: 'animales', difficulty: 3, aliases: ['oso perezoso'] },
    // ---------------------------- OBJETOS ----------------------------
    { id: 'obj_1', text: 'Guitarra', category: 'objetos', difficulty: 1 },
    { id: 'obj_2', text: 'Bicicleta', category: 'objetos', difficulty: 1, aliases: ['bici'] },
    { id: 'obj_3', text: 'Reloj', category: 'objetos', difficulty: 1 },
    { id: 'obj_4', text: 'Paraguas', category: 'objetos', difficulty: 1, aliases: ['sombrilla'] },
    { id: 'obj_5', text: 'Llave', category: 'objetos', difficulty: 1 },
    { id: 'obj_6', text: 'Tijeras', category: 'objetos', difficulty: 1, aliases: ['tijera'] },
    { id: 'obj_7', text: 'Mochila', category: 'objetos', difficulty: 1, aliases: ['morral'] },
    { id: 'obj_8', text: 'Corona', category: 'objetos', difficulty: 1 },
    { id: 'obj_9', text: 'Espejo', category: 'objetos', difficulty: 1 },
    { id: 'obj_10', text: 'Lámpara', category: 'objetos', difficulty: 1, aliases: ['lampara', 'velador'] },
    { id: 'obj_11', text: 'Telescopio', category: 'objetos', difficulty: 2 },
    { id: 'obj_12', text: 'Heladera', category: 'objetos', difficulty: 2, aliases: ['refrigerador', 'nevera'] },
    { id: 'obj_13', text: 'Micrófono', category: 'objetos', difficulty: 2, aliases: ['microfono'] },
    { id: 'obj_14', text: 'Monopatín', category: 'objetos', difficulty: 2, aliases: ['monopatin', 'patineta', 'skate'] },
    { id: 'obj_15', text: 'Extintor', category: 'objetos', difficulty: 2, aliases: ['matafuego', 'matafuegos'] },
    { id: 'obj_16', text: 'Brújula', category: 'objetos', difficulty: 2, aliases: ['brujula'] },
    { id: 'obj_17', text: 'Máquina de coser', category: 'objetos', difficulty: 3, aliases: ['maquina de coser'] },
    { id: 'obj_18', text: 'Reloj de arena', category: 'objetos', difficulty: 3, aliases: ['clepsidra'] },
    { id: 'obj_19', text: 'Caja fuerte', category: 'objetos', difficulty: 3, aliases: ['bobeda', 'caja de seguridad'] },
    { id: 'obj_20', text: 'Tocadiscos', category: 'objetos', difficulty: 3, aliases: ['bandeja', 'vinilo'] },
    { id: 'obj_21', text: 'Paracaídas', category: 'objetos', difficulty: 3, aliases: ['paracaidas'] },
    // ---------------------------- COMIDA ----------------------------
    { id: 'food_1', text: 'Pizza', category: 'comida', difficulty: 1 },
    { id: 'food_2', text: 'Hamburguesa', category: 'comida', difficulty: 1, aliases: ['burger'] },
    { id: 'food_3', text: 'Helado', category: 'comida', difficulty: 1, aliases: ['cucurucho'] },
    { id: 'food_4', text: 'Empanada', category: 'comida', difficulty: 1, aliases: ['empanadas'] },
    { id: 'food_5', text: 'Sandía', category: 'comida', difficulty: 1, aliases: ['sandia'] },
    { id: 'food_6', text: 'Banana', category: 'comida', difficulty: 1, aliases: ['platano'] },
    { id: 'food_7', text: 'Huevo frito', category: 'comida', difficulty: 1, aliases: ['huevo'] },
    { id: 'food_8', text: 'Papas fritas', category: 'comida', difficulty: 1, aliases: ['papas', 'fritas'] },
    { id: 'food_9', text: 'Torta', category: 'comida', difficulty: 1, aliases: ['pastel', 'tarta'] },
    { id: 'food_10', text: 'Sushi', category: 'comida', difficulty: 2 },
    { id: 'food_11', text: 'Mate', category: 'comida', difficulty: 2, aliases: ['un mate', 'yerba mate'] },
    { id: 'food_12', text: 'Pochoclos', category: 'comida', difficulty: 2, aliases: ['palomitas', 'pororo', 'pochoclo'] },
    { id: 'food_13', text: 'Aguacate', category: 'comida', difficulty: 2, aliases: ['palta'] },
    { id: 'food_14', text: 'Milanesa', category: 'comida', difficulty: 2, aliases: ['milanesas', 'mila'] },
    { id: 'food_15', text: 'Alfajor', category: 'comida', difficulty: 2, aliases: ['alfajores'] },
    { id: 'food_16', text: 'Brochette', category: 'comida', difficulty: 3, aliases: ['brocheta', 'pincho'] },
    { id: 'food_17', text: 'Fondue de queso', category: 'comida', difficulty: 3, aliases: ['fondue'] },
    { id: 'food_18', text: 'Ensalada de frutas', category: 'comida', difficulty: 3, aliases: ['macedonia'] },
    { id: 'food_19', text: 'Locro', category: 'comida', difficulty: 3 },
    // ---------------------------- PROFESIONES ----------------------------
    { id: 'prof_1', text: 'Astronauta', category: 'profesiones', difficulty: 1 },
    { id: 'prof_2', text: 'Bombero', category: 'profesiones', difficulty: 1, aliases: ['bombera'] },
    { id: 'prof_3', text: 'Médico', category: 'profesiones', difficulty: 1, aliases: ['medico', 'doctor', 'doctora'] },
    { id: 'prof_4', text: 'Cocinero', category: 'profesiones', difficulty: 1, aliases: ['chef', 'cocinera'] },
    { id: 'prof_5', text: 'Policía', category: 'profesiones', difficulty: 1, aliases: ['policia'] },
    { id: 'prof_6', text: 'Pirata', category: 'profesiones', difficulty: 1 },
    { id: 'prof_7', text: 'Mago', category: 'profesiones', difficulty: 1, aliases: ['ilusionista'] },
    { id: 'prof_8', text: 'Pintor', category: 'profesiones', difficulty: 2, aliases: ['artista'] },
    { id: 'prof_9', text: 'Detective', category: 'profesiones', difficulty: 2, aliases: ['investigador'] },
    { id: 'prof_10', text: 'Piloto', category: 'profesiones', difficulty: 2, aliases: ['aviador'] },
    { id: 'prof_11', text: 'Jardinero', category: 'profesiones', difficulty: 2, aliases: ['jardinera'] },
    { id: 'prof_12', text: 'Peluquero', category: 'profesiones', difficulty: 2, aliases: ['peluquera', 'estilista'] },
    { id: 'prof_13', text: 'Arqueólogo', category: 'profesiones', difficulty: 3, aliases: ['arqueologo'] },
    { id: 'prof_14', text: 'Domador de leones', category: 'profesiones', difficulty: 3, aliases: ['domador'] },
    { id: 'prof_15', text: 'Malabarista', category: 'profesiones', difficulty: 3 },
    { id: 'prof_16', text: 'Director de orquesta', category: 'profesiones', difficulty: 3, aliases: ['director'] },
    // ---------------------------- LUGARES ----------------------------
    { id: 'place_1', text: 'Playa', category: 'lugares', difficulty: 1, aliases: ['costa'] },
    { id: 'place_2', text: 'Castillo', category: 'lugares', difficulty: 1, aliases: ['palacio'] },
    { id: 'place_3', text: 'Volcán', category: 'lugares', difficulty: 1, aliases: ['volcan'] },
    { id: 'place_4', text: 'Hospital', category: 'lugares', difficulty: 1, aliases: ['clinica'] },
    { id: 'place_5', text: 'Cine', category: 'lugares', difficulty: 1 },
    { id: 'place_6', text: 'Pirámide', category: 'lugares', difficulty: 2, aliases: ['piramide', 'piramides'] },
    { id: 'place_7', text: 'Isla desierta', category: 'lugares', difficulty: 2, aliases: ['isla'] },
    { id: 'place_8', text: 'Faro', category: 'lugares', difficulty: 2 },
    { id: 'place_9', text: 'Cancha de fútbol', category: 'lugares', difficulty: 2, aliases: ['cancha', 'estadio'] },
    { id: 'place_10', text: 'Parque de diversiones', category: 'lugares', difficulty: 3, aliases: ['parque de atracciones', 'montaña rusa'] },
    { id: 'place_11', text: 'Estación espacial', category: 'lugares', difficulty: 3, aliases: ['estacion espacial'] },
    { id: 'place_12', text: 'Cataratas del Iguazú', category: 'lugares', difficulty: 3, aliases: ['cataratas', 'cataratas del iguazu', 'iguazu'] },
    { id: 'place_13', text: 'Laberinto', category: 'lugares', difficulty: 3 },
    // ---------------------------- ACCIONES ----------------------------
    { id: 'act_1', text: 'Bailar', category: 'acciones', difficulty: 1, aliases: ['bailando', 'baile'] },
    { id: 'act_2', text: 'Nadar', category: 'acciones', difficulty: 1, aliases: ['nadando', 'natacion'] },
    { id: 'act_3', text: 'Dormir', category: 'acciones', difficulty: 1, aliases: ['durmiendo'] },
    { id: 'act_4', text: 'Cantar', category: 'acciones', difficulty: 1, aliases: ['cantando'] },
    { id: 'act_5', text: 'Cocinar', category: 'acciones', difficulty: 1, aliases: ['cocinando'] },
    { id: 'act_6', text: 'Pescar', category: 'acciones', difficulty: 2, aliases: ['pescando', 'pesca'] },
    { id: 'act_7', text: 'Esquiar', category: 'acciones', difficulty: 2, aliases: ['esquiando', 'ski'] },
    { id: 'act_8', text: 'Estornudar', category: 'acciones', difficulty: 2, aliases: ['estornudo'] },
    { id: 'act_9', text: 'Escalar', category: 'acciones', difficulty: 2, aliases: ['escalando', 'escalada'] },
    { id: 'act_10', text: 'Mudarse de casa', category: 'acciones', difficulty: 3, aliases: ['mudanza', 'mudarse'] },
    { id: 'act_11', text: 'Sacar una foto', category: 'acciones', difficulty: 3, aliases: ['sacar foto', 'fotografiar'] },
    { id: 'act_12', text: 'Perder el colectivo', category: 'acciones', difficulty: 3, aliases: ['perder el bus', 'perder el micro'] },
    { id: 'act_13', text: 'Hacer equilibrio', category: 'acciones', difficulty: 3, aliases: ['equilibrio'] },
    // ---------------------------- DEPORTES ----------------------------
    { id: 'sport_1', text: 'Fútbol', category: 'deportes', difficulty: 1, aliases: ['futbol'] },
    { id: 'sport_2', text: 'Tenis', category: 'deportes', difficulty: 1 },
    { id: 'sport_3', text: 'Básquet', category: 'deportes', difficulty: 1, aliases: ['basquet', 'baloncesto'] },
    { id: 'sport_4', text: 'Boxeo', category: 'deportes', difficulty: 1 },
    { id: 'sport_5', text: 'Surf', category: 'deportes', difficulty: 2 },
    { id: 'sport_6', text: 'Golf', category: 'deportes', difficulty: 2 },
    { id: 'sport_7', text: 'Vóley', category: 'deportes', difficulty: 2, aliases: ['voley', 'voleibol'] },
    { id: 'sport_8', text: 'Patinaje sobre hielo', category: 'deportes', difficulty: 3, aliases: ['patinaje'] },
    { id: 'sport_9', text: 'Salto con garrocha', category: 'deportes', difficulty: 3, aliases: ['garrocha', 'salto con pertiga'] },
    { id: 'sport_10', text: 'Esgrima', category: 'deportes', difficulty: 3 },
    { id: 'sport_11', text: 'Hockey sobre césped', category: 'deportes', difficulty: 3, aliases: ['hockey', 'hockey sobre cesped'] },
    // ---------------------------- PELÍCULAS (multi-palabra) ----------------------------
    { id: 'movie_1', text: 'Titanic', category: 'peliculas', difficulty: 1 },
    { id: 'movie_2', text: 'Shrek', category: 'peliculas', difficulty: 1 },
    { id: 'movie_3', text: 'Frozen', category: 'peliculas', difficulty: 1 },
    { id: 'movie_4', text: 'Batman', category: 'peliculas', difficulty: 1 },
    { id: 'movie_5', text: 'Toy Story', category: 'peliculas', difficulty: 1 },
    { id: 'movie_6', text: 'El Rey León', category: 'peliculas', difficulty: 1, aliases: ['el rey leon', 'rey leon'] },
    { id: 'movie_7', text: 'Buscando a Nemo', category: 'peliculas', difficulty: 2, aliases: ['nemo'] },
    { id: 'movie_8', text: 'Volver al Futuro', category: 'peliculas', difficulty: 2, aliases: ['back to the future'] },
    { id: 'movie_9', text: 'La Guerra de las Galaxias', category: 'peliculas', difficulty: 2, aliases: ['star wars', 'guerra de las galaxias'] },
    { id: 'movie_10', text: 'Jurassic Park', category: 'peliculas', difficulty: 2, aliases: ['parque jurasico'] },
    { id: 'movie_11', text: 'Los Cazafantasmas', category: 'peliculas', difficulty: 2, aliases: ['cazafantasmas', 'ghostbusters'] },
    { id: 'movie_12', text: 'El Señor de los Anillos', category: 'peliculas', difficulty: 2, aliases: ['el senor de los anillos', 'senor de los anillos', 'lord of the rings'] },
    { id: 'movie_13', text: 'Piratas del Caribe', category: 'peliculas', difficulty: 2, aliases: ['piratas'] },
    { id: 'movie_14', text: 'El Planeta de los Simios', category: 'peliculas', difficulty: 3, aliases: ['planeta de los simios'] },
    { id: 'movie_15', text: 'La Naranja Mecánica', category: 'peliculas', difficulty: 3, aliases: ['la naranja mecanica', 'naranja mecanica'] },
    { id: 'movie_16', text: 'El Día de la Marmota', category: 'peliculas', difficulty: 3, aliases: ['hechizo del tiempo', 'el dia de la marmota', 'groundhog day'] },
    { id: 'movie_17', text: 'Viaje al Centro de la Tierra', category: 'peliculas', difficulty: 3, aliases: ['viaje al centro de la tierra'] },
    { id: 'movie_18', text: 'El Silencio de los Inocentes', category: 'peliculas', difficulty: 3, aliases: ['el silencio de los corderos', 'silencio de los inocentes'] },
    { id: 'movie_19', text: 'Un Viaje al Fondo del Mar', category: 'peliculas', difficulty: 3, aliases: ['viaje al fondo del mar'] }
];
