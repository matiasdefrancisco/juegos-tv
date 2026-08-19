import React from 'react';
import {
  ALL_PLAY_OPTIONS,
  ATTEMPTS_OPTIONS,
  CATEGORIES,
  Difficulty,
  DIFFICULTIES,
  GameMode,
  GameSettings,
  MAX_PLAYERS_OPTIONS,
  ROUND_DURATION_OPTIONS,
  RoundMode,
  TEAM_LIMITS,
  TOTAL_ROUNDS_OPTIONS
} from '@party-draw/shared';
import { AlertCircle, Clock, Flame, Layers, Sparkles, Users } from 'lucide-react';
import { NumberStepper, OptionGroup } from './OptionGroup';

interface GameSetupPanelProps {
  settings: GameSettings;
  onChange: (patch: Partial<GameSettings>) => void;
  disabled?: boolean;
}

/**
 * Configuración completa de la partida.
 * Se usa dentro de un modal con scroll, así que puede crecer sin romper nada.
 */
export const GameSetupPanel: React.FC<GameSetupPanelProps> = ({
  settings,
  onChange,
  disabled = false
}) => {
  const isTeamMode = settings.mode === GameMode.TEAMS;
  const noCategories = settings.categories.length === 0;

  /** Alterna una categoría sin permitir dejar la lista vacía */
  const toggleCategory = (categoryId: string) => {
    const active = settings.categories.includes(categoryId);
    if (active && settings.categories.length === 1) return;

    onChange({
      categories: active
        ? settings.categories.filter((c) => c !== categoryId)
        : [...settings.categories, categoryId]
    });
  };

  return (
    <div className="space-y-7">
      {/* ---------------- Categorías ---------------- */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-pink-400 flex-shrink-0" />
          <h3 className="font-game font-bold text-white text-lg">Categorías</h3>
          <span className="text-xs text-slate-500 ml-auto">
            {settings.categories.length} seleccionada{settings.categories.length === 1 ? '' : 's'}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Las palabras salen siempre de las categorías elegidas. Podés marcar varias.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CATEGORIES.map((category) => {
            const active = settings.categories.includes(category.id);
            const isLastOne = active && settings.categories.length === 1;

            return (
              <button
                key={category.id}
                type="button"
                disabled={disabled || isLastOne}
                onClick={() => toggleCategory(category.id)}
                aria-pressed={active}
                title={isLastOne ? 'Tiene que quedar al menos una categoría' : undefined}
                className={`px-3 py-2.5 rounded-xl border text-sm font-bold transition-all text-left disabled:cursor-not-allowed ${
                  active
                    ? 'bg-pink-600 border-pink-400 text-white shadow-lg'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                } ${isLastOne ? 'opacity-90' : ''}`}
              >
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true">{category.emoji}</span>
                  <span className="truncate">{category.label}</span>
                </span>
                {category.multiWord && (
                  <span
                    className={`block text-[10px] font-medium mt-0.5 ${
                      active ? 'text-white/75' : 'text-slate-500'
                    }`}
                  >
                    Respuestas de varias palabras
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {noCategories && (
          <p className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            Elegí al menos una categoría para poder jugar.
          </p>
        )}
      </section>

      {/* ---------------- Dificultad ---------------- */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-amber-400 flex-shrink-0" />
          <h3 className="font-game font-bold text-white text-lg">Dificultad</h3>
        </div>

        <OptionGroup<Difficulty>
          options={DIFFICULTIES.map((d) => ({
            value: d.id,
            label: d.label,
            emoji: d.emoji,
            hint: d.description
          }))}
          value={settings.difficulty}
          onChange={(difficulty) => onChange({ difficulty })}
          columns={3}
          accent="amber"
          disabled={disabled}
        />
      </section>

      {/* ---------------- Modalidad ---------------- */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-indigo-400 flex-shrink-0" />
          <h3 className="font-game font-bold text-white text-lg">Modalidad</h3>
        </div>

        <OptionGroup<GameMode>
          options={[
            {
              value: GameMode.FREE_FOR_ALL,
              label: 'Todos contra todos',
              emoji: '🙋',
              hint: 'Cada jugador suma para sí'
            },
            {
              value: GameMode.TEAMS,
              label: 'Equipos',
              emoji: '🤝',
              hint: 'El puntaje es del equipo'
            }
          ]}
          value={settings.mode}
          onChange={(mode) => onChange({ mode })}
          columns={2}
          disabled={disabled}
        />

        {isTeamMode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
            <NumberStepper
              label="Cantidad de equipos"
              value={settings.teamCount}
              min={TEAM_LIMITS.MIN_TEAMS}
              max={TEAM_LIMITS.MAX_TEAMS}
              onChange={(teamCount) => onChange({ teamCount })}
              disabled={disabled}
              hint={`Entre ${TEAM_LIMITS.MIN_TEAMS} y ${TEAM_LIMITS.MAX_TEAMS} equipos`}
            />

            <NumberStepper
              label="Jugadores por equipo"
              value={settings.maxPlayersPerTeam}
              min={TEAM_LIMITS.MIN_PER_TEAM}
              max={TEAM_LIMITS.MAX_PER_TEAM}
              onChange={(maxPlayersPerTeam) => onChange({ maxPlayersPerTeam })}
              disabled={disabled}
              hint={`Hasta ${settings.teamCount * settings.maxPlayersPerTeam} jugadores en total`}
            />
          </div>
        )}
      </section>

      {/* ---------------- Cierre de ronda ---------------- */}
      {isTeamMode ? (
        <>
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-emerald-400 flex-shrink-0" />
              <h3 className="font-game font-bold text-white text-lg">Intentos por turno</h3>
            </div>

            <OptionGroup<number>
              options={ATTEMPTS_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
                hint: o.hint
              }))}
              value={settings.attemptsPerTurn}
              onChange={(attemptsPerTurn) => onChange({ attemptsPerTurn })}
              columns={4}
              accent="emerald"
              disabled={disabled}
            />

            <p className="text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 leading-relaxed">
              Se juega <strong>por turnos</strong>, como el Pictionary clásico: dibuja alguien de un
              equipo y <strong>solo ese equipo adivina</strong>, mientras el resto observa. Si
              aciertan dentro del tiempo y de los intentos, suman. Después el turno pasa al
              siguiente equipo.
            </p>
          </section>

          {/* ---------------- Carta especial ---------------- */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400 flex-shrink-0" />
              <h3 className="font-game font-bold text-white text-lg">Carta "¡Juegan todos!"</h3>
            </div>

            <OptionGroup<number>
              options={ALL_PLAY_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
                hint: o.hint
              }))}
              value={settings.allPlayEnabled ? settings.allPlayChance : 0}
              onChange={(allPlayChance) =>
                onChange({ allPlayChance, allPlayEnabled: allPlayChance > 0 })
              }
              columns={4}
              accent="amber"
              disabled={disabled}
            />

            <p className="text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 leading-relaxed">
              De vez en cuando la ronda sale abierta: dibuja uno solo pero{' '}
              <strong>adivinan todos los equipos</strong>, y el primero que acierta se lleva los
              puntos. Nunca sale dos rondas seguidas.
            </p>
          </section>
        </>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-emerald-400 flex-shrink-0" />
            <h3 className="font-game font-bold text-white text-lg">Cómo termina la ronda</h3>
          </div>

          <OptionGroup<RoundMode>
            options={[
              {
                value: RoundMode.TIME,
                label: 'Por tiempo',
                emoji: '⏱️',
                hint: 'Intentos libres hasta que se acabe el reloj'
              },
              {
                value: RoundMode.RISK,
                label: 'Por riesgo',
                emoji: '🎲',
                hint: 'Un solo intento, se revela al final'
              }
            ]}
            value={settings.roundMode}
            onChange={(roundMode) => onChange({ roundMode })}
            columns={2}
            accent="emerald"
            disabled={disabled}
          />

          <p className="text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 leading-relaxed">
            {settings.roundMode === RoundMode.RISK ? (
              <>
                Cada jugador arriesga <strong>una sola respuesta</strong>. La ronda cierra cuando
                todos arriesgaron, y recién ahí se revelan los aciertos. El reloj sigue corriendo
                como límite máximo.
              </>
            ) : (
              <>
                Se puede intentar las veces que haga falta. La ronda cierra cuando aciertan todos o
                cuando se termina el tiempo, lo que pase primero.
              </>
            )}
          </p>
        </section>
      )}

      {/* ---------------- Partida ---------------- */}
      <section className="space-y-4">
        <h3 className="font-game font-bold text-white text-lg">Partida</h3>

        <OptionGroup<number>
          label="Rondas"
          options={TOTAL_ROUNDS_OPTIONS.map((r) => ({
            value: r,
            label: `${r} rondas`
          }))}
          value={settings.totalRounds}
          onChange={(totalRounds) => onChange({ totalRounds })}
          columns={4}
          disabled={disabled}
        />
        <p className="text-[11px] text-slate-500 -mt-1">
          Una ronda es una vuelta completa: dibujan todos los jugadores.
        </p>

        <OptionGroup<number>
          label="Tiempo por turno"
          options={ROUND_DURATION_OPTIONS.map((d) => ({ value: d, label: `${d}s` }))}
          value={settings.roundDuration}
          onChange={(roundDuration) => onChange({ roundDuration })}
          columns={4}
          accent="pink"
          disabled={disabled}
        />

        {!isTeamMode && (
          <OptionGroup<number>
            label="Máximo de jugadores"
            options={MAX_PLAYERS_OPTIONS.map((m) => ({ value: m, label: `Hasta ${m}` }))}
            value={settings.maxPlayers}
            onChange={(maxPlayers) => onChange({ maxPlayers })}
            columns={4}
            accent="emerald"
            disabled={disabled}
          />
        )}
      </section>
    </div>
  );
};
